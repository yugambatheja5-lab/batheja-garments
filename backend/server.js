require("dotenv").config();
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
// ✅ correct setup
const upload = multer({ dest: "uploads/" });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment variables.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order'); // Added Order model
const SearchLog = require('./models/SearchLog');
const OTP = require('./models/OTP');
const Lookbook = require('./models/Lookbook');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createPaymentOrder, verifyPaymentSignature, getPaymentMode } = require('./utils/paymentUtils');

console.log("Routes loaded ✅");

const JWT_SECRET = process.env.JWT_SECRET || 'batheja_super_secret_key';

// --- ANALYTICS ROUTES ---
app.post('/api/analytics/search', async (req, res) => {
  try {
    const { term } = req.body;
    if (!term || term.trim().length === 0) return res.status(400).json({ error: "Empty search term" });
    
    // Save exactly what the user searched
    const log = new SearchLog({ term: term.trim().toLowerCase() });
    await log.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/popular', async (req, res) => {
  try {
    // Aggregation pipeline to count occurrences of search terms
    const popularSearches = await SearchLog.aggregate([
      { $group: { _id: "$term", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(popularSearches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXPLICIT ROLE & ACCESS CONTROL CONFIGURATION ---
const ADMIN_EMAILS = [
  "admin@batheja.com",
  "yugambatheja5@gmail.com"
];

// Helper: Determine role based on official admin email list or existing DB role
const getRoleForEmail = (email) => {
  return ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
};

// Auto-seed default Administrator account on database connection
mongoose.connection.once("open", async () => {
  try {
    const adminEmail = "admin@batheja.com";
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      adminUser = new User({
        name: "Atelier Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      await adminUser.save();
      console.log("🛡️ Official Admin account created: admin@batheja.com (password: admin123)");
    }
  } catch (err) {
    console.error("Admin seed error:", err.message);
  }
});

// --- AUTHENTICATION & AUTHORIZATION MIDDLEWARES ---
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. Authentication token missing." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    // Check role from decoded token or verify against live DB record
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Authorization verification failed." });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, age, gender } = req.body;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ error: "Email already registered" });

    if (phone) {
      let phoneTaken = await User.findOne({ phone });
      if (phoneTaken) return res.status(400).json({ error: "Phone number already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign role explicitly based on configured ADMIN_EMAILS list
    const role = getRoleForEmail(email);
    user = new User({ name, email: email.toLowerCase(), phone: phone || undefined, password: hashedPassword, age, gender, role });
    await user.save();

    // Include role directly inside JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, orders: user.orders } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body; // Can be email or phone
    const user = await User.findOne({ 
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] 
    });

    if (!user) return res.status(404).json({ error: "No account found with that email or phone" });

    // Generate 6 Digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteOne({ identifier: identifier.toLowerCase() }); // Delete old OTPs for this user
    await new OTP({ identifier: identifier.toLowerCase(), code: otpCode }).save();

    const isEmail = identifier.includes('@');

    if (isEmail) {
      const sendEmail = require('./utils/sendEmail');
      await sendEmail({
        to: user.email,
        subject: "Batheja Garments - Password Reset Code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #000; text-transform: uppercase;">Password Reset Request</h2>
            <p>We received a request to reset your Batheja Garments account password.</p>
            <p>Your 6-digit secure verification code is:</p>
            <h1 style="background: #f0f0f0; padding: 15px; border-radius: 8px; letter-spacing: 10px; text-align: center; font-size: 32px; color: #ff4d4d; border: 1px dashed #ccc;">
              ${otpCode}
            </h1>
            <p>This code will expire in exactly 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      res.json({ message: "Email Sent Successfully!", mockCode: null, nextStep: "/verify-otp" });

    } else {
      const sendSMS = require('./utils/sendSMS');
      await sendSMS({
        to: user.phone,
        body: `Your Batheja Garments password reset OTP code is ${otpCode}. It expires in 10 minutes.`
      });
      res.json({ message: "SMS Text Sent Successfully!", mockCode: null, nextStep: "/verify-otp" });
    }

  } catch (err) {
    console.error("Forgot Password Delivery Error:", err.message);
    res.status(500).json({ error: "Delivery gateway blocked checking credentials. Please check your system limits." });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { identifier, otpCode, newPassword } = req.body;
    
    const otpRecord = await OTP.findOne({ identifier: identifier.toLowerCase(), code: otpCode });
    if (!otpRecord) return res.status(400).json({ error: "Invalid or Expired OTP" });

    const user = await User.findOne({ 
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] 
    });
    if (!user) return res.status(400).json({ error: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Explicit role enforcement for designated admin accounts
    const expectedRole = getRoleForEmail(cleanEmail);
    if (expectedRole === "admin" && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, orders: user.orders } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

const dispatchSimulatedAlerts = (order) => {
  console.log("\n" + "=".repeat(60));
  console.log("⚡ [SISTEM ALERT] SECURE TRANSACTION VERIFIED ⚡");
  console.log("=".repeat(60));
  console.log(`ORDER ID:   #${order._id.toString().toUpperCase()}`);
  console.log(`PAYMENT ID: ${order.paymentId}`);
  console.log(`RECIPIENT:  ${order.user?.name} (${order.user?.email})`);
  console.log(`AMOUNT:     ₹${order.totalAmount.toLocaleString('en-IN')}`);
  console.log("-".repeat(60));
  console.log(`[SMS Simulation]: "Hi ${order.user?.name.split(" ")[0]}, your payment for ORDER #${order._id.toString().substring(18).toUpperCase()} of ₹${order.totalAmount} was successful. We are now preparing your boutique shipment."`);
  console.log(`[EMAIL Simulation]: Detailed digital invoice sent to ${order.user?.email}.`);
  console.log("=".repeat(60) + "\n");
};

// --- PAYMENT / ORDER REALTIME GATEWAY ---

// 0. Fetch Payment Configuration (Mode & Key)
app.get('/api/payment/config', (req, res) => {
  res.json({
    mode: getPaymentMode(),
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulation_key'
  });
});

// 1. Create Checkout Order (Initiate Transaction)
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { items, totalAmount, shippingAddress } = req.body;
    
    // Create actual Order record in 'Pending' state
    const order = new Order({
      user: decoded.userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: 'upi', // Force UPI for this simulated flow
      paymentStatus: 'Pending',
      razorpayOrderId: `rpay_order_${Math.random().toString(36).substr(2, 9)}`
    });
    
    await order.save();
    
    // Using the mode-agnostic utility to create the order (either real or simulated)
    const razorpayOrder = await createPaymentOrder(totalAmount * 100, order._id.toString());
    
    // Update the DB order with the generated ID (if it changed)
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      amount: razorpayOrder.amount, 
      order_id: razorpayOrder.id,
      db_order_id: order._id
    });
  } catch (err) {
    console.error("Payment Order Error:", err);
    res.status(500).json({ error: "Failed to initiate payment transaction." });
  }
});

// 2. Verify Payment Signature (Finalize Transaction)
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { db_order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    // Use the mode-agnostic utility to verify the signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
    }

    const order = await Order.findById(db_order_id).populate('user');
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Update Order Status
    order.paymentStatus = 'Completed';
    order.paymentId = razorpay_payment_id;
    await order.save();

    // Atomic Stock Update
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId },
        { $inc: { stock: -item.qty } }
      );
    }

    // SIMULATED ALERT DISPATCH
    dispatchSimulatedAlerts(order);

    res.json({ success: true, message: "Payment verified and order finalized!", order_id: order._id });

  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ success: false, message: "Critical Verification Failure." });
  }
});

// --- LEGACY ORDER ROUTE (For COD) ---
app.post('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Must be logged in to checkout" });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { items, total, shippingAddress, paymentMethod } = req.body;
    
    const order = new Order({
      user: decoded.userId,
      items,
      totalAmount: total,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'Pending'
    });
    
    await order.save();

    // For COD, we decrement stock immediately upon submission
    for (const item of items) {
       await Product.findOneAndUpdate({ _id: item.productId }, { $inc: { stock: -item.qty } });
    }
    
    res.json({ message: "Order placed successfully!", order });
  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ error: "Order failed" });
  }
});

