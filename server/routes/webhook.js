// // server/routes/webhook.js
const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const User = require('../models/User');
const UserAccess = require('../models/UserAccess');
const UserPreferences = require('../models/UserPreferences');
const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const TRIAL_UPFRONT_PRICE_IDS = [
  process.env.PRICE_TRIAL_UPFRONT_GBP,
  process.env.PRICE_TRIAL_UPFRONT_GBP_DECODED,
  process.env.PRICE_TRIAL_UPFRONT_GBP_VITAL,
  process.env.PRICE_TRIAL_UPFRONT_GBP_IRONVERSE,
].filter(Boolean);

const FOUR_WEEK_PRICE_IDS = [
  process.env.PRICE_FOUR_WEEK_GBP,
  process.env.PRICE_FOUR_WEEK_GBP_DECODED,
  process.env.PRICE_FOUR_WEEK_GBP_VITAL,
  process.env.PRICE_FOUR_WEEK_GBP_IRONVERSE,
].filter(Boolean);

const TWELVE_WEEK_PRICE_IDS = [
  process.env.PRICE_TWELVE_WEEK_GBP,
  process.env.PRICE_TWELVE_WEEK_GBP_DECODED,
  process.env.PRICE_TWELVE_WEEK_GBP_VITAL,
  process.env.PRICE_TWELVE_WEEK_GBP_IRONVERSE,
].filter(Boolean);

async function promoteSubscriptionFeeToOngoing(subscriptionId, invoiceId) {
  if (!subscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const metadata = subscription.metadata || {};
    const introApplied = metadata.connect_intro_applied === 'true';
    const introFeePercent = Number(metadata.platform_intro_fee_percent);
    const ongoingFeePercent = Number(
      metadata.platform_ongoing_fee_percent ?? metadata.platform_intro_fee_percent,
    );
    const destination = subscription.transfer_data?.destination;

    if (!destination || !Number.isFinite(introFeePercent)) return;
    if (introApplied) return;

    const updatePayload = {
      metadata: {
        ...metadata,
        connect_intro_applied: 'true',
        connect_intro_invoice_id: invoiceId || '',
      },
    };

    if (Number.isFinite(ongoingFeePercent)) {
      updatePayload.application_fee_percent = ongoingFeePercent;
    }

    await stripe.subscriptions.update(subscriptionId, updatePayload);
  } catch (err) {
    console.error('⚠️  Failed to promote Connect fee schedule', {
      subscriptionId,
      invoiceId,
      message: err.message,
    });
  }
}

