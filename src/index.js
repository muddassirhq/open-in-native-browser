/**
 * open-in-native-browser — core logic
 * Detects Meta (Instagram/Facebook) in-app browsers and attempts to break
 * the user out into their device's native browser, with a visible,
 * dismissible fallback banner + manual escape link if automation fails.
 *
 * No side effects on import — nothing runs until you call init().
 */

var STYLE_ID = 'oinb-styles';
var BANNER_ID = 'oinb-banner';
var DISMISS_KEY = 'oinb_dismissed';

var BANNER_CSS = [
  '#' + BANNER_ID + '.oinb-banner{',
  'position:fixed;top:-120px;left:12px;right:12px;z-index:2147483647;',
  'display:flex;align-items:center;gap:10px;padding:12px 14px;',
  'padding-top:calc(12px + env(safe-area-inset-top));',
  'background:#111318;color:#fff;border-radius:14px;',
  'box-shadow:0 8px 24px rgba(0,0,0,.25);',
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
  'font-size:14px;line-height:1.4;transition:top .35s ease;box-sizing:border-box;',
  '}',
  '#' + BANNER_ID + '.oinb-banner--visible{top:12px;}',
  '.oinb-banner__content{display:flex;align-items:center;gap:8px;flex:1;min-width:0;}',
  '.oinb-banner__icon{font-size:16px;flex-shrink:0;}',
  '.oinb-banner__text{overflow-wrap:anywhere;}',
  '.oinb-banner__cta{flex-shrink:0;background:#fff;color:#111318;font-weight:600;',
  'padding:8px 14px;border-radius:999px;text-decoration:none;white-space:nowrap;}',
  '.oinb-banner__close{background:transparent;border:none;color:#9aa0a6;font-size:18px;',
  'cursor:pointer;padding:0 2px;line-height:1;flex-shrink:0;}',
  '@media (min-width:640px){#' + BANNER_ID + '.oinb-banner{left:auto;right:20px;max-width:440px;}}'
].join('');

var DEFAULTS = {
  message: "Instagram is restricting this website's features. For the best experience, tap here to open in your default browser.",
  ctaLabel: 'Open',
  autoBreakout: true,
  showBanner: true,
  bannerDelay: 400,
  respectDismiss: true,
  forceShow: false
};

function detectEnvironment(uaOverride) {
  var ua = uaOverride || (typeof navigator !== 'undefined' && (navigator.userAgent || navigator.vendor)) || '';
  var isInstagram = /Instagram/i.test(ua);
  var isFacebook = /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua);
  var isIOS = /iPad|iPhone|iPod/.test(ua) && !(typeof window !== 'undefined' && window.MSStream);
  var isAndroid = /Android/i.test(ua);
  return {
    ua: ua,
    isInstagram: isInstagram,
    isFacebook: isFacebook,
    isInApp: isInstagram || isFacebook,
    isIOS: isIOS,
    isAndroid: isAndroid
  };
}

function androidIntentUrl(currentUrl) {
  var noProtocol = currentUrl.replace(/^https?:\/\//, '');
  return 'intent://' + noProtocol + '#Intent;scheme=https;package=com.android.chrome;end';
}

function iosSafariUrl(currentUrl) {
  // Long-standing scheme trick: some Meta WebViews treat an x-safari- prefixed
  // URL as an instruction to hand off navigation to Safari. Not guaranteed to
  // keep working if Apple/Meta change WebView handling — hence the banner.
  return 'x-safari-' + currentUrl;
}

function attemptBreakout(env, currentUrl) {
  if (!env.isInApp) return false;
  var encoded = encodeURIComponent(currentUrl);

  if (env.isAndroid) {
    window.location.href = androidIntentUrl(currentUrl);
    return true;
  }

  if (env.isIOS) {
    // 1) Meta's documented external-browser deep link
    window.location.href = 'instagram://extbrowser/?url=' + encoded;
    // 2) Fallback attempt a beat later in case (1) is ignored/blocked
    setTimeout(function () {
      window.location.href = iosSafariUrl(currentUrl);
    }, 600);
    return true;
  }

  return false;
}

function manualEscapeUrl(env, currentUrl) {
  if (env.isAndroid) return androidIntentUrl(currentUrl);
  if (env.isIOS) return iosSafariUrl(currentUrl);
  return currentUrl;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  var style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BANNER_CSS;
  document.head.appendChild(style);
}

function showBanner(options, env, currentUrl) {
  if (document.getElementById(BANNER_ID)) return null;
  injectStyles();

  var escapeUrl = manualEscapeUrl(env, currentUrl);

  var banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'oinb-banner';
  banner.setAttribute('role', 'alert');

  var content = document.createElement('div');
  content.className = 'oinb-banner__content';

  var icon = document.createElement('span');
  icon.className = 'oinb-banner__icon';
  icon.textContent = '⚠️';

  var text = document.createElement('span');
  text.className = 'oinb-banner__text';
  text.textContent = options.message;

  content.appendChild(icon);
  content.appendChild(text);

  var cta = document.createElement('a');
  cta.className = 'oinb-banner__cta';
  cta.href = escapeUrl;
  cta.rel = 'noopener noreferrer';
  cta.textContent = options.ctaLabel;

  var close = document.createElement('button');
  close.className = 'oinb-banner__close';
  close.setAttribute('aria-label', 'Dismiss');
  close.innerHTML = '&times;';
  close.addEventListener('click', function () {
    banner.classList.remove('oinb-banner--visible');
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 350);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  });

  banner.appendChild(content);
  banner.appendChild(cta);
  banner.appendChild(close);
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    banner.classList.add('oinb-banner--visible');
  });

  return banner;
}

/**
 * init(options) — call this once, e.g. in your app's entry point / root
 * component. Safe to call multiple times; it no-ops if not in an
 * Instagram/Facebook in-app browser, and won't double-inject the banner.
 */
function init(userOptions) {
  var options = {};
  for (var k in DEFAULTS) options[k] = DEFAULTS[k];
  for (var k2 in (userOptions || {})) options[k2] = userOptions[k2];

  var env = detectEnvironment(options.userAgent);

  if (!env.isInApp) {
    return { env: env, attemptedBreakout: false, bannerShown: false };
  }

  var currentUrl = (typeof window !== 'undefined' && window.location && window.location.href) || '';
  var attempted = false;

  if (options.autoBreakout && typeof window !== 'undefined') {
    attempted = attemptBreakout(env, currentUrl);
  }

  var bannerShown = false;
  if (options.showBanner && typeof document !== 'undefined') {
    var alreadyDismissed = false;
    if (options.respectDismiss && !options.forceShow) {
      try { alreadyDismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) {}
    }
    if (!alreadyDismissed) {
      setTimeout(function () {
        showBanner(options, env, currentUrl);
      }, options.bannerDelay);
      bannerShown = true;
    }
  }

  return { env: env, attemptedBreakout: attempted, bannerShown: bannerShown };
}

module.exports = {
  init: init,
  detectEnvironment: detectEnvironment,
  DEFAULTS: DEFAULTS
};
