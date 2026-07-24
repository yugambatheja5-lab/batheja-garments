const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  age: { type: Number, min: 13, max: 120 },
  gender: { type: String, enum: ['Male', 'Female', 'Prefer Not to Say'], default: 'Prefer Not to Say' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['unverified', 'verified', 'disabled'], default: 'unverified' },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String
  }],
  passwordChangedAt: { type: Date, default: Date.now },
  otpHash: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  orders: [{
    items: Array,
    total: Number,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
