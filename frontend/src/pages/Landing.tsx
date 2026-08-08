// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/Landing.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [scrollY, setScrollY]         = useState(0)
  const [mounted, setMounted]         = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const [activeRole, setActiveRole]   = useState<'patient'|'doctor'|'radiologist'|'admin'>('doctor')

  useEffect(() => {
    setMounted(true)
    setTimeout(() => setHeroVisible(true), 120)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t = {
    bg:        '#0a0a0a',
    bgAlt:     '#111111',
    bgCard:    '#141414',
    bgCard2:   '#1a1a1a',
    text:      '#F2F2F2',
    textMuted: 'rgba(242,242,242,0.45)',
    textFaint: 'rgba(242,242,242,0.18)',
    border:    'rgba(255,255,255,0.07)',
    navBg:     'rgba(10,10,10,0.92)',
    peach:     '#D77A61',
    peachDeep: '#B85B43',
    peachSoft: 'rgba(215,122,97,0.12)',
    jet:       '#223843',
    sand:      '#D8B4A0',
  }

  const navScrolled = scrollY > 50
  if (!mounted) return null

  const rolePreviews: Record<string, React.ReactNode> = {
    doctor: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:'linear-gradient(90deg,#B85B43,#D77A61)', padding:'10px 14px', borderRadius:6, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'grid',placeItems:'center',fontSize:11,flexShrink:0 }}>⚠</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:11,fontWeight:600,color:'#fff' }}>HITL — Marcus Okafor · Conflict detected</div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.7)',marginTop:1 }}>Cardiology vs Allergy agents disagree · confidence 0.46</div>
          </div>
          <div style={{ padding:'3px 10px',background:'rgba(255,255,255,0.15)',fontSize:10,color:'#fff',borderRadius:3,cursor:'pointer',flexShrink:0 }}>Review →</div>
        </div>
        <div style={{ background:'#1a1a1a',borderRadius:6,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{ fontSize:11,fontWeight:600,color:'#F2F2F2' }}>Lab Results — Sarah Chen</span>
            <div style={{ display:'flex',gap:6 }}>
              <span style={{ padding:'2px 8px',background:'rgba(215,122,97,0.12)',color:'#D77A61',fontSize:9,borderRadius:2,fontFamily:'monospace',textTransform:'uppercase' }}>Lab Agent</span>
              <span style={{ padding:'2px 8px',background:'rgba(255,255,255,0.04)',color:'rgba(242,242,242,0.45)',fontSize:9,borderRadius:2,fontFamily:'monospace' }}>conf 0.92</span>
            </div>
          </div>
          {[
            { test:'Hemoglobin',val:'9.2', unit:'g/dL', ref:'12.0–15.5',flag:'low' },
            { test:'Ferritin',  val:'8',   unit:'ng/mL',ref:'20–250',   flag:'low' },
            { test:'WBC',       val:'6.4', unit:'K/μL', ref:'4.5–11.0', flag:'ok'  },
            { test:'Platelets', val:'268', unit:'K/μL', ref:'150–450',  flag:'ok'  },
          ].map((r,i) => (
            <div key={i} style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1.2fr 1.5fr 0.8fr',padding:'8px 14px',borderBottom:i<3?'1px solid rgba(255,255,255,0.07)':'none',alignItems:'center' }}>
              <span style={{ fontSize:11,color:'#F2F2F2' }}>{r.test}</span>
              <span style={{ fontSize:11,fontFamily:'monospace',color:r.flag==='ok'?'#F2F2F2':'#D77A61',fontWeight:r.flag!=='ok'?600:400 }}>{r.val}</span>
              <span style={{ fontSize:10,color:'rgba(242,242,242,0.45)',fontFamily:'monospace' }}>{r.unit}</span>
              <span style={{ fontSize:10,color:'rgba(242,242,242,0.18)',fontFamily:'monospace' }}>{r.ref}</span>
              <span style={{ fontSize:9,padding:'2px 6px',borderRadius:99,background:r.flag==='ok'?'rgba(52,199,89,0.12)':'rgba(215,122,97,0.12)',color:r.flag==='ok'?'#34c759':'#D77A61',textTransform:'uppercase',fontFamily:'monospace',textAlign:'center' }}>{r.flag}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
          {[
            { name:'Lab Interpreter',conf:92,time:'2.31s',cost:'$0.014' },
            { name:'Allergy Safety', conf:96,time:'0.84s',cost:'$0.005' },
          ].map((a,i) => (
            <div key={i} style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'10px 12px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                <span style={{ fontSize:10,fontWeight:600,color:'#F2F2F2' }}>{a.name}</span>
                <span style={{ fontSize:9,color:'rgba(242,242,242,0.45)',fontFamily:'monospace' }}>{a.time} · {a.cost}</span>
              </div>
              <div style={{ height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden' }}>
                <div style={{ width:`${a.conf}%`,height:'100%',background:'#D77A61',borderRadius:2 }} />
              </div>
              <div style={{ fontSize:9,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',marginTop:3 }}>{a.conf}% confidence</div>
            </div>
          ))}
        </div>
      </div>
    ),

    patient: (
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        <div style={{ background:'linear-gradient(135deg,rgba(215,122,97,0.15),rgba(34,56,67,0.3))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,padding:'18px 16px' }}>
          <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>Your latest result · plain language</div>
          <div style={{ fontSize:15,fontWeight:600,color:'#F2F2F2',marginBottom:8,lineHeight:1.3 }}>Your blood test suggests low iron levels.</div>
          <div style={{ fontSize:12,color:'rgba(242,242,242,0.45)',lineHeight:1.6 }}>Your red blood cells are smaller and paler than normal. This is iron-deficiency anemia — common and very treatable.</div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
          {[
            { label:'Iron levels',       note:'Below normal',    warn:true  },
            { label:'Red blood cells',   note:'Smaller than usual',warn:true },
            { label:'White blood cells', note:'Healthy range',   warn:false },
            { label:'Platelets',         note:'Healthy range',   warn:false },
          ].map((f,i) => (
            <div key={i} style={{ padding:'10px 12px',borderRadius:6,background:f.warn?'rgba(215,122,97,0.1)':'rgba(52,199,89,0.08)',border:`1px solid ${f.warn?'rgba(215,122,97,0.25)':'rgba(52,199,89,0.2)'}` }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:f.warn?'#D77A61':'#34c759' }} />
                <span style={{ fontSize:11,fontWeight:500,color:'#F2F2F2' }}>{f.label}</span>
              </div>
              <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)' }}>{f.note}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(215,122,97,0.2)',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,color:'#D77A61',flexShrink:0 }}>AM</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:600,color:'#F2F2F2' }}>Dr. Aarav Mehta assigned</div>
            <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)' }}>Internal Medicine · Hematology · Available now</div>
          </div>
          <div style={{ padding:'4px 10px',background:'rgba(215,122,97,0.12)',color:'#D77A61',fontSize:10,borderRadius:3,cursor:'pointer',flexShrink:0 }}>Message</div>
        </div>
      </div>
    ),

    radiologist: (
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        <div style={{ background:'rgba(184,91,67,0.15)',border:'1px solid rgba(184,91,67,0.35)',borderRadius:6,padding:'10px 14px',display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:14,flexShrink:0 }}>⚡</span>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:11,fontWeight:600,color:'#F2F2F2' }}>Urgent — CT Chest w/ contrast · RX-2031</div>
            <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)' }}>Rule out PE · elevated D-dimer · received 12 min ago</div>
          </div>
          <span style={{ padding:'2px 8px',background:'rgba(184,91,67,0.3)',color:'#F2F2F2',fontSize:9,borderRadius:2,textTransform:'uppercase',fontFamily:'monospace',flexShrink:0 }}>Urgent</span>
        </div>
        <div style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,overflow:'hidden' }}>
          <div style={{ padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize:11,fontWeight:600,color:'#F2F2F2' }}>Radiology Agent · Differential Diagnoses</span>
          </div>
          {[
            { dx:'Acute pulmonary embolism (segmental, RLL)',prob:71,urgent:true  },
            { dx:'Pneumonia with atelectasis',               prob:18,urgent:false },
            { dx:'Pulmonary edema (early)',                  prob:8, urgent:false },
            { dx:'Pleural effusion (small)',                 prob:3, urgent:false },
          ].map((d,i) => (
            <div key={i} style={{ padding:'10px 14px',borderBottom:i<3?'1px solid rgba(255,255,255,0.07)':'none' }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                <span style={{ fontSize:11,color:d.urgent?'#D77A61':'rgba(242,242,242,0.45)',fontWeight:d.urgent?600:400 }}>{d.dx}</span>
                <span style={{ fontSize:11,fontFamily:'monospace',color:'rgba(242,242,242,0.45)',flexShrink:0,marginLeft:8 }}>{d.prob}%</span>
              </div>
              <div style={{ height:3,background:'rgba(255,255,255,0.06)',borderRadius:2 }}>
                <div style={{ width:`${d.prob}%`,height:'100%',background:d.urgent?'#D77A61':'#223843',borderRadius:2 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'10px 14px' }}>
          <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>Your findings</div>
          <div style={{ fontSize:11,color:'rgba(242,242,242,0.45)',lineHeight:1.6 }}>Filling defect in right lower lobar pulmonary artery. No saddle embolus. Recommend anticoagulation…</div>
          <div style={{ display:'flex',gap:6,marginTop:8 }}>
            <span style={{ padding:'2px 8px',background:'rgba(184,91,67,0.15)',color:'#B85B43',fontSize:9,borderRadius:2,fontFamily:'monospace' }}>Urgent flag</span>
            <span style={{ padding:'2px 8px',background:'rgba(215,122,97,0.12)',color:'#D77A61',fontSize:9,borderRadius:2,fontFamily:'monospace' }}>PE confirmed</span>
          </div>
        </div>
      </div>
    ),

    admin: (
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
          {[
            { label:'Active Doctors', val:'24',    delta:'+2 this week', up:true  },
            { label:'Queries Today',  val:'612',   delta:'112 last hr',  up:true  },
            { label:'AI Cost Today',  val:'$8.42', delta:'$0.014/query', up:false },
          ].map((s,i) => (
            <div key={i} style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'12px' }}>
              <div style={{ fontSize:9,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:22,fontWeight:700,color:'#F2F2F2',fontFamily:'monospace',marginBottom:2 }}>{s.val}</div>
              <div style={{ fontSize:9,color:s.up?'#34c759':'rgba(242,242,242,0.45)',fontFamily:'monospace' }}>{s.delta}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,overflow:'hidden' }}>
          <div style={{ padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between' }}>
            <span style={{ fontSize:11,fontWeight:600,color:'#F2F2F2' }}>Routing Log</span>
            <span style={{ fontSize:10,color:'rgba(242,242,242,0.45)',fontFamily:'monospace' }}>612 queries today</span>
          </div>
          {[
            { time:'09:42',patient:'Sarah Chen',   specialty:'Hematology',   doctor:'Dr. Mehta',   score:'0.94',lat:'240ms' },
            { time:'09:30',patient:'Marcus Okafor',specialty:'Cardiology',   doctor:'Dr. Nakamura',score:'0.87',lat:'312ms' },
            { time:'09:14',patient:'Liu Wei',      specialty:'Endocrinology',doctor:'Dr. Park',    score:'0.91',lat:'198ms' },
          ].map((r,i) => (
            <div key={i} style={{ display:'grid',gridTemplateColumns:'0.5fr 1.2fr 1fr 1fr 0.5fr 0.5fr',padding:'8px 14px',borderBottom:i<2?'1px solid rgba(255,255,255,0.07)':'none',alignItems:'center',gap:4 }}>
              <span style={{ fontSize:9,color:'rgba(242,242,242,0.18)',fontFamily:'monospace' }}>{r.time}</span>
              <span style={{ fontSize:10,color:'#F2F2F2',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.patient}</span>
              <span style={{ fontSize:9,padding:'2px 6px',background:'rgba(215,122,97,0.12)',color:'#D77A61',borderRadius:2,fontFamily:'monospace' }}>{r.specialty}</span>
              <span style={{ fontSize:10,color:'rgba(242,242,242,0.45)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.doctor}</span>
              <span style={{ fontSize:9,color:'#34c759',fontFamily:'monospace',textAlign:'right' }}>{r.score}</span>
              <span style={{ fontSize:9,color:'rgba(242,242,242,0.18)',fontFamily:'monospace',textAlign:'right' }}>{r.lat}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
          <div style={{ background:'rgba(184,91,67,0.1)',border:'1px solid rgba(184,91,67,0.25)',borderRadius:6,padding:'10px 12px' }}>
            <div style={{ fontSize:9,color:'#D77A61',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4 }}>⚠ Active Emergency</div>
            <div style={{ fontSize:11,color:'#F2F2F2',fontWeight:600 }}>Marcus Okafor</div>
            <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)',marginTop:2 }}>Anaphylactic contrast risk · 09:47</div>
          </div>
          <div style={{ background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'10px 12px' }}>
            <div style={{ fontSize:9,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4 }}>Langfuse · Cost Today</div>
            <div style={{ fontSize:20,fontWeight:700,color:'#D77A61',fontFamily:'monospace' }}>$8.42</div>
            <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)',marginTop:2 }}>$0.014 avg per query</div>
          </div>
        </div>
      </div>
    ),
  }

  const roleLabels = {
    doctor:      { label:'Doctor',      nav:['Dashboard','Patients','Query','HITL ①','Chat','Reports'],  user:'AM', name:'Dr. Mehta',    desc:'Full clinical detail — 4 tabs, conflict notes, HITL queue, AI-assisted chat' },
    patient:     { label:'Patient',     nav:['My Health','Ask AI','Upload','Reports','Messages'],          user:'SC', name:'Sarah Chen',   desc:'Plain language results, color-coded flags, assigned doctor card' },
    radiologist: { label:'Radiologist', nav:['Queue','Review Case','Dr Chat','Reports'],                  user:'ES', name:'Dr. Sokolova', desc:'Imaging queue, ranked differentials, urgency detection, collaboration' },
    admin:       { label:'Admin',       nav:['Overview','Routing Log','All Users','Audit Log'],           user:'AD', name:'Admin',         desc:'System stats, routing log, Langfuse cost, emergency flags, audit trail' },
  }

  return (
    <div style={{ background:'#0a0a0a', fontFamily:"'DM Sans', sans-serif", color:'#F2F2F2', overflowX:'hidden', textAlign:'left', width:'100%', maxWidth:'100%', margin:0 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; height:100%; }
        body { margin:0; height:100%; }
        #root { text-align:left !important; width:100% !important; max-width:100% !important; margin:0 !important; border-inline:none !important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:#0a0a0a; }
        ::-webkit-scrollbar-thumb { background:#D77A61; border-radius:2px; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .nav-link { transition:color 0.2s !important; }
        .nav-link:hover { color:#F2F2F2 !important; }
        .hero-btn { transition:all 0.25s !important; }
        .hero-btn:hover { transform:translateY(-2px) !important; box-shadow:0 8px 28px rgba(0,0,0,0.5) !important; }
        .feature-card { transition:background 0.25s !important; }
        .feature-card:hover { background:#1a1a1a !important; }
        .stat-cell { transition:background 0.25s !important; cursor:default; }
        .stat-cell:hover { background:#161616 !important; }
        .role-card { transition:all 0.3s !important; cursor:default; }
        .role-card:hover { transform:translateY(-6px) !important; box-shadow:0 20px 60px rgba(0,0,0,0.5) !important; border-color:rgba(215,122,97,0.3) !important; }
        .role-tab { transition:all 0.2s !important; }
        .role-tab:hover { border-color:rgba(215,122,97,0.5) !important; color:#D77A61 !important; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:200,
        height:64,padding:'0 56px',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        background:navScrolled?'rgba(10,10,10,0.92)':'transparent',
        backdropFilter:navScrolled?'blur(24px)':'none',
        borderBottom:navScrolled?'1px solid rgba(255,255,255,0.07)':'1px solid transparent',
        transition:'all 0.35s',
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:7,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:14,fontWeight:700,color:'#223843',flexShrink:0 }}>C</div>
          <span style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:600,letterSpacing:'0.02em' }}>ClinicalIQ</span>
          <span style={{ fontSize:10,color:'rgba(242,242,242,0.45)',letterSpacing:'0.1em',textTransform:'uppercase',marginLeft:4 }}>PwC × Agentic AI</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:32 }}>
          {['Features','Agents','Roles','Stack'].map(l=>(
            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ fontSize:13,color:'rgba(242,242,242,0.45)',textDecoration:'none',letterSpacing:'0.02em' }}>{l}</a>
          ))}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button className="hero-btn nav-link" onClick={()=>navigate('/login')} style={{ padding:'8px 20px',background:'transparent',border:'none',color:'rgba(242,242,242,0.45)',fontSize:13,cursor:'pointer' }}>Log in</button>
          <button className="hero-btn" onClick={()=>navigate('/register')} style={{ padding:'9px 24px',background:'#D77A61',color:'#F2F2F2',border:'none',fontSize:13,fontWeight:500,letterSpacing:'0.04em',cursor:'pointer',boxShadow:'0 0 32px rgba(215,122,97,0.3)' }}>Get Access →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight:'100vh',
        padding:'0 56px',
        display:'flex',
        alignItems:'center',
        background:'radial-gradient(ellipse 100% 80% at 60% -5%, rgba(215,122,97,0.13) 0%, transparent 55%), #0a0a0a',
        position:'relative',
        overflow:'hidden',
        textAlign:'left',
      }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)',backgroundSize:'72px 72px' }} />
        <div style={{ position:'absolute',bottom:'10%',left:'-5%',width:500,height:500,background:'radial-gradient(circle,rgba(34,56,67,0.2) 0%,transparent 65%)',pointerEvents:'none' }} />

        <div style={{
          maxWidth:1300,
          margin:'0 auto',
          width:'100%',
          paddingTop:80,
          paddingBottom:80,
          position:'relative',
          display:'grid',
          gridTemplateColumns:'1fr 1.2fr',
          gap:80,
          alignItems:'center',
          opacity:heroVisible?1:0,
          transform:heroVisible?'translateY(0)':'translateY(40px)',
          transition:'opacity 0.9s cubic-bezier(0.16,1,0.3,1),transform 0.9s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* LEFT — strictly left-aligned */}
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'stretch', minWidth:0, textAlign:'left' }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'5px 14px',border:'1px solid rgba(215,122,97,0.35)',background:'rgba(215,122,97,0.08)',marginBottom:32,width:'fit-content',fontSize:11,letterSpacing:'0.14em',color:'#D77A61',textTransform:'uppercase',fontWeight:500 }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:'#D77A61',boxShadow:'0 0 8px #D77A61',display:'inline-block',animation:'pulse 2s infinite',flexShrink:0 }} />
              AI Clinical Intelligence · 3 Agents Active
            </div>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(56px,6vw,88px)',fontWeight:500,lineHeight:0.92,letterSpacing:'-0.03em',color:'#F2F2F2',marginBottom:0,textAlign:'left' }}>Diagnose.</h1>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(56px,6vw,88px)',fontWeight:500,lineHeight:0.92,letterSpacing:'-0.03em',color:'#F2F2F2',marginBottom:0,textAlign:'left' }}>Route.</h1>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(56px,6vw,88px)',fontWeight:500,lineHeight:0.92,letterSpacing:'-0.03em',marginBottom:32,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',textAlign:'left' }}>Never Guess.</h1>
            <p style={{ fontSize:17,lineHeight:1.75,color:'rgba(242,242,242,0.45)',marginBottom:40,fontWeight:300,maxWidth:440,textAlign:'left' }}>
              An end-to-end multi-agent clinical platform — synthesizing lab reports, imaging, and allergy records to route the right intelligence to patients, doctors, and radiologists automatically.
            </p>
            <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:56,justifyContent:'flex-start' }}>
              <button className="hero-btn" onClick={()=>navigate('/register')} style={{ padding:'14px 38px',background:'#D77A61',color:'#F2F2F2',border:'none',fontSize:13,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 40px rgba(215,122,97,0.35)' }}>Get Access →</button>
              <button className="hero-btn" onClick={()=>navigate('/login')} style={{ padding:'14px 38px',border:'1px solid rgba(255,255,255,0.07)',background:'transparent',color:'rgba(242,242,242,0.45)',fontSize:13,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer' }}>Log In</button>
            </div>
            <div style={{ display:'flex',gap:48,paddingTop:28,borderTop:'1px solid rgba(255,255,255,0.07)',width:'100%' }}>
              {[['3','Specialist Agents'],['39','Clinical Docs'],['0','Hallucinated Facts']].map(([n,l],i)=>(
                <div key={i}>
                  <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:34,fontWeight:600,color:'#D77A61',lineHeight:1,textAlign:'left' }}>{n}</div>
                  <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:4,textAlign:'left' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:'flex',flexDirection:'column' }}>
            <div style={{ display:'flex',gap:6,marginBottom:12 }}>
              {(['doctor','patient','radiologist','admin'] as const).map(r=>(
                <button key={r} className="role-tab" onClick={()=>setActiveRole(r)} style={{ padding:'6px 14px',background:'transparent',border:`1px solid ${activeRole===r?'#D77A61':'rgba(255,255,255,0.07)'}`,color:activeRole===r?'#D77A61':'rgba(242,242,242,0.45)',fontSize:11,fontWeight:500,letterSpacing:'0.04em',textTransform:'capitalize',cursor:'pointer',borderRadius:4 }}>{r}</button>
              ))}
            </div>
            <div style={{ background:'#0f0f0f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden',boxShadow:'0 40px 120px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.04)' }}>
              <div style={{ background:'#1a1a1a',padding:'10px 16px',display:'flex',alignItems:'center',gap:6,borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width:10,height:10,borderRadius:'50%',background:'#ff5f57',flexShrink:0 }} />
                <div style={{ width:10,height:10,borderRadius:'50%',background:'#febc2e',flexShrink:0 }} />
                <div style={{ width:10,height:10,borderRadius:'50%',background:'#28c840',flexShrink:0 }} />
                <div style={{ flex:1,margin:'0 12px',background:'#111',borderRadius:4,padding:'3px 10px',fontSize:10,color:'rgba(242,242,242,0.18)',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>clinicaliq.app/{activeRole}/dashboard</div>
                <div style={{ fontSize:9,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',flexShrink:0 }}>{roleLabels[activeRole].label} view</div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'148px 1fr' }}>
                <div style={{ background:'#0d1f28',borderRight:'1px solid rgba(255,255,255,0.07)',padding:'16px 10px',display:'flex',flexDirection:'column',gap:2,minHeight:500 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:16,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ width:20,height:20,borderRadius:5,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:10,fontWeight:700,color:'#223843',flexShrink:0 }}>C</div>
                    <span style={{ fontSize:11,fontWeight:600,color:'#F2F2F2' }}>ClinicalIQ</span>
                  </div>
                  {roleLabels[activeRole].nav.map((item,i)=>(
                    <div key={i} style={{ padding:'7px 10px',borderRadius:5,fontSize:10,color:i===0?'#fff':'rgba(242,242,242,0.45)',background:i===0?'rgba(255,255,255,0.09)':'transparent',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <span>{item.replace(' ①','')}</span>
                      {item.includes('①')&&<span style={{ width:14,height:14,borderRadius:'50%',background:'#D77A61',display:'grid',placeItems:'center',fontSize:8,color:'#fff',flexShrink:0 }}>1</span>}
                    </div>
                  ))}
                  <div style={{ marginTop:'auto',paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                      <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(215,122,97,0.2)',display:'grid',placeItems:'center',fontSize:9,fontWeight:700,color:'#D77A61',flexShrink:0 }}>{roleLabels[activeRole].user}</div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:9,fontWeight:600,color:'#F2F2F2',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{roleLabels[activeRole].name}</div>
                        <div style={{ fontSize:8,color:'rgba(242,242,242,0.45)',textTransform:'capitalize' }}>{activeRole}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding:'16px',overflowY:'auto',maxHeight:500 }}>
                  {rolePreviews[activeRole]}
                </div>
              </div>
            </div>
            <div style={{ marginTop:10,fontSize:11,color:'rgba(242,242,242,0.45)',textAlign:'center',fontFamily:'monospace',letterSpacing:'0.04em' }}>↑ {roleLabels[activeRole].desc}</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background:'#D77A61',padding:'14px 0',overflow:'hidden',whiteSpace:'nowrap' }}>
        <div style={{ display:'inline-block',animation:'marquee 28s linear infinite' }}>
          {[...Array(6)].map((_,i)=>(
            <span key={i} style={{ fontSize:12,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(242,242,242,0.75)',margin:'0 32px' }}>
              Lab Interpreter Agent &nbsp;·&nbsp; Radiology Analyzer Agent &nbsp;·&nbsp; Allergy Safety Agent &nbsp;·&nbsp; NetworkX Knowledge Graph &nbsp;·&nbsp; Langfuse Observability &nbsp;·&nbsp; RAG Grounded Outputs &nbsp;·&nbsp; Zero Hallucinations
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section style={{ background:'#111111',padding:'80px 56px',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)' }}>
          {[
            { n:'3',    s:'Specialist Agents',  d:'Lab, Radiology, Allergy — parallel via asyncio.gather' },
            { n:'100%', s:'RAG Grounded',        d:'Every claim traceable to source document chunks' },
            { n:'< 1s', s:'Routing Time',        d:'From query classification to doctor auto-assignment' },
            { n:'0',    s:'Hallucinated Facts',  d:'Grounding enforced by Pydantic output contracts' },
          ].map((s,i)=>(
            <div key={i} className="stat-cell" style={{ padding:'44px 40px',borderLeft:i>0?'1px solid rgba(255,255,255,0.07)':'none',textAlign:'left' }}>
              <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:60,fontWeight:500,color:'#D77A61',lineHeight:1,marginBottom:6 }}>{s.n}</div>
              <div style={{ fontSize:12,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'#F2F2F2',marginBottom:6 }}>{s.s}</div>
              <div style={{ fontSize:13,color:'rgba(242,242,242,0.45)',lineHeight:1.5 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" style={{ background:'#0a0a0a',padding:'120px 56px' }}>
        <div style={{ maxWidth:1300,margin:'0 auto' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:72,flexWrap:'wrap',gap:24 }}>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'#D77A61',fontWeight:500,marginBottom:16 }}>How It Works</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(36px,4vw,52px)',fontWeight:500,color:'#F2F2F2',lineHeight:1.05,letterSpacing:'-0.02em' }}>Upload to insight<br/>in under 5 seconds.</h2>
            </div>
            <p style={{ fontSize:15,color:'rgba(242,242,242,0.45)',maxWidth:320,lineHeight:1.75,fontWeight:300,textAlign:'left' }}>Every step is automated. Agents run in parallel. Doctors never wait for context.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)' }}>
            {[
              { n:'01',title:'Upload Document',      desc:'Patient uploads PDF or DOCX lab report, radiology study, or discharge summary.' },
              { n:'02',title:'Agents Run Parallel',  desc:'Lab, Radiology, and Allergy agents execute simultaneously via asyncio.gather.' },
              { n:'03',title:'Conflicts Reconciled', desc:'Orchestrator queries NetworkX for drug-allergen conflicts and overrides where needed.' },
              { n:'04',title:'Role Filter Applied',  desc:'Patient sees plain language. Doctor sees full clinical detail. Same query, different views.' },
              { n:'05',title:'Doctor Auto-Assigned', desc:'5-factor scoring engine evaluates all eligible doctors. Highest scorer assigned instantly.' },
            ].map((step,i)=>(
              <div key={i} style={{ padding:'36px 28px',borderLeft:i>0?'1px solid rgba(255,255,255,0.07)':'none',position:'relative',textAlign:'left' }}>
                {i<4&&<div style={{ position:'absolute',right:-1,top:36,width:10,height:10,borderTop:'2px solid #D77A61',borderRight:'2px solid #D77A61',transform:'rotate(45deg)',zIndex:1 }} />}
                <div style={{ width:36,height:36,borderRadius:'50%',background:i===0?'#D77A61':'#1a1a1a',border:`1px solid ${i===0?'#D77A61':'rgba(255,255,255,0.07)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:i===0?'#F2F2F2':'rgba(242,242,242,0.45)',marginBottom:18 }}>{step.n}</div>
                <div style={{ fontSize:14,fontWeight:600,color:'#F2F2F2',marginBottom:10,lineHeight:1.3 }}>{step.title}</div>
                <div style={{ fontSize:12,color:'rgba(242,242,242,0.45)',lineHeight:1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" style={{ background:'#111111',padding:'120px 56px',borderTop:'1px solid rgba(255,255,255,0.07)',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:1300,margin:'0 auto' }}>
          <div style={{ marginBottom:72,textAlign:'left' }}>
            <div style={{ fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'#D77A61',fontWeight:500,marginBottom:16 }}>Agent Pipeline</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(36px,4vw,52px)',fontWeight:500,color:'#F2F2F2',lineHeight:1.05,letterSpacing:'-0.02em' }}>Three agents. One orchestrator.<br/>Zero hallucinations.</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'rgba(255,255,255,0.07)' }}>
            {[
              { n:'01',title:'Lab Interpreter Agent',    sub:'CBC · LFT · KFT · Thyroid · Cardiac',         desc:'Retrieves lab chunks from ChromaDB. Interprets every test with reference ranges, per-test status, clinical significance, and a Pydantic LabReport output contract. Confidence score propagated to orchestrator.' },
              { n:'02',title:'Radiology Analyzer Agent', sub:'X-Ray · CT · MRI · Ultrasound',              desc:'Retrieves radiology chunks. Returns findings, ranked differential diagnoses with probability, urgency flag for critical findings, and follow-up recommendations. Sets emergency_flag on critical detection.' },
              { n:'03',title:'Allergy Safety Agent',     sub:'Cross-reactivity · Conflicts · Emergency',   desc:'Retrieves allergy records. Queries NetworkX for cross-reactive medications. Returns severity, safe alternatives. Sets emergency_flag=True for anaphylactic risk — triggering HITL and email alerts immediately.' },
            ].map((f,i)=>(
              <div key={i} className="feature-card" style={{ background:'#141414',padding:'52px 48px',cursor:'default',textAlign:'left' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:40,fontWeight:500,color:'#222',lineHeight:1 }}>{f.n}</div>
                  <div style={{ fontSize:10,padding:'3px 10px',background:'rgba(215,122,97,0.12)',color:'#D77A61',letterSpacing:'0.08em',textTransform:'uppercase',borderRadius:2 }}>{f.sub}</div>
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:26,fontWeight:500,color:'#F2F2F2',marginBottom:14,letterSpacing:'-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize:14,color:'rgba(242,242,242,0.45)',lineHeight:1.8,fontWeight:300 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background:'#141414',border:'1px solid rgba(255,255,255,0.07)',padding:'24px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginTop:1 }}>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:11,color:'#D77A61',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>◆ Orchestrator</div>
              <div style={{ fontSize:15,fontWeight:600,color:'#F2F2F2' }}>Parallel → Reconcile → Role Filter → Confidence Gate → HITL</div>
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {['asyncio.gather','NetworkX','Pydantic v2','LangChain LCEL','Langfuse'].map(tag=>(
                <span key={tag} style={{ padding:'4px 12px',background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(242,242,242,0.45)',fontSize:11,fontFamily:'monospace',borderRadius:3 }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" style={{ background:'#0a0a0a',padding:'120px 56px' }}>
        <div style={{ maxWidth:1300,margin:'0 auto' }}>
          <div style={{ marginBottom:72,textAlign:'left' }}>
            <div style={{ fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'#D77A61',fontWeight:500,marginBottom:16 }}>Four Interfaces</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(36px,4vw,52px)',fontWeight:500,color:'#F2F2F2',lineHeight:1.05,letterSpacing:'-0.02em' }}>Purpose-built for every role.</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
            {[
              { role:'Patient',     accent:'#D8B4A0', tag:'Plain language', desc:'Upload documents, ask questions in plain English. Never see a raw lab value.', points:['Plain-language results','Color-coded health flags','Assigned doctor card','One-tap messaging','Report PDF download'] },
              { role:'Doctor',      accent:'#D77A61', tag:'Full clinical',  desc:'Full clinical detail across 4 tabs. HITL queue, AI-assisted chat, conflict notes, confidence scores.', points:['4-tab query results','HITL review queue','AI-assisted patient chat','Allergy conflict notes','Source chunk citations'] },
              { role:'Radiologist', accent:'#223843', tag:'Imaging focus',  desc:'Imaging queue routed to your expertise. Ranked differentials, urgency detection, collaboration.', points:['Expertise-matched queue','Ranked differentials','Urgency auto-flag','Doctor collaboration chat','Formal report export'] },
              { role:'Admin',       accent:'#B85B43', tag:'Full control',   desc:'Create staff, monitor routing, track Langfuse costs, override assignments, export audit logs.', points:['Create doctor accounts','Routing log + override','Langfuse cost tracking','Emergency flag monitor','Full audit trail'] },
            ].map((r,i)=>(
              <div key={i} className="role-card" style={{ border:'1px solid rgba(255,255,255,0.07)',padding:'36px 28px',position:'relative',overflow:'hidden',textAlign:'left' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:r.accent }} />
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:26,fontWeight:600,color:'#F2F2F2' }}>{r.role}</span>
                  <span style={{ fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 10px',background:`${r.accent}22`,color:r.accent,fontWeight:600,borderRadius:2 }}>{r.tag}</span>
                </div>
                <p style={{ fontSize:13,color:'rgba(242,242,242,0.45)',lineHeight:1.75,marginBottom:20,fontWeight:300 }}>{r.desc}</p>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {r.points.map((p,j)=>(
                    <div key={j} style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:4,height:4,background:r.accent,flexShrink:0 }} />
                      <span style={{ fontSize:12,color:'rgba(242,242,242,0.45)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section id="stack" style={{ background:'#111111',padding:'120px 56px',borderTop:'1px solid rgba(255,255,255,0.07)',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:1300,margin:'0 auto' }}>
          <div style={{ marginBottom:72,textAlign:'left' }}>
            <div style={{ fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'#D77A61',fontWeight:500,marginBottom:16 }}>Technology Stack</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(36px,4vw,52px)',fontWeight:500,color:'#F2F2F2',lineHeight:1.05,letterSpacing:'-0.02em' }}>Production-grade from day one.</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'rgba(255,255,255,0.07)' }}>
            {[
              { layer:'Agent Framework', tech:'LangChain LCEL',            detail:'Chains, pipes, LCEL composition' },
              { layer:'Language Models', tech:'GPT-4o-mini / GPT-4o',     detail:'Model tiering by task criticality' },
              { layer:'Vector Store',    tech:'ChromaDB',                  detail:'Cosine similarity, metadata filters' },
              { layer:'Embeddings',      tech:'sentence-transformers',     detail:'all-MiniLM-L6-v2, loaded once' },
              { layer:'Knowledge Graph', tech:'NetworkX',                  detail:'Drug-allergen cross-reactivity graph' },
              { layer:'Observability',   tech:'Langfuse',                  detail:'Traces, spans, cost attribution' },
              { layer:'Backend API',     tech:'FastAPI + uvicorn',         detail:'Async, WebSocket, background tasks' },
              { layer:'Database',        tech:'Supabase (PostgreSQL)',      detail:'9 tables, RLS, full audit logs' },
              { layer:'Frontend',        tech:'React + Vite + TypeScript', detail:'4 role dashboards, real-time' },
              { layer:'Auth',            tech:'Clerk',                     detail:'Multi-role JWT, OTP, activation' },
              { layer:'Validation',      tech:'Pydantic v2',               detail:'Agent output contracts enforced' },
              { layer:'UI (Notebook)',   tech:'Gradio',                    detail:'File upload, tabbed results, viz' },
            ].map((item,i)=>(
              <div key={i} className="feature-card" style={{ background:'#141414',padding:'28px 24px',cursor:'default',textAlign:'left' }}>
                <div style={{ fontSize:10,color:'rgba(242,242,242,0.45)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>{item.layer}</div>
                <div style={{ fontSize:15,fontWeight:600,color:'#F2F2F2',marginBottom:6 }}>{item.tech}</div>
                <div style={{ fontSize:12,color:'rgba(242,242,242,0.45)' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'#080808',padding:'140px 56px',textAlign:'center',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 50% at 50% 50%,rgba(215,122,97,0.1) 0%,transparent 65%)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:0,right:0,width:500,height:500,background:'radial-gradient(circle,rgba(34,56,67,0.15) 0%,transparent 65%)',pointerEvents:'none' }} />
        <div style={{ position:'relative',maxWidth:640,margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'clamp(44px,6vw,72px)',fontWeight:500,color:'#F2F2F2',lineHeight:0.95,letterSpacing:'-0.025em',marginBottom:24 }}>Clinical AI that<br/>actually works.</h2>
          <p style={{ fontSize:16,color:'rgba(242,242,242,0.4)',marginBottom:48,lineHeight:1.75,fontWeight:300 }}>Role-based access. Grounded outputs. Zero hallucinated facts.<br/>Built for the PwC × Agentic AI Capstone.</p>
          <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap' }}>
            <button className="hero-btn" onClick={()=>navigate('/register')} style={{ padding:'15px 48px',background:'#D77A61',color:'#F2F2F2',border:'none',fontSize:13,fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 40px rgba(215,122,97,0.35)' }}>Get Started →</button>
            <button className="hero-btn" onClick={()=>navigate('/login')} style={{ padding:'15px 48px',border:'1px solid rgba(242,242,242,0.15)',background:'transparent',color:'rgba(242,242,242,0.6)',fontSize:13,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer' }}>Log In</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#050505',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'36px 56px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:'#223843' }}>C</div>
          <span style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:17,color:'#F2F2F2',fontWeight:600 }}>ClinicalIQ</span>
        </div>
        <div style={{ display:'flex',gap:32 }}>
          {['Features','Agents','Roles','Stack'].map(l=>(
            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ fontSize:12,color:'rgba(255,255,255,0.2)',textDecoration:'none',letterSpacing:'0.04em' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize:11,color:'rgba(255,255,255,0.15)',letterSpacing:'0.06em',fontFamily:'monospace' }}>
          Ubaid Kundlik · PwC × Agentic AI · 2026
        </div>
      </footer>

    </div>
  )
}