// GET user orders
app.get('/api/orders/my', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const orders = await Order.find({ user: decoded.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// --- ADMIN ORDER ROUTES ---
app.get('/api/admin/orders', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
});

app.patch('/api/admin/orders/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { orderStatus, paymentStatus, bespokeStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus, paymentStatus, bespokeStatus }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// --- ATELIER AI STYLIST ---
app.post('/api/stylist/suggest', async (req, res) => {
  console.log("✨ Stylist Request Received:", req.body);
  try {
    const { age, gender } = req.body;
    
    // Luxury Rule-Based Suggestion Logic
    let query = { stock: { $gt: 0 } };
    if (gender && gender !== 'Other') {
      query.department = gender === 'Male' ? 'Men' : 'Women';
    }

    let products = await Product.find(query).limit(5);
    
    // Fallback: If no specific gender matches, find any featured or available items
    if (products.length === 0) {
      products = await Product.find({ stock: { $gt: 0 } }).sort({ isFeatured: -1 }).limit(5);
    }

    const suggestions = {
      message: age < 20 ? "Our Atelier suggests a modern, youthful silhouette." : "The Atelier suggests a sophisticated, timeless ensemble for your profile.",
      items: products
    };

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: "Stylist unavailable" });
  }
});

// --- LOOKBOOK STUDIO ROUTES ---

app.post('/api/lookbooks', async (req, res) => {
  try {
    const { user, name, items, id } = req.body;
    if (id) {
      const updated = await Lookbook.findByIdAndUpdate(id, { name, items }, { new: true });
      return res.json(updated);
    }
    const lookbook = new Lookbook({ user, name, items });
    await lookbook.save();
    res.status(201).json(lookbook);
  } catch (err) {
    res.status(500).json({ error: "Failed to save masterpiece" });
  }
});

app.get('/api/lookbooks/user/:userId', async (req, res) => {
  try {
    const looks = await Lookbook.find({ user: req.params.userId }).sort({ updatedAt: -1 });
    res.json(looks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch studio archives" });
  }
});

app.delete('/api/lookbooks/:id', async (req, res) => {
  try {
    await Lookbook.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to deconstruct look" });
  }
});

// --- ATELIER ANALYTICS ---
app.get('/api/admin/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    const inventoryStats = await Product.aggregate([
      { $group: { _id: null, totalStock: { $sum: "$stock" } } }
    ]);

    res.json({
      revenue: totalRevenue[0]?.total || 0,
      orders: totalOrders,
      products: totalProducts,
      inventory: inventoryStats[0]?.totalStock || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compile atelier intelligence" });
  }
});

