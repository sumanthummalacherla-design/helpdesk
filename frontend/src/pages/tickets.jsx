import API_BASE from '../config';
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  Ticket,
  TicketPlus,
  CircleFadingArrowUp,
  CircleCheckBigIcon,
  CircleCheck,
  EllipsisVertical,
} from "lucide-react";

export default function Tickets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState(() => {
    const s = searchParams.get("status");
    return s ? new Set([s]) : new Set();
  });
  const [filterPriority, setFilterPriority] = useState(new Set());
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [page, setPage] = useState(1);
  const [openmenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tickets`);
        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };
    fetchTickets();
  }, [user]);

  useEffect(() => { setPage(1); }, [filterStatus, filterPriority, filterAssignee]);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setFilterStatus(new Set([s]));
    else setFilterStatus(new Set());
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest(".menu") && !event.target.closest(".menu-icon")) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function updateTicket(id, updates) {
    try {
      await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    } catch (err) {
      console.error("Failed to update ticket:", err);
    }
    setOpenMenu(null);
  }

  function handleView(ticket)             { navigate(`/ticket/${ticket.id}`); setOpenMenu(null); }
  function handleMoveToInProgress(ticket) { updateTicket(ticket.id, { status: "In Progress" }); }
  function handleMoveToResolved(ticket)   { updateTicket(ticket.id, { status: "Resolved" }); }
  function handleMenuReopen(ticket)       { updateTicket(ticket.id, { status: "Open" }); }
  function handleMoveToClosed(ticket)     { updateTicket(ticket.id, { status: "Closed" }); }

  const statusCounts = {
    Open:        tickets.filter((t) => t.status === "Open").length,
    "In Progress": tickets.filter((t) => t.status === "In Progress").length,
    Resolved:    tickets.filter((t) => t.status === "Resolved").length,
    Closed:      tickets.filter((t) => t.status === "Closed").length,
  };

  const priorityCounts = {
    Critical: tickets.filter((t) => t.priority === "Critical").length,
    High:     tickets.filter((t) => t.priority === "High").length,
    Medium:   tickets.filter((t) => t.priority === "Medium").length,
    Low:      tickets.filter((t) => t.priority === "Low").length,
  };

  function toggleStatusFilter(status) {
    setFilterStatus((prev) => { const n = new Set(prev); n.has(status) ? n.delete(status) : n.add(status); return n; });
  }
  function togglePriorityFilter(priority) {
    setFilterPriority((prev) => { const n = new Set(prev); n.has(priority) ? n.delete(priority) : n.add(priority); return n; });
  }
  function clearAllFilters() {
    setFilterStatus(new Set()); setFilterPriority(new Set()); setFilterAssignee("all");
  }

  const profileLetters = (name = "") =>
    name.split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  function setSortOrder(order) {
    const sorted = [...tickets].sort((a, b) =>
      order === "newest"
        ? new Date(b.updatedAt) - new Date(a.updatedAt)
        : new Date(a.updatedAt) - new Date(b.updatedAt)
    );
    setTickets(sorted);
  }

  function toggleMenu(ticketId, btnEl) {
    if (openmenu === ticketId) {
      setOpenMenu(null);
    } else {
      const rect = btnEl.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      setOpenMenu(ticketId);
    }
  }

  const CATEGORY_COLORS  = { Billing: "#CCD0FF", Bug: "#FFCCCC", "Tech Issue": "#F0D2FF", Request: "#FFE8CC", Question: "#E9E9E9" };
  const CATEGORY_COLORS1 = { Billing: "#4756FE", Bug: "#ef4444", "Tech Issue": "#a78bfa", Request: "#FF8C00", Question: "#6b7280" };
  const STATUS_COLORS    = { Open: "#FFCCCC", "In Progress": "#FFE8CC", Resolved: "#DDFFEE", Closed: "#E9E9E9" };
  const STATUS_COLORS1   = { Open: "#F20000", "In Progress": "#FF8C00", Resolved: "#00B347", Closed: "#6b7280" };
  const PRIORITY_COLORS  = { Critical: "#FFCCCC", High: "#FFCB8C", Medium: "#FFE5C6", Low: "#CCFFE0" };
  const PRIORITY_COLORS1 = { Critical: "#ef4444", High: "#FF8C00", Medium: "#fb923c", Low: "#34d399" };

  const MENU_OPTIONS_BYSTATUS = {
    Open:        [{ label: "View", onClick: handleView }, { label: "Move to In Progress", onClick: handleMoveToInProgress }, { label: "Move to Resolved", onClick: handleMoveToResolved }, { label: "Move to Closed", onClick: handleMoveToClosed }],
    "In Progress": [{ label: "View", onClick: handleView }, { label: "Move to Open", onClick: handleMenuReopen }, { label: "Move to Resolved", onClick: handleMoveToResolved }, { label: "Move to Closed", onClick: handleMoveToClosed }],
    Resolved:    [{ label: "View", onClick: handleView }, { label: "Move to Open", onClick: handleMenuReopen }, { label: "Move to In Progress", onClick: handleMoveToInProgress }, { label: "Move to Closed", onClick: handleMoveToClosed }],
    Closed:      [{ label: "View", onClick: handleView }, { label: "Move to Open", onClick: handleMenuReopen }],
  };

  const filteredTickets = tickets.filter((ticket) => {
    const statusOk   = filterStatus.size === 0   || filterStatus.has(ticket.status);
    const priorityOk = filterPriority.size === 0 || filterPriority.has(ticket.priority);
    const assigneeOk = filterAssignee === "all"  || ticket.assignee === filterAssignee;
    return statusOk && priorityOk && assigneeOk;
  });

  const uniqueAssignees = [...new Set(tickets.map((t) => t.assignee).filter(Boolean))];

  const PAGE_SIZE   = 6;
  const totalPages  = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const startIndex  = (page - 1) * PAGE_SIZE;
  const pagedTickets = filteredTickets.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="tickets">
      <style>{`
        .tickets-layout {
          display: flex;
          gap: 0;
        }
        .ticket-filter-sidebar {
          width: 220px;
          height: 87%;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .ticket-main-area {
          flex: 1;
          min-width: 0;
          overflow-x: auto;
        }
        .filter-toggle-btn {
          display: none;
          margin-bottom: 10px;
          padding: 7px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .filter-toggle-btn { display: inline-flex; align-items: center; gap: 6px; }
          .ticket-filter-sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            z-index: 200;
            background: #fff;
            box-shadow: 4px 0 16px rgba(0,0,0,0.12);
            transform: translateX(-100%);
            overflow-y: auto;
            padding: 16px;
          }
          .ticket-filter-sidebar.open {
            transform: translateX(0);
          }
          .filter-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.3);
            z-index: 199;
          }
          .filter-overlay.open { display: block; }
        }
        .ticket-table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .ticket-table-responsive table {
          min-width: 640px;
        }
      `}</style>

      {/* Header */}
      <div className="tickets-lay">
        <div className="tickets-header">
          <h4>Tickets</h4>
          <p>{tickets.length} tickets • {statusCounts.Open} Open</p>
        </div>
        <button className="tickets-btn" onClick={() => navigate("/ticket-form")}>
          + Create Ticket
        </button>
      </div>

      {/* Mobile filter toggle */}
      <button className="filter-toggle-btn" onClick={() => setSidebarOpen(true)}>
        ☰ Filters {(filterStatus.size + filterPriority.size) > 0 && `(${filterStatus.size + filterPriority.size})`}
      </button>

      {/* Overlay */}
      <div className={`filter-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="ticket-tables-body tickets-layout">
        {/* Filter Sidebar */}
        <div className={`ticket-table-sidebar ticket-filter-sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Close btn (mobile only) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h5 style={{ margin: 0 }}>Filters</h5>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <p onClick={clearAllFilters} style={{ cursor: "pointer", margin: 0, fontSize: 13, color: "#4f46e5" }}>Clear all</p>
              <button onClick={() => setSidebarOpen(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", lineHeight: 1, color: "#6b7280" }}>✕</button>
            </div>
          </div>

          {/* Status filters */}
          <div className="sidebar-table-body">
            <div className="filters-list">
              <div className="filter-item">
                {[
                  { id: "open", label: "Open" },
                  { id: "inProgress", label: "In Progress" },
                  { id: "resolved", label: "Resolved" },
                  { id: "closed", label: "Closed" },
                ].map(({ id, label }) => (
                  <div key={id} className="filter-num">
                    <div className={`${id}-filter`}>
                      <input type="checkbox" id={id} checked={filterStatus.has(label)} onChange={() => toggleStatusFilter(label)} />
                      <label htmlFor={id}>{label}</label>
                    </div>
                    <p>{statusCounts[label]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority filters */}
          <div className="sidebar-table-filter-1">
            <h5 style={{ marginTop: "10px" }}>Priority</h5>
          </div>
          <div className="filters-list">
            <div className="filter-item-1">
              {[
                { id: "critical", label: "Critical", borderColor: "#ef4444" },
                { id: "high",     label: "High",     borderColor: "#ef7744" },
                { id: "medium",   label: "Medium",   borderColor: "#b65329" },
                { id: "low",      label: "Low",      borderColor: "#1bbd29" },
              ].map(({ id, label, borderColor }) => (
                <div key={id} className="filter-num-1">
                  <div className={`${id}-filter`}>
                    <input type="checkbox" id={id} checked={filterPriority.has(label)} onChange={() => togglePriorityFilter(label)} />
                    <span style={{ borderColor, borderRadius: "50%", borderWidth: "5px", borderStyle: "solid" }} />
                    <label htmlFor={id}>{label}</label>
                  </div>
                  <p>{priorityCounts[label]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assignee filter */}
          <div className="sidebar-table-filter-2">
            <h5 style={{ marginTop: "10px" }}>Assignee</h5>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}>
              <option value="all">All Assignees</option>
              {uniqueAssignees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Main table */}
        <div className="ticket-table-main ticket-main-area">
          <div className="ticket-table-main-header">
            <select onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <p>Showing {pagedTickets.length} of {filteredTickets.length} tickets</p>
          </div>

          <div className="ticket-table-main-body ticket-table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "center" }}>ID</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Requester</th>
                  <th scope="col" style={{ textAlign: "center" }}>Status</th>
                  <th scope="col" style={{ textAlign: "center" }}>Priority</th>
                  <th scope="col" style={{ textAlign: "center" }}>Assignee</th>
                  <th scope="col" style={{ textAlign: "center" }}>Updated</th>
                  <th scope="col" style={{ textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {pagedTickets.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#9ca3af", fontSize: 14 }}>No tickets match the current filters.</td></tr>
                ) : (
                  pagedTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ borderLeft: `5px solid ${PRIORITY_COLORS[ticket.priority] || "#e5e7eb"}` }}>
                        {ticket.id}
                      </td>

                      <td id="subject-category">
                        {ticket.subject}
                        {ticket.category && (
                          <div style={{ background: CATEGORY_COLORS[ticket.category] || "rgba(59,130,246,0.25)", color: CATEGORY_COLORS1[ticket.category] || "#3f89ff", borderRadius: "10%", width: "65px", height: "20px", fontWeight: "600", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", padding: "5px" }}>
                            {ticket.category}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ background: "rgba(59,130,246,0.25)", color: "#3f89ff", borderRadius: "50%", width: "30px", height: "30px", fontWeight: "600", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                            {profileLetters(ticket.requesterName || ticket.user?.displayName || "?")}
                          </div>
                          <span>{ticket.requesterName || ticket.user?.displayName || "Unknown"}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ background: STATUS_COLORS[ticket.status] || "#e5e7eb", color: STATUS_COLORS1[ticket.status] || "#6b7280", borderRadius: "10%", width: "80px", height: "22px", fontWeight: "600", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", padding: "5px" }}>
                          {ticket.status}
                        </div>
                      </td>

                      <td>
                        <div style={{ background: PRIORITY_COLORS[ticket.priority] || "#e5e7eb", color: PRIORITY_COLORS1[ticket.priority] || "#6b7280", borderRadius: "10%", width: "55px", height: "22px", fontWeight: "600", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", padding: "5px" }}>
                          {ticket.priority}
                        </div>
                      </td>

                      <td>{ticket.assignee || "Unassigned"}</td>

                      <td style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </td>

                      <td>
                        <div
                          className="menu-icon"
                          onClick={(e) => toggleMenu(ticket.id, e.currentTarget)}
                          style={{ cursor: "pointer", display: "inline-flex", padding: "4px" }}
                        >
                          <EllipsisVertical size={15} color="#838383" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <footer className="ticket-table-footer">
        <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} id="pagination-btn">&#10094;</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} id="pagination-btn">&#10095;</button>
      </footer>

      {/* Portal dropdown — fixed to viewport, never clipped by table overflow */}
      {openmenu !== null && createPortal(
        <div
          className="menu"
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            minWidth: "170px",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {(MENU_OPTIONS_BYSTATUS[pagedTickets.find(t => t.id === openmenu)?.status] || []).map((option) => (
            <div
              key={option.label}
              onClick={() => option.onClick(pagedTickets.find(t => t.id === openmenu))}
              style={{ padding: "8px 14px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", color: "#374151" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {option.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}