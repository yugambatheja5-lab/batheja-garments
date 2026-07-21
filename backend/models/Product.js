const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  images: [String], // Gallery for multiple photos
  category: String,
  department: { type: String, enum: ['Men', 'Women', 'Kids', 'Accessories'] },
  description: String,
  variants: {
    sizes: [String], // e.g. ['S', 'M', 'L', 'XL']
    colors: [String] // e.g. ['Black', 'Navy', 'Maroon']
  },
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  releaseDate: { type: Date },
  isVaultItem: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);