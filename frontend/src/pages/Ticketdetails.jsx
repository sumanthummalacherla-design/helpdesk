import API_BASE from '../config';
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Paperclip } from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("reply");
  const [reply, setReply] = useState("");
  const [updating, setUpdating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tickets/${id}`);
        if (!response.ok) throw new Error("Ticket not found");
        const data = await response.json();
        setTicket(data.ticket);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tickets/${id}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch { }
    };
    fetchMessages();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: user?.displayName || "Agent",
          senderId: user?.id,
          type: activeTab,
          body: reply.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
        setReply("");
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(newStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="ticket-detail-loading">Loading...</div>;
  if (error) return <div className="ticket-detail-error">Error: {error}</div>;
  if (!ticket) return <div className="ticket-detail-error">Ticket not found.</div>;

  const CATEGORY_COLORS = { Billing: "#CCD0FF", Bug: "#FFCCCC", "Tech Issue": "#F0D2FF", Request: "#FFE8CC", Question: "#E9E9E9" };
  const CATEGORY_COLORS1 = { Billing: "#4756FE", Bug: "#ef4444", "Tech Issue": "#a78bfa", Request: "#FF8C00", Question: "#6b7280" };
  const STATUS_COLORS = { Open: "#FFCCCC", "In Progress": "#FFE8CC", Resolved: "#DDFFEE", Closed: "#E9E9E9" };
  const STATUS_COLORS1 = { Open: "#F20000", "In Progress": "#FF8C00", Resolved: "#00B347", Closed: "#6b7280" };
  const PRIORITY_COLORS = { Critical: "#FFCCCC", High: "#FFCB8C", Medium: "#FFE5C6", Low: "#CCFFE0" };
  const PRIORITY_COLORS1 = { Critical: "#ef4444", High: "#FF8C00", Medium: "#fb923c", Low: "#34d399" };

  const BOX_SHADOW = "0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.2)";

  const initials = (name) =>
    (name || "?").split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

  return (
    <div className="ticket-detail-page" style={{ overflow:"hidden",height: "100%", backgroundColor: "#e5e7eb" }}>
      <div style={{ padding: 24, maxWidth: "100%", boxSizing: "border-box" }}>

<div style={{display:"flex",flexDirection:"row",marginBottom:0}}>
        <button onClick={() => navigate("/tickets")} className="back-btn" style={{ alignSelf: "flex-start" }}>
          ← Back to Tickets
        </button>
        </div>

        <div className="ticket-detail-header">
          <h2 style={{ marginBottom: 0 }}>{ticket.id} — {ticket.subject}</h2>
        </div>

        <div className="ticket-details-yal">
          <span style={{ backgroundColor: STATUS_COLORS[ticket.status], color: STATUS_COLORS1[ticket.status], padding: "5px 10px", borderRadius: 7 }}>
            {ticket.status}
          </span>
          <span style={{ backgroundColor: PRIORITY_COLORS[ticket.priority], color: PRIORITY_COLORS1[ticket.priority], padding: "5px 10px", borderRadius: 7 }}>
            {ticket.priority}
          </span>
          <span style={{ backgroundColor: CATEGORY_COLORS[ticket.category], color: CATEGORY_COLORS1[ticket.category], padding: "5px 10px", borderRadius: 7 }}>
            {ticket.category}
          </span>
        </div>

        {/* 3-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 260px", gap: 16, alignItems: "start", marginTop: 16, width: "100%", boxSizing: "border-box" }}>

          {/* COL 1 — Description + Reply box */}
          <div className="ticket-detail-lay">
            <div className="ticket-detail-main" style={{ boxShadow: BOX_SHADOW, textAlign: "left" }}>
              <h4 style={{ textAlign: "left" }}>Description</h4>
              <p style={{ textAlign: "left" }}>{ticket.description}</p>
              {ticket.attachmentUrl && (
                <div className="ticket-detail-attachment" style={{ textAlign: "left" }}>
                  <h4 style={{ textAlign: "left" }}>Attachment</h4>
                  {isImage(ticket.attachmentUrl) ? (
                    <img src={ticket.attachmentUrl} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8, marginTop: 8 }} />
                  ) : (
                    <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer">View Attachment</a>
                  )}
                </div>
              )}
            </div>

            {/* Reply box */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginTop: 16, boxShadow: BOX_SHADOW }}>
              <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
                {["reply", "note"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "12px 16px", border: "none",
                      borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                      background: "none", cursor: "pointer", fontSize: 14,
                      fontWeight: activeTab === tab ? 600 : 400,
                      color: activeTab === tab ? "#3b82f6" : "#6b7280",
                      marginBottom: -1,
                    }}
                  >
                    {tab === "reply" ? "Reply" : "Internal Note"}
                  </button>
                ))}
              </div>
              <div style={{ padding: 16 }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={activeTab === "reply" ? "Type your reply..." : "Add an internal note..."}
                  style={{
                    width: "100%", minHeight: 100, border: "1px solid #e5e7eb",
                    borderRadius: 8, padding: "10px 12px", fontSize: 14,
                    color: "#374151", resize: "vertical", outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box", background: "#fff",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
                    <Paperclip size={15} color="#6b7280" /> Attach
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    style={{
                      padding: "9px 24px", borderRadius: 999, border: "none",
                      background: sending || !reply.trim() ? "#93c5fd" : "#3b82f6",
                      color: "#fff", cursor: sending || !reply.trim() ? "not-allowed" : "pointer",
                      fontSize: 13, fontWeight: 600,
                    }}
                  >
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COL 2 — Ticket details + actions */}
          <div className="ticket-detail-sidebar" style={{ height: "497px", boxShadow: BOX_SHADOW, alignItems: "flex-start", textAlign: "left" }}>
            <h4 style={{ marginBottom: 0, textAlign: "left" }}>Ticket Details</h4>
            <div className="detail-field">
              <span className="detail-label">Requester</span>
              <span className="detail-value">{ticket.requesterName || ticket.user?.displayName || user?.displayName}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Assignee</span>
              <span className="detail-value">{ticket.assignee || "Unassigned"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Priority</span>
              <span style={{ backgroundColor: PRIORITY_COLORS[ticket.priority], color: PRIORITY_COLORS1[ticket.priority], display: "inline-block", padding: "2px 10px", borderRadius: 5, width: "fit-content", alignSelf: "flex-start" }}>
                {ticket.priority}
              </span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Created</span>
              <span className="detail-value">{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Updated</span>
              <span className="detail-value">{new Date(ticket.updatedAt).toLocaleString()}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {ticket.status === "Open" && (
                <button onClick={() => updateStatus("In Progress")} disabled={updating}
                  style={{ backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: 5, cursor: updating ? "not-allowed" : "pointer", padding: "8px 5px", width: "100%", fontWeight: 600 }}>
                  {updating ? "Updating..." : "🔄 Set to In Progress"}
                </button>
              )}
              {ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                <button onClick={() => updateStatus("Resolved")} disabled={updating}
                  style={{ backgroundColor: "#3c7a19", color: "#fff", border: "none", borderRadius: 5, cursor: updating ? "not-allowed" : "pointer", padding: "8px 5px", width: "100%", fontWeight: 600 }}>
                  {updating ? "Updating..." : "✓ Mark as Resolved"}
                </button>
              )}
              {ticket.status !== "Closed" && (
                <button onClick={() => updateStatus("Closed")} disabled={updating}
                  style={{ backgroundColor: "transparent", color: "#0e0e10", border: "2px solid #ececec", borderRadius: 5, cursor: updating ? "not-allowed" : "pointer", padding: "8px 5px", width: "100%" }}>
                  {updating ? "Updating..." : "✕ Close Ticket"}
                </button>
              )}
              {(ticket.status === "Resolved" || ticket.status === "Closed") && (
                <button onClick={() => updateStatus("Open")} disabled={updating}
                  style={{ backgroundColor: "transparent", color: "#0e0e10", border: "2px solid #ececec", borderRadius: 5, cursor: updating ? "not-allowed" : "pointer", padding: "8px 5px", width: "100%" }}>
                  {updating ? "Updating..." : "↺ Reopen Ticket"}
                </button>
              )}
            </div>
          </div>

          {/* COL 3 — Conversation history */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", minWidth: 0, boxShadow: BOX_SHADOW }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>Conversation</h4>
              <span style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6", borderRadius: 20, padding: "2px 8px" }}>
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </span>
            </div>

            <div style={{ height: "447px", overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>
                  No messages yet.<br />Send a reply to start the conversation.
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{
                    background: msg.type === "note" ? "#fffbeb" : "#f8fafc",
                    border: `1px solid ${msg.type === "note" ? "#fde68a" : "#e5e7eb"}`,
                    borderRadius: 10, padding: "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{
                        background: msg.type === "note" ? "#fef3c7" : "rgba(59,130,246,0.15)",
                        color: msg.type === "note" ? "#92400e" : "#3f89ff",
                        borderRadius: "50%", width: 26, height: 26, flexShrink: 0,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {initials(msg.senderName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 12, color: "#374151" }}>{msg.senderName}</span>
                          {msg.type === "note" && (
                            <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>NOTE</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(msg.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{msg.body}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}