import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { Search, X, Ticket, Users, LayoutDashboard, BarChart2, Settings } from "lucide-react";

// ── Static page shortcuts ─────────────────────────────────────────────────────
const PAGES = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={13} /> },
  { label: "Tickets",   path: "/tickets",   icon: <Ticket size={13} /> },
  { label: "Customers", path: "/customers", icon: <Users size={13} /> },
  { label: "Reports",   path: "/reports",   icon: <BarChart2 size={13} /> },
  { label: "Settings",  path: "/settings",  icon: <Settings size={13} /> },
];

const STATUS_STYLE = {
  "Open":        { bg: "#FFCCCC", color: "#F20000" },
  "In Progress": { bg: "#FFE8CC", color: "#FF8C00" },
  "Resolved":    { bg: "#DDFFEE", color: "#00B347" },
  "Closed":      { bg: "#E9E9E9", color: "#6b7280" },
};
const PRIORITY_COLOR = {
  Critical: "#ef4444", High: "#FF8C00", Medium: "#fb923c", Low: "#34d399",
};

const PALETTE = [
  { bg: "#dbeafe", color: "#1e3a8a" }, { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#d1fae5", color: "#065f46" }, { bg: "#fef3c7", color: "#78350f" },
  { bg: "#ede9fe", color: "#4c1d95" },
];
function avatarStyle(name = "") {
  const i = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[i];
}
function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const Header = () => {
  const fallbackUser = { displayName: "User" };
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery]       = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [results, setResults]   = useState({ pages: [], tickets: [], customers: [] });

  const inputRef    = useRef(null);
  const searchBoxRef = useRef(null);

  const profileLetters = (displayName) => {
    if (!displayName) return "";
    const names = displayName.split(/\s+/).filter(Boolean);
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults({ pages: [], tickets: [], customers: [] });
      setSearchOpen(false);
      setActiveIdx(-1);
      return;
    }

    // Pages: instant
    const pageMatches = PAGES.filter((p) => p.label.toLowerCase().includes(q));
    setResults((prev) => ({ ...prev, pages: pageMatches }));
    setSearchOpen(true);

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/tickets");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const tickets = data.tickets || [];

        const ticketMatches = tickets.filter(
          (t) =>
            String(t.id).includes(q) ||
            t.subject?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.category?.toLowerCase().includes(q) ||
            t.status?.toLowerCase().includes(q) ||
            t.priority?.toLowerCase().includes(q) ||
            t.assignee?.toLowerCase().includes(q)
        ).slice(0, 5);

        // Build customers from assignees + localStorage extras
        const extras = (() => {
          try { return JSON.parse(localStorage.getItem("hd_extra_customers") || "[]"); }
          catch { return []; }
        })();
        const custMap = {};
        extras.forEach((e) => { custMap[e.name] = { ...e, ticketCount: 0 }; });
        tickets.forEach((t) => {
          const name = t.assignee?.trim();
          if (!name) return;
          if (!custMap[name]) custMap[name] = { name, email: "", ticketCount: 0 };
          custMap[name].ticketCount++;
        });
        const customerMatches = Object.values(custMap)
          .filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q)
          )
          .slice(0, 4);

        setResults({ pages: pageMatches, tickets: ticketMatches, customers: customerMatches });
      } catch {
        // silently keep page results
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Flat list for keyboard navigation
  const flat = [
    ...results.pages.map((p) => ({ _type: "page", ...p })),
    ...results.tickets.map((t) => ({ _type: "ticket", ...t })),
    ...results.customers.map((c) => ({ _type: "customer", ...c })),
  ];

  function selectResult(item) {
    setQuery("");
    setSearchOpen(false);
    setActiveIdx(-1);
    if (item._type === "page")     navigate(item.path);
    else if (item._type === "ticket")   navigate(`/ticket/${item.id}`);
    else if (item._type === "customer") navigate("/customers");
  }

  function handleKeyDown(e) {
    if (!searchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectResult(flat[activeIdx]);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  }

  const hasResults = flat.length > 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      {/* ── Search ── */}
      <div className="nav-left" ref={searchBoxRef} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 30,
            padding: "0 10px",
            border: `1.5px solid ${searchOpen ? "#6366f1" : "#e5e7eb"}`,
            borderRadius: 10,
            background: searchOpen ? "#fff" : "#f8fafc",
            transition: "border-color 0.15s, background 0.15s",
            width: 280,
          }}
        >
          <Search size={14} color={searchOpen ? "#6366f1" : "#9ca3af"} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setSearchOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search tickets, customers, pages…"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              color: "#111827",
            }}
          />
          {loading && (
            <span style={{
              width: 12, height: 12,
              border: "2px solid #e5e7eb",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              display: "inline-block",
              animation: "hd-spin 0.7s linear infinite",
              flexShrink: 0,
            }} />
          )}
          {query && !loading && (
            <X
              size={13}
              color="#9ca3af"
              style={{ cursor: "pointer", flexShrink: 0 }}
              onClick={() => { setQuery(""); setSearchOpen(false); inputRef.current?.focus(); }}
            />
          )}
        </div>

        {/* ── Dropdown ── */}
        {searchOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: 420,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
            zIndex: 1000,
            overflow: "hidden",
            maxHeight: 460,
            overflowY: "auto",
          }}>
            {!hasResults && !loading && (
              <div style={{ padding: "18px 16px", color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
                No results for <strong style={{ color: "#374151" }}>"{query}"</strong>
              </div>
            )}

            {/* Pages */}
            {results.pages.length > 0 && (
              <>
                <SectionLabel>Pages</SectionLabel>
                {results.pages.map((p, i) => (
                  <Row
                    key={p.path}
                    active={activeIdx === i}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => selectResult({ _type: "page", ...p })}
                  >
                    <IconBubble bg="#ede9fe" color="#6366f1">{p.icon}</IconBubble>
                    <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{p.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#c0c0c0" }}>{p.path}</span>
                  </Row>
                ))}
              </>
            )}

            {/* Tickets */}
            {results.tickets.length > 0 && (
              <>
                <SectionLabel>Tickets</SectionLabel>
                {results.tickets.map((t, i) => {
                  const gi = results.pages.length + i;
                  const sc = STATUS_STYLE[t.status] || STATUS_STYLE.Closed;
                  const pc = PRIORITY_COLOR[t.priority] || "#9ca3af";
                  return (
                    <Row
                      key={t.id}
                      active={activeIdx === gi}
                      onMouseEnter={() => setActiveIdx(gi)}
                      onClick={() => selectResult({ _type: "ticket", ...t })}
                    >
                      <IconBubble bg="#fff7ed" color="#f97316"><Ticket size={13} /></IconBubble>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.subject}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                          #{t.id}{t.category ? ` · ${t.category}` : ""}{t.assignee ? ` · ${t.assignee}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: sc.bg, color: sc.color }}>
                          {t.status}
                        </span>
                        <span style={{ fontSize: 10, color: pc, fontWeight: 500 }}>● {t.priority}</span>
                      </div>
                    </Row>
                  );
                })}
              </>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <>
                <SectionLabel>Customers</SectionLabel>
                {results.customers.map((c, i) => {
                  const gi = results.pages.length + results.tickets.length + i;
                  const { bg, color } = avatarStyle(c.name);
                  return (
                    <Row
                      key={c.name}
                      active={activeIdx === gi}
                      onMouseEnter={() => setActiveIdx(gi)}
                      onClick={() => selectResult({ _type: "customer", ...c })}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: bg, color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, flexShrink: 0,
                      }}>
                        {initials(c.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{c.name}</div>
                        {c.email && <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.email}</div>}
                      </div>
                      <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>
                        {c.ticketCount} ticket{c.ticketCount !== 1 ? "s" : ""}
                      </span>
                    </Row>
                  );
                })}
              </>
            )}

            {/* Keyboard hint */}
            {hasResults && (
              <div style={{ padding: "6px 14px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12, fontSize: 10, color: "#c0c0c0" }}>
                <span><Kbd>↑↓</Kbd> navigate</span>
                <span><Kbd>↵</Kbd> open</span>
                <span><Kbd>Esc</Kbd> close</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right side (unchanged) ── */}
      <div className="nav-right">
        <button className="tickets-btn" onClick={() => navigate("/ticket-form")}>
          New Tickets
        </button>

        <div className="avatar-chip-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
          <div
            className="avatar-chip"
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <div className="avatar"></div>
            <span className="avatar-name">
              {profileLetters(user?.displayName || fallbackUser.displayName)}
            </span>
          </div>

          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              minWidth: "160px",
              zIndex: 1000,
              overflow: "hidden",
            }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#111827" }}>
                  {user?.displayName || "User"}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
                  {user?.email || ""}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "block", width: "100%", padding: "10px 14px",
                  background: "none", border: "none", textAlign: "left",
                  fontSize: "0.85rem", color: "#ef4444", cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes hd-spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  );
};

// ── Tiny sub-components ───────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      padding: "8px 14px 3px",
      fontSize: 10, fontWeight: 700, color: "#9ca3af",
      textTransform: "uppercase", letterSpacing: "0.08em",
    }}>
      {children}
    </div>
  );
}

function Row({ children, active, onClick, onMouseEnter }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px", cursor: "pointer",
        background: active ? "#f5f3ff" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {children}
    </div>
  );
}

function IconBubble({ bg, color, children }) {
  return (
    <span style={{
      width: 26, height: 26, borderRadius: 6,
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

function Kbd({ children }) {
  return (
    <kbd style={{
      background: "#f3f4f6", border: "1px solid #e5e7eb",
      borderRadius: 4, padding: "1px 5px",
      fontSize: 9, fontFamily: "inherit", color: "#6b7280",
    }}>
      {children}
    </kbd>
  );
}

export default Header;