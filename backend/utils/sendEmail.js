const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  // Configured exclusively for standard Gmail App Passwords
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Batheja Garments <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Failed to send email to ${to}:`, error.message);
    throw new Error("Failed to send OTP email. Mail server error.");
  }
};

module.exports = sendEmail;
