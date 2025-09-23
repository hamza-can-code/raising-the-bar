(() => {
  const priceElement = document.getElementById('kitOfferPrice');
  const yesButton = document.getElementById('kitOfferYes');
  const noButton = document.getElementById('kitOfferNo');

  if (!priceElement || !yesButton || !noButton) {
    return;
  }

  const PRICE_TABLE = {
    GBP: { amount: 74.99, currency: 'GBP' },
    USD: { amount: 89.99, currency: 'USD' },
    CAD: { amount: 119.99, currency: 'CAD' },
    SEK: { amount: 949, currency: 'SEK' },
    EUR: { amount: 84.99, currency: 'EUR' }
  };

  const LOCALE_MAP = {
    GBP: 'en-GB',
    USD: 'en-US',
    CAD: 'en-CA',
    SEK: 'sv-SE',
    EUR: 'de-DE'
  };

  const REGION_TO_CURRENCY = {
    GB: 'GBP',
    UK: 'GBP',
    IE: 'EUR',
    US: 'USD',
    CA: 'CAD',
    SE: 'SEK',
    FI: 'EUR',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    PT: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    LU: 'EUR',
    LV: 'EUR',
    LT: 'EUR',
    EE: 'EUR',
    CY: 'EUR',
    MT: 'EUR',
    SK: 'EUR',
    SI: 'EUR'
  };

  const LANGUAGE_TO_CURRENCY = {
    SV: 'SEK',
    EN: 'GBP',
    FR: 'EUR',
    DE: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    PT: 'EUR',
    NL: 'EUR'
  };

  function readStoredCurrency() {
    try {
      const cached = localStorage.getItem('rtb_currency');
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return typeof parsed?.code === 'string' ? parsed.code.toUpperCase() : null;
    } catch (_err) {
      return null;
    }
  }

  function resolveCurrencyFromLocale(localeString) {
    if (!localeString || typeof localeString !== 'string') return null;
    const normalized = localeString.trim().replace(/\./g, '-').toUpperCase();
    const segments = normalized.split(/[-_]/).filter(Boolean);

    if (segments.length > 1) {
      const region = segments[1];
      if (REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
    }

    const language = segments[0];
    if (LANGUAGE_TO_CURRENCY[language]) return LANGUAGE_TO_CURRENCY[language];
    return null;
  }

  function detectCurrency() {
    const windowCurrency = window.RTB_CURRENCY?.code?.toUpperCase();
    if (windowCurrency && PRICE_TABLE[windowCurrency]) {
      return windowCurrency;
    }

    const stored = readStoredCurrency();
    if (stored && PRICE_TABLE[stored]) {
      return stored;
    }

    const locales = [];
    if (Array.isArray(navigator.languages)) locales.push(...navigator.languages);
    if (navigator.language) locales.push(navigator.language);
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocale) locales.push(intlLocale);

    for (const locale of locales) {
      const currency = resolveCurrencyFromLocale(locale);
      if (currency && PRICE_TABLE[currency]) {
        return currency;
      }
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof timeZone === 'string') {
      const region = timeZone.split('/')[1];
      if (region) {
        const currency = REGION_TO_CURRENCY[region.toUpperCase()];
        if (currency && PRICE_TABLE[currency]) {
          return currency;
        }
      }
    }

    return 'GBP';
  }

  function formatPrice(info) {
    const locale = LOCALE_MAP[info.currency] || 'en-GB';
    const minimumFractionDigits = Number.isInteger(info.amount) ? 0 : 2;
    const maximumFractionDigits = Number.isInteger(info.amount) ? 0 : 2;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: info.currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(info.amount);
  }

  const currencyCode = detectCurrency();
  const priceInfo = PRICE_TABLE[currencyCode] || PRICE_TABLE.GBP;
  priceElement.textContent = formatPrice(priceInfo);

/* ↓ Add this block to show the original price (pre-51% discount) */
const originalEl = document.getElementById('kitOfferOriginal');
if (originalEl) {
  const rawOriginal = priceInfo.amount / 0.49; // reverse a 51% discount
  const originalAmount =
    priceInfo.currency === 'SEK'
      ? Math.round(rawOriginal)                       // whole numbers for SEK
      : Math.round(rawOriginal * 100) / 100;         // 2dp for others

  originalEl.textContent = formatPrice({
    amount: originalAmount,
    currency: priceInfo.currency
  });
}


  setTimeout(() => {
    noButton.hidden = false;
    requestAnimationFrame(() => {
      noButton.classList.add('is-visible');
    });
  }, 5000);

function logChoice(choice) {
  // Try to read email from localStorage
  let email = null;
  try {
    const stored = localStorage.getItem('email');
    if (stored) email = stored;
  } catch (_err) {
    console.warn('[kit-offer] Failed to read email from localStorage');
  }

  console.log(`[kit-offer] Interest choice: ${choice}, email: ${email || 'none'}`);

  try {
    fetch('/api/logInterest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice, email }),  // <— include email
      keepalive: true
    }).catch((err) => {
      console.warn('[kit-offer] Failed to log interest:', err);
    });
  } catch (err) {
    console.warn('[kit-offer] Logging aborted:', err);
  }

  window.location.href = 'dashboard.html';
}

  yesButton.addEventListener('click', () => logChoice('yes'));
  noButton.addEventListener('click', () => logChoice('no'));
})();