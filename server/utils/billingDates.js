// server/utils/billingDates.js
const dayMs = 24 * 60 * 60 * 1000;

function add30Days(date = new Date()) {
  return new Date(date.getTime() + 30 * dayMs);
}

/** "2025-08" from a Date */
function periodKeyFromDate(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

module.exports = { add30Days, periodKeyFromDate };
