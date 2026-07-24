const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};


/**
 * Hash plaintext OTP using bcrypt
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/**
 * Verify plaintext OTP against stored hash
 */
const verifyOTPHash = async (otp, hash) => {
  return await bcrypt.compare(otp, hash);
};

/**
 * Strict Amazon-Style Email Format & TLD Validation
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  
  // Standard RFC 5322 compliant regex requiring valid TLD (.com, .in, .org, .net, etc.)
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(cleanEmail)) return false;

  // Block obvious dummy domain patterns
  const domain = cleanEmail.split('@')[1];
  const invalidDomains = ['example.com', 'test.com', 'invalid.com', 'localhost', 'fake.com'];
  if (invalidDomains.includes(domain)) return false;

  return true;
};

/**
 * Strict Amazon-Style Mobile Phone Validation
 * Requires 10-digit mobile number starting with 6, 7, 8, or 9 (Indian standard)
 * or international format (+91 9876543210)
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const sanitized = phone.replace(/[\s\-\(\)]/g, '');
  
  // Accepts +91XXXXXXXXXX or 10-digit 6789XXXXXXXX
  const re = /^(\+91)?([6-9]\d{9})$/;
  return re.test(sanitized);
};

/**
 * Validate Strong Password Policy:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 numeric digit
 * - At least 1 special character (@$!%*?&#)
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter (A-Z)" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter (a-z)" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one numeric digit (0-9)" };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character (e.g. !@#$%^&*)" };
  }
  return { valid: true };
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTPHash,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength
};
