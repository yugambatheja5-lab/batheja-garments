const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    qty: Number,
    selectedSize: String,
    selectedColor: String,
    image: String
  }],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    street: String,
    city: String,
    zip: String,
    phone: String
  },
  paymentMethod: { type: String, enum: ['card', 'upi', 'cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  paymentId: String, // After successful payment
  razorpayOrderId: String, // Used for verification
  orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  bespokeStatus: { 
    type: String, 
    enum: ['Consultation', 'Pattern Cutting', 'Precision Tailoring', 'Final Inspection', 'Luxury Packaging', 'In Transit'],
    default: 'Consultation'
  },
  deliveryDate: Date,
  trackingId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
