// FILE: clinicaliq/frontend/src/pages/doctor/Dashboard.tsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokens } from '../../components/shared/tokens'
import Icon from '../../components/shared/Icon'
import QueryScreen   from './Query'
import ChatScreen    from './Chat'
import PatientScreen from './PatientProfile'
import api from '../../lib/axios'

type Screen = 'dashboard' | 'patients' | 'query' | 'hitl' | 'chat' | 'reports' | 'staffchat'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [dark, setDark]                       = useState(true)
  const [screen, setScreen]                   = useState<Screen>('dashboard')
  const [reports, setReports]                 = useState<any[]>([])
  const [patients, setPatients]               = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [hitlCount, setHitlCount]             = useState(0)
  const [showPicker, setShowPicker]           = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const user      = JSON.parse(localStorage.getItem('ciq_user') || '{}')
  const firstName = user.full_name?.split(' ').slice(-1)[0] || 'Doctor'
  const initials  = user.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() || 'DR'
  const t         = tokens(dark)

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchData = async () => {
    try {
      const [myPatientsRes] = await Promise.all([
        api.get('/routing/my-patients'),
      ])
      const myPatients = myPatientsRes.data.patients || []
      setPatients(myPatients.map((p:any) => p.patient).filter(Boolean))

      // Flatten all reports from assigned patients
      const allReports = myPatients.flatMap((p:any) => p.reports || [])
      setReports(allReports)
      setHitlCount(allReports.filter((r:any) => r.hitl_required).length)

      // Auto-select first assigned patient
      if (myPatients.length > 0 && myPatients[0].patient) {
        setSelectedPatient(myPatients[0].patient)
      }
    } catch {}
  }

  const selectPatient = (p: any) => {
    setSelectedPatient(p)
    setShowPicker(false)
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const navItems = [
    { id:'dashboard', label:'Dashboard',       icon:'dashboard' },
    { id:'patients',  label:'Patient profile', icon:'users'     },
    { id:'query',     label:'Run a query',     icon:'query'     },
    { id:'hitl',      label:'Human review',    icon:'flag',     badge: hitlCount },
    { id:'chat',      label:'Patient chat',    icon:'chat'      },
    { id:'reports',   label:'Reports',         icon:'report'    },
    { id:'staffchat', label:'Consult radiologist', icon:'chat'      },
  ]

  const crumbs: Record<Screen,string> = {
    dashboard: 'Doctor workspace',
    patients:  selectedPatient ? `${selectedPatient.full_name} — Profile` : 'Patient profile',
    query:     'Clinical query',
    hitl:      'Human-in-the-loop review',
    chat:      'Patient chat',
    reports:   'Generated reports',
    staffchat: 'Consult radiologist',
  }

  const patientReports = selectedPatient
    ? reports.filter((r:any) => r.patient_id === selectedPatient.id)
    : reports

  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',height:'100vh',fontFamily:"'DM Sans',sans-serif",background:t.bg,color:t.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(215,122,97,0.4);border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        select,textarea,input{outline:none;}
        button{font-family:'DM Sans',sans-serif;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{background:t.sidebar,display:'flex',flexDirection:'column',padding:'16px 12px',gap:2,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(500px 300px at -10% -10%,rgba(215,122,97,0.1),transparent 60%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'4px 8px 16px',position:'relative',zIndex:1}}>
          <div style={{width:26,height:26,borderRadius:6,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,color:'#223843',flexShrink:0}}>C</div>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:'#fff'}}>ClinicalIQ</div>
            <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.4)'}}>Doctor workspace</div>
          </div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',padding:'6px 8px',position:'relative',zIndex:1}}>Workspace</div>
        {navItems.map(item=>(
          <div key={item.id} onClick={()=>setScreen(item.id as Screen)}
            style={{display:'flex',alignItems:'center',gap:9,padding:'7px 8px',borderRadius:6,cursor:'pointer',position:'relative',zIndex:1,background:screen===item.id?'rgba(255,255,255,0.1)':'transparent',color:screen===item.id?'#fff':'rgba(255,255,255,0.65)',fontSize:13,transition:'all 0.15s'}}>
            <Icon name={item.icon} size={15}/>
            <span style={{flex:1}}>{item.label}</span>
            {item.badge!=null && item.badge>0 && (
              <span style={{width:17,height:17,borderRadius:'50%',background:'#D77A61',display:'grid',placeItems:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>{item.badge}</span>
            )}
          </div>
        ))}
        <div style={{marginTop:8,padding:'6px 8px',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',marginBottom:6}}>Switch role</div>
          {[['Patient','/patient/dashboard'],['Radiologist','/radiologist/dashboard'],['Admin','/admin/dashboard']].map(([label,path])=>(
            <div key={label} onClick={()=>navigate(path)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderRadius:5,cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:12}}>
              <span style={{fontSize:11}}>→</span> {label}
            </div>
          ))}
          <div onClick={logout} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderRadius:5,cursor:'pointer',color:'rgba(255,255,255,0.35)',fontSize:12,marginTop:4}}>
            <span style={{fontSize:11}}>×</span> Sign out
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{position:'relative',zIndex:1,padding:'6px 8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{dark?'Dark':'Light'} mode</span>
          <button onClick={()=>setDark(!dark)} style={{width:38,height:22,borderRadius:999,background:dark?'#D77A61':'rgba(255,255,255,0.2)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
            <div style={{position:'absolute',top:2,left:dark?18:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.3s',display:'grid',placeItems:'center'}}>
              <Icon name={dark?'moon':'sun'} size={10}/>
            </div>
          </button>
        </div>
        <div style={{borderTop:'0.5px solid rgba(255,255,255,0.08)',paddingTop:10,display:'flex',alignItems:'center',gap:10,position:'relative',zIndex:1}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(215,184,160,0.3)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:'#D8B4A0',flexShrink:0}}>{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,color:'#fff',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.full_name||'Doctor'}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:'monospace',textTransform:'uppercase'}}>Doctor</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* TOPBAR */}
        <div style={{background:t.bgCard,borderBottom:`0.5px solid ${t.border}`,padding:'0 24px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em'}}>Doctor / {screen}</div>
            <div style={{fontSize:15,fontWeight:600,color:t.text}}>{crumbs[screen]}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>

            {/* PATIENT SELECTOR */}
            <div ref={pickerRef} style={{position:'relative'}}>
              <button onClick={()=>setShowPicker(!showPicker)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'0 12px',height:32,background:selectedPatient?t.peachSoft:t.bgAlt,border:`0.5px solid ${selectedPatient?t.peach:t.border}`,borderRadius:7,fontSize:12,color:selectedPatient?t.peach:t.textMuted,cursor:'pointer'}}>
                {selectedPatient ? (
                  <>
                    <div style={{width:18,height:18,borderRadius:'50%',background:t.peach,display:'grid',placeItems:'center',fontSize:9,fontWeight:700,color:'#fff'}}>
                      {selectedPatient.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
                    </div>
                    {selectedPatient.full_name}
                    <Icon name="chevron" size={12}/>
                  </>
                ) : (
                  <><Icon name="users" size={13}/> Select patient</>
                )}
              </button>
              {showPicker && (
                <div style={{position:'absolute',top:38,right:0,width:240,background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadowMd,zIndex:100,overflow:'hidden'}}>
                  <div style={{padding:'8px 12px',borderBottom:`0.5px solid ${t.border}`,fontSize:11,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase'}}>Select patient</div>
                  {patients.length === 0 ? (
                    <div style={{padding:'16px 12px',fontSize:12,color:t.textFaint,textAlign:'center'}}>No patients yet</div>
                  ) : patients.map((p:any)=>(
                    <div key={p.id} onClick={()=>selectPatient(p)}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',background:selectedPatient?.id===p.id?t.peachSoft:'transparent',borderBottom:`0.5px solid ${t.border}`,transition:'background 0.15s'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(215,122,97,0.2)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:t.peach,flexShrink:0}}>
                        {p.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'PT'}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:t.text}}>{p.full_name||'Patient'}</div>
                        <div style={{fontSize:11,color:t.textMuted}}>{p.email}</div>
                      </div>
                      {selectedPatient?.id===p.id && <Icon name="check" size={14}/>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 12px',height:32,background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,fontSize:12,color:t.textFaint}}>
              <Icon name="query" size={13}/>
              <span>Search…</span>
              <span style={{fontFamily:'monospace',fontSize:10,padding:'1px 5px',background:t.border,borderRadius:4}}>⌘K</span>
            </div>
            <button style={{display:'flex',alignItems:'center',gap:6,padding:'0 12px',height:32,background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,fontSize:12,color:t.textMuted,cursor:'pointer'}}>
              <Icon name="sparkle" size={13}/> AI assistant
            </button>
            {hitlCount>0 && (
              <div onClick={()=>setScreen('hitl')} style={{display:'flex',alignItems:'center',gap:8,padding:'0 12px',height:32,background:'rgba(184,91,67,0.15)',border:'1px solid rgba(184,91,67,0.35)',borderRadius:7,cursor:'pointer'}}>
                <Icon name="alert" size={13}/>
                <span style={{fontSize:12,color:'#D77A61',fontWeight:500}}>{hitlCount} HITL pending</span>
              </div>
            )}
            <button style={{width:32,height:32,borderRadius:7,background:t.bgAlt,border:`0.5px solid ${t.border}`,display:'grid',placeItems:'center',color:t.textMuted,cursor:'pointer'}}>
              <Icon name="bell" size={14}/>
            </button>
          </div>
        </div>

        {/* SCREEN */}
        <div style={{flex:1,overflowY:'auto',background:t.bg}}>
          {screen==='dashboard' && <DoctorHome t={t} dark={dark} firstName={firstName} reports={reports} patientReports={patientReports} selectedPatient={selectedPatient} hitlCount={hitlCount} go={setScreen} goPatient={selectPatient}/>}
          {screen==='patients'  && <PatientScreen t={t} dark={dark} selectedPatient={selectedPatient} reports={patientReports} go={setScreen}/>}
          {screen==='query'     && <QueryScreen t={t} dark={dark} selectedPatient={selectedPatient}/>}
          {screen==='hitl'      && <HITLScreen t={t} dark={dark} reports={reports} go={setScreen} onRefresh={fetchData}/>}
          {screen==='chat'      && <ChatScreen t={t} dark={dark} selectedPatient={selectedPatient}/>}
          {screen==='reports'   && <AllReports t={t} dark={dark} reports={patientReports.length>0?patientReports:reports} selectedPatient={selectedPatient}/>}
          {screen==='staffchat' && <StaffChatScreen t={t} dark={dark} selectedPatient={selectedPatient}/>}
        </div>
      </div>
    </div>
  )
}

// ── Doctor Home ────────────────────────────────────────────────
function DoctorHome({t,dark,firstName,reports,patientReports,selectedPatient,hitlCount,go,goPatient}:any) {
  const emergency = reports.filter((r:any)=>r.emergency_flag)
  const hitl      = reports.filter((r:any)=>r.hitl_required)
  const avgConf   = reports.length>0 ? reports.reduce((s:number,r:any)=>s+(r.confidence||0),0)/reports.length : 0
  const hour      = new Date().getHours()
  const greeting  = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const cleanQ    = (q:string) => (q||'').replace(/^\[Referring to:[^\]]+\]\s*/i,'').trim()

  // Deduplicate by patient_id — show only most recent query per patient
  const uniquePatientReports = Object.values(
    reports.reduce((acc:any, r:any) => {
      const pid = r.patient_id || 'unknown'
      if (!acc[pid] || new Date(r.created_at) > new Date(acc[pid].created_at)) {
        acc[pid] = r
      }
      return acc
    }, {})
  ) as any[]

  // Mini sparkline SVG
  const Spark = ({color}:{color:string}) => {
    const pts = [40,35,45,30,38,28,32,25,20,15]
    const max = Math.max(...pts), min = Math.min(...pts)
    const norm = pts.map(p=>((p-min)/(max-min||1))*30)
    const path = norm.map((y,i)=>`${i===0?'M':'L'}${i*8},${30-y}`).join(' ')
    return (
      <svg width={72} height={32} style={{opacity:0.5}}>
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  return (
    <div style={{padding:24,maxWidth:1200,animation:'fadeUp 0.4s ease both'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>
            {greeting}, Dr. {firstName}
          </h1>
          <div style={{fontSize:13,color:t.textMuted}}>
            {reports.length} reports generated · {hitlCount} case{hitlCount!==1?'s':''} need{hitlCount===1?'s':''} your review · Hematology focus
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',borderRadius:7,fontSize:13,fontWeight:500,cursor:'pointer',border:`0.5px solid ${t.border}`,background:t.bgCard,color:t.text,fontFamily:"'DM Sans',sans-serif"}}>
            <Icon name="upload" size={13}/> Upload for patient
          </button>
          <button onClick={()=>go('query')} style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',borderRadius:7,fontSize:13,fontWeight:500,cursor:'pointer',border:`0.5px solid ${t.peach}`,background:t.peach,color:'#fff',fontFamily:"'DM Sans',sans-serif"}}>
            <Icon name="query" size={13}/> Run query
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {label:'Assigned patients', val:reports.length.toString(),       sub:'total queries',           color:t.peach},
              {label:'Reports generated', val:reports.length.toString(),        sub:'this week',        color:t.peach},
              {label:'HITL queue',        val:hitlCount.toString(),              sub:hitlCount>0?'needs your review':'all clear', color:hitlCount>0?'#D77A61':t.ok},
              {label:'Avg confidence',    val:`${(avgConf*100).toFixed(0)}%`,   sub:'last 7 days',     color:t.peach},
            ].map(s=>(
              <div key={s.label} style={{padding:'16px 18px',borderRadius:10,background:t.bgCard,border:`0.5px solid ${t.border}`,boxShadow:t.shadow}}>
                <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{s.label}</div>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:'monospace',marginBottom:2}}>{s.val}</div>
                    <div style={{fontSize:11,color:t.textMuted}}>{s.sub}</div>
                  </div>
                  <Spark color={s.color}/>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency */}
          {emergency.length>0 && (
            <div style={{padding:'14px 18px',background:'rgba(184,91,67,0.12)',border:'1px solid rgba(184,91,67,0.35)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <Icon name="alert" size={18}/>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:'#D77A61'}}>{emergency.length} Emergency flag{emergency.length>1?'s':''} — immediate attention required</div>
                  <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{cleanQ(emergency[0]?.query_text||''). slice(0,60)}…</div>
                </div>
              </div>
              <button onClick={()=>go('hitl')} style={{padding:'6px 14px',background:'#D77A61',color:'#fff',border:'none',borderRadius:7,fontSize:12,cursor:'pointer',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
                Review now →
              </button>
            </div>
          )}

          {/* Patient table */}
          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontWeight:600,fontSize:14,color:t.text}}>Assigned patients</div>
                <span style={{padding:'2px 8px',background:t.peachSoft,color:t.peach,fontSize:11,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>{uniquePatientReports.length} ACTIVE</span>
              </div>
              <div style={{fontSize:11,color:t.textFaint}}>sorted by routing time</div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                  {['Patient','Latest condition','Last query','Status',''].map(h=>(
                    <th key={h} style={{padding:'8px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniquePatientReports.length===0 ? (
                  <tr><td colSpan={5} style={{padding:'32px 20px',textAlign:'center',color:t.textFaint,fontSize:13}}>No patients yet.</td></tr>
                ) : uniquePatientReports.map((r:any,i:number)=>{
                  const colors = ['rgba(215,122,97,0.2)','rgba(215,184,160,0.2)','rgba(52,199,89,0.15)','rgba(96,165,250,0.15)','rgba(167,139,250,0.15)']
                  const tcolors = [t.peach,'#D8B4A0',t.ok,'#60a5fa','#a78bfa']
                  const ci = i % colors.length
                  const q = cleanQ(r.query_text||'')
                  return (
                    <tr key={r.id} onClick={()=>go('reports')}
                      style={{borderBottom:i<Math.min(reports.length,6)-1?`0.5px solid ${t.border}`:`none`,background:r.emergency_flag?'rgba(184,91,67,0.04)':`transparent`,cursor:'pointer',transition:'background 0.15s'}}>
                      <td style={{padding:'12px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:colors[ci],display:'grid',placeItems:'center',fontSize:12,fontWeight:700,color:tcolors[ci],flexShrink:0}}>
                            {selectedPatient?.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'PT'}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:500,color:t.text}}>{selectedPatient?.full_name||'Patient'}</div>
                            <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>MRN-{(selectedPatient?.id||r.patient_id||'').slice(0,5).toUpperCase()} · Patient</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'12px 20px',fontSize:12,color:t.textMuted,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {(()=>{
                          const qt = (r.query_text||'').toLowerCase()
                          if(qt.includes('thyroid')||qt.includes('tsh')) return 'Thyroid function — TSH elevated'
                          if(qt.includes('hemoglobin')||qt.includes('cbc')||qt.includes('anemia')) return 'CBC — Anemia workup'
                          if(qt.includes('chest')||qt.includes('xray')||qt.includes('lung')) return 'Chest X-ray review'
                          if(qt.includes('allergy')||qt.includes('penicillin')||qt.includes('ibuprofen')) return 'Allergy safety check'
                          if(qt.includes('liver')||qt.includes('alt')||qt.includes('ast')) return 'Liver function — LFT'
                          if(qt.includes('kidney')||qt.includes('creatinine')) return 'Kidney function — KFT'
                          if(qt.includes('report')||qt.includes('result')) return 'General health query'
                          return q.slice(0,45)||'Clinical query'
                        })()}
                      </td>
                      <td style={{padding:'12px 20px',fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{new Date(r.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
                      <td style={{padding:'12px 20px'}}>
                        {r.emergency_flag
                          ? <span style={{padding:'2px 8px',fontSize:10,borderRadius:99,background:'rgba(184,91,67,0.15)',color:'#D77A61',fontFamily:'monospace',fontWeight:600}}>● EMERGENCY</span>
                          : r.hitl_required
                          ? <span style={{padding:'2px 8px',fontSize:10,borderRadius:99,background:t.peachSoft,color:t.peach,fontFamily:'monospace'}}>● HITL</span>
                          : <span style={{padding:'2px 8px',fontSize:10,borderRadius:99,background:t.okSoft,color:t.ok,fontFamily:'monospace'}}>● ROUTINE</span>}
                      </td>
                      <td style={{padding:'12px 20px',color:t.textFaint,fontSize:13}}>→</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* HITL queue */}
          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:14}}>🚩</span>
                <div style={{fontWeight:600,fontSize:13,color:t.text}}>Needs human review</div>
              </div>
              <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{hitl.length} cases</span>
            </div>
            {hitl.length===0 ? (
              <div style={{padding:'24px 16px',textAlign:'center',color:t.textFaint,fontSize:12}}>✓ No cases pending</div>
            ) : hitl.slice(0,3).map((r:any,i:number)=>(
              <div key={r.id} onClick={()=>go('hitl')}
                style={{padding:'12px 16px',borderBottom:i<Math.min(hitl.length,3)-1?`0.5px solid ${t.border}`:`none`,cursor:'pointer',transition:'background 0.15s'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:r.emergency_flag?'rgba(184,91,67,0.2)':`rgba(215,184,160,0.2)`,display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:r.emergency_flag?'#D77A61':'#D8B4A0',flexShrink:0}}>
                    {selectedPatient?.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'PT'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,fontWeight:600,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>
                        {selectedPatient?.full_name||'Patient'}
                      </span>
                      <span style={{padding:'1px 6px',fontSize:9,borderRadius:4,background:r.emergency_flag?'rgba(184,91,67,0.2)':`rgba(215,122,97,0.15)`,color:r.emergency_flag?'#D77A61':t.peach,fontFamily:'monospace',fontWeight:600,flexShrink:0,marginLeft:4}}>
                        {r.emergency_flag?'EMERGENCY':r.confidence<0.5?'LOW CONFIDENCE':'CONFLICTING AGENT OUTPUTS'}
                      </span>
                    </div>
                    <div style={{fontSize:11,color:t.textMuted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {cleanQ(r.query_text||'').slice(0,40)}
                    </div>
                  </div>
                </div>
                <div style={{height:3,background:t.border,borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${(r.confidence||0)*100}%`,height:'100%',background:r.emergency_flag?'#D77A61':t.peach,borderRadius:2}}/>
                </div>
                <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',marginTop:4}}>{((r.confidence||0)*100).toFixed(0)}%</div>
              </div>
            ))}
            {hitl.length>0 && (
              <div style={{padding:'10px 16px',borderTop:`0.5px solid ${t.border}`}}>
                <button onClick={()=>go('hitl')} style={{width:'100%',padding:'7px',background:t.peachSoft,border:`0.5px solid ${t.peach}`,color:t.peach,borderRadius:7,fontSize:12,cursor:'pointer',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
                  Review all {hitl.length} cases →
                </button>
              </div>
            )}
          </div>

          {/* Availability */}
          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,padding:'14px 16px'}}>
            <div style={{fontWeight:600,fontSize:13,color:t.text,marginBottom:12}}>My availability</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:t.ok}}/>
              <span style={{fontSize:12,color:t.ok,fontWeight:600}}>AVAILABLE</span>
              <span style={{marginLeft:'auto',fontSize:11,color:t.textMuted,fontFamily:'monospace'}}>1 / 20 capacity</span>
            </div>
            <div style={{height:4,background:t.border,borderRadius:2,marginBottom:10}}>
              <div style={{width:'5%',height:'100%',background:t.ok,borderRadius:2}}/>
            </div>
            <div style={{fontSize:11,color:t.textFaint}}>Mon–Fri · 09:00–17:00 · Hematology · Internal Med</div>
          </div>

          {/* Quick actions */}
          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,padding:'14px 16px'}}>
            <div style={{fontWeight:600,fontSize:13,color:t.text,marginBottom:10}}>Quick actions</div>
            {[
              {label:'Run clinical query', icon:'sparkle', action:()=>go('query')},
              {label:'Message a patient',  icon:'chat',    action:()=>go('chat')},
              {label:'View all reports',   icon:'report',  action:()=>go('reports')},
            ].map(a=>(
              <button key={a.label} onClick={a.action}
                style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,fontSize:12,cursor:'pointer',color:t.text,marginBottom:6,textAlign:'left',fontFamily:"'DM Sans',sans-serif"}}>
                <Icon name={a.icon} size={13}/> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


// ── HITL Screen ────────────────────────────────────────────────
function HITLScreen({t,dark,reports,go,onRefresh}:any) {
  const hitl = reports.filter((r:any)=>r.hitl_required && !r.approved && r.role==='patient')
  const done = reports.filter((r:any)=>r.hitl_required && r.approved && r.role==='patient')
  const [selected, setSelected]   = useState<string|null>(null)
  const [approving, setApproving] = useState<string|null>(null)
  const [notes, setNotes]         = useState<Record<string,string>>({})
  const cleanQ = (q:string) => q?.replace(/^\[Referring to:[^\]]+\]\s*/i,'').trim()

  const handleApprove = async (id: string) => {
    setApproving(id)
    try {
      await api.post(`/query/approve-report/${id}`, { notes: notes[id] || "" })
      setSelected(null)
      if (onRefresh) onRefresh()
    } catch {}
    finally { setApproving(null) }
  }

  return (
    <div style={{padding:24,maxWidth:1100,animation:'fadeUp 0.4s ease both'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>Human review required</h1>
        <div style={{fontSize:13,color:t.textMuted}}>AI flagged these cases. You must approve, override, or escalate before the patient sees results.</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Pending review',  val:hitl.filter((r:any)=>!false).length, color:t.peach},
          {label:'Emergency flags', val:hitl.filter((r:any)=>r.emergency_flag).length,    color:'#D77A61'},
          {label:'Approved',        val:done.length,                                     color:t.ok},
        ].map(s=>(
          <div key={s.label} style={{padding:'14px 18px',borderRadius:10,background:t.bgCard,border:`0.5px solid ${t.border}`,boxShadow:t.shadow}}>
            <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:'monospace'}}>{s.val}</div>
          </div>
        ))}
      </div>

      {hitl.length===0 ? (
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,padding:'64px 40px',textAlign:'center',boxShadow:t.shadow}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:t.okSoft,display:'grid',placeItems:'center',margin:'0 auto 16px',color:t.ok,fontSize:22}}>✓</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:t.text,marginBottom:8}}>All clear</h2>
          <p style={{fontSize:13,color:t.textMuted}}>No cases require your review.</p>
        </div>
      ) : (
        <>
        {done.length > 0 && (
          <div style={{padding:'10px 16px',background:t.okSoft,border:`0.5px solid ${t.ok}`,borderRadius:10,marginBottom:12,fontSize:13,color:t.ok}}>
            ✓ {done.length} case{done.length>1?'s':''} approved — patient results released
          </div>
        )}
        {hitl.map((r:any)=>{
        const isApproved = r.approved || false
        const isOpen     = selected===r.id
        const query      = cleanQ(r.query_text||'')
        const rj         = r.response_json || {}
        return (
          <div key={r.id} style={{background:t.bgCard,border:`1px solid ${r.emergency_flag&&!isApproved?'rgba(184,91,67,0.5)':t.border}`,borderRadius:10,overflow:'hidden',boxShadow:t.shadow,marginBottom:12,opacity:isApproved?0.6:1}}>
            {r.emergency_flag && !isApproved && (
              <div style={{padding:'12px 20px',background:'rgba(184,91,67,0.12)',borderBottom:`0.5px solid rgba(184,91,67,0.3)`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Icon name="alert" size={16}/>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:'#D77A61'}}>Conflict between agent outputs — confidence below 0.5 threshold</div>
                    <div style={{fontSize:11,color:t.textMuted,marginTop:2}}>{rj.hitl_reason||'Agents disagree. Clinical judgment required.'}</div>
                  </div>
                </div>
                <button style={{padding:'5px 12px',background:'rgba(184,91,67,0.2)',color:'#D77A61',border:'1px solid rgba(184,91,67,0.4)',borderRadius:6,fontSize:12,cursor:'pointer'}}>Escalate to admin</button>
              </div>
            )}
            <div style={{padding:'16px 20px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:isOpen?16:0}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                    {isApproved
                      ? <span style={{padding:'2px 10px',background:t.okSoft,color:t.ok,fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>✓ Approved</span>
                      : <span style={{padding:'2px 10px',background:t.peachSoft,color:t.peach,fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>⏳ Pending</span>}
                    {r.emergency_flag && <span style={{padding:'2px 10px',background:'rgba(184,91,67,0.2)',color:'#D77A61',fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>⚠ Emergency</span>}
                    <span style={{padding:'2px 8px',background:t.bgAlt,color:t.textFaint,fontSize:10,borderRadius:99,fontFamily:'monospace'}}>
                      Conf: {r.confidence?`${(r.confidence*100).toFixed(0)}%`:'—'}
                    </span>
                    {r.agents_used?.map((a:string)=>(
                      <span key={a} style={{padding:'2px 8px',background:t.bgAlt,color:t.textFaint,fontSize:10,borderRadius:99,fontFamily:'monospace'}}>{a.replace(/_/g,' ')}</span>
                    ))}
                  </div>
                  <div style={{fontWeight:600,fontSize:15,color:t.text,marginBottom:6,lineHeight:1.3}}>{query}</div>
                  {rj.hitl_reason && <div style={{fontSize:12,color:t.peach,marginBottom:4,fontStyle:'italic'}}>Flagged: {rj.hitl_reason}</div>}
                  <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{new Date(r.created_at).toLocaleString()}</div>
                </div>
                {!isApproved && (
                  <button onClick={()=>setSelected(isOpen?null:r.id)}
                    style={{padding:'7px 16px',background:t.bgAlt,border:`0.5px solid ${t.border}`,color:t.text,borderRadius:7,fontSize:12,cursor:'pointer',flexShrink:0}}>
                    {isOpen?'Collapse':'Review →'}
                  </button>
                )}
              </div>
              {isOpen && !isApproved && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* Agent panels */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {rj.lab?.confidence>0 && (
                      <div style={{padding:14,background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:t.ok}}/>
                          <span style={{fontSize:10,fontFamily:'monospace',textTransform:'uppercase',color:t.textFaint}}>Lab Interpreter Agent</span>
                        </div>
                        <div style={{fontSize:12,color:t.text,lineHeight:1.55,marginBottom:8}}>{rj.lab.summary||'No summary available.'}</div>
                        <div style={{height:3,background:t.border,borderRadius:2,marginBottom:4}}>
                          <div style={{width:`${(rj.lab.confidence||0)*100}%`,height:'100%',background:t.ok,borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{((rj.lab.confidence||0)*100).toFixed(0)}%</div>
                      </div>
                    )}
                    {rj.allergy?.confidence>0 && (
                      <div style={{padding:14,background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                          <div style={{width:6,height:6,borderRadius:'50%',background:t.peach}}/>
                          <span style={{fontSize:10,fontFamily:'monospace',textTransform:'uppercase',color:t.textFaint}}>Allergy Safety Agent</span>
                        </div>
                        <div style={{fontSize:12,color:t.text,lineHeight:1.55,marginBottom:8}}>{rj.allergy.summary||'No summary available.'}</div>
                        <div style={{height:3,background:t.border,borderRadius:2,marginBottom:4}}>
                          <div style={{width:`${(rj.allergy.confidence||0)*100}%`,height:'100%',background:t.peach,borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{((rj.allergy.confidence||0)*100).toFixed(0)}%</div>
                      </div>
                    )}
                  </div>
                  {rj.patient_summary && (
                    <div style={{padding:'12px 14px',background:dark?'rgba(34,56,67,0.2)':'#EDF3F6',borderRadius:8,fontSize:13,color:t.text,lineHeight:1.65}}>
                      <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:6}}>Patient-facing summary</div>
                      {rj.patient_summary}
                    </div>
                  )}
                  {rj.lab?.tests?.length>0 && (
                    <div>
                      <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:8}}>Lab results</div>
                      <table style={{width:'100%',borderCollapse:'collapse',background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:8,overflow:'hidden'}}>
                        <thead>
                          <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                            {['Test','Value','Unit','Reference','Δ','Flag'].map(h=>(
                              <th key={h} style={{padding:'7px 14px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',color:t.textFaint,fontWeight:500}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rj.lab.tests.map((test:any,i:number)=>{
                            const ok = test.status==='ok'||test.status==='normal'
                            const val = parseFloat(test.value)||0
                            const refParts = (test.reference_range||'').split('-')
                            const refMid = refParts.length===2?(parseFloat(refParts[0])+parseFloat(refParts[1]))/2:val
                            const delta = (val-refMid).toFixed(1)
                            return (
                              <tr key={i} style={{borderBottom:i<rj.lab.tests.length-1?`0.5px solid ${t.border}`:'none'}}>
                                <td style={{padding:'8px 14px',fontSize:13,color:t.text,fontWeight:500}}>{test.name}</td>
                                <td style={{padding:'8px 14px',fontSize:14,fontFamily:'monospace',fontWeight:700,color:ok?t.text:t.peach}}>{test.value}</td>
                                <td style={{padding:'8px 14px',fontSize:12,color:t.textMuted}}>{test.unit}</td>
                                <td style={{padding:'8px 14px',fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{test.reference_range}</td>
                                <td style={{padding:'8px 14px',fontSize:11,fontFamily:'monospace',color:ok?t.textFaint:t.peach}}>{ok?'—':(val>refMid?'↑ ':'↓ ')+Math.abs(parseFloat(delta))}</td>
                                <td style={{padding:'8px 14px'}}>
                                  {!ok && <span style={{padding:'1px 7px',fontSize:10,borderRadius:99,background:t.warnSoft,color:t.peach,fontFamily:'monospace',textTransform:'uppercase',fontWeight:600}}>{test.status}</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div>
                    <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:8}}>Your decision</div>
                    <textarea value={notes[r.id]||''} onChange={e=>setNotes(prev=>({...prev,[r.id]:e.target.value}))}
                      placeholder="Document your clinical decision and reasoning…"
                      style={{width:'100%',minHeight:80,padding:'10px 14px',border:`0.5px solid ${t.border}`,borderRadius:8,fontSize:13,background:t.bgAlt,color:t.text,fontFamily:"'DM Sans',sans-serif",resize:'vertical',outline:'none',lineHeight:1.55}}/>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <button onClick={()=>handleApprove(r.id)} disabled={approving===r.id}
                      style={{padding:'9px 20px',background:t.ok,color:'#fff',border:'none',borderRadius:8,fontSize:13,cursor:approving===r.id?'not-allowed':'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:6,opacity:approving===r.id?0.7:1}}>
                      {approving===r.id
                        ? <><div style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/> Approving…</>
                        : '✓ Approve with override'}
                    </button>
                    <button onClick={()=>go('chat')}
                      style={{padding:'9px 16px',background:t.peachSoft,color:t.peach,border:`0.5px solid ${t.peach}`,borderRadius:8,fontSize:13,cursor:'pointer',fontWeight:500}}>
                      Request second opinion
                    </button>
                    <button style={{padding:'9px 16px',background:'transparent',color:t.textMuted,border:`0.5px solid ${t.border}`,borderRadius:8,fontSize:13,cursor:'pointer'}}>
                      Escalate to admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
        </>
      )}
    </div>
  )
}

// ── All Reports ────────────────────────────────────────────────
function AllReports({t,dark,reports,selectedPatient}:any) {
  const [selected, setSelected]     = useState<string|null>(null)
  const [filter, setFilter]         = useState<'all'|'emergency'|'hitl'>('all')
  const [downloading, setDownloading] = useState<string|null>(null)
  const cleanQ = (q:string) => q?.replace(/^\[Referring to:[^\]]+\]\s*/i,'').trim()

  const downloadReport = async (reportId: string, queryText: string) => {
    setDownloading(reportId)
    try {
      const res = await api.get(`/query/download-report/${reportId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `ClinicalIQ_Report_${cleanQ(queryText).slice(0,20).replace(/\s+/g,'_')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {}
    finally { setDownloading(null) }
  }

  const filtered = reports.filter((r:any)=>{
    if(filter==='emergency') return r.emergency_flag
    if(filter==='hitl')      return r.hitl_required
    return true
  })

  return (
    <div style={{padding:24,maxWidth:1100,animation:'fadeUp 0.4s ease both'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>Generated reports</h1>
        <div style={{fontSize:13,color:t.textMuted}}>
          {selectedPatient ? `Showing reports for ${selectedPatient.full_name}` : 'All patient reports'}
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {([
          {key:'all',       label:`All (${reports.length})`},
          {key:'emergency', label:`⚠ Emergency (${reports.filter((r:any)=>r.emergency_flag).length})`},
          {key:'hitl',      label:`HITL (${reports.filter((r:any)=>r.hitl_required).length})`},
        ] as const).map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)}
            style={{padding:'6px 14px',borderRadius:7,fontSize:12,cursor:'pointer',border:`0.5px solid ${filter===f.key?t.peach:t.border}`,background:filter===f.key?t.peachSoft:'transparent',color:filter===f.key?t.peach:t.textMuted,fontFamily:"'DM Sans',sans-serif",transition:'all 0.15s'}}>
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length===0 ? (
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,padding:'48px 20px',textAlign:'center',color:t.textFaint}}>No reports found.</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map((r:any)=>(
            <div key={r.id} style={{background:t.bgCard,border:`0.5px solid ${r.emergency_flag?'rgba(184,91,67,0.4)':t.border}`,borderRadius:10,overflow:'hidden',boxShadow:t.shadow,cursor:'pointer'}}
              onClick={()=>setSelected(selected===r.id?null:r.id)}>
              <div style={{padding:18}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,color:t.text,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cleanQ(r.query_text||'')}</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                      <span style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{new Date(r.created_at).toLocaleString()}</span>
                      <span style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>Conf: {r.confidence?`${(r.confidence*100).toFixed(0)}%`:'—'}</span>
                      {r.emergency_flag && <span style={{padding:'1px 7px',fontSize:9,borderRadius:99,background:'rgba(184,91,67,0.15)',color:'#D77A61',fontFamily:'monospace'}}>⚠ Emergency</span>}
                      {r.hitl_required  && <span style={{padding:'1px 7px',fontSize:9,borderRadius:99,background:t.peachSoft,color:t.peach,fontFamily:'monospace'}}>HITL</span>}
                      {r.agents_used?.map((a:string)=>(
                        <span key={a} style={{padding:'1px 7px',fontSize:9,borderRadius:99,background:t.bgAlt,color:t.textFaint,fontFamily:'monospace'}}>{a.replace(/_/g,' ')}</span>
                      ))}
                    </div>
                  </div>
                  <Icon name="chevron" size={15}/>
                </div>
                {selected===r.id && r.response_json && (
                  <div style={{marginTop:16,paddingTop:16,borderTop:`0.5px solid ${t.border}`}}>
                    <TabView t={t} dark={dark} data={r.response_json}/>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab View ───────────────────────────────────────────────────
function TabView({t,dark,data}:any) {
  const [tab,setTab] = useState<'lab'|'radiology'|'allergy'|'sources'>('lab')
  return (
    <div>
      <div style={{display:'flex',gap:2,marginBottom:14,borderBottom:`0.5px solid ${t.border}`,paddingBottom:0}}>
        {[
          {key:'lab',       label:`Lab Results ${data.lab?.tests?.length||''}`},
          {key:'radiology', label:'Radiology'},
          {key:'allergy',   label:`Allergy ${data.allergy?.allergies?.length||''}`},
          {key:'sources',   label:'Sources'},
        ].map(tb=>(
          <button key={tb.key} onClick={e=>{e.stopPropagation();setTab(tb.key as any)}}
            style={{padding:'8px 16px',borderRadius:0,fontSize:12,cursor:'pointer',border:'none',borderBottom:`2px solid ${tab===tb.key?t.peach:'transparent'}`,background:'transparent',color:tab===tb.key?t.peach:t.textMuted,fontFamily:"'DM Sans',sans-serif",fontWeight:tab===tb.key?600:400,transition:'all 0.15s',marginBottom:-1}}>
            {tb.label}
          </button>
        ))}
      </div>
      {tab==='lab' && (
        <div>
          {data.lab?.tests?.length>0 ? (
            <>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
                <thead>
                  <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                    {['Test','Value','Unit','Reference','Δ','Flag'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',color:t.textFaint,fontWeight:500}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.lab.tests.map((test:any,i:number)=>{
                    const ok = test.status==='ok'||test.status==='normal'
                    const val = parseFloat(test.value)||0
                    const refParts = (test.reference_range||'').split('-')
                    const refMid = refParts.length===2?(parseFloat(refParts[0])+parseFloat(refParts[1]))/2:val
                    const delta = (val-refMid).toFixed(1)
                    return (
                      <tr key={i} style={{borderBottom:i<data.lab.tests.length-1?`0.5px solid ${t.border}`:'none'}}>
                        <td style={{padding:'7px 12px',fontSize:13,color:t.text,fontWeight:500}}>{test.name}</td>
                        <td style={{padding:'7px 12px',fontSize:14,fontFamily:'monospace',fontWeight:700,color:ok?t.text:t.peach}}>{test.value}</td>
                        <td style={{padding:'7px 12px',fontSize:12,color:t.textMuted}}>{test.unit}</td>
                        <td style={{padding:'7px 12px',fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{test.reference_range}</td>
                        <td style={{padding:'7px 12px',fontSize:11,fontFamily:'monospace',color:ok?t.textFaint:t.peach}}>{ok?'—':(val>refMid?'↑ ':'↓ ')+Math.abs(parseFloat(delta))}</td>
                        <td style={{padding:'7px 12px'}}>
                          {!ok && <span style={{padding:'1px 7px',fontSize:10,borderRadius:99,background:t.warnSoft,color:t.peach,fontFamily:'monospace',textTransform:'uppercase'}}>{test.status}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {data.lab.summary && <div style={{padding:'10px 12px',background:t.bgAlt,borderRadius:7,fontSize:12,color:t.text,lineHeight:1.6,marginBottom:8}}>{data.lab.summary}</div>}
              <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',display:'flex',gap:14}}>
                <span>Conf: {((data.lab.confidence||0)*100).toFixed(0)}%</span>
                <span>Runtime: {data.lab.runtime}</span>
                <span>Cost: {data.lab.cost}</span>
              </div>
            </>
          ) : <div style={{color:t.textFaint,fontSize:13,padding:'16px 0'}}>No lab data found.</div>}
        </div>
      )}
      {tab==='radiology' && (
        <div>
          {data.radiology?.confidence>0.2 ? (
            <>
              <div style={{padding:'12px 14px',background:t.bgAlt,borderRadius:8,fontSize:13,color:t.text,lineHeight:1.65,marginBottom:12}}>
                <strong>Modality:</strong> {data.radiology.modality||'Unknown'}<br/>
                <strong>Findings:</strong> {data.radiology.findings}
              </div>
              {data.radiology.differentials?.map((d:any,i:number)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,color:d.urgent?t.peach:t.text}}>{d.diagnosis}</span>
                    <span style={{fontSize:12,fontFamily:'monospace',color:t.textMuted}}>{(d.probability*100).toFixed(0)}%</span>
                  </div>
                  <div style={{height:3,background:t.border,borderRadius:2}}>
                    <div style={{width:`${d.probability*100}%`,height:'100%',background:d.urgent?t.peach:t.ok,borderRadius:2}}/>
                  </div>
                </div>
              ))}
              <div style={{marginTop:8,fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>Conf: {((data.radiology.confidence||0)*100).toFixed(0)}%</div>
            </>
          ) : <div style={{color:t.textFaint,fontSize:13,padding:'16px 0'}}>No radiology report found.</div>}
        </div>
      )}
      {tab==='allergy' && (
        <div>
          {data.allergy?.confidence>0.2 ? (
            <>
              {data.allergy.allergies?.map((a:any,i:number)=>(
                <div key={i} style={{padding:'10px 14px',borderRadius:8,background:t.warnSoft,border:`0.5px solid ${t.peach}`,marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontWeight:600,fontSize:13,color:t.text}}>{a.allergen}</span>
                    <span style={{padding:'1px 7px',borderRadius:99,fontSize:10,fontFamily:'monospace',color:t.peach,textTransform:'capitalize'}}>{a.severity}</span>
                  </div>
                  {a.cross_reactivities?.length>0 && <div style={{fontSize:11,color:t.textMuted}}>⚠ Cross-reactive: {a.cross_reactivities.join(', ')}</div>}
                  {a.safe_alternatives?.length>0  && <div style={{fontSize:11,color:t.ok,marginTop:2}}>✓ Safe: {a.safe_alternatives.join(', ')}</div>}
                </div>
              ))}
              <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',marginTop:8}}>Conf: {((data.allergy.confidence||0)*100).toFixed(0)}%</div>
            </>
          ) : <div style={{color:t.textFaint,fontSize:13,padding:'16px 0'}}>No allergy records found.</div>}
        </div>
      )}
      {tab==='sources' && (
        <div>
          <div style={{padding:'12px 14px',background:t.bgAlt,borderRadius:8,fontSize:12,color:t.text,lineHeight:1.65,marginBottom:12}}>
            <strong>Pipeline:</strong> Query → ChromaDB vector search → 3 agents parallel → NetworkX knowledge graph → Orchestrator → Role filter → Response
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {[{label:'Lab Interpreter',data:data.lab},{label:'Radiology Analyzer',data:data.radiology},{label:'Allergy Safety',data:data.allergy}].map(agent=>(
              <div key={agent.label} style={{padding:12,background:t.bgCard2,borderRadius:8,border:`0.5px solid ${t.border}`}}>
                <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:8}}>{agent.label}</div>
                {[['Confidence',agent.data?`${((agent.data.confidence||0)*100).toFixed(0)}%`:'—'],['Runtime',agent.data?.runtime||'—'],['Cost',agent.data?.cost||'—']].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                    <span style={{color:t.textMuted}}>{k}</span>
                    <span style={{color:t.text,fontFamily:'monospace',fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:8,height:3,background:t.border,borderRadius:2}}>
                  <div style={{width:`${agent.data?(agent.data.confidence||0)*100:0}%`,height:'100%',background:t.peach,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
// ── Staff Chat (Doctor ↔ Radiologist) ─────────────────────────
function StaffChatScreen({t, dark, selectedPatient}:any) {
  const [contacts, setContacts]       = useState<any[]>([])
  const [activeStaff, setActiveStaff] = useState<any>(null)
  const [messages, setMessages]       = useState<any[]>([])
  const [message, setMessage]         = useState("")
  const [sending, setSending]         = useState(false)
  const pollRef   = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = JSON.parse(localStorage.getItem("ciq_user") || "{}")

  useEffect(() => {
    api.get("/chat/staff-contacts").then(res => {
      const c = res.data.contacts || []
      setContacts(c)
      const rad = c.find((s:any) => s.role === "radiologist")
      if (rad) setActiveStaff(rad)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (activeStaff) {
      fetchMessages(activeStaff.id)
      pollRef.current = setInterval(() => fetchMessages(activeStaff.id), 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeStaff?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages])

  const fetchMessages = async (id:string) => {
    try {
      const res = await api.get(`/chat/messages/${id}`)
      setMessages(res.data.messages || [])
    } catch {}
  }

  const send = async () => {
    if (!message.trim() || !activeStaff) return
    setSending(true)
    try {
      await api.post("/chat/send", { to_user_id: activeStaff.id, message: message.trim() })
      setMessage("")
      await fetchMessages(activeStaff.id)
    } catch {}
    finally { setSending(false) }
  }

  const roleColor = (role:string) => role === "radiologist" ? "#60a5fa" : t.peach

  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",height:"calc(100vh - 54px)",overflow:"hidden"}}>
      <div style={{background:t.bgCard,borderRight:`0.5px solid ${t.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`0.5px solid ${t.border}`,flexShrink:0}}>
          <div style={{fontWeight:600,fontSize:14,color:t.text,marginBottom:4}}>Clinical staff</div>
          <div style={{fontSize:11,color:t.textFaint}}>Doctors and Radiologists</div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {contacts.map((c:any)=>(
            <div key={c.id} onClick={()=>setActiveStaff(c)}
              style={{padding:"12px 16px",cursor:"pointer",borderBottom:`0.5px solid ${t.border}`,background:activeStaff?.id===c.id?t.peachSoft:"transparent",transition:"background 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(215,122,97,0.2)",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,color:roleColor(c.role),flexShrink:0}}>
                  {c.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)||"DR"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.full_name}</div>
                  <div style={{fontSize:10,color:roleColor(c.role),fontFamily:"monospace",textTransform:"uppercase"}}>{c.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:t.bg}}>
        {activeStaff ? (
          <>
            <div style={{padding:"12px 20px",borderBottom:`0.5px solid ${t.border}`,background:t.bgCard,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(96,165,250,0.2)",display:"grid",placeItems:"center",fontSize:13,fontWeight:700,color:roleColor(activeStaff.role)}}>
                  {activeStaff.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)||"DR"}
                </div>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:t.text}}>{activeStaff.full_name}</div>
                  <div style={{fontSize:11,color:roleColor(activeStaff.role),fontFamily:"monospace",textTransform:"uppercase"}}>{activeStaff.role}</div>
                </div>
              </div>
              {selectedPatient && (
                <div style={{padding:"4px 12px",background:t.peachSoft,border:`0.5px solid ${t.peach}`,borderRadius:7,fontSize:11,color:t.peach,fontFamily:"monospace"}}>
                  Re: {selectedPatient.full_name}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div style={{padding:"8px 20px",background:"rgba(13,31,40,0.4)",borderBottom:`0.5px solid ${t.border}`,fontSize:12,color:t.textMuted,flexShrink:0}}>
                Clinical collab channel · Case: {selectedPatient.full_name} · Professional use only
              </div>
            )}

            <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:12}}>
              {messages.length===0 && (
                <div style={{textAlign:"center",color:t.textFaint,fontSize:13,padding:"32px 0"}}>
                  No messages yet. Start the clinical discussion with {activeStaff.full_name}.
                </div>
              )}
              {messages.map((msg:any,i:number)=>{
                const isMe = msg.sender_id===(user.id||user.user_id)
                return (
                  <div key={i} style={{display:"flex",alignItems:"flex-end",gap:10,flexDirection:isMe?"row-reverse":"row"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:isMe?"rgba(215,184,160,0.3)":"rgba(96,165,250,0.2)",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,color:isMe?"#D8B4A0":"#60a5fa",flexShrink:0}}>
                      {isMe?(user.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)||"DR"):(activeStaff.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)||"DR")}
                    </div>
                    <div style={{maxWidth:"65%"}}>
                      <div style={{padding:"10px 14px",borderRadius:isMe?"14px 4px 14px 14px":"4px 14px 14px 14px",background:isMe?t.peach:t.bgCard,color:isMe?"#fff":t.text,fontSize:14,lineHeight:1.55,boxShadow:t.shadow}}>
                        {msg.message}
                      </div>
                      <div style={{fontSize:11,color:t.textFaint,fontFamily:"monospace",marginTop:4,textAlign:isMe?"right":"left"}}>
                        {new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef}/>
            </div>

            <div style={{borderTop:`0.5px solid ${t.border}`,padding:14,display:"flex",gap:8,alignItems:"flex-end",background:t.bgCard,flexShrink:0}}>
              <textarea value={message} onChange={e=>setMessage(e.target.value)}
                placeholder={`Message ${activeStaff.full_name}${selectedPatient?" re: "+selectedPatient.full_name:""}...`}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}}
                style={{flex:1,minHeight:38,maxHeight:100,padding:"8px 12px",border:`0.5px solid ${t.border}`,borderRadius:8,fontSize:14,background:t.bgAlt,color:t.text,fontFamily:"DM Sans,sans-serif",resize:"none",outline:"none",lineHeight:1.5}}/>
              <button onClick={send} disabled={sending||!message.trim()}
                style={{display:"inline-flex",alignItems:"center",gap:6,height:38,padding:"0 16px",borderRadius:8,fontSize:13,fontWeight:500,cursor:sending||!message.trim()?"not-allowed":"pointer",border:`0.5px solid ${t.peach}`,background:t.peach,color:"#fff",opacity:!message.trim()?0.5:1,flexShrink:0}}>
                {sending?"...":"Send"}
              </button>
            </div>
          </>
        ) : (
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:t.textFaint,fontSize:14}}>
            Select a staff member to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
