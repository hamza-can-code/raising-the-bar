// scripts/modules/cookieBanner.js

// ———————————————————————————————————————————————————————
// 1) Loader functions for each tag
// ———————————————————————————————————————————————————————
function loadGoogleAnalytics() {
  const s = document.createElement("script");
  s.src = "https://www.googletagmanager.com/gtag/js?id=G-W9CSNHSLQQ";
  s.async = true;
  document.head.appendChild(s);

  s.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-W9CSNHSLQQ');
  };
}

function loadClarity() {
  // stub queue so calls before load are captured
  window.clarity = window.clarity || function() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  const s = document.createElement("script");
  s.src = "https://www.clarity.ms/tag/rmf0p7sik4";
  s.async = true;
  document.head.appendChild(s);
}

function loadTikTokPixel() {
  window.TiktokAnalyticsObject = 'ttq';
  const ttq = window.ttq = window.ttq || [];
  ttq.methods = [
    "page","track","identify","instances","debug","on","off","once","ready",
    "alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"
  ];
  ttq.setAndDefer = function(t,e){
    t[e] = function(){
      t.push([e].concat(Array.prototype.slice.call(arguments,0)));
    };
  };
  for (let m of ttq.methods) ttq.setAndDefer(ttq, m);

  ttq.load = function(e,n){
    const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = url;
    ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
    ttq._o = ttq._o || {}; ttq._o[e] = n || {};
    const s = document.createElement("script");
    s.src = `${url}?sdkid=${e}&lib=ttq`;
    s.async = true;
    document.head.appendChild(s);
  };

  // initialize
  ttq.load('D0M3KORC77UCAFR1EOLG');
  ttq.track('ViewContent', { content_id: 'landing-page' });
}

// ———————————————————————————————————————————————————————
// 2) Cookie helpers
// ———————————————————————————————————————————————————————
function setCookie(name, value, days = 180) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`;
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(r => r.startsWith(name + '='))
    ?.split('=')[1];
}

// ———————————————————————————————————————————————————————
// 3) Render + consent logic
// ———————————————————————————————————————————————————————
export function initCookieBanner() {
  window.addEventListener('load', () => {
    // wait one frame so LCP (hero) can finish
    requestAnimationFrame(() => {
      const tpl = document.getElementById('tmpl-cookie-banner');
      if (!tpl) return;

      // clone and append banner
      const clone = tpl.content.cloneNode(true);
      document.body.appendChild(clone);

      const banner = document.getElementById("cookie-banner");
      const accept = document.getElementById("accept-all");
      const deny   = document.getElementById("deny-all");
      if (!banner || !accept || !deny) return;

      // check prior consent
      const consent = getCookie("userConsent");
      if (consent === "allow") {
        banner.remove();
        loadGoogleAnalytics();
        loadClarity();
        loadTikTokPixel();
        return;
      }
      if (consent === "deny") {
        banner.remove();
        return;
      }

      // no consent yet → show banner
      banner.style.display = "block";

      accept.addEventListener("click", () => {
        setCookie("userConsent", "allow");
        banner.remove();
        loadGoogleAnalytics();
        loadClarity();
        loadTikTokPixel();
      });

      deny.addEventListener("click", () => {
        setCookie("userConsent", "deny");
        banner.remove();
      });
    });
  });
}