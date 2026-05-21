import { useState, useEffect, useRef } from 'react'
import { api } from './api'
import { CalendarView } from './Routine'

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
  return `${h}:${mn.toString().padStart(2,'0')} ${p}`
}
function to24(str) {
  const t = parseTime(str)
  return `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`
}
function from24(str) {
  if (!str) return ''
  const [h, m] = str.split(':').map(Number)
  return fmtTime(h * 60 + m)
}

const PINK  = '#c2185b'
const DPINK = '#880e4f'

const AREA_META = {
  '🎨': { label:'Creative',  bg:'#fce4ec', color:'#880e4f' },
  '📚': { label:'Study',     bg:'#e8eaf6', color:'#1a237e' },
  '🕉️': { label:'Spiritual', bg:'#fff0f5', color:'#7b0000' },
  '🏥': { label:'Health',    bg:'#fff0f0', color:'#c62828' },
  '👗': { label:'Fashion',   bg:'#f3e5f5', color:'#6a1b9a' },
  '📱': { label:'Instagram', bg:'#e8f5e9', color:'#1b5e20' },
  '❤️': { label:'Family',    bg:'#fce4ec', color:'#880e4f' },
  '🧠': { label:'Focus',     bg:'#e3f2fd', color:'#1565c0' },
  '💪': { label:'Growth',    bg:'#fff8e1', color:'#f57f17' },
}

const SECTION_COLORS = {
  '🌅 सुबह — Spiritual':           { bg:'#fff5e6', accent:'#d46a10' },
  '💪 Yoga + Morning Exercise':     { bg:'#e8f5e9', accent:'#2e7d32' },
  '🍽️ नाश्ता + तैयारी':            { bg:'#fff8e1', accent:'#f57f17' },
  '🎓 NIFT — Entrance Preparation': { bg:'#fce4ec', accent:'#c2185b' },
  '🏫 Coaching Classes':            { bg:'#e3f2fd', accent:'#1565c0' },
  '🎨 Creative Block':              { bg:'#f3e5f5', accent:'#6a1b9a' },
  '📱 Instagram + Brand':           { bg:'#e8f5e9', accent:'#1b5e20' },
  '❤️ परिवार + Grounding':         { bg:'#fce4ec', accent:'#880e4f' },
  '🌙 रात — Wind Down':            { bg:'#fbe9e7', accent:'#7b0000' },
}

const DONE_KEY     = 'mahi_done_v3'
const SETTINGS_KEY = 'mahi_settings_v3'
const DEF_SETTINGS = { dayStart:'6:00 AM', dayEnd:'9:30 PM', actualStart:'' }

