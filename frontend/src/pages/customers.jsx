import API_BASE from '../config';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

const PALETTE = [
  { bg: "#dbeafe", color: "#1e3a8a" }, { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#d1fae5", color: "#065f46" }, { bg: "#fef3c7", color: "#78350f" },
  { bg: "#ede9fe", color: "#4c1d95" }, { bg: "#ffedd5", color: "#7c2d12" },
  { bg: "#e0f2fe", color: "#0c4a6e" }, { bg: "#fae8ff", color: "#701a75" },
];
function avatarStyle(name = "") {
  const i = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[i];
}
function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, size = 36 }) {
  const { bg, color } = avatarStyle(name);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: active ? "#dcfce7" : "#f3f4f6", color: active ? "#16a34a" : "#6b7280" }}>
      {status}
    </span>
  );
}

function AddCustomerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", status: "Active" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const submit = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password.trim()) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Min 6 characters";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const res = await fetch(API_BASE + "/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password, status: form.status }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ email: data.message }); return; }
      onAdd(data.customer);
      onClose();
    } catch {
      setErrors({ email: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Customer</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color="#6b7280" /></button>
        </div>

        {[
          { label: "Full Name *", name: "name", type: "text", placeholder: "e.g. Priya Sharma" },
          { label: "Email *", name: "email", type: "email", placeholder: "e.g. priya@company.com" },
          { label: "Password *", name: "password", type: "password", placeholder: "Min 6 characters" },
        ].map(({ label, name, type, placeholder }) => (
          <div key={name} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{label}</label>
            <input type={type} name={name} value={form[name]} onChange={handle} placeholder={placeholder}
              style={{ ...inputStyle, borderColor: errors[name] ? "#ef4444" : "#d1d5db" }} />
            {errors[name] && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{errors[name]}</p>}
          </div>
        ))}

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Status</label>
          <select name="status" value={form.status} onChange={handle} style={inputStyle}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: saving ? "#a5b4fc" : "#4f46e5", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
            {saving ? "Saving..." : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ minWidth: 32, height: 32, borderRadius: 6, border: "1px solid", borderColor: active ? "#4f46e5" : "#e5e7eb", background: active ? "#4f46e5" : "#fff", color: active ? "#fff" : disabled ? "#d1d5db" : "#374151", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: active ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
  );
}

const PAGE_SIZES = [5, 10, 20];

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    Promise.all([
      fetch(API_BASE + "/api/customers").then(r => r.json()),
      fetch(API_BASE + "/api/tickets").then(r => r.json()),
    ]).then(([cData, tData]) => {
      setCustomers(cData.customers || []);
      setTickets(tData.tickets || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function ticketCount(customer) {
    return tickets.filter(t =>
      t.requesterId === String(customer.id || customer._id) ||
      t.requesterName === customer.name
    ).length;
  }

  const enriched = customers.map(c => ({ ...c, ticketCount: ticketCount(c) }));

  const filtered = enriched.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleAdd = (customer) => {
    setCustomers(prev => [customer, ...prev]);
    setPage(1);
  };

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, "...", totalPages];
    if (safePage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  };

  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Customers</h1>
        <p style={{ color: "#64748b", margin: 0 }}>{filtered.length} customers</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input type="text" placeholder="Search customers..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputStyle, paddingLeft: 32, height: 38 }} />
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            <Plus size={16} /> Add Customer
          </button>
        </div>

        {loading ? (
          <p style={{ padding: 24, color: "#6b7280" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, color: "#9ca3af", textAlign: "center" }}>No customers found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Name", "Email", "Tickets", "Status", "Joined"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c._id || c.id || c.email}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => navigate("/tickets")}
                >
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={c.name} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#6b7280", fontSize: 13 }}>{c.email || "—"}</td>
                  <td style={{ ...tdStyle, fontSize: 14, fontWeight: 500, color: "#374151" }}>{c.ticketCount}</td>
                  <td style={tdStyle}><StatusBadge status={c.status || "Active"} /></td>
                  <td style={{ ...tdStyle, color: "#9ca3af", fontSize: 13 }}>
                    {c.joined || (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}>
              Show
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px", fontSize: 13 }}>
                {PAGE_SIZES.map(n => <option key={n}>{n}</option>)}
              </select>
              per page
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={14} /></PageBtn>
              {pageNums().map((n, i) => n === "..." ? (
                <span key={`dot${i}`} style={{ padding: "0 6px", color: "#9ca3af", fontSize: 13 }}>…</span>
              ) : (
                <PageBtn key={n} onClick={() => setPage(n)} active={n === safePage}>{n}</PageBtn>
              ))}
              <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={14} /></PageBtn>
            </div>
          </div>
        )}
      </div>

      {showModal && <AddCustomerModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </main>
  );
}

const labelStyle = { display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "#374151" };
const inputStyle = { width: "100%", height: 40, boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: "0 12px", fontSize: 14, outline: "none" };
const thStyle = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" };
const tdStyle = { padding: "12px 16px" };