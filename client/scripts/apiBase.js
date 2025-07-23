// client/scripts/apiBase.js
export const API_BASE =
  window.location.hostname.includes('localhost')
    ? 'http://localhost:5001'                   // local dev
    : 'https://raising-the-bar.onrender.com';   // ← your Render URL