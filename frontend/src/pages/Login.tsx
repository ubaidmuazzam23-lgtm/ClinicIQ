// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/Login.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const t = {
    bg:        '#0a0a0a',
    bgCard:    '#141414',
    text:      '#F2F2F2',
    textMuted: 'rgba(242,242,242,0.45)',
    textFaint: 'rgba(242,242,242,0.2)',
    border:    'rgba(255,255,255,0.08)',
    border2:   'rgba(255,255,255,0.14)',
    peach:     '#D77A61',
    jet:       '#0d1f28',
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, role, user } = res.data

      // Store JWT and user info
      localStorage.setItem('ciq_token', token)
      localStorage.setItem('ciq_user', JSON.stringify(user))
      localStorage.setItem('ciq_role', role)

      // Redirect based on role
      const routes: Record<string, string> = {
        patient:     '/patient/dashboard',
        doctor:      '/doctor/dashboard',
        radiologist: '/radiologist/dashboard',
        admin:       '/admin/dashboard',
      }
      navigate(routes[role] || '/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateColumns:'1.1fr .9fr', fontFamily:"'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        input { outline:none; color:#F2F2F2; }
        input:focus { border-color:rgba(215,122,97,0.6) !important; box-shadow:0 0 0 3px rgba(215,122,97,0.1) !important; }
        .auth-btn { transition:all 0.2s !important; }
        .auth-btn:hover:not(:disabled) { transform:translateY(-1px) !important; opacity:0.9 !important; }
        .auth-btn:disabled { opacity:0.5 !important; cursor:not-allowed !important; }
        .ghost-btn:hover { background:rgba(255,255,255,0.06) !important; }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      {/* LEFT — form */}
      <div style={{ background:t.bg, padding:'40px 60px', display:'flex', flexDirection:'column', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:52 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>navigate('/')}>
            <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:13,fontWeight:700,color:'#223843' }}>C</div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:600, color:t.text }}>ClinicalIQ</div>
              <div style={{ fontSize:10, color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace' }}>Sign in</div>
            </div>
          </div>
          <button className="ghost-btn" onClick={()=>navigate('/')}
            style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${t.border}`, color:t.textMuted, fontSize:12, cursor:'pointer', borderRadius:6, transition:'all 0.2s' }}>
            ← Back
          </button>
        </div>

        {/* Form */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:420 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>Welcome back.</h1>
          <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.6, marginBottom:36 }}>
            One login for every role — we route you to the right dashboard.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>Email address</label>
              <input type="email" value={email} placeholder="you@clinic.example"
                onChange={e=>setEmail(e.target.value)}
                style={{ height:42, padding:'0 14px', background:t.bgCard, border:`1px solid ${t.border2}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>Password</label>
              <input type="password" value={password} placeholder="••••••••"
                onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                style={{ height:42, padding:'0 14px', background:t.bgCard, border:`1px solid ${t.border2}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
              <label style={{ display:'flex', alignItems:'center', gap:7, color:t.textMuted, cursor:'pointer' }}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}
                  style={{ accentColor:'#D77A61', width:14, height:14 }} />
                Remember me
              </label>
              <a href="#" style={{ color:'#D77A61', fontSize:12, textDecoration:'none' }}>Forgot password?</a>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', background:'rgba(184,91,67,0.12)', border:'1px solid rgba(184,91,67,0.25)', borderRadius:8, fontSize:13, color:'#D77A61' }}>
                {error}
              </div>
            )}

            <button className="auth-btn" onClick={handleLogin} disabled={loading}
              style={{ height:42, background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, boxShadow:'0 0 32px rgba(215,122,97,0.25)' }}>
              {loading
                ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite' }} />Signing in…</>
                : 'Log in →'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:1, background:t.border }} />
              <span style={{ fontSize:11, color:t.textFaint, fontFamily:'monospace' }}>or</span>
              <div style={{ flex:1, height:1, background:t.border }} />
            </div>

            <div style={{ textAlign:'center', fontSize:13, color:t.textMuted }}>
              New patient?{' '}
              <span onClick={()=>navigate('/register')} style={{ color:'#D77A61', cursor:'pointer', fontWeight:500 }}>Create an account</span>
            </div>

            <div style={{ textAlign:'center', fontSize:12, color:t.textFaint }}>
              Clinician or radiologist?{' '}
              <span onClick={()=>navigate('/activate')} style={{ color:t.textMuted, cursor:'pointer', textDecoration:'underline', textDecorationStyle:'dashed', textUnderlineOffset:3 }}>
                Activate your account
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — dark panel */}
      <div style={{ background:t.jet, position:'relative', overflow:'hidden', padding:52, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(700px 400px at 80% 20%, rgba(215,122,97,0.18), transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 14px)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', fontFamily:'monospace', marginBottom:10 }}>Design principle</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, lineHeight:1.4, fontWeight:500, color:'#F2F2F2', maxWidth:380 }}>
            "The right report, in front of the right clinician, in the right language — every time."
          </div>
          <div style={{ marginTop:16, fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>ClinicalIQ · 2026</div>
        </div>
      </div>

    </div>
  )
}