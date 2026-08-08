// FILE: clinicaliq/frontend/src/pages/radiologist/Dashboard.tsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokens } from '../../components/shared/tokens'
import Icon from '../../components/shared/Icon'
import api from '../../lib/axios'
import DocumentViewer from '../../components/shared/DocumentViewer'

type Screen = 'queue' | 'caseview' | 'chat' | 'reports'

export default function RadiologistDashboard() {
  const navigate = useNavigate()
  const [dark, setDark]           = useState(true)
  const [screen, setScreen]       = useState<Screen>('queue')
  const [cases, setCases]         = useState<any[]>([])
  const [stats, setStats]         = useState<any>({})
  const [activeCase, setActiveCase] = useState<any>(null)
  const [findings, setFindings]   = useState('')
  const [urgentFlag, setUrgentFlag] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [viewingDoc, setViewingDoc]   = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [messages, setMessages]   = useState<any[]>([])
  const [message, setMessage]     = useState('')
  const [sending, setSending]     = useState(false)
  const pollRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const user     = JSON.parse(localStorage.getItem('ciq_user') || '{}')
  const initials = user.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() || 'ES'
  const t        = tokens(dark)
  const logout   = () => { localStorage.clear(); navigate('/login') }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (activeCase?.patient?.id) {
      fetchMessages(activeCase.patient.id)
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => fetchMessages(activeCase.patient.id), 10000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeCase?.patient?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/radiologist/queue'),
        api.get('/radiologist/my-stats'),
      ])
      setCases(qRes.data.cases || [])
      setStats(sRes.data || {})
      if (qRes.data.cases?.length > 0 && !activeCase) {
        setActiveCase(qRes.data.cases[0])
      }
    } catch {}
    finally { setLoading(false) }
  }

  const [chatPartnerId, setChatPartnerId] = useState<string|null>(null)

  const fetchMessages = async (partnerId: string) => {
    try {
      const res = await api.get(`/chat/messages/${partnerId}`)
      setMessages(res.data.messages || [])
    } catch {}
  }

  const getChatPartnerId = async (patientId: string) => {
    try {
      // Get all staff and find a doctor to chat with
      const res = await api.get('/chat/staff-contacts')
      const contacts = res.data.contacts || []
      // Prefer Dr. Aarav Mehta or first doctor
      const doctor = contacts.find((c:any) => c.role === 'doctor') 
      if (doctor) {
        setChatPartnerId(doctor.id)
        return doctor.id
      }
    } catch(e) { console.error('getChatPartnerId error:', e) }
    return null
  }

  const sendMessage = async () => {
    if (!message.trim()) return
    let partnerId = chatPartnerId
    if (!partnerId && activeCase?.patient?.id) {
      partnerId = await getChatPartnerId(activeCase.patient.id)
      if (!partnerId) return
    }
    if (!partnerId) return
    const msgText = message.trim()
    setSending(true)
    setMessage('')
    // Optimistically add to UI immediately
    const optimistic = {
      id: Date.now().toString(),
      sender_id: (JSON.parse(localStorage.getItem("ciq_user")||"{}").id || JSON.parse(localStorage.getItem("ciq_user")||"{}").user_id),
      receiver_id: partnerId,
      message: msgText,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    try {
      await api.post('/chat/send', { to_user_id: partnerId, message: msgText })
      await fetchMessages(partnerId)
    } catch {}
    finally { setSending(false) }
  }

  const submitFindings = async () => {
    if (!findings.trim() || !activeCase) return
    setSubmitting(true)
    try {
      const reportId = activeCase.report?.id
      if (!reportId) throw new Error('No report')
      await api.post(`/radiologist/submit-findings/${reportId}`, {
        findings,
        urgency_flag: urgentFlag,
        patient_id: activeCase.patient?.id,
      })
      setSubmitted(true)
      await fetchAll()
    } catch (e: any) {
      alert('Submit failed: ' + (e.response?.data?.detail || e.message))
    } finally { setSubmitting(false) }
  }

  const openCase = (c: any) => {
    setActiveCase(c)
    setFindings('')
    setSubmitted(false)
    setUrgentFlag(c.urgency === 'urgent')
    setScreen('caseview')
  }

  const navItems = [
    { id:'queue',    label:'Imaging queue', icon:'report'    },
    { id:'caseview', label:'Review case',   icon:'query'     },
    { id:'chat',     label:'Doctor chat',   icon:'chat'      },
    { id:'reports',  label:'My reports',    icon:'dashboard' },
  ]

  const crumbs: Record<Screen,string> = {
    queue:    'Imaging queue',
    caseview: activeCase ? `Case — ${activeCase.patient?.full_name || 'Patient'}` : 'Review case',
    chat:     activeCase ? `Radiology room — ${activeCase.patient?.full_name || 'Patient'}` : 'Doctor chat',
    reports:  'My reports',
  }

  const cleanQ = (q: string) => (q||'').replace(/^\[Referring to:[^\]]+\]\s*/i,'').trim()

  return (
    <div style={{display:'grid',gridTemplateColumns:'200px 1fr',height:'100vh',fontFamily:"'DM Sans',sans-serif",background:t.bg,color:t.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(215,122,97,0.4);border-radius:2px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        button,input,textarea{font-family:'DM Sans',sans-serif;outline:none;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{background:t.sidebar,display:'flex',flexDirection:'column',padding:'16px 12px',gap:2,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(400px 300px at -10% -10%,rgba(215,122,97,0.1),transparent 60%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'4px 8px 16px',position:'relative',zIndex:1}}>
          <div style={{width:26,height:26,borderRadius:6,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,color:'#223843',flexShrink:0}}>C</div>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:'#fff'}}>ClinicalIQ</div>
            <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.4)'}}>Radiologist workspace</div>
          </div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',padding:'6px 8px',position:'relative',zIndex:1}}>Workspace</div>
        {navItems.map(item=>(
          <div key={item.id} onClick={()=>setScreen(item.id as Screen)}
            style={{display:'flex',alignItems:'center',gap:9,padding:'7px 8px',borderRadius:6,cursor:'pointer',position:'relative',zIndex:1,background:screen===item.id?'rgba(255,255,255,0.1)':'transparent',color:screen===item.id?'#fff':'rgba(255,255,255,0.65)',fontSize:13,transition:'all 0.15s'}}>
            <Icon name={item.icon} size={15}/>
            <span>{item.label}</span>
          </div>
        ))}
        <div style={{marginTop:8,padding:'6px 8px',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',marginBottom:6}}>Switch role</div>
          {[['Doctor','/doctor/dashboard'],['Patient','/patient/dashboard'],['Admin','/admin/dashboard']].map(([label,path])=>(
            <div key={label} onClick={()=>navigate(path)} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderRadius:5,cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:12}}>
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
            <div style={{position:'absolute',top:2,left:dark?18:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.3s'}}/>
          </button>
        </div>
        <div style={{borderTop:'0.5px solid rgba(255,255,255,0.08)',paddingTop:10,display:'flex',alignItems:'center',gap:10,position:'relative',zIndex:1}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(215,184,160,0.3)',display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:'#D8B4A0',flexShrink:0}}>{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,color:'#fff',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.full_name||'Radiologist'}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:'monospace',textTransform:'uppercase'}}>Radiologist</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* TOPBAR */}
        <div style={{background:t.bgCard,borderBottom:`0.5px solid ${t.border}`,padding:'0 24px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em'}}>Radiology / {screen}</div>
            <div style={{fontSize:15,fontWeight:600,color:t.text}}>{crumbs[screen]}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 12px',height:32,background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,fontSize:12,color:t.textFaint}}>
              <Icon name="query" size={13}/> Search… <span style={{fontFamily:'monospace',fontSize:10,padding:'1px 5px',background:t.border,borderRadius:4}}>⌘K</span>
            </div>
            <button style={{display:'flex',alignItems:'center',gap:6,padding:'0 12px',height:32,background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,fontSize:12,color:t.textMuted,cursor:'pointer'}}>
              <Icon name="sparkle" size={13}/> AI assistant
            </button>
            <button style={{width:32,height:32,borderRadius:7,background:t.bgAlt,border:`0.5px solid ${t.border}`,display:'grid',placeItems:'center',color:t.textMuted,cursor:'pointer'}}>
              <Icon name="bell" size={14}/>
            </button>
          </div>
        </div>

        {/* SCREENS */}
        <div style={{flex:1,overflowY:'auto',background:t.bg}}>

          {/* ── QUEUE ── */}
          {screen==='queue' && (
            <div style={{padding:24,maxWidth:1100,animation:'fadeUp 0.4s ease both'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div>
                  <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>Imaging queue</h1>
                  <div style={{fontSize:13,color:t.textMuted}}>
                    {cases.length} pending · {cases.filter(c=>c.urgency==='urgent').length} urgent · routed to your imaging expertise
                  </div>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',borderRadius:7,fontSize:13,fontWeight:500,cursor:'pointer',border:`0.5px solid ${t.border}`,background:t.bgCard,color:t.text}}>
                    Availability
                  </button>
                  {cases.length > 0 && (
                    <button onClick={()=>openCase(cases[0])}
                      style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',borderRadius:7,fontSize:13,fontWeight:500,cursor:'pointer',border:`0.5px solid ${t.peach}`,background:t.peach,color:'#fff'}}>
                      <Icon name="query" size={13}/> Take next case
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                {[
                  {label:'Pending',         val:cases.length.toString(),                                      sub:'in queue',        color:t.peach},
                  {label:'Urgent',          val:cases.filter(c=>c.urgency==='urgent').length.toString(),      sub:'need immediate review', color:'#D77A61'},
                  {label:'Reviewed total',  val:(stats.total_reviewed||0).toString(),                         sub:'all time',        color:t.ok},
                  {label:'Expertise match', val:'100',                                                        sub:'CT, MRI, X-Ray, US', color:t.peach, pct:true},
                ].map(s=>(
                  <div key={s.label} style={{padding:'16px 18px',borderRadius:10,background:t.bgCard,border:`0.5px solid ${t.border}`,boxShadow:t.shadow}}>
                    <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{s.label}</div>
                    <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:'monospace',marginBottom:2}}>{s.val}{(s as any).pct&&<span style={{fontSize:14}}>%</span>}</div>
                    <div style={{fontSize:11,color:t.textMuted}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div style={{padding:'48px 20px',textAlign:'center',color:t.textFaint}}>Loading cases…</div>
              ) : cases.length === 0 ? (
                <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,padding:'64px 40px',textAlign:'center',boxShadow:t.shadow}}>
                  <div style={{fontSize:32,marginBottom:12}}>🩻</div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:t.text,marginBottom:8}}>No cases in queue</h2>
                  <p style={{fontSize:13,color:t.textMuted,lineHeight:1.6}}>
                    No radiology documents have been uploaded yet.<br/>
                    Patients need to upload imaging reports for you to review.
                  </p>
                </div>
              ) : (
                <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                  <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{fontWeight:600,fontSize:14,color:t.text}}>Queue</div>
                      <span style={{padding:'2px 8px',background:t.peachSoft,color:t.peach,fontSize:11,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>{cases.length} CASES</span>
                    </div>
                    <div style={{fontSize:11,color:t.textFaint}}>routed to your expertise: CT, MRI, X-Ray, US</div>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                        {['Patient','Documents','Latest query','Urgency','Waiting',''].map(h=>(
                          <th key={h} style={{padding:'8px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((c,i)=>(
                        <tr key={i} onClick={()=>openCase(c)}
                          style={{borderBottom:i<cases.length-1?`0.5px solid ${t.border}`:'none',cursor:'pointer',transition:'background 0.15s',background:c.urgency==='urgent'?'rgba(184,91,67,0.03)':'transparent'}}>
                          <td style={{padding:'12px 20px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(215,122,97,0.2)',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,color:t.peach,flexShrink:0}}>
                                {c.patient?.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'PT'}
                              </div>
                              <div>
                                <div style={{fontSize:13,fontWeight:500,color:t.text}}>{c.patient?.full_name||'Patient'}</div>
                                <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{c.patient?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding:'12px 20px',fontSize:12,color:t.textMuted}}>{c.documents?.length||0} files</td>
                          <td style={{padding:'12px 20px',fontSize:12,color:t.textMuted,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {cleanQ(c.report?.query_text||'No query yet')}
                          </td>
                          <td style={{padding:'12px 20px'}}>
                            {c.urgency==='urgent'
                              ? <span style={{padding:'2px 10px',background:'rgba(184,91,67,0.15)',color:'#D77A61',fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:700,textTransform:'uppercase'}}>URGENT</span>
                              : <span style={{padding:'2px 10px',background:t.okSoft,color:t.ok,fontSize:10,borderRadius:99,fontFamily:'monospace',textTransform:'uppercase'}}>ROUTINE</span>}
                          </td>
                          <td style={{padding:'12px 20px',fontSize:12,color:t.textMuted,fontFamily:'monospace'}}>{c.waiting}</td>
                          <td style={{padding:'12px 20px',color:t.textFaint,fontSize:13}}>→</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── CASE VIEW ── */}
          {screen==='caseview' && (
            <div style={{padding:24,maxWidth:1200,animation:'fadeUp 0.4s ease both'}}>
              {!activeCase ? (
                <div style={{padding:'64px 40px',textAlign:'center',color:t.textFaint}}>Select a case from the queue to review.</div>
              ) : (
                <>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                    <div>
                      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:500,color:t.text,marginBottom:4}}>
                        {activeCase.patient?.full_name} — Imaging Review
                      </h1>
                      <div style={{fontSize:13,color:t.textMuted}}>
                        {activeCase.documents?.length||0} documents · {activeCase.waiting} ago · {activeCase.urgency}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>setScreen('chat')}
                        style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',borderRadius:7,fontSize:13,fontWeight:500,cursor:'pointer',border:`0.5px solid ${t.border}`,background:t.bgCard,color:t.text}}>
                        <Icon name="chat" size={13}/> Open chat with doctor
                      </button>
                      <button onClick={submitFindings} disabled={!findings.trim()||submitting||submitted}
                        style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',borderRadius:7,fontSize:13,fontWeight:500,cursor:findings.trim()&&!submitting&&!submitted?'pointer':'not-allowed',border:`0.5px solid ${submitted?t.ok:t.ok}`,background:submitted?t.ok:findings.trim()?t.ok:t.bgAlt,color:submitted||findings.trim()?'#fff':t.textMuted,opacity:submitting?0.7:1}}>
                        {submitting
                          ? <><div style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/> Sending…</>
                          : submitted ? '✓ Findings sent' : '✓ Send findings'}
                      </button>
                    </div>
                  </div>

                  {/* Emergency banner */}
                  {activeCase.urgency==='urgent' && (
                    <div style={{padding:'14px 18px',background:'rgba(184,91,67,0.12)',border:'1px solid rgba(184,91,67,0.35)',borderRadius:10,display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                      <Icon name="alert" size={20}/>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:'#D77A61'}}>AI detected an urgent finding — referring doctor will be notified on email</div>
                        <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>Submit your findings to trigger email notification to the referring doctor and patient.</div>
                      </div>
                    </div>
                  )}

                  {submitted && (
                    <div style={{padding:'14px 18px',background:t.okSoft,border:`1px solid ${t.ok}`,borderRadius:10,display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                      <span style={{fontSize:18}}>✓</span>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:t.ok}}>Findings submitted successfully</div>
                        <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>Email sent to referring doctor and patient. Chat message sent to patient.</div>
                      </div>
                    </div>
                  )}

                  <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
                    <div style={{display:'flex',flexDirection:'column',gap:14}}>

                      {/* DICOM placeholder + docs */}
                      <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                        <div style={{padding:'12px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{fontWeight:600,fontSize:14,color:t.text}}>Imaging study</div>
                          <div style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{activeCase.documents?.length||0} documents indexed</div>
                        </div>
                        <div style={{height:180,display:'grid',placeItems:'center',background:dark?'#0a1a22':'#f0f4f6',position:'relative'}}>
                          <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 20px)',backgroundSize:'20px 20px'}}/>
                          <div style={{textAlign:'center',zIndex:1}}>
                            <div style={{fontSize:28,marginBottom:6}}>🩻</div>
                            <div style={{fontSize:12,color:t.textFaint,fontFamily:'monospace'}}>[ DICOM viewer — drop imaging study here ]</div>
                          </div>
                        </div>
                        {/* Documents table with Read buttons */}
                        {activeCase.documents?.length>0 && (
                          <table style={{width:'100%',borderCollapse:'collapse',borderTop:`0.5px solid ${t.border}`}}>
                            <thead>
                              <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                                {['Document','Category','Chunks',''].map(h=>(
                                  <th key={h} style={{padding:'7px 16px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',color:t.textFaint,fontWeight:500}}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activeCase.documents.map((doc:any,i:number)=>(
                                <tr key={doc.id} style={{borderBottom:i<activeCase.documents.length-1?`0.5px solid ${t.border}`:'none'}}>
                                  <td style={{padding:'8px 16px',fontSize:12,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>{doc.filename}</td>
                                  <td style={{padding:'8px 16px'}}>
                                    <span style={{padding:'1px 7px',background:t.peachSoft,color:t.peach,fontSize:10,borderRadius:99,fontFamily:'monospace',textTransform:'uppercase'}}>{doc.category}</span>
                                  </td>
                                  <td style={{padding:'8px 16px',fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{doc.chunk_count||0}</td>
                                  <td style={{padding:'8px 16px'}}>
                                    <button onClick={()=>setViewingDoc(doc)}
                                      style={{padding:'3px 12px',background:t.peachSoft,border:`0.5px solid ${t.peach}`,color:t.peach,borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                                      Read →
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Latest AI report */}
                      {activeCase.report?.response_json?.radiology?.confidence > 0.1 && (
                        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                          <div style={{padding:'12px 20px',borderBottom:`0.5px solid ${t.border}`}}>
                            <div style={{fontWeight:600,fontSize:14,color:t.text}}>AI Radiology Agent output</div>
                            <div style={{fontSize:11,color:t.textFaint,marginTop:2}}>{cleanQ(activeCase.report?.query_text||'')}</div>
                          </div>
                          <div style={{padding:'14px 20px'}}>
                            <div style={{padding:'10px 14px',background:t.bgAlt,borderRadius:8,fontSize:13,color:t.text,lineHeight:1.65,marginBottom:12}}>
                              {activeCase.report.response_json.radiology.findings}
                            </div>
                            {activeCase.report.response_json.radiology.differentials?.map((d:any,i:number)=>(
                              <div key={i} style={{marginBottom:8}}>
                                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                                  <span style={{fontSize:12,color:d.urgent?'#D77A61':t.text}}>{d.diagnosis}</span>
                                  <span style={{fontSize:12,fontFamily:'monospace',color:t.textMuted}}>{(d.probability*100).toFixed(0)}%</span>
                                </div>
                                <div style={{height:3,background:t.border,borderRadius:2}}>
                                  <div style={{width:`${d.probability*100}%`,height:'100%',background:d.urgent?'#D77A61':t.ok,borderRadius:2}}/>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings textarea */}
                      <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                        <div style={{padding:'12px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{fontWeight:600,fontSize:14,color:t.text}}>Your findings</div>
                          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                            <input type="checkbox" checked={urgentFlag} onChange={e=>setUrgentFlag(e.target.checked)} style={{width:14,height:14,accentColor:'#D77A61'}}/>
                            <span style={{fontSize:12,color:urgentFlag?'#D77A61':t.textMuted,fontWeight:urgentFlag?600:400}}>Mark as urgent</span>
                          </label>
                        </div>
                        <div style={{padding:16}}>
                          <textarea value={findings} onChange={e=>setFindings(e.target.value)}
                            placeholder="Document your radiological findings, impression, and recommendations here…"
                            style={{width:'100%',minHeight:140,padding:'10px 14px',border:`0.5px solid ${t.border}`,borderRadius:8,fontSize:13,background:t.bgAlt,color:t.text,resize:'vertical',lineHeight:1.6}}/>
                          <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                            {urgentFlag && <span style={{padding:'3px 10px',background:'rgba(184,91,67,0.15)',color:'#D77A61',fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>URGENT FLAG</span>}
                            <span style={{padding:'3px 10px',background:t.bgAlt,color:t.textFaint,fontSize:10,borderRadius:99,fontFamily:'monospace'}}>Email notification on submit</span>
                            <span style={{padding:'3px 10px',background:t.bgAlt,color:t.textFaint,fontSize:10,borderRadius:99,fontFamily:'monospace'}}>Chat message to patient</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Agent panel */}
                    <div style={{display:'flex',flexDirection:'column',gap:14}}>
                      <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                        <div style={{padding:'12px 16px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{fontWeight:600,fontSize:13,color:t.text}}>Radiology Analyzer Agent</div>
                          <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>GPT-4o-mini</div>
                        </div>
                        <div style={{padding:'14px 16px'}}>
                          {activeCase.report?.response_json?.radiology ? (
                            <>
                              <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:4}}>Modality</div>
                              <div style={{fontSize:13,color:t.text,marginBottom:12,fontWeight:500}}>{activeCase.report.response_json.radiology.modality||'Unknown'}</div>
                              <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:6}}>Confidence</div>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                                <div style={{flex:1,height:4,background:t.border,borderRadius:2}}>
                                  <div style={{width:`${(activeCase.report.response_json.radiology.confidence||0)*100}%`,height:'100%',background:t.ok,borderRadius:2}}/>
                                </div>
                                <span style={{fontSize:12,fontFamily:'monospace',fontWeight:700,color:t.ok}}>{((activeCase.report.response_json.radiology.confidence||0)*100).toFixed(0)}%</span>
                              </div>
                              {activeCase.report.response_json.radiology.follow_up && (
                                <>
                                  <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',color:t.textFaint,marginBottom:6}}>Follow-up</div>
                                  <div style={{fontSize:12,color:t.text,lineHeight:1.6,padding:'10px 12px',background:t.bgAlt,borderRadius:7}}>{activeCase.report.response_json.radiology.follow_up}</div>
                                </>
                              )}
                            </>
                          ) : (
                            <div style={{fontSize:12,color:t.textFaint,padding:'16px 0',textAlign:'center'}}>No AI radiology output yet.<br/>Patient needs to ask a question first.</div>
                          )}
                        </div>
                      </div>

                      {/* Patient allergy warnings */}
                      {activeCase.report?.response_json?.allergy?.allergies?.length > 0 && (
                        <div style={{background:t.bgCard,border:`1px solid rgba(184,91,67,0.3)`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                          <div style={{padding:'12px 16px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',gap:8}}>
                            <Icon name="alert" size={14}/>
                            <div style={{fontWeight:600,fontSize:13,color:'#D77A61'}}>Patient allergy warnings</div>
                          </div>
                          <div style={{padding:'14px 16px'}}>
                            {activeCase.report.response_json.allergy.allergies.map((a:any,i:number)=>(
                              <div key={i} style={{marginBottom:8}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:6,height:6,borderRadius:'50%',background:a.severity==='anaphylactic'?'#D77A61':t.peach,flexShrink:0}}/>
                                  <span style={{fontSize:12,color:t.text,fontWeight:500}}>{a.allergen}</span>
                                  <span style={{fontSize:10,color:t.textMuted,marginLeft:'auto',textTransform:'capitalize'}}>{a.severity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── CHAT ── */}
          {screen==='chat' && (
            <DoctorChatPanel t={t} dark={dark} activeCase={activeCase} user={user} initials={initials}/>
          )}

          {/* ── REPORTS ── */}
          {screen==='reports' && (
            <ReviewedCasesScreen t={t} dark={dark} cleanQ={cleanQ}/>
          )}
        </div>
      </div>
    {viewingDoc && <DocumentViewer doc={viewingDoc} t={t} onClose={()=>setViewingDoc(null)}/>}
    </div>
  )
}
// ── Doctor Chat Panel (Radiologist ↔ Doctor) ──────────────────
function DoctorChatPanel({t, dark, activeCase, user, initials}:any) {
  const [contacts, setContacts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [message, setMessage]   = useState("")
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef   = useRef<any>(null)

  useEffect(() => {
    api.get("/chat/staff-contacts").then(res => {
      const c = (res.data.contacts || []).filter((s:any) => s.role === "doctor")
      setContacts(c)
      if (c.length > 0) setSelected(c[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (selected) {
      fetchMessages(selected.id)
      pollRef.current = setInterval(() => fetchMessages(selected.id), 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selected?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async (otherId: string) => {
    try {
      const res = await api.get(`/chat/messages/${otherId}`)
      setMessages(res.data.messages || [])
    } catch {}
  }

  const send = async () => {
    if (!message.trim() || !selected) return
    setSending(true)
    try {
      await api.post("/chat/send", { to_user_id: selected.id, message: message.trim() })
      setMessage("")
      await fetchMessages(selected.id)
    } catch {}
    finally { setSending(false) }
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div style={{padding:24,maxWidth:1000,animation:"fadeUp 0.4s ease both"}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:28,fontWeight:500,color:t.text,marginBottom:4}}>
          Doctor chat{activeCase ? " — " + activeCase.patient?.full_name : ""}
        </h1>
        <div style={{fontSize:13,color:t.textMuted}}>Direct channel with referring doctors</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:14,height:"calc(100vh - 220px)"}}>

        {/* Doctor list */}
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,overflow:"hidden",boxShadow:t.shadow,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"14px 16px",borderBottom:`0.5px solid ${t.border}`}}>
            <div style={{fontWeight:600,fontSize:14,color:t.text,marginBottom:4}}>Referring doctors</div>
            <div style={{fontSize:11,color:t.textFaint}}>{contacts.length} available</div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {contacts.map((c:any) => (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{padding:"12px 16px",cursor:"pointer",borderBottom:`0.5px solid ${t.border}`,background:selected?.id===c.id?t.peachSoft:"transparent",transition:"background 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(215,184,160,0.2)",display:"grid",placeItems:"center",fontSize:12,fontWeight:700,color:"#D8B4A0",flexShrink:0}}>
                    {c.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)||"DR"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.full_name}</div>
                    <div style={{fontSize:11,color:t.textMuted}}>{c.specialization||"Doctor"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,overflow:"hidden",boxShadow:t.shadow,display:"flex",flexDirection:"column"}}>
          {selected ? (
            <>
              <div style={{padding:"14px 20px",borderBottom:`0.5px solid ${t.border}`,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(215,184,160,0.3)",display:"grid",placeItems:"center",fontSize:13,fontWeight:700,color:"#D8B4A0"}}>
                  {selected.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:t.text}}>{selected.full_name}</div>
                  <div style={{fontSize:12,color:t.textMuted}}>{selected.specialization||"Doctor"}</div>
                </div>
                {activeCase && (
                  <div style={{marginLeft:"auto",padding:"3px 10px",background:t.peachSoft,border:`0.5px solid ${t.peach}`,borderRadius:7,fontSize:11,color:t.peach,fontFamily:"monospace"}}>
                    Re: {activeCase.patient?.full_name}
                  </div>
                )}
              </div>

              <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:12}}>
                {messages.length===0 && (
                  <div style={{textAlign:"center",color:t.textFaint,fontSize:13,padding:"32px 0"}}>
                    Start a conversation with {selected.full_name}
                  </div>
                )}
                {messages.map((msg:any, i:number) => {
                  const isMe = msg.sender_id === (user.id || user.user_id)
                  return (
                    <div key={i} style={{display:"flex",alignItems:"flex-end",gap:10,flexDirection:isMe?"row-reverse":"row"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:isMe?"rgba(215,122,97,0.2)":"rgba(215,184,160,0.2)",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,color:isMe?t.peach:"#D8B4A0",flexShrink:0}}>
                        {isMe?initials:selected.full_name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)||"DR"}
                      </div>
                      <div style={{maxWidth:"65%"}}>
                        <div style={{padding:"10px 14px",borderRadius:isMe?"14px 4px 14px 14px":"4px 14px 14px 14px",background:isMe?t.peach:t.bgAlt,color:isMe?"#fff":t.text,fontSize:14,lineHeight:1.55}}>
                          {msg.message}
                        </div>
                        <div style={{fontSize:11,color:t.textFaint,fontFamily:"monospace",marginTop:4,textAlign:isMe?"right":"left"}}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef}/>
              </div>

              <div style={{borderTop:`0.5px solid ${t.border}`,padding:14,display:"flex",gap:8,alignItems:"flex-end"}}>
                <textarea value={message} onChange={e=>setMessage(e.target.value)}
                  placeholder={`Message ${selected.full_name}${activeCase?" re: "+activeCase.patient?.full_name:""}...`}
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
              Select a doctor to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewedCasesScreen({t, dark, cleanQ}:any) {
  const [cases, setCases]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState<string|null>(null)
  const [editText, setEditText] = useState('')
  const [urgentFlag, setUrgentFlag] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('ciq_user') || '{}')

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res = await api.get('/radiologist/reviewed-cases')
      setCases(res.data.cases || [])
    } catch {}
    finally { setLoading(false) }
  }

  const startEdit = (c: any) => {
    setEditing(c.report?.id)
    setEditText(c.report?.doctor_notes || '')
    setUrgentFlag(c.urgency === 'urgent')
  }

  const resubmit = async (c: any) => {
    if (!editText.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/radiologist/submit-findings/${c.report?.id}`, {
        findings: editText,
        urgency_flag: urgentFlag,
        patient_id: c.patient?.id,
      })
      setEditing(null)
      await fetchCases()
      alert('Findings updated and re-sent successfully!')
    } catch (e: any) {
      alert('Failed: ' + (e.response?.data?.detail || e.message))
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{padding:24,maxWidth:1100,animation:'fadeUp 0.4s ease both'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>My reviewed cases</h1>
        <div style={{fontSize:13,color:t.textMuted}}>{cases.length} cases reviewed · click Edit to update findings</div>
      </div>
      {loading ? (
        <div style={{padding:'48px 20px',textAlign:'center',color:t.textFaint}}>Loading…</div>
      ) : cases.length===0 ? (
        <div style={{padding:'48px 20px',textAlign:'center',color:t.textFaint,fontSize:13}}>No reviewed cases yet.</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {cases.map((c:any,i:number)=>(
            <div key={i} style={{background:t.bgCard,border:`0.5px solid ${editing===c.report?.id?t.peach:t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
              {/* Case header */}
              <div style={{padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:t.okSoft,display:'grid',placeItems:'center',fontSize:16,fontWeight:700,color:t.ok,flexShrink:0}}>✓</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:t.text,marginBottom:3}}>{c.patient?.full_name||'Patient'}</div>
                    <div style={{fontSize:12,color:t.textMuted}}>{c.documents?.length||0} files · {cleanQ(c.report?.query_text||'').slice(0,50)}</div>
                    <div style={{fontSize:11,color:t.textFaint,fontFamily:'monospace',marginTop:2}}>
                      Reviewed: {c.report?.approved_at ? new Date(c.report.approved_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{padding:'2px 10px',background:t.okSoft,color:t.ok,fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:700}}>REVIEWED</span>
                  {c.urgency==='urgent' && <span style={{padding:'2px 10px',background:'rgba(184,91,67,0.15)',color:'#D77A61',fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:700}}>URGENT</span>}
                  <button onClick={()=>editing===c.report?.id?setEditing(null):startEdit(c)}
                    style={{padding:'5px 14px',background:editing===c.report?.id?t.bgAlt:t.peachSoft,border:`0.5px solid ${t.peach}`,color:t.peach,borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:500}}>
                    {editing===c.report?.id ? 'Cancel' : '✎ Edit'}
                  </button>
                </div>
              </div>

              {/* Previous findings (collapsed) */}
              {editing!==c.report?.id && c.report?.doctor_notes && (
                <div style={{padding:'0 20px 16px'}}>
                  <div style={{background:t.bgAlt,borderRadius:8,padding:'10px 14px',borderLeft:`3px solid ${t.peach}`}}>
                    <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',marginBottom:4}}>Previous findings</div>
                    <div style={{fontSize:13,color:t.textMuted,lineHeight:1.6}}>{c.report.doctor_notes.slice(0,200)}{c.report.doctor_notes.length>200?'…':''}</div>
                  </div>
                </div>
              )}

              {/* Edit panel */}
              {editing===c.report?.id && (
                <div style={{padding:'0 20px 20px',borderTop:`0.5px solid ${t.border}`}}>
                  <div style={{padding:'14px 0 10px',fontSize:13,color:t.textMuted}}>Edit your findings below and resubmit — doctor will be notified again via chat and email.</div>
                  <textarea value={editText} onChange={e=>setEditText(e.target.value)}
                    style={{width:'100%',minHeight:140,padding:'10px 14px',border:`0.5px solid ${t.border}`,borderRadius:8,fontSize:13,background:t.bgAlt,color:t.text,resize:'vertical',lineHeight:1.6,outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="checkbox" checked={urgentFlag} onChange={e=>setUrgentFlag(e.target.checked)} style={{width:14,height:14,accentColor:'#D77A61'}}/>
                      <span style={{fontSize:12,color:urgentFlag?'#D77A61':t.textMuted,fontWeight:urgentFlag?600:400}}>Mark as urgent</span>
                    </label>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>setEditing(null)}
                        style={{padding:'7px 16px',background:'transparent',border:`0.5px solid ${t.border}`,color:t.textMuted,borderRadius:7,fontSize:12,cursor:'pointer'}}>
                        Cancel
                      </button>
                      <button onClick={()=>resubmit(c)} disabled={submitting||!editText.trim()}
                        style={{padding:'7px 16px',background:t.ok,border:'none',color:'#fff',borderRadius:7,fontSize:12,cursor:'pointer',fontWeight:500,opacity:submitting?0.7:1}}>
                        {submitting?'Sending…':'✓ Resubmit findings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
