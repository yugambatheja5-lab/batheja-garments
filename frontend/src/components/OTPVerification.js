import React, { useState, useEffect } from "react";
import "../auth.css";

/**
 * Reusable 6-Digit OTP Verification Component with Mobile Optimization
 */
export function OTPVerification({ identifier, onVerified, onCancel, showToast }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input field
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otpCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      if (showToast) showToast("Account verified successfully!", "success");
      onVerified(data);
    } catch (err) {
      setError(err.message);
      if (showToast) showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");

      if (showToast) showToast(`New code sent to ${identifier}`, "info");
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px 30px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            marginBottom: "20px",
            margin: "0 auto 20px"
          }}
        >
          📱
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", margin: "0 0 10px 0", letterSpacing: "1px", textTransform: "uppercase", textAlign: "center" }}>
          Security Verification
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 25px 0", lineHeight: "1.5", textAlign: "center" }}>
          We have dispatched a 6-digit verification code to <strong style={{ color: "#111827" }}>{identifier}</strong>.
        </p>

        {error && (
          <div className="auth-message auth-error" style={{ textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="otp-inputs-container">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                inputMode="numeric"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                autoFocus={index === 0}
                className={`otp-input ${data ? "filled" : ""}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className={`auth-button ${loading || otp.join("").length !== 6 ? "loading-state" : ""}`}
            aria-busy={loading}
            style={{ marginTop: "20px" }}
          >
            {loading ? "Verifying..." : "Verify & Activate Account"}
          </button>
        </form>

        <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <button
            onClick={handleResend}
            disabled={timer > 0 || resending}
            style={{
              background: "none",
              border: "none",
              color: timer > 0 ? "#9ca3af" : "#2563eb",
              fontWeight: "700",
              fontSize: "13px",
              cursor: timer > 0 ? "default" : "pointer",
              transition: "color 0.2s"
            }}
            aria-disabled={timer > 0 || resending}
          >
            {resending ? "Resending..." : timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OTPVerification;
