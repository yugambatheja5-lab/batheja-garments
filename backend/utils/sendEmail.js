const { Resend } = require('resend');
const nodemailer = require("nodemailer");

/**
 * Send transactional email using Nodemailer (Gmail SMTP) or Resend API
 */
const sendEmail = async ({ to, subject, html }) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Batheja Garments <onboarding@resend.dev>';
  
  console.log(`\n==================================================`);
  console.log(`📧 [EMAIL DISPATCH STEP 1] Initiating email dispatch to: ${to}`);
  console.log(`📧 [EMAIL DISPATCH STEP 2] EMAIL_USER present: ${!!process.env.EMAIL_USER}`);
  console.log(`📧 [EMAIL DISPATCH STEP 3] RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`);
  console.log(`==================================================\n`);

  // 1. Try Nodemailer (Gmail SMTP) if configured (works for all recipient addresses without domain restrictions)
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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });

      console.log(`📧 [NODEMAILER STEP 2] Sending email via SMTP from: ${process.env.EMAIL_USER}`);
      const result = await transporter.sendMail({
        from: `Batheja Garments <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ [NODEMAILER SUCCESS] Email delivered to ${to} (Message ID: ${result.messageId})`);
      return true;
    } catch (err) {
      console.error(`⚠️ [NODEMAILER ERROR] Gmail SMTP failed to send email to ${to}: ${err.message}`);
      if (err.stack) console.error(`⚠️ [NODEMAILER STACK TRACE]:`, err.stack);
      console.log(`⚠️ Proceeding to Resend API fallback...`);
    }
  } else {
    console.warn(`⚠️ [NODEMAILER SKIPPED] Gmail credentials (EMAIL_USER/EMAIL_PASS) missing in process.env`);
  }

  // 2. Try Resend API if API Key is configured
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
        console.error(`❌ [RESEND ERROR] Resend returned error object:`, JSON.stringify(error, null, 2));
        throw new Error(error.message || "Resend API Error");
      }

      console.log(`✅ [RESEND SUCCESS] Email delivered to ${to} (Message ID: ${data?.id})`);
      return true;
    } catch (err) {
      console.error(`❌ [RESEND ERROR] Resend dispatch failed: ${err.message}`);
      if (err.stack) console.error(`❌ [RESEND STACK TRACE]:`, err.stack);
    }
  } else {
    console.warn(`⚠️ [RESEND SKIPPED] RESEND_API_KEY is not defined in process.env`);
  }

  // 3. Local Dev / Testing Fallback
  console.log(`\n==================================================`);
  console.log(`📋 [DEV FALLBACK] Verification Email Details:`);
  console.log(`📋 [RECIPIENT] ${to}`);
  console.log(`📋 [SUBJECT] ${subject}`);
  console.log(`📋 [BODY PREVIEW] ${html.replace(/<[^>]*>?/gm, ' ').substring(0, 200)}...`);
  console.log(`==================================================\n`);

  if (!process.env.EMAIL_USER && !process.env.RESEND_API_KEY) {
    console.error(`❌ [CRITICAL EMAIL ERROR] Neither EMAIL_USER/EMAIL_PASS nor RESEND_API_KEY is set in environment variables!`);
  } else {
    console.error(`❌ [CRITICAL EMAIL ERROR] Email dispatch attempted via available providers, but both failed.`);
  }

  return false;
};

module.exports = sendEmail;

