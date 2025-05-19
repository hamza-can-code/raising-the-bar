// server/routes/webhook.js
const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const User = require('../models/User');
const UserAccess = require('../models/UserAccess');
const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/* Stripe requires the raw body exactly as it arrives */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    /* 0️⃣ Verify signature */
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        endpointSecret
      );
    } catch (err) {
      console.error('❌  Bad webhook signature:', err.message);
      return res.sendStatus(400);
    }

    /******************************************************************
     * 1️⃣  CHECKOUT COMPLETE  (new purchase)
     *****************************************************************/
    if (event.type === 'checkout.session.completed') {
      /* A) Pull full session (need price + subscription id) */
      const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
        expand: ['line_items', 'subscription']
      });

      const email = session.customer_details?.email || session.customer_email;
      console.log('✅ checkout.session.completed →', email);

      /* B) mark user “paid”, if you still track that */
      const user = await User.findOneAndUpdate(
        { email },
        { isPaid: true },
        { new: true }
      );
      if (!user) {
        console.warn('⚠️  No user found for', email);
        return res.sendStatus(200);
      }

      /* C) work out WHAT they bought */
      const priceId = session.line_items.data[0].price.id;
      let unlockedWeeks = 0;
      let isSubscription = false;

      if (priceId === process.env.PRICE_1_WEEK) unlockedWeeks = 1;
      else if (priceId === process.env.PRICE_4_WEEK) unlockedWeeks = 4;
      else if (priceId === process.env.PRICE_12_WEEK) unlockedWeeks = 12;
      else if (priceId === process.env.FULL_PRICE_ID) {
        unlockedWeeks = 4;          // first block on sign-up
        isSubscription = true;
      } else {
        console.warn('⚠️  Unknown priceId:', priceId);
      }

      /* D) Upsert UserAccess  */
      const update = {
        $inc: { unlockedWeeks },
        $set: {}
      };
      if (isSubscription) {
        update.$set.subscriptionId = session.subscription.id;
        update.$set.subscriptionStatus = 'active';
        update.$set.renewalDate = new Date();          // now
      }

      const ua = await UserAccess.findOneAndUpdate(
        { userId: user._id },
        update,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log('🔐 UserAccess saved → weeks:', ua.unlockedWeeks,
        'subId:', ua.subscriptionId);

      /* E) confirmation e-mail (optional) */
      try {
        await sendOrderConfirmationEmail({
          email,
          programName: isSubscription
            ? 'Pro Tracker Subscription'
            : `${unlockedWeeks}-Week Program`,
          unlockedWeeks,
          renewalDate: isSubscription ? ua.renewalDate : null,
          firstName: user.name?.split(' ')[0] || 'There' // ✅ extract first name here
        });
        console.log('📨 Attempting to send order confirmation to:', email);
        console.log('📧  Confirmation e-mail sent');
      } catch (err) {
        console.error('📧  sendOrderConfirmationEmail failed:', err.message);
      }
    }

    /******************************************************************
     * 2️⃣  SUBSCRIPTION RENEWAL  (Stripe fires invoice.payment_succeeded)
     *****************************************************************/
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;   // will be undefined for one-off invoices

      /* ignore one-off (non-subscription) invoices */
      if (!subscriptionId) return res.sendStatus(200);

      console.log('🔄  invoice.payment_succeeded →', subscriptionId);

      const ua = await UserAccess.findOne({ subscriptionId });
      if (!ua) {
        console.warn('⚠️  No UserAccess for', subscriptionId);
      } else {
        ua.unlockedWeeks += 4;
        ua.renewalDate = new Date(invoice.lines.data[0].period.end * 1000);
        await ua.save();
        console.log('➕  Added 4 weeks → now', ua.unlockedWeeks);
      }
    }

    /* Stripe expects only 2xx so it won’t retry */
    res.sendStatus(200);
  }
);

module.exports = router;
