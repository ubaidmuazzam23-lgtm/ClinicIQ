// ── ANALYTICS SCREEN — add to AdminDashboard.tsx ──────────────
// Add 'analytics' to Screen type and navItems, then add:
// {screen==='analytics' && <AnalyticsScreen t={t} dark={dark}/>}

function AnalyticsScreen({t, dark}:any) {
    const [data, setData]     = useState<any>(null)
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      api.get('/admin/analytics')
        .then(res => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])
  
    if (loading) return <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Loading analytics…</div>
    if (!data)   return <div style={{padding:48,textAlign:'center',color:t.textFaint}}>Failed to load analytics</div>
  
    const agentColor: Record<string,string> = {
      lab:'#60a5fa', radiology:'#a78bfa', allergy:'#34d399'
    }
    const agentLabel: Record<string,string> = {
      lab:'Lab Interpreter', radiology:'Radiology Analyzer', allergy:'Allergy Safety'
    }
  
    const maxCost = Math.max(...(data.cost_trend||[]).map((d:any)=>d.cost), 0.001)
    const maxRuntime = Math.max(...(data.slowest||[]).map((d:any)=>d.total_runtime), 1)
  
    return (
      <div style={{padding:24,maxWidth:1300,animation:'fadeUp 0.4s ease both'}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:500,color:t.text,marginBottom:4}}>AI Analytics</h1>
          <div style={{fontSize:13,color:t.textMuted}}>Agent performance, cost trends, latency, and Langfuse trace links · {data.total_reports} total queries</div>
        </div>
  
        {/* ── Agent Performance ── */}
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
                      {label:'Avg confidence', val:`${((s.avg_confidence||0)*100).toFixed(0)}%`, color:s.avg_confidence>0.5?t.ok:t.peach},
                      {label:'Accuracy rate',  val:`${s.accuracy_pct||0}%`,                      color:s.accuracy_pct>50?t.ok:t.peach},
                      {label:'Avg latency',    val:`${s.avg_runtime||0}s`,                       color:t.text},
                      {label:'Avg cost/query', val:`$${(s.avg_cost||0).toFixed(5)}`,            color:t.text},
                      {label:'Total cost',     val:`$${(s.total_cost||0).toFixed(4)}`,           color:'#f59e0b'},
                      {label:'Times fired',    val:`${s.fired_count||0}/${s.total_queries||0}`,  color:t.text},
                    ].map(stat=>(
                      <div key={stat.label}>
                        <div style={{fontSize:10,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',marginBottom:3}}>{stat.label}</div>
                        <div style={{fontSize:16,fontWeight:700,color:stat.color,fontFamily:'monospace'}}>{stat.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Accuracy bar */}
                  <div style={{padding:'0 20px 16px'}}>
                    <div style={{height:4,background:t.border,borderRadius:2,overflow:'hidden'}}>
                      <div style={{width:`${s.accuracy_pct||0}%`,height:'100%',background:color,borderRadius:2,transition:'width 0.5s'}}/>
                    </div>
                    <div style={{fontSize:10,color:t.textFaint,marginTop:4,fontFamily:'monospace'}}>Fired on {s.accuracy_pct||0}% of queries</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
  
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          {/* ── Cost Trend Chart ── */}
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
                        <div style={{fontSize:9,color:t.textFaint,fontFamily:'monospace'}}>${d.cost.toFixed(4)}</div>
                        <div style={{
                          width:'100%',
                          height:`${Math.max((d.cost/maxCost)*100,4)}px`,
                          background:`linear-gradient(180deg,#D77A61,#D8B4A0)`,
                          borderRadius:'3px 3px 0 0',
                          minHeight:4,
                          position:'relative',
                        }}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {(data.cost_trend||[]).map((d:any,i:number)=>(
                      <div key={i} style={{flex:1,textAlign:'center',fontSize:8,color:t.textFaint,fontFamily:'monospace'}}>
                        {d.date?.slice(5)||''}
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:12,color:t.textMuted}}>Total spend: <span style={{color:'#f59e0b',fontWeight:700}}>${(data.cost_trend||[]).reduce((s:number,d:any)=>s+d.cost,0).toFixed(4)}</span></div>
                    <div style={{fontSize:12,color:t.textMuted}}>Total queries: <span style={{color:t.peach,fontWeight:700}}>{(data.cost_trend||[]).reduce((s:number,d:any)=>s+d.queries,0)}</span></div>
                  </div>
                </>
              )}
            </div>
          </div>
  
          {/* ── Slowest Queries ── */}
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
  
        {/* ── Langfuse Trace Links ── */}
        <div style={{background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:10,boxShadow:t.shadow,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:t.text}}>Langfuse trace viewer</div>
              <div style={{fontSize:11,color:t.textMuted,marginTop:2}}>Click any query to open its full trace in Langfuse — token usage, latency, cost breakdown</div>
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
                      style={{padding:'4px 12px',background:t.bgAlt,border:`0.5px solid ${t.border}`,color:t.textMuted,borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
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