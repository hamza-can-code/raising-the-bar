// // server/index.js
// require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// const path      = require('path');
// const express   = require('express');
// const connectDB = require('./db');

// const webhookRouter   = require('./routes/webhook');
// const stripeRoutes    = require('./routes/stripeRoutes');
// const apiRoutes       = require('./routes/api');
// const workoutRoutes   = require('./routes/workoutRoutes');
// const nutritionRoutes = require('./routes/nutritionRoutes');
// const accessRoutes    = require('./routes/accessRoutes');
// const bodyWeightRoutes = require('./routes/bodyWeightRoutes');
// const paypalRoutes = require('./routes/paypalRoutes');

// const app  = express();
// const PORT = process.env.PORT || 5001;

// /* ────────────────────────────────────────────────────────────── */
// /* 1) Dev helper – log every request                             */
// app.use((req, _res, next) => {
//   console.log(`➡️  ${req.method} ${req.originalUrl}`);
//   next();
// });

// /* 2) DB connection                                              */
// connectDB();


// /* 3) Stripe webhook (raw body) – MOUNT FIRST!                   */
// app.use('/api', webhookRouter);     // → POST /api/webhook

// /* 4) JSON body-parser for everything else                      */
// app.use(express.json({ limit: '10mb' }));

// /* 5) Health-check                                              */
// app.get('/api/test', (_req, res) => res.json({ ok: true }));

// /* 6) App API routes                                            */
// console.log('🧠 Loading API routes…');
// app.use('/api', apiRoutes);
// app.use('/api', workoutRoutes);
// app.use('/api', nutritionRoutes);
// app.use('/api', accessRoutes);
// app.use('/api', bodyWeightRoutes);

// /* 7) Stripe checkout route (normal JSON)                       */
// app.use('/api', stripeRoutes);
// console.log('🔎 typeof paypalRoutes =', typeof paypalRoutes); // should be "function"
// app.use('/api/paypal', paypalRoutes);

// console.log('🚀 All API routes mounted');

// /* 8) Static front-end                                          */
// app.use(express.static(path.join(__dirname, '../client')));

// /* 9) 404 catch-all                                             */
// app.use((_req, res) => res.status(404).send('Not Found'));

// /* 10) Start server                                             */
// app.listen(PORT, () =>
//   console.log(`Server running on http://localhost:${PORT}`)
// );

// server/index.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path      = require('path');
const express   = require('express');
const connectDB = require('./db');

const webhookRouter    = require('./routes/webhook');         // Stripe webhook (raw body)
const stripeRoutes     = require('./routes/stripeRoutes');
const apiRoutes        = require('./routes/api');
const workoutRoutes    = require('./routes/workoutRoutes');
const nutritionRoutes  = require('./routes/nutritionRoutes');
const accessRoutes     = require('./routes/accessRoutes');
const bodyWeightRoutes = require('./routes/bodyWeightRoutes');

// PayPal routers (pick one or both if you want)
const paypalRoutesFull = require('./routes/paypalRoutes');    // full vault/capture/charge
const paypalClientOnly = require('./routes/paypal');          // client-token only (optional)
// const adminRoutes = require('./routes/adminRoutes');

const cron = require('node-cron');
const { runRenewals } = require('./jobs/renewals');

const app  = express();
const PORT = process.env.PORT || 5001;

/* 1) Dev helper – log every request */
app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

/* 2) DB connection */
connectDB();

/* 3) Stripe webhook (raw body) – mount FIRST on /api so it sees the raw payload */
app.use('/api', webhookRouter);     // → POST /api/webhook

/* 4) JSON body-parser for everything else */
app.use(express.json({ limit: '10mb' }));

/* 5) Health-check */
app.get('/api/test', (_req, res) => res.json({ ok: true }));

/* 6) App API routes */
console.log('🧠 Loading API routes…');
app.use('/api', apiRoutes);
app.use('/api', workoutRoutes);
app.use('/api', nutritionRoutes);
app.use('/api', accessRoutes);
app.use('/api', bodyWeightRoutes);

/* 7) Payments */
app.use('/api', stripeRoutes);

// PayPal: mount the full router under /api/paypal
app.use('/api/paypal', paypalRoutesFull);

// If you chose to keep the small client-token router too, also mount it.
// This is safe because paths don’t conflict (both define /client-token).
app.use('/api/paypal', paypalClientOnly);
// app.use('/api', adminRoutes);

console.log('🚀 All API routes mounted');

/* 8) Static front-end */
app.use(express.static(path.join(__dirname, '../client')));

/* 9) 404 catch-all */
app.use((_req, res) => res.status(404).send('Not Found'));

/* 10) Start server */
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

/* 11) Renewal cron – daily at 10:15 Europe/London */
cron.schedule('15 10 * * *', async () => {
  try {
    console.log('⏰ Renewal cron started');
    await runRenewals();
    console.log('✅ Renewal cron finished');
  } catch (e) {
    console.error('❌ Renewal cron error', e);
  }
}, { timezone: 'Europe/London' });
