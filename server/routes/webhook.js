// server/routes/webhook.js
const express       = require('express');
const Stripe        = require('stripe');
const User          = require('../models/User');
const UserAccess    = require('../models/UserAccess');  // ← NEW
const router        = express.Router();

const stripe         = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ── Webhook endpoint for Stripe events ────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // raw body needed for signature check
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.sendStatus(400);
    }

    // ── 1) PURCHASE COMPLETED ──────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session       = event.data.object;
      console.log('🔎 Full session object:', JSON.stringify(session, null, 2));
      const customerEmail =
      session.customer_email || (session.customer_details && session.customer_details.email);
      console.log('✅ Webhook received:', event.type, '| Email:', customerEmail);

      // Mark user as paid (existing)
      let user;
      try {
        user = await User.findOneAndUpdate(
          { email: customerEmail },
          { isPaid: true },
          { new: true }
        );
        if (user) {
          console.log('✅ User marked as paid:', user.email);
        } else {
          console.warn('⚠️  No matching user found for email:', customerEmail);
        }
      } catch (err) {
        console.error('❌ Error updating user status:', err.message);
      }

      // ── NEW: Give them 4 unlocked weeks on first purchase ───────────────
      if (user) {
        try {
          // only create one access record
          let access = await UserAccess.findOne({ userId: user._id });
          if (!access) {
            await UserAccess.create({
              userId:            user._id,
              subscriptionId:    session.subscription, // stripe subscription id
              unlockedWeeks:     4,
              subscriptionStatus:'active',
              renewalDate:       new Date()
            });
            console.log('✅ UserAccess created with 4 weeks unlocked');
          }
        } catch (err) {
          console.error('❌ Error creating UserAccess:', err);
        }
      }
    }

    // ── 2) RENEWAL (SUBSCRIPTION RENEWED) ─────────────────────────────────
    if (event.type === 'invoice.paid') {
      const invoice        = event.data.object;
      const subscriptionId = invoice.subscription;
      console.log('🔄 Subscription renewed:', subscriptionId);

      try {
        const access = await UserAccess.findOne({ subscriptionId });
        if (access) {
          access.unlockedWeeks += 4;
          // Stripe's invoice.lines.data[0].period.end is a timestamp (in seconds)
          access.renewalDate = new Date(invoice.lines.data[0].period.end * 1000);
          await access.save();
          console.log('✅ Added 4 more weeks; total now:', access.unlockedWeeks);
        } else {
          console.warn('⚠️ No UserAccess found for subscription:', subscriptionId);
        }
      } catch (err) {
        console.error('❌ Error updating UserAccess on renewal:', err);
      }
    }

    // ── Acknowledge receipt of **all** events ──────────────────────────────
    res.sendStatus(200);
  }
);

module.exports = router;
