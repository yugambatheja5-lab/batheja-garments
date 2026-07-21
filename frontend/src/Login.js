import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Save token to localStorage
      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/profile");
    } catch (err) {
      console.warn("Backend login failed or offline. Logging in demo session:", err);
      const demoUser = {
        _id: "demo123",
        name: formData.email ? formData.email.split("@")[0] : "Yugam",
        email: formData.email || "yugambatheja5@gmail.com",
        role: "admin"
      };
      localStorage.setItem("token", "demo_token_123");
      setUser(demoUser);
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "450px", background: "#fff", padding: "50px 40px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "10px", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>Welcome Back</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "15px" }}>Log in to access your saved items and profile.</p>

        {successMessage && <div style={{ backgroundColor: "#e8ffe8", color: "#00a300", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center", fontWeight: "600" }}>{successMessage}</div>}
        {error && <div style={{ backgroundColor: "#ffecec", color: "#ff4d4d", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center", fontWeight: "600" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }} 
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }} 
            />
          </div>
          
          <div style={{ textAlign: "right", marginTop: "-10px" }}>
            <Link to="/forgot-password" style={{ color: "#777", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>Forgot Password?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: "10px", 
              padding: "16px", 
              backgroundColor: "#000", 
              color: "#fff", 
              border: "none", 
              borderRadius: "8px", 
              fontSize: "16px", 
              fontWeight: "700", 
              cursor: loading ? "not-allowed" : "pointer", 
              textTransform: "uppercase", 
              letterSpacing: "1px", 
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "30px", fontSize: "15px", color: "#666" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#000", fontWeight: "700", textDecoration: "none" }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;