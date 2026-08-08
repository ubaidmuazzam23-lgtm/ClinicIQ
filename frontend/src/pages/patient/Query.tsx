// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/patient/Query.tsx
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Card, CardHeader } from '../../components/shared/Card'
import Btn from '../../components/shared/Btn'
import Icon from '../../components/shared/Icon'
import api from '../../lib/axios'

interface Props {
  t: any
  dark: boolean
  docs: any[]
  go: (screen: string) => void
}

export default function QueryScreen({ t, dark, docs, go }: Props) {
  const [query, setQuery]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<any>(null)
  const [error, setError]           = useState('')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]) // empty = all docs
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [reportId, setReportId]         = useState<string|null>(null)
  const [consultStatus, setConsultStatus] = useState<'idle'|'loading'|'done'>('idle')
  const [consultDoctor, setConsultDoctor]   = useState<any>(null)

  // Toggle doc selection
  const toggleDoc = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const handleQuery = async () => {
    if (!query.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      // Pass selected doc filenames as context hint in query
      let queryText = query
      if (selectedDocs.length > 0) {
        const selectedFilenames = docs
          .filter((d: any) => selectedDocs.includes(d.id))
          .map((d: any) => d.filename)
          .join(', ')
        queryText = `[Referring to: ${selectedFilenames}] ${query}`
      }
      const res = await api.post('/query/', { query_text: queryText })
      setResult(res.data)
      setReportId(res.data.report_id || null)
      setConsultStatus('idle')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Query failed. Please try again.')
    } finally { setLoading(false) }
  }

  // No documents state
  if (docs.length === 0) {
    return (
      <div style={{ maxWidth: 720, animation: 'fadeUp 0.4s ease both' }}>
        <Card t={t}>
          <div style={{ padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: t.peachSoft, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: t.peach }}>
              <Icon name="upload" size={24} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 500, color: t.text, marginBottom: 10 }}>
              Upload a document first
            </h2>
            <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
              Upload at least one clinical document before asking questions. Our AI agents will analyze your specific documents.
            </p>
            <Btn t={t} primary onClick={() => go('upload')}>
              <Icon name="upload" size={14} /> Go to Upload
            </Btn>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 920, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: t.text, marginBottom: 4 }}>
          Ask a question
        </h1>
        <div style={{ fontSize: 14, color: t.textMuted }}>
          Our AI agents will search your uploaded documents and give you a personalized answer.
        </div>
      </div>

      {/* Query input card */}
      <Card t={t} style={{ marginBottom: 14 }}>
        <div style={{ padding: 20 }}>

          {/* Document selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>
                Search in:
              </label>
              <button onClick={() => setShowDocPicker(!showDocPicker)}
                style={{ fontSize: 12, color: t.peach, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {showDocPicker ? 'Hide' : 'Select specific documents'}
                <Icon name="chevron" size={12} />
              </button>
            </div>

            {/* All docs pill */}
            {!showDocPicker && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, background: selectedDocs.length === 0 ? t.peach : t.bgAlt, color: selectedDocs.length === 0 ? '#fff' : t.textMuted, border: `0.5px solid ${selectedDocs.length === 0 ? t.peach : t.border}`, cursor: 'pointer', fontFamily: 'monospace' }}
                  onClick={() => setSelectedDocs([])}>
                  All {docs.length} documents
                </span>
                {selectedDocs.length > 0 && (
                  <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, background: t.bgAlt, color: t.textMuted, border: `0.5px solid ${t.border}`, fontFamily: 'monospace' }}>
                    {selectedDocs.length} selected
                  </span>
                )}
              </div>
            )}

            {/* Document picker */}
            {showDocPicker && (
              <div style={{ border: `0.5px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', background: t.bgAlt, fontSize: 12, color: t.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Select documents to search</span>
                  <span onClick={() => setSelectedDocs([])} style={{ cursor: 'pointer', color: t.peach }}>Clear all</span>
                </div>
                {docs.map((doc: any, i: number) => {
                  const selected = selectedDocs.includes(doc.id)
                  return (
                    <div key={doc.id} onClick={() => toggleDoc(doc.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i > 0 ? `0.5px solid ${t.border}` : 'none', cursor: 'pointer', background: selected ? t.peachSoft : 'transparent', transition: 'background 0.15s' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected ? t.peach : t.border}`, background: selected ? t.peach : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {selected && <Icon name="check" size={10} />}
                      </div>
                      <Icon name="file" size={13} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</div>
                        <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{doc.category} · {doc.chunk_count} chunks</div>
                      </div>
                      <span style={{ padding: '2px 8px', background: t.peachSoft, color: t.peach, fontSize: 10, borderRadius: 99, fontFamily: 'monospace', flexShrink: 0 }}>
                        {doc.doc_type}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Query textarea */}
          <textarea value={query} onChange={e => setQuery(e.target.value)}
            placeholder="e.g. What do my blood test results mean? Are my hemoglobin levels normal?"
            style={{ width: '100%', minHeight: 100, border: `0.5px solid ${t.border}`, borderRadius: 8, padding: 14, fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', background: t.bgAlt, color: t.text, lineHeight: 1.6, outline: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ fontSize: 12, color: t.textFaint }}>
              {selectedDocs.length === 0
                ? `Searching all ${docs.length} documents`
                : `Searching ${selectedDocs.length} selected document${selectedDocs.length > 1 ? 's' : ''}`}
            </div>
            <Btn t={t} primary onClick={handleQuery} disabled={!query.trim() || loading} size="md">
              {loading
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analyzing…</>
                : <><Icon name="sparkle" size={14} /> Get answer</>}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: t.warnSoft, border: `0.5px solid ${t.peach}`, borderRadius: 8, fontSize: 13, color: t.peach, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card t={t}>
          <CardHeader t={t}
            title="Your answer"
            sub={`${result.agents_used?.length || 0} agents · ${(result.overall_confidence * 100).toFixed(0)}% confidence`}>
            <span style={{ padding: '3px 10px', background: t.peachSoft, color: t.peachDeep, fontSize: 11, borderRadius: 99, fontFamily: 'monospace' }}>
              AI generated
            </span>
          </CardHeader>
          <div style={{ padding: 20 }}>

            {/* Emergency */}
            {result.emergency_flag && (
              <div style={{ padding: '12px 14px', background: 'rgba(184,91,67,0.15)', border: '1px solid rgba(184,91,67,0.35)', borderRadius: 8, fontSize: 13, color: '#D77A61', marginBottom: 16, display: 'flex', gap: 10 }}>
                <span>⚠</span>
                <span><strong>Emergency flag raised</strong> — your results contain critical findings. Please consult a doctor immediately.</span>
              </div>
            )}

            {/* Emergency reason shown subtly */}
            {result.hitl_reason && result.emergency_flag && (
              <div style={{ padding: '8px 14px', background: t.peachSoft, border: `0.5px solid ${t.peach}`, borderRadius: 8, fontSize: 12, color: t.peachDeep, marginBottom: 16, opacity: 0.85 }}>
                {result.hitl_reason}
              </div>
            )}

            {/* Plain language summary */}
            {result.patient_summary && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 10 }}>
                  Summary in plain language
                </div>
                <p style={{ fontSize: 18, lineHeight: 1.7, color: t.text, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500 }}>
                  {result.patient_summary}
                </p>
              </div>
            )}

            {/* Lab tests */}
            {result.lab?.tests?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 10 }}>
                  Lab results
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {result.lab.tests.map((test: any, i: number) => {
                    const ok = test.status === 'ok' || test.status === 'normal'
                    return (
                      <div key={i} style={{ padding: 12, borderRadius: 8, background: ok ? t.okSoft : t.warnSoft, border: `0.5px solid ${ok ? t.ok : t.peach}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? t.ok : t.peach, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: t.text }}>{test.name}</span>
                        </div>
                        <div style={{ fontSize: 12, color: t.textMuted, fontFamily: 'monospace' }}>
                          {test.value} {test.unit} · <span style={{ textTransform: 'uppercase', fontSize: 10 }}>{test.status}</span>
                        </div>
                        {test.reference_range && (
                          <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>Ref: {test.reference_range}</div>
                        )}
                        {test.significance && (
                          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4, lineHeight: 1.4 }}>{test.significance}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {result.lab.summary && (
                  <div style={{ marginTop: 12, padding: '12px 14px', background: dark ? 'rgba(34,56,67,0.3)' : '#DDE6EB', borderRadius: 8, fontSize: 13, color: dark ? 'rgba(242,242,242,0.7)' : '#223843', lineHeight: 1.6 }}>
                    {result.lab.summary}
                  </div>
                )}
              </div>
            )}

            {/* Allergy */}
            {result.allergy?.allergies?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 10 }}>
                  Allergy safety check
                </div>
                {result.allergy.allergies.map((a: any, i: number) => (
                  <div key={i} style={{ padding: 12, borderRadius: 8, background: t.warnSoft, border: `0.5px solid ${t.peach}`, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: t.text, marginBottom: 4 }}>
                      {a.allergen} — <span style={{ textTransform: 'capitalize', color: t.peach }}>{a.severity}</span>
                    </div>
                    {a.cross_reactivities?.length > 0 && (
                      <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                        ⚠ Cross-reactive with: {a.cross_reactivities.join(', ')}
                      </div>
                    )}
                    {a.safe_alternatives?.length > 0 && (
                      <div style={{ fontSize: 12, color: t.ok, marginTop: 2 }}>
                        ✓ Safe alternatives: {a.safe_alternatives.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {result.allergy.summary && (
                  <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5, marginTop: 8 }}>
                    {result.allergy.summary}
                  </div>
                )}
              </div>
            )}

            {/* Radiology */}
            {result.radiology?.findings && result.radiology.findings.length > 10 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 10 }}>
                  Radiology findings
                </div>
                <div style={{ padding: '12px 14px', background: t.bgAlt, borderRadius: 8, fontSize: 13, color: t.text, lineHeight: 1.6, marginBottom: 10 }}>
                  {result.radiology.findings}
                </div>
                {result.radiology.differentials?.length > 0 && (
                  <div>
                    {result.radiology.differentials.map((d: any, i: number) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: d.urgent ? t.peach : t.text, fontWeight: d.urgent ? 600 : 400 }}>{d.diagnosis}</span>
                          <span style={{ fontSize: 12, fontFamily: 'monospace', color: t.textMuted }}>{(d.probability * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 3, background: t.border, borderRadius: 2 }}>
                          <div style={{ width: `${d.probability * 100}%`, height: '100%', background: d.urgent ? t.peach : t.ok, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {result.lab?.recommendations?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 10 }}>
                  Recommendations
                </div>
                {result.lab.recommendations.map((r: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < result.lab.recommendations.length - 1 ? `0.5px solid ${t.border}` : 'none' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.peachSoft, color: t.peachDeep, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.55, color: t.text }}>{r}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Agent transparency panel */}
<div style={{ marginBottom: 20 }}>
  <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textFaint, marginBottom: 10 }}>
    How we got this answer — agent breakdown
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

    {/* Lab agent */}
    {result.lab && (
      <div style={{ padding: 14, borderRadius: 8, background: t.bgAlt, border: `0.5px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: result.lab.confidence > 0.2 ? t.ok : t.textFaint }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Lab Interpreter Agent</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted }}>{result.lab.runtime}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted }}>{result.lab.cost}</span>
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: t.peachSoft, color: t.peach }}>
              {(result.lab.confidence * 100).toFixed(0)}% conf
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.55, marginBottom: result.lab.tests?.length > 0 ? 8 : 0 }}>
          {result.lab.confidence > 0.2
            ? `Found ${result.lab.tests?.length || 0} lab tests in your documents. ${result.lab.summary}`
            : 'No lab report found in your uploaded documents for this query.'}
        </div>
        {result.lab.tests?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {result.lab.tests.slice(0, 5).map((test: any, i: number) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: (test.status === 'normal' || test.status === 'ok') ? t.okSoft : t.warnSoft, color: (test.status === 'normal' || test.status === 'ok') ? t.ok : t.peach }}>
                {test.name}: {test.value} {test.unit}
              </span>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Radiology agent */}
    {result.radiology && (
      <div style={{ padding: 14, borderRadius: 8, background: t.bgAlt, border: `0.5px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: result.radiology.confidence > 0.2 ? t.ok : t.textFaint }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Radiology Analyzer Agent</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted }}>{result.radiology.runtime}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted }}>{result.radiology.cost}</span>
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: t.peachSoft, color: t.peach }}>
              {(result.radiology.confidence * 100).toFixed(0)}% conf
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.55, marginBottom: result.radiology.differentials?.length > 0 ? 8 : 0 }}>
          {result.radiology.confidence > 0.2
            ? `Analyzed imaging report. Modality: ${result.radiology.modality || 'unknown'}. ${result.radiology.findings?.slice(0, 120)}…`
            : 'No radiology report found in your uploaded documents for this query.'}
        </div>
        {result.radiology.differentials?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {result.radiology.differentials.slice(0, 3).map((d: any, i: number) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: t.bgCard, border: `0.5px solid ${t.border}`, color: t.textMuted }}>
                {d.diagnosis} {(d.probability * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Allergy agent */}
    {result.allergy && (
      <div style={{ padding: 14, borderRadius: 8, background: t.bgAlt, border: `0.5px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: result.allergy.confidence > 0.2 ? t.ok : t.textFaint }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Allergy Safety Agent</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted }}>{result.allergy.runtime}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.textMuted }}>{result.allergy.cost}</span>
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: t.peachSoft, color: t.peach }}>
              {(result.allergy.confidence * 100).toFixed(0)}% conf
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.55, marginBottom: result.allergy.allergies?.length > 0 ? 8 : 0 }}>
          {result.allergy.confidence > 0.2
            ? `Found ${result.allergy.allergies?.length || 0} allergies. Cross-checked with NetworkX knowledge graph for drug conflicts. ${result.allergy.summary}`
            : 'No allergy records found in your uploaded documents for this query.'}
        </div>
        {result.allergy.allergies?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {result.allergy.allergies.map((a: any, i: number) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'monospace', background: t.warnSoft, color: t.peach }}>
                {a.allergen} ({a.severity})
              </span>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Pipeline explanation */}
    <div style={{ padding: '12px 14px', borderRadius: 8, background: dark ? 'rgba(34,56,67,0.2)' : '#EDF3F6', border: `0.5px solid ${t.border}`, fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
      <strong style={{ color: t.text }}>How this works:</strong> Your question was sent to 3 specialist AI agents running in parallel. Each agent searched your uploaded documents using ChromaDB vector search, retrieved the most relevant chunks, and used GPT-4o-mini to interpret them. The Allergy agent also queried a NetworkX medical knowledge graph to check for drug cross-reactivities. Results were reconciled by the orchestrator before being filtered for your role.
    </div>
  </div>
</div>

            {/* Consult doctor CTA */}
            {reportId && consultStatus !== 'done' && (
              <div style={{ padding: '18px 20px', background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 4 }}>Would you like to consult a doctor?</div>
                  <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
                    Your assigned doctor will be notified and will review your AI results. This raises a human review request.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={async () => {
                      setConsultStatus('loading')
                      try {
                        const res = await api.post(`/query/consult-doctor/${reportId}`)
                        setConsultDoctor(res.data.doctor || null)
                        setConsultStatus('done')
                      } catch (e) {
                        setConsultStatus('done')
                      }
                    }}
                    disabled={consultStatus !== 'idle'}
                    style={{ padding: '8px 20px', background: t.peach, border: 'none', color: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600, opacity: consultStatus === 'loading' ? 0.7 : 1 }}>
                    {consultStatus === 'loading' ? 'Sending…' : '👨‍⚕️ Yes, consult doctor'}
                  </button>
                  <button
                    onClick={() => setConsultStatus('done')}
                    style={{ padding: '8px 16px', background: 'transparent', border: `0.5px solid ${t.border}`, color: t.textMuted, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {/* Consultation confirmed */}
            {consultStatus === 'done' && (
              <div style={{ padding: '16px 20px', background: t.okSoft, border: `0.5px solid ${t.ok}`, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: consultDoctor ? 12 : 0 }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: t.ok }}>Doctor consultation requested</div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Your doctor has been notified and will review your results shortly.</div>
                  </div>
                </div>
                {consultDoctor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: t.bgCard, borderRadius: 8, border: `0.5px solid ${t.border}`, marginTop: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(215,184,160,0.3)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: '#D8B4A0', flexShrink: 0 }}>
                      {consultDoctor.full_name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'DR'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{consultDoctor.full_name}</div>
                      <div style={{ fontSize: 12, color: t.textMuted }}>{consultDoctor.specialization || consultDoctor.role}</div>
                      <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>{consultDoctor.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: t.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Routed to</div>
                      <span style={{ padding: '2px 10px', background: t.peachSoft, color: t.peach, fontSize: 11, borderRadius: 99, fontFamily: 'monospace' }}>
                        {consultDoctor.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer + meta */}
            <div style={{ padding: '12px 14px', borderRadius: 8, background: dark ? 'rgba(34,56,67,0.3)' : '#DDE6EB', fontSize: 12, color: dark ? 'rgba(242,242,242,0.55)' : '#223843', lineHeight: 1.5, marginBottom: 14 }}>
              ✦ Generated by ClinicalIQ AI agents from your uploaded documents. Always consult your doctor before making medical decisions.
            </div>
            <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <span>Confidence: {(result.overall_confidence * 100).toFixed(0)}%</span>
              <span>Agents: {result.agents_used?.join(', ')}</span>
              {result.langfuse_trace_id && result.langfuse_trace_id !== 'no-trace' && (
                <span>Trace: {result.langfuse_trace_id.slice(0, 8)}…</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: t.textFaint, fontSize: 14 }}>
          Type a question above and click "Get answer" to get personalized insights from your documents.
        </div>
      )}
    </div>
  )
}