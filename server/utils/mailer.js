// server/utils/mailer.js
async function sendReceiptEmail({ to, amount, currency, periodKey }) {
  // TODO: integrate your email provider
  console.log(`[mail] Receipt -> ${to}: ${currency} ${amount} for ${periodKey}`);
}

async function sendDunningEmail({ to, amount, currency }) {
  // TODO: integrate your email provider
  console.log(`[mail] Dunning -> ${to}: ${currency} ${amount} payment failed`);
}

module.exports = { sendReceiptEmail, sendDunningEmail };
