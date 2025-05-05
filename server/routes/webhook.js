// // server/routes/webhook.js
// const express       = require('express');
// const Stripe        = require('stripe');
// const User          = require('../models/User');
// const UserAccess    = require('../models/UserAccess');
// const router        = express.Router();

// const stripe         = new Stripe(process.env.STRIPE_SECRET_KEY);
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// // ── Webhook endpoint for Stripe events ────────────────────────────────────
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }), // raw body needed for signature check
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
//       const session       = event.data.object;
//       console.log('🔎 Full session object:', JSON.stringify(session, null, 2));

//       // ← NEW: fetch line items to get product info
//       let productName = 'Unknown product';
//       let productPrice = 0;
//       try {
//         const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
//         if (lineItems.data.length > 0) {
//           productName  = lineItems.data[0].description;
//           productPrice = lineItems.data[0].amount_total / 100; // e.g. in GBP/EUR
//         }
//       } catch (err) {
//         console.warn('⚠️  Could not fetch line items:', err.message);
//       }

//       const customerEmail =
//         session.customer_email ||
//         (session.customer_details && session.customer_details.email);
//       console.log('✅ Webhook received:', event.type, '| Email:', customerEmail);

//       // Mark user as paid (existing)
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

//       // ── NEW: Save purchase details on the user (optional) ───────────────
//       // If you'd rather store on the User model directly, uncomment below:
//       /*
//       if (user) {
//         await User.findByIdAndUpdate(user._id, {
//           lastPurchase: {
//             productName,
//             productPrice,
//             purchaseDate: new Date(session.created * 1000) // timestamp from Stripe
//           }
//         });
//         console.log('✅ User.lastPurchase updated');
//       }
//       */

//       // ── NEW: Give them 4 unlocked weeks on first purchase (persisting product info) ───
//       if (user) {
//         try {
//           // only create one access record
//           let access = await UserAccess.findOne({ userId: user._id });
//           if (!access) {
//             await UserAccess.create({
//               userId:             user._id,
//               subscriptionId:     session.subscription,            // stripe subscription id
//               unlockedWeeks:      4,
//               subscriptionStatus: 'active',
//               renewalDate:        new Date(),
//               productName,                                       // ← NEW
//               productPrice,                                      // ← NEW
//               purchaseDate:       new Date(session.created * 1000) // ← NEW
//             });
//             console.log('✅ UserAccess created with 4 weeks unlocked and product info');
//           }
//         } catch (err) {
//           console.error('❌ Error creating UserAccess:', err);
//         }
//       }
//     }

//     // ── 2) RENEWAL (SUBSCRIPTION RENEWED) ─────────────────────────────────
//     if (event.type === 'invoice.paid') {
//       const invoice        = event.data.object;
//       const subscriptionId = invoice.subscription;
//       console.log('🔄 Subscription renewed:', subscriptionId);

//       try {
//         const access = await UserAccess.findOne({ subscriptionId });
//         if (access) {
//           access.unlockedWeeks += 4;
//           // Stripe's invoice.lines.data[0].period.end is a timestamp (in seconds)
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

//     // ── Acknowledge receipt of **all** events ──────────────────────────────
//     res.sendStatus(200);
//   }
// );

// module.exports = router;

// server/routes/webhook.js
const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const UserAccess = require('../models/UserAccess');  // ← already imported
const router = express.Router();
const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
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
      const session = event.data.object;
      console.log('🔎 Full session object (basic):', JSON.stringify(session, null, 2));

      // ✅ NEW: Fetch full session WITH line_items expanded
      let fullSession;
      try {
        fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items'],
        });
        console.log('🛒 Full session object (expanded):', JSON.stringify(fullSession, null, 2));
      } catch (err) {
        console.error('❌ Error fetching full session:', err);
        return res.sendStatus(500);
      }

      const customerEmail =
        fullSession.customer_email || (fullSession.customer_details && fullSession.customer_details.email);
      console.log('✅ Webhook received:', event.type, '| Email:', customerEmail);

      // Mark user as paid
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

      // ── Identify product purchased ─────────────────────────────────────
      if (user) {
        try {
          const priceId = fullSession.line_items?.data?.[0]?.price?.id;
          console.log('🛒 Purchased priceId:', priceId);

          let unlockedWeeks = 0;
          let isSubscription = false;

          if (priceId === process.env.PRICE_1_WEEK) {
            unlockedWeeks = 1;
          } else if (priceId === process.env.PRICE_4_WEEK) {
            unlockedWeeks = 4;
          } else if (priceId === process.env.PRICE_12_WEEK) {
            unlockedWeeks = 12;
          } else if (priceId === process.env.FULL_PRICE_ID) {
            unlockedWeeks = 4;
            isSubscription = true;
          } else {
            console.warn('⚠️ Unknown price ID:', priceId);
          }

          // ✅ Updated section starts here
          let access = await UserAccess.findOne({ userId: user._id });

          if (!access) {
            await UserAccess.create({
              userId: user._id,
              subscriptionId: isSubscription ? session.subscription : null,
              unlockedWeeks: unlockedWeeks,
              subscriptionStatus: isSubscription ? 'active' : null,
              renewalDate: isSubscription ? new Date() : null
            });
            console.log(`✅ UserAccess created with ${unlockedWeeks} weeks unlocked`);
          } else {
            console.log('ℹ️ UserAccess already exists for this user');
          }

          // ✅ Always send the confirmation email (whether access is new or existing)
          try {
            await sendOrderConfirmationEmail({
              email: customerEmail,
              programName: isSubscription
                ? 'Pro Tracker Subscription'
                : `${unlockedWeeks}-Week Program`,
              unlockedWeeks,
              renewalDate: isSubscription ? new Date() : null
            });
            console.log('✅ Confirmation email sent to:', customerEmail);
          } catch (err) {
            console.error('❌ Error sending confirmation email:', err.message);
          }
          // ✅ Updated section ends here

        } catch (err) {
          console.error('❌ Error creating UserAccess:', err);
        }
      }
    }

    // ── 2) RENEWAL (SUBSCRIPTION RENEWED) ─────────────────────────────────
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      console.log('🔄 Subscription renewed:', subscriptionId);

      try {
        const access = await UserAccess.findOne({ subscriptionId });
        if (access) {
          access.unlockedWeeks += 4;
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

    res.sendStatus(200);
  }
);

module.exports = router;