import API_BASE from '../config';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("assignee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (role === "assignee") {
      try {
        const res = await fetch(API_BASE + "/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          login({ ...data.user, role: "assignee", displayName: data.user.displayName });
          navigate("/dashboard");
        } else {
          setError(data.message || "Invalid credentials");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    } else {
      try {
        const res = await fetch(API_BASE + "/api/customers/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          login({
            id: data.customer.id,
            displayName: data.customer.name,
            email: data.customer.email,
            role: "customer",
          });
          navigate("/dashboard");
        } else {
          setError(data.message || "Invalid credentials");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="container">
      <h2>Help Desk</h2>
      <div className="card-text-center">
        <div className="card-header">
          <h3>Welcome</h3>
          <p>Please sign in or create an account to manage tickets</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
          <div className="wrapper">
            <div style={toggleStyle(true)}>Sign In</div>
            <div style={toggleStyle(false)} onClick={() => navigate("/register")}>Sign Up</div>
          </div>
        </div>

        {/* Role toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={rolePillWrap}>
            <div style={rolePill(role === "assignee")} onClick={() => { setRole("assignee"); setError(""); }}>
              Assignee
            </div>
            <div style={rolePill(role === "customer")} onClick={() => { setRole("customer"); setError(""); }}>
              Customer
            </div>
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
              <label htmlFor="email">Email address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" className="form-control" id="email" placeholder="Enter email" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                type="password" className="form-control" id="password" placeholder="Enter password" required />
            </div>
            <button type="submit" className="btn btn-primary">
              Sign In as {role === "assignee" ? "Assignee" : "Customer"}
            </button>
          </form>
          {role === "customer" && (
            <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#6b7280" }}>
              Don't have an account?{" "}
              <span style={{ color: "#4f46e5", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/register")}>
                Sign up
              </span>
            </p>
          )}
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

export default Login;

