// server/utils/sendOrderConfirmationEmail.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendOrderConfirmationEmail = async ({ email, programName, unlockedWeeks, renewalDate }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const templateId = Number(process.env.ORDER_CONFIRMATION_TEMPLATE_ID); // ✅ get templateId from env

  if (!apiKey) {
    console.error('❌ Brevo API key is missing.');
    return;
  }
  if (!templateId) {
    console.error('❌ Template ID is missing or invalid.');
    return;
  }
  if (!email) {
    console.error('❌ Recipient email is missing.');
    return;
  }

  const client = SibApiV3Sdk.ApiClient.instance;
  const apiKeyInstance = client.authentications['api-key'];
  apiKeyInstance.apiKey = apiKey;

  const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sender = { name: 'Raising The Bar', email: 'speedyhamza@outlook.com' }; // ✅ your verified sender email
  const receivers = [{ email }]; // ✅ using the passed email here

  const params = {
    program_name: programName,
    unlocked_weeks: unlockedWeeks,
    renewal_date: renewalDate ? renewalDate.toISOString().split('T')[0] : null,
    firstName: firstName
  };

  const sendSmtpEmail = {
    sender,
    to: receivers,
    templateId,
    params,
  };

  try {
    const data = await transactionalEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Order confirmation email sent:', data.messageId);
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error.response ? error.response.text : error);
  }
};

module.exports = sendOrderConfirmationEmail;