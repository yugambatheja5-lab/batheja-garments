import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", age: "", gender: "Prefer Not to Say" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Auto login or redirect to login. We'll simply redirect to login.
      navigate("/login", { state: { message: "Account created successfully! Please login." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "450px", background: "#fff", padding: "50px 40px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "10px", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>Create Account</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "15px" }}>Join Batheja Garments to unlock premium features.</p>

        {error && <div style={{ backgroundColor: "#ffecec", color: "#ff4d4d", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center", fontWeight: "600" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Age</label>
              <input
                type="number"
                placeholder="25"
                min="13"
                max="120"
                required
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box", backgroundColor: "#fff", cursor: "pointer" }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
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
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "30px", fontSize: "15px", color: "#666" }}>
          Already have an account? <Link to="/login" style={{ color: "#000", fontWeight: "700", textDecoration: "none" }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;