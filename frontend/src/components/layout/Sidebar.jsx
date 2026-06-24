import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sidebarMenuItems } from "../../utils/json/data.js";
import { Home, Ticket, Users, BarChart3, Settings, UsersRound } from "lucide-react";

const NEW_ICONS = {
  dashboard: <Home size={16} />,
  tickets: <Ticket size={16} />,
  users: <Users size={16} />,
  reports: <BarChart3 size={16} />,
  settings: <Settings size={16} />,
  customers: <UsersRound size={16} />,
};

// Compute SLA % = (Resolved + Closed) / total * 100
function computeSLA(tickets) {
  if (!tickets.length) return { pct: 0, delta: 0 };
  const done = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const pct = (done / tickets.length) * 100;

  // "vs last week": compare tickets created in last 7 days vs previous 7 days
  const now = Date.now();
  const DAY = 86400000;
  const thisWeek = tickets.filter((t) => now - new Date(t.createdAt).getTime() < 7 * DAY);
  const lastWeek = tickets.filter((t) => {
    const age = now - new Date(t.createdAt).getTime();
    return age >= 7 * DAY && age < 14 * DAY;
  });

  const thisResolved = thisWeek.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const lastResolved = lastWeek.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const thisPct = thisWeek.length ? (thisResolved / thisWeek.length) * 100 : 0;
  const lastPct = lastWeek.length ? (lastResolved / lastWeek.length) * 100 : 0;
  const delta = +(thisPct - lastPct).toFixed(1);

  return { pct: +pct.toFixed(1), delta };
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { pct, delta } = computeSLA(tickets);
  const deltaUp = delta >= 0;

  // Status breakdown for mini legend
  const counts = {
    Open: tickets.filter((t) => t.status === "Open").length,
    "In Progress": tickets.filter((t) => t.status === "In Progress").length,
    Resolved: tickets.filter((t) => t.status === "Resolved").length,
    Closed: tickets.filter((t) => t.status === "Closed").length,
  };
  const total = tickets.length || 1;

  // Stacked bar segments
  const segments = [
    { key: "Resolved", color: "#34d399", count: counts.Resolved },
    { key: "Closed",   color: "#6d96e7", count: counts.Closed },
    { key: "In Progress", color: "#fbbf24", count: counts["In Progress"] },
    { key: "Open",     color: "#f87171", count: counts.Open },
  ];

  return (
    <aside className="sidebar-toggle">
      <div
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
        className="sidebar-header"
      >
        <h4>Help Desk</h4>
        <p id="sup">SUPPORT DESK</p>
      </div>

      <div className="sidebar-divider">
        <div className="button-group">
          {sidebarMenuItems.map((item) => (
            <button
              key={item.key}
              className={location.pathname === item.path ? "nav-item active" : "nav-item"}
              onClick={() => navigate(item.path)}
            >
              <span style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                {NEW_ICONS[item.key]}
                {item.name}
              </span>
            </button>
          ))}

          {/* ── SLA Card ── */}
          <div className="sla-card w-100">
            <div className="sla-body">
              <p className="sla-title">SLA PERFORMANCE</p>

              {loading ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</p>
              ) : (
                <>
                  <h2 className="sla-value">{pct}%</h2>

                  {/* Stacked progress bar */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: 8,
                      borderRadius: 999,
                      overflow: "hidden",
                      backgroundColor: "#2e3d5a",
                      marginBottom: 10,
                    }}
                  >
                    {segments.map((s) => (
                      <div
                        key={s.key}
                        style={{
                          width: `${(s.count / total) * 100}%`,
                          backgroundColor: s.color,
                          transition: "width 0.6s ease",
                        }}
                      />
                    ))}
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                    {segments.map((s) => (
                      <div
                        key={s.key}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9ca3af" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                          {s.key}
                        </span>
                        <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>
                          {s.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delta */}
                  <p className="sla-delta">
                    <span style={{ color: deltaUp ? "#34d399" : "#f87171" }}>
                      {deltaUp ? "+" : ""}{delta}%
                    </span>{" "}
                    vs last week
                  </p>

                  {/* Total tickets */}
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                    {counts.Resolved + counts.Closed} of {tickets.length} tickets resolved
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;