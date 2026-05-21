import { useState, useEffect, useRef } from 'react'
import { api } from './api'

function parseTime(str) {
  if (!str) return 0
  const m = str.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return 0
  let h = +m[1], mn = +m[2]
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return h * 60 + mn
}
function fmtTime(total) {
  total = ((Math.round(total) % 1440) + 1440) % 1440
  const h24 = Math.floor(total / 60), mn = total % 60
  const p = h24 >= 12 ? 'PM' : 'AM'
  const h = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return `${h}:${mn.toString().padStart(2, '0')} ${p}`
}
function to24(str) {
  const t = parseTime(str)
  return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}
function from24(str) {
  if (!str) return ''
  const [h, m] = str.split(':').map(Number)
  return fmtTime(h * 60 + m)
}

const AREA_META = {
  '🏥': { label:'Health',    bg:'#fff0f0', color:'#c62828' },
  '🕉️': { label:'Spiritual', bg:'#fff0f5', color:'#7b0000' },
  '💼': { label:'Career',    bg:'#e8eaf6', color:'#1a237e' },
  '💰': { label:'Money',     bg:'#e0f2f1', color:'#00695c' },
  '❤️': { label:'Relation',  bg:'#fce4ec', color:'#880e4f' },
  '👨‍👩‍👧': { label:'Family',   bg:'#ede7f6', color:'#4a148c' },
  '⚡': { label:'Energy',    bg:'#fff3e0', color:'#e65100' },
  '🧠': { label:'Focus',     bg:'#e3f2fd', color:'#1565c0' },
  '👥': { label:'Friends',   bg:'#e8f5e9', color:'#1b5e20' },
}

const SECTION_COLORS = {
  '🌅 सुबह — Spiritual': { bg:'#fff5e6', accent:'#d46a10' },
  '⭐ Deep Work Block':   { bg:'#e8eaf6', accent:'#1a237e' },
  '💼 Office — सुबह':    { bg:'#e3f2fd', accent:'#1565c0' },
  '🍛 Lunch + Rest':      { bg:'#fff8e1', accent:'#f57f17' },
  '🚀 Office — दोपहर':   { bg:'#e0f2f1', accent:'#00695c' },
  '📊 Office — शाम':     { bg:'#ede7f6', accent:'#4a148c' },
  '👥 Friends + Contacts':{ bg:'#e8f5e9', accent:'#1b5e20' },
  '👨‍👩‍👧 परिवार Time': { bg:'#fce4ec', accent:'#880e4f' },
  '🕯️ Wind Down':        { bg:'#fbe9e7', accent:'#7b0000' },
}

const DONE_KEY = 'sanju_done_v3'
const SETTINGS_KEY = 'sanju_settings_v3'
const DEF_SETTINGS = { dayStart:'5:00 AM', dayEnd:'10:30 PM', actualStart:'' }

