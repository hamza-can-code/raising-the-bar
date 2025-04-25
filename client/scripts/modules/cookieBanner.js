// client/scripts/modules/cookieBanner.js

export function initCookieBanner() {
    const banner = document.getElementById("cookie-banner");
    const accept = document.getElementById("accept-all");
    const deny   = document.getElementById("deny-all");
  
    function setCookie(n, v, days=180) {
      const d = new Date();
      d.setTime(d.getTime() + days*24*60*60*1000);
      document.cookie = `${n}=${v}; expires=${d.toUTCString()}; path=/`;
    }
    function getCookie(n) {
      return document.cookie.split("; ").find(r => r.startsWith(n+"="))
             ?.split("=")[1];
    }
  
    if (getCookie("userConsent")) {
      banner.style.display = "none";
    } else {
      accept.addEventListener("click", () => {
        setCookie("userConsent","allow");
        banner.style.display = "none";
        // load analytics…
      });
      deny.addEventListener("click", () => {
        setCookie("userConsent","deny");
        banner.style.display = "none";
      });
    }
  }
  