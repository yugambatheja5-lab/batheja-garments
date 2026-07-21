const mongoose = require('mongoose');

const lookbookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'Untitled Look' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    scale: { type: Number, default: 1 },
    zIndex: { type: Number, default: 1 },
    image: String,
    name: String
  }],
  previewImage: String // Base64 or URL of the canvas snapshot (optional)
}, { timestamps: true });

module.exports = mongoose.model('Lookbook', lookbookSchema);
