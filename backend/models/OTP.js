const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  identifier: { type: String, required: true, index: true }, // Lowercase email or phone
  codeHash: { type: String, required: true }, // Store ONLY cryptographically hashed OTP
  attempts: { type: Number, default: 0 }, // Failed attempt counter (max 5 before block)
  lastSentAt: { type: Date, default: Date.now }, // Timestamp of last request (for 60s resend cooldown)
  pendingUserData: { type: Object, default: null }, // Store pending user payload until OTP verification succeeds
  createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-purge document after 5 minutes (300s)
});

module.exports = mongoose.model('OTP', OTPSchema);
