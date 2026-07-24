const twilio = require('twilio');

const sendSMS = async ({ to, body }) => {
  const formattedPhone = to.startsWith('+') ? to : `+91${to}`;

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      throw new Error("Missing Twilio configuration in .env");
    }

    const client = new twilio(accountSid, authToken);

    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`✅ [TWILIO SUCCESS] SMS sent successfully to ${formattedPhone}. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`⚠️ [TWILIO WARNING] Failed to send real SMS via Twilio to ${formattedPhone}: ${error.message}`);
    console.log(`\n==================================================`);
    console.log(`📱 [DEV SMS DISPATCH LOG] Text Message Target: ${formattedPhone}`);
    console.log(`📱 [DEV SMS BODY] ${body}`);
    console.log(`==================================================\n`);
    return true; // Return true so registration/profile verification flow continues cleanly
  }
};

module.exports = sendSMS;
