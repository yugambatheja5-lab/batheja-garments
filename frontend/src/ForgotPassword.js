import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
    <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "450px", background: "#fff", padding: "50px 40px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "10px", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>
          {step === 1 ? "Forgot Password" : "Secure Reset"}
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "15px", lineHeight: "1.5" }}>
          {step === 1 
            ? "Enter your registered email or phone number and we will securely send you a 6-digit verification code."
            : "Enter the code you received along with your brand new password."}
        </p>

        {error && <div style={{ backgroundColor: "#ffecec", color: "#ff4d4d", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center", fontWeight: "600" }}>{error}</div>}
        {success && step === 2 && <div style={{ backgroundColor: "#e8ffe8", color: "#00a300", padding: "12px", borderRadius: "8px", marginBottom: "10px", fontSize: "14px", textAlign: "center", fontWeight: "600" }}>{success}</div>}

        {step === 1 ? (
          <form onSubmit={requestOTP} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Email or Phone</label>
              <input 
                type="text" 
                placeholder="example@mail.com OR 9876543210"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ marginTop: "10px", padding: "16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 10px 20px rgba(0,0,0,0.15)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>6-Digit OTP</label>
              <input 
                type="text" 
                inputMode="numeric"
                pattern="\d*"
                placeholder="000000"
                maxLength="6"
                required
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "20px", outline: "none", boxSizing: "border-box", textAlign: "center", letterSpacing: "10px", fontWeight: "800" }} 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }} 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>Confirm New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", boxSizing: "border-box" }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ marginTop: "10px", padding: "16px", backgroundColor: "#ff4d4d", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 10px 20px rgba(0,0,0,0.15)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Verifying..." : "Reset Securely"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: "30px", fontSize: "15px", color: "#666" }}>
          Remembered your password? <Link to="/login" style={{ color: "#000", fontWeight: "700", textDecoration: "none" }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
