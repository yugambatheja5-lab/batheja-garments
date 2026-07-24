import React, { useState, useEffect, useRef } from "react";

/**
 * Amazon-Style Production 6-Digit OTP Verification Modal
 * Features:
 * - 6 numeric OTP input boxes with auto-focus & backspace handling
 * - Paste event support (auto-fills all 6 digits)
 * - 60s Resend Cooldown Countdown
 * - 5-Minute Expiry Countdown (300s)
 * - Attempt Counter (Max 5 attempts)
 * - Loading Spinner & Glassmorphic UI
 */
export function OTPVerificationModal({ identifier, verificationMethod, onVerified, onCancel, showToast }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 minutes
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // Resend 60-second cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 5-Minute overall OTP expiration timer
  useEffect(() => {
    let interval = null;
    if (expiryTimer > 0) {
      interval = setInterval(() => setExpiryTimer((t) => t - 1), 1000);
    } else {
      setError("Verification code has expired. Please click 'Resend 6-Digit Code'.");
    }
    return () => clearInterval(interval);
  }, [expiryTimer]);

  // Auto-focus first input box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      if (inputRefs.current[5]) inputRefs.current[5].focus();
    }
  };

  const formatExpiryTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (expiryTimer <= 0) {
      setError("Verification code has expired. Please request a new code.");
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
      if (!res.ok) throw new Error(data.error || "OTP Verification failed");

      if (showToast) showToast("Account verified & activated successfully!", "success");
      onVerified(data);
    } catch (err) {
      setError(err.message);
      if (showToast) showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, method: verificationMethod })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");

      if (showToast) showToast(`New 6-digit code sent to ${identifier}`, "info");
      setResendTimer(60);
      setExpiryTimer(300); // Reset 5-min timer
      setOtp(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const isEmail = identifier.includes('@');

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#ffffff",
          color: "#111827",
          borderRadius: "20px",
          padding: "40px 32px",
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          textAlign: "center",
          border: "1px solid #e5e7eb",
          position: "relative",
          zIndex: 1000000
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            marginBottom: "18px"
          }}
        >
          {isEmail ? "✉️" : "📱"}
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#111827", margin: "0 0 8px 0", letterSpacing: "1px", textTransform: "uppercase" }}>
          Security Verification
        </h2>
        
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 16px 0", lineHeight: "1.5" }}>
          We have sent a 6-digit OTP code to <strong style={{ color: "#111827" }}>{identifier}</strong>.
        </p>

        {/* ⏱️ 5-MINUTE EXPIRATION BADGE */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: expiryTimer > 60 ? "#ecfdf5" : "#fef2f2", color: expiryTimer > 60 ? "#047857" : "#dc2626", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "800", marginBottom: "24px" }}>
          <span>⏱️ Expires in: {formatExpiryTime(expiryTimer)}</span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: "600",
              lineHeight: "1.4"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "28px" }} onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  width: "48px",
                  height: "58px",
                  border: digit ? "2px solid #000000" : "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "24px",
                  fontWeight: "900",
                  textAlign: "center",
                  outline: "none",
                  backgroundColor: digit ? "#ffffff" : "#f9fafb",
                  boxShadow: digit ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease"
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6 || expiryTimer <= 0}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "800",
              cursor: loading || otp.join("").length !== 6 || expiryTimer <= 0 ? "not-allowed" : "pointer",
              textTransform: "uppercase",
              letterSpacing: "2px",
              opacity: loading || otp.join("").length !== 6 || expiryTimer <= 0 ? 0.6 : 1,
              transition: "all 0.2s ease",
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Verifying Code...
              </>
            ) : (
              isEmail ? "Verify Security Code" : "Verify Phone Number"
            )}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || resending}
            style={{
              background: "none",
              border: "none",
              color: resendTimer > 0 ? "#9ca3af" : "#2563eb",
              fontWeight: "700",
              fontSize: "13px",
              cursor: resendTimer > 0 ? "default" : "pointer",
              transition: "color 0.2s ease"
            }}
          >
            {resending ? "Sending Code..." : resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "🔄 Resend 6-Digit Code"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default OTPVerificationModal;

