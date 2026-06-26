import API_BASE from '../config';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  Ticket,
  TicketPlus,
  CircleFadingArrowUp,
  CircleCheckBig,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AVATAR_PALETTE = [
  { bg: "#dbeafe", color: "#1e3a8a" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#d1fae5", color: "#065f46" },
  { bg: "#fef3c7", color: "#78350f" },
  { bg: "#ede9fe", color: "#4c1d95" },
  { bg: "#ffedd5", color: "#7c2d12" },
  { bg: "#e0f2fe", color: "#0c4a6e" },
  { bg: "#fae8ff", color: "#701a75" },
];

function getAvatarStyle(name = "") {
  const i = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[i];
}

function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function buildTopCustomers(tickets, customers) {
  const map = {};
  customers.forEach(c => { map[c.name] = { name: c.name, count: 0 }; });
  tickets.forEach(t => {
    const name = t.requesterName?.trim();
    if (!name) return;
    if (!map[name]) map[name] = { name, count: 0 };
    map[name].count++;
  });
  return Object.values(map)
    .filter(c => c.name)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function StatusBadge({ status }) {
  const styles = {
    Open: { bg: "#dbeafe", color: "#1e40af", dot: "#2563eb" },
    "In Progress": { bg: "#fef9c3", color: "#854d0e", dot: "#ca8a04" },
    Resolved: { bg: "#dcfce7", color: "#166534", dot: "#16a34a" },
    Closed: { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" },
  };
  const s = styles[status] || styles.Closed;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: s.color, backgroundColor: s.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

function DonutChart({ data, total }) {
  const SIZE = 130, R = 48, CX = SIZE / 2, CY = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP = 3;
  let offset = 0;
  const slices = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const fraction = total > 0 ? d.count / total : 0;
      const dash = fraction * CIRCUMFERENCE - GAP;
      const gap = CIRCUMFERENCE - dash;
      const slice = { ...d, dash, gap, offset };
      offset += fraction * CIRCUMFERENCE;
      return slice;
    });
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {total === 0 ? (
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e5e7eb" strokeWidth={18} />
      ) : (
        slices.map((s) => (
          <circle key={s.label} cx={CX} cy={CY} r={R} fill="none" stroke={s.color}
            strokeWidth={18} strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset} transform={`rotate(-90 ${CX} ${CY})`} />
        ))
      )}
    </svg>
  );
}

