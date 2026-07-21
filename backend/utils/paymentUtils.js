const Razorpay = require('razorpay');
const crypto = require('crypto');

// Configuration Loader
const PAYMENT_MODE = process.env.PAYMENT_MODE || 'simulation';
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

if (PAYMENT_MODE === 'live' && KEY_ID && KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
  console.log("🚀 Razorpay Live Mode Initialized");
} else {
  console.log("🧪 Payment System running in Simulation Mode");
}

/**
 * Creates a Payment Order (Mode-Agnostic)
 */
exports.createPaymentOrder = async (amountInPaise, receiptId) => {
  if (razorpayInstance) {
    // REAL Razorpay Order Creation
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
    };
    return await razorpayInstance.orders.create(options);
  } else {
    // SIMULATED Order Creation
    return {
      id: `rpay_order_${Math.random().toString(36).substr(2, 9)}`,
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      status: 'created',
      is_simulated: true
    };
  }
};

/**
 * Verifies Payment Signature (Mode-Agnostic)
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (razorpayInstance) {
    // REAL HMAC SHA256 Verification
    const hmac = crypto.createHmac('sha256', KEY_SECRET);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  } else {
    // SIMULATED Verification
    // In simulation, we trust 'simulated_sig_123'
    return signature === "simulated_sig_123" || paymentId.startsWith("pay_");
  }
};

exports.getPaymentMode = () => PAYMENT_MODE;
