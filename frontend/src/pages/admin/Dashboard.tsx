// FILE: clinicaliq/frontend/src/pages/admin/Dashboard.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokens } from '../../components/shared/tokens'
import Icon from '../../components/shared/Icon'
import api from '../../lib/axios'

type Screen = 'overview' | 'routing' | 'users' | 'audit' | 'analytics'

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const [dark, setDark]     = useState(true)
  const [screen, setScreen] = useState<Screen>('overview')
  const t = tokens(dark)
  const user = JSON.parse(localStorage.getItem('ciq_user') || '{}')
  const initials = user.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() || 'AD'
  const logout = () => { localStorage.clear(); navigate('/login') }

  const navItems = [
    { id:'overview',  label:'Overview',     icon:'dashboard' },
    { id:'routing',   label:'Routing log',  icon:'routing'   },
    { id:'users',     label:'All users',    icon:'users'     },
    { id:'audit',     label:'Audit log',    icon:'report'    },
    { id:'analytics', label:'AI Analytics', icon:'sparkle'   },
  ]

  const crumbs: Record<Screen,string> = {
    overview:  'System overview',
    routing:   'Routing log',
    users:     'All users',
    audit:     'Audit log',
    analytics: 'AI Analytics',
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',height:'100vh',fontFamily:"'DM Sans',sans-serif",background:t.bg,color:t.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(215,122,97,0.4);border-radius:2px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        button,input,textarea{font-family:'DM Sans',sans-serif;outline:none;}
      `}</style>

      <aside style={{background:t.sidebar,display:'flex',flexDirection:'column',padding:'16px 12px',gap:2,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(400px 300px at -10% -10%,rgba(215,122,97,0.1),transparent 60%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'4px 8px 16px',position:'relative',zIndex:1}}>
          <div style={{width:26,height:26,borderRadius:6,background:'linear-gradient(135deg,#D77A61,#D8B4A0)',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,color:'#223843',flexShrink:0}}>C</div>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:'#fff'}}>ClinicalIQ</div>
            <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.4)'}}>Admin workspace</div>
          </div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',padding:'6px 8px',position:'relative',zIndex:1}}>Workspace</div>
        {navItems.map(item=>(
          <div key={item.id} onClick={()=>setScreen(item.id as Screen)}
            style={{display:'flex',alignItems:'center',gap:9,padding:'7px 8px',borderRadius:6,cursor:'pointer',position:'relative',zIndex:1,background:screen===item.id?'rgba(255,255,255,0.1)':'transparent',color:screen===item.id?'#fff':'rgba(255,255,255,0.65)',fontSize:13,transition:'all 0.15s'}}>
            <Icon name={item.icon} size={15}/><span>{item.label}</span>
          </div>
        ))}
        <div style={{marginTop:8,padding:'6px 8px',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',marginBottom:6}}>Switch role</div>
          {[['Doctor','/doctor/dashboard'],['Patient','/patient/dashboard'],['Radiologist','/radiologist/dashboard']].map(([label,path])=>(
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
            <div style={{fontSize:12,color:'#fff',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.full_name||'Admin'}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:'monospace',textTransform:'uppercase'}}>Admin</div>
          </div>
        </div>
      </aside>

      <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:t.bgCard,borderBottom:`0.5px solid ${t.border}`,padding:'0 24px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em'}}>Admin / {screen}</div>
            <div style={{fontSize:15,fontWeight:600,color:t.text}}>{crumbs[screen]}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>Langfuse trace ingestion healthy</div>
            <button onClick={()=>window.open('https://cloud.langfuse.com','_blank')}
              style={{display:'flex',alignItems:'center',gap:6,padding:'0 12px',height:32,background:'#D77A61',border:'none',borderRadius:7,fontSize:12,color:'#fff',cursor:'pointer',fontWeight:500}}>
              Open Langfuse ↗
            </button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',background:t.bg}}>
          {screen==='overview'  && <OverviewScreen   t={t} dark={dark}/>}
          {screen==='routing'   && <RoutingScreen    t={t} dark={dark}/>}
          {screen==='users'     && <UsersScreen      t={t} dark={dark}/>}
          {screen==='audit'     && <AuditScreen      t={t} dark={dark}/>}
          {screen==='analytics' && <AnalyticsScreen  t={t} dark={dark}/>}
        </div>
      </div>
    </div>
  )
}

// ── OVERVIEW ───────────────────────────────────────────────────
function OverviewScreen({t, dark}:any) {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/overview').then(res=>setData(res.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const activateUser = async (userId: string) => {
    await api.post(`/admin/users/${userId}/activate`)
    const res = await api.get('/admin/overview')
    setData(res.data)
  }

  const roleColor: Record<string,string> = {
    patient:'#60a5fa', doctor:'#34d399', radiologist:'#a78bfa', admin:'#f59e0b', system:'#94a3b8',
  }
  const actionColor: Record<string,string> = {
    UPLOAD:'#60a5fa', LOGIN:'#34d399', QUERY:'#a78bfa', HITL_APPROVED:'#34d399',
    FINDINGS_SUBMITTED:'#f59e0b', CHAT_SENT:'#94a3b8', ROUTING:'#D77A61', ACTIVATE_ACCOUNT:'#34d399',
  }

  if (loading) return <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Loading system overview…</div>
  if (!data)   return <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Failed to load</div>

  const s = data.stats

  return (
    <div style={{padding:24,maxWidth:1300,animation:'fadeUp 0.4s ease both'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>System overview</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Live across all roles · Real-time data from Supabase</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Active doctors',      val:s.active_doctors,                              sub:'staff',                 color:'#34d399'},
          {label:'Active radiologists', val:s.active_radiologists,                         sub:'imaging staff',         color:'#a78bfa'},
          {label:'Active patients',     val:s.total_patients,                              sub:'registered',            color:'#60a5fa'},
          {label:'Queries today',       val:s.queries_today,                               sub:`${s.queries_last_hour} in last hr`, color:'#D77A61'},
          {label:'AI cost today',       val:`$${(s.ai_cost_today||0).toFixed(4)}`,         sub:`$${(s.avg_cost_per_query||0.0003).toFixed(5)}/query`, color:'#f59e0b'},
          {label:'Emergency flags',     val:s.emergency_flags,                             sub:`${s.emergency_flags} active`, color:'#ef4444'},
        ].map(stat=>(
          <div key={stat.label} style={{padding:'16px 18px',borderRadius:10,background:t.bgCard,border:`0.5px solid ${t.border}`,boxShadow:t.shadow}}>
            <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{stat.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:stat.color,fontFamily:'monospace',marginBottom:2}}>{stat.val}</div>
            <div style={{fontSize:11,color:t.textMuted}}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,marginBottom:16}}>
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontWeight:600,fontSize:14,color:t.text}}>Recent activity</div>
            <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>all roles</span>
          </div>
          <div style={{overflowY:'auto',maxHeight:340}}>
            {(data.recent_activity||[]).map((a:any,i:number)=>(
              <div key={i} style={{padding:'10px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:`${roleColor[a.role]||'#94a3b8'}22`,display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:roleColor[a.role]||'#94a3b8',flexShrink:0}}>
                  {a.actor?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'SY'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:t.text}}>
                    <span style={{fontWeight:500}}>{a.actor}</span>{' '}
                    <span style={{color:t.textMuted}}>{(a.action||'').toLowerCase().replace(/_/g,' ')}</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <span style={{padding:'1px 8px',background:`${actionColor[a.action]||'#94a3b8'}22`,color:actionColor[a.action]||'#94a3b8',fontSize:9,borderRadius:99,fontFamily:'monospace',textTransform:'uppercase',fontWeight:600}}>{(a.role||'').toUpperCase()}</span>
                  <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{(a.time||'').slice(11,16)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontWeight:600,fontSize:13,color:t.text}}>Pending activations</div>
              <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{(data.pending_activations||[]).length}</span>
            </div>
            <div>
              {(data.pending_activations||[]).length===0 ? (
                <div style={{padding:'20px 16px',fontSize:12,color:t.textFaint,textAlign:'center'}}>No pending activations</div>
              ) : (data.pending_activations||[]).map((p:any,i:number)=>(
                <div key={p.id} style={{padding:'10px 16px',borderBottom:i<data.pending_activations.length-1?`0.5px solid ${t.border}`:'none',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:t.text}}>{p.full_name}</div>
                    <div style={{fontSize:10,color:t.textMuted}}>{p.role} · {p.specialization||'—'}</div>
                  </div>
                  <button onClick={()=>activateUser(p.id)}
                    style={{padding:'4px 10px',background:t.peachSoft,border:`0.5px solid ${t.peach}`,color:t.peach,borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:500,whiteSpace:'nowrap'}}>
                    Activate
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:t.bgCard,border:`0.5px solid rgba(184,91,67,0.3)`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',gap:8}}>
              <span style={{color:'#D77A61'}}>⚠</span>
              <div style={{fontWeight:600,fontSize:13,color:'#D77A61'}}>Active emergencies</div>
            </div>
            <div>
              {(data.active_emergencies||[]).length===0 ? (
                <div style={{padding:'20px 16px',fontSize:12,color:t.textFaint,textAlign:'center'}}>No active emergencies</div>
              ) : (data.active_emergencies||[]).map((e:any,i:number)=>(
                <div key={i} style={{padding:'10px 16px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:12,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{e.query||'Emergency flag'}</div>
                    <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{(e.created_at||'').slice(11,16)}</div>
                  </div>
                  <span style={{padding:'2px 8px',background:'rgba(184,91,67,0.15)',color:'#D77A61',fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:700}}>OPEN</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ROUTING LOG ────────────────────────────────────────────────
function RoutingScreen({t, dark}:any) {
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/routing-log').then(res=>setData(res.data.assignments||[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  return (
    <div style={{padding:24,maxWidth:1300,animation:'fadeUp 0.4s ease both'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>Routing log</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Every auto-assignment the AI made, with score and specialty.</div>
        </div>
        <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{data.length} assignments</span>
      </div>
      {loading ? (
        <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Loading…</div>
      ) : (
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                {['Time','Patient','Assigned to','Specialty','Confidence','Score','Urgency'].map(h=>(
                  <th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((a:any,i:number)=>(
                <tr key={a.id} style={{borderBottom:i<data.length-1?`0.5px solid ${t.border}`:'none'}}>
                  <td style={{padding:'10px 20px',fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{(a.created_at||'').slice(11,16)}</td>
                  <td style={{padding:'10px 20px',fontSize:13,color:t.text,fontWeight:500}}>{a.patient_name}</td>
                  <td style={{padding:'10px 20px',fontSize:13,color:t.text}}>{a.doctor_name}</td>
                  <td style={{padding:'10px 20px'}}>
                    <span style={{padding:'2px 8px',background:t.peachSoft,color:t.peach,fontSize:10,borderRadius:99,fontFamily:'monospace'}}>{a.specialty||'—'}</span>
                  </td>
                  <td style={{padding:'10px 20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:50,height:4,background:t.border,borderRadius:2,overflow:'hidden'}}>
                        <div style={{width:`${(a.confidence||0)*100}%`,height:'100%',background:t.ok,borderRadius:2}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:'monospace',color:t.text}}>{a.confidence?`${(a.confidence*100).toFixed(0)}%`:'—'}</span>
                    </div>
                  </td>
                  <td style={{padding:'10px 20px',fontSize:12,fontFamily:'monospace',color:t.peach,fontWeight:700}}>{a.score?`${(a.score*100).toFixed(0)}%`:'—'}</td>
                  <td style={{padding:'10px 20px'}}>
                    <span style={{padding:'2px 8px',fontSize:10,borderRadius:99,fontFamily:'monospace',background:a.urgency==='urgent'?'rgba(184,91,67,0.15)':t.okSoft,color:a.urgency==='urgent'?'#D77A61':t.ok,textTransform:'uppercase'}}>{a.urgency||'routine'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── ALL USERS ──────────────────────────────────────────────────
function UsersScreen({t, dark}:any) {
  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try { const res = await api.get('/admin/users'); setUsers(res.data.users||[]) } catch {}
    finally { setLoading(false) }
  }
  useEffect(()=>{ fetchUsers() },[])

  const activate = async (id: string) => { await api.post(`/admin/users/${id}/activate`); fetchUsers() }

  const roleColor: Record<string,string> = {
    doctor:'#34d399', radiologist:'#a78bfa', patient:'#60a5fa', admin:'#f59e0b'
  }

  const staff    = users.filter(u=>u.role!=='patient')
  const patients = users.filter(u=>u.role==='patient')

  return (
    <div style={{padding:24,maxWidth:1300,animation:'fadeUp 0.4s ease both'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>All users</h1>
          <div style={{fontSize:13,color:t.textMuted}}>{staff.length} staff · {patients.length} patients · {users.filter(u=>!u.activated&&u.role!=='patient').length} pending</div>
        </div>
      </div>
      {loading ? (
        <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Loading…</div>
      ) : (
        <>
          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden',marginBottom:16}}>
            <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`}}>
              <div style={{fontWeight:600,fontSize:14,color:t.text}}>Clinical staff</div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                  {['Name','Role','Specialty / Expertise','Status','Load',''].map(h=>(
                    <th key={h} style={{padding:'8px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((u:any,i:number)=>(
                  <tr key={u.id} style={{borderBottom:i<staff.length-1?`0.5px solid ${t.border}`:'none'}}>
                    <td style={{padding:'10px 20px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:`${roleColor[u.role]||'#94a3b8'}22`,display:'grid',placeItems:'center',fontSize:11,fontWeight:700,color:roleColor[u.role]||'#94a3b8',flexShrink:0}}>
                          {u.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'??'}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:500,color:t.text}}>{u.full_name}</div>
                          <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace'}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'10px 20px'}}>
                      <span style={{padding:'2px 8px',background:`${roleColor[u.role]||'#94a3b8'}22`,color:roleColor[u.role]||'#94a3b8',fontSize:10,borderRadius:99,fontFamily:'monospace',textTransform:'capitalize'}}>{u.role}</span>
                    </td>
                    <td style={{padding:'10px 20px',fontSize:12,color:t.textMuted}}>{u.specialization||u.imaging_expertise||'—'}</td>
                    <td style={{padding:'10px 20px'}}>
                      <span style={{padding:'2px 8px',background:u.activated?t.okSoft:t.peachSoft,color:u.activated?t.ok:t.peach,fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>{u.activated?'ACTIVE':'PENDING'}</span>
                    </td>
                    <td style={{padding:'10px 20px',fontSize:12,color:t.textMuted,fontFamily:'monospace'}}>{u.current_load||0}</td>
                    <td style={{padding:'10px 20px'}}>
                      {!u.activated && u.role!=='patient' && (
                        <button onClick={()=>activate(u.id)}
                          style={{padding:'4px 10px',background:t.peachSoft,border:`0.5px solid ${t.peach}`,color:t.peach,borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:500}}>
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`}}>
              <div style={{fontWeight:600,fontSize:14,color:t.text}}>Patients</div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                  {['Name','Email','Registered'].map(h=>(
                    <th key={h} style={{padding:'8px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((u:any,i:number)=>(
                  <tr key={u.id} style={{borderBottom:i<patients.length-1?`0.5px solid ${t.border}`:'none'}}>
                    <td style={{padding:'10px 20px',fontSize:13,fontWeight:500,color:t.text}}>{u.full_name}</td>
                    <td style={{padding:'10px 20px',fontSize:12,color:t.textMuted,fontFamily:'monospace'}}>{u.email}</td>
                    <td style={{padding:'10px 20px',fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{(u.created_at||'').slice(0,10)||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── AUDIT LOG ──────────────────────────────────────────────────
function AuditScreen({t, dark}:any) {
  const [logs, setLogs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/audit-log').then(res=>setLogs(res.data.logs||[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const actionColor: Record<string,string> = {
    UPLOAD:'#60a5fa', LOGIN:'#34d399', QUERY:'#a78bfa', HITL_APPROVED:'#34d399',
    FINDINGS_SUBMITTED:'#f59e0b', CHAT_SENT:'#94a3b8', ROUTING:'#D77A61', ACTIVATE_ACCOUNT:'#34d399', USER_ACTIVATED:'#34d399',
  }
  const roleColor: Record<string,string> = {
    patient:'#60a5fa', doctor:'#34d399', radiologist:'#a78bfa', admin:'#f59e0b', system:'#94a3b8',
  }

  return (
    <div style={{padding:24,maxWidth:1300,animation:'fadeUp 0.4s ease both'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>Audit log</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Every action recorded. Filterable by user, role, and date.</div>
        </div>
        <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>{logs.length} entries</span>
      </div>
      {loading ? (
        <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Loading…</div>
      ) : (
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
                {['Time','Actor','Role','Action','Details'].map(h=>(
                  <th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log:any,i:number)=>(
                <tr key={log.id||i} style={{borderBottom:i<logs.length-1?`0.5px solid ${t.border}`:'none'}}>
                  <td style={{padding:'10px 20px',fontSize:11,color:t.textFaint,fontFamily:'monospace',whiteSpace:'nowrap'}}>{(log.created_at||'').slice(11,19)}</td>
                  <td style={{padding:'10px 20px',fontSize:13,color:t.text,fontWeight:500}}>{log.actor_name||'System'}</td>
                  <td style={{padding:'10px 20px'}}>
                    <span style={{padding:'1px 8px',background:`${roleColor[log.actor_role]||'#94a3b8'}22`,color:roleColor[log.actor_role]||'#94a3b8',fontSize:9,borderRadius:99,fontFamily:'monospace',textTransform:'uppercase',fontWeight:600}}>
                      {(log.actor_role||'system').toUpperCase()}
                    </span>
                  </td>
                  <td style={{padding:'10px 20px'}}>
                    <span style={{padding:'2px 8px',background:`${actionColor[log.action]||'#94a3b8'}22`,color:actionColor[log.action]||'#94a3b8',fontSize:10,borderRadius:99,fontFamily:'monospace',fontWeight:600}}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{padding:'10px 20px',fontSize:11,color:t.textMuted,fontFamily:'monospace',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {log.details ? JSON.stringify(log.details).slice(0,80) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── AI ANALYTICS ───────────────────────────────────────────────
function AnalyticsScreen({t, dark}:any) {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics').then(res=>setData(res.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Loading analytics…</div>
  if (!data)   return <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Failed to load analytics</div>

  const agentColor: Record<string,string> = { lab:'#60a5fa', radiology:'#a78bfa', allergy:'#34d399' }
  const agentLabel: Record<string,string> = { lab:'Lab Interpreter', radiology:'Radiology Analyzer', allergy:'Allergy Safety' }
  const maxCost    = Math.max(...(data.cost_trend||[]).map((d:any)=>d.cost), 0.001)
  const maxRuntime = Math.max(...(data.slowest||[]).map((d:any)=>d.total_runtime), 1)

  return (
    <div style={{padding:24,maxWidth:1300,animation:'fadeUp 0.4s ease both'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>AI Analytics</h1>
        <div style={{fontSize:13,color:t.textMuted}}>Agent performance, cost trends, latency, and Langfuse trace links · {data.total_reports} total queries</div>
      </div>

      {/* Agent performance */}
      <div style={{marginBottom:16}}>
        <div style={{fontWeight:600,fontSize:14,color:t.text,marginBottom:12}}>Agent performance</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {['lab','radiology','allergy'].map(agent=>{
            const s = data.agent_stats?.[agent] || {}
            const color = agentColor[agent]
            return (
              <div key={agent} style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
                <div style={{padding:'12px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
                  <div style={{fontWeight:600,fontSize:13,color:t.text}}>{agentLabel[agent]}</div>
                  <span style={{marginLeft:'auto',padding:'1px 8px',background:`${color}22`,color,fontSize:10,borderRadius:99,fontFamily:'monospace'}}>GPT-4o-mini</span>
                </div>
                <div style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {[
                    {label:'Avg confidence', val:`${((s.avg_confidence||0)*100).toFixed(0)}%`,  color:s.avg_confidence>0.5?t.ok:t.peach},
                    {label:'Accuracy rate',  val:`${s.accuracy_pct||0}%`,                       color:s.accuracy_pct>50?t.ok:t.peach},
                    {label:'Avg latency',    val:`${s.avg_runtime||0}s`,                        color:t.text},
                    {label:'Avg cost/query', val:`$${(s.avg_cost||0).toFixed(5)}`,             color:t.text},
                    {label:'Total cost',     val:`$${(s.total_cost||0).toFixed(4)}`,            color:'#f59e0b'},
                    {label:'Times fired',    val:`${s.fired_count||0}/${s.total_queries||0}`,   color:t.text},
                  ].map(stat=>(
                    <div key={stat.label}>
                      <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',marginBottom:3}}>{stat.label}</div>
                      <div style={{fontSize:16,fontWeight:700,color:stat.color,fontFamily:'monospace'}}>{stat.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:'0 20px 16px'}}>
                  <div style={{height:4,background:t.border,borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${s.accuracy_pct||0}%`,height:'100%',background:color,borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:10,color:t.textFaint,marginTop:4,fontFamily:'monospace'}}>Fired on {s.accuracy_pct||0}% of queries</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* Cost trend chart */}
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontWeight:600,fontSize:14,color:t.text}}>AI cost trend</div>
            <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>last 14 days</span>
          </div>
          <div style={{padding:'20px'}}>
            {(data.cost_trend||[]).length===0 ? (
              <div style={{textAlign:'center',color:t.textFaint,fontSize:13,padding:'32px 0'}}>No data yet</div>
            ) : (
              <>
                <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120,marginBottom:8}}>
                  {(data.cost_trend||[]).map((d:any,i:number)=>(
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <div style={{fontSize:9,color:t.textFaint,fontFamily:'monospace'}}>${d.cost.toFixed(3)}</div>
                      <div style={{width:'100%',height:`${Math.max((d.cost/maxCost)*100,4)}px`,background:'linear-gradient(180deg,#D77A61,#D8B4A0)',borderRadius:'3px 3px 0 0',minHeight:4}}/>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6}}>
                  {(data.cost_trend||[]).map((d:any,i:number)=>(
                    <div key={i} style={{flex:1,textAlign:'center',fontSize:8,color:t.textFaint,fontFamily:'monospace'}}>{(d.date||'').slice(5)}</div>
                  ))}
                </div>
                <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:12,color:t.textMuted}}>Total spend: <span style={{color:'#f59e0b',fontWeight:700}}>${(data.cost_trend||[]).reduce((s:number,d:any)=>s+d.cost,0).toFixed(4)}</span></div>
                  <div style={{fontSize:12,color:t.textMuted}}>Queries: <span style={{color:t.peach,fontWeight:700}}>{(data.cost_trend||[]).reduce((s:number,d:any)=>s+d.queries,0)}</span></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Slowest queries */}
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontWeight:600,fontSize:14,color:t.text}}>Slowest queries</div>
            <span style={{fontSize:11,color:t.textFaint,fontFamily:'monospace'}}>by total runtime</span>
          </div>
          <div style={{overflowY:'auto',maxHeight:280}}>
            {(data.slowest||[]).map((q:any,i:number)=>(
              <div key={q.id} style={{padding:'10px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:i<3?'rgba(215,122,97,0.2)':t.bgAlt,display:'grid',placeItems:'center',fontSize:10,fontWeight:700,color:i<3?t.peach:t.textFaint,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.query||'—'}</div>
                  <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>
                    {(q.agents||[]).map((a:string)=>(
                      <span key={a} style={{fontSize:9,padding:'1px 5px',background:t.bgAlt,color:t.textFaint,borderRadius:99,fontFamily:'monospace'}}>{a.replace('_interpreter','').replace('_analyzer','').replace('_safety','')}</span>
                    ))}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:q.total_runtime>15?'#ef4444':q.total_runtime>8?'#f59e0b':t.ok,fontFamily:'monospace'}}>{q.total_runtime}s</div>
                  <div style={{width:60,height:3,background:t.border,borderRadius:2,marginTop:3}}>
                    <div style={{width:`${Math.min((q.total_runtime/maxRuntime)*100,100)}%`,height:'100%',background:q.total_runtime>15?'#ef4444':q.total_runtime>8?'#f59e0b':t.ok,borderRadius:2}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Langfuse trace viewer */}
      <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:600,fontSize:14,color:t.text}}>Langfuse trace viewer</div>
            <div style={{fontSize:11,color:t.textMuted,marginTop:2}}>Click any query to open its full trace — token usage, latency, cost breakdown</div>
          </div>
          <button onClick={()=>window.open('https://cloud.langfuse.com','_blank')}
            style={{display:'flex',alignItems:'center',gap:6,padding:'0 14px',height:32,background:'#D77A61',border:'none',borderRadius:7,fontSize:12,color:'#fff',cursor:'pointer',fontWeight:500,flexShrink:0}}>
            Open Langfuse dashboard ↗
          </button>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
              {['Time','Query','Confidence','Trace'].map(h=>(
                <th key={h} style={{padding:'8px 20px',textAlign:'left',fontSize:10,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.06em',color:t.textFaint,fontWeight:500}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.trace_links||[]).map((tr:any,i:number)=>(
              <tr key={tr.id} style={{borderBottom:i<data.trace_links.length-1?`0.5px solid ${t.border}`:'none'}}>
                <td style={{padding:'10px 20px',fontSize:11,color:t.textFaint,fontFamily:'monospace',whiteSpace:'nowrap'}}>{tr.date}</td>
                <td style={{padding:'10px 20px',fontSize:13,color:t.text,maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tr.query||'—'}</td>
                <td style={{padding:'10px 20px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:50,height:4,background:t.border,borderRadius:2,overflow:'hidden'}}>
                      <div style={{width:`${(tr.conf||0)*100}%`,height:'100%',background:tr.conf>0.7?t.ok:t.peach,borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:11,fontFamily:'monospace',color:t.text}}>{((tr.conf||0)*100).toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{padding:'10px 20px'}}>
                  <button onClick={()=>window.open(tr.url,'_blank')}
                    style={{padding:'4px 12px',background:t.bgAlt,border:`0.5px solid ${t.border}`,color:t.textMuted,borderRadius:6,fontSize:11,cursor:'pointer'}}>
                    View trace ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}