function parseCalText(text) {
  const MONTHS = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 }
  return text.trim().split('\n').filter(l => l.trim()).map((line, i) => {
    const parts = line.trim().split(/\s+/)
    const day = parseInt(parts[0])
    const month = MONTHS[parts[1]?.toLowerCase()]
    if (!day || !month) return null
    const label = parts.slice(2).join(' ').trim()
    if (!label) return null
    return { date:`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, label }
  }).filter(Boolean)
}

export default function Routine() {
  const [tasks, setTasks]           = useState([])
  const [done, setDone]             = useState(() => { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {} } catch { return {} } })
  const [settings, setSettings]     = useState(() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || DEF_SETTINGS } catch { return DEF_SETTINGS } })
  const [meals, setMeals]           = useState([])
  const [mantras, setMantras]       = useState([])
  const [remedies, setRemedies]     = useState([])
  const [weeklyPlan, setWeeklyPlan] = useState([])
  const [dayColors, setDayColors]   = useState([])
  const [outfitTips, setOutfitTips] = useState([])
  const [calEvents, setCalEvents]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [view, setView]             = useState('today')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [editingId, setEditingId]   = useState(null)
  const [editDraft, setEditDraft]   = useState({})
  const [addingSection, setAddingSection] = useState(null)
  const [newTask, setNewTask]       = useState({ time:'', task:'', tags:[], skippable:true })
  const [showCelebrate, setShowCelebrate] = useState(false)
  const [dragId, setDragId]         = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [searchQ, setSearchQ]       = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected]     = useState(new Set())
  const [mergeForm, setMergeForm]   = useState(null)
  const [calInput, setCalInput]     = useState('')
  const editRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.getTasks('sanju'),
      api.getMeals('sanju'),
      api.getMantras('sanju', 'mantra'),
      api.getMantras('sanju', 'remedy'),
      api.getWeekly('sanju'),
      api.getDayColors(),
      api.getOutfitTips('sanju'),
      api.getCalendar(),
    ]).then(([t, m, mn, rm, w, dc, ot, cal]) => {
      setTasks(t || [])
      setMeals(m || [])
      setMantras(mn || [])
      setRemedies(rm || [])
      setWeeklyPlan(w || [])
      setDayColors(dc || [])
      setOutfitTips(ot || [])
      setCalEvents(cal || [])
    }).catch(err => { console.error('Sanju API error:', err); setError(err?.message || 'API error') })
       .finally(() => setLoading(false))
  }, [])

  useEffect(() => { localStorage.setItem(DONE_KEY, JSON.stringify(done)) }, [done])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])

  const sections    = [...new Set(tasks.map(t => t.section))]
  const todayDone   = Object.values(done).filter(Boolean).length
  const todayTotal  = tasks.length
  const pct         = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0
  const actualMins  = parseTime(settings.actualStart)
  const isLate      = !!settings.actualStart
  const getStatus   = t => { if (!isLate) return 'normal'; return parseTime(t.time) < actualMins ? (t.skippable ? 'skipped' : 'missed') : 'normal' }
  const missedCount = tasks.filter(t => getStatus(t) === 'missed').length
  const skippedCount= tasks.filter(t => getStatus(t) === 'skipped').length

  const toggle = id => {
    if (selectMode) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }); return }
    const nd = { ...done, [id]: !done[id] }
    setDone(nd)
    if (Object.values(nd).filter(Boolean).length === todayTotal) setShowCelebrate(true)
  }

  const startEdit = t => { setEditingId(t._id); setEditDraft({ time:t.time, task:t.task, tags:[...t.tags], skippable: t.skippable !== false }); setTimeout(() => editRef.current?.focus(), 50) }
  const saveEdit = async () => {
    const updated = await api.updateTask('sanju', editingId, editDraft)
    setTasks(tasks.map(t => t._id === editingId ? { ...t, ...updated } : t))
    setEditingId(null)
  }
  const deleteTask = async id => {
    await api.deleteTask('sanju', id)
    setTasks(tasks.filter(t => t._id !== id))
    const nd = { ...done }; delete nd[id]; setDone(nd)
  }
  const addTask = async section => {
    if (!newTask.task.trim()) return
    const created = await api.addTask('sanju', { ...newTask, section, pinned:false })
    setTasks([...tasks, created])
    setNewTask({ time:'', task:'', tags:[], skippable:true })
    setAddingSection(null)
  }

  const onDragStart = id => setDragId(id)
  const onDragOver  = (e, id) => { e.preventDefault(); setDragOverId(id) }
  const onDrop = async targetId => {
    if (dragId === targetId) return
    const arr  = [...tasks]
    const durs = arr.map((t, i) => { if (i === arr.length - 1) return 15; const d = parseTime(arr[i+1].time) - parseTime(t.time); return (d > 0 && d <= 180) ? d : 15 })
    const fi = arr.findIndex(t => t._id === dragId)
    const ti = arr.findIndex(t => t._id === targetId)
    const [mt] = arr.splice(fi, 1); const [md] = durs.splice(fi, 1)
    arr.splice(ti, 0, mt); durs.splice(ti, 0, md)
    let cursor = parseTime(settings.dayStart)
    const updated = arr.map((t, i) => { const time = fmtTime(cursor); cursor += durs[i]; return { ...t, time, order: i + 1 } })
    setTasks(updated)
    setDragId(null); setDragOverId(null)
    await api.batchUpdateTasks('sanju', updated.map(t => ({ _id: t._id, time: t.time, order: t.order })))
  }

  const applySchedule = (newStart, newEnd) => {
    const oS = parseTime(settings.dayStart), oE = parseTime(settings.dayEnd)
    const nS = parseTime(newStart || settings.dayStart), nE = parseTime(newEnd || settings.dayEnd)
    const oR = oE - oS, nR = nE - nS
    if (oR > 0 && nR > 0) setTasks(prev => prev.map(t => { const ratio = Math.max(0, Math.min(1, (parseTime(t.time) - oS) / oR)); return { ...t, time: fmtTime(Math.round(nS + ratio * nR)) } }))
    setSettings(s => ({ ...s, ...(newStart ? { dayStart: newStart } : {}), ...(newEnd ? { dayEnd: newEnd } : {}) }))
  }
  const autoSkip = () => { const nd = { ...done }; tasks.forEach(t => { if (parseTime(t.time) < actualMins && t.skippable) nd[t._id] = true }); setDone(nd) }

  const openMerge = () => {
    const sel = tasks.filter(t => selected.has(t._id)).sort((a, b) => parseTime(a.time) - parseTime(b.time))
    if (sel.length < 2) return
    setMergeForm({ task: sel[0].task, time: sel[0].time, tags:[...new Set(sel.flatMap(t => t.tags))], skippable: sel.some(t => t.skippable) })
  }
  const doMerge = async () => {
    if (!mergeForm?.task?.trim()) return
    const insertIdx = tasks.findIndex(t => selected.has(t._id))
    const section   = tasks[insertIdx]?.section || sections[0]
    const idsToDelete = [...selected]
    await Promise.all(idsToDelete.map(id => api.deleteTask('sanju', id)))
    const created = await api.addTask('sanju', { ...mergeForm, section, pinned:false })
    const rest = tasks.filter(t => !selected.has(t._id))
    rest.splice(insertIdx, 0, created)
    setTasks(rest)
    const nd = { ...done }; selected.forEach(id => delete nd[id]); setDone(nd)
    setSelected(new Set()); setSelectMode(false); setMergeForm(null)
  }

  const resetDay = () => { setDone({}); setConfirmReset(false) }
  const resetAll = async () => {
    const fresh = await api.resetTasks('sanju')
    setTasks(Array.isArray(fresh) ? fresh : [])
    setDone({}); setSettings(DEF_SETTINGS); setConfirmReset(false)
  }

  const addCalEvent = async () => {
    const parsed = parseCalText(calInput)
    if (!parsed.length) return
    const created = await Promise.all(parsed.map(ev => api.addCalEvent(ev)))
    setCalEvents(prev => [...prev, ...created])
    setCalInput('')
  }
  const deleteCalEvent = async id => {
    await api.deleteCalEvent(id)
    setCalEvents(prev => prev.filter(e => e._id !== id))
  }

  const sc = sec => SECTION_COLORS[sec] || { bg:'#f9f9f9', accent:'#666' }
  const filterAreas = ['ALL', '⚡ Impact', ...Object.keys(AREA_META)]
  const filtered = tasks.filter(t => {
    const aOk = activeFilter === 'ALL' || (activeFilter === '⚡ Impact' ? t.highImpact : t.tags.includes(activeFilter))
    const sOk = !searchQ || t.task.toLowerCase().includes(searchQ.toLowerCase()) || t.time.includes(searchQ)
    return aOk && sOk
  })

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'#d46a10', fontSize:18 }}>🕉️ लोड हो रहा है...</div>

  return (
    <div style={S.root}>
      {error && (
        <div style={{ margin:'12px 14px 0', padding:'12px 16px', background:'#fff3cd', border:'1px solid #f0ad4e', borderRadius:12, fontSize:12, color:'#7b4d00' }}>
          ⚠️ <strong>API Error:</strong> {error}
          <button onClick={() => setError(null)} style={{ float:'right', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#7b4d00' }}>✕</button>
        </div>
      )}
      <header style={S.header}>
        <div style={S.headerTop}>
          <div>
            <div style={S.headerTitle}>☀️ संजू अहूजा</div>
            <div style={S.headerSub}>Daily Routine Planner</div>
          </div>
          <div style={S.progressCircle}>
            <svg width="56" height="56">
              <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"/>
              <circle cx="28" cy="28" r="23" fill="none" stroke="#ffd700" strokeWidth="4"
                strokeDasharray={`${2*Math.PI*23}`} strokeDashoffset={`${2*Math.PI*23*(1-pct/100)}`}
                strokeLinecap="round" style={{ transform:'rotate(-90deg)', transformOrigin:'28px 28px', transition:'stroke-dashoffset 0.5s' }}/>
              <text x="28" y="33" textAnchor="middle" fill="#ffd700" fontSize="13" fontWeight="bold">{pct}%</text>
            </svg>
          </div>
        </div>
        <div style={S.progressBar}><div style={{ ...S.progressFill, width:`${pct}%` }}/></div>
        <div style={S.progressText}>{todayDone} / {todayTotal} tasks complete</div>
      </header>

      <nav style={{ ...S.nav, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
        {[['today','📋 आज'],['weekly','📅 Weekly'],['mantras','🕉️ Mantras'],['outfit','👗 Outfit'],['calendar','📆 Calendar'],['meals','🍽️ Meals']].map(([v,l]) => (
          <button key={v} onClick={() => setView(v)} style={{ ...S.navBtn, whiteSpace:'nowrap', ...(view===v ? S.navActive : {}) }}>{l}</button>
        ))}
      </nav>

      {view === 'today' && <>
        <div style={S.setWrap}>
          <button onClick={() => setShowSettings(!showSettings)} style={S.setToggle}>
            <span>⚙️ Schedule</span>
            {isLate && <span style={S.latePill}>⏰ Late Mode</span>}
            <span style={{ marginLeft:'auto' }}>{showSettings ? '▲' : '▼'}</span>
          </button>
          {showSettings && (
            <div style={S.setPanel}>
              <div style={S.setRow}>
                <div style={S.setBox}><div style={S.setLabel}>🌅 Day Start</div>
                  <input type="time" value={to24(settings.dayStart)} onChange={e => applySchedule(from24(e.target.value), null)} style={S.tInput}/></div>
                <div style={S.setBox}><div style={S.setLabel}>🌙 Day End</div>
                  <input type="time" value={to24(settings.dayEnd)} onChange={e => applySchedule(null, from24(e.target.value))} style={S.tInput}/></div>
              </div>
              <div style={S.setLabel}>⏰ Actual Wake-up (if late)</div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                <input type="time" value={settings.actualStart ? to24(settings.actualStart) : ''}
                  onChange={e => setSettings(s => ({ ...s, actualStart: e.target.value ? from24(e.target.value) : '' }))} style={{ ...S.tInput, flex:1 }}/>
                {settings.actualStart && <button onClick={() => setSettings(s => ({ ...s, actualStart:'' }))} style={S.clearBtn}>✕ Clear</button>}
              </div>
              {isLate && (
                <div style={S.lateInfo}>
                  <span style={S.missedPill}>⚠️ {missedCount} MISSED</span>
                  <span style={S.skippedPill}>⏭️ {skippedCount} SKIPPED</span>
                  <button onClick={autoSkip} style={S.autoSkipBtn}>⏭️ Auto-skip flexible</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={S.toolBar}>
          <input placeholder="🔍 Search tasks..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={S.searchInput}/>
          <button onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); setMergeForm(null) }}
            style={{ ...S.selBtn, ...(selectMode ? S.selBtnOn : {}) }}>
            {selectMode ? '✕ Cancel' : '⋈ Merge'}
          </button>
        </div>

        {selectMode && selected.size >= 2 && !mergeForm && (
          <div style={S.mergeBanner}>
            <span style={{ fontWeight:700, color:'#d46a10' }}>{selected.size} tasks selected</span>
            <button onClick={openMerge} style={S.btnSave}>⊕ Merge</button>
          </div>
        )}
        {mergeForm && (
          <div style={S.mergeForm}>
            <div style={S.mergeTitle}>⊕ Merge {selected.size} tasks</div>
            <input value={mergeForm.task} onChange={e => setMergeForm({ ...mergeForm, task: e.target.value })} style={S.editInput} placeholder="Combined task..."/>
            <input type="time" value={to24(mergeForm.time)} onChange={e => setMergeForm({ ...mergeForm, time: from24(e.target.value) })} style={S.tInput}/>
            <div style={S.editTagRow}>
              {Object.keys(AREA_META).map(a => (
                <button key={a} onClick={() => { const tags = mergeForm.tags.includes(a) ? mergeForm.tags.filter(x => x !== a) : [...mergeForm.tags, a]; setMergeForm({ ...mergeForm, tags }) }}
                  style={{ ...S.tagToggle, ...(mergeForm.tags.includes(a) ? { background: AREA_META[a].color, color:'#fff' } : {}) }}>{a}</button>
              ))}
            </div>
            <button onClick={() => setMergeForm({ ...mergeForm, skippable: !mergeForm.skippable })}
              style={{ ...S.skipToggle, ...(!mergeForm.skippable ? S.skipRequired : {}) }}>
              {mergeForm.skippable ? '⏭️ Skippable' : '⛔ Required'}
            </button>
            <div style={S.editActions}>
              <button onClick={doMerge} style={S.btnSave}>⊕ Merge</button>
              <button onClick={() => { setMergeForm(null); setSelected(new Set()); setSelectMode(false) }} style={S.btnCancel}>✕</button>
            </div>
          </div>
        )}

        <div style={S.filterRow}>
          {filterAreas.map(a => (
            <button key={a} onClick={() => setActiveFilter(a)}
              style={{ ...S.filterChip, ...(activeFilter === a ? { background: a==='ALL' ? '#d46a10' : a==='⚡ Impact' ? '#e65100' : (AREA_META[a]?.color||'#333'), color:'#fff' } : {}) }}>
              {a === 'ALL' ? 'All' : a}
            </button>
          ))}
        </div>

        {sections.map(sec => {
          const secTasks = filtered.filter(t => t.section === sec)
          if (!secTasks.length) return null
          const c = sc(sec)
          const secDone = secTasks.filter(t => done[t._id]).length
          return (
            <div key={sec} style={{ ...S.section, background: c.bg }}>
              <div style={{ ...S.secHeader, borderLeftColor: c.accent }}>
                <span style={S.secTitle}>{sec}</span>
                <span style={{ ...S.secBadge, background: c.accent }}>{secDone}/{secTasks.length}</span>
              </div>
              {secTasks.map(t => {
                const status = getStatus(t), isSel = selected.has(t._id)
                return (
                  <div key={t._id} draggable={!selectMode}
                    onDragStart={() => onDragStart(t._id)} onDragOver={e => onDragOver(e, t._id)} onDrop={() => onDrop(t._id)}
                    style={{ ...S.taskCard, ...(done[t._id] ? S.taskDone : {}), ...(status==='skipped' ? S.taskSkipped : {}), ...(status==='missed' ? S.taskMissed : {}), ...(dragOverId===t._id ? S.taskDragOver : {}), ...(isSel ? S.taskSelected : {}), borderLeft: t.highImpact ? '4px solid #ffd700' : `4px solid ${status==='missed' ? '#b71c1c' : c.accent}` }}>
                    {editingId === t._id ? (
                      <div style={S.editBox}>
                        <input ref={editRef} value={editDraft.time} onChange={e => setEditDraft({ ...editDraft, time: e.target.value })} style={S.editInput} placeholder="Time"/>
                        <textarea value={editDraft.task} onChange={e => setEditDraft({ ...editDraft, task: e.target.value })} style={S.editTextarea} rows={2}/>
                        <div style={S.editTagRow}>
                          {Object.keys(AREA_META).map(a => (
                            <button key={a} onClick={() => { const tags = editDraft.tags.includes(a) ? editDraft.tags.filter(x => x !== a) : [...editDraft.tags, a]; setEditDraft({ ...editDraft, tags }) }}
                              style={{ ...S.tagToggle, ...(editDraft.tags.includes(a) ? { background: AREA_META[a].color, color:'#fff' } : {}) }}>{a}</button>
                          ))}
                        </div>
                        <button onClick={() => setEditDraft({ ...editDraft, skippable: !editDraft.skippable })}
                          style={{ ...S.skipToggle, ...(!editDraft.skippable ? S.skipRequired : {}) }}>
                          {editDraft.skippable ? '⏭️ Skippable' : '⛔ Required'}
                        </button>
                        <div style={S.editActions}>
                          <button onClick={saveEdit} style={S.btnSave}>💾 Save</button>
                          <button onClick={() => setEditingId(null)} style={S.btnCancel}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <div style={S.taskRow} onClick={() => toggle(t._id)}>
                        <div style={{ ...S.checkbox, ...((selectMode ? isSel : done[t._id]) ? S.cbDone : {}), borderColor: c.accent }}>
                          {(selectMode ? isSel : done[t._id]) && <span style={S.checkMark}>✓</span>}
                        </div>
                        <div style={S.taskContent}>
                          <div style={S.taskTime}>
                            {t.time} {t.pinned && '📌'}
                            {t.highImpact && <span style={{ fontSize:10, background:'#ffd700', color:'#7b3f00', padding:'1px 5px', borderRadius:6, fontWeight:800 }}>⚡ Impact</span>}
                            {!t.skippable && <span style={S.reqDot}>⛔</span>}
                            {status === 'missed'  && <span style={S.missedBadge}>MISSED</span>}
                            {status === 'skipped' && <span style={S.skippedBadge}>⏭️ SKIP</span>}
                          </div>
                          <div style={{ ...S.taskText, ...((done[t._id] || status==='skipped') ? S.taskStrike : {}) }}>{t.task}</div>
                          <div style={S.tagRow}>
                            {t.tags.map(tag => (
                              <span key={tag} style={{ ...S.tag, background: AREA_META[tag]?.bg||'#eee', color: AREA_META[tag]?.color||'#666' }}>{tag} {AREA_META[tag]?.label}</span>
                            ))}
                          </div>
                        </div>
                        {!selectMode && (
                          <div style={S.taskActions} onClick={e => e.stopPropagation()}>
                            <button onClick={() => startEdit(t)} style={S.iconBtn}>✏️</button>
                            <button onClick={() => deleteTask(t._id)} style={S.iconBtn}>🗑️</button>
                            <span style={S.dragHandle}>⠿</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {!selectMode && (
                addingSection === sec ? (
                  <div style={S.addBox}>
                    <input placeholder="Time (e.g. 9:00 AM)" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} style={S.editInput}/>
                    <input placeholder="Task description..." value={newTask.task} onChange={e => setNewTask({ ...newTask, task: e.target.value })} style={S.editInput} onKeyDown={e => e.key==='Enter' && addTask(sec)}/>
                    <div style={S.editTagRow}>
                      {Object.keys(AREA_META).map(a => (
                        <button key={a} onClick={() => { const tags = newTask.tags.includes(a) ? newTask.tags.filter(x => x !== a) : [...newTask.tags, a]; setNewTask({ ...newTask, tags }) }}
                          style={{ ...S.tagToggle, ...(newTask.tags.includes(a) ? { background: AREA_META[a].color, color:'#fff' } : {}) }}>{a}</button>
                      ))}
                    </div>
                    <button onClick={() => setNewTask({ ...newTask, skippable: !newTask.skippable })}
                      style={{ ...S.skipToggle, ...(!newTask.skippable ? S.skipRequired : {}) }}>
                      {newTask.skippable ? '⏭️ Skippable' : '⛔ Required'}
                    </button>
                    <div style={S.editActions}>
                      <button onClick={() => addTask(sec)} style={S.btnSave}>➕ Add</button>
                      <button onClick={() => setAddingSection(null)} style={S.btnCancel}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingSection(sec)} style={{ ...S.addTaskBtn, color: c.accent }}>+ Add task</button>
                )
              )}
            </div>
          )
        })}

        <div style={S.resetRow}>
          {!confirmReset ? (
            <>
              <button onClick={() => setConfirmReset('day')} style={S.btnReset}>🔄 Reset Today</button>
              <button onClick={() => setConfirmReset('all')} style={S.btnResetAll}>♻️ Reset All</button>
            </>
          ) : (
            <div style={S.confirmBox}>
              <p>{confirmReset === 'day' ? 'Reset checkmarks?' : 'Reset ALL data?'}</p>
              <button onClick={confirmReset === 'day' ? resetDay : resetAll} style={S.btnSave}>Yes</button>
              <button onClick={() => setConfirmReset(false)} style={S.btnCancel}>No</button>
            </div>
          )}
        </div>
      </>}

      {view === 'weekly' && <WeeklyView data={weeklyPlan} />}
      {view === 'mantras' && <MantrasView mantras={mantras} remedies={remedies} />}

      {view === 'outfit' && (() => {
        const idx = new Date().getDay()
        const dc  = dayColors[idx] || {}
        const tip = outfitTips.find(o => o.dayIndex === idx)?.tip || ''
        return (
          <div style={{ padding:'16px 14px' }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#d46a10', marginBottom:4 }}>👗 आज का Outfit — संजू</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>Vedic Astrology based daily color guide</div>
            <div style={{ background:`linear-gradient(135deg,${dc.color},${dc.color}cc)`, borderRadius:16, padding:20, color:'#fff', marginBottom:16, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:4 }}>{dc.god}</div>
              <div style={{ fontSize:16, fontWeight:800 }}>{dc.day} — {dc.en}</div>
              <div style={{ fontSize:22, fontWeight:900, marginTop:8, marginBottom:4 }}>{dc.name}</div>
              <div style={{ fontSize:13, opacity:0.9 }}>आज का शुभ रंग</div>
            </div>
            <div style={{ background:'#fff', borderRadius:16, padding:16, marginBottom:12, border:'2px solid #eee' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#333', marginBottom:10 }}>👔 Outfit Suggestions:</div>
              {(dc.outfits || []).map((o, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom: i < dc.outfits.length-1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background: dc.color, flexShrink:0 }}/>
                  <span style={{ fontSize:14 }}>{o}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#fff8f0', borderRadius:16, padding:16, marginBottom:12, border:'2px solid #d46a10' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#7b0000', marginBottom:6 }}>🌟 Personal Tip — Budh Dasha + Singh Lagna:</div>
              <div style={{ fontSize:13, color:'#333', lineHeight:1.6 }}>{tip}</div>
            </div>
            <div style={{ background:'#fff0f0', borderRadius:12, padding:12, border:'1px solid #ffcdd2' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#c62828', marginBottom:4 }}>❌ आज Avoid करें:</div>
              <div style={{ fontSize:13, color:'#555' }}>{dc.avoid}</div>
            </div>
          </div>
        )
      })()}

      {view === 'calendar' && <CalendarView calEvents={calEvents} calInput={calInput} setCalInput={setCalInput} addCalEvent={addCalEvent} deleteCalEvent={deleteCalEvent} accentColor="#d46a10" />}

      {view === 'meals' && (() => {
        const idx  = new Date().getDay()
        const meal = meals.find(m => m.dayIndex === idx) || {}
        return (
          <div style={{ padding:'16px 14px' }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#d46a10', marginBottom:4 }}>🍽️ Meals — संजू</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>BP Control + Budh Dasha + Singh Lagna आधारित</div>
            <div style={{ background:'linear-gradient(135deg,#d46a10,#7b0000)', borderRadius:16, padding:16, color:'#fff', marginBottom:16 }}>
              <div style={{ fontSize:13, opacity:0.9 }}>आज: {meal.day}</div>
              <div style={{ fontSize:15, fontWeight:800, marginTop:4 }}>{meal.tip}</div>
            </div>
            {[['🌅 नाश्ता (Breakfast)', meal.breakfast, '7:00 AM'], ['🍛 दोपहर का खाना (Lunch)', meal.lunch, '2:00 PM'], ['🌙 रात का खाना (Dinner)', meal.dinner, '9:00 PM']].map(([title, content, time]) => (
              <div key={title} style={{ background:'#fff', borderRadius:12, padding:16, marginBottom:12, border:'1px solid #eee' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{title}</div>
                  <div style={{ fontSize:11, color:'#d46a10', fontWeight:600 }}>{time}</div>
                </div>
                <div style={{ fontSize:13, color:'#444', lineHeight:1.6 }}>{content}</div>
              </div>
            ))}
            <div style={{ background:'#fff0f0', borderRadius:12, padding:12, border:'1px solid #ffcdd2' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#c62828', marginBottom:6 }}>⚠️ BP Control Rules:</div>
              <div style={{ fontSize:12, color:'#555', lineHeight:1.8 }}>❌ नमक कम करें (2g/day max){'\n'}❌ तला हुआ खाना avoid करें{'\n'}✅ पानी 8-10 गिलास{'\n'}✅ पोटेशियम: केला, पालक, दही{'\n'}✅ रात का खाना 9 PM से पहले</div>
            </div>
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#555', marginBottom:8 }}>📅 Weekly Meal Plan</div>
              {meals.sort((a, b) => a.dayIndex - b.dayIndex).map((m, i) => (
                <div key={i} style={{ background: m.dayIndex===idx ? '#fff8f0' : '#f9f9f9', border:`1px solid ${m.dayIndex===idx ? '#d46a10' : '#eee'}`, borderRadius:10, padding:10, marginBottom:6 }}>
                  <div style={{ fontSize:12, fontWeight:800, color: m.dayIndex===idx ? '#d46a10' : '#333', marginBottom:4 }}>{m.day} {m.dayIndex===idx ? '← आज' : ''}</div>
                  <div style={{ fontSize:11, color:'#666' }}>{m.breakfast}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {showCelebrate && (
        <div style={S.celebOverlay} onClick={() => setShowCelebrate(false)}>
          <div style={S.celebBox}>
            <div style={{ fontSize:60, marginBottom:8 }}>🎉</div>
            <div style={S.celebTitle}>शाबाश Sanju भाई!</div>
            <div style={{ fontSize:16, color:'#555', marginBottom:8 }}>आज का पूरा Routine complete!</div>
            <div style={{ fontSize:15, color:'#7b0000', fontWeight:600, fontStyle:'italic', marginBottom:16 }}>"Empire बनाने का दिमाग है आपमें" 👑</div>
            <button onClick={() => setShowCelebrate(false)} style={S.btnSave}>🙏 जय गुरुदेव</button>
          </div>
        </div>
      )}
    </div>
  )
}

function WeeklyView({ data }) {
  return (
    <div style={{ padding:'10px 10px 20px' }}>
      {(data || []).map((d, i) => (
        <div key={i} style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:10, borderTop:`4px solid ${d.color}`, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:20, fontWeight:800, color:d.color, marginBottom:3 }}>{d.day}</div>
          <div style={{ fontSize:15, color:'#555', fontWeight:600, marginBottom:8 }}>{d.focus}</div>
          <div style={{ fontSize:14, color:'#333', marginBottom:4 }}><b style={{ color:'#888' }}>🕉️ Mantra:</b> {d.mantra}</div>
          <div style={{ fontSize:14, color:'#333', marginBottom:4 }}><b style={{ color:'#888' }}>💎 Remedy:</b> {d.remedy}</div>
          <div style={{ fontSize:14, color:'#333' }}><b style={{ color:'#888' }}>⭐ Special:</b> {d.special}</div>
        </div>
      ))}
    </div>
  )
}

function MantrasView({ mantras, remedies }) {
  return (
    <div style={{ padding:'10px 10px 20px' }}>
      <div style={{ fontSize:20, fontWeight:800, color:'#7b0000', textAlign:'center', padding:'10px 0 6px' }}>🕉️ Daily Mantras</div>
      {(mantras || []).map((m, i) => (
        <div key={i} style={{ background:'#fff', borderRadius:12, padding:'12px 14px', marginBottom:8, borderLeft:`4px solid ${m.color}`, boxShadow:'0 1px 5px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:m.color, marginBottom:3 }}>{m.when}</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#222', marginBottom:3 }}>{m.mantra}</div>
          <div style={{ fontSize:13, color:'#666' }}>✨ {m.benefit}</div>
        </div>
      ))}
      <div style={{ fontSize:20, fontWeight:800, color:'#7b0000', textAlign:'center', padding:'16px 0 6px' }}>💎 Weekly Remedies</div>
      {(remedies || []).map((r, i) => (
        <div key={i} style={{ background:'#fff', borderRadius:12, padding:'12px 14px', marginBottom:8, borderLeft:`4px solid ${r.color}`, boxShadow:'0 1px 5px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:r.color, marginBottom:3 }}>{r.when}</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#222' }}>{r.mantra}</div>
        </div>
      ))}
      <div style={{ background:'linear-gradient(135deg,#fff9f0,#fff0e0)', border:'2px solid #d46a10', borderRadius:14, padding:18, marginTop:16, textAlign:'center' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#7b0000', lineHeight:1.7 }}>"Finish करो — Start करना बंद करो</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#7b0000', lineHeight:1.7 }}>आपमें Empire बनाने का दिमाग है" 👑</div>
        <div style={{ fontSize:14, color:'#d46a10', marginTop:8, fontWeight:600 }}>🕉️ ॐ गं गणपतये नमः | जय माँ लक्ष्मी</div>
      </div>
    </div>
  )
}

export function CalendarView({ calEvents, calInput, setCalInput, addCalEvent, deleteCalEvent, accentColor }) {
  const ACC = accentColor || '#d46a10'
  const today = new Date()
  const MONTH_HI = ['','जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']
  const withDays = (calEvents || []).map(e => {
    const [mm, dd] = e.date.split('-').map(Number)
    const next = new Date(today.getFullYear(), mm-1, dd)
    if (next < today && !(next.getMonth()===today.getMonth() && next.getDate()===today.getDate())) next.setFullYear(today.getFullYear()+1)
    return { ...e, daysAway: Math.round((next - today) / 864e5), mm, dd }
  }).sort((a, b) => a.daysAway - b.daysAway)
  const upcoming = withDays.filter(e => e.daysAway <= 60)
  const byMonth  = {}
  calEvents?.forEach(e => { const mm = parseInt(e.date.split('-')[0]); if (!byMonth[mm]) byMonth[mm] = []; byMonth[mm].push(e) })
  const parseCalText = text => {
    const MONTHS = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 }
    return text.trim().split('\n').filter(l => l.trim()).map(line => {
      const parts = line.trim().split(/\s+/); const day = parseInt(parts[0]); const month = MONTHS[parts[1]?.toLowerCase()]
      if (!day || !month) return null
      const label = parts.slice(2).join(' ').trim(); if (!label) return null
      return { date:`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, label }
    }).filter(Boolean)
  }
  const parsed = parseCalText(calInput || '')
  return (
    <div style={{ padding:'16px 14px' }}>
      <div style={{ fontSize:20, fontWeight:800, color:ACC, marginBottom:16 }}>📆 परिवार Calendar</div>
      {upcoming.length > 0 && <>
        <div style={{ fontSize:13, fontWeight:700, color:'#555', marginBottom:10 }}>🔔 अगले 60 दिनों में ({upcoming.length})</div>
        {upcoming.map(e => (
          <div key={e._id} style={{ background: e.daysAway<=7 ? '#fff3e0' : '#f9f9f9', border:`2px solid ${e.daysAway<=7 ? ACC : '#ddd'}`, borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{e.label}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{MONTH_HI[e.mm]} {e.dd} • {e.daysAway===0 ? '🎉 आज!' : `${e.daysAway} दिन बाद`}</div>
          </div>
        ))}
        <div style={{ height:8 }}/>
      </>}
      <div style={{ fontSize:13, fontWeight:700, color:'#555', marginBottom:10 }}>📅 सभी Events ({calEvents?.length || 0})</div>
      {Object.keys(byMonth).sort((a, b) => +a - +b).map(mm => (
        <div key={mm} style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:800, color:ACC, marginBottom:6, letterSpacing:1 }}>{MONTH_HI[+mm].toUpperCase()}</div>
          {byMonth[mm].sort((a, b) => a.date.localeCompare(b.date)).map(e => (
            <div key={e._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#fff', border:'1px solid #eee', borderRadius:8, marginBottom:4 }}>
              <span style={{ fontSize:14 }}>{parseInt(e.date.split('-')[1])} — {e.label}</span>
              <button onClick={() => deleteCalEvent(e._id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#bbb', padding:'0 4px' }}>✕</button>
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop:16, padding:14, background:'#fff8f0', borderRadius:12, border:`2px solid ${ACC}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#7b0000', marginBottom:4 }}>➕ New Event जोड़ें</div>
        <div style={{ fontSize:11, color:'#888', marginBottom:8 }}>Format: "12 January 🧁 Event" (एक line = एक event)</div>
        <textarea value={calInput} onChange={e => setCalInput(e.target.value)}
          placeholder={'12 January 🧁 Kirti\n31 January 💞 Bhumi-Mukesh'}
          style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid #ddd', fontSize:12, fontFamily:'inherit', minHeight:80, boxSizing:'border-box', resize:'vertical' }}/>
        <button onClick={addCalEvent}
          style={{ marginTop:8, width:'100%', padding:'10px', background: parsed.length>0 ? ACC : '#bbb', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor: parsed.length>0 ? 'pointer' : 'not-allowed' }}>
          ✓ Calendar में जोड़ें {parsed.length > 0 ? `(${parsed.length} events)` : ''}
        </button>
      </div>
    </div>
  )
}

const S = {
  root:        { fontFamily:"'Noto Sans Devanagari','Segoe UI',sans-serif", background:'#f5f0eb', minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:40 },
  header:      { background:'linear-gradient(135deg,#d46a10 0%,#7b0000 100%)', padding:'20px 16px 12px', color:'#fff' },
  headerTop:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  headerTitle: { fontSize:26, fontWeight:700, letterSpacing:0.5 },
  headerSub:   { fontSize:15, opacity:0.85, marginTop:2 },
  progressCircle: { flexShrink:0 },
  progressBar:  { background:'rgba(255,255,255,0.2)', borderRadius:8, height:7, overflow:'hidden' },
  progressFill: { background:'#ffd700', height:'100%', borderRadius:8, transition:'width 0.4s' },
  progressText: { fontSize:13, opacity:0.85, marginTop:5, textAlign:'right' },
  nav:          { display:'flex', background:'#fff', borderBottom:'2px solid #f0e8de', position:'sticky', top:0, zIndex:10 },
  navBtn:       { flex:1, padding:'13px 4px', border:'none', background:'transparent', fontSize:14, fontWeight:600, color:'#888', cursor:'pointer' },
  navActive:    { color:'#d46a10', borderBottom:'3px solid #d46a10' },
  setWrap:      { margin:'8px 10px 0', borderRadius:12, overflow:'hidden', border:'1.5px solid #f0e0cf' },
  setToggle:    { width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fff9f5', border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'#d46a10' },
  latePill:     { background:'#ff9800', color:'#fff', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 },
  setPanel:     { background:'#fff9f5', padding:'10px 14px 14px', borderTop:'1px solid #f0e0cf' },
  setRow:       { display:'flex', gap:12, marginBottom:12 },
  setBox:       { flex:1 },
  setLabel:     { fontSize:12, color:'#888', fontWeight:700, marginBottom:4 },
  tInput:       { padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', background:'#fff' },
  clearBtn:     { padding:'7px 12px', background:'#eee', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' },
  lateInfo:     { display:'flex', flexWrap:'wrap', gap:6, marginTop:8, alignItems:'center' },
  missedPill:   { background:'#b71c1c', color:'#fff', borderRadius:8, padding:'3px 8px', fontSize:12, fontWeight:700 },
  skippedPill:  { background:'#ff9800', color:'#fff', borderRadius:8, padding:'3px 8px', fontSize:12, fontWeight:700 },
  autoSkipBtn:  { padding:'6px 12px', background:'#fff', border:'1.5px solid #d46a10', color:'#d46a10', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:12 },
  toolBar:      { padding:'10px 12px 4px', display:'flex', gap:8, alignItems:'center' },
  searchInput:  { flex:1, padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:10, fontSize:15, outline:'none', background:'#fff', boxSizing:'border-box' },
  selBtn:       { padding:'9px 14px', background:'#fff', border:'1.5px solid #ddd', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', color:'#555', whiteSpace:'nowrap' },
  selBtnOn:     { background:'#d46a10', color:'#fff', border:'1.5px solid #d46a10' },
  mergeBanner:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#fff3e0', margin:'4px 10px', borderRadius:10, border:'1.5px solid #d46a10' },
  mergeForm:    { margin:'4px 10px 8px', background:'#fff', border:'1.5px solid #d46a10', borderRadius:12, padding:'14px', display:'flex', flexDirection:'column', gap:8 },
  mergeTitle:   { fontSize:15, fontWeight:700, color:'#d46a10' },
  filterRow:    { display:'flex', gap:6, padding:'6px 12px 10px', overflowX:'auto', scrollbarWidth:'none' },
  filterChip:   { padding:'5px 12px', border:'1.5px solid #ddd', borderRadius:20, fontSize:13, background:'#fff', cursor:'pointer', whiteSpace:'nowrap', color:'#555', fontWeight:600 },
  section:      { margin:'8px 10px', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' },
  secHeader:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderLeft:'4px solid', background:'rgba(255,255,255,0.6)' },
  secTitle:     { fontWeight:700, fontSize:15, color:'#222' },
  secBadge:     { color:'#fff', borderRadius:12, padding:'3px 9px', fontSize:13, fontWeight:700 },
  taskCard:     { background:'#fff', margin:'1px 0', borderLeft:'3px solid transparent', transition:'all 0.2s', cursor:'grab' },
  taskDone:     { opacity:0.55, background:'#f9f9f9' },
  taskSkipped:  { opacity:0.45, background:'#fafafa' },
  taskMissed:   { background:'#fff5f5' },
  taskDragOver: { background:'#fff9f0', boxShadow:'inset 0 0 0 2px #d46a10' },
  taskSelected: { background:'#fff3e0' },
  taskRow:      { display:'flex', alignItems:'flex-start', gap:10, padding:'12px 12px', cursor:'pointer' },
  checkbox:     { width:24, height:24, border:'2px solid', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2, transition:'all 0.2s' },
  cbDone:       { background:'#2e7d32', borderColor:'#2e7d32' },
  checkMark:    { color:'#fff', fontSize:15, fontWeight:700 },
  taskContent:  { flex:1, minWidth:0 },
  taskTime:     { fontSize:13, color:'#d46a10', fontWeight:700, marginBottom:3, display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 },
  reqDot:       { fontSize:11 },
  missedBadge:  { background:'#b71c1c', color:'#fff', fontSize:10, padding:'1px 6px', borderRadius:6, fontWeight:700 },
  skippedBadge: { background:'#ff9800', color:'#fff', fontSize:10, padding:'1px 6px', borderRadius:6, fontWeight:700 },
  taskText:     { fontSize:16, color:'#222', lineHeight:1.5 },
  taskStrike:   { textDecoration:'line-through', color:'#999' },
  tagRow:       { display:'flex', flexWrap:'wrap', gap:4, marginTop:6 },
  tag:          { fontSize:12, padding:'3px 8px', borderRadius:12, fontWeight:600 },
  taskActions:  { display:'flex', gap:4, alignItems:'center', flexShrink:0 },
  iconBtn:      { background:'none', border:'none', cursor:'pointer', fontSize:18, padding:'2px', opacity:0.6 },
  dragHandle:   { fontSize:18, color:'#bbb', cursor:'grab', userSelect:'none' },
  editBox:      { padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 },
  editInput:    { padding:'8px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:15, outline:'none', width:'100%', boxSizing:'border-box' },
  editTextarea: { padding:'8px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:15, outline:'none', resize:'vertical', width:'100%', boxSizing:'border-box' },
  editTagRow:   { display:'flex', flexWrap:'wrap', gap:5 },
  tagToggle:    { padding:'5px 10px', border:'1.5px solid #ddd', borderRadius:16, fontSize:14, cursor:'pointer', background:'#f5f5f5' },
  skipToggle:   { padding:'8px 12px', background:'#e8f5e9', border:'1.5px solid #4caf50', borderRadius:8, fontSize:13, cursor:'pointer', color:'#2e7d32', fontWeight:600, textAlign:'left', width:'100%' },
  skipRequired: { background:'#fce4ec', border:'1.5px solid #b71c1c', color:'#b71c1c' },
  editActions:  { display:'flex', gap:8 },
  btnSave:      { padding:'10px 18px', background:'#d46a10', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:15 },
  btnCancel:    { padding:'10px 16px', background:'#eee', color:'#555', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:15 },
  addBox:       { padding:'10px 12px', background:'#fffaf5', display:'flex', flexDirection:'column', gap:8 },
  addTaskBtn:   { width:'100%', padding:'11px', background:'none', border:'none', cursor:'pointer', fontSize:15, fontWeight:600, textAlign:'center' },
  resetRow:     { display:'flex', gap:10, justifyContent:'center', padding:'20px 16px 0' },
  btnReset:     { padding:'10px 20px', background:'#fff', border:'1.5px solid #d46a10', color:'#d46a10', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:15 },
  btnResetAll:  { padding:'10px 20px', background:'#fff', border:'1.5px solid #b71c1c', color:'#b71c1c', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:15 },
  confirmBox:   { background:'#fff', padding:14, borderRadius:12, textAlign:'center', border:'1.5px solid #ddd', display:'flex', flexDirection:'column', gap:8, alignItems:'center' },
  celebOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  celebBox:     { background:'#fff', borderRadius:20, padding:28, textAlign:'center', maxWidth:320, margin:16 },
  celebTitle:   { fontSize:24, fontWeight:800, color:'#d46a10', marginBottom:4 },
}
