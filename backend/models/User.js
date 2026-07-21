const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  age: { type: Number, min: 13, max: 120 },
  gender: { type: String, enum: ['Male', 'Female', 'Prefer Not to Say'], default: 'Prefer Not to Say' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  password: { type: String, required: true },
  orders: [{
    items: Array,
    total: Number,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);
