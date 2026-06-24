import API_BASE from '../config';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("assignee");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    const endpoint = role === "assignee" ? "/api/register" : "/api/customers/register";
    const body = role === "assignee"
      ? { displayName, email, password }
      : { name: displayName, email, password };

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        navigate("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2>Help Desk</h2>
      <div className="card-text-center">
        <div className="card-header">
          <h3>Welcome</h3>
          <h6 style={{ color: "#909090" }}>Please sign in or create an account to manage tickets</h6>
        </div>

        <div className="wrapper" style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
          <div style={toggleStyle(false)} onClick={() => navigate("/login")}>Sign In</div>
          <div style={toggleStyle(true)}>Sign Up</div>
        </div>

        {/* Role toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={rolePillWrap}>
            <div style={rolePill(role === "assignee")} onClick={() => { setRole("assignee"); setError(""); }}>Assignee</div>
            <div style={rolePill(role === "customer")} onClick={() => { setRole("customer"); setError(""); }}>Customer</div>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="display-name">Full Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                type="text" className="form-control" id="display-name" placeholder="Enter your full name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" className="form-control" id="email" placeholder="Enter email" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                type="password" className="form-control" id="password" placeholder="At least 6 characters" required />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)}
                type="password" className="form-control" id="confirm" placeholder="Repeat your password" required />
            </div>
            <button type="submit" className="btn btn-primary">
              Create {role === "assignee" ? "Assignee" : "Customer"} Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const toggleStyle = (isActive) => ({
  display: "flex", justifyContent: "center", padding: "8px 28px", borderRadius: 10,
  border: "none", cursor: "pointer", alignItems: "center", width: 225, fontSize: 14,
  fontWeight: isActive ? "600" : "400",
  backgroundColor: isActive ? "#ffffff" : "transparent",
  color: isActive ? "#000" : "#888",
  boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
  transition: "all 0.2s ease",
});
const rolePillWrap = { display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, gap: 4 };
const rolePill = (isActive) => ({
  padding: "7px 28px", borderRadius: 8, cursor: "pointer", fontSize: 14,
  fontWeight: isActive ? 600 : 400,
  background: isActive ? "#4f46e5" : "transparent",
  color: isActive ? "#fff" : "#6b7280",
  transition: "all 0.2s ease",
});

export default Register;

