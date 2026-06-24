import API_BASE from '../config';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Load requester (customer) list from backend
async function loadAssignees() {
  try {
    const res = await fetch(API_BASE + "/api/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    const users = (data.users || [])
      .filter(u => u.displayName)
      .map(u => ({ id: u._id || u.id, name: u.displayName, email: u.email }));
    console.log("Assignees loaded:", users);
    return users;
  } catch (err) {
    console.error("loadAssignees error:", err);
    return [];
  }
}

export default function Tickets_form() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [assignees, setAssignees] = useState([]);
  const [fields, setFields] = useState({
    id: "",
    title: "",
    category: "",
    priority: "",
    assignee: "",
    description: "",
    attachments: null,
    user: user?.id,
  });

  useEffect(() => {
    loadAssignees().then(setAssignees);
  }, []);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFields((prev) => ({ ...prev, [name]: files ? files[0] : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!fields.title) newErrors.title = "Subject is required";
    if (!fields.category) newErrors.category = "Category is required";
    if (!fields.priority) newErrors.priority = "Priority is required";
    if (!fields.description) newErrors.description = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const id = Date.now();

    const res = await fetch(API_BASE + "/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        subject: fields.title,
        description: fields.description,
        category: fields.category,
        priority: fields.priority,
        assignee: fields.assignee,
        attachmentUrl: fields.attachments
          ? URL.createObjectURL(fields.attachments)
          : null,
        user: user?.role === "assignee" ? user.id : null,
        requesterName: user ? user.displayName : null,
        requesterId: user ? String(user.id) : null,
        requesterRole: user?.role || "assignee",
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert("Error: " + errorData.message);
      return;
    }

    alert("Ticket submitted successfully!");
    navigate("/tickets");
  };

  const PRIORITIES = [
    { label: "Low", color: "#1D9E75", time: "24 hours" },
    { label: "Medium", color: "#c88d16", time: "8 hours" },
    { label: "High", color: "#ed8743", time: "2 hours" },
    { label: "Critical", color: "#c92d2d", time: "1 hour" },
  ];

  return (
    <form className="ticket-form-container" onSubmit={handleSubmit} noValidate>
      <div className="newTickets">
        <p
          style={{ fontSize: 12, color: "#7d7d7d", cursor: "pointer", marginBottom: 0 }}
          onClick={() => navigate("/tickets")}
        >
          Back to Tickets
        </p>
        <h4>New Ticket</h4>
        <p style={{ fontSize: 12, color: "#7d7d7d", marginBottom: 0 }}>
          Fill in the details below. We'll route it to the right team automatically.
        </p>
      </div>

      <div className="ticket-form-main">
        <div className="ticket-form-left">
          <div className="ticket-form-divider">
            <div className="ticket-form-con-1">
              <div className="ticket-form-os">
                <label htmlFor="title" className="form-label">Subject*</label>
                <input
                  type="text" id="title" name="title"
                  style={{ borderColor: errors.title ? "#e74c3c" : "#e4e4e4" }}
                  className="ticket-title" placeholder="Enter subject"
                  value={fields.title} onChange={handleChange} required
                />

                <div className="ticket-form-row">
                  <div className="ticket-form-col w-50">
                    <label htmlFor="category" className="form-magic">Category*</label>
                    <select
                      id="category" name="category"
                      style={{ borderColor: errors.category ? "#e74c3c" : "#e4e4e4" }}
                      className="ticket-title-1" value={fields.category}
                      onChange={handleChange} required
                    >
                      <option value="">Select…</option>
                      <option value="Billing">Billing</option>
                      <option value="Tech Issue">Tech Issue</option>
                      <option value="Request">Request</option>
                    </select>
                  </div>

                  <div className="ticket-form-col w-50">
                    <label htmlFor="priority" className="form-magic">Priority*</label>
                    <div className="priority-options">
                      {[
                        { value: "Low", color: "#1D9E75" },
                        { value: "Medium", color: "#BA7517" },
                        { value: "High", color: "#E07B2A" },
                        { value: "Critical", color: "#E24B4A" },
                      ].map(({ value, color }) => (
                        <button
                          key={value} type="button"
                          onClick={() => {
                            setFields((prev) => ({ ...prev, priority: value }));
                            setErrors((prev) => ({ ...prev, priority: "" }));
                          }}
                          className="priority-btn"
                          style={{
                            borderColor: fields.priority === value ? color : "",
                            color: fields.priority === value ? color : "",
                            fontWeight: fields.priority === value ? 600 : 400,
                          }}
                        >
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: color, display: "inline-block", marginRight: 6,
                          }} />
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  {errors.priority && (
                    <p style={{ color: "red", fontSize: 12, margin: "4px 0 0" }}>{errors.priority}</p>
                  )}
                </div>

                {/* ── Assignee — from customer backend ── */}
                <label htmlFor="assignee" className="form-label">Assignee</label>
                <select
                  id="assignee" name="assignee"
                  className="ticket-title"
                  value={fields.assignee}
                  onChange={handleChange}
                >
                  <option value="">— Select Assignee —</option>
                  {assignees.length === 0 && (
                    <option disabled>No registered assignees yet</option>
                  )}
                  {assignees.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="ticket-form-divider-1">
            <div className="ticket-form-con-2">
              <div className="ticket-form-control-1">
                <div className="ticket-form-os-1">
                  <label htmlFor="description" className="form-label">Description*</label>
                  <textarea
                    id="description" name="description" className="ticket-title"
                    style={{ height: "100px", borderColor: errors.description ? "#e74c3c" : "#e4e4e4" }}
                    placeholder="Describe your issue in detail"
                    value={fields.description} onChange={handleChange} required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="ticket-form-divider-2">
            <div className="ticket-form-con-3">
              <div style={{ width: "100%" }}>
                <label htmlFor="attachments" className="form-label">Attachments</label>
                <input
                  type="file" id="attachments" name="attachments"
                  className="ticket-title" onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ticket-form-right">
          <div className="sla-info">
            <h4>SLA Performance</h4>
            <p>We typically respond within</p>
            <h2 style={{ color: "#4e87f9" }}>2 hours</h2>
            <p style={{ marginBottom: "0px" }}>Priority response times</p>
            <div className="priority-response">
              <div className="response-row">
                {PRIORITIES.map(({ label, color, time }) => (
                  <div className="response-row" key={label}>
                    <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: color, display: "inline-block", marginRight: 6,
                        }} />
                        <span style={{ fontWeight: 500 }}>{label}:</span>
                      </span>
                      <span>{time}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="recent-activity">
            <h4>Recent Activity</h4>
            <p>No recent activity</p>
          </div>
        </div>
      </div>

      <div className="ticket-form-footer">
        <div className="ticket-form-btns">
          <button type="button" className="btn btn-light" onClick={() => navigate("/tickets")}>
            Cancel
          </button>
          <button type="submit" className="btn btn-dark">
            Create Ticket
          </button>
        </div>
      </div>
    </form>
  );
}

