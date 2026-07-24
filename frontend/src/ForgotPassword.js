import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const requestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request OTP");
      
      setSuccess("An OTP has been sent to your email/phone.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match!");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otpCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      navigate("/login", { state: { message: "Password reset successful! You can now log in." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{step === 1 ? "Forgot Password" : "Secure Reset"}</h2>
        <p>
          {step === 1 
            ? "Enter your registered email or phone number and we will securely send you a 6-digit verification code."
            : "Enter the code you received along with your brand new password."}
        </p>

        {error && <div className="auth-message auth-error">{error}</div>}
        {success && step === 2 && <div className="auth-message auth-success">{success}</div>}

        {step === 1 ? (
          <form onSubmit={requestOTP} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email or Phone</label>
              <input 
                type="text" 
                placeholder="example@mail.com OR 9876543210"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="form-input"
                autoComplete="username"
                inputMode="text"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`auth-button ${loading ? "loading-state" : ""}`}
              aria-busy={loading}
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="auth-form">
            <div className="form-group">
              <label className="form-label">6-Digit OTP</label>
              <input 
                type="text" 
                inputMode="numeric"
                pattern="\d*"
                placeholder="000000"
                maxLength="6"
                required
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                style={{ fontSize: "20px", textAlign: "center", letterSpacing: "8px", fontWeight: "800" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="form-input"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="form-input"
                autoComplete="new-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`auth-button ${loading ? "loading-state" : ""}`}
              aria-busy={loading}
            >
              {loading ? "Verifying..." : "Reset Securely"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remembered your password? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
