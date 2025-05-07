// // server/routes/webhook.js
// const express = require('express');
// const Stripe = require('stripe');
// const User = require('../models/User');
// const UserAccess = require('../models/UserAccess');  // ← already imported
// const router = express.Router();
// const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       console.error('❌ Webhook signature verification failed:', err.message);
//       return res.sendStatus(400);
//     }

//     // ── 1) PURCHASE COMPLETED ──────────────────────────────────────────────
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object;
//       console.log('🔎 Full session object (basic):', JSON.stringify(session, null, 2));

//       // ✅ NEW: Fetch full session WITH line_items expanded
//       let fullSession;
//       try {
//         fullSession = await stripe.checkout.sessions.retrieve(session.id, {
//           expand: ['line_items'],
//         });
//         console.log('🛒 Full session object (expanded):', JSON.stringify(fullSession, null, 2));
//       } catch (err) {
//         console.error('❌ Error fetching full session:', err);
//         return res.sendStatus(500);
//       }

//       const customerEmail =
//         fullSession.customer_email || (fullSession.customer_details && fullSession.customer_details.email);
//       console.log('✅ Webhook received:', event.type, '| Email:', customerEmail);

//       // Mark user as paid
//       let user;
//       try {
//         user = await User.findOneAndUpdate(
//           { email: customerEmail },
//           { isPaid: true },
//           { new: true }
//         );
//         if (user) {
//           console.log('✅ User marked as paid:', user.email);
//         } else {
//           console.warn('⚠️  No matching user found for email:', customerEmail);
//         }
//       } catch (err) {
//         console.error('❌ Error updating user status:', err.message);
//       }

//       // ── Identify product purchased ─────────────────────────────────────
//       if (user) {
//         try {
//           const priceId = fullSession.line_items?.data?.[0]?.price?.id;
//           console.log('🛒 Purchased priceId:', priceId);

//           let unlockedWeeks = 0;
//           let isSubscription = false;

//           if (priceId === process.env.PRICE_1_WEEK) {
//             unlockedWeeks = 1;
//           } else if (priceId === process.env.PRICE_4_WEEK) {
//             unlockedWeeks = 4;
//           } else if (priceId === process.env.PRICE_12_WEEK) {
//             unlockedWeeks = 12;
//           } else if (priceId === process.env.FULL_PRICE_ID) {
//             unlockedWeeks = 4;
//             isSubscription = true;
//           } else {
//             console.warn('⚠️ Unknown price ID:', priceId);
//           }

//           // ✅ Updated section starts here
//           let access = await UserAccess.findOne({ userId: user._id });

//           if (!access) {
//             await UserAccess.create({
//               userId: user._id,
//               subscriptionId: isSubscription ? session.subscription : null,
//               unlockedWeeks: unlockedWeeks,
//               subscriptionStatus: isSubscription ? 'active' : null,
//               renewalDate: isSubscription ? new Date() : null
//             });
//             console.log(`✅ UserAccess created with ${unlockedWeeks} weeks unlocked`);
//           } else {
//             console.log('ℹ️ UserAccess already exists for this user');
//           }

//           // ✅ Always send the confirmation email (whether access is new or existing)
//           try {
//             await sendOrderConfirmationEmail({
//               email: customerEmail,
//               programName: isSubscription
//                 ? 'Pro Tracker Subscription'
//                 : `${unlockedWeeks}-Week Program`,
//               unlockedWeeks,
//               renewalDate: isSubscription ? new Date() : null
//             });
//             console.log('✅ Confirmation email sent to:', customerEmail);
//           } catch (err) {
//             console.error('❌ Error sending confirmation email:', err.message);
//           }
//           // ✅ Updated section ends here

//         } catch (err) {
//           console.error('❌ Error creating UserAccess:', err);
//         }
//       }
//     }

//     // ── 2) RENEWAL (SUBSCRIPTION RENEWED) ─────────────────────────────────
//     if (event.type === 'invoice.paid') {
//       const invoice = event.data.object;
//       const subscriptionId = invoice.subscription;
//       console.log('🔄 Subscription renewed:', subscriptionId);

//       try {
//         const access = await UserAccess.findOne({ subscriptionId });
//         if (access) {
//           access.unlockedWeeks += 4;
//           access.renewalDate = new Date(invoice.lines.data[0].period.end * 1000);
//           await access.save();
//           console.log('✅ Added 4 more weeks; total now:', access.unlockedWeeks);
//         } else {
//           console.warn('⚠️ No UserAccess found for subscription:', subscriptionId);
//         }
//       } catch (err) {
//         console.error('❌ Error updating UserAccess on renewal:', err);
//       }
//     }

//     res.sendStatus(200);
//   }
// );

// module.exports = router;

// server/routes/webhook.js
const express = require('express');
const Stripe  = require('stripe');
const router  = express.Router();

const User       = require('../models/User');
const UserAccess = require('../models/UserAccess');
const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

const stripe         = new Stripe(process.env.STRIPE_SECRET_KEY);
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
      let unlockedWeeks  = 0;
      let isSubscription = false;

      if (priceId === process.env.PRICE_1_WEEK)        unlockedWeeks = 1;
      else if (priceId === process.env.PRICE_4_WEEK)   unlockedWeeks = 4;
      else if (priceId === process.env.PRICE_12_WEEK)  unlockedWeeks = 12;
      else if (priceId === process.env.FULL_PRICE_ID) {
        unlockedWeeks  = 4;          // first block on sign-up
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
        update.$set.subscriptionId     = session.subscription.id;
        update.$set.subscriptionStatus = 'active';
        update.$set.renewalDate        = new Date();          // now
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
          programName : isSubscription
            ? 'Pro Tracker Subscription'
            : `${unlockedWeeks}-Week Program`,
          unlockedWeeks,
          renewalDate : isSubscription ? ua.renewalDate : null
        });
        console.log('📧  Confirmation e-mail sent');
      } catch (err) {
        console.error('📧  sendOrderConfirmationEmail failed:', err.message);
      }
    }

    /******************************************************************
     * 2️⃣  SUBSCRIPTION RENEWAL  (Stripe fires invoice.payment_succeeded)
     *****************************************************************/
    if (event.type === 'invoice.payment_succeeded') {
      const invoice        = event.data.object;
      const subscriptionId = invoice.subscription;   // will be undefined for one-off invoices
    
      /* ignore one-off (non-subscription) invoices */
      if (!subscriptionId) return res.sendStatus(200);

      console.log('🔄  invoice.payment_succeeded →', subscriptionId);

      const ua = await UserAccess.findOne({ subscriptionId });
      if (!ua) {
        console.warn('⚠️  No UserAccess for', subscriptionId);
      } else {
        ua.unlockedWeeks += 4;
        ua.renewalDate    = new Date(invoice.lines.data[0].period.end * 1000);
        await ua.save();
        console.log('➕  Added 4 weeks → now', ua.unlockedWeeks);
      }
    }

    /* Stripe expects only 2xx so it won’t retry */
    res.sendStatus(200);
  }
);

module.exports = router;
