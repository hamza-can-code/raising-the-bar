require('dotenv').config();  // ✅ ADD THIS LINE
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCoupon() {
  const coupon = await stripe.coupons.create({
    name: 'First Month £9.99',
    percent_off: 66.7, // Drops £29.99 to ~£9.99
    duration: 'once',
  });
  console.log('✅ Coupon created:', coupon.id);
}

createCoupon();