function StatCard({ label, value, delta, deltaUp, icon, iconBg, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
      <div style={{ background: iconBg, padding: 10, borderRadius: 10 }}>{icon}</div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: "#111" }}>{value}</div>
        <div style={{ fontSize: 12, color: deltaUp ? "#16a34a" : "#dc2626" }}>
          {deltaUp ? "↑" : "↓"} {delta} vs last week
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const topCustomers = buildTopCustomers(tickets, customers);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(API_BASE + "/api/tickets").then(r => r.json()),
      fetch(API_BASE + "/api/customers").then(r => r.json()),
    ]).then(([tData, cData]) => {
      setTickets(tData.tickets || []);
      setCustomers(cData.customers || []);
    }).catch(console.error);
  }, [user]);

  const statusCounts = {
    Open: tickets.filter((t) => t.status === "Open").length,
    "In Progress": tickets.filter((t) => t.status === "In Progress").length,
    Resolved: tickets.filter((t) => t.status === "Resolved").length,
    Closed: tickets.filter((t) => t.status === "Closed").length,
  };

  const priorityData = [
    { label: "Critical", count: tickets.filter((t) => t.priority === "Critical").length, color: "#E24B4A" },
    { label: "High",     count: tickets.filter((t) => t.priority === "High").length,     color: "#EF9F27" },
    { label: "Medium",   count: tickets.filter((t) => t.priority === "Medium").length,   color: "#FAC775" },
    { label: "Low",      count: tickets.filter((t) => t.priority === "Low").length,      color: "#1D9E75" },
  ];

  const trendData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const created  = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const resolved = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    tickets.forEach((t) => {
      if (t.createdAt) created[days[new Date(t.createdAt).getDay()]]++;
      if (t.status === "Resolved" && t.updatedAt) resolved[days[new Date(t.updatedAt).getDay()]]++;
    });
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day, value: created[day], resolved: resolved[day],
    }));
  })();

  return (
    <main style={{ backgroundColor: "#f0f0f0", padding: "10px", minHeight: "100vh" }}>
      <style>{`
        .dash-stat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .dash-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        .dash-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        @media (max-width: 1200px) {
          .dash-stat-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1024px) {
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-chart-grid { grid-template-columns: 1fr; }
          .dash-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .dash-stat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 12, textAlign: "left" }}>
        Dashboard
      </div>

      {/* Stat cards */}
      <div className="dash-stat-grid">
        <StatCard label="Total Tickets"  value={tickets.length}             delta="12%" deltaUp      icon={<Ticket size={26} color="#4f46e5" />}               iconBg="#ede9fe" onClick={() => navigate("/tickets")} />
        <StatCard label="Open Tickets"   value={statusCounts.Open}           delta="8%"  deltaUp      icon={<TicketPlus size={26} color="#00BF60" />}            iconBg="#dcfce7" onClick={() => navigate("/tickets?status=Open")} />
        <StatCard label="In Progress"    value={statusCounts["In Progress"]} delta="4%"  deltaUp={false} icon={<CircleFadingArrowUp size={26} color="#FFBC4D" />} iconBg="#fef3c7" onClick={() => navigate("/tickets?status=In Progress")} />
        <StatCard label="Resolved"       value={statusCounts.Resolved}       delta="10%" deltaUp      icon={<CircleCheckBig size={26} color="#D94DFF" />}        iconBg="#fae8ff" onClick={() => navigate("/tickets?status=Resolved")} />
        <StatCard label="Closed"         value={statusCounts.Closed}         delta="5%"  deltaUp      icon={<XCircle size={26} color="#6b7280" />}               iconBg="#f3f4f6" onClick={() => navigate("/tickets?status=Closed")} />
      </div>

      {/* Charts row */}
      <div className="dash-chart-grid">
        {/* Ticket Trend */}
        <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Ticket Trend</span>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6b7280" }}>
              <span><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#378ADD", display: "inline-block", marginRight: 5 }} />Created</span>
              <span><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", display: "inline-block", marginRight: 5 }} />Resolved</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line dataKey="value"    stroke="#378ADD" strokeWidth={2} dot={{ r: 3 }} />
              <Line dataKey="resolved" stroke="#1D9E75" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Priority */}
        <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: "1rem" }}>Tickets by Priority</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
              <DonutChart data={priorityData} total={tickets.length} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>{tickets.length}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Total</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              {priorityData.map((p) => (
                <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    {p.label}
                  </span>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginRight: 100 }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-bottom-grid">
        {/* Recent Tickets */}
        <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "12px", height: "210px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Recent Tickets</span>
            <span style={{ fontSize: 13, color: "#185FA5", cursor: "pointer" }} onClick={() => navigate("/tickets")}>View All</span>
          </div>
          {tickets.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>No tickets yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {tickets.slice(0, 4).map((ticket) => (
                  <tr key={ticket._id} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                    onClick={() => navigate(`/ticket/${ticket.id}`)}>
                    <td style={{ padding: "9px 0", fontSize: 12, color: "#9ca3af", width: 52 }}>#{ticket.id}</td>
                    <td style={{ padding: "9px 6px", fontSize: 13, color: "#374151" }}>{ticket.subject}</td>
                    <td style={{ padding: "9px 0" }}><StatusBadge status={ticket.status} /></td>
                    <td style={{ padding: "9px 0", fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Customers */}
        <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "12px", height: "210px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Top Customers</span>
            <span style={{ fontSize: 13, color: "#185FA5", cursor: "pointer" }} onClick={() => navigate("/customers")}>View All</span>
          </div>
          {topCustomers.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>No customers yet</p>
          ) : (
            topCustomers.map((c) => {
              const { bg, color } = getAvatarStyle(c.name);
              return (
                <div key={c.name} onClick={() => navigate("/customers")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {getInitials(c.name)}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>{c.count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}