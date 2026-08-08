// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/patient/Upload.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { Card, CardHeader } from '../../components/shared/Card'
import Btn from '../../components/shared/Btn'
import Icon from '../../components/shared/Icon'
import api from '../../lib/axios'

interface Props {
  t: any
  dark: boolean
  docs: any[]
  onUploaded: () => void
}

const CATEGORIES = [
  { value: 'clinician',           label: 'Lab report (CBC, LFT, KFT, Thyroid…)' },
  { value: 'radiology',           label: 'Radiology (X-Ray, CT, MRI, Ultrasound)' },
  { value: 'allergy_food',        label: 'Allergy — Food' },
  { value: 'allergy_medication',  label: 'Allergy — Medication' },
  { value: 'allergy_environment', label: 'Allergy — Environment' },
  { value: 'allergy_skin',        label: 'Allergy — Skin' },
  { value: 'patient_records',     label: 'Patient record / Discharge summary' },
]

const DOC_TYPES = [
  { value: 'lab',       label: 'Lab report' },
  { value: 'radiology', label: 'Radiology report' },
  { value: 'allergy',   label: 'Allergy report' },
  { value: 'discharge', label: 'Discharge summary' },
]

export default function UploadScreen({ t, dark, docs, onUploaded }: Props) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [category, setCategory]   = useState('clinician')
  const [docType, setDocType]     = useState('lab')
  const [deleting, setDeleting]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Upload handler ─────────────────────────────────────────
  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(ext || '')) {
      setError('Only PDF and DOCX files supported.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.')
      return
    }
    setUploading(true); setError(''); setSuccess(''); setProgress(20)
    const form = new FormData()
    form.append('file', file)
    form.append('category', category)
    form.append('doc_type', docType)
    try {
      setProgress(50)
      const res = await api.post('/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProgress(100)
      setSuccess(`✓ "${file.name}" uploaded — ${res.data.chunk_count} chunks indexed into AI memory`)
      onUploaded()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1200)
    }
  }

  // ── Delete handler ─────────────────────────────────────────
  const handleDelete = async (docId: string, filename: string) => {
    if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return
    setDeleting(docId)
    try {
      await api.delete(`/upload/documents/${docId}`)
      onUploaded()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const selectStyle = {
    width: '100%', height: 38, padding: '0 12px',
    background: t.bgAlt, border: `0.5px solid ${t.border}`,
    borderRadius: 7, fontSize: 13, color: t.text,
    fontFamily: "'DM Sans',sans-serif", outline: 'none',
  }

  return (
    <div style={{ maxWidth: 760, animation: 'fadeUp 0.4s ease both' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: t.text, marginBottom: 4 }}>
          Upload a document
        </h1>
        <div style={{ fontSize: 14, color: t.textMuted }}>
          Upload your lab report, radiology study, or allergy record. AI agents will analyze it instantly.
        </div>
      </div>

      {/* Upload card */}
      <Card t={t} style={{ marginBottom: 14 }}>
        <div style={{ padding: 20 }}>

          {/* Category + type selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 500, display: 'block', marginBottom: 5 }}>
                Document category
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 500, display: 'block', marginBottom: 5 }}>
                Document type
              </label>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={selectStyle}>
                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              padding: '52px 20px',
              border: `1.5px dashed ${dragging ? t.peach : t.border2}`,
              borderRadius: 12,
              textAlign: 'center',
              background: dragging ? t.peachSoft : t.bgAlt,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            <div style={{ color: t.textMuted, marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
              <Icon name="upload" size={36} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: t.text, marginBottom: 6 }}>
              Drag a file here, or click to choose
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>
              PDF or DOCX · up to 10MB
            </div>
            <Btn t={t} primary onClick={() => { fileRef.current?.click() }}>
              Choose file
            </Btn>
            <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          </div>

          {/* Progress */}
          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.textMuted, marginBottom: 6 }}>
                <span>Parsing → chunking → embedding → indexing…</span>
                <span style={{ fontFamily: 'monospace' }}>{progress}%</span>
              </div>
              <div style={{ height: 4, background: t.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: t.peach, borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: t.warnSoft, border: `0.5px solid ${t.peach}`, borderRadius: 8, fontSize: 13, color: t.peach }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: t.okSoft, border: `0.5px solid ${t.ok}`, borderRadius: 8, fontSize: 13, color: t.ok, lineHeight: 1.5 }}>
              {success}
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                You can now ask questions about this document.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Documents library */}
      <Card t={t}>
        <CardHeader t={t} title="Your documents" sub={`${docs.length} uploaded`} />
        {docs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: t.textFaint, fontSize: 13 }}>
            No documents yet — upload your first one above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${t.border}` }}>
                {['Filename', 'Category', 'Type', 'Chunks', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: t.textFaint, fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc: any, i: number) => (
                <tr key={doc.id} style={{ borderBottom: i < docs.length - 1 ? `0.5px solid ${t.border}` : 'none', transition: 'background 0.15s' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.text }}>
                      <Icon name="file" size={13} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {doc.filename}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ padding: '2px 8px', background: t.peachSoft, color: t.peach, fontSize: 11, borderRadius: 99, fontFamily: 'monospace' }}>
                      {doc.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: t.textMuted, fontFamily: 'monospace' }}>
                    {doc.doc_type}
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: t.textMuted, fontFamily: 'monospace' }}>
                    {doc.chunk_count}
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <Btn t={t} danger size="sm"
                      disabled={deleting === doc.id}
                      onClick={() => handleDelete(doc.id, doc.filename)}>
                      {deleting === doc.id
                        ? <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        : <Icon name="trash" size={13} />}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}