// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/Activate.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

export default function Activate() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [email, setEmail]   = useState('')
  const [code, setCode]     = useState(['','','','','','','',''])
  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const inputs = useRef<(HTMLInputElement|null)[]>([])

  useEffect(() => { if (step===2) inputs.current[0]?.focus() }, [step])

  const setCell = (i: number, v: string) => {
    const c = v.replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(-1)
    const next = [...code]; next[i] = c; setCode(next)
    if (c && i < 7) inputs.current[i+1]?.focus()
  }
  const codeFilled = code.every(c=>c)
  const pwOk = pw.length >= 8 && pw === pw2

  const t = {
    bg:        '#0a0a0a',
    bgCard:    '#141414',
    bgCard2:   '#1a1a1a',
    text:      '#F2F2F2',
    textMuted: 'rgba(242,242,242,0.45)',
    textFaint: 'rgba(242,242,242,0.2)',
    border:    'rgba(255,255,255,0.08)',
    border2:   'rgba(255,255,255,0.14)',
    peach:     '#D77A61',
    ok:        '#34c759',
    jet:       '#0d1f28',
  }

  const StepDot = ({ n, label, done }: { n:number, label:string, done:boolean }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, opacity:step>=n?1:0.35 }}>
      <div style={{ width:22,height:22,borderRadius:'50%', background:done?t.ok:step===n?t.peach:t.bgCard2, color:done||step===n?'#fff':t.textMuted, display:'grid', placeItems:'center', fontSize:11, fontWeight:600, border:`1px solid ${done?t.ok:step===n?t.peach:t.border}`, flexShrink:0 }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize:12, fontWeight:500, color:step===n?t.text:t.textMuted }}>{label}</span>
    </div>
  )

  const handleActivate = async () => {
    if (!pwOk) return
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/activate', {
        email,
        activation_code: code.join(''),
        new_password: pw,
      })
      const { token, role, user } = res.data
      localStorage.setItem('ciq_token', token)
      localStorage.setItem('ciq_user', JSON.stringify(user))
      localStorage.setItem('ciq_role', role)

      const routes: Record<string, string> = {
        doctor:      '/doctor/dashboard',
        radiologist: '/radiologist/dashboard',
      }
      navigate(routes[role] || '/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Activation failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ height:'100vh', display:'grid', gridTemplateColumns:'1.1fr .9fr', fontFamily:"'DM Sans',sans-serif" }}>

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

      {/* LEFT */}
      <div style={{ background:t.bg, padding:'40px 60px', display:'flex', flexDirection:'column', overflowY:'auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:36 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>navigate('/')}>
            <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:13,fontWeight:700,color:'#223843' }}>C</div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:600, color:t.text }}>ClinicalIQ</div>
              <div style={{ fontSize:10, color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace' }}>Clinician activation</div>
            </div>
          </div>
          <button className="ghost-btn" onClick={()=>navigate('/')}
            style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${t.border}`, color:t.textMuted, fontSize:12, cursor:'pointer', borderRadius:6, transition:'all 0.2s' }}>← Back</button>
        </div>

        <div style={{ display:'flex', gap:24, marginBottom:36, paddingBottom:20, borderBottom:`1px solid ${t.border}` }}>
          <StepDot n={1} label="Email"           done={step>1} />
          <StepDot n={2} label="Activation code" done={step>2} />
          <StepDot n={3} label="Set password"    done={step>3} />
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:440 }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>Activate your clinician account</h1>
                <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.65 }}>Enter the email your admin used to create your account.</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>Work email</label>
                <input type="email" value={email} placeholder="dr.you@clinic.example"
                  onChange={e=>setEmail(e.target.value)}
                  style={{ height:42, padding:'0 14px', background:t.bgCard, border:`1px solid ${t.border2}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
              </div>
              <button className="auth-btn" onClick={()=>{ if(email) setStep(2) }}
                disabled={!email}
                style={{ height:42, background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 0 28px rgba(215,122,97,0.2)' }}>
                Continue →
              </button>
              <div style={{ textAlign:'center', fontSize:13, color:t.textMuted }}>
                Already activated?{' '}
                <span onClick={()=>navigate('/login')} style={{ color:'#D77A61', cursor:'pointer', fontWeight:500 }}>Log in</span>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>Enter your activation code</h1>
                <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.6 }}>
                  8-character code emailed to <strong style={{ color:t.text }}>{email}</strong>.
                </p>
              </div>

              <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:8, flexWrap:'wrap' }}>
                {code.map((c,i) => (
                  <span key={i} style={{ display:'contents' }}>
                    {i===4 && <div style={{ width:12, textAlign:'center', color:t.textFaint, fontFamily:'monospace', fontSize:18 }}>—</div>}
                    <input ref={el=>inputs.current[i]=el}
                      value={c}
                      onChange={e=>setCell(i,e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Backspace'&&!c&&i>0) inputs.current[i-1]?.focus() }}
                      maxLength={1}
                      style={{ width:46, height:60, textAlign:'center', fontSize:20, fontFamily:'monospace', fontWeight:700, textTransform:'uppercase', border:`1px solid ${c?'#D77A61':t.border2}`, borderRadius:8, background:t.bgCard, color:t.text, outline:'none', transition:'border-color 0.15s' }}
                    />
                  </span>
                ))}
              </div>

              {error && <div style={{ padding:'10px 14px', background:'rgba(184,91,67,0.12)', border:'1px solid rgba(184,91,67,0.25)', borderRadius:8, fontSize:13, color:'#D77A61' }}>{error}</div>}

              <button className="auth-btn" onClick={()=>{ if(codeFilled) setStep(3) }}
                disabled={!codeFilled}
                style={{ height:40, padding:'0 20px', background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                Verify code
              </button>

              <div style={{ background:t.jet, border:`1px solid ${t.border}`, borderRadius:10, padding:'16px 18px' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Check your email for a code like</div>
                <div style={{ fontFamily:'monospace', fontSize:18, background:'rgba(255,255,255,0.08)', padding:'8px 14px', borderRadius:6, display:'inline-block', letterSpacing:'0.14em', color:'#F2F2F2', fontWeight:700 }}>HX4K — 9PN2</div>
                <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>Valid for 24 hours from creation</div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>Set a permanent password</h1>
                <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.6 }}>This is the password you'll use to log in going forward.</p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>New password</label>
                <input type="password" value={pw} placeholder="At least 8 characters"
                  onChange={e=>setPw(e.target.value)}
                  style={{ height:42, padding:'0 14px', background:t.bgCard, border:`1px solid ${t.border2}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>Confirm password</label>
                <input type="password" value={pw2} placeholder="Repeat password"
                  onChange={e=>setPw2(e.target.value)}
                  style={{ height:42, padding:'0 14px', background:t.bgCard, border:`1px solid ${pw2&&pw2!==pw?'rgba(184,91,67,0.6)':t.border2}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
                {pw2 && pw2!==pw && <span style={{ fontSize:11.5, color:'#D77A61' }}>Passwords don't match</span>}
              </div>

              {error && <div style={{ padding:'10px 14px', background:'rgba(184,91,67,0.12)', border:'1px solid rgba(184,91,67,0.25)', borderRadius:8, fontSize:13, color:'#D77A61' }}>{error}</div>}

              <button className="auth-btn" onClick={handleActivate} disabled={!pwOk||loading}
                style={{ height:42, background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 0 28px rgba(215,122,97,0.2)', marginTop:4 }}>
                {loading
                  ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite' }} />Activating…</>
                  : 'Activate account & log in →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ background:t.jet, position:'relative', overflow:'hidden', padding:52, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(700px 400px at 80% 20%, rgba(215,122,97,0.18), transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 14px)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', fontFamily:'monospace', marginBottom:10 }}>For clinicians</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, lineHeight:1.4, fontWeight:500, color:'#F2F2F2', maxWidth:380, marginBottom:24 }}>
            "Your admin creates the account. You activate it. Full clinical depth from day one."
          </div>
          {[
            { label:'Role',     value:'Doctor or Radiologist' },
            { label:'Access',   value:'Full clinical intelligence' },
            { label:'Audit',    value:'Every action logged via Langfuse' },
            { label:'Security', value:'bcrypt + JWT · role-based routing' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.06em' }}>{r.label}</span>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop:16, fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>ClinicalIQ · PwC × Agentic AI · 2026</div>
        </div>
      </div>

    </div>
  )
}