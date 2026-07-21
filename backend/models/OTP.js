const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // Can be email or phone
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Automatically expires after 10 mins (600s)
});

module.exports = mongoose.model('OTP', OTPSchema);
