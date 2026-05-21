import { useState, useEffect, useRef } from 'react'

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

// ── Family Calendar (shared across all members)
const FAMILY_CAL_KEY = 'family_calendar_v1'
const DEFAULT_CAL_EVENTS = [
  { id:1,  date:'01-12', label:'🧁 किर्ती का जन्मदिन' },
  { id:2,  date:'01-31', label:'💞 भूमि-मुकेश Anniversary' },
  { id:3,  date:'02-03', label:'💞 किर्ती-संजू Anniversary' },
  { id:4,  date:'03-16', label:'🧁 अनिता जन्मदिन' },
  { id:5,  date:'03-22', label:'🧁 सपना जन्मदिन' },
  { id:6,  date:'10-09', label:'🧁 संजू का जन्मदिन' },
  { id:7,  date:'12-06', label:'🧁 भूमि जन्मदिन' },
  { id:8,  date:'12-19', label:'💞 सपना-अमर Anniversary' },
  { id:9,  date:'12-30', label:'🧁 तम्मना जन्मदिन' },
]
function loadCalEvents() {
  try { const s = localStorage.getItem(FAMILY_CAL_KEY); if (s) return JSON.parse(s) } catch {}
  return DEFAULT_CAL_EVENTS
}
function saveCalEvents(ev) {
  try { localStorage.setItem(FAMILY_CAL_KEY, JSON.stringify(ev)) } catch {}
}
function parseCalText(text) {
  const MONTHS = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12}
  return text.trim().split('\n').filter(l=>l.trim()).map((line,i)=>{
    const parts = line.trim().split(/\s+/)
    const day = parseInt(parts[0])
    const month = MONTHS[parts[1]?.toLowerCase()]
    if(!day||!month) return null
    const label = parts.slice(2).join(' ').trim()
    if(!label) return null
    return { id: Date.now()+i, date:`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, label }
  }).filter(Boolean)
}

// ── Day Colors (Vedic Astrology weekday lords)
const DAY_COLORS = [
  { day:'रविवार',   en:'Sunday',    color:'#d46a10', name:'नारंगी / सुनहरा', god:'☀️ सूर्य', outfits:['Orange kurta / shirt','Copper accessories','Golden dupatta / tie'], avoid:'काला / नेवी नीला' },
  { day:'सोमवार',   en:'Monday',    color:'#90a4ae', name:'सफेद / क्रीम / सिल्वर', god:'🌙 चंद्र', outfits:['White kurta / shirt','Cream colored outfit','Silver accessories'], avoid:'काला / गाढ़ा लाल' },
  { day:'मंगलवार',  en:'Tuesday',   color:'#c62828', name:'लाल / गुलाबी / कोरल', god:'🔴 मंगल', outfits:['Red kurta / shirt','Coral combination','Pink accessories'], avoid:'हरा / सफेद' },
  { day:'बुधवार',   en:'Wednesday', color:'#2e7d32', name:'हरा / Grass Green', god:'💚 बुध', outfits:['Green kurta / shirt','Olive combination','Jade accessories'], avoid:'लाल / नारंगी' },
  { day:'गुरुवार',  en:'Thursday',  color:'#f9a825', name:'पीला / केसरी / सुनहरा', god:'🟡 बृहस्पति', outfits:['Yellow kurta / shirt','Saffron combination','Gold accessories'], avoid:'काला / नेवी' },
  { day:'शुक्रवार', en:'Friday',    color:'#e91e63', name:'सफेद / गुलाबी / हल्का नीला', god:'🌸 शुक्र', outfits:['White or pink outfit','Light blue combination','Diamond / pearl accessories'], avoid:'काला / गाढ़ा' },
  { day:'शनिवार',   en:'Saturday',  color:'#263238', name:'काला / नेवी नीला / बैंगनी', god:'🪐 शनि', outfits:['Black / dark blue kurta','Navy combination','Iron / dark accessories'], avoid:'नारंगी / लाल' },
]

// ── Mahi-specific data
const MAHI_MEALS = [
  { id:0, day:'रविवार',   breakfast:'बादाम 5 + दूध + ओट्स + केला (Brain food Sunday)',        lunch:'2 रोटी + पनीर सब्जी + सलाद',        dinner:'दाल चावल + दूध (हल्का)',     tip:'☀️ Creativity day — NIFT sketching के लिए rest!' },
  { id:1, day:'सोमवार',   breakfast:'अंडा + Brown bread 2 + 1 गिलास दूध',                      lunch:'2 रोटी + दाल + हरी सब्जी + सलाद',  dinner:'खिचड़ी + दही',               tip:'🌙 Focus Monday — Design aptitude study करें' },
  { id:2, day:'मंगलवार',  breakfast:'बादाम 8 + Fruit bowl + Milk',                               lunch:'2 रोटी + Rajma / Chhole + सलाद',   dinner:'वेजिटेबल सूप + रोटी',        tip:'🔴 Energy day — Portfolio sketch करें!' },
  { id:3, day:'बुधवार',   breakfast:'Sprouts + Fruit + Green tea (Budh = Intelligence)',          lunch:'2 रोटी + पालक पनीर + दाल',         dinner:'मूंग दाल + चावल',             tip:'💚 Budh Wednesday = Best day for Fashion study + Instagram!' },
  { id:4, day:'गुरुवार',  breakfast:'Banana shake + बेसन चीला 1',                               lunch:'2 रोटी + चना दाल + आलू-गोभी',      dinner:'दाल सूप + 1 रोटी',            tip:'🟡 Wisdom Thursday — GK + Fashion History पढ़ें' },
  { id:5, day:'शुक्रवार', breakfast:'Mango / Fruit smoothie + 2 Toast + Egg',                   lunch:'2 रोटी + Paneer / Soya + सलाद',    dinner:'रागी khichdi + दही',           tip:'🌸 SHUKRA Friday = Best Instagram Post Day! Fashion content + 1000+ followers to 10k!' },
  { id:6, day:'शनिवार',   breakfast:'Poha + Banana + Milk',                                       lunch:'2 रोटी + Mix Veg + दाल',           dinner:'दलिया + दूध',                  tip:'🪐 Saturday = Mock Test day + Portfolio review!' },
]

const MAHI_DAY_TIPS = [
  'Tula Lagna = Light Blue/Pink. Sunday = Sketch + rest day. Orange accessories for creativity boost!',
  'सोमवार = White outfit = Clean, Focused look. Design aptitude day — wear white for concentration।',
  'मंगलवार = Red elements. Rahu Dasha में bold colors = confidence. Wear a Red accessory today!',
  'बुधवार = Green! Instagram content में भी green accents trending। Best day for Brand content creation!',
  'गुरुवार = Yellow/Saffron dupatta या accessories। Saraswati + Guru blessing for NIFT prep!',
  '🔥 शुक्रवार = Shukra = YOUR POWER DAY! Pink / White OOTD post करो। Max engagement आएगा! 1000+ to 10k!',
  'शनिवार = Black / Navy accents. Sophisticated look = Fashion Entrepreneur vibes! Mock test + portfolio!',
]

const MAHI_TASKS = [
  // 🌅 सुबह — Spiritual (6:00 - 6:30 AM)
  { id:1,  section:'🌅 सुबह — Spiritual', time:'6:00 AM', task:'उठें — Phone नहीं (Rahu Dasha = Discipline आपका सबसे बड़ा हथियार है)', tags:['🕉️'], pinned:false, skippable:false, highImpact:false },
  { id:2,  section:'🌅 सुबह — Spiritual', time:'6:05 AM', task:'गुनगुना पानी + माँ के साथ तुलसी पूजा — Family bond + Spiritual start', tags:['🏥','🕉️','❤️'], pinned:true, skippable:false, highImpact:false },
  { id:4,  section:'🌅 सुबह — Spiritual', time:'6:15 AM', task:"'ॐ ऐं सरस्वत्यै नमः' 21 बार + 'ॐ शुं शुक्राय नमः' 21 बार (NIFT + Fashion)", tags:['🕉️','📚','👗'], pinned:false, skippable:false, highImpact:false },
  { id:6,  section:'🌅 सुबह — Spiritual', time:'6:30 AM', task:'Journaling — आज के 3 NIFT Goals + 1 Fashion Design Idea लिखें', tags:['🧠','🎨'], pinned:true, skippable:false, highImpact:true },
  // 💪 Yoga + Morning Exercise (6:45 - 7:15 AM)
  { id:7,  section:'💪 Yoga + Morning Exercise', time:'6:45 AM', task:'Yoga — सूर्य नमस्कार 6 बार + Vrikshasana + Trikonasana (15 min)', tags:['🏥','💪'], pinned:false, skippable:false, highImpact:false },
  { id:9,  section:'💪 Yoga + Morning Exercise', time:'7:00 AM', task:'Pranayama — अनुलोम विलोम 5 मिनट + Stretch (Focus + Calm = NIFT Exam Ready)', tags:['🏥','🧠'], pinned:false, skippable:true, highImpact:false },
  // 🍽️ नाश्ता + तैयारी (7:15 - 7:30 AM)
  { id:11, section:'🍽️ नाश्ता + तैयारी', time:'7:15 AM', task:'नाश्ता — पौष्टिक: बादाम 5 + अंडा/पनीर + दूध + Fruit (Brain food for NIFT prep)', tags:['🏥'], pinned:true, skippable:false, highImpact:false },
  { id:13, section:'🍽️ नाश्ता + तैयारी', time:'7:30 AM', task:'आज का Outfit Plan — 2 मिनट fashion practice (You are a Fashion Entrepreneur!)', tags:['👗'], pinned:false, skippable:true, highImpact:false },
  // 🎓 NIFT — Entrance Preparation (7:45 AM - 12:00 PM)
  { id:21, section:'🎓 NIFT — Entrance Preparation', time:'7:45 AM', task:'NIFT DEEP STUDY — Design Aptitude: Shapes, Pattern, Composition, 2D/3D (30 min)', tags:['🎨','📚'], pinned:true, skippable:false, highImpact:true },
  { id:22, section:'🎓 NIFT — Entrance Preparation', time:'8:15 AM', task:'Fashion Sketching — 1 Complete Figure + Garment Details (25 min, Portfolio build)', tags:['🎨','👗'], pinned:false, skippable:false, highImpact:true },
  { id:23, section:'🎓 NIFT — Entrance Preparation', time:'8:45 AM', task:'English — Reading Comprehension + Vocabulary (20 min, NIFT written test)', tags:['📚','🧠'], pinned:false, skippable:false, highImpact:false },
  { id:24, section:'🎓 NIFT — Entrance Preparation', time:'9:15 AM', task:'GK + Fashion History — Current Affairs + Art History + Designers (20 min)', tags:['📚','🧠'], pinned:false, skippable:false, highImpact:false },
  { id:25, section:'🎓 NIFT — Entrance Preparation', time:'9:45 AM', task:'Situation Test Practice — Draping / Material Handling / 3D creation (30 min)', tags:['🎨','💪'], pinned:false, skippable:true, highImpact:false },
  { id:26, section:'🎓 NIFT — Entrance Preparation', time:'10:15 AM', task:'NIFT Mock Test — Previous Year Paper Section (25 min, Time yourself)', tags:['📚'], pinned:false, skippable:true, highImpact:true },
  { id:19, section:'🎓 NIFT — Entrance Preparation', time:'10:45 AM', task:'Break + Healthy Snack + पानी + 5 min Eyes Rest (आंखें NIFT के लिए precious)', tags:['🏥'], pinned:false, skippable:false, highImpact:false },
  { id:20, section:'🎓 NIFT — Entrance Preparation', time:'11:00 AM', task:'NIFT Study Revision — Morning का सब Revise करें + 1 Sketch Portfolio entry', tags:['🎨','📚'], pinned:false, skippable:true, highImpact:false },
  // 🏫 Coaching Classes (12:00 PM - 2:00 PM)
  { id:18, section:'🏫 Coaching Classes', time:'12:00 PM', task:'Lunch — पोषण = Energy = NIFT performance (घर का खाना, पूरा खाएं)', tags:['🏥'], pinned:true, skippable:false, highImpact:false },
  { id:27, section:'🏫 Coaching Classes', time:'12:30 PM', task:'Coaching Class — पूरे ध्यान से, Front पर बैठें, Notes लें (Hacks from teacher!)', tags:['📚','🧠'], pinned:true, skippable:false, highImpact:true },
  { id:28, section:'🏫 Coaching Classes', time:'2:00 PM', task:'Coaching Homework — उसी दिन करें (3 दिन बाद काम का नहीं रहता)', tags:['📚'], pinned:false, skippable:true, highImpact:false },
  { id:29, section:'🏫 Coaching Classes', time:'2:15 PM', task:'Coaching Notes Revise — 15 min (Spaced repetition = NIFT rank improve)', tags:['📚','🧠'], pinned:false, skippable:true, highImpact:false },
  // 🎨 Creative Block (2:30 - 5:30 PM)
  { id:30, section:'🎨 Creative Block', time:'2:30 PM', task:'Fashion Research — Pinterest, Vogue India, Masaba, Raw Mango (20 min)', tags:['👗','🎨'], pinned:false, skippable:true, highImpact:false },
  { id:32, section:'🎨 Creative Block', time:'2:45 PM', task:'Mood Board Update — Canva या Sketch Book (NIFT Exam Portfolio के लिए)', tags:['🎨','👗'], pinned:false, skippable:true, highImpact:false },
  { id:33, section:'🎨 Creative Block', time:'3:00 PM', task:'1 NIFT Design Sketch — Original, Date लिखें, Portfolio में Add करें', tags:['🎨','👗'], pinned:false, skippable:true, highImpact:true },
  { id:36, section:'🎨 Creative Block', time:'3:15 PM', task:'Cousin के साथ Fashion Brand call — हफ्ते में 1 बार (Brand = Future)', tags:['📱','❤️'], pinned:false, skippable:true, highImpact:false },
  // 📱 Instagram + Brand (3:30 - 5:30 PM)
  { id:34, section:'📱 Instagram + Brand', time:'3:30 PM', task:'Instagram Content Plan — 1 Reel / Post Idea (Already 1000+ Followers! Grow to 10k)', tags:['📱','🎨'], pinned:false, skippable:true, highImpact:true },
  { id:35, section:'📱 Instagram + Brand', time:'3:45 PM', task:'Content Create — Photo / Video / Reel (शुक्रवार = Best post day for Shukra)', tags:['📱'], pinned:false, skippable:true, highImpact:false },
  { id:31, section:'📱 Instagram + Brand', time:'4:00 PM', task:'Engage with followers — Reply to comments + DMs (Community build करें)', tags:['📱'], pinned:false, skippable:true, highImpact:false },
  // ❤️ परिवार + Grounding (5:30 - 8:00 PM)
  { id:37, section:'❤️ परिवार + Grounding', time:'5:30 PM', task:'माँ के साथ बगीचे में — 15 मिनट (Grounding रोज़ = Rahu Dasha में anchor)', tags:['❤️','🏥'], pinned:true, skippable:false, highImpact:false },
  { id:38, section:'❤️ परिवार + Grounding', time:'5:45 PM', task:'Papa के साथ — NIFT progress + Business insight (Papa = Best Mentor)', tags:['❤️'], pinned:false, skippable:true, highImpact:false },
  { id:40, section:'❤️ परिवार + Grounding', time:'7:00 PM', task:'Family Dinner — तीनों साथ, Phone नहीं, 1 Gratitude बात सबसे', tags:['❤️','🏥'], pinned:true, skippable:false, highImpact:true },
  // 🌙 रात — Wind Down (8:00 - 9:30 PM)
  { id:42, section:'🌙 रात — Wind Down', time:'8:00 PM', task:'कल का NIFT Study Plan — Topic, Time Block, Target (Written plan = 80% done)', tags:['📚','🧠'], pinned:true, skippable:false, highImpact:true },
  { id:43, section:'🌙 रात — Wind Down', time:'8:15 PM', task:'Fashion / Design Book पढ़ें — 15 min (Screen नहीं, Actual book)', tags:['📚','👗'], pinned:false, skippable:true, highImpact:false },
  { id:44, section:'🌙 रात — Wind Down', time:'8:30 PM', task:'Gratitude Journal — आज 3 अच्छी बातें + कल के 3 NIFT Goals', tags:['🕉️','🧠'], pinned:false, skippable:true, highImpact:false },
  { id:45, section:'🌙 रात — Wind Down', time:'8:45 PM', task:'Screen Time बंद + माँ को Good Night (आंखें + Connection रोज़)', tags:['🏥','❤️'], pinned:true, skippable:false, highImpact:false },
  { id:47, section:'🌙 रात — Wind Down', time:'9:00 PM', task:"'ॐ ऐं सरस्वत्यै नमः' 5 बार (सोने से पहले, NIFT में Saraswati की कृपा)", tags:['🕉️'], pinned:false, skippable:true, highImpact:false },
  { id:48, section:'🌙 रात — Wind Down', time:'9:30 PM', task:'सोएं — 8-9 घंटे (Growing age + NIFT prep = Fresh brain daily ज़रूरी)', tags:['🏥'], pinned:true, skippable:false, highImpact:false },
]

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

const STORAGE_KEY = 'mahi_routine_v1'
const DEF_SETTINGS = { dayStart:'6:00 AM', dayEnd:'9:30 PM', actualStart:'' }

function loadState() {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s) } catch {}
  return null
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

export default function MahiRoutine() {
  const saved = loadState()
  const [tasks, setTasks] = useState(() =>
    (saved?.tasks || MAHI_TASKS).map(t => ({ ...t, skippable: t.skippable !== undefined ? t.skippable : !t.pinned }))
  )
  const [done, setDone]         = useState(saved?.done     || {})
  const [settings, setSettings] = useState(saved?.settings || DEF_SETTINGS)
  const [view, setView]         = useState('today')
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
  const [calEvents, setCalEvents] = useState(loadCalEvents)
  const [calInput,  setCalInput]  = useState('')
  const editRef = useRef(null)

  useEffect(() => { saveState({ tasks, done, settings }) }, [tasks, done, settings])
  useEffect(() => { saveCalEvents(calEvents) }, [calEvents])

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
    setEditingId(t.id)
    setEditDraft({ time:t.time, task:t.task, tags:[...t.tags], skippable: t.skippable !== false })
    setTimeout(() => editRef.current?.focus(), 50)
  }
  const saveEdit = () => { setTasks(tasks.map(t => t.id === editingId ? { ...t, ...editDraft } : t)); setEditingId(null) }
  const deleteTask = id => {
    setTasks(tasks.filter(t => t.id !== id))
    const nd = { ...done }; delete nd[id]; setDone(nd)
  }
  const addTask = section => {
    if (!newTask.task.trim()) return
    setTasks([...tasks, { id:Date.now(), section, ...newTask, pinned:false }])
    setNewTask({ time:'', task:'', tags:[], skippable:true })
    setAddingSection(null)
  }

  const onDragStart = id => setDragId(id)
  const onDragOver  = (e, id) => { e.preventDefault(); setDragOverId(id) }
  const onDrop = targetId => {
    if (dragId === targetId) return
    const arr  = [...tasks]
    const durs = arr.map((t, i) => {
      if (i === arr.length - 1) return 15
      const d = parseTime(arr[i+1].time) - parseTime(t.time)
      return (d > 0 && d <= 180) ? d : 15
    })
    const fi = arr.findIndex(t => t.id === dragId)
    const ti = arr.findIndex(t => t.id === targetId)
    const [mt] = arr.splice(fi, 1); const [md] = durs.splice(fi, 1)
    arr.splice(ti, 0, mt); durs.splice(ti, 0, md)
    let cursor = parseTime(settings.dayStart)
    setTasks(arr.map((t, i) => { const time = fmtTime(cursor); cursor += durs[i]; return { ...t, time } }))
    setDragId(null); setDragOverId(null)
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
    tasks.forEach(t => { if (parseTime(t.time) < actualMins && t.skippable) nd[t.id] = true })
    setDone(nd)
  }

  const openMerge = () => {
    const sel = tasks.filter(t => selected.has(t.id)).sort((a,b) => parseTime(a.time)-parseTime(b.time))
    if (sel.length < 2) return
    setMergeForm({ task:sel[0].task, time:sel[0].time, tags:[...new Set(sel.flatMap(t=>t.tags))], skippable:sel.some(t=>t.skippable) })
  }
  const doMerge = () => {
    if (!mergeForm?.task?.trim()) return
    const insertIdx = tasks.findIndex(t => selected.has(t.id))
    const section   = tasks[insertIdx]?.section || sections[0]
    const rest      = tasks.filter(t => !selected.has(t.id))
    rest.splice(insertIdx, 0, { id:Date.now(), section, ...mergeForm, pinned:false })
    setTasks(rest)
    const nd = { ...done }; selected.forEach(id => delete nd[id]); setDone(nd)
    setSelected(new Set()); setSelectMode(false); setMergeForm(null)
  }

  const resetDay = () => { setDone({}); setConfirmReset(false) }
  const resetAll = () => {
    setTasks(MAHI_TASKS.map(t => ({ ...t, skippable: t.skippable !== undefined ? t.skippable : !t.pinned })))
    setDone({}); setSettings(DEF_SETTINGS); setConfirmReset(false)
  }
  const sc = sec => SECTION_COLORS[sec] || { bg:'#f9f9f9', accent:PINK }

  const filterAreas = ['ALL', '⚡ Impact', ...Object.keys(AREA_META)]
  const filtered = tasks.filter(t => {
    const aOk = activeFilter === 'ALL' || (activeFilter === '⚡ Impact' ? t.highImpact : t.tags.includes(activeFilter))
    const sOk = !searchQ || t.task.toLowerCase().includes(searchQ.toLowerCase()) || t.time.includes(searchQ)
    return aOk && sOk
  })

  return (
    <div style={S.root}>
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
          const secDone=secTasks.filter(t=>done[t.id]).length
          return (
            <div key={sec} style={{...S.section,background:c.bg}}>
              <div style={{...S.secHeader,borderLeftColor:c.accent}}>
                <span style={S.secTitle}>{sec}</span>
                <span style={{...S.secBadge,background:c.accent}}>{secDone}/{secTasks.length}</span>
              </div>
              {secTasks.map(t=>{
                const status=getStatus(t), isSel=selected.has(t.id)
                return (
                  <div key={t.id} draggable={!selectMode}
                    onDragStart={()=>onDragStart(t.id)} onDragOver={e=>onDragOver(e,t.id)} onDrop={()=>onDrop(t.id)}
                    style={{
                      ...S.taskCard,
                      ...(done[t.id]?S.taskDone:{}),
                      ...(status==='skipped'?S.taskSkipped:{}),
                      ...(status==='missed'?S.taskMissed:{}),
                      ...(dragOverId===t.id?S.taskDragOver:{}),
                      ...(isSel?S.taskSelected:{}),
                      borderLeft: t.highImpact ? '4px solid #ffd700' : `4px solid ${status==='missed'?'#b71c1c':c.accent}`,
                    }}>
                    {editingId===t.id?(
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
                      <div style={S.taskRow} onClick={()=>toggle(t.id)}>
                        <div style={{...S.checkbox,...((selectMode?isSel:done[t.id])?S.cbDone:{}),borderColor:c.accent}}>
                          {(selectMode?isSel:done[t.id])&&<span style={S.checkMark}>✓</span>}
                        </div>
                        <div style={S.taskContent}>
                          <div style={{...S.taskTime,color:c.accent}}>
                            {t.time} {t.pinned&&'📌'}
                            {t.highImpact && <span style={{fontSize:10,background:'#ffd700',color:'#7b3f00',padding:'1px 5px',borderRadius:6,fontWeight:800}}>⚡ Impact</span>}
                            {!t.skippable&&<span style={S.reqDot}>⛔</span>}
                            {status==='missed'&&<span style={S.missedBadge}>MISSED</span>}
                            {status==='skipped'&&<span style={S.skippedBadge}>⏭️ SKIP</span>}
                          </div>
                          <div style={{...S.taskText,...((done[t.id]||status==='skipped')?S.taskStrike:{})}}>{t.task}</div>
                          <div style={S.tagRow}>
                            {t.tags.map(tag=>(
                              <span key={tag} style={{...S.tag,background:AREA_META[tag]?.bg||'#eee',color:AREA_META[tag]?.color||'#666'}}>{tag} {AREA_META[tag]?.label}</span>
                            ))}
                          </div>
                        </div>
                        {!selectMode&&(
                          <div style={S.taskActions} onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>startEdit(t)} style={S.iconBtn}>✏️</button>
                            <button onClick={()=>deleteTask(t.id)} style={S.iconBtn}>🗑️</button>
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

      {view==='weekly'  && <MahiWeekly />}
      {view==='brand'   && <MahiBrand />}
      {view==='mantras' && <MahiMantras />}

      {view==='outfit' && (() => {
        const dc = DAY_COLORS[new Date().getDay()]
        const tip = MAHI_DAY_TIPS[new Date().getDay()]
        return (
          <div style={{padding:'16px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:PINK,marginBottom:4}}>💃 आज का Outfit — माही</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>Vedic Astrology based daily color guide</div>
            <div style={{background:`linear-gradient(135deg,${dc.color},${dc.color}cc)`,borderRadius:16,padding:20,color:'#fff',marginBottom:16,textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:4}}>{dc.god}</div>
              <div style={{fontSize:16,fontWeight:800}}>{dc.day} — {dc.en}</div>
              <div style={{fontSize:22,fontWeight:900,marginTop:8,marginBottom:4}}>{dc.name}</div>
              <div style={{fontSize:13,opacity:0.9}}>आज का शुभ रंग</div>
            </div>
            <div style={{background:'#fff',borderRadius:16,padding:16,marginBottom:12,border:'2px solid #eee'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:10}}>👗 Outfit Suggestions:</div>
              {dc.outfits.map((o,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:i<dc.outfits.length-1?'1px solid #f0f0f0':'none'}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:dc.color,flexShrink:0}}/>
                  <span style={{fontSize:14}}>{o}</span>
                </div>
              ))}
            </div>
            <div style={{background:'#fdf5f7',borderRadius:16,padding:16,marginBottom:12,border:`2px solid ${PINK}`}}>
              <div style={{fontSize:13,fontWeight:700,color:'#7b0000',marginBottom:6}}>🌟 Personal Tip — Rahu Dasha + Tula Lagna:</div>
              <div style={{fontSize:13,color:'#333',lineHeight:1.6}}>{tip}</div>
            </div>
            <div style={{background:'#fff0f0',borderRadius:12,padding:12,border:'1px solid #ffcdd2'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#c62828',marginBottom:4}}>❌ आज Avoid करें:</div>
              <div style={{fontSize:13,color:'#555'}}>{dc.avoid}</div>
            </div>
          </div>
        )
      })()}

      {view==='calendar' && (() => {
        const today = new Date()
        const MONTH_HI = ['','जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर']
        const withDays = calEvents.map(e=>{
          const [mm,dd]=e.date.split('-').map(Number)
          const next=new Date(today.getFullYear(),mm-1,dd)
          if(next<today&&!(next.getMonth()===today.getMonth()&&next.getDate()===today.getDate())) next.setFullYear(today.getFullYear()+1)
          return{...e,daysAway:Math.round((next-today)/(864e5)),mm,dd}
        }).sort((a,b)=>a.daysAway-b.daysAway)
        const upcoming=withDays.filter(e=>e.daysAway<=60)
        const byMonth={}
        calEvents.forEach(e=>{const mm=parseInt(e.date.split('-')[0]);if(!byMonth[mm])byMonth[mm]=[];byMonth[mm].push(e)})
        const parsed = parseCalText(calInput)
        return (
          <div style={{padding:'16px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:PINK,marginBottom:16}}>📆 परिवार Calendar</div>
            {upcoming.length>0&&<>
              <div style={{fontSize:13,fontWeight:700,color:'#555',marginBottom:10}}>🔔 अगले 60 दिनों में ({upcoming.length})</div>
              {upcoming.map(e=>(
                <div key={e.id} style={{background:e.daysAway<=7?'#fce4ec':'#f9f9f9',border:`2px solid ${e.daysAway<=7?PINK:'#ddd'}`,borderRadius:12,padding:'12px 14px',marginBottom:8}}>
                  <div style={{fontSize:15,fontWeight:700}}>{e.label}</div>
                  <div style={{fontSize:12,color:'#888',marginTop:4}}>{MONTH_HI[e.mm]} {e.dd} • {e.daysAway===0?'🎉 आज!':`${e.daysAway} दिन बाद`}</div>
                </div>
              ))}
              <div style={{height:8}}/>
            </>}
            <div style={{fontSize:13,fontWeight:700,color:'#555',marginBottom:10}}>📅 सभी Events ({calEvents.length})</div>
            {Object.keys(byMonth).sort((a,b)=>+a-+b).map(mm=>(
              <div key={mm} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:800,color:PINK,marginBottom:6,letterSpacing:1}}>{MONTH_HI[+mm].toUpperCase()}</div>
                {byMonth[mm].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>(
                  <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'#fff',border:'1px solid #eee',borderRadius:8,marginBottom:4}}>
                    <span style={{fontSize:14}}>{parseInt(e.date.split('-')[1])} — {e.label}</span>
                    <button onClick={()=>setCalEvents(prev=>prev.filter(x=>x.id!==e.id))} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#bbb',padding:'0 4px'}}>✕</button>
                  </div>
                ))}
              </div>
            ))}
            <div style={{marginTop:16,padding:14,background:'#fdf5f7',borderRadius:12,border:`2px solid ${PINK}`}}>
              <div style={{fontSize:13,fontWeight:700,color:'#7b0000',marginBottom:4}}>➕ New Event जोड़ें</div>
              <div style={{fontSize:11,color:'#888',marginBottom:8}}>Format: "12 January 🧁 Kirti" (एक line = एक event)</div>
              <textarea value={calInput} onChange={e=>setCalInput(e.target.value)}
                placeholder={'12 January 🧁Kirti\n31 January 💞 Bhumi-Mukesh\n03 February 💞 Kirti-Sanju'}
                style={{width:'100%',padding:'10px',borderRadius:8,border:'1px solid #ddd',fontSize:12,fontFamily:'inherit',minHeight:80,boxSizing:'border-box',resize:'vertical'}}/>
              <button onClick={()=>{if(parsed.length>0){setCalEvents(prev=>[...prev,...parsed]);setCalInput('')}}}
                style={{marginTop:8,width:'100%',padding:'10px',background:parsed.length>0?PINK:'#bbb',color:'#fff',border:'none',borderRadius:8,fontWeight:700,fontSize:14,cursor:parsed.length>0?'pointer':'not-allowed'}}>
                ✓ Calendar में जोड़ें {parsed.length>0?`(${parsed.length} events)`:''}
              </button>
            </div>
          </div>
        )
      })()}

      {view==='meals' && (() => {
        const todayIdx = new Date().getDay()
        const meal = MAHI_MEALS[todayIdx]
        return (
          <div style={{padding:'16px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:PINK,marginBottom:4}}>🍽️ Meals — माही</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>NIFT prep + Growing age + Rahu Dasha आधारित</div>
            <div style={{background:`linear-gradient(135deg,${PINK},${DPINK})`,borderRadius:16,padding:16,color:'#fff',marginBottom:16}}>
              <div style={{fontSize:13,opacity:0.9}}>आज: {meal.day}</div>
              <div style={{fontSize:15,fontWeight:800,marginTop:4}}>{meal.tip}</div>
            </div>
            {[['🌅 नाश्ता (Breakfast)',meal.breakfast,'7:15 AM'],['🍛 दोपहर का खाना (Lunch)',meal.lunch,'12:00 PM'],['🌙 रात का खाना (Dinner)',meal.dinner,'7:00 PM']].map(([title,content,time])=>(
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
              {MAHI_MEALS.map((m,i)=>(
                <div key={i} style={{background:i===todayIdx?'#fdf5f7':'#f9f9f9',border:`1px solid ${i===todayIdx?PINK:'#eee'}`,borderRadius:10,padding:10,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:800,color:i===todayIdx?PINK:'#333',marginBottom:4}}>{m.day} {i===todayIdx?'← आज':''}</div>
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

function MahiWeekly() {
  const days = [
    { day:'सोमवार 🌙', focus:'Study + Fashion Research', color:'#1a237e', tip:'Weekly study targets set करें', remedy:'शिव मंदिर — माँ के साथ' },
    { day:'मंगलवार 🔴', focus:'Creative + Sketching', color:'#b71c1c', tip:'New fashion design try करें', remedy:'हनुमान जी — माँ के साथ' },
    { day:'बुधवार 💚', focus:'Study Deep Work', color:'#00695c', tip:'Toughest subject आज पढ़ें', remedy:"'ॐ बुं बुधाय नमः' 21 बार" },
    { day:'गुरुवार 🌕', focus:'Brand Planning', color:'#4a148c', tip:'Cousin के साथ Brand meeting', remedy:'पीला रंग पहनें' },
    { day:'शुक्रवार 💕', focus:'Instagram + Content', color:'#880e4f', tip:'Best content post करें आज', remedy:"'ॐ शुं शुक्राय नमः' 108 बार" },
    { day:'शनिवार 🪐', focus:'Portfolio + Mood Board', color:'#37474f', tip:'Weekly creative review', remedy:'माँ के साथ Satsang' },
    { day:'रविवार ☀️', focus:'REST + Family', color:'#e65100', tip:'Family + बगीचे में time', remedy:'माँ के साथ — AOL practice' },
  ]
  return (
    <div style={{padding:'10px 10px 20px'}}>
      {days.map(d=>(
        <div key={d.day} style={{background:'#fff',borderRadius:14,padding:'14px 16px',marginBottom:10,borderTop:`4px solid ${d.color}`,boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:16,fontWeight:800,color:d.color,marginBottom:4}}>{d.day}</div>
          <div style={{fontSize:13,fontWeight:700,color:'#333',marginBottom:6}}>{d.focus}</div>
          <div style={{fontSize:12,color:'#555',marginBottom:3}}>💡 {d.tip}</div>
          <div style={{fontSize:12,color:'#888'}}>🕉️ {d.remedy}</div>
        </div>
      ))}
    </div>
  )
}

function MahiBrand() {
  const milestones = [
    { year:'अभी', goal:'Instagram Account — Fashion niche (Already 1000+ Followers!)', status:'🟡', color:'#f57f17' },
    { year:'2025', goal:'NIFT/Pearl Academy — Fashion Communication Admission', status:'🎯', color:'#1a237e' },
    { year:'2026', goal:'10,000 Genuine Followers — Fashion Brand Identity', status:'📈', color:'#00695c' },
    { year:'2027', goal:'Cousin के साथ Brand Partnership official', status:'👥', color:'#6a1b9a' },
    { year:'2028', goal:'Internship — Vogue/Myntra/Nykaa Fashion', status:'💼', color:'#880e4f' },
    { year:'2029', goal:'Graduate + Brand Soft Launch', status:'🚀', color:'#c2185b' },
    { year:'2031', goal:'50K+ Followers + Major Brand Deals', status:'🌟', color:'#d46a10' },
    { year:'2035', goal:'Established Fashion Brand — ₹5 Crore+', status:'👑', color:'#b8860b' },
  ]
  const tips = [
    "Brand Name: अपना नाम या कुछ unique — Elegant + Indian",
    "Brand Colors: Cream, Sage Green, Gold — शुक्र के रंग",
    "Niche: 'Design Student Life' — लगभग खाली है!",
    "Tagline: 'Design your life, Brand your story'",
    "पिता का Printing = Packaging FREE | Marketing FREE",
    "मामा = Ethnic vendor network | मौसी = Production support",
  ]
  return (
    <div style={{padding:'10px 10px 20px'}}>
      <div style={{fontSize:16,fontWeight:800,color:DPINK,textAlign:'center',padding:'8px 0 12px'}}>👗 Fashion Brand Roadmap</div>
      {milestones.map((m,i)=>(
        <div key={i} style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:8,borderLeft:`4px solid ${m.color}`,boxShadow:'0 1px 5px rgba(0,0,0,0.06)',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{fontSize:24}}>{m.status}</div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:m.color,marginBottom:2}}>{m.year}</div>
            <div style={{fontSize:13,color:'#222'}}>{m.goal}</div>
          </div>
        </div>
      ))}
      <div style={{fontSize:16,fontWeight:800,color:DPINK,textAlign:'center',padding:'12px 0 8px'}}>💡 Brand Tips</div>
      {tips.map((t,i)=>(
        <div key={i} style={{background:'#fce4ec',borderRadius:10,padding:'10px 14px',marginBottom:6,fontSize:12,color:DPINK,fontWeight:600}}>✨ {t}</div>
      ))}
    </div>
  )
}

function MahiMantras() {
  const mantras = [
    { when:'रोज सुबह', mantra:"'ॐ ऐं सरस्वत्यै नमः' — 21 बार", benefit:'Studies + Creativity + Art', color:'#1a237e' },
    { when:'रोज सुबह', mantra:"'ॐ शुं शुक्राय नमः' — 21 बार", benefit:'Fashion + Beauty + Success', color:'#880e4f' },
    { when:'शुक्रवार', mantra:"'ॐ शुं शुक्राय नमः' — 108 बार", benefit:'Brand Growth + Instagram', color:'#c2185b' },
    { when:'बुधवार', mantra:"'ॐ बुं बुधाय नमः' — 21 बार", benefit:'Communication + Study Focus', color:'#00695c' },
    { when:'शनिवार', mantra:"'ॐ रां राहवे नमः' — 108 बार", benefit:'Social Media + Mass Appeal', color:'#37474f' },
    { when:'Exam से पहले', mantra:"'ॐ ऐं ह्रीं क्लीं' — 21 बार", benefit:'Memory + Concentration', color:'#6a1b9a' },
    { when:'रात रोज', mantra:'Gratitude + 3 अच्छी बातें', benefit:'Positive mindset + Sleep', color:'#7b0000' },
  ]
  return (
    <div style={{padding:'10px 10px 20px'}}>
      <div style={{fontSize:16,fontWeight:800,color:DPINK,textAlign:'center',padding:'8px 0 12px'}}>🕉️ माही के Mantras</div>
      {mantras.map((m,i)=>(
        <div key={i} style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:8,borderLeft:`4px solid ${m.color}`,boxShadow:'0 1px 5px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:11,fontWeight:800,color:m.color,marginBottom:3}}>{m.when}</div>
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
