// // cookie-banner.js

// // ———————————————————————————————————————————————————————
// // 1) loader functions for each tag
// // ———————————————————————————————————————————————————————
// function loadGoogleAnalytics() {
//   const s = document.createElement("script");
//   s.src = "https://www.googletagmanager.com/gtag/js?id=G-W9CSNHSLQQ";
//   s.async = true;
//   document.head.appendChild(s);

//   s.onload = () => {
//     window.dataLayer = window.dataLayer || [];
//     function gtag() { dataLayer.push(arguments); }
//     gtag('js', new Date());
//     gtag('config', 'G-W9CSNHSLQQ');
//   };
// }

// function loadClarity() {
//   window.clarity = window.clarity || function() {
//     (window.clarity.q = window.clarity.q || []).push(arguments);
//   };
//   const s = document.createElement("script");
//   s.src = "https://www.clarity.ms/tag/rmf0p7sik4";
//   s.async = true;
//   document.head.appendChild(s);
// }

// function loadTikTokPixel() {
//   window.TiktokAnalyticsObject = 'ttq';
//   const ttq = window.ttq = window.ttq || [];
//   ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
//   ttq.setAndDefer = function(t,e){ t[e]=function(){ t.push([e].concat(Array.prototype.slice.call(arguments,0))) }; };
//   for (let m of ttq.methods) ttq.setAndDefer(ttq, m);

//   ttq.load = function(e,n){
//     const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
//     ttq._i = ttq._i || {}; ttq._i[e]=[]; ttq._i[e]._u=url;
//     ttq._t = ttq._t || {}; ttq._t[e]=+new Date;
//     ttq._o = ttq._o || {}; ttq._o[e]=n||{};
//     const s = document.createElement("script");
//     s.src = url + "?sdkid=" + e + "&lib=ttq";
//     s.async = true;
//     document.head.appendChild(s);
//   };

//   ttq.load('D0M3KORC77UCAFR1EOLG');
//   ttq.track('ViewContent', { content_id: 'landing-page' });
// }

// // ———————————————————————————————————————————————————————
// // 2) cookie helpers
// // ———————————————————————————————————————————————————————
// function setCookie(name, value, days = 180) {
//   const d = new Date();
//   d.setTime(d.getTime() + days*24*60*60*1000);
//   document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`;
// }

// function getCookie(name) {
//   return document.cookie
//     .split('; ')
//     .find(r => r.startsWith(name+'='))
//     ?.split('=')[1];
// }

// // ———————————————————————————————————————————————————————
// // 3) render + consent logic
// // ———————————————————————————————————————————————————————
// export function initCookieBanner() {
//   // Only inject banner after load + one RAF (so LCP can happen first)
//   window.addEventListener('load', () => {
//     requestAnimationFrame(() => {
//       // pull banner out of a <template id="tmpl-cookie-banner">…</template>
//       const tpl = document.getElementById('tmpl-cookie-banner');
//       if (!tpl) return;
//       const bannerNode = tpl.content.cloneNode(true);
//       document.body.appendChild(bannerNode);

//       const banner = document.getElementById("cookie-banner");
//       const accept = document.getElementById("accept-all");
//       const deny   = document.getElementById("deny-all");
//       if (!banner || !accept || !deny) return;

//       // check existing consent
//       const consent = getCookie("userConsent");
//       if (consent === "allow") {
//         banner.remove();
//         loadGoogleAnalytics();
//         loadClarity();
//         loadTikTokPixel();
//       }
//       else if (consent === "deny") {
//         banner.remove();
//       }
//       else {
//         // show banner and wire up
//         banner.style.display = "block";
//         accept.addEventListener("click", () => {
//           setCookie("userConsent", "allow");
//           banner.remove();
//           loadGoogleAnalytics();
//           loadClarity();
//           loadTikTokPixel();
//         });
//         deny.addEventListener("click", () => {
//           setCookie("userConsent", "deny");
//           banner.remove();
//         });
//       }
//     });
//   });
// }

/*  ---------------------------------------------------------
 *  modules/cookieBanner.js
 *  Strategy A: keep banner hidden until first idle time so it
 *  never competes for Largest Contentful Paint.
 *  --------------------------------------------------------- */

/* — 3rd-party loaders — */
function loadGoogleAnalytics() {
  const s = document.createElement('script');
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-W9CSNHSLQQ';
  s.async = true;
  document.head.appendChild(s);
  s.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-W9CSNHSLQQ');
  };
}

function loadClarity() {
  window.clarity = window.clarity || function(){
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  const s = document.createElement('script');
  s.src = 'https://www.clarity.ms/tag/rmf0p7sik4';
  s.async = true;
  document.head.appendChild(s);
}

function loadTikTokPixel() {
  window.TiktokAnalyticsObject = 'ttq';
  const ttq = window.ttq = window.ttq || [];
  ttq.methods = ['page','track','identify','instances','debug','on','off','once',
                 'ready','alias','group','enableCookie','disableCookie','holdConsent',
                 'revokeConsent','grantConsent'];
  ttq.setAndDefer = (t,e)=>{ t[e] = (...a)=>t.push([e, ...a]); };
  ttq.methods.forEach(m=>ttq.setAndDefer(ttq,m));

  ttq.load = id => {
    const s = document.createElement('script');
    s.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`;
    s.async = true;
    document.head.appendChild(s);
  };
  ttq.load('D0M3KORC77UCAFR1EOLG');
  ttq.page();
}

/* — cookie helpers — */
const setCookie = (n,v,d=180)=>{
  const exp = new Date(Date.now()+d*864e5).toUTCString();
  document.cookie = `${n}=${v}; expires=${exp}; path=/; SameSite=Lax`;
};
const getCookie = n =>
  document.cookie.split('; ').find(c=>c.startsWith(n+'='))?.split('=')[1];

/* — public init — */
export function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const accept = banner.querySelector('#accept-all');
  const deny   = banner.querySelector('#deny-all');

  const consent = getCookie('userConsent');

  /* already decided → act immediately, never show banner */
  if (consent === 'allow') { loadGoogleAnalytics(); loadClarity(); loadTikTokPixel(); banner.remove(); return; }
  if (consent === 'deny')  { banner.remove(); return; }

  /* no decision yet → wait until main thread is idle so we don’t affect LCP */
  const show = () => {
    banner.hidden = false;
    banner.classList.add('is-visible');

    accept.onclick = () => {
      setCookie('userConsent','allow');
      banner.remove();
      loadGoogleAnalytics(); loadClarity(); loadTikTokPixel();
    };
    deny.onclick   = () => {
      setCookie('userConsent','deny');
      banner.remove();
    };
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(show, { timeout: 2000 });   // still shows ~1 s in worst case
  } else {
    // fallback: after onload
    window.addEventListener('load', show);
  }
}
