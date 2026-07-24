import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import OTPVerificationModal from "./components/OTPVerificationModal";
import "./auth.css";

function Login({ setUser, showToast }) {
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOtpIdentifier, setPendingOtpIdentifier] = useState(null);
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

      // Check for OTP requirement FIRST (backend returns 200 with requireOtp flag)
      if (data.requireOtp) {
        setError(data.error || "Please verify your email before logging in.");
        setPendingOtpIdentifier(data.identifier);
        if (showToast) showToast(data.error || "Please verify your email before logging in.", "warning");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save JWT token
      localStorage.setItem("token", data.token);
      if (setUser) setUser(data.user);
      if (showToast) showToast(`Welcome back, ${data.user.name}!`, "success");

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      setError(err.message);
      if (showToast) showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = (verifyData) => {
    if (verifyData.token) {
      localStorage.setItem("token", verifyData.token);
      if (setUser) setUser(verifyData.user);
    }
    setPendingOtpIdentifier(null);
    if (showToast) showToast("Account verified successfully! Welcome back.", "success");
    
    if (verifyData.user?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="auth-container">
      
      {/* OTP VERIFICATION MODAL IF UNVERIFIED USER LOGS IN */}
      {pendingOtpIdentifier && (
        <OTPVerificationModal
          identifier={pendingOtpIdentifier}
          verificationMethod="email"
          onVerified={handleOtpVerified}
          onCancel={() => setPendingOtpIdentifier(null)}
          showToast={showToast}
        />
      )}

      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Log in with your registered Email Address.</p>

        {successMessage && (
          <div className="auth-message auth-success">
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div className="auth-message auth-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              placeholder="user@gmail.com"
              required
              value={formData.loginId}
              onChange={e => setFormData({...formData, loginId: e.target.value})}
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="form-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          <div style={{ textAlign: "right", marginTop: "-8px" }}>
            <Link to="/forgot-password" style={{ color: "#6b7280", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`auth-button ${loading ? "loading-state" : ""}`}
            aria-busy={loading}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account yet? <Link to="/signup">Sign Up Now</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;