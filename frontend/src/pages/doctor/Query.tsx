// FILE: clinicaliq/frontend/src/pages/doctor/Query.tsx

import { useState, useEffect } from 'react'
import { Card, CardHeader } from '../../components/shared/Card'
import Btn from '../../components/shared/Btn'
import Icon from '../../components/shared/Icon'
import api from '../../lib/axios'

interface Props { t: any; dark: boolean; selectedPatient: any }

export default function DoctorQueryScreen({ t, dark, selectedPatient }: Props) {
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<any>(null)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState<'lab'|'radiology'|'allergy'|'sources'>('lab')
  const [patientDocs, setPatientDocs] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<string>('')

  useEffect(() => {
    if (selectedPatient) fetchPatientDocs()
  }, [selectedPatient])

  const fetchPatientDocs = async () => {
    // We can't get patient docs directly as doctor
    // But we show them a hint from reports
    setPatientDocs([])
  }

  const handleQuery = async () => {
    if (!query.trim()) return
    setLoading(true); setError(''); setResult(null); setTab('lab')
    try {
      let queryText = query
      if (selectedDoc) queryText = `[Referring to: ${selectedDoc}] ${query}`
      const body: any = { query_text: queryText }
      if (selectedPatient?.id) body.patient_id = selectedPatient.id
      const res = await api.post('/query/', body)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Query failed.')
    } finally { setLoading(false) }
  }

  const tabs = [
    { key: 'lab',       label: `Lab Results${result?.lab?.tests?.length ? ` ${result.lab.tests.length}` : ''}` },
    { key: 'radiology', label: 'Radiology' },
    { key: 'allergy',   label: `Allergy Safety${result?.allergy?.allergies?.length ? ` ${result.allergy.allergies.length}` : ''}` },
    { key: 'sources',   label: 'Sources' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1100, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 500, color: t.text, marginBottom: 4 }}>
          Clinical query{selectedPatient ? ` — ${selectedPatient.full_name}` : ''}
        </h1>
        <div style={{ fontSize: 13, color: t.textMuted }}>
          Full clinical output · Lab + Radiology + Allergy agents · Doctor role
          {selectedPatient ? ` · Patient: ${selectedPatient.email}` : ' · No patient selected'}
        </div>
      </div>

      {/* Query input */}
      <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ padding: 20 }}>
          {selectedPatient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: t.peachSoft, borderRadius: 8, marginBottom: 14, border: `0.5px solid ${t.peach}` }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.peach, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {selectedPatient.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.peachDeep }}>Querying for: {selectedPatient.full_name}</span>
                <span style={{ fontSize: 11, color: t.peach, marginLeft: 8 }}>{selectedPatient.email}</span>
              </div>
            </div>
          )}
          <textarea value={query} onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Patient CBC shows Hgb 9.2, Ferritin 8. Interpret findings and check allergy conflicts."
            style={{ width: '100%', minHeight: 100, border: `0.5px solid ${t.border}`, borderRadius: 8, padding: 14, fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', background: t.bgAlt, color: t.text, lineHeight: 1.6, outline: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ fontSize: 12, color: t.textFaint }}>Full clinical output · Doctor role · All 3 agents</div>
            <button onClick={handleQuery} disabled={!query.trim() || loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', border: `0.5px solid ${t.peach}`, background: t.peach, color: '#fff', opacity: !query.trim() ? 0.5 : 1, fontFamily: "'DM Sans',sans-serif" }}>
              {loading
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analyzing…</>
                : <><Icon name="sparkle" size={14} /> Run clinical query</>}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: t.warnSoft, border: `0.5px solid ${t.peach}`, borderRadius: 8, fontSize: 13, color: t.peach, marginBottom: 14 }}>{error}</div>
      )}

      {result && (
        <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>

          {/* Orchestrator panel */}
          <div style={{ padding: '12px 20px', background: dark ? '#0d1a22' : '#1a2f3a', borderBottom: `0.5px solid rgba(255,255,255,0.08)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.ok }} />
                <span style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)' }}>
                  Orchestrator · {result.agents_used?.length || 0} agents ran in parallel · 
                  {result.hitl_required ? ' 1 conflict reconciled' : ' resolved'}
                </span>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' }}>
                GPT-4o-mini · trace: {result.langfuse_trace_id?.slice(0, 8) || 'no-trace'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Lab Interpreter Agent',    data: result.lab,      color: t.ok    },
                { label: 'Radiology Analyzer Agent', data: result.radiology, color: '#60a5fa' },
                { label: 'Allergy Safety Agent',     data: result.allergy,  color: t.peach  },
              ].map(agent => (
                <div key={agent.label} style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', textTransform: 'lowercase' }}>{agent.label}</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
                      {agent.data?.runtime} · {agent.data?.cost}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>confidence</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#fff' }}>
                      {agent.data ? `${((agent.data.confidence || 0) * 100).toFixed(0)}%` : '—'}
                    </span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{ width: `${agent.data ? (agent.data.confidence || 0) * 100 : 0}%`, height: '100%', background: agent.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>
                Clinical query{selectedPatient ? ` — ${selectedPatient.full_name}` : ''}
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
                {(result.overall_confidence * 100).toFixed(0)}% overall confidence
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {result.emergency_flag && (
                <span style={{ padding: '3px 10px', background: 'rgba(184,91,67,0.2)', color: '#D77A61', fontSize: 11, borderRadius: 99, fontFamily: 'monospace', fontWeight: 600 }}>⚠ EMERGENCY</span>
              )}
              {result.hitl_required && (
                <span style={{ padding: '3px 10px', background: t.peachSoft, color: t.peach, fontSize: 11, borderRadius: 99, fontFamily: 'monospace' }}>HITL Required</span>
              )}
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `0.5px solid ${t.border}`, background: t.bgCard, color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
                <Icon name="download" size={12} /> Export PDF
              </button>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `0.5px solid ${t.ok}`, background: t.okSoft, color: t.ok, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                ✓ Approve for patient
              </button>
            </div>
          </div>

          {/* Emergency/HITL banners */}
          {result.emergency_flag && (
            <div style={{ padding: '12px 20px', background: 'rgba(184,91,67,0.12)', borderBottom: `0.5px solid rgba(184,91,67,0.3)`, fontSize: 13, color: '#D77A61', display: 'flex', gap: 10 }}>
              <span>⚠</span>
              <span><strong>Emergency flag raised</strong> — immediate clinical attention required.</span>
            </div>
          )}
          {result.hitl_required && (
            <div style={{ padding: '12px 20px', background: t.peachSoft, borderBottom: `0.5px solid ${t.peach}`, fontSize: 13, color: t.peachDeep }}>
              ✦ HITL flagged — {result.hitl_reason}
            </div>
          )}

          {/* Patient summary */}
          {result.patient_summary && (
            <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${t.border}`, background: dark ? 'rgba(34,56,67,0.15)' : '#EDF3F6' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', color: t.textFaint, marginBottom: 6 }}>Patient-facing summary (plain language)</div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: t.text, fontStyle: 'italic' }}>{result.patient_summary}</p>
            </div>
          )}

          {/* Tab bar */}
          <div style={{ padding: '0 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', gap: 0 }}>
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key as any)}
                style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === tb.key ? t.peach : 'transparent'}`, color: tab === tb.key ? t.peach : t.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: tab === tb.key ? 600 : 400, transition: 'all 0.15s', marginBottom: -1 }}>
                {tb.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 20 }}>

            {/* Lab */}
            {tab === 'lab' && (
              <div>
                {result.lab?.tests?.length > 0 ? (
                  <>
                    {result.lab.summary && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase', color: t.textFaint, marginBottom: 6 }}>Lab Interpreter Agent · Impression</div>
                        <p style={{ fontSize: 13, color: t.text, lineHeight: 1.65 }}>{result.lab.summary}</p>
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
                      <thead>
                        <tr style={{ borderBottom: `0.5px solid ${t.border}` }}>
                          {['Test', 'Value', 'Unit', 'Reference', 'Δ', 'Flag'].map(h => (
                            <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', color: t.textFaint, fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.lab.tests.map((test: any, i: number) => {
                          const ok = test.status === 'ok' || test.status === 'normal'
                          const critical = test.status === 'critical'
                          const val = parseFloat(test.value) || 0
                          const refParts = (test.reference_range || '').split('-')
                          const refMid = refParts.length === 2 ? (parseFloat(refParts[0]) + parseFloat(refParts[1])) / 2 : val
                          const delta = (val - refMid).toFixed(1)
                          return (
                            <tr key={i} style={{ borderBottom: i < result.lab.tests.length - 1 ? `0.5px solid ${t.border}` : 'none' }}>
                              <td style={{ padding: '9px 14px', fontSize: 13, color: t.text, fontWeight: 500 }}>{test.name}</td>
                              <td style={{ padding: '9px 14px', fontSize: 15, fontFamily: 'monospace', fontWeight: 700, color: critical ? '#D77A61' : ok ? t.text : t.peach }}>{test.value}</td>
                              <td style={{ padding: '9px 14px', fontSize: 12, color: t.textMuted }}>{test.unit}</td>
                              <td style={{ padding: '9px 14px', fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{test.reference_range}</td>
                              <td style={{ padding: '9px 14px', fontSize: 11, fontFamily: 'monospace', color: ok ? t.textFaint : t.peach }}>
                                {ok ? '—' : (val > refMid ? '↑ ' : '↓ ') + Math.abs(parseFloat(delta))}
                              </td>
                              <td style={{ padding: '9px 14px' }}>
                                {!ok && (
                                  <span style={{ padding: '2px 8px', fontSize: 10, borderRadius: 99, background: critical ? 'rgba(184,91,67,0.2)' : t.warnSoft, color: critical ? '#D77A61' : t.peach, fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {test.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {result.lab.recommendations?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase', color: t.textFaint, marginBottom: 8 }}>Recommendations</div>
                        {result.lab.recommendations.map((r: string, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < result.lab.recommendations.length - 1 ? `0.5px solid ${t.border}` : 'none' }}>
                            <span style={{ fontSize: 11, color: t.peach, fontFamily: 'monospace', flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontSize: 10, color: t.textFaint, fontFamily: 'monospace', display: 'flex', gap: 16 }}>
                      <span>Confidence: {((result.lab.confidence || 0) * 100).toFixed(0)}%</span>
                      <span>Runtime: {result.lab.runtime}</span>
                      <span>Cost: {result.lab.cost}</span>
                    </div>
                  </>
                ) : <div style={{ color: t.textFaint, fontSize: 13, padding: '16px 0' }}>No lab data found for this query.</div>}
              </div>
            )}

            {/* Radiology */}
            {tab === 'radiology' && (
              <div>
                {result.radiology?.confidence > 0.2 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div style={{ padding: '12px 14px', background: t.bgAlt, borderRadius: 8 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', color: t.textFaint, marginBottom: 6 }}>Modality</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{result.radiology.modality || 'Unknown'}</div>
                      </div>
                      <div style={{ padding: '12px 14px', background: t.bgAlt, borderRadius: 8 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', color: t.textFaint, marginBottom: 6 }}>Urgency</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: result.radiology.urgency === 'emergency' ? '#D77A61' : t.text, textTransform: 'capitalize' }}>
                          {result.radiology.urgency || 'Routine'}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', background: t.bgAlt, borderRadius: 8, fontSize: 13, color: t.text, lineHeight: 1.65, marginBottom: 14 }}>
                      <strong>Findings:</strong> {result.radiology.findings}
                    </div>
                    {result.radiology.differentials?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase', color: t.textFaint, marginBottom: 10 }}>Differential diagnoses</div>
                        {result.radiology.differentials.map((d: any, i: number) => (
                          <div key={i} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 14, color: d.urgent ? t.peach : t.text, fontWeight: d.urgent ? 600 : 400 }}>{d.diagnosis}</span>
                              <span style={{ fontSize: 13, fontFamily: 'monospace', color: t.textMuted, fontWeight: 600 }}>{(d.probability * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ height: 4, background: t.border, borderRadius: 2 }}>
                              <div style={{ width: `${d.probability * 100}%`, height: '100%', background: d.urgent ? t.peach : t.ok, borderRadius: 2 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 10, color: t.textFaint, fontFamily: 'monospace', display: 'flex', gap: 16 }}>
                      <span>Confidence: {((result.radiology.confidence || 0) * 100).toFixed(0)}%</span>
                      <span>Runtime: {result.radiology.runtime}</span>
                    </div>
                  </>
                ) : <div style={{ color: t.textFaint, fontSize: 13, padding: '16px 0' }}>No radiology report found for this query.</div>}
              </div>
            )}

            {/* Allergy */}
            {tab === 'allergy' && (
              <div>
                {result.allergy?.confidence > 0.2 ? (
                  <>
                    {result.allergy.allergies?.map((a: any, i: number) => (
                      <div key={i} style={{ padding: 14, borderRadius: 8, background: t.warnSoft, border: `0.5px solid ${t.peach}`, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{a.allergen}</span>
                          <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: a.severity === 'anaphylactic' ? 'rgba(184,91,67,0.2)' : t.warnSoft, color: a.severity === 'anaphylactic' ? '#D77A61' : t.peach, textTransform: 'capitalize' }}>{a.severity}</span>
                        </div>
                        {a.cross_reactivities?.length > 0 && <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>⚠ Cross-reactive with: {a.cross_reactivities.join(', ')}</div>}
                        {a.safe_alternatives?.length > 0 && <div style={{ fontSize: 12, color: t.ok }}>✓ Safe alternatives: {a.safe_alternatives.join(', ')}</div>}
                      </div>
                    ))}
                    {result.allergy.summary && <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5, marginBottom: 10 }}>{result.allergy.summary}</div>}
                    <div style={{ fontSize: 10, color: t.textFaint, fontFamily: 'monospace', display: 'flex', gap: 16 }}>
                      <span>Confidence: {((result.allergy.confidence || 0) * 100).toFixed(0)}%</span>
                      <span>Runtime: {result.allergy.runtime}</span>
                      <span>Cost: {result.allergy.cost}</span>
                    </div>
                  </>
                ) : <div style={{ color: t.textFaint, fontSize: 13, padding: '16px 0' }}>No allergy records found.</div>}
              </div>
            )}

            {/* Sources */}
            {tab === 'sources' && (
              <div>
                <div style={{ padding: '14px', background: t.bgAlt, borderRadius: 8, fontSize: 13, color: t.text, lineHeight: 1.65, marginBottom: 14 }}>
                  <strong>Pipeline:</strong> Query → ChromaDB vector search → 3 agents in parallel (asyncio.gather) → NetworkX knowledge graph → Orchestrator reconciliation → Role filter → Response
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Lab Interpreter',    data: result.lab },
                    { label: 'Radiology Analyzer', data: result.radiology },
                    { label: 'Allergy Safety',     data: result.allergy },
                  ].map(agent => (
                    <div key={agent.label} style={{ padding: 14, background: t.bgCard2, borderRadius: 8, border: `0.5px solid ${t.border}` }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase', color: t.textFaint, marginBottom: 8 }}>{agent.label}</div>
                      {[
                        ['Confidence', agent.data ? `${((agent.data.confidence || 0) * 100).toFixed(0)}%` : '—'],
                        ['Runtime',    agent.data?.runtime || '—'],
                        ['Cost',       agent.data?.cost || '—'],
                        ['Chunks',     agent.data?.source_chunk_ids?.length || 0],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: t.textMuted }}>{k}</span>
                          <span style={{ color: t.text, fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 8, height: 3, background: t.border, borderRadius: 2 }}>
                        <div style={{ width: `${agent.data ? (agent.data.confidence || 0) * 100 : 0}%`, height: '100%', background: t.peach, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: t.textFaint, fontFamily: 'monospace', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>Overall confidence: {(result.overall_confidence * 100).toFixed(0)}%</span>
                  <span>Query ID: {result.query_id}</span>
                  {result.langfuse_trace_id && result.langfuse_trace_id !== 'no-trace' && (
                    <span>Langfuse: {result.langfuse_trace_id}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: t.textFaint, fontSize: 14 }}>
          Enter a clinical query above to get full agent output — Lab, Radiology, Allergy, and Sources.
        </div>
      )}
    </div>
  )
}