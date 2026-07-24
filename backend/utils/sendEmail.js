const { Resend } = require('resend');
const nodemailer = require("nodemailer");

/**
 * Send transactional email using Resend API (Primary) or Nodemailer (Fallback)
 */
const sendEmail = async ({ to, subject, html }) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Batheja Garments <onboarding@resend.dev>';
  
  console.log(`\n==================================================`);
  console.log(`📧 [EMAIL DISPATCH STEP 1] Initiating email dispatch to: ${to}`);
  console.log(`📧 [EMAIL DISPATCH STEP 2] RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`);
  console.log(`📧 [EMAIL DISPATCH STEP 3] EMAIL_USER present: ${!!process.env.EMAIL_USER}`);
  console.log(`==================================================\n`);

  // 1. Try Resend API if API Key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`📧 [RESEND STEP 1] Initializing Resend client...`);
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      console.log(`📧 [RESEND STEP 2] Sending email from: ${fromEmail} to: ${to}`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error(`❌ [RESEND STEP 3 - ERROR] Resend returned error object:`, JSON.stringify(error, null, 2));
        throw new Error(error.message || "Resend API Error");
      }

      console.log(`✅ [RESEND STEP 4 - SUCCESS] Email successfully delivered to ${to} (Message ID: ${data?.id})`);
      return true;
    } catch (err) {
      console.error(`⚠️ [RESEND STEP 4 - WARNING] Resend dispatch failed: ${err.message}`);
      if (err.stack) console.error(`⚠️ [RESEND STACK TRACE]:`, err.stack);
      console.log(`⚠️ [RESEND ATTEMPT COMPLETED] Proceeding to Nodemailer fallback...`);
    }
  } else {
    console.warn(`⚠️ [RESEND SKIPPED] RESEND_API_KEY is not defined in process.env`);
  }

  // 2. Fallback to Nodemailer if Gmail credentials configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      console.log(`📧 [NODEMAILER STEP 1] Initializing Gmail Nodemailer transporter...`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        // Strict connection timeouts to prevent browser request from hanging
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      });

      console.log(`📧 [NODEMAILER STEP 2] Attempting to send email via SMTP from: ${process.env.EMAIL_USER}`);
      const result = await transporter.sendMail({
        from: `Batheja Garments <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ [NODEMAILER STEP 3 - SUCCESS] Email sent via Nodemailer to ${to}`, result.messageId);
      return true;
    } catch (err) {
      console.error(`❌ [NODEMAILER STEP 3 - ERROR] Nodemailer failed to send email to ${to}: ${err.message}`);
      if (err.stack) console.error(`❌ [NODEMAILER STACK TRACE]:`, err.stack);
    }
  } else {
    console.warn(`⚠️ [NODEMAILER SKIPPED] Gmail credentials (EMAIL_USER/EMAIL_PASS) missing in process.env`);
  }

  // 3. Development / Localhost Fallback: Print OTP clearly to console
  console.log(`\n==================================================`);
  console.log(`📋 [DEV FALLBACK] Verification Email Details:`);
  console.log(`📋 [RECIPIENT] ${to}`);
  console.log(`📋 [SUBJECT] ${subject}`);
  console.log(`📋 [BODY PREVIEW] ${html.replace(/<[^>]*>?/gm, ' ').substring(0, 200)}...`);
  console.log(`==================================================\n`);
  return true;
};

module.exports = sendEmail;

