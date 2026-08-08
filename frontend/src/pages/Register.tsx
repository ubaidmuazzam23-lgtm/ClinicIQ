// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/Register.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

export default function Register() {
  const navigate  = useNavigate()
  const [step, setStep]         = useState(1)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed]     = useState(true)
  const [code, setCode]         = useState(['','','','','',''])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const inputs = useRef<(HTMLInputElement|null)[]>([])

  useEffect(() => { if (step===2) inputs.current[0]?.focus() }, [step])

  const setCell = (i: number, v: string) => {
    const c = v.replace(/\D/g,'').slice(-1)
    const next = [...code]; next[i] = c; setCode(next)
    if (c && i < 5) inputs.current[i+1]?.focus()
  }
  const filled = code.every(c=>c)

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
    okSoft:    'rgba(52,199,89,0.12)',
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

  // Step 1 — Register
  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/register', { full_name: name, email, password })
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  // Step 2 — Verify OTP
  const handleVerify = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code.join('') })
      const { token, role, user } = res.data
      localStorage.setItem('ciq_token', token)
      localStorage.setItem('ciq_user', JSON.stringify(user))
      localStorage.setItem('ciq_role', role)
      setStep(3)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  // Step 2 — Resend OTP
  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email })
      setCode(['','','','','',''])
      inputs.current[0]?.focus()
    } catch {}
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
              <div style={{ fontSize:10, color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace' }}>Patient signup</div>
            </div>
          </div>
          <button className="ghost-btn" onClick={()=>navigate('/')}
            style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${t.border}`, color:t.textMuted, fontSize:12, cursor:'pointer', borderRadius:6, transition:'all 0.2s' }}>← Back</button>
        </div>

        {/* Steps */}
        <div style={{ display:'flex', gap:24, marginBottom:36, paddingBottom:20, borderBottom:`1px solid ${t.border}` }}>
          <StepDot n={1} label="Your details" done={step>1} />
          <StepDot n={2} label="Verify email"  done={step>2} />
          <StepDot n={3} label="Ready to go"   done={step>3} />
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:440 }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>Create your patient account</h1>
                <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.6 }}>Takes about 30 seconds. We'll email you a 6-digit code to verify.</p>
              </div>

              {[
                { label:'Full name', value:name,     set:setName,     type:'text',     ph:'Sarah Chen' },
                { label:'Email',     value:email,    set:setEmail,    type:'email',    ph:'you@email.com' },
                { label:'Password',  value:password, set:setPassword, type:'password', ph:'At least 8 characters' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>{f.label}</label>
                  <input type={f.type} value={f.value} placeholder={f.ph}
                    onChange={e=>f.set(e.target.value)}
                    style={{ height:42, padding:'0 14px', background:t.bgCard, border:`1px solid ${t.border2}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
                </div>
              ))}

              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:t.textMuted, cursor:'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ accentColor:'#D77A61', width:14, height:14 }} />
                I agree to the privacy notice and clinical data terms.
              </label>

              {error && <div style={{ padding:'10px 14px', background:'rgba(184,91,67,0.12)', border:'1px solid rgba(184,91,67,0.25)', borderRadius:8, fontSize:13, color:'#D77A61' }}>{error}</div>}

              <button className="auth-btn" onClick={handleRegister}
                disabled={!name||!email||!password||!agreed||loading}
                style={{ height:42, background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 0 28px rgba(215,122,97,0.2)', marginTop:4 }}>
                {loading ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite' }} />Sending code…</> : 'Continue → email verification'}
              </button>

              <div style={{ textAlign:'center', fontSize:13, color:t.textMuted }}>
                Already have an account?{' '}
                <span onClick={()=>navigate('/login')} style={{ color:'#D77A61', cursor:'pointer', fontWeight:500 }}>Log in</span>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>Check your email</h1>
                <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.6 }}>
                  We sent a 6-digit code to <strong style={{ color:t.text }}>{email}</strong>. It expires in 10 minutes.
                </p>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:8 }}>
                {code.map((c,i) => (
                  <input key={i} ref={el=>inputs.current[i]=el}
                    value={c}
                    onChange={e=>setCell(i,e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Backspace'&&!c&&i>0) inputs.current[i-1]?.focus() }}
                    inputMode="numeric" maxLength={1}
                    style={{ width:54, height:64, textAlign:'center', fontSize:24, fontFamily:'monospace', fontWeight:700, border:`1px solid ${c?'#D77A61':t.border2}`, borderRadius:10, background:t.bgCard, color:t.text, outline:'none', transition:'border-color 0.15s' }}
                  />
                ))}
              </div>

              {error && <div style={{ padding:'10px 14px', background:'rgba(184,91,67,0.12)', border:'1px solid rgba(184,91,67,0.25)', borderRadius:8, fontSize:13, color:'#D77A61' }}>{error}</div>}

              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <button className="auth-btn" onClick={handleVerify} disabled={!filled||loading}
                  style={{ height:40, padding:'0 20px', background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  {loading ? <><div style={{ width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite' }} />Verifying…</> : 'Verify code'}
                </button>
                <button className="ghost-btn" onClick={handleResend}
                  style={{ height:40, padding:'0 16px', background:'transparent', border:`1px solid ${t.border}`, color:t.textMuted, fontSize:12, cursor:'pointer', borderRadius:8, transition:'all 0.2s' }}>
                  ↺ Resend
                </button>
              </div>

              <div style={{ padding:'12px 14px', background:t.bgCard2, border:`1px solid ${t.border}`, borderRadius:8, fontSize:12.5, color:t.textMuted, lineHeight:1.6 }}>
                <strong style={{ color:t.text }}>Real OTP sent via Gmail SMTP</strong> · Check your inbox or spam folder.
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18, alignItems:'flex-start' }}>
              <div style={{ width:52,height:52,borderRadius:'50%',background:t.okSoft,border:'1px solid rgba(52,199,89,0.3)',display:'grid',placeItems:'center',fontSize:22,color:t.ok }}>✓</div>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:500, color:t.text, letterSpacing:'-0.02em', marginBottom:8 }}>
                  Welcome, {name.split(' ')[0] || 'there'}.
                </h1>
                <p style={{ fontSize:14, color:t.textMuted, lineHeight:1.65, maxWidth:420 }}>
                  Your account is active. Upload clinical documents, ask health questions, and you'll be automatically assigned a doctor when you submit your first query.
                </p>
              </div>

              <div style={{ width:'100%', background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {[
                  { t:'Upload', d:'your first document' },
                  { t:'Ask',    d:'a health question' },
                  { t:'Meet',   d:'your assigned doctor' },
                ].map(b => (
                  <div key={b.t}>
                    <div style={{ fontSize:10, color:t.textMuted, fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{b.t}</div>
                    <div style={{ fontSize:13, color:t.text }}>{b.d}</div>
                  </div>
                ))}
              </div>

              <button className="auth-btn" onClick={()=>navigate('/patient/dashboard')}
                style={{ height:42, padding:'0 28px', background:'#D77A61', color:'#F2F2F2', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 0 28px rgba(215,122,97,0.2)', marginTop:8 }}>
                Go to my dashboard →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ background:t.jet, position:'relative', overflow:'hidden', padding:52, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(700px 500px at 80% 20%, rgba(215,122,97,0.18), transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 14px)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', fontFamily:'monospace', marginBottom:16 }}>How it works</div>
          {[
            { n:'01', t:'Upload',   d:'Drop a PDF — lab report, discharge summary, radiology read.' },
            { n:'02', t:'Index',    d:'Documents are chunked, entities extracted, vectors stored.' },
            { n:'03', t:'Classify', d:'An AI classifier identifies the medical specialty involved.' },
            { n:'04', t:'Route',    d:'The routing engine picks the best available doctor — automatically.' },
            { n:'05', t:'Analyze',  d:'Three specialized agents run in parallel, conflicts reconciled.' },
            { n:'06', t:'Deliver',  d:'Patient gets plain English. Doctor gets full clinical depth.' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:16, padding:'13px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:12, color:'#D77A61', fontFamily:'monospace', width:26, paddingTop:2, flexShrink:0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:'#F2F2F2', marginBottom:2 }}>{s.t}</div>
                <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}