// Order channel smart routing — app for mobile, web for desktop.
//
// Strategy:
//  - Mobile devices → click opens the native app via Universal/App Link
//    (gofood.link / app.grab.com). iOS & Android both honor these as
//    auto-redirect targets when the matching app is installed.
//  - Desktop / unknown → fall back to the web storefront.
//
// This is a progressive enhancement: if JS is disabled or device detection
// fails, the static `href` (app link) still works on mobile, and on desktop
// the OS/browser will simply load the URL and the storefront will handle
// it (either by redirecting to the web URL or showing a friendly page).
(function () {
  'use strict';

  function detectMobile() {
    var ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    // Tablet regex must run BEFORE mobile, because some tablets contain "Mobile" too.
    if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
    if (/android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|mobile safari|webos|windows phone/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function isInApp() {
    // Detect in-app browsers (Instagram, FB, Line, WhatsApp) which can't open
    // external app deep links. In those, fall back to web URL.
    var ua = (navigator.userAgent || '').toLowerCase();
    return /instagram|fbav|fb_iab|fban|line\/|whatsapp|telegram|twitter/.test(ua);
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days || 30) * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
  }

  function wire() {
    var device = detectMobile();
    var inApp = isInApp();
    var stored = getCookie('retta_device');
    var effective = (inApp || device === 'desktop') ? 'web' : (stored || (device === 'mobile' ? 'app' : 'web'));

    // Honor the user's previous choice on this device.
    // (We don't track; just remember preference for 30 days.)

    // Reflect the active choice on the toggle UI.
    function syncToggleUI(activeMode) {
      document.querySelectorAll('[data-order-target]').forEach(function (b) {
        if (b.tagName === 'BUTTON') {
          b.setAttribute('data-active', String(b.getAttribute('data-order-target') === activeMode));
        }
      });
    }

    var btns = document.querySelectorAll('.order-btn[data-app-href][data-web-href]');
    btns.forEach(function (btn) {
      var appHref = btn.getAttribute('data-app-href');
      var webHref = btn.getAttribute('data-web-href');
      var finalHref = (effective === 'app') ? appHref : webHref;

      btn.setAttribute('href', finalHref);

      // Update label so customer understands where they're going.
      var labelEl = btn.querySelector('.order-label');
      if (labelEl) {
        labelEl.textContent = (effective === 'app') ? 'Buka di app' : 'Order via';
      }

      btn.addEventListener('click', function () {
        setCookie('retta_device', (finalHref === appHref) ? 'app' : 'web');
      });
    });

    syncToggleUI(effective);

    // Allow manual override via toggle buttons.
    document.querySelectorAll('button[data-order-target]').forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-order-target');
        if (mode !== 'app' && mode !== 'web') return;
        setCookie('retta_device', mode);
        // re-evaluate effective & re-render
        stored = mode;
        effective = mode;
        // Re-run the wiring logic for btns only.
        var newBtns = document.querySelectorAll('.order-btn[data-app-href][data-web-href]');
        newBtns.forEach(function (btn) {
          var appHref = btn.getAttribute('data-app-href');
          var webHref = btn.getAttribute('data-web-href');
          var finalHref = (effective === 'app') ? appHref : webHref;
          btn.setAttribute('href', finalHref);
          var labelEl = btn.querySelector('.order-label');
          if (labelEl) labelEl.textContent = (effective === 'app') ? 'Buka di app' : 'Order via';
        });
        syncToggleUI(effective);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