// --- ADMIN CATALOG ROUTES ---

// GET detailed catalog for management
app.get('/api/admin/products', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// CREATE new product with variants and collections
app.post('/api/admin/products', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: "Creation failed: " + err.message });
  }
});

// UPDATE existing product
app.patch('/api/admin/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Update failed: " + err.message });
  }
});

// DELETE product
app.delete('/api/admin/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, message: "Product purged from catalog" });
  } catch (err) {
    res.status(500).json({ error: "Decline failed" });
  }
});

// --- HELP & CONCIERGE SUPPORT ROUTES ---
app.post('/api/support/ticket', async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "Email and message content are required." });
    }

    const ticketId = "BAT-" + Math.floor(100000 + Math.random() * 900000);
    
    // Attempt sending confirmation email if transporter configured
    try {
      const sendEmail = require('./utils/sendEmail');
      await sendEmail({
        to: email,
        subject: `[${ticketId}] Batheja Garments - Inquiry Received: ${subject || category}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">Atelier Concierge Acknowledgment</h2>
            <p>Dear ${name || 'Valued Client'},</p>
            <p>Thank you for reaching out to Batheja Garments Concierge Services. Your direct mail concern has been logged under reference number:</p>
            <h3 style="background: #000; color: #d4af37; padding: 12px 20px; border-radius: 4px; display: inline-block; letter-spacing: 3px;">${ticketId}</h3>
            <p style="margin-top: 20px;"><strong>Category:</strong> ${category || 'General Inquiry'}</p>
            <p><strong>Message Summary:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 3px solid #d4af37; font-style: italic; color: #555;">${message}</blockquote>
            <p>A Senior Master Artisan has been assigned to your ticket and will respond directly to this email within 2 business hours.</p>
            <p style="font-size: 12px; color: #888; margin-top: 30px;">Atelier Belvedere Concierge Division</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.log("Support Ticket Email Dispatch Notice:", emailErr.message);
    }

    res.json({
      success: true,
      ticketId,
      message: `Your direct mail concern has been submitted successfully. Ticket #${ticketId} created.`,
      estimatedResponse: "Within 2 Hours"
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to log support ticket: " + err.message });
  }
});

