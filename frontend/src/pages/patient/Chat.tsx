// FILE: clinicaliq/frontend/src/pages/patient/Chat.tsx

import { useState, useEffect, useRef } from "react"
import Icon from "../../components/shared/Icon"
import Btn from "../../components/shared/Btn"
import api from "../../lib/axios"

interface Props { t: any; dark: boolean }

export default function PatientChatScreen({ t, dark }: Props) {
  const [contacts, setContacts]   = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [messages, setMessages]   = useState<any[]>([])
  const [message, setMessage]     = useState("")
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [search, setSearch]       = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef   = useRef<any>(null)

  const userRaw = JSON.parse(localStorage.getItem("ciq_user") || "{}")
  const user = { ...userRaw, id: userRaw.id || userRaw.user_id }

  useEffect(() => { fetchContacts() }, [])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (selected) {
      fetchMessages(selected.id)
      // Poll every 5 seconds automatically
      pollRef.current = setInterval(() => fetchMessages(selected.id), 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selected?.id])

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

  const send = async () => {
    if (!message.trim() || !selected) return
    setSending(true)
    try {
      await api.post("/chat/send", { to_user_id: selected.id, message: message.trim() })
      setMessage("")
      await fetchMessages(selected.id)
    } catch {}
    finally { setSending(false) }
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  const filtered = contacts.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.specialization?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s: string) => s === "available" ? t.ok : s === "busy" ? t.peach : t.textFaint

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: t.textFaint }}>Loading…</div>
  )

  return (
    <div style={{ maxWidth: 1100, animation: "fadeUp 0.4s ease both", display: "grid", gridTemplateColumns: "280px 1fr", gap: 14, height: "calc(100vh - 120px)" }}>

      {/* Doctor list */}
      <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", boxShadow: t.shadow, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${t.border}` }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 8 }}>Choose a doctor</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialty…"
            style={{ width: "100%", height: 32, padding: "0 10px", background: t.bgAlt, border: `0.5px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text, outline: "none" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `0.5px solid ${t.border}`, background: selected?.id === c.id ? t.peachSoft : "transparent", transition: "background 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(215,184,160,0.2)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#D8B4A0", flexShrink: 0 }}>
                  {c.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2) || "DR"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.specialization || c.role}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor(c.availability_status) }} />
                    <span style={{ fontSize: 10, color: statusColor(c.availability_status), fontFamily: "monospace", textTransform: "capitalize" }}>{c.availability_status || "available"}</span>
                    {c.role === "radiologist" && <span style={{ fontSize: 10, padding: "1px 5px", background: t.peachSoft, color: t.peach, borderRadius: 99, fontFamily: "monospace" }}>Radiologist</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ background: t.bgCard, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", boxShadow: t.shadow, display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${t.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(215,184,160,0.3)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#D8B4A0" }}>
                {selected.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{selected.full_name}</div>
                <div style={{ fontSize: 12, color: t.textMuted }}>{selected.specialization} · {selected.sub_specialization}</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(selected.availability_status) }} />
                <span style={{ fontSize: 11, color: statusColor(selected.availability_status), fontFamily: "monospace", textTransform: "capitalize" }}>{selected.availability_status || "available"}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: t.textFaint, fontSize: 13, padding: "32px 0" }}>
                  Start a conversation with {selected.full_name}
                </div>
              )}
              {messages.map((msg: any, i: number) => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 10, flexDirection: isMe ? "row-reverse" : "row" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isMe ? "rgba(215,122,97,0.2)" : "rgba(215,184,160,0.2)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, color: isMe ? t.peach : "#D8B4A0", flexShrink: 0 }}>
                      {isMe ? "Me" : selected.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ maxWidth: "65%" }}>
                      <div style={{ padding: "10px 14px", borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: isMe ? t.peach : t.bgCard2, color: isMe ? "#fff" : t.text, fontSize: 14, lineHeight: 1.55 }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginTop: 4, textAlign: isMe ? "right" : "left" }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ borderTop: `0.5px solid ${t.border}`, padding: 14, display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder={`Message ${selected.full_name}…`}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                style={{ flex: 1, minHeight: 38, maxHeight: 100, padding: "8px 12px", border: `0.5px solid ${t.border}`, borderRadius: 8, fontSize: 14, background: t.bgAlt, color: t.text, fontFamily: "DM Sans,sans-serif", resize: "none", outline: "none", lineHeight: 1.5 }} />
              <Btn t={t} primary onClick={send} disabled={sending || !message.trim()}>
                {sending
                  ? <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  : <><Icon name="send" size={13} /> Send</>}
              </Btn>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: t.textFaint, gap: 12 }}>
            <Icon name="chat" size={32} />
            <div style={{ fontSize: 14 }}>Select a doctor from the list to start chatting</div>
          </div>
        )}
      </div>
    </div>
  )
}
