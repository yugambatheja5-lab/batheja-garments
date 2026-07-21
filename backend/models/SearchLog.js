const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema({
  term: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SearchLog', SearchLogSchema);
