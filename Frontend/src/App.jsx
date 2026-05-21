import { useState, useEffect } from 'react'
import Routine from './Routine'
import MahiRoutine from './MahiRoutine'
import KirtiRoutine from './KirtiRoutine'
import { api } from './api'

export default function App() {
  const [active, setActive] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getMembers()
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(err => { console.error('Failed to load members:', err); setError(err?.message || 'API error') })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname)
    const handler = () => {
      window.history.pushState(null, '', window.location.pathname)
      setShowExitConfirm(true)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  if (active === 'sanju') return <PageWrap onBack={() => setActive(null)}><Routine /></PageWrap>
  if (active === 'kirti') return <PageWrap onBack={() => setActive(null)}><KirtiRoutine /></PageWrap>
  if (active === 'mahi')  return <PageWrap onBack={() => setActive(null)}><MahiRoutine /></PageWrap>

  return (
    <div style={styles.root}>
      {showExitConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, margin:20, textAlign:'center', maxWidth:320 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🕉️</div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:8, color:'#7b0000' }}>App बंद करें?</div>
            <div style={{ fontSize:13, color:'#666', marginBottom:20 }}>अहूजा परिवार Planner बंद करना चाहते हैं?</div>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{ flex:1, padding:'12px', background:'#f5f5f5', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer' }}>रहने दें</button>
              <button onClick={() => { window.close(); setTimeout(() => { window.location.href = 'about:blank' }, 100) }} style={{ flex:1, padding:'12px', background:'#d46a10', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer' }}>हाँ, बंद करें</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.om}>🕉️</div>
        <div style={styles.title}>अहूजा परिवार</div>
        <div style={styles.subtitle}>Daily Routine Planner</div>
        <div style={styles.subtitle2}>Astrology Based • Mobile First</div>
      </div>

      {error && (
        <div style={{ margin:'12px 14px 0', padding:'12px 16px', background:'#fff3cd', border:'1px solid #f0ad4e', borderRadius:12, fontSize:12, color:'#7b4d00' }}>
          ⚠️ <strong>API Error:</strong> {error}
          <button onClick={() => setError(null)} style={{ float:'right', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#7b4d00' }}>✕</button>
        </div>
      )}

      <div style={styles.cardWrap}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#d46a10', fontSize:16 }}>
            🕉️ लोड हो रहा है...
          </div>
        ) : members.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ ...styles.card, background: m.gradient }}>
            <div style={styles.cardEmoji}>{m.emoji}</div>
            <div style={styles.cardName}>{m.name}</div>
            <div style={styles.cardSub}>{m.sub}</div>
            <div style={styles.cardArrow}>आगे बढ़ें →</div>
          </button>
        ))}
      </div>

      <div style={styles.quoteBox}>
        <div style={styles.quoteText}>"यह परिवार सिर्फ परिवार नहीं</div>
        <div style={styles.quoteText}>यह एक Mission है" 🌟</div>
        <div style={styles.quoteAuthor}>🕉️ ॐ गं गणपतये नमः | जय माँ लक्ष्मी</div>
      </div>
    </div>
  )
}

function PageWrap({ children, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={styles.backBtn}>← परिवार</button>
      {children}
    </div>
  )
}

const styles = {
  root: { fontFamily:"'Noto Sans Devanagari','Segoe UI',sans-serif", background:'#fdf8f3', minHeight:'100vh', maxWidth:480, margin:'0 auto', paddingBottom:40 },
  header: { background:'linear-gradient(135deg,#d46a10,#7b0000)', padding:'40px 20px 30px', textAlign:'center', color:'#fff' },
  om: { fontSize:40, marginBottom:10 },
  title: { fontSize:28, fontWeight:800, marginBottom:4 },
  subtitle: { fontSize:14, opacity:0.9, marginBottom:2 },
  subtitle2: { fontSize:11, opacity:0.7 },
  cardWrap: { padding:'20px 14px', display:'flex', flexDirection:'column', gap:14 },
  card: { border:'none', borderRadius:20, padding:'22px 20px', textAlign:'left', cursor:'pointer', color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', transition:'transform 0.15s' },
  cardEmoji: { fontSize:36, marginBottom:8 },
  cardName: { fontSize:22, fontWeight:800, marginBottom:3 },
  cardSub: { fontSize:12, opacity:0.85, marginBottom:12 },
  cardArrow: { fontSize:13, fontWeight:700, opacity:0.9, background:'rgba(255,255,255,0.2)', display:'inline-block', padding:'5px 14px', borderRadius:20 },
  quoteBox: { margin:'0 14px', background:'linear-gradient(135deg,#fff9f0,#fff0e0)', border:'2px solid #d46a10', borderRadius:16, padding:18, textAlign:'center' },
  quoteText: { fontSize:13, fontWeight:700, color:'#7b0000', lineHeight:1.6 },
  quoteAuthor: { fontSize:11, color:'#d46a10', marginTop:8, fontWeight:600 },
  backBtn: { display:'block', padding:'10px 16px', background:'#fff', border:'none', fontSize:13, fontWeight:700, color:'#555', cursor:'pointer', borderBottom:'1px solid #eee', width:'100%', textAlign:'left' },
}
