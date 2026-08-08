// FILE: clinicaliq/frontend/src/pages/doctor/Chat.tsx

import { useState, useEffect, useRef } from "react"
import Icon from "../../components/shared/Icon"
import Btn from "../../components/shared/Btn"
import api from "../../lib/axios"

interface Props { t: any; dark: boolean; selectedPatient: any }

export default function DoctorChatScreen({ t, dark, selectedPatient }: Props) {
  const [contacts, setContacts]       = useState<any[]>([])
  const [activePatient, setActivePatient] = useState<any>(selectedPatient || null)
  const [messages, setMessages]       = useState<any[]>([])
  const [message, setMessage]         = useState("")
  const [loading, setLoading]         = useState(true)
  const [sending, setSending]         = useState(false)
  const [showAI, setShowAI]           = useState(true)
  const [search, setSearch]           = useState("")
  const [patientDocs, setPatientDocs] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<string>("")
  const [generating, setGenerating]   = useState(false)
  const [generated, setGenerated]     = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef   = useRef<any>(null)

  const userRaw = JSON.parse(localStorage.getItem("ciq_user") || "{}")
  const user = { ...userRaw, id: userRaw.id || userRaw.user_id }

  useEffect(() => { fetchContacts() }, [])

  useEffect(() => {
    if (selectedPatient && !activePatient) {
      setActivePatient(selectedPatient)
    }
  }, [selectedPatient])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (activePatient) {
      fetchMessages(activePatient.id)
      fetchPatientDocs(activePatient.id)
      pollRef.current = setInterval(() => fetchMessages(activePatient.id), 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activePatient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchContacts = async () => {
    try {
      const res = await api.get("/chat/contacts")
      setContacts(res.data.contacts || [])
    } catch {}
    finally { setLoading(false) }
  }

  const fetchMessages = async (otherId: string) => {
    try {
      const res = await api.get(`/chat/messages/${otherId}`)
      setMessages(res.data.messages || [])
    } catch {}
  }

  const fetchPatientDocs = async (patientId: string) => {
    try {
      const res = await api.get(`/upload/patient-documents/${patientId}`)
      setPatientDocs(res.data.documents || [])
      setSelectedDoc("")
      setGenerated("")
    } catch {}
  }

  const send = async () => {
    if (!message.trim() || !activePatient) return
    setSending(true)
    try {
      await api.post("/chat/send", { to_user_id: activePatient.id, message: message.trim() })
      setMessage("")
      setGenerated("")
      await fetchMessages(activePatient.id)
    } catch {}
    finally { setSending(false) }
  }

  const generate = async () => {
    if (!activePatient) return
    setGenerating(true)
    setGenerated("")
    try {
      const res = await api.post("/chat/generate-message", {
        patient_id: activePatient.id,
        report_id: selectedDoc || undefined,
      })
      setGenerated(res.data.message)
    } catch {
      setGenerated("Unable to generate. Please type manually.")
    } finally { setGenerating(false) }
  }

  const useGenerated = () => {
    setMessage(generated)
    setGenerated("")
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  const filtered = contacts.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: t.textFaint }}>Loading…</div>
  )

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0, height: "calc(100vh - 54px)", overflow: "hidden" }}>

      {/* Patient list */}
      <div style={{ background: t.bgCard, borderRight: `0.5px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${t.border}`, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 8 }}>Patients</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patients…"
            style={{ width: "100%", height: 32, padding: "0 10px", background: t.bgAlt, border: `0.5px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }} />
          <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginTop: 6 }}>{contacts.length} patients</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: t.textFaint, fontSize: 13 }}>No patients found</div>
          ) : filtered.map(c => (
            <div key={c.id} onClick={() => setActivePatient(c)}
              style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `0.5px solid ${t.border}`, background: activePatient?.id === c.id ? t.peachSoft : "transparent", transition: "background 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(215,122,97,0.2)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: t.peach, flexShrink: 0 }}>
                  {c.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2) || "PT"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name || "Patient"}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                </div>
                {activePatient?.id === c.id && <Icon name="check" size={13} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: t.bg }}>
        {activePatient ? (
          <>
            {/* Chat header */}
            <div style={{ padding: "12px 20px", borderBottom: `0.5px solid ${t.border}`, background: t.bgCard, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(215,122,97,0.2)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: t.peach }}>
                  {activePatient.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2) || "PT"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{activePatient.full_name || "Patient"}</div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>{activePatient.email}</div>
                </div>
              </div>
              <button onClick={() => setShowAI(!showAI)}
                style={{ padding: "5px 12px", background: showAI ? t.peachSoft : t.bgAlt, border: `0.5px solid ${showAI ? t.peach : t.border}`, color: showAI ? t.peach : t.textMuted, borderRadius: 7, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="sparkle" size={12} /> AI assist {showAI ? "ON" : "OFF"}
              </button>
            </div>

            {/* AI Generate panel */}
            {showAI && (
              <div style={{ padding: "14px 20px", background: dark ? "rgba(13,31,40,0.6)" : "#EDF3F6", borderBottom: `0.5px solid ${t.border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: generated ? 12 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="sparkle" size={13} />
                    <span style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", color: t.peach }}>AI message generator</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Document selector */}
                    <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}
                      style={{ height: 30, padding: "0 8px", background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 6, fontSize: 11, color: t.text, maxWidth: 220, fontFamily: "'DM Sans',sans-serif" }}>
                      <option value="">Based on latest report</option>
                      {patientDocs.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.filename?.slice(0, 35)}{doc.filename?.length > 35 ? '…' : ''} ({doc.category})
                        </option>
                      ))}
                    </select>
                    <button onClick={generate} disabled={generating}
                      style={{ padding: "5px 14px", background: t.peach, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: generating ? "not-allowed" : "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, opacity: generating ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
                      {generating
                        ? <><div style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Generating…</>
                        : <><Icon name="sparkle" size={12} /> Generate</>}
                    </button>
                  </div>
                </div>

                {/* Generated message preview */}
                {generated && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ padding: "12px 14px", background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 8, fontSize: 13, color: t.text, lineHeight: 1.65, whiteSpace: "pre-wrap", marginBottom: 8, maxHeight: 160, overflowY: "auto" }}>
                      {generated}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={useGenerated}
                        style={{ padding: "5px 14px", background: t.ok, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>
                        ✓ Use this message
                      </button>
                      <button onClick={generate}
                        style={{ padding: "5px 12px", background: "transparent", color: t.textMuted, border: `0.5px solid ${t.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        ↺ Regenerate
                      </button>
                      <button onClick={() => setGenerated("")}
                        style={{ padding: "5px 12px", background: "transparent", color: t.textMuted, border: `0.5px solid ${t.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        ✕ Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Patient docs list */}
                {patientDocs.length > 0 && !generated && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: t.textFaint, alignSelf: "center" }}>Patient docs:</span>
                    {patientDocs.map((doc: any) => (
                      <span key={doc.id} onClick={() => setSelectedDoc(doc.id)}
                        style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontFamily: "monospace", cursor: "pointer", background: selectedDoc === doc.id ? t.peach : t.bgCard, color: selectedDoc === doc.id ? "#fff" : t.textMuted, border: `0.5px solid ${selectedDoc === doc.id ? t.peach : t.border}`, transition: "all 0.15s" }}>
                        {doc.filename?.split('.')[0].slice(0, 20)} · {doc.category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: t.textFaint, fontSize: 13, padding: "32px 0" }}>
                  No messages yet with {activePatient.full_name}. Use AI to generate a message based on their documents.
                </div>
              )}
              {messages.map((msg: any, i: number) => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 10, flexDirection: isMe ? "row-reverse" : "row" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isMe ? "rgba(215,184,160,0.3)" : "rgba(215,122,97,0.2)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, color: isMe ? "#D8B4A0" : t.peach, flexShrink: 0 }}>
                      {isMe ? "Dr" : activePatient.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2) || "PT"}
                    </div>
                    <div style={{ maxWidth: "65%" }}>
                      <div style={{ padding: "10px 14px", borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: isMe ? t.peach : t.bgCard, color: isMe ? "#fff" : t.text, fontSize: 14, lineHeight: 1.55, boxShadow: t.shadow }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginTop: 4, textAlign: isMe ? "right" : "left" }}>
                        {isMe ? "Dr. " + user.full_name?.split(' ').slice(-1)[0] : activePatient.full_name?.split(' ')[0]} · {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: `0.5px solid ${t.border}`, padding: 14, display: "flex", gap: 8, alignItems: "flex-end", background: t.bgCard, flexShrink: 0 }}>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder={`Message ${activePatient.full_name}…`}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{ flex: 1, minHeight: 38, maxHeight: 120, padding: "8px 12px", border: `0.5px solid ${t.border}`, borderRadius: 8, fontSize: 14, background: t.bgAlt, color: t.text, fontFamily: "'DM Sans',sans-serif", resize: "none", outline: "none", lineHeight: 1.5 }} />
              <button onClick={send} disabled={sending || !message.trim()}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: sending || !message.trim() ? "not-allowed" : "pointer", border: `0.5px solid ${t.peach}`, background: t.peach, color: "#fff", opacity: !message.trim() ? 0.5 : 1, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
                {sending
                  ? <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  : <><Icon name="send" size={13} /> Send</>}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: t.textFaint, gap: 12 }}>
            <Icon name="chat" size={32} />
            <div style={{ fontSize: 14 }}>Select a patient from the list to start chatting</div>
          </div>
        )}
      </div>
    </div>
  )
}