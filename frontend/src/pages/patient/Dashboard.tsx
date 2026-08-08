// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/pages/patient/Dashboard.tsx
// Shell only — imports screens from separate files
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokens } from '../../components/shared/tokens'
import Icon from '../../components/shared/Icon'
import UploadScreen  from './Upload'
import QueryScreen   from './Query'
import ReportsScreen from './Reports'
import ChatScreen from './Chat'
import api from '../../lib/axios'

type Screen = 'dashboard' | 'query' | 'upload' | 'routing' | 'reports' | 'chat'

export default function PatientDashboard() {
  const navigate = useNavigate()
  const [dark, setDark]     = useState(true)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [docs, setDocs]     = useState<any[]>([])

  const user      = JSON.parse(localStorage.getItem('ciq_user') || '{}')
  const firstName = user.full_name?.split(' ')[0] || 'there'
  const initials  = user.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'UK'
  const t         = tokens(dark)

  useEffect(() => { fetchDocs() }, [])

  const fetchDocs = async () => {
    try {
      const res = await api.get('/upload/documents')
      setDocs(res.data.documents || [])
    } catch {}
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const goScreen = (s: Screen) => { setScreen(s); setRefreshKey(k=>k+1) }

  const navItems = [
    { id: 'dashboard', label: 'My health',         icon: 'dashboard' },
    { id: 'query',     label: 'Ask a question',    icon: 'query'     },
    { id: 'upload',    label: 'Upload document',   icon: 'upload'    },
    { id: 'routing',   label: 'How I was matched', icon: 'routing'   },
    { id: 'reports',   label: 'My reports',        icon: 'report'    },
    { id: 'chat',      label: 'Message doctor',    icon: 'chat'      },
  ]

  const crumbs: Record<Screen, string> = {
    dashboard: 'My health summary',
    query:     'Ask a question',
    upload:    'Upload a document',
    routing:   'How I was matched',
    reports:   'My reports',
    chat:      'Message your doctor',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', height: '100vh', fontFamily: "'DM Sans',sans-serif", background: t.bg, color: t.text }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(215,122,97,0.4);border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        select,textarea,input{outline:none;}
        button{font-family:'DM Sans',sans-serif;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ background: t.sidebar, display: 'flex', flexDirection: 'column', padding: '18px 14px', gap: 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 300px at -10% -10%,rgba(215,122,97,0.08),transparent 60%)', pointerEvents: 'none' }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 18px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#D77A61,#D8B4A0)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#223843', flexShrink: 0 }}>C</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>ClinicalIQ</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>Patient workspace</div>
          </div>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.42)', padding: '6px 10px', position: 'relative', zIndex: 1 }}>
          Workspace
        </div>

        {navItems.map(item => (
          <div key={item.id} onClick={() => goScreen(item.id as Screen)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', position: 'relative', zIndex: 1, background: screen === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: screen === item.id ? '#fff' : 'rgba(255,255,255,0.74)', fontSize: 13.5, transition: 'all 0.15s' }}>
            <Icon name={item.icon} size={16} /><span>{item.label}</span>
            {item.id === 'upload' && docs.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(215,122,97,0.25)', color: '#D77A61', fontFamily: 'monospace' }}>{docs.length}</span>
            )}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <div style={{ position: 'relative', zIndex: 1, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{dark ? 'Dark' : 'Light'} mode</span>
          <button onClick={() => setDark(!dark)} style={{ width: 42, height: 24, borderRadius: 999, background: dark ? '#D77A61' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ position: 'absolute', top: 2, left: dark ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', display: 'grid', placeItems: 'center', fontSize: 10 }}>
              <Icon name={dark ? 'moon' : 'sun'} size={11} />
            </div>
          </button>
        </div>

        {/* User footer */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(215,122,97,0.3)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#D77A61', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || 'Patient'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>Patient</div>
          </div>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
            <Icon name="logout" size={14} />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ background: t.bgCard, borderBottom: `0.5px solid ${t.border}`, padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Patient / {screen}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{crumbs[screen]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ width: 36, height: 36, borderRadius: 8, background: t.bgAlt, border: `0.5px solid ${t.border}`, display: 'grid', placeItems: 'center', color: t.textMuted, cursor: 'pointer', position: 'relative' }}>
              <Icon name="bell" size={15} />
            </button>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: t.bg }}>
          {screen === 'dashboard' && <DashboardHome t={t} dark={dark} docs={docs} firstName={firstName} go={setScreen} />}
          {screen === 'query'     && <QueryScreen   t={t} dark={dark} docs={docs} go={setScreen} />}
          {screen === 'upload'    && <UploadScreen  t={t} dark={dark} docs={docs} onUploaded={fetchDocs} />}
          {screen === 'routing'   && <RoutingHome   t={t} dark={dark} />}
          {screen === 'reports'   && <ReportsScreen key={refreshKey} t={t} dark={dark} />}
          {screen === 'chat'      && <ChatScreen    t={t} dark={dark} />}
        </div>
      </div>
    </div>
  )
}

// ── Inline screens (simple ones stay in shell) ─────────────────

function DashboardHome({ t, dark, docs, firstName, go }: any) {
  return (
    <div style={{ maxWidth: 920, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', color: t.text, marginBottom: 4 }}>Hi {firstName} 👋</h1>
          <div style={{ fontSize: 14, color: t.textMuted }}>Welcome to your ClinicalIQ health dashboard.</div>
        </div>
        <button onClick={() => go('upload')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.peach}`, background: t.peach, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
          <Icon name="upload" size={14} /> Upload document
        </button>
      </div>

      {docs.length === 0 ? (
        <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow }}>
          <div style={{ padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: t.peachSoft, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: t.peach }}>
              <Icon name="upload" size={24} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 500, color: t.text, marginBottom: 10 }}>No documents yet</h2>
            <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
              Upload your first clinical document and our AI agents will analyze it for you.
            </p>
            <button onClick={() => go('upload')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.peach}`, background: t.peach, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
              <Icon name="upload" size={14} /> Upload your first document
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'Documents uploaded', val: docs.length.toString() },
              { label: 'Chunks indexed',     val: docs.reduce((s: number, d: any) => s + (d.chunk_count || 0), 0).toString() },
              { label: 'Latest upload',      val: docs[0] ? new Date(docs[0].created_at).toLocaleDateString() : '—' },
            ].map(s => (
              <div key={s.label} style={{ padding: '20px', borderRadius: 10, background: t.bgCard, border: `0.5px solid ${t.border}`, boxShadow: t.shadow }}>
                <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: t.peach, fontFamily: 'monospace' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Recent docs */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Recent documents</div>
              <button onClick={() => go('query')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.border}`, background: t.bgCard, color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
                <Icon name="sparkle" size={13} /> Ask a question
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {docs.slice(0, 5).map((doc: any, i: number) => (
                  <tr key={doc.id} style={{ borderBottom: i < Math.min(docs.length, 5) - 1 ? `0.5px solid ${t.border}` : 'none' }}>
                    <td style={{ padding: '10px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.text }}>
                        <Icon name="file" size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{doc.filename}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 20px' }}>
                      <span style={{ padding: '2px 8px', background: t.peachSoft, color: t.peach, fontSize: 11, borderRadius: 99, fontFamily: 'monospace' }}>{doc.category}</span>
                    </td>
                    <td style={{ padding: '10px 20px', fontSize: 11, color: t.textFaint, fontFamily: 'monospace' }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: t.shadow }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: t.text, marginBottom: 4 }}>Ready to analyze your documents?</div>
              <div style={{ fontSize: 13, color: t.textMuted }}>Our AI agents will search your files and give you personalized health insights.</div>
            </div>
            <button onClick={() => go('query')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.peach}`, background: t.peach, color: '#fff', fontFamily: "'DM Sans',sans-serif", flexShrink: 0, marginLeft: 20 }}>
              <Icon name="sparkle" size={14} /> Ask a question
            </button>
          </div>

          {/* Message doctor CTA */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: t.shadow }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: t.text, marginBottom: 4 }}>Have questions for your doctor?</div>
              <div style={{ fontSize: 13, color: t.textMuted }}>Message your assigned doctor directly — they usually reply within a few hours.</div>
            </div>
            <button onClick={() => go('chat')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.border}`, background: t.bgCard, color: t.text, fontFamily: "'DM Sans',sans-serif", flexShrink: 0, marginLeft: 20 }}>
              <Icon name="chat" size={14} /> Message doctor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoutingHome({ t, dark }: any) {
  const [assignment, setAssignment] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/routing/my-assignments')
      .then(res => {
        const allAssignments = res.data.assignments || []
        setAssignment(allAssignments[0] || null)
        setAssignments(allAssignments)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const candidates = assignment?.candidates || []

  return (
    <div style={{ maxWidth: 920, animation: "fadeUp 0.4s ease both" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: t.text, marginBottom: 4 }}>How I was matched</h1>
        <div style={{ fontSize: 14, color: t.textMuted }}>ClinicalIQ's routing engine automatically assigned the best available doctor for your condition.</div>
      </div>

      {loading ? (
        <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: "32px 20px", textAlign: "center", color: t.textFaint }}>Loading…</div>
      ) : !assignment ? (
        <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: "48px 40px", textAlign: "center", boxShadow: t.shadow }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: t.peachSoft, display: "grid", placeItems: "center", margin: "0 auto 20px", color: t.peach }}>
            <Icon name="routing" size={24} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 500, color: t.text, marginBottom: 10 }}>No assignment yet</h2>
          <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6 }}>Upload a document and ask a question — the routing engine will automatically assign you a doctor.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Assignment summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              { label: "Classified as",  val: assignment.specialty || "—" },
              { label: "Confidence",     val: assignment.confidence ? `${(assignment.confidence * 100).toFixed(0)}%` : "—" },
              { label: "Urgency",        val: assignment.urgency || "routine" },
              { label: "Assigned to",    val: assignment.doctor?.full_name || "—" },
            ].map(s => (
              <div key={s.label} style={{ padding: "16px 20px", borderRadius: 10, background: t.bgCard, border: `0.5px solid ${t.border}`, boxShadow: t.shadow }}>
                <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.peach, fontFamily: "monospace" }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* All specialty assignments */}
          {assignments.length > 1 && (
            <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${t.border}` }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Your assigned doctors by specialty</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>{assignments.length} specialists assigned</div>
              </div>
              <div>
                {assignments.map((a: any, i: number) => (
                  <div key={a.id} style={{ padding: "14px 20px", borderBottom: i < assignments.length - 1 ? `0.5px solid ${t.border}` : "none", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(215,184,160,0.2)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#D8B4A0", flexShrink: 0 }}>
                      {a.doctor?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2) || "DR"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{a.doctor?.full_name}</div>
                      <div style={{ fontSize: 12, color: t.textMuted }}>{a.doctor?.specialization}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ padding: "3px 10px", background: t.peachSoft, color: t.peach, fontSize: 11, borderRadius: 99, fontFamily: "monospace" }}>{a.specialty}</span>
                      <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginTop: 4 }}>Score: {a.score ? `${(a.score * 100).toFixed(0)}%` : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How routing works */}
          <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${t.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>How the routing engine works</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>5 factors scored in real-time</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                {[
                  { factor: "Specialty match", desc: "Does the doctor specialize in your condition?", weight: "40%" },
                  { factor: "Availability",    desc: "Is the doctor available right now?",           weight: "30%" },
                  { factor: "Patient load",    desc: "How many patients is the doctor managing?",    weight: "20%" },
                  { factor: "Urgency",         desc: "Is your case routine or urgent?",              weight: "10%" },
                  { factor: "Sub-specialty",   desc: "Exact sub-specialty match bonus",              weight: "+5%" },
                ].map(f => (
                  <div key={f.factor} style={{ padding: 14, borderRadius: 8, background: t.bgAlt, border: `0.5px solid ${t.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.text, marginBottom: 4 }}>{f.factor}</div>
                    <div style={{ fontSize: 10, color: t.textMuted, lineHeight: 1.4, marginBottom: 6 }}>{f.desc}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.peach, fontFamily: "monospace" }}>{f.weight}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned doctor */}
          {assignment.doctor && (
            <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow }}>
              <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${t.border}` }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Your assigned doctor</div>
              </div>
              <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(215,184,160,0.3)", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, color: "#D8B4A0", flexShrink: 0 }}>
                  {assignment.doctor.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: t.text, marginBottom: 4 }}>{assignment.doctor.full_name}</div>
                  <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 4 }}>{assignment.doctor.specialization}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.ok }} />
                    <span style={{ fontSize: 11, color: t.ok, fontFamily: "monospace" }}>Available</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginBottom: 4 }}>Match score</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: t.peach, fontFamily: "monospace" }}>{assignment.score ? `${(assignment.score * 100).toFixed(0)}%` : "—"}</div>
                </div>
              </div>
            </div>
          )}

          {/* All candidates scored */}
          {candidates.length > 0 && (
            <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${t.border}` }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>All doctors evaluated</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>{candidates.length} doctors scored · highest score wins</div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${t.border}` }}>
                    {["Doctor", "Specialty", "Status", "Score", "Decision"].map(h => (
                      <th key={h} style={{ padding: "8px 20px", textAlign: "left", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", color: t.textFaint, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.sort((a: any, b: any) => b.score - a.score).map((c: any, i: number) => (
                    <tr key={i} style={{ borderBottom: i < candidates.length - 1 ? `0.5px solid ${t.border}` : "none", background: c.doctor_id === assignment.doctor_id ? t.okSoft : "transparent" }}>
                      <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: c.doctor_id === assignment.doctor_id ? 600 : 400, color: t.text }}>{c.doctor_name}</td>
                      <td style={{ padding: "10px 20px", fontSize: 12, color: t.textMuted }}>{c.specialty}</td>
                      <td style={{ padding: "10px 20px" }}>
                        <span style={{ padding: "2px 8px", fontSize: 11, borderRadius: 99, fontFamily: "monospace", background: c.status === "available" ? t.okSoft : t.warnSoft, color: c.status === "available" ? t.ok : t.peach, textTransform: "capitalize" }}>{c.status}</span>
                      </td>
                      <td style={{ padding: "10px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: t.border, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${c.score * 100}%`, height: "100%", background: c.doctor_id === assignment.doctor_id ? t.ok : t.peach, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 12, fontFamily: "monospace", color: t.text }}>{(c.score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 20px" }}>
                        {c.doctor_id === assignment.doctor_id
                          ? <span style={{ padding: "2px 8px", fontSize: 11, borderRadius: 99, background: t.okSoft, color: t.ok, fontFamily: "monospace" }}>★ Assigned</span>
                          : <span style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "12px 20px", background: dark ? "rgba(34,56,67,0.3)" : "#EDF3F6", fontSize: 13, color: dark ? "rgba(242,242,242,0.7)" : "#223843", lineHeight: 1.5 }}>
                <strong>Why {assignment.doctor?.full_name}:</strong> Highest composite score based on specialty match ({assignment.specialty}), availability, and current patient load.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChatHome({ t, dark }: any) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { from: 'doctor', text: "Hi! I'm Dr. Mehta. I can see your uploaded documents and query results. How can I help you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ])

  const send = () => {
    if (!message.trim()) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { from: 'patient', text: message, time }])
    setMessage('')
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'doctor', text: "Thank you for your message. I'll review your results and get back to you shortly.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    }, 1200)
  }

  return (
    <div style={{ maxWidth: 720, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: t.text, marginBottom: 4 }}>Message your doctor</h1>
        <div style={{ fontSize: 14, color: t.textMuted }}>Chatting with Dr. Aarav Mehta · Internal Medicine</div>
      </div>
      <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(215,184,160,0.3)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#D8B4A0' }}>AM</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13.5, color: t.text }}>Dr. Aarav Mehta</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Internal Medicine · Hematology</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.ok }} />
            <span style={{ fontSize: 11, color: t.ok, fontFamily: 'monospace' }}>Online</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexDirection: msg.from === 'patient' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.from === 'patient' ? 'rgba(215,122,97,0.25)' : 'rgba(215,184,160,0.25)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: msg.from === 'patient' ? t.peach : '#D8B4A0', flexShrink: 0 }}>
                {msg.from === 'patient' ? 'Me' : 'AM'}
              </div>
              <div style={{ maxWidth: '70%' }}>
                <div style={{ padding: '10px 14px', borderRadius: msg.from === 'patient' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: msg.from === 'patient' ? t.peach : t.bgCard2, color: msg.from === 'patient' ? '#fff' : t.text, fontSize: 14, lineHeight: 1.55 }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 11, color: t.textFaint, fontFamily: 'monospace', marginTop: 4, textAlign: msg.from === 'patient' ? 'right' : 'left' }}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `0.5px solid ${t.border}`, padding: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Type your message…" onKeyDown={e => e.key === 'Enter' && send()}
            style={{ flex: 1, height: 38, border: `0.5px solid ${t.border}`, borderRadius: 8, padding: '0 12px', fontSize: 14, background: t.bgAlt, color: t.text }} />
          <button onClick={send} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${t.peach}`, background: t.peach, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
            <Icon name="send" size={13} /> Send
          </button>
        </div>
      </div>
    </div>
  )
}