function parseCalText(text) {
  const MONTHS = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12}
  return text.trim().split('\n').filter(l=>l.trim()).map((line)=>{
    const parts = line.trim().split(/\s+/)
    const day = parseInt(parts[0])
    const month = MONTHS[parts[1]?.toLowerCase()]
    if(!day||!month) return null
    const label = parts.slice(2).join(' ').trim()
    if(!label) return null
    return { date:`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, label }
  }).filter(Boolean)
}

export default function MahiRoutine() {
  const [tasks, setTasks]           = useState([])
  const [done, setDone]             = useState(() => { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {} } catch { return {} } })
  const [settings, setSettings]     = useState(() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || DEF_SETTINGS } catch { return DEF_SETTINGS } })
  const [meals, setMeals]           = useState([])
  const [mantras, setMantras]       = useState([])
  const [weeklyPlan, setWeeklyPlan] = useState([])
  const [dayColors, setDayColors]   = useState([])
  const [outfitTips, setOutfitTips] = useState([])
  const [calEvents, setCalEvents]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [brandTips, setBrandTips]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [view, setView]             = useState('today')
  const [editingId, setEditingId]   = useState(null)
  const [editDraft, setEditDraft]   = useState({})
  const [addingSection, setAddingSection] = useState(null)
  const [newTask, setNewTask]       = useState({ time:'', task:'', tags:[], skippable:true })
  const [showCelebrate, setShowCelebrate] = useState(false)
  const [searchQ, setSearchQ]       = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [dragId, setDragId]         = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected]     = useState(new Set())
  const [mergeForm, setMergeForm]   = useState(null)
  const [calInput, setCalInput]     = useState('')
  const editRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.getTasks('mahi'),
      api.getMeals('mahi'),
      api.getMantras('mahi', 'mantra'),
      api.getWeekly('mahi'),
      api.getDayColors(),
      api.getOutfitTips('mahi'),
      api.getCalendar(),
      api.getExtras('mahi', 'brand_milestone'),
      api.getExtras('mahi', 'brand_tip'),
    ]).then(([t, m, mn, w, dc, ot, cal, ms, bt]) => {
      setTasks(Array.isArray(t) ? t.map(x => ({...x, skippable: x.skippable !== undefined ? x.skippable : !x.pinned})) : [])
      setMeals(Array.isArray(m) ? m : [])
      setMantras(Array.isArray(mn) ? mn : [])
      setWeeklyPlan(Array.isArray(w) ? w : [])
      setDayColors(Array.isArray(dc) ? dc : [])
      setOutfitTips(Array.isArray(ot) ? ot : [])
      setCalEvents(Array.isArray(cal) ? cal : [])
      setMilestones(Array.isArray(ms) ? ms : [])
      setBrandTips(Array.isArray(bt) ? bt : [])
    }).catch(err => { console.error('Mahi API error:', err); setError(err?.message || 'API error') })
       .finally(() => setLoading(false))
  }, [])

  useEffect(() => { try { localStorage.setItem(DONE_KEY, JSON.stringify(done)) } catch {} }, [done])
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch {} }, [settings])

  const sections   = [...new Set(tasks.map(t => t.section))]
  const todayDone  = Object.values(done).filter(Boolean).length
  const todayTotal = tasks.length
  const pct        = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0

  const actualMins   = parseTime(settings.actualStart)
  const isLate       = !!settings.actualStart
  const getStatus    = t => {
    if (!isLate) return 'normal'
    return parseTime(t.time) < actualMins ? (t.skippable ? 'skipped' : 'missed') : 'normal'
  }
  const missedCount  = tasks.filter(t => getStatus(t) === 'missed').length
  const skippedCount = tasks.filter(t => getStatus(t) === 'skipped').length

  const toggle = id => {
    if (selectMode) {
      setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
      return
    }
    const nd = { ...done, [id]: !done[id] }
    setDone(nd)
    if (Object.values(nd).filter(Boolean).length === todayTotal) setShowCelebrate(true)
  }

  const startEdit = t => {
    setEditingId(t._id)
    setEditDraft({ time:t.time, task:t.task, tags:[...t.tags], skippable: t.skippable !== false })
    setTimeout(() => editRef.current?.focus(), 50)
  }
  const saveEdit = async () => {
    const updated = await api.updateTask('mahi', editingId, editDraft)
    setTasks(prev => prev.map(t => t._id === editingId ? { ...t, ...(updated || editDraft) } : t))
    setEditingId(null)
  }
  const deleteTask = async id => {
    await api.deleteTask('mahi', id)
    setTasks(prev => prev.filter(t => t._id !== id))
    const nd = { ...done }; delete nd[id]; setDone(nd)
  }
  const addTask = async section => {
    if (!newTask.task.trim()) return
    const created = await api.addTask('mahi', { ...newTask, section, pinned:false })
    setTasks(prev => [...prev, { ...created, skippable: created.skippable !== undefined ? created.skippable : true }])
    setNewTask({ time:'', task:'', tags:[], skippable:true })
    setAddingSection(null)
  }

  const onDragStart = id => setDragId(id)
  const onDragOver  = (e, id) => { e.preventDefault(); setDragOverId(id) }
  const onDrop = async targetId => {
    if (dragId === targetId) return
    const arr  = [...tasks]
    const durs = arr.map((t, i) => {
      if (i === arr.length - 1) return 15
      const d = parseTime(arr[i+1].time) - parseTime(t.time)
      return (d > 0 && d <= 180) ? d : 15
    })
    const fi = arr.findIndex(t => t._id === dragId)
    const ti = arr.findIndex(t => t._id === targetId)
    const [mt] = arr.splice(fi, 1); const [md] = durs.splice(fi, 1)
    arr.splice(ti, 0, mt); durs.splice(ti, 0, md)
    let cursor = parseTime(settings.dayStart)
    const newArr = arr.map((t, i) => { const time = fmtTime(cursor); cursor += durs[i]; return { ...t, time, order:i } })
    setTasks(newArr)
    setDragId(null); setDragOverId(null)
    api.batchUpdateTasks('mahi', newArr.map(t => ({ _id: t._id, time: t.time, order: t.order })))
  }

  const applySchedule = (newStart, newEnd) => {
    const oS = parseTime(settings.dayStart), oE = parseTime(settings.dayEnd)
    const nS = parseTime(newStart || settings.dayStart), nE = parseTime(newEnd || settings.dayEnd)
    const oR = oE - oS, nR = nE - nS
    if (oR > 0 && nR > 0) {
      setTasks(prev => prev.map(t => {
        const ratio = Math.max(0, Math.min(1, (parseTime(t.time) - oS) / oR))
        return { ...t, time: fmtTime(Math.round(nS + ratio * nR)) }
      }))
    }
    setSettings(s => ({ ...s, ...(newStart ? { dayStart:newStart } : {}), ...(newEnd ? { dayEnd:newEnd } : {}) }))
  }

  const autoSkip = () => {
    const nd = { ...done }
    tasks.forEach(t => { if (parseTime(t.time) < actualMins && t.skippable) nd[t._id] = true })
    setDone(nd)
  }

  const openMerge = () => {
    const sel = tasks.filter(t => selected.has(t._id)).sort((a,b) => parseTime(a.time)-parseTime(b.time))
    if (sel.length < 2) return
    setMergeForm({ task:sel[0].task, time:sel[0].time, tags:[...new Set(sel.flatMap(t=>t.tags))], skippable:sel.some(t=>t.skippable) })
  }
  const doMerge = async () => {
    if (!mergeForm?.task?.trim()) return
    const insertIdx = tasks.findIndex(t => selected.has(t._id))
    const section   = tasks[insertIdx]?.section || sections[0]
    await Promise.all([...selected].map(id => api.deleteTask('mahi', id)))
    const created = await api.addTask('mahi', { ...mergeForm, section, pinned:false })
    const rest = tasks.filter(t => !selected.has(t._id))
    rest.splice(insertIdx, 0, { ...created, skippable: created.skippable !== undefined ? created.skippable : true })
    setTasks(rest)
    const nd = { ...done }; selected.forEach(id => delete nd[id]); setDone(nd)
    setSelected(new Set()); setSelectMode(false); setMergeForm(null)
  }

  const resetDay = () => { setDone({}); setConfirmReset(false) }
  const resetAll = async () => {
    const fresh = await api.resetTasks('mahi')
    setTasks(Array.isArray(fresh) ? fresh.map(t => ({...t, skippable: t.skippable !== undefined ? t.skippable : !t.pinned})) : [])
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

  const sc = sec => SECTION_COLORS[sec] || { bg:'#f9f9f9', accent:PINK }

  const filterAreas = ['ALL', '⚡ Impact', ...Object.keys(AREA_META)]
  const filtered = tasks.filter(t => {
    const aOk = activeFilter === 'ALL' || (activeFilter === '⚡ Impact' ? t.highImpact : t.tags.includes(activeFilter))
    const sOk = !searchQ || t.task.toLowerCase().includes(searchQ.toLowerCase()) || t.time.includes(searchQ)
    return aOk && sOk
  })

  if (loading) return <div style={{padding:40,textAlign:'center',color:PINK,fontSize:16}}>👗 लोड हो रहा है...</div>

  return (
    <div style={S.root}>
      {error && (
        <div style={{ margin:'12px 14px 0', padding:'12px 16px', background:'#fff3cd', border:'1px solid #f0ad4e', borderRadius:12, fontSize:12, color:'#7b4d00' }}>
          ⚠️ <strong>API Error:</strong> {error}
          <button onClick={() => setError(null)} style={{ float:'right', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#7b4d00' }}>✕</button>
        </div>
      )}
      <header style={{...S.header, background:'linear-gradient(135deg,#c2185b,#880e4f)'}}>
        <div style={S.headerTop}>
          <div>
            <div style={S.headerTitle}>👗 माही अहूजा</div>
            <div style={S.headerSub}>Fashion Entrepreneur • Content Creator</div>
            <div style={{...S.headerSub,color:'#ffb3c6',fontSize:11}}>तुला लग्न • मकर राशि • आर्द्रा नक्षत्र • राहु महादशा</div>
          </div>
          <div style={S.progressCircle}>
            <svg width='56' height='56'>
              <circle cx='28' cy='28' r='23' fill='none' stroke='rgba(255,255,255,0.2)' strokeWidth='4'/>
              <circle cx='28' cy='28' r='23' fill='none' stroke='#ffd700' strokeWidth='4'
                strokeDasharray={`${2*Math.PI*23}`}
                strokeDashoffset={`${2*Math.PI*23*(1-pct/100)}`}
                strokeLinecap='round'
                style={{transform:'rotate(-90deg)',transformOrigin:'28px 28px',transition:'stroke-dashoffset 0.5s'}}/>
              <text x='28' y='33' textAnchor='middle' fill='#ffd700' fontSize='13' fontWeight='bold'>{pct}%</text>
            </svg>
          </div>
        </div>
        <div style={S.progressBar}><div style={{...S.progressFill,width:`${pct}%`}}/></div>
        <div style={S.progressText}>{todayDone} / {todayTotal} tasks complete</div>
      </header>

      <nav style={{...S.nav, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch'}}>
        {[['today','📋 आज'],['weekly','📅 Weekly'],['brand','👗 Brand'],['mantras','🕉️ Mantras'],['outfit','💃 Outfit'],['calendar','📆 Calendar'],['meals','🍽️ Meals']].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{...S.navBtn, whiteSpace:'nowrap', ...(view===v?S.navActive:{})}}>{l}</button>
        ))}
      </nav>

      {view==='today' && <>
        <div style={S.setWrap}>
          <button onClick={()=>setShowSettings(!showSettings)} style={S.setToggle}>
            <span>⚙️ Schedule</span>
            {isLate && <span style={S.latePill}>⏰ Late Mode</span>}
            <span style={{marginLeft:'auto'}}>{showSettings?'▲':'▼'}</span>
          </button>
          {showSettings && (
            <div style={S.setPanel}>
              <div style={S.setRow}>
                <div style={S.setBox}>
                  <div style={S.setLabel}>🌅 Day Start</div>
                  <input type='time' value={to24(settings.dayStart)} onChange={e=>applySchedule(from24(e.target.value),null)} style={S.tInput}/>
                </div>
                <div style={S.setBox}>
                  <div style={S.setLabel}>🌙 Day End</div>
                  <input type='time' value={to24(settings.dayEnd)} onChange={e=>applySchedule(null,from24(e.target.value))} style={S.tInput}/>
                </div>
              </div>
              <div style={S.setLabel}>⏰ Actual Wake-up (if late)</div>
              <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
                <input type='time' value={settings.actualStart?to24(settings.actualStart):''}
                  onChange={e=>setSettings(s=>({...s,actualStart:e.target.value?from24(e.target.value):''}))} style={{...S.tInput,flex:1}}/>
                {settings.actualStart && <button onClick={()=>setSettings(s=>({...s,actualStart:''}))} style={S.clearBtn}>✕ Clear</button>}
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
          <input placeholder='🔍 Search tasks...' value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={S.searchInput}/>
          <button onClick={()=>{setSelectMode(!selectMode);setSelected(new Set());setMergeForm(null)}}
            style={{...S.selBtn,...(selectMode?S.selBtnOn:{})}}>
            {selectMode?'✕ Cancel':'⋈ Merge'}
          </button>
        </div>

        {selectMode && selected.size >= 2 && !mergeForm && (
          <div style={S.mergeBanner}>
            <span style={{fontWeight:700,color:PINK}}>{selected.size} tasks selected</span>
            <button onClick={openMerge} style={S.btnSave}>⊕ Merge into one</button>
          </div>
        )}

        {mergeForm && (
          <div style={S.mergeForm}>
            <div style={S.mergeTitle}>⊕ Merge {selected.size} tasks into one</div>
            <input value={mergeForm.task} onChange={e=>setMergeForm({...mergeForm,task:e.target.value})} style={S.editInput} placeholder='Combined task name...'/>
            <input type='time' value={to24(mergeForm.time)} onChange={e=>setMergeForm({...mergeForm,time:from24(e.target.value)})} style={S.tInput}/>
            <div style={S.editTagRow}>
              {Object.keys(AREA_META).map(a=>(
                <button key={a} onClick={()=>setMergeForm({...mergeForm,tags:mergeForm.tags.includes(a)?mergeForm.tags.filter(x=>x!==a):[...mergeForm.tags,a]})}
                  style={{...S.tagToggle,...(mergeForm.tags.includes(a)?{background:AREA_META[a].color,color:'#fff'}:{})}}>{a}</button>
              ))}
            </div>
            <button onClick={()=>setMergeForm({...mergeForm,skippable:!mergeForm.skippable})}
              style={{...S.skipToggle,...(!mergeForm.skippable?S.skipRequired:{})}}>
              {mergeForm.skippable?'⏭️ Skippable':'⛔ Required'}
            </button>
            <div style={S.editActions}>
              <button onClick={doMerge} style={S.btnSave}>⊕ Merge</button>
              <button onClick={()=>{setMergeForm(null);setSelected(new Set());setSelectMode(false)}} style={S.btnCancel}>✕ Cancel</button>
            </div>
          </div>
        )}

        <div style={S.filterRow}>
          {filterAreas.map(a=>(
            <button key={a} onClick={()=>setActiveFilter(a)}
              style={{...S.filterChip,...(activeFilter===a?{background:a==='ALL'?PINK:a==='⚡ Impact'?'#e65100':(AREA_META[a]?.color||'#333'),color:'#fff'}:{})}}>
              {a==='ALL'?'All':a}
            </button>
          ))}
        </div>

        {sections.map(sec=>{
          const secTasks=filtered.filter(t=>t.section===sec)
          if(!secTasks.length) return null
          const c=sc(sec)
          const secDone=secTasks.filter(t=>done[t._id]).length
          return (
            <div key={sec} style={{...S.section,background:c.bg}}>
              <div style={{...S.secHeader,borderLeftColor:c.accent}}>
                <span style={S.secTitle}>{sec}</span>
                <span style={{...S.secBadge,background:c.accent}}>{secDone}/{secTasks.length}</span>
              </div>
              {secTasks.map(t=>{
                const status=getStatus(t), isSel=selected.has(t._id)
                return (
                  <div key={t._id} draggable={!selectMode}
                    onDragStart={()=>onDragStart(t._id)} onDragOver={e=>onDragOver(e,t._id)} onDrop={()=>onDrop(t._id)}
                    style={{
                      ...S.taskCard,
                      ...(done[t._id]?S.taskDone:{}),
                      ...(status==='skipped'?S.taskSkipped:{}),
                      ...(status==='missed'?S.taskMissed:{}),
                      ...(dragOverId===t._id?S.taskDragOver:{}),
                      ...(isSel?S.taskSelected:{}),
                      borderLeft: t.highImpact ? '4px solid #ffd700' : `4px solid ${status==='missed'?'#b71c1c':c.accent}`,
                    }}>
                    {editingId===t._id?(
                      <div style={S.editBox}>
                        <input ref={editRef} value={editDraft.time} onChange={e=>setEditDraft({...editDraft,time:e.target.value})} style={S.editInput} placeholder='Time'/>
                        <textarea value={editDraft.task} onChange={e=>setEditDraft({...editDraft,task:e.target.value})} style={S.editTextarea} rows={2}/>
                        <div style={S.editTagRow}>
                          {Object.keys(AREA_META).map(a=>(
                            <button key={a} onClick={()=>setEditDraft({...editDraft,tags:editDraft.tags.includes(a)?editDraft.tags.filter(x=>x!==a):[...editDraft.tags,a]})}
                              style={{...S.tagToggle,...(editDraft.tags.includes(a)?{background:AREA_META[a].color,color:'#fff'}:{})}}>{a}</button>
                          ))}
                        </div>
                        <button onClick={()=>setEditDraft({...editDraft,skippable:!editDraft.skippable})}
                          style={{...S.skipToggle,...(!editDraft.skippable?S.skipRequired:{})}}>
                          {editDraft.skippable?'⏭️ Skippable (tap → Required)':'⛔ Required (tap → Skippable)'}
                        </button>
                        <div style={S.editActions}>
                          <button onClick={saveEdit} style={S.btnSave}>💾 Save</button>
                          <button onClick={()=>setEditingId(null)} style={S.btnCancel}>✕</button>
                        </div>
                      </div>
                    ):(
                      <div style={S.taskRow} onClick={()=>toggle(t._id)}>
                        <div style={{...S.checkbox,...((selectMode?isSel:done[t._id])?S.cbDone:{}),borderColor:c.accent}}>
                          {(selectMode?isSel:done[t._id])&&<span style={S.checkMark}>✓</span>}
                        </div>
                        <div style={S.taskContent}>
                          <div style={{...S.taskTime,color:c.accent}}>
                            {t.time} {t.pinned&&'📌'}
                            {t.highImpact && <span style={{fontSize:10,background:'#ffd700',color:'#7b3f00',padding:'1px 5px',borderRadius:6,fontWeight:800}}>⚡ Impact</span>}
                            {!t.skippable&&<span style={S.reqDot}>⛔</span>}
                            {status==='missed'&&<span style={S.missedBadge}>MISSED</span>}
                            {status==='skipped'&&<span style={S.skippedBadge}>⏭️ SKIP</span>}
                          </div>
                          <div style={{...S.taskText,...((done[t._id]||status==='skipped')?S.taskStrike:{})}}>{t.task}</div>
                          <div style={S.tagRow}>
                            {t.tags.map(tag=>(
                              <span key={tag} style={{...S.tag,background:AREA_META[tag]?.bg||'#eee',color:AREA_META[tag]?.color||'#666'}}>{tag} {AREA_META[tag]?.label}</span>
                            ))}
                          </div>
                        </div>
                        {!selectMode&&(
                          <div style={S.taskActions} onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>startEdit(t)} style={S.iconBtn}>✏️</button>
                            <button onClick={()=>deleteTask(t._id)} style={S.iconBtn}>🗑️</button>
                            <span style={S.dragHandle}>⠿</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {!selectMode&&(
                addingSection===sec?(
                  <div style={S.addBox}>
                    <input placeholder='Time (e.g. 9:00 AM)' value={newTask.time} onChange={e=>setNewTask({...newTask,time:e.target.value})} style={S.editInput}/>
                    <input placeholder='Task description...' value={newTask.task} onChange={e=>setNewTask({...newTask,task:e.target.value})} style={S.editInput} onKeyDown={e=>e.key==='Enter'&&addTask(sec)}/>
                    <div style={S.editTagRow}>
                      {Object.keys(AREA_META).map(a=>(
                        <button key={a} onClick={()=>setNewTask({...newTask,tags:newTask.tags.includes(a)?newTask.tags.filter(x=>x!==a):[...newTask.tags,a]})}
                          style={{...S.tagToggle,...(newTask.tags.includes(a)?{background:AREA_META[a].color,color:'#fff'}:{})}}>{a}</button>
                      ))}
                    </div>
                    <button onClick={()=>setNewTask({...newTask,skippable:!newTask.skippable})}
                      style={{...S.skipToggle,...(!newTask.skippable?S.skipRequired:{})}}>
                      {newTask.skippable?'⏭️ Skippable':'⛔ Required'}
                    </button>
                    <div style={S.editActions}>
                      <button onClick={()=>addTask(sec)} style={S.btnSave}>➕ Add</button>
                      <button onClick={()=>setAddingSection(null)} style={S.btnCancel}>✕</button>
                    </div>
                  </div>
                ):(
                  <button onClick={()=>setAddingSection(sec)} style={{...S.addTaskBtn,color:c.accent}}>+ Add task</button>
                )
              )}
            </div>
          )
        })}

        <div style={S.resetRow}>
          {!confirmReset?(
            <>
              <button onClick={()=>setConfirmReset('day')} style={S.btnReset}>🔄 Reset Today</button>
              <button onClick={()=>setConfirmReset('all')} style={S.btnResetAll}>♻️ Reset All</button>
            </>
          ):(
            <div style={S.confirmBox}>
              <p>{confirmReset==='day'?'Reset checkmarks?':'Reset ALL data?'}</p>
              <button onClick={confirmReset==='day'?resetDay:resetAll} style={S.btnSave}>Yes</button>
              <button onClick={()=>setConfirmReset(false)} style={S.btnCancel}>No</button>
            </div>
          )}
        </div>
      </>}

      {view==='weekly'  && <MahiWeekly weeklyPlan={weeklyPlan} />}
      {view==='brand'   && <MahiBrand milestones={milestones} brandTips={brandTips} />}
      {view==='mantras' && <MahiMantras mantras={mantras} />}

      {view==='outfit' && (() => {
        const dc = dayColors.find(c => c.dayIndex === new Date().getDay()) || {}
        const tip = outfitTips.find(t => t.dayIndex === new Date().getDay())?.tip || ''
        return (
          <div style={{padding:'16px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:PINK,marginBottom:4}}>💃 आज का Outfit — माही</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>Vedic Astrology based daily color guide</div>
            {dc.color && (
              <>
                <div style={{background:`linear-gradient(135deg,${dc.color},${dc.color}cc)`,borderRadius:16,padding:20,color:'#fff',marginBottom:16,textAlign:'center'}}>
                  <div style={{fontSize:28,marginBottom:4}}>{dc.god}</div>
                  <div style={{fontSize:16,fontWeight:800}}>{dc.day} — {dc.en}</div>
                  <div style={{fontSize:22,fontWeight:900,marginTop:8,marginBottom:4}}>{dc.name}</div>
                  <div style={{fontSize:13,opacity:0.9}}>आज का शुभ रंग</div>
                </div>
                <div style={{background:'#fff',borderRadius:16,padding:16,marginBottom:12,border:'2px solid #eee'}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:10}}>👗 Outfit Suggestions:</div>
                  {(dc.outfits||[]).map((o,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:i<(dc.outfits||[]).length-1?'1px solid #f0f0f0':'none'}}>
                      <div style={{width:12,height:12,borderRadius:'50%',background:dc.color,flexShrink:0}}/>
                      <span style={{fontSize:14}}>{o}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {tip && (
              <div style={{background:'#fdf5f7',borderRadius:16,padding:16,marginBottom:12,border:`2px solid ${PINK}`}}>
                <div style={{fontSize:13,fontWeight:700,color:'#7b0000',marginBottom:6}}>🌟 Personal Tip — Rahu Dasha + Tula Lagna:</div>
                <div style={{fontSize:13,color:'#333',lineHeight:1.6}}>{tip}</div>
              </div>
            )}
            {dc.avoid && (
              <div style={{background:'#fff0f0',borderRadius:12,padding:12,border:'1px solid #ffcdd2'}}>
                <div style={{fontSize:13,fontWeight:700,color:'#c62828',marginBottom:4}}>❌ आज Avoid करें:</div>
                <div style={{fontSize:13,color:'#555'}}>{dc.avoid}</div>
              </div>
            )}
          </div>
        )
      })()}

      {view==='calendar' && (
        <CalendarView
          calEvents={calEvents}
          calInput={calInput}
          setCalInput={setCalInput}
          addCalEvent={addCalEvent}
          deleteCalEvent={deleteCalEvent}
          accentColor={PINK}
        />
      )}

      {view==='meals' && (() => {
        const todayIdx = new Date().getDay()
        const meal = meals.find(m => m.dayIndex === todayIdx) || {}
        return (
          <div style={{padding:'16px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:PINK,marginBottom:4}}>🍽️ Meals — माही</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>NIFT prep + Growing age + Rahu Dasha आधारित</div>
            {meal.tip && (
              <div style={{background:`linear-gradient(135deg,${PINK},${DPINK})`,borderRadius:16,padding:16,color:'#fff',marginBottom:16}}>
                <div style={{fontSize:13,opacity:0.9}}>आज: {meal.day}</div>
                <div style={{fontSize:15,fontWeight:800,marginTop:4}}>{meal.tip}</div>
              </div>
            )}
            {meal.breakfast && [['🌅 नाश्ता (Breakfast)',meal.breakfast,'7:15 AM'],['🍛 दोपहर का खाना (Lunch)',meal.lunch,'12:00 PM'],['🌙 रात का खाना (Dinner)',meal.dinner,'7:00 PM']].map(([title,content,time])=>(
              <div key={title} style={{background:'#fff',borderRadius:12,padding:16,marginBottom:12,border:'1px solid #eee'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:700}}>{title}</div>
                  <div style={{fontSize:11,color:PINK,fontWeight:600}}>{time}</div>
                </div>
                <div style={{fontSize:13,color:'#444',lineHeight:1.6}}>{content}</div>
              </div>
            ))}
            <div style={{background:'#fce4ec',borderRadius:12,padding:12,border:`1px solid ${DPINK}`}}>
              <div style={{fontSize:12,fontWeight:700,color:DPINK,marginBottom:6}}>🎯 NIFT Prep Brain Food:</div>
              <div style={{fontSize:12,color:'#555',lineHeight:1.8}}>✅ बादाम 5-8 रोज (Memory + Focus){'\n'}✅ हरी सब्जी daily (Creativity){'\n'}✅ दूध रात को (Sleep quality){'\n'}✅ पानी 8 गिलास (Eye + Skin){'\n'}❌ Junk food avoid (Energy crash)</div>
            </div>
            <div style={{marginTop:16}}>
              <div style={{fontSize:13,fontWeight:700,color:'#555',marginBottom:8}}>📅 Weekly Meal Plan</div>
              {meals.map((m,i)=>(
                <div key={m.dayIndex??i} style={{background:m.dayIndex===todayIdx?'#fdf5f7':'#f9f9f9',border:`1px solid ${m.dayIndex===todayIdx?PINK:'#eee'}`,borderRadius:10,padding:10,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:800,color:m.dayIndex===todayIdx?PINK:'#333',marginBottom:4}}>{m.day} {m.dayIndex===todayIdx?'← आज':''}</div>
                  <div style={{fontSize:11,color:'#666'}}>{m.breakfast}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {showCelebrate&&(
        <div style={S.celebOverlay} onClick={()=>setShowCelebrate(false)}>
          <div style={S.celebBox}>
            <div style={{fontSize:60,marginBottom:8}}>🌟</div>
            <div style={{...S.celebTitle,color:PINK}}>शाबाश माही!</div>
            <div style={{fontSize:16,color:'#555',marginBottom:8}}>आज का पूरा Routine complete किया!</div>
            <div style={{fontSize:15,color:DPINK,fontWeight:600,fontStyle:'italic',marginBottom:16}}>&quot;Gondia की माही — India की अगली बड़ी Fashion Entrepreneur&quot; 👗</div>
            <button onClick={()=>setShowCelebrate(false)} style={S.btnSave}>🌸 जय सरस्वती माँ</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MahiWeekly({ weeklyPlan }) {
  return (
    <div style={{padding:'10px 10px 20px'}}>
      {weeklyPlan.map((d,i)=>(
        <div key={d.day||i} style={{background:'#fff',borderRadius:14,padding:'14px 16px',marginBottom:10,borderTop:`4px solid ${d.color||PINK}`,boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:16,fontWeight:800,color:d.color||PINK,marginBottom:4}}>{d.day}</div>
          <div style={{fontSize:13,fontWeight:700,color:'#333',marginBottom:6}}>{d.focus}</div>
          {d.tip && <div style={{fontSize:12,color:'#555',marginBottom:3}}>💡 {d.tip}</div>}
          {d.remedy && <div style={{fontSize:12,color:'#888'}}>🕉️ {d.remedy}</div>}
        </div>
      ))}
    </div>
  )
}

function MahiBrand({ milestones, brandTips }) {
  return (
    <div style={{padding:'10px 10px 20px'}}>
      <div style={{fontSize:16,fontWeight:800,color:DPINK,textAlign:'center',padding:'8px 0 12px'}}>👗 Fashion Brand Roadmap</div>
      {milestones.map((m,i)=>(
        <div key={i} style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:8,borderLeft:`4px solid ${m.color||DPINK}`,boxShadow:'0 1px 5px rgba(0,0,0,0.06)',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{fontSize:24}}>{m.status}</div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:m.color||DPINK,marginBottom:2}}>{m.year}</div>
            <div style={{fontSize:13,color:'#222'}}>{m.goal}</div>
          </div>
        </div>
      ))}
      <div style={{fontSize:16,fontWeight:800,color:DPINK,textAlign:'center',padding:'12px 0 8px'}}>💡 Brand Tips</div>
      {brandTips.map((t,i)=>(
        <div key={i} style={{background:'#fce4ec',borderRadius:10,padding:'10px 14px',marginBottom:6,fontSize:12,color:DPINK,fontWeight:600}}>✨ {t.tip}</div>
      ))}
    </div>
  )
}

function MahiMantras({ mantras }) {
  return (
    <div style={{padding:'10px 10px 20px'}}>
      <div style={{fontSize:16,fontWeight:800,color:DPINK,textAlign:'center',padding:'8px 0 12px'}}>🕉️ माही के Mantras</div>
      {mantras.map((m,i)=>(
        <div key={i} style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:8,borderLeft:`4px solid ${m.color||DPINK}`,boxShadow:'0 1px 5px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:11,fontWeight:800,color:m.color||DPINK,marginBottom:3}}>{m.when}</div>
          <div style={{fontSize:14,fontWeight:700,color:'#222',marginBottom:3}}>{m.mantra}</div>
          <div style={{fontSize:11,color:'#666'}}>✨ {m.benefit}</div>
        </div>
      ))}
      <div style={{background:'linear-gradient(135deg,#fce4ec,#f3e5f5)',border:`2px solid ${PINK}`,borderRadius:14,padding:18,marginTop:12,textAlign:'center'}}>
        <div style={{fontSize:14,fontWeight:700,color:DPINK,lineHeight:1.6}}>&quot;Gondia की माही</div>
        <div style={{fontSize:14,fontWeight:700,color:DPINK,lineHeight:1.6}}>India की अगली बड़ी Fashion Entrepreneur&quot; 🌟</div>
        <div style={{fontSize:12,color:PINK,marginTop:8,fontWeight:600}}>🌸 ॐ ऐं सरस्वत्यै नमः</div>
      </div>
    </div>
  )
}

const S = {
  root:        { fontFamily:"'Noto Sans Devanagari','Segoe UI',sans-serif", background:'#fdf5f7', minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:40 },
  header:      { padding:'20px 16px 12px', color:'#fff' },
  headerTop:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  headerTitle: { fontSize:26, fontWeight:700, letterSpacing:0.5 },
  headerSub:   { fontSize:15, opacity:0.85, marginTop:2 },
  progressCircle: { flexShrink:0 },
  progressBar:  { background:'rgba(255,255,255,0.2)', borderRadius:8, height:7, overflow:'hidden' },
  progressFill: { background:'#ffd700', height:'100%', borderRadius:8, transition:'width 0.4s' },
  progressText: { fontSize:13, opacity:0.85, marginTop:5, textAlign:'right' },
  nav:          { display:'flex', background:'#fff', borderBottom:'2px solid #f8e0e8', position:'sticky', top:0, zIndex:10 },
  navBtn:       { flex:1, padding:'13px 4px', border:'none', background:'transparent', fontSize:13, fontWeight:600, color:'#888', cursor:'pointer' },
  navActive:    { color:PINK, borderBottom:`3px solid ${PINK}` },
  setWrap:      { margin:'8px 10px 0', borderRadius:12, overflow:'hidden', border:'1.5px solid #f0c0d0' },
  setToggle:    { width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fdf5f7', border:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:PINK },
  latePill:     { background:'#ff9800', color:'#fff', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 },
  setPanel:     { background:'#fdf5f7', padding:'10px 14px 14px', borderTop:'1px solid #f0c0d0' },
  setRow:       { display:'flex', gap:12, marginBottom:12 },
  setBox:       { flex:1 },
  setLabel:     { fontSize:12, color:'#888', fontWeight:700, marginBottom:4 },
  tInput:       { padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', background:'#fff' },
  clearBtn:     { padding:'7px 12px', background:'#eee', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' },
  lateInfo:     { display:'flex', flexWrap:'wrap', gap:6, marginTop:8, alignItems:'center' },
  missedPill:   { background:'#b71c1c', color:'#fff', borderRadius:8, padding:'3px 8px', fontSize:12, fontWeight:700 },
  skippedPill:  { background:'#ff9800', color:'#fff', borderRadius:8, padding:'3px 8px', fontSize:12, fontWeight:700 },
  autoSkipBtn:  { padding:'6px 12px', background:'#fff', border:`1.5px solid ${PINK}`, color:PINK, borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:12 },
  toolBar:      { padding:'10px 12px 4px', display:'flex', gap:8, alignItems:'center' },
  searchInput:  { flex:1, padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:10, fontSize:15, outline:'none', background:'#fff', boxSizing:'border-box' },
  selBtn:       { padding:'9px 14px', background:'#fff', border:'1.5px solid #ddd', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', color:'#555', whiteSpace:'nowrap' },
  selBtnOn:     { background:PINK, color:'#fff', border:`1.5px solid ${PINK}` },
  mergeBanner:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#fce4ec', margin:'4px 10px', borderRadius:10, border:`1.5px solid ${PINK}` },
  mergeForm:    { margin:'4px 10px 8px', background:'#fff', border:`1.5px solid ${PINK}`, borderRadius:12, padding:'14px', display:'flex', flexDirection:'column', gap:8 },
  mergeTitle:   { fontSize:15, fontWeight:700, color:PINK },
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
  taskDragOver: { background:'#fce4ec', boxShadow:`inset 0 0 0 2px ${PINK}` },
  taskSelected: { background:'#fce4ec' },
  taskRow:      { display:'flex', alignItems:'flex-start', gap:10, padding:'12px 12px', cursor:'pointer' },
  checkbox:     { width:24, height:24, border:'2px solid', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2, transition:'all 0.2s' },
  cbDone:       { background:PINK, borderColor:PINK },
  checkMark:    { color:'#fff', fontSize:15, fontWeight:700 },
  taskContent:  { flex:1, minWidth:0 },
  taskTime:     { fontSize:13, fontWeight:700, marginBottom:3, display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 },
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
  skipToggle:   { padding:'8px 12px', background:'#fce4ec', border:`1.5px solid ${PINK}`, borderRadius:8, fontSize:13, cursor:'pointer', color:DPINK, fontWeight:600, textAlign:'left', width:'100%' },
  skipRequired: { background:'#fce4ec', border:'1.5px solid #b71c1c', color:'#b71c1c' },
  editActions:  { display:'flex', gap:8 },
  btnSave:      { padding:'10px 18px', background:PINK, color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:15 },
  btnCancel:    { padding:'10px 16px', background:'#eee', color:'#555', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:15 },
  addBox:       { padding:'10px 12px', background:'#fff9fb', display:'flex', flexDirection:'column', gap:8 },
  addTaskBtn:   { width:'100%', padding:'11px', background:'none', border:'none', cursor:'pointer', fontSize:15, fontWeight:600, textAlign:'center' },
  resetRow:     { display:'flex', gap:10, justifyContent:'center', padding:'20px 16px 0' },
  btnReset:     { padding:'10px 20px', background:'#fff', border:`1.5px solid ${PINK}`, color:PINK, borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:15 },
  btnResetAll:  { padding:'10px 20px', background:'#fff', border:'1.5px solid #b71c1c', color:'#b71c1c', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:15 },
  confirmBox:   { background:'#fff', padding:14, borderRadius:12, textAlign:'center', border:'1.5px solid #ddd', display:'flex', flexDirection:'column', gap:8, alignItems:'center' },
  celebOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  celebBox:     { background:'#fff', borderRadius:20, padding:28, textAlign:'center', maxWidth:320, margin:16 },
  celebTitle:   { fontSize:24, fontWeight:800, marginBottom:4 },
}
