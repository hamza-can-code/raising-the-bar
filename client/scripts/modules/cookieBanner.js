// Step 1: Define tracking loader functions (Google Analytics, Clarity, TikTok)

function loadGoogleAnalytics() {
  const gtagScript = document.createElement("script");
  gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-W9CSNHSLQQ";
  gtagScript.async = true;
  document.head.appendChild(gtagScript);

  gtagScript.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-W9CSNHSLQQ');
  };
}

function loadClarity() {
  const clarityScript = document.createElement("script");
  clarityScript.type = "text/javascript";
  clarityScript.innerHTML = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "rmf0p7sik4");
  `;
  document.head.appendChild(clarityScript);
}

function loadTikTokPixel() {
  // 1️⃣ Define the global ttq object first (same as TikTok's base code)
  window.TiktokAnalyticsObject = 'ttq';
  const ttq = window.ttq = window.ttq || [];
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = function (t, e) {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (let i = 0; i < ttq.methods.length; i++) {
    ttq.setAndDefer(ttq, ttq.methods[i]);
  }
  ttq.instance = function (t) {
    const e = ttq._i[t] || [];
    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(e, ttq.methods[i]);
    }
    return e;
  };
  ttq.load = function (e, n) {
    const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
    const o = n && n.partner;
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date;
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = r + "?sdkid=" + e + "&lib=ttq";
    const f = document.getElementsByTagName("script")[0];
    f.parentNode.insertBefore(script, f);
  };

  // 2️⃣ Load your Pixel and call .page()
  ttq.load('D0M3KORC77UCAFR1EOLG');
  ttq.page({
    content_id: 'landing-page'
  });
}

// Step 2: Consent logic and cookie banner activation

export function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  const accept = document.getElementById("accept-all");
  const deny = document.getElementById("deny-all");

  function setCookie(n, v, days = 180) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${n}=${v}; expires=${d.toUTCString()}; path=/`;
  }

  function getCookie(n) {
    return document.cookie.split("; ").find(r => r.startsWith(n + "="))?.split("=")[1];
  }

  const consent = getCookie("userConsent");
  if (consent === "allow") {
    loadGoogleAnalytics();
    loadClarity();
    loadTikTokPixel();
    banner.style.display = "none";
  } else if (consent === "deny") {
    banner.style.display = "none";
  } else {
    banner.style.display = "block";
    accept.addEventListener("click", () => {
      setCookie("userConsent", "allow");
      banner.style.display = "none";
      loadGoogleAnalytics();
      loadClarity();
      loadTikTokPixel();
    });
    deny.addEventListener("click", () => {
      setCookie("userConsent", "deny");
      banner.style.display = "none";
    });
  }
}
