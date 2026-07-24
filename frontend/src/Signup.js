import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import OTPVerificationModal from "./components/OTPVerificationModal";
import "./auth.css";

function Signup({ setUser, showToast }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "Prefer Not to Say"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOtpIdentifier, setPendingOtpIdentifier] = useState(null);
  const navigate = useNavigate();

  // Strict Real-time Email Format & Domain Checks (Rule 4)
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim().toLowerCase()) &&
    !['example.com', 'test.com', 'invalid.com', 'fake.com', 'localhost'].includes(formData.email.trim().toLowerCase().split('@')[1]);

  // Password Strength Indicators
  const passwordRules = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)
  };

  const isPasswordStrong = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!formData.email.trim() || !isEmailValid) {
      setError("Invalid Email Address format. Please enter a valid Gmail / Email address (e.g. name@gmail.com).");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (!isPasswordStrong) {
      setError("Please ensure your password meets all strong security criteria below.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      if (data.requireOtp) {
        setPendingOtpIdentifier(data.identifier);
        if (showToast) showToast(data.message, "info");
      } else if (data.token) {
        localStorage.setItem("token", data.token);
        if (setUser) setUser(data.user);
        if (showToast) showToast("Account verified & activated!", "success");
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
    if (showToast) showToast("Account verified & created successfully! Welcome to Batheja Garments.", "success");
    navigate("/");
  };


  return (
    <div className="auth-container">
      
      {/* 6-DIGIT EMAIL OTP VERIFICATION MODAL */}
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
        <h2>Create Account</h2>
        <p>Join Batheja Garments. Account is created after Email OTP verification.</p>

        {error && (
          <div className="auth-message auth-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Gmail / Email Address 
              <span className="form-label-highlight">(OTP Target)</span>
            </label>
            <input
              type="email"
              placeholder="user@gmail.com"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={`form-input ${formData.email && !isEmailValid ? "error" : formData.email && isEmailValid ? "success" : ""}`}
              autoComplete="email"
            />
            {formData.email && !isEmailValid && (
              <span className="field-error">⚠️ Enter a valid Gmail / Email ID (e.g. name@gmail.com)</span>
            )}
            {formData.email && isEmailValid && (
              <span className="field-success">✓ Valid Email Address</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                placeholder="25"
                min="13"
                max="120"
                required
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="form-input"
                inputMode="numeric"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="form-select"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
                autoComplete="new-password"
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

            {/* LIVE PASSWORD STRENGTH METER */}
            {formData.password && (
              <div className="password-strength-meter">
                <div className={`password-strength-title ${isPasswordStrong ? "strong" : "weak"}`}>
                  {isPasswordStrong ? "✓ Strong Password" : "Password Security Policy:"}
                </div>
                <div className="password-rules-grid">
                  <span className={`password-rule ${passwordRules.length ? "met" : "unmet"}`}>
                    {passwordRules.length ? "✓" : "○"} 8+ Characters
                  </span>
                  <span className={`password-rule ${passwordRules.upper ? "met" : "unmet"}`}>
                    {passwordRules.upper ? "✓" : "○"} 1 Uppercase (A-Z)
                  </span>
                  <span className={`password-rule ${passwordRules.lower ? "met" : "unmet"}`}>
                    {passwordRules.lower ? "✓" : "○"} 1 Lowercase (a-z)
                  </span>
                  <span className={`password-rule ${passwordRules.number ? "met" : "unmet"}`}>
                    {passwordRules.number ? "✓" : "○"} 1 Digit (0-9)
                  </span>
                  <span className={`password-rule ${passwordRules.special ? "met" : "unmet"}`}>
                    {passwordRules.special ? "✓" : "○"} 1 Special (!@#$)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`form-input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "error" : formData.confirmPassword && formData.password === formData.confirmPassword ? "success" : ""}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-btn"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <span className="field-error">⚠️ Passwords do not match</span>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <span className="field-success">✓ Passwords match</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isEmailValid}
            className={`auth-button ${loading ? "loading-state" : ""}`}
            aria-busy={loading}
          >
            {loading ? "Sending Verification Code..." : "Send Verification Code to Email"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;