const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'SEK', 'NOK', 'DKK', 'CAD', 'CHF', 'AUD', 'NZD', 'SGD', 'HKD', 'JPY', 'INR', 'BRL', 'MXN',
];

// Mapping of ISO-3166 country codes (and a few aliases) to default settlement currencies
const COUNTRY_TO_CURRENCY = {
  GB: 'GBP',
  UK: 'GBP',
  US: 'USD',
  USA: 'USD',
  AU: 'AUD',
  NZ: 'NZD',
  CA: 'CAD',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  SG: 'SGD',
  HK: 'HKD',
  JP: 'JPY',
  IN: 'INR',
  BR: 'BRL',
  MX: 'MXN',
  // Eurozone countries
  AT: 'EUR',
  BE: 'EUR',
  CY: 'EUR',
  EE: 'EUR',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  GR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
};

function normalizeCurrencyCode(code, fallback = 'GBP') {
  if (!code || typeof code !== 'string') return fallback;

  const upper = code.trim().toUpperCase();

  if (/^[A-Z]{3}$/.test(upper)) return upper;
  if (COUNTRY_TO_CURRENCY[upper]) return COUNTRY_TO_CURRENCY[upper];

  const twoLetterCode = upper.slice(0, 2);
  if (COUNTRY_TO_CURRENCY[twoLetterCode]) return COUNTRY_TO_CURRENCY[twoLetterCode];

  return fallback;
}

function deriveCurrencyFromCountry(country, fallback = 'GBP') {
  return normalizeCurrencyCode(country, fallback);
}

module.exports = {
  SUPPORTED_CURRENCIES,
  COUNTRY_TO_CURRENCY,
  normalizeCurrencyCode,
  deriveCurrencyFromCountry,
};
