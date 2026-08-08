// FILE: clinicaliq/frontend/src/pages/doctor/PatientProfile.tsx

import { useState, useEffect } from 'react'
import { Card, CardHeader } from '../../components/shared/Card'
import Icon from '../../components/shared/Icon'
import Btn from '../../components/shared/Btn'
import api from '../../lib/axios'
import DocumentViewer from '../../components/shared/DocumentViewer'

interface Props {
  t: any
  dark: boolean
  selectedPatient: any
  reports: any[]
  go: (screen: string) => void
}

export default function PatientScreen({ t, dark, selectedPatient, reports, go }: Props) {
  const [docs, setDocs]       = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<any>(null)
  const cleanQ = (q:string) => q?.replace(/^\[Referring to:[^\]]+\]\s*/i,'').trim()

  useEffect(() => {
    if (selectedPatient) fetchDocs()
  }, [selectedPatient])

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/upload/patient-documents/${selectedPatient.id}`)
      setDocs(res.data.documents || [])
    } catch {}
    finally { setLoading(false) }
  }

  if (!selectedPatient) {
    return (
      <div style={{ padding: 24, maxWidth: 900 }}>
        <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: '64px 40px', textAlign: 'center', boxShadow: t.shadow }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: t.peachSoft, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: t.peach }}>
            <Icon name="users" size={24} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 500, color: t.text, marginBottom: 10 }}>No patient selected</h2>
          <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6 }}>
            Use the patient selector in the top bar to choose a patient to view their profile.
          </p>
        </div>
      </div>
    )
  }

  // Extract allergy info from reports
  const allergies: any[] = []
  reports.forEach(r => {
    const allergy = r.response_json?.allergy
    if (allergy?.allergies) {
      allergy.allergies.forEach((a: any) => {
        if (!allergies.find(ex => ex.allergen === a.allergen)) {
          allergies.push(a)
        }
      })
    }
  })

  // Extract lab values from latest report
  const latestReport = reports[0]
  const latestLab = latestReport?.response_json?.lab
  const labTests = latestLab?.tests || []
  const abnormal = labTests.filter((t: any) => t.status !== 'normal' && t.status !== 'ok')

  // Assignment trail from reports
  const trail = reports.map(r => ({
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(r.created_at).toLocaleDateString(),
    label: cleanQ(r.query_text || '').slice(0, 50),
    conf: r.confidence,
    agents: r.agents_used || [],
  }))

  const initials = selectedPatient.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2) || 'PT'

  return (
    <div style={{ padding: 24, maxWidth: 1100, animation: 'fadeUp 0.4s ease both' }}>

      {/* Patient header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(215,122,97,0.2)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700, color: t.peach, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 500, color: t.text, marginBottom: 4 }}>
              {selectedPatient.full_name}
            </h1>
            <div style={{ fontSize: 12, color: t.textMuted, fontFamily: 'monospace' }}>
              {selectedPatient.email} · {reports.length} queries submitted
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => go('query')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.peach}`, background: t.peach, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
            <Icon name="sparkle" size={13} /> New query
          </button>
          <button onClick={() => go('chat')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.border}`, background: t.bgCard, color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
            <Icon name="chat" size={13} /> Message patient
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

        {/* Left — main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Active clinical picture */}
          {latestReport && (
            <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Active clinical picture</div>
                  <span style={{ padding: '2px 8px', background: t.peachSoft, color: t.peach, fontSize: 10, borderRadius: 99, fontFamily: 'monospace' }}>AI SUMMARY</span>
                </div>
                <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>
                  updated {new Date(latestReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ padding: 20 }}>
                {latestReport.response_json?.patient_summary && (
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, marginBottom: 16 }}>
                    {latestReport.response_json.patient_summary}
                  </p>
                )}
                {/* Value pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {labTests.slice(0, 5).map((test: any, i: number) => {
                    const ok = test.status === 'normal' || test.status === 'ok'
                    return (
                      <span key={i} style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                        background: ok ? t.okSoft : t.warnSoft,
                        color: ok ? t.ok : t.peach,
                        border: `0.5px solid ${ok ? t.ok : t.peach}`,
                      }}>
                        {test.name.toUpperCase().slice(0, 8)} {test.value}
                      </span>
                    )
                  })}
                  {latestReport.hitl_required && (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, background: t.peachSoft, color: t.peach }}>HITL</span>
                  )}
                  {!latestReport.emergency_flag && !latestReport.hitl_required && (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, background: t.okSoft, color: t.ok }}>ROUTINE</span>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* Documents on file */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Documents on file</div>
              <span style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{docs.length} indexed</span>
            </div>
            {loading ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: t.textFaint, fontSize: 13 }}>Loading…</div>
            ) : docs.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: t.textFaint, fontSize: 13 }}>No documents uploaded yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${t.border}` }}>
                    {['Document', 'Category', 'Uploaded', 'Chunks', ''].map(h => (
                      <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: t.textFaint, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc: any, i: number) => (
                    <tr key={doc.id} style={{ borderBottom: i < docs.length - 1 ? `0.5px solid ${t.border}` : 'none' }}>
                      <td style={{ padding: '10px 20px', fontSize: 13, color: t.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{doc.filename}</td>
                      <td style={{ padding: '10px 20px' }}>
                        <span style={{ padding: '2px 8px', background: t.peachSoft, color: t.peach, fontSize: 10, borderRadius: 99, fontFamily: 'monospace', textTransform: 'uppercase' }}>{doc.category}</span>
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 20px', fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{doc.chunk_count || 0}</td>
                      <td style={{ padding: '10px 20px' }}>
                        <button onClick={() => setViewingDoc(doc)}
                          style={{ padding: '4px 12px', background: t.peachSoft, border: `0.5px solid ${t.peach}`, color: t.peach, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                          Read →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Generated reports */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Generated reports</div>
              <span style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{reports.length} reports</span>
            </div>
            {reports.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: t.textFaint, fontSize: 13 }}>No queries yet for this patient.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${t.border}` }}>
                    {['Query', 'Agents', 'Confidence', 'Created', ''].map(h => (
                      <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: t.textFaint, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: any, i: number) => (
                    <tr key={r.id} style={{ borderBottom: i < reports.length - 1 ? `0.5px solid ${t.border}` : 'none', cursor: 'pointer' }}
                      onClick={() => go('reports')}>
                      <td style={{ padding: '10px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                          {cleanQ(r.query_text || '')}
                        </div>
                        {r.query_text?.includes('Referring to:') && (
                          <div style={{ fontSize: 10, color: t.textFaint, fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{r.query_text.slice(0, 60)}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 20px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {r.agents_used?.map((a: string) => (
                            <span key={a} style={{ padding: '1px 6px', background: t.peachSoft, color: t.peach, fontSize: 9, borderRadius: 99, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                              {a.replace('_interpreter', '').replace('_analyzer', '').replace('_safety', '').toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: t.border, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${(r.confidence || 0) * 100}%`, height: '100%', background: r.confidence > 0.7 ? t.ok : t.peach, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.text }}>{r.confidence ? `${(r.confidence * 100).toFixed(0)}%` : '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 20px', color: t.textFaint }}>→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right — allergy + assignment trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Allergy profile */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert" size={14} />
              <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>Allergy profile</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {allergies.length === 0 ? (
                <div style={{ fontSize: 12, color: t.textFaint }}>No allergies detected in reports.</div>
              ) : allergies.map((a: any, i: number) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.severity === 'anaphylactic' ? '#D77A61' : t.peach, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{a.allergen}</span>
                    <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 'auto', fontStyle: 'italic' }}>({a.severity})</span>
                  </div>
                  {a.cross_reactivities?.length > 0 && (
                    <div style={{ fontSize: 11, color: t.textFaint, marginLeft: 12, marginTop: 2 }}>↳ {a.cross_reactivities.join(', ')}</div>
                  )}
                </div>
              ))}
              {allergies.length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: t.bgAlt, borderRadius: 7, fontSize: 11, color: t.textFaint }}>
                  ✦ Knowledge graph: {allergies.reduce((s: number, a: any) => s + (a.cross_reactivities?.length || 0), 0)} cross-reactivity edges
                </div>
              )}
            </div>
          </div>

          {/* Assignment trail */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${t.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>Query trail</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {trail.length === 0 ? (
                <div style={{ fontSize: 12, color: t.textFaint }}>No queries yet.</div>
              ) : trail.slice(0, 6).map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.peach, marginTop: 3 }} />
                    {i < trail.length - 1 && <div style={{ width: 1, flex: 1, background: t.border, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: t.textMuted, fontFamily: 'monospace', marginBottom: 2 }}>{item.time}</div>
                    <div style={{ fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {item.agents.map((a: string) => (
                        <span key={a} style={{ fontSize: 9, padding: '1px 5px', background: t.bgAlt, color: t.textFaint, borderRadius: 99, fontFamily: 'monospace' }}>
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {item.conf && (
                        <span style={{ fontSize: 9, padding: '1px 5px', background: t.bgAlt, color: t.textFaint, borderRadius: 99, fontFamily: 'monospace' }}>
                          {(item.conf * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    {viewingDoc && <DocumentViewer doc={viewingDoc} t={t} onClose={()=>setViewingDoc(null)}/>}
    </div>
  )
}