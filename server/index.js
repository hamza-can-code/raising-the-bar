// server/index.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path      = require('path');
const express   = require('express');
const connectDB = require('./db');

const webhookRouter   = require('./routes/webhook');
const stripeRoutes    = require('./routes/stripeRoutes');
const apiRoutes       = require('./routes/api');
const workoutRoutes   = require('./routes/workoutRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const accessRoutes    = require('./routes/accessRoutes');
const bodyWeightRoutes = require('./routes/bodyWeightRoutes');

const app  = express();
const PORT = process.env.PORT || 5001;

/* ────────────────────────────────────────────────────────────── */
/* 1) Dev helper – log every request                             */
app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

/* 2) DB connection                                              */
connectDB();


/* 3) Stripe webhook (raw body) – MOUNT FIRST!                   */
app.use('/api', webhookRouter);     // → POST /api/webhook

/* 4) JSON body-parser for everything else                      */
app.use(express.json({ limit: '10mb' }));

/* 5) Health-check                                              */
app.get('/api/test', (_req, res) => res.json({ ok: true }));

/* 6) App API routes                                            */
console.log('🧠 Loading API routes…');
app.use('/api', apiRoutes);
app.use('/api', workoutRoutes);
app.use('/api', nutritionRoutes);
app.use('/api', accessRoutes);
app.use('/api', bodyWeightRoutes);

/* 7) Stripe checkout route (normal JSON)                       */
app.use('/api', stripeRoutes);

console.log('🚀 All API routes mounted');

/* 8) Static front-end                                          */
app.use(express.static(path.join(__dirname, '../client')));

/* 9) 404 catch-all                                             */
app.use((_req, res) => res.status(404).send('Not Found'));

/* 10) Start server                                             */
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);