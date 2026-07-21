const twilio = require('twilio');

const sendSMS = async ({ to, body }) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      throw new Error("Missing Twilio configuration in .env");
    }

    const client = new twilio(accountSid, authToken);

    // Hard-coding the +91 country code for Indian Phone Numbers specifically 
    // to prevent users from accidentally failing by just typing 10 digits
    const formattedPhone = to.startsWith('+') ? to : `+91${to}`;

    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`[SUCCESS] SMS sent successfully to ${formattedPhone}. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Failed to send SMS to ${to}:`, error.message);
    throw new Error("Failed to dispatch text message via Twilio.");
  }
};

module.exports = sendSMS;
