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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);

// Security Headers & Rate Limiting
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiter (Max 200 requests / 15 mins)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests from this IP address. Please try again after 15 minutes." }
});
app.use('/api/', generalLimiter);

// Auth Rate Limiter (Max 15 auth requests / 15 mins to prevent brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many authentication attempts. Rate limit exceeded. Please wait 15 minutes." }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/send-verification-otp', authLimiter);

// Password Reset Rate Limiter (Max 5 requests / 15 mins to prevent abuse)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset attempts. Please wait 15 minutes before trying again." }
});
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);

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
const { generateOTP, hashOTP, verifyOTPHash, isValidEmail, isValidPhone, validatePasswordStrength } = require('./utils/otpUtils');

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

// --- PRODUCTION SECURITY AUTH ROUTES ---

// 1. Send / Resend OTP (with 60-Second Cooldown Cooldown & Hashed Storage)
app.post('/api/auth/send-verification-otp', async (req, res) => {
  try {
    const { identifier, method } = req.body;
    if (!identifier) return res.status(400).json({ error: "Email or phone number is required" });

    const cleanIdentifier = identifier.toLowerCase().trim();
    const isEmail = method === 'email' || cleanIdentifier.includes('@');

    if (isEmail && !isValidEmail(cleanIdentifier)) {
      return res.status(400).json({ error: "Invalid Email format. Please provide a valid email (e.g. user@gmail.com)." });
    }
    if (!isEmail && !isValidPhone(cleanIdentifier)) {
      return res.status(400).json({ error: "Invalid Phone Number format. Please provide a valid mobile number." });
    }

    // ⏱️ Rate Limit Cooldown: Check if OTP was sent less than 60 seconds ago
    const existingOtp = await OTP.findOne({ identifier: cleanIdentifier });
    if (existingOtp) {
      const secondsSinceLast = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        const remainingSeconds = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({ 
          error: `Rate Limit: Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          retryAfterSeconds: remainingSeconds
        });
      }
    }

    const otpCode = generateOTP();
    const codeHash = await hashOTP(otpCode);

    await OTP.deleteOne({ identifier: cleanIdentifier });
    await new OTP({ identifier: cleanIdentifier, codeHash, attempts: 0, lastSentAt: new Date() }).save();

    if (isEmail) {
      try {
        const sendEmail = require('./utils/sendEmail');
        await sendEmail({
          to: cleanIdentifier,
          subject: "Batheja Garments - Security Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">Security Verification</h2>
              <p>Your 6-digit verification code to activate your account is:</p>
              <h1 style="background: #000; color: #d4af37; padding: 15px; border-radius: 8px; letter-spacing: 8px; text-align: center; font-size: 32px;">
                ${otpCode}
              </h1>
              <p style="font-size: 13px; color: #666;">This code expires in 5 minutes. Never share your verification code with anyone.</p>
            </div>
          `
        });
      } catch (e) {
        console.log(`[EMAIL OTP DISPATCH LOG]: Code for ${cleanIdentifier}: ${otpCode}`);
      }
    } else {
      try {
        const sendSMS = require('./utils/sendSMS');
        await sendSMS({
          to: cleanIdentifier,
          body: `Your Batheja Garments verification code is ${otpCode}. Expire in 5 min.`
        });
      } catch (e) {
        console.log(`[SMS OTP DISPATCH LOG]: Code for ${cleanIdentifier}: ${otpCode}`);
      }

      // 📧 EMAIL FALLBACK: Also dispatch verification code to user's registered Gmail address
      try {
        const existingUser = await User.findOne({ $or: [{ phone: cleanIdentifier }, { email: cleanIdentifier }] });
        if (existingUser && existingUser.email) {
          const sendEmail = require('./utils/sendEmail');
          await sendEmail({
            to: existingUser.email,
            subject: "Batheja Garments - Mobile Verification Code",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">Mobile Phone Verification</h2>
                <p>Your 6-digit verification code for mobile number <strong>${cleanIdentifier}</strong> is:</p>
                <h1 style="background: #000; color: #d4af37; padding: 15px; border-radius: 8px; letter-spacing: 8px; text-align: center; font-size: 32px;">
                  ${otpCode}
                </h1>
                <p style="font-size: 13px; color: #666;">This code expires in 5 minutes. Enter this code on your website to verify your mobile number.</p>
              </div>
            `
          });
        }
      } catch (emailErr) {
        console.log(`⚠️ [PHONE OTP EMAIL FALLBACK ERROR]: ${emailErr.message}`);
      }
    }

    res.json({ success: true, message: `Verification code generated for ${cleanIdentifier}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify Hashed OTP & Create Active User Account (Amazon Flow)
app.post('/api/auth/verify-registration-otp', async (req, res) => {
  try {
    const { identifier, otpCode } = req.body;
    console.log(`\n✅ [VERIFY OTP] OTP verification attempt for: ${identifier}`);
    
    if (!identifier || !otpCode) {
      console.log(`❌ [VERIFY OTP] Missing identifier or OTP code`);
      return res.status(400).json({ error: "Identifier and 6-digit OTP code are required" });
    }

    const cleanIdentifier = identifier.toLowerCase().trim();
    console.log(`✅ [VERIFY OTP] Looking up OTP record for: ${cleanIdentifier}`);
    
    const otpRecord = await OTP.findOne({ identifier: cleanIdentifier });
    if (!otpRecord) {
      console.log(`❌ [VERIFY OTP] OTP record not found or expired for: ${cleanIdentifier}`);
      return res.status(400).json({ error: "Verification code has expired. Please request a new OTP code." });
    }

    console.log(`✅ [VERIFY OTP] OTP record found. Attempts: ${otpRecord.attempts}/5`);

    // 🔒 Brute-force Prevention: Max 5 attempts per OTP
    if (otpRecord.attempts >= 5) {
      console.log(`❌ [VERIFY OTP] Max attempts exceeded (${otpRecord.attempts}/5) - blocking user`);
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ error: "Security Alert: Maximum failed OTP attempts exceeded. Please request a new OTP code." });
    }

    console.log(`✅ [VERIFY OTP] Comparing provided OTP against stored hash...`);
    const isValid = await verifyOTPHash(otpCode.trim(), otpRecord.codeHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      console.log(`❌ [VERIFY OTP] Invalid OTP - attempt ${otpRecord.attempts}/5. Remaining: ${remaining}`);
      return res.status(400).json({ error: `Invalid 6-digit code. ${remaining} attempt(s) remaining.` });
    }

    console.log(`✅ [VERIFY OTP] OTP verified successfully! ✓`);

    let user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { phone: cleanIdentifier }]
    });

    // Amazon-Style: If user doesn't exist yet, create account NOW from pendingUserData
    if (!user) {
      console.log(`👤 [VERIFY OTP] User doesn't exist - creating new account from pending data...`);
      
      if (!otpRecord.pendingUserData) {
        console.log(`❌ [VERIFY OTP] No pending user data found - session expired`);
        return res.status(400).json({ error: "Registration session expired. Please sign up again." });
      }
      
      user = new User({
        ...otpRecord.pendingUserData,
        isVerified: true,
        emailVerified: cleanIdentifier.includes('@'),
        phoneVerified: !cleanIdentifier.includes('@'),
        verificationStatus: 'verified',
        lastLogin: new Date()
      });
      await user.save();
      console.log(`✅ [VERIFY OTP] NEW USER ACCOUNT CREATED: ${user.email || user.phone}`);
    } else {
      console.log(`👤 [VERIFY OTP] User already exists - updating verification status...`);
      user.isVerified = true;
      user.verificationStatus = 'verified';
      if (cleanIdentifier.includes('@')) user.emailVerified = true;
      else user.phoneVerified = true;
      user.lastLogin = new Date();
      await user.save();
      console.log(`✅ [VERIFY OTP] User verification status updated`);
    }

    await OTP.deleteOne({ _id: otpRecord._id });
    console.log(`💾 [VERIFY OTP] OTP record deleted (one-time use)`);

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`🎫 [VERIFY OTP] JWT token generated - user auto-logged in`);
    
    res.json({
      success: true,
      message: "Account verified & activated successfully!",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        verificationStatus: user.verificationStatus || 'verified'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Production Signup (Strict Email Verification & Zero DB Creation Until OTP Verified)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, age, gender } = req.body;
    console.log(`\n📝 [SIGNUP] Request received for email: ${email}`);

    if (!name || !name.trim()) {
      console.log(`❌ [SIGNUP] Name is required`);
      return res.status(400).json({ error: "Full Name is required" });
    }
    console.log(`📝 [SIGNUP] Name validated: ${name.trim()}`);
    
    // Rule 4: Gmail/Email ID must be a valid email (checked before issuing or sending code)
    if (!email || !isValidEmail(email)) {
      console.log(`❌ [SIGNUP] Invalid email format: ${email}`);
      return res.status(400).json({ error: "Invalid Email address. Please enter a valid email address (e.g. name@gmail.com)." });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`📝 [SIGNUP] Email validated: ${cleanEmail}`);
    
    let existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      console.log(`❌ [SIGNUP] Email already exists in DB: ${cleanEmail}`);
      return res.status(400).json({ error: "An account with this Email address already exists. Please log in instead." });
    }

    // Check Confirm Password
    if (confirmPassword !== undefined && password !== confirmPassword) {
      console.log(`❌ [SIGNUP] Passwords do not match`);
      return res.status(400).json({ error: "Passwords do not match. Please ensure Password and Confirm Password are identical." });
    }

    // Enforce Strong Password Policy
    const passCheck = validatePasswordStrength(password);
    if (!passCheck.valid) {
      console.log(`❌ [SIGNUP] Password validation failed: ${passCheck.message}`);
      return res.status(400).json({ error: passCheck.message });
    }
    console.log(`📝 [SIGNUP] Password strength validated ✓`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`🔐 [SIGNUP] Password hashed`);

    const role = getRoleForEmail(cleanEmail);
    const isAutoVerified = role === "admin";
    console.log(`👤 [SIGNUP] User role determined: ${role} (auto-verified: ${isAutoVerified})`);

    // Auto-verify official admin email if configured
    if (isAutoVerified) {
      console.log(`⚡ [SIGNUP] Auto-verifying admin account...`);
      const user = new User({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        age: age ? parseInt(age) : undefined,
        gender: gender || 'Prefer Not to Say',
        role,
        isVerified: true,
        emailVerified: true,
        phoneVerified: false,
        verificationStatus: 'verified'
      });
      await user.save();
      console.log(`✅ [SIGNUP] Admin account created immediately: ${cleanEmail}`);
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true, verificationStatus: 'verified' } });
    }

    // Rule 2 & 3: Store pending registration details inside OTP document without saving to User database yet!
    const targetIdentifier = cleanEmail;
    console.log(`📝 [SIGNUP] Sending OTP to valid email → ${targetIdentifier}`);

    const otpCode = generateOTP();
    console.log(`🔐 [SIGNUP] Cryptographic 6-digit OTP generated: ${otpCode}`);
    
    const codeHash = await hashOTP(otpCode);

    const pendingUserData = {
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      age: age ? parseInt(age) : undefined,
      gender: gender || 'Prefer Not to Say',
      role
    };

    await OTP.deleteOne({ identifier: targetIdentifier });
    await new OTP({
      identifier: targetIdentifier,
      codeHash,
      attempts: 0,
      lastSentAt: new Date(),
      pendingUserData
    }).save();
    console.log(`💾 [SIGNUP] Pending user data stored in OTP collection (User NOT created in DB until OTP verified)`);

    // Dispatch email with 6-digit code
    try {
      console.log(`📧 [SIGNUP] Attempting email dispatch via Resend/SMTP to: ${cleanEmail}`);
      const sendEmail = require('./utils/sendEmail');
      await sendEmail({
        to: cleanEmail,
        subject: "Batheja Garments - Your Security Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">Welcome to Batheja Garments</h2>
            <p>Your 6-digit verification code to activate your account is:</p>
            <h1 style="background: #000; color: #d4af37; padding: 15px; border-radius: 8px; letter-spacing: 8px; text-align: center; font-size: 32px;">
              ${otpCode}
            </h1>
            <p style="font-size: 13px; color: #666;">This code expires in 5 minutes. Never share this code with anyone.</p>
          </div>
        `
      });
      console.log(`📧 [SIGNUP] Verification email dispatched successfully to ${cleanEmail}`);
    } catch (e) {
      console.error(`❌ [SIGNUP EMAIL DISPATCH ERROR]: ${e.message}`);
      console.log(`📋 [LOCAL DEV LOG] Verification Code for ${cleanEmail}: ${otpCode}`);
    }

    console.log(`✅ [SIGNUP] OTP process initialized - awaiting email verification code`);
    res.json({
      requireOtp: true,
      identifier: targetIdentifier,
      verificationMethod: 'email',
      message: `Verification code sent to ${cleanEmail}! Please enter the 6-digit code sent to your email inbox.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Production Login (Rule 1: Only users with an existing account in DB are allowed to log in)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { loginId, email, password } = req.body;
    const identifier = (email || loginId || "").toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: "Email Address and Password are required." });
    }

    // Rule 1: Check if user exists in database
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email address. Please sign up first to create an account." });
    }

    // 🔒 Account Lockout Check (15 Minutes Lockout after 5 failed attempts)
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.accountLockedUntil).getTime() - Date.now()) / (1000 * 60));
      return res.status(423).json({
        error: `Security Lockout: Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
        await user.save();
        return res.status(423).json({
          error: "Security Alert: Account has been locked for 15 minutes due to 5 consecutive failed password attempts."
        });
      }
      await user.save();
      const attemptsLeft = 5 - user.failedLoginAttempts;
      return res.status(401).json({ error: `Incorrect password. ${attemptsLeft} attempt(s) remaining before account lockout.` });
    }

    // Reset failed login count upon successful password check
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    // Check account status
    if (user.verificationStatus === 'disabled') {
      return res.status(403).json({ error: "Account Suspended: Your account has been disabled by Administrator." });
    }

    // Auto-verify official admin accounts
    const expectedRole = getRoleForEmail(user.email);
    if (expectedRole === "admin" && user.role !== "admin") {
      user.role = "admin";
      user.isVerified = true;
      user.verificationStatus = 'verified';
    }

    // Enforce Email Verification Check (Amazon-Style Production Rule)
    if (user.emailVerified !== true && user.role !== "admin") {
      const otpCode = generateOTP();
      const codeHash = await hashOTP(otpCode);

      await OTP.deleteOne({ identifier: user.email });
      await new OTP({ identifier: user.email, codeHash, attempts: 0, lastSentAt: new Date() }).save();

      try {
        const sendEmail = require('./utils/sendEmail');
        await sendEmail({
          to: user.email,
          subject: "Batheja Garments - Verify Your Account",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">Account Verification Required</h2>
              <p>Please use the 6-digit verification code below to verify your email address:</p>
              <h1 style="background: #000; color: #d4af37; padding: 15px; border-radius: 8px; letter-spacing: 8px; text-align: center; font-size: 32px;">
                ${otpCode}
              </h1>
              <p style="font-size: 13px; color: #666;">This code expires in 5 minutes.</p>
            </div>
          `
        });
      } catch (e) {}

      return res.status(403).json({
        error: "Please verify your email before logging in.",
        requireOtp: true,
        identifier: user.email
      });
    }


    // Record Login History & Last Login Date
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    user.lastLogin = new Date();
    user.loginHistory.push({
      timestamp: new Date(),
      ip: clientIp ? clientIp.toString() : 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
    // Keep last 20 login history records max
    if (user.loginHistory.length > 20) user.loginHistory.shift();

    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: true,
        verificationStatus: 'verified',
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Password Reset Request (Email or SMS OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "Email or Phone number is required" });

    console.log(`\n🔐 [FORGOT PASSWORD] Request received for: ${identifier}`);
    const cleanIdentifier = identifier.toLowerCase().trim();
    
    console.log(`🔐 [FORGOT PASSWORD] Searching for user with identifier: ${cleanIdentifier}`);
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { phone: cleanIdentifier }]
    });

    if (!user) return res.status(404).json({ error: "No account found registered with that Email or Phone number." });

    console.log(`🔐 [FORGOT PASSWORD] User found: ${user.email || user.phone}`);
    const otpCode = generateOTP();
    console.log(`🔐 [FORGOT PASSWORD] OTP Generated: ${otpCode}`);
    
    const codeHash = await hashOTP(otpCode);

    await OTP.deleteOne({ identifier: cleanIdentifier });
    await new OTP({ identifier: cleanIdentifier, codeHash, attempts: 0, lastSentAt: new Date() }).save();
    console.log(`🔐 [FORGOT PASSWORD] OTP Hash stored in database`);

    const isEmail = cleanIdentifier.includes('@');
    console.log(`🔐 [FORGOT PASSWORD] Delivery method: ${isEmail ? 'EMAIL' : 'SMS'}`);
    
    if (isEmail) {
      try {
        console.log(`📧 [FORGOT PASSWORD] Attempting to send email to: ${user.email}`);
        const sendEmail = require('./utils/sendEmail');
        await sendEmail({
          to: user.email,
          subject: "Batheja Garments - Password Reset Code",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #000; text-transform: uppercase;">Password Reset Request</h2>
              <p>Your 6-digit secure password reset code is:</p>
              <h1 style="background: #f0f0f0; padding: 15px; border-radius: 8px; letter-spacing: 8px; text-align: center; font-size: 32px; color: #ff4d4d;">
                ${otpCode}
              </h1>
              <p>This code will expire in 5 minutes.</p>
            </div>
          `
        });
        console.log(`📧 [FORGOT PASSWORD] Email sent successfully to ${user.email}`);
      } catch (e) {
        console.error(`❌ [FORGOT PASSWORD EMAIL ERROR]: ${e.message}`);
        console.log(`📋 [PASSWORD RESET OTP CONSOLE LOG]: Code for ${cleanIdentifier}: ${otpCode}`);
      }
    } else {
      try {
        console.log(`📱 [FORGOT PASSWORD] Attempting to send SMS to: ${user.phone}`);
        const sendSMS = require('./utils/sendSMS');
        await sendSMS({ to: user.phone, body: `Your Batheja Garments password reset OTP code is ${otpCode}. Expire in 5 min.` });
        console.log(`📱 [FORGOT PASSWORD] SMS sent successfully to ${user.phone}`);
      } catch (e) {
        console.error(`❌ [FORGOT PASSWORD SMS ERROR]: ${e.message}`);
        console.log(`📋 [PASSWORD RESET OTP CONSOLE LOG]: Code for ${cleanIdentifier}: ${otpCode}`);
      }
    }

    res.json({ success: true, message: `Password reset code sent to ${cleanIdentifier}` });
  } catch (err) {
    console.error(`❌ [FORGOT PASSWORD ENDPOINT ERROR]: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 6. Reset Password Verification
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { identifier, otpCode, newPassword } = req.body;
    console.log(`\n🔐 [RESET PASSWORD] Request received for: ${identifier}`);
    
    if (!identifier || !otpCode || !newPassword) {
      console.log(`❌ [RESET PASSWORD] Missing required fields`);
      return res.status(400).json({ error: "Identifier, OTP code, and new password are required." });
    }

    console.log(`🔐 [RESET PASSWORD] Validating password strength...`);
    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.valid) {
      console.log(`❌ [RESET PASSWORD] Password validation failed: ${passCheck.message}`);
      return res.status(400).json({ error: passCheck.message });
    }

    const cleanIdentifier = identifier.toLowerCase().trim();
    console.log(`🔐 [RESET PASSWORD] Looking up OTP for: ${cleanIdentifier}`);
    const otpRecord = await OTP.findOne({ identifier: cleanIdentifier });
    if (!otpRecord) {
      console.log(`❌ [RESET PASSWORD] OTP not found or expired`);
      return res.status(400).json({ error: "Invalid or expired reset code." });
    }

    console.log(`🔐 [RESET PASSWORD] Verifying OTP hash...`);
    const isValid = await verifyOTPHash(otpCode.trim(), otpRecord.codeHash);
    if (!isValid) {
      console.log(`❌ [RESET PASSWORD] OTP verification failed`);
      return res.status(400).json({ error: "Invalid 6-digit reset code." });
    }

    console.log(`🔐 [RESET PASSWORD] OTP verified! Finding user...`);
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { phone: cleanIdentifier }]
    });
    if (!user) {
      console.log(`❌ [RESET PASSWORD] User not found`);
      return res.status(404).json({ error: "User account not found." });
    }

    console.log(`🔐 [RESET PASSWORD] Hashing new password...`);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    user.isVerified = true;
    user.verificationStatus = 'verified';
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });
    console.log(`✅ [RESET PASSWORD] Password updated successfully for: ${user.email || user.phone}`);

    res.json({ success: true, message: "Password reset successful! You can now log in with your new password." });
  } catch (err) {
    console.error(`❌ [RESET PASSWORD ERROR]: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Profile (Re-verifies if Email or Phone changes)
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name && name.trim()) user.name = name.trim();

    let requireReVerification = false;

    if (email && email.toLowerCase().trim() !== user.email) {
      const cleanEmail = email.toLowerCase().trim();
      if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: "Invalid Email format" });
      const taken = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ error: "Email already taken by another account" });

      user.email = cleanEmail;
      user.emailVerified = false;
      requireReVerification = true;
    }

    if (phone && phone.trim() !== (user.phone || '')) {
      const cleanPhone = phone.trim();
      if (!isValidPhone(cleanPhone)) return res.status(400).json({ error: "Invalid Phone format" });
      const taken = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ error: "Phone number already taken by another account" });

      user.phone = cleanPhone;
      user.phoneVerified = false;
      requireReVerification = true;
    }

    if (requireReVerification) {
      // Only set to unverified if BOTH email and phone are unverified
      if (!user.emailVerified && !user.phoneVerified) {
        user.isVerified = false;
        user.verificationStatus = 'unverified';
      }
    } else {
      user.isVerified = true;
      user.verificationStatus = 'verified';
    }

    await user.save();
    res.json({
      success: true,
      message: requireReVerification ? "Profile updated! Re-verification required for updated contact details." : "Profile updated successfully!",
      requireReVerification,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me - Fetch authenticated user details (Preserves permanent verified status)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified || user.verificationStatus === 'verified' || user.emailVerified || user.phoneVerified,
      emailVerified: user.emailVerified ?? true,
      phoneVerified: user.phoneVerified ?? true,
      verificationStatus: user.verificationStatus || 'verified',
      lastLogin: user.lastLogin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Admin User Security Directory & Status Management
app.get('/api/admin/users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const stats = {
      total: users.length,
      verified: users.filter(u => u.verificationStatus === 'verified' || u.isVerified).length,
      unverified: users.filter(u => u.verificationStatus === 'unverified' && !u.isVerified).length,
      disabled: users.filter(u => u.verificationStatus === 'disabled').length
    };
    res.json({ stats, users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user directory" });
  }
});

app.patch('/api/admin/users/:id/status', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    if (!['verified', 'unverified', 'disabled'].includes(verificationStatus)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const isVerified = verificationStatus === 'verified';
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { verificationStatus, isVerified, emailVerified: isVerified, phoneVerified: isVerified },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user status" });
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




 

 