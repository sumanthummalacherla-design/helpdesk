import API_BASE from '../config';
import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

function DonutChart({ data, total }) {
  const SIZE = 175;
  const R = 75;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP = 4;

  let offset = 0;
  const slices = data.map((d) => {
    const fraction = d.count / total;
    const dash = fraction * CIRCUMFERENCE - GAP;
    const gap = CIRCUMFERENCE - dash;
    const slice = { ...d, dash, gap, offset };
    offset += fraction * CIRCUMFERENCE;
    return slice;
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {slices.map((s) => (
        <circle
          key={s.label}
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth={20}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      ))}
    </svg>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(API_BASE + "/api/tickets");
        const data = await res.json();
        setTickets(data.tickets);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };
    fetchTickets();
  }, []);

  const resolved = tickets.filter((t) => t.status === "Resolved");

  const avgResolutionHrs = (() => {
    const withTime = resolved.filter((t) => t.createdAt && t.updatedAt);
    if (!withTime.length) return "—";
    const avg =
      withTime.reduce((sum, t) => {
        return sum + (new Date(t.updatedAt) - new Date(t.createdAt));
      }, 0) / withTime.length;
    return (avg / 1000 / 60 / 60).toFixed(1) + " hrs";
  })();

  const slaCompliance = tickets.length
    ? Math.round((resolved.length / tickets.length) * 100) + "%"
    : "—";

  const trendData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const created = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const resolvedDay = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };
    tickets.forEach((t) => {
      if (t.createdAt) {
        const day = days[new Date(t.createdAt).getDay()];
        created[day]++;
      }
      if (t.status === "Resolved" && t.updatedAt) {
        const day = days[new Date(t.updatedAt).getDay()];
        resolvedDay[day]++;
      }
    });
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      value: created[day],
      resolved: resolvedDay[day],
    }));
  })();
  const categoryData = (() => {
    const categories = {};

    tickets.forEach((ticket) => {
      const category = ticket.category || "Other";
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  })();

  const priorityData = [
    {
      label: "Urgent",
      count: tickets.filter((t) => t.priority === "Critical").length,
      color: "#E24B4A",
    },
    {
      label: "High",
      count: tickets.filter((t) => t.priority === "High").length,
      color: "#EF9F27",
    },
    {
      label: "Medium",
      count: tickets.filter((t) => t.priority === "Medium").length,
      color: "#FAC775",
    },
    {
      label: "Low",
      count: tickets.filter((t) => t.priority === "Low").length,
      color: "#1D9E75",
    },
  ];

  return (
    <main
      style={{
        padding: "1.25rem",
        backgroundColor: "#f0f0f0",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 600, color: "#111" }}>
          Reports
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              fontSize: 13,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px 14px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Last 30 Days ▾
          </button>
          <button
            style={{
              fontSize: 13,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px 14px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ↓ Export
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Total Tickets
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#111",
              marginBottom: 4,
            }}
          >
            {tickets.length}
          </div>
          <div style={{ fontSize: 12, color: "#16a34a" }}>
            ↑ 15% vs prev 30 days
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Resolved Tickets
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#111",
              marginBottom: 4,
            }}
          >
            {resolved.length}
          </div>
          <div style={{ fontSize: 12, color: "#16a34a" }}>
            ↑ 16% vs prev 30 days
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Average Resolution Time
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#111",
              marginBottom: 4,
            }}
          >
            {avgResolutionHrs}
          </div>
          <div style={{ fontSize: 12, color: "#dc2626" }}>
            ↓ 5% vs prev 30 days
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            SLA Compliance
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#111",
              marginBottom: 4,
            }}
          >
            {slaCompliance}
          </div>
          <div style={{ fontSize: 12, color: "#16a34a" }}>
            ↑ 3% vs prev 30 days
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1fr 1fr",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem",
            height: 430,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>
              Ticket Trend
            </span>
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#378ADD",
                    display: "inline-block",
                    marginRight: 5,
                  }}
                />
                Created
              </span>
              <span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#1D9E75",
                    display: "inline-block",
                    marginRight: 5,
                  }}
                />
                Resolved
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#378ADD" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#378ADD"
                strokeWidth={2}
                fill="url(#colorCreated)"
                dot={{ r: 3 }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#1D9E75"
                strokeWidth={2}
                fill="url(#colorResolved)"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111",
              marginBottom: "1rem",
            }}
          >
            Tickets by Priority
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              height: 350,
            }}
          >
            <div style={{ position: "relative", width: 150, height: 200 }}>
              <DonutChart data={priorityData} total={tickets.length} />
              <div
                style={{
                  position: "absolute",
                  top: "45%",
                  left: "55%",
                  transform: "translate(-50%,-50%)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>
                  {tickets.length}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Total</div>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {priorityData.map((p) => (
                <div
                  key={p.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#374151",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: p.color,
                        flexShrink: 0,
                      }}
                    />
                    {p.label}
                  </span>
                  <span style={{ color: "#6b7280" }}>
                    {tickets.length
                      ? ((p.count / tickets.length) * 100).toFixed(1)
                      : 0}
                    % ({p.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1rem",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111",
              marginBottom: "1rem",
            }}
          >
            Tickets by Category
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "13px",
                  }}
                >
                  <span>{cat.name}</span>
                  <span>{cat.count}</span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#E5E7EB",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${
                        tickets.length ? (cat.count / tickets.length) * 100 : 0
                      }%`,
                      height: "100%",
                      background: "#3B82F6",
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

