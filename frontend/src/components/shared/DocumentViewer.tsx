// FILE: clinicaliq/frontend/src/components/shared/DocumentViewer.tsx

import { useState, useEffect } from 'react'
import api from '../../lib/axios'

interface Props {
  doc: any
  t: any
  onClose: () => void
}

export default function DocumentViewer({ doc, t, onClose }: Props) {
  const [mode, setMode]       = useState<'preview'|'text'>('preview')
  const [content, setContent] = useState('')
  const [pdfUrl, setPdfUrl]   = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const isPdf = doc.filename?.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    loadFile()
    setMode('preview')
  }, [doc.id])

  const loadFile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('ciq_token')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/serve-pdf/${doc.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const blob = await res.blob()
        setPdfUrl(URL.createObjectURL(blob))
        setMode('preview')
      } else {
        await loadText()
      }
    } catch { await loadText() }
    finally { setLoading(false) }
  }

  const loadText = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/upload/read-document/${doc.id}`)
      setContent(res.data.content || 'No content.')
      setMode('text')
    } catch { setError('Failed to load.') }
    finally { setLoading(false) }
  }

  const downloadFile = async () => {
    const token = localStorage.getItem('ciq_token')
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/serve-pdf/${doc.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) {
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = doc.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const formatText = (text: string) => text.split('\n').map((line, i) => {
    const t2 = line.trim()
    if (!t2) return <div key={i} style={{ height: 6 }} />
    const isHeading = t2 === t2.toUpperCase() && t2.length > 3 && t2.length < 80
    const isAbnormal = /abnormal|critical|low|high|urgent|elevated|anaphylactic|severe/i.test(t2)
    const isNormal   = /normal|adequate|within range/i.test(t2)
    return (
      <div key={i} style={{
        fontSize: isHeading ? 10 : 13,
        fontFamily: isHeading ? 'monospace' : "'DM Sans',sans-serif",
        fontWeight: isHeading ? 700 : isAbnormal ? 500 : 400,
        color: isHeading ? t.peach : isAbnormal ? t.peach : isNormal ? t.ok : t.text,
        textTransform: isHeading ? 'uppercase' : 'none',
        letterSpacing: isHeading ? '0.08em' : 'normal',
        lineHeight: 1.65, marginTop: isHeading ? 14 : 0, marginBottom: isHeading ? 4 : 2,
        paddingBottom: isHeading ? 3 : 0,
        borderBottom: isHeading ? `0.5px solid ${t.border}` : 'none',
      }}>{t2}</div>
    )
  })

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }, [pdfUrl])

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24,backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background:t.bgCard,border:`0.5px solid ${t.border}`,borderRadius:12,boxShadow:t.shadowMd,width:'100%',maxWidth:860,height:'90vh',display:'flex',flexDirection:'column',overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'14px 20px',borderBottom:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:600,fontSize:14,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4 }}>{doc.filename}</div>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <span style={{ padding:'1px 8px',background:t.peachSoft,color:t.peach,fontSize:10,borderRadius:99,fontFamily:'monospace' }}>{doc.category?.toUpperCase()}</span>
              <span style={{ fontSize:11,color:t.textFaint,fontFamily:'monospace' }}>{doc.chunk_count} chunks · {new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            {/* Mode toggle */}
            {(
              <div style={{ display:'flex',background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,padding:2,gap:2 }}>
                {[{id:'preview',label:'📄 PDF'},{id:'text',label:'📝 Text'}].map(m=>(
                  <button key={m.id} onClick={()=>m.id==='preview'?loadFile():loadText()}
                    style={{ padding:'4px 10px',borderRadius:5,border:'none',fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",background:mode===m.id?t.peach:'transparent',color:mode===m.id?'#fff':t.textMuted,transition:'all 0.15s' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
            {/* Download original */}
            <button onClick={downloadFile}
              style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',background:t.bgAlt,border:`0.5px solid ${t.border}`,borderRadius:7,fontSize:12,cursor:'pointer',color:t.textMuted,fontFamily:"'DM Sans',sans-serif" }}>
              ↓ Download original
            </button>
            <button onClick={onClose}
              style={{ width:32,height:32,borderRadius:8,background:t.bgAlt,border:`0.5px solid ${t.border}`,color:t.textMuted,cursor:'pointer',fontSize:16,display:'grid',placeItems:'center' }}>
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1,overflow:'hidden',position:'relative' }}>
          {loading ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12,color:t.textFaint }}>
              <div style={{ width:28,height:28,border:`2px solid ${t.border}`,borderTopColor:t.peach,borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>
              <span style={{ fontSize:13 }}>Loading document…</span>
            </div>
          ) : error ? (
            <div style={{ padding:24 }}>
              <div style={{ padding:'14px',background:'rgba(184,91,67,0.1)',border:`0.5px solid rgba(184,91,67,0.3)`,borderRadius:8,color:t.peach,fontSize:13 }}>{error}</div>
            </div>
          ) : mode==='preview' && pdfUrl ? (
            <iframe src={pdfUrl} style={{ width:'100%',height:'100%',border:'none' }} title={doc.filename}/>
          ) : mode==='preview' && pdfUrl && !isPdf ? (
            <iframe src={pdfUrl} style={{ width:'100%',height:'100%',border:'none' }} title={doc.filename}/>
          ) : (
            <div style={{ height:'100%',overflowY:'auto',padding:'20px 28px' }}>
              <div style={{ padding:'8px 12px',background:t.bgAlt,borderRadius:7,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ color:t.peach }}>✦</span>
                <span style={{ fontSize:11,color:t.textMuted }}>Text extracted · {doc.chunk_count} indexed chunks</span>
              </div>
              {formatText(content)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'10px 20px',borderTop:`0.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:t.bgAlt }}>
          <div style={{ fontSize:11,color:t.textFaint,fontFamily:'monospace' }}>
            {isPdf && mode==='preview' ? 'Original PDF — exact format preserved' : 'Click "Download original" to view with full formatting'}
          </div>
          <button onClick={onClose}
            style={{ padding:'5px 16px',background:t.peach,color:'#fff',border:'none',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}