async function applyTrialUpgradeIfNeeded(subscriptionId) {
  if (!subscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
    const metadata = subscription.metadata || {};
    const upgradePending = metadata.trial_upgrade_pending === 'true';
    const upgradePriceId = metadata.trial_upgrade_price_id;
    const anchorDays = Number(metadata.trial_upgrade_anchor_days || 7);

    if (!upgradePending || !upgradePriceId) return;

    const subscriptionItem = subscription.items?.data?.[0];
    if (!subscriptionItem) return;

    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: subscriptionItem.id, price: upgradePriceId }],
      billing_cycle_anchor: Math.floor(Date.now() / 1000) + anchorDays * 24 * 60 * 60,
      proration_behavior: 'none',
      metadata: {
        ...metadata,
        trial_upgrade_pending: 'false',
        trial_upgrade_applied_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('⚠️  Failed to apply trial upgrade', {
      subscriptionId,
      message: err.message,
    });
  }
}

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
        expand: ['subscription', 'payment_intent']
      });

      // Step B: Retrieve line items separately
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 10
      });
      const priceIds = lineItems.data
        .map(item => item.price?.id)
        .filter(Boolean);

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
      // const priceId = session.line_items.data[0].price.id;
      let unlockedWeeks = 0;
      const hasTrialUpfront = priceIds.some(id => TRIAL_UPFRONT_PRICE_IDS.includes(id));
      const hasFourWeek = priceIds.some(id => FOUR_WEEK_PRICE_IDS.includes(id));
      const hasTwelveWeek = priceIds.some(id => TWELVE_WEEK_PRICE_IDS.includes(id));
      const hasFullPrice = priceIds.includes(process.env.FULL_PRICE_ID);
      let subscription = session.subscription || null;
      const hasSubscription = !!subscription?.id;
      const isFullSubscriptionPurchase = hasFullPrice;

      if (hasTrialUpfront) {
        unlockedWeeks = 1;
      } else if (hasFourWeek) {
        unlockedWeeks = 4;
      } else if (hasTwelveWeek) {
        unlockedWeeks = 12;
      } else if (hasFullPrice) {
        unlockedWeeks = 4;          // first block on sign-up
      } else {
        console.warn('⚠️  Unknown priceId:', priceIds[0]);
      }

      /* D) Upsert UserAccess  */
      const update = {
        $inc: { unlockedWeeks },
        $set: {}
      };

      if (!hasSubscription && hasTrialUpfront && session.metadata?.trial_subscription === 'true') {
        let paymentIntent = session.payment_intent;
        const upgradePriceId = session.metadata?.trial_subscription_price_id;
        const trialDays = Number(session.metadata?.trial_period_days || 7);
        if (paymentIntent && typeof paymentIntent === 'string') {
          try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent, {
              expand: ['payment_method', 'charges.data.payment_method'],
            });
          } catch (err) {
            console.error('⚠️  Failed to retrieve payment intent for checkout session', paymentIntent, err.message);
          }
        }

        const customerId = paymentIntent?.customer || session.customer;
        const paymentMethodId =
          paymentIntent?.payment_method ||
          paymentIntent?.charges?.data?.[0]?.payment_method ||
          null;

        if (upgradePriceId && customerId) {
          if (paymentMethodId) {
            try {
              await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
            } catch (attachErr) {
              if (attachErr.code !== 'resource_already_exists') {
                console.error('⚠️  Failed to attach payment method', paymentMethodId, attachErr.message);
              }
            }

            try {
              await stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
              });
            } catch (updateErr) {
              console.error('⚠️  Failed to set default payment method', customerId, updateErr.message);
            }
          }

          const subscriptionConfig = {
            customer: customerId,
            items: [{ price: upgradePriceId }],
            trial_period_days: Number.isFinite(trialDays) ? trialDays : 7,
            default_payment_method: paymentMethodId || undefined,
            payment_settings: { save_default_payment_method: 'on_subscription' },
            metadata: {
              product: '4-Week Plan',
              currency_used: (paymentIntent?.currency || 'gbp').toUpperCase(),
              trial_origin: 'checkout',
              trial_upfront_payment_intent_id: paymentIntent?.id || '',
              creator_slug: session.metadata?.creator_slug || '',
              creator_name: session.metadata?.creator_name || '',
              creator_source: session.metadata?.creator_source || '',
              creator_default_currency: session.metadata?.creator_default_currency || '',
              platform_intro_fee_percent: session.metadata?.platform_intro_fee_percent || '',
              platform_ongoing_fee_percent: session.metadata?.platform_ongoing_fee_percent || '',
              connect_intro_applied: session.metadata?.connect_intro_applied || '',
              connect_destination_valid: session.metadata?.connect_destination_valid || '',
              connect_destination_country: session.metadata?.connect_destination_country || '',
              connect_destination_reason: session.metadata?.connect_destination_reason || '',
            },
          };

          const destination = session.metadata?.connect_destination;
          const destinationValid = session.metadata?.connect_destination_valid === 'true';
          const introFeePercent = Number(session.metadata?.platform_intro_fee_percent);
          if (destination && destinationValid && Number.isFinite(introFeePercent)) {
            subscriptionConfig.transfer_data = { destination };
            subscriptionConfig.application_fee_percent = introFeePercent;
            subscriptionConfig.on_behalf_of = destination;
          }

          try {
            subscription = await stripe.subscriptions.create(subscriptionConfig);
          } catch (err) {
            console.error('❌  Failed to create trial follow-on subscription from Checkout', err.message);
          }
          if (subscription?.id && paymentIntent?.id) {
            try {
              await stripe.paymentIntents.update(paymentIntent.id, {
                metadata: {
                  ...(paymentIntent.metadata || {}),
                  trial_subscription_created: 'true',
                  trial_subscription_id: subscription.id,
                },
              });
            } catch (err) {
              console.error(
                '⚠️  Failed to tag trial payment intent after subscription creation',
                paymentIntent.id,
                err.message
              );
            }
          }
        }
      }

      if (subscription?.id) {
        update.$set.subscriptionId = subscription.id;
        update.$set.subscriptionStatus = subscription.status || 'active';
        update.$set.renewalDate = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date();          // now
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
        // ✅ Get name from user preferences BEFORE sending the email
        const preferencesDoc = await UserPreferences.findOne({ userId: user._id });
        const fullName = preferencesDoc?.preferences?.name || session.customer_details?.name || 'There';
        const firstName = fullName.split(' ')[0];

        await sendOrderConfirmationEmail({
          email,
          programName: isFullSubscriptionPurchase
            ? 'Pro Tracker Subscription'
            : `${unlockedWeeks}-Week Program`,
          unlockedWeeks,
          renewalDate: isFullSubscriptionPurchase ? ua.renewalDate : null,
          firstName
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
      const subscriptionId = invoice.subscription;

      if (!subscriptionId) return res.sendStatus(200);

      await promoteSubscriptionFeeToOngoing(subscriptionId, invoice.id);
      await applyTrialUpgradeIfNeeded(subscriptionId);

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

    /******************************************************************
     * 2️⃣-b TRIAL UPFRONT PAYMENT SUCCEEDED (create 4-week subscription)
     *****************************************************************/
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      const isTrialSubscription = metadata.trial_subscription === 'true';
      const upgradePriceId = metadata.trial_subscription_price_id;
      const trialDays = Number(metadata.trial_period_days || 7);

      if (!isTrialSubscription || !upgradePriceId) return res.sendStatus(200);
      if (metadata.trial_subscription_created === 'true') {
        return res.sendStatus(200);
      }

      const customerId = paymentIntent.customer;
      if (!customerId) {
        console.warn('⚠️  Trial upfront payment missing customer', paymentIntent.id);
        return res.sendStatus(200);
      }

      const paymentMethodId = paymentIntent.payment_method;
      if (paymentMethodId) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
        } catch (attachErr) {
          if (attachErr.code !== 'resource_already_exists') {
            console.error('⚠️  Failed to attach payment method', paymentMethodId, attachErr.message);
          }
        }

        try {
          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
          });
        } catch (updateErr) {
          console.error('⚠️  Failed to set default payment method', customerId, updateErr.message);
        }
      }

      const subscriptionMetadata = {
        product: '4-Week Plan',
        currency_used: (paymentIntent.currency || 'gbp').toUpperCase(),
        trial_origin: 'upfront',
        trial_upfront_payment_intent_id: paymentIntent.id,
        creator_slug: metadata.creator_slug || '',
        creator_name: metadata.creator_name || '',
        creator_source: metadata.creator_source || '',
        creator_default_currency: metadata.creator_default_currency || '',
        platform_intro_fee_percent: metadata.platform_intro_fee_percent || '',
        platform_ongoing_fee_percent: metadata.platform_ongoing_fee_percent || '',
        connect_intro_applied: metadata.connect_intro_applied || '',
        connect_destination_valid: metadata.connect_destination_valid || '',
        connect_destination_country: metadata.connect_destination_country || '',
        connect_destination_reason: metadata.connect_destination_reason || '',
      };

      const subscriptionConfig = {
        customer: customerId,
        items: [{ price: upgradePriceId }],
        trial_period_days: Number.isFinite(trialDays) ? trialDays : 7,
        default_payment_method: paymentMethodId || undefined,
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: subscriptionMetadata,
      };

      const destination = metadata.connect_destination;
      const destinationValid = metadata.connect_destination_valid === 'true';
      const introFeePercent = Number(metadata.platform_intro_fee_percent);
      if (destination && destinationValid && Number.isFinite(introFeePercent)) {
        subscriptionConfig.transfer_data = { destination };
        subscriptionConfig.application_fee_percent = introFeePercent;
        subscriptionConfig.on_behalf_of = destination;
      }

      let subscription;
      try {
        subscription = await stripe.subscriptions.create(subscriptionConfig);
      } catch (err) {
        console.error('❌  Failed to create trial follow-on subscription', err.message);
        return res.sendStatus(200);
      }

      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...metadata,
          trial_subscription_created: 'true',
          trial_subscription_id: subscription.id,
        },
      });

      try {
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        if (email) {
          const user = await User.findOne({ email });
          if (user) {
            const ua = await UserAccess.findOneAndUpdate(
              { userId: user._id },
              {
                $inc: { unlockedWeeks: 1 },
                $set: {
                  subscriptionId: subscription.id,
                  subscriptionStatus: subscription.status || 'trialing',
                  renewalDate: subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : new Date(),
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true },
            );
            console.log('🔐 UserAccess saved → weeks:', ua.unlockedWeeks, 'subId:', ua.subscriptionId);
          }
        }
      } catch (err) {
        console.error('⚠️  Failed to update user access after trial upfront payment', err.message);
      }
    }

    /******************************************************************
    * 3️⃣  SUBSCRIPTION CREATED/UPDATED (ensure SetupIntent tagged)
    *****************************************************************/
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object;
      const pendingSetup = subscription.pending_setup_intent;
      const pendingSetupId =
        typeof pendingSetup === 'string'
          ? pendingSetup
          : pendingSetup?.id;

      if (pendingSetupId) {
        try {
          await stripe.setupIntents.update(pendingSetupId, {
            metadata: {
              subscription_id: subscription.id,
              customer_id: subscription.customer,
            },
          });
        } catch (err) {
          console.error(
            '⚠️  Failed to tag pending setup intent',
            pendingSetupId,
            err.message
          );
        }
      }
    }

    /******************************************************************
     * 4️⃣  SETUP INTENT SUCCEEDED (free trial card collection)
     *****************************************************************/
    if (event.type === 'setup_intent.succeeded') {
      const setupIntent = event.data.object;
      const paymentMethodId = setupIntent.payment_method;
      const customerId = setupIntent.customer;
      let subscriptionId =
        setupIntent.metadata?.subscription_id ||
        setupIntent.metadata?.subscriptionId ||
        null;

      if (!subscriptionId && customerId) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            expand: ['data.pending_setup_intent'],
            limit: 20,
          });

          const pendingMatch = subscriptions.data.find(sub => {
            const pending =
              typeof sub.pending_setup_intent === 'string'
                ? sub.pending_setup_intent
                : sub.pending_setup_intent?.id;
            return pending === setupIntent.id;
          });

          if (pendingMatch) {
            subscriptionId = pendingMatch.id;
          } else {
            const fallbackMatch = subscriptions.data
              .filter(sub =>
                !sub.default_payment_method &&
                sub.collection_method !== 'send_invoice' &&
                ['trialing', 'active', 'incomplete'].includes(sub.status)
              )
              .sort((a, b) => b.created - a.created)[0];

            if (fallbackMatch) {
              subscriptionId = fallbackMatch.id;
            }
          }
        } catch (err) {
          console.error(
            '❌  Failed to locate subscription for setup intent',
            setupIntent.id,
            err.message
          );
        }
      }

      if (!subscriptionId || !paymentMethodId) {
        console.warn(
          '⚠️  setup_intent.succeeded without linkable subscription',
          setupIntent.id
        );
      } else {
        try {
          if (customerId) {
            try {
              await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
              });
            } catch (attachErr) {
              if (attachErr.code !== 'resource_already_exists') {
                throw attachErr;
              }
            }

            await stripe.customers.update(customerId, {
              invoice_settings: { default_payment_method: paymentMethodId },
            });
          }

          await stripe.subscriptions.update(subscriptionId, {
            default_payment_method: paymentMethodId,
          });

          console.log(
            '💳  Stored default payment method for subscription',
            subscriptionId
          );
        } catch (err) {
          console.error(
            '❌  Failed to attach default payment method for',
            subscriptionId,
            err.message
          );
        }
      }
    }

    /* Stripe expects only 2xx so it won’t retry */
    res.sendStatus(200);
  }
);

module.exports = router;

// server/routes/webhook.js
// const express = require('express');
// const Stripe  = require('stripe');
// const router  = express.Router();

// const User                = require('../models/User');
// const UserAccess          = require('../models/UserAccess');
// const UserPreferences     = require('../models/UserPreferences');
// const sendOrderConfirmationEmail = require('../utils/sendOrderConfirmationEmail');

// const stripe          = new Stripe(process.env.STRIPE_SECRET_KEY);
// const endpointSecret  = process.env.STRIPE_WEBHOOK_SECRET;

// /* ──────────────────────────────────────────────────────────────── */
// /*  Simple in-memory idempotency cache - avoids double-processing  */
// /*  (Stripe can resend the same event). If you restart frequently  */
// /*  you can move this to Mongo, Redis, etc.                        */
// /* ──────────────────────────────────────────────────────────────── */
// const processedEvents = new Set();

// /* Stripe requires the raw body exactly as it arrives */
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   async (req, res) => {
//     /* 0️⃣ Verify signature */
//     let event;
//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         req.headers['stripe-signature'],
//         endpointSecret
//       );
//     } catch (err) {
//       console.error('❌  Bad webhook signature:', err.message);
//       return res.sendStatus(400);
//     }

//     /* 0️⃣-b  Deduplicate */
//     if (processedEvents.has(event.id)) {
//       console.log('🔁  Duplicate event — skipped', event.id);
//       return res.sendStatus(200);
//     }
//     processedEvents.add(event.id);

//     /******************************************************************
//      * 1️⃣  CHECKOUT COMPLETE  (new one-off purchase OR subscription)
//      *****************************************************************/
//     if (event.type === 'checkout.session.completed') {
//       /* A) Pull full session (need price + subscription id) */
//       const session = await stripe.checkout.sessions.retrieve(
//         event.data.object.id,
//         { expand: ['subscription'] }
//       );

//       /* B) Retrieve the single line-item to get its price ID */
//       const lineItems = await stripe.checkout.sessions.listLineItems(
//         session.id,
//         { limit: 1 }
//       );
//       const priceId = lineItems.data[0].price.id;

//       const email = session.customer_details?.email || session.customer_email;
//       console.log('✅ checkout.session.completed →', email);

//       /* C) Mark user as paid (optional) */
//       const user = await User.findOneAndUpdate(
//         { email },
//         { isPaid: true },
//         { new: true }
//       );
//       if (!user) {
//         console.warn('⚠️  No user found for', email);
//         return res.sendStatus(200);
//       }

//       /* D) Decide how many weeks / whether sub */
//       let unlockedWeeks  = 0;
//       let isSubscription = false;

//       if      (priceId === process.env.PRICE_1_WEEK)  unlockedWeeks = 1;
//       else if (priceId === process.env.PRICE_4_WEEK)  unlockedWeeks = 4;
//       else if (priceId === process.env.PRICE_12_WEEK) unlockedWeeks = 12;
//       else if (priceId === process.env.FULL_PRICE_ID) {
//         unlockedWeeks  = 4;          // first block on sign-up
//         isSubscription = true;
//       } else {
//         console.warn('⚠️  Unknown priceId:', priceId);
//       }

//       /* E) Upsert UserAccess */
//       const update = {
//         $inc: { unlockedWeeks },
//         $set: {}
//       };
//       if (isSubscription) {
//         update.$set.subscriptionId     = session.subscription.id;
//         update.$set.subscriptionStatus = 'active';
//         update.$set.renewalDate        = new Date();   // now
//       }

//       const ua = await UserAccess.findOneAndUpdate(
//         { userId: user._id },
//         update,
//         { upsert: true, new: true, setDefaultsOnInsert: true }
//       );

//       console.log(
//         '🔐 UserAccess saved → weeks:',
//         ua.unlockedWeeks, 'subId:', ua.subscriptionId
//       );

//       /* F) confirmation e-mail (optional) */
//       try {
//         const preferencesDoc = await UserPreferences.findOne({ userId: user._id });
//         const fullName = preferencesDoc?.preferences?.name
//                        || session.customer_details?.name
//                        || 'There';
//         const firstName = fullName.split(' ')[0];

//         await sendOrderConfirmationEmail({
//           email,
//           programName : isSubscription
//             ? 'Pro Tracker'
//             : `${unlockedWeeks}-Week Program`,
//           unlockedWeeks,
//           renewalDate : isSubscription ? ua.renewalDate : null,
//           firstName
//         });
//         console.log('📧  Confirmation e-mail sent to', email);
//       } catch (err) {
//         console.error('📧  sendOrderConfirmationEmail failed:', err.message);
//       }
//     }

//     /******************************************************************
//      * 2️⃣  SUBSCRIPTION RENEWAL  (invoice.payment_succeeded)
//      *****************************************************************/
//     if (event.type === 'invoice.payment_succeeded') {
//       const invoice         = event.data.object;
//       const subscriptionId  = invoice.subscription;
//       if (!subscriptionId) return res.sendStatus(200);

//       /* A) Find or create the UserAccess entry */
//       let ua = await UserAccess.findOne({ subscriptionId });

//       if (!ua) {
//         /* First successful payment on a subscription created via
//            the Elements “subscription intent” flow.                */
//         const subscription = await stripe.subscriptions.retrieve(subscriptionId);
//         const customer     = await stripe.customers.retrieve(subscription.customer);
//         const user         = await User.findOne({ email: customer.email });

//         if (!user) {
//           console.warn('No user for', customer.email);
//           return res.sendStatus(200);
//         }

//         ua = await UserAccess.create({
//           userId            : user._id,
//           subscriptionId,
//           unlockedWeeks     : 4,
//           subscriptionStatus: 'active',
//           renewalDate       : new Date(invoice.lines.data[0].period.end * 1000)
//         });
//         console.log('✅ Created UserAccess for first payment:', ua);
//       } else {
//         /* Renewal → add 4 weeks */
//         ua.unlockedWeeks += 4;
//         ua.renewalDate    = new Date(invoice.lines.data[0].period.end * 1000);
//         await ua.save();
//         console.log('➕  Added 4 weeks on renewal → now', ua.unlockedWeeks);
//       }
//     }

//     /* Stripe expects only 2xx so it won’t retry */
//     res.sendStatus(200);
//   }
// );

// module.exports = router;