app.post('/api/support/chat', async (req, res) => {
  try {
    const { query, user } = req.body;
    const cleanQuery = (query || "").toLowerCase();

    let reply = "Our Master Concierge is reviewing your inquiry. How else may we assist your journey?";
    let quickActions = [];

    if (cleanQuery.includes("order") || cleanQuery.includes("track") || cleanQuery.includes("delivery") || cleanQuery.includes("shipment")) {
      reply = user 
        ? `Greetings ${user.name.split(' ')[0]}. You can view your latest order acquisitions and real-time shipping journey directly in your Profile dashboard.` 
        : "To track your acquisition, please log in to your member account or provide your Order ID in the chat.";
      quickActions = ["View My Orders", "Track White-Glove Shipment", "Contact Dispatch"];
    } else if (cleanQuery.includes("bespoke") || cleanQuery.includes("fit") || cleanQuery.includes("custom") || cleanQuery.includes("tailor") || cleanQuery.includes("size")) {
      reply = "Our lead master tailors offer virtual and in-person bespoke consultations for custom measurements, silk selection, and silhouette drafting.";
      quickActions = ["Schedule Fitting", "View Size Chart", "Request Fabric Swatches"];
    } else if (cleanQuery.includes("return") || cleanQuery.includes("refund") || cleanQuery.includes("exchange")) {
      reply = "Ready-to-wear items can be returned within 14 days of receipt in pristine 'Vault' condition. Bespoke commissions undergo multi-stage fitting reviews.";
      quickActions = ["Initiate Return", "Read Policy", "Speak to Specialist"];
    } else {
      reply = `Thank you for your concern. We have noted: "${query}". Would you like to connect with a senior artisan directly or request a callback?`;
      quickActions = ["Request Immediate Callback", "Email Senior Specialist", "Browse Collection"];
    }

    res.json({ reply, quickActions, timestamp: new Date().toLocaleTimeString() });
  } catch (err) {
    res.status(500).json({ error: "Concierge temporarily busy." });
  }
});

// PUBLIC: GET all products (For Shop)
app.get('/api/products', async (req, res) => {
  try {
    const { category, department } = req.query;
    let query = {};
    if (category) query.category = category;
    if (department) query.department = department;
    
    const products = await Product.find(query).sort({ isFeatured: -1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
});

// NEW: GET single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// ADD product legacy support (Redirecting)
app.post('/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});
console.log("Upload route loaded ✅");
console.log("Upload route loaded ✅");
app.post("/api/upload", upload.single("image"), async (req, res) => {
  console.log("🔥 Upload route HIT");

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path);

    res.json({ imageUrl: result.secure_url });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});
// Simple test route
app.get('/', (req, res) => {
  res.send("Backend running with DB 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});




 

 