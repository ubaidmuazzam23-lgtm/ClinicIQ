// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/patient/Reports.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { Card, CardHeader } from '../../components/shared/Card'
import Btn from '../../components/shared/Btn'
import Icon from '../../components/shared/Icon'
import api from '../../lib/axios'

interface Props {
  t: any
  dark: boolean
}

export default function ReportsScreen({ t, dark }: Props) {
  const [reports, setReports]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter]     = useState<'all' | 'emergency' | 'hitl'>('all')

  useEffect(() => {
    api.get('/query/reports')
      .then(res => setReports(res.data.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = reports.filter(r => {
    if (filter === 'emergency') return r.emergency_flag
    if (filter === 'hitl')      return r.hitl_required
    return true
  })

  return (
    <div style={{ maxWidth: 920, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: t.text, marginBottom: 4 }}>
          My reports
        </h1>
        <div style={{ fontSize: 14, color: t.textMuted }}>
          All AI-generated health reports from your uploaded documents.
        </div>
      </div>

      {/* Filter tabs */}
      {reports.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {([
            { key: 'all',       label: `All (${reports.length})` },
            { key: 'emergency', label: `⚠ Emergency (${reports.filter(r => r.emergency_flag).length})` },
            { key: 'hitl',      label: `HITL (${reports.filter(r => r.hitl_required).length})` },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', border: `0.5px solid ${filter === f.key ? t.peach : t.border}`, background: filter === f.key ? t.peachSoft : 'transparent', color: filter === f.key ? t.peach : t.textMuted, fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Card t={t}>
          <div style={{ padding: '32px 20px', textAlign: 'center', color: t.textFaint }}>Loading…</div>
        </Card>
      ) : reports.length === 0 ? (
        <Card t={t}>
          <div style={{ padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: t.peachSoft, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: t.peach }}>
              <Icon name="report" size={24} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 500, color: t.text, marginBottom: 10 }}>
              No reports yet
            </h2>
            <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Upload a document and ask a question — your AI-generated reports will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r: any) => (
            <Card t={t} key={r.id} onClick={() => setSelected(selected === r.id ? null : r.id)}>
              <div style={{ padding: 20 }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: selected === r.id ? 16 : 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: t.text, marginBottom: 6, lineHeight: 1.3 }}>
                      {r.query_text}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>
                        {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>
                        Confidence: {r.confidence ? `${(r.confidence * 100).toFixed(0)}%` : '—'}
                      </span>
                      {r.emergency_flag && (
                        <span style={{ padding: '2px 8px', fontSize: 10, borderRadius: 99, background: 'rgba(184,91,67,0.15)', color: '#D77A61', fontFamily: 'monospace' }}>⚠ Emergency</span>
                      )}
                      {r.hitl_required && (
                        <span style={{ padding: '2px 8px', fontSize: 10, borderRadius: 99, background: t.peachSoft, color: t.peach, fontFamily: 'monospace' }}>HITL</span>
                      )}
                      {r.agents_used?.map((a: string) => (
                        <span key={a} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 99, background: t.bgAlt, color: t.textFaint, fontFamily: 'monospace' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                  <Icon name="chevron" size={16} />
                </div>

                {/* Expanded content */}
                {selected === r.id && r.response_json && (
                  <div style={{ borderTop: `0.5px solid ${t.border}`, paddingTop: 16 }}>

                    {/* Patient summary */}
                    {r.response_json.patient_summary && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 8 }}>Summary</div>
                        <p style={{ fontSize: 16, lineHeight: 1.7, color: t.text, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500 }}>
                          {r.response_json.patient_summary}
                        </p>
                      </div>
                    )}

                    {/* Lab tests */}
                    {r.response_json.lab?.tests?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 8 }}>Lab results</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                          {r.response_json.lab.tests.slice(0, 6).map((test: any, i: number) => {
                            const ok = test.status === 'ok' || test.status === 'normal'
                            return (
                              <div key={i} style={{ padding: 10, borderRadius: 7, background: ok ? t.okSoft : t.warnSoft, border: `0.5px solid ${ok ? t.ok : t.peach}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? t.ok : t.peach }} />
                                  <span style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{test.name}</span>
                                </div>
                                <div style={{ fontSize: 11, color: t.textMuted, fontFamily: 'monospace' }}>
                                  {test.value} {test.unit}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {r.response_json.lab?.recommendations?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 8 }}>Recommendations</div>
                        {r.response_json.lab.recommendations.map((rec: string, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < r.response_json.lab.recommendations.length - 1 ? `0.5px solid ${t.border}` : 'none' }}>
                            <span style={{ fontSize: 11, color: t.peach, fontFamily: 'monospace', flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace', display: 'flex', gap: 16, marginTop: 12 }}>
                      <span>Agents: {r.agents_used?.join(', ')}</span>
                      {r.langfuse_trace && r.langfuse_trace !== 'no-trace' && (
                        <span>Trace: {r.langfuse_trace.slice(0, 8)}…</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}