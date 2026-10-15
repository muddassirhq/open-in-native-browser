/**
 * open-in-native-browser v2 — core logic
 *
 * Detects in-app browsers (Instagram, Facebook, Messenger, Threads, LinkedIn,
 * TikTok, Snapchat, X, Pinterest, Reddit, WhatsApp, Telegram, LINE, WeChat)
 * and helps the visitor escape to their real browser: an automatic handoff
 * where one is known to work, plus a dismissible banner with a manual
 * "Open" button and a "Copy link" fallback.
 *
 * No side effects on import — nothing runs until you call init().
 * Source of truth: this file. `npm run build` generates src/index.js (CJS)
 * and dist/auto.global.js (IIFE + auto-init) from it.
 */

var STYLE_ID = 'oinb-styles';
var BANNER_ID = 'oinb-banner';
var DISMISS_KEY = 'oinb_dismissed';
var TRIED_KEY = 'oinb_tried';

/**
 * Known in-app browsers. Order matters: more specific apps first
 * (Messenger and Threads before Facebook/Instagram).
 * `ios` / `android`: escape strategy on that platform.
 *   'extbrowser:<scheme>' → <scheme>://extbrowser/?url=…  (Meta's own handoff)
 *   'x-safari'            → x-safari-https://…            (iOS 17+ Safari handoff)
 *   'intent'              → Android intent:// to the default/Chrome browser
 *   'line'                → LINE's official ?openExternalBrowser=1
 *   null                  → no programmatic escape; banner explains + copy link
 * `autoIOS`: whether an automatic (no-tap) attempt is reported to work on iOS.
 * Apps set to false still escape — via the banner's "Open" tap (a user gesture).
 */
var APPS = [
  { key: 'messenger', name: 'Messenger', re: /FBAN\/Messenger|\bFB[\w_]+\/Messenger|Orca-Android/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'threads', name: 'Threads', re: /\bBarcelona\b/i, ios: 'extbrowser:barcelona', android: 'intent', autoIOS: true },
  { key: 'instagram', name: 'Instagram', re: /\bInstagram\b/i, ios: 'extbrowser:instagram', android: 'intent', autoIOS: true },
  { key: 'facebook', name: 'Facebook', re: /FBAN|FBAV|FB_IAB|FBIOS|\bFB[\w_]+\/|\bFacebook\b/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'linkedin', name: 'LinkedIn', re: /LinkedInApp/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'tiktok', name: 'TikTok', re: /musical_ly|Bytedance|\bTikTok\b|\btrill_/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'snapchat', name: 'Snapchat', re: /Snapchat/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'twitter', name: 'X', re: /\bTwitter\b/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'pinterest', name: 'Pinterest', re: /\bPinterest\b/i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'reddit', name: 'Reddit', re: /\bReddit\//i, ios: 'x-safari', android: 'intent', autoIOS: false },
  { key: 'whatsapp', name: 'WhatsApp', re: /\b(WAiOS|WA4A)\//i, ios: 'x-safari', android: 'intent', autoIOS: true },
  { key: 'line', name: 'LINE', re: /\bLine\//i, ios: 'line', android: 'line', autoIOS: true },
  { key: 'wechat', name: 'WeChat', re: /MicroMessenger\//i, ios: null, android: null, autoIOS: false }
];

var TELEGRAM = { key: 'telegram', name: 'Telegram', ios: 'x-safari', android: 'intent', autoIOS: true };
var GENERIC = { key: 'webview', name: 'this app', ios: 'x-safari', android: 'intent', autoIOS: false };

var BANNER_CSS = [
  '#' + BANNER_ID + '.oinb-banner{',
  'position:fixed;top:-160px;left:12px;right:12px;z-index:2147483647;',
  'display:flex;align-items:center;gap:10px;padding:12px 14px;',
  'margin-top:env(safe-area-inset-top);',
  'background:#111318;color:#fff;border-radius:14px;',
  'box-shadow:0 8px 24px rgba(0,0,0,.25);',
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
  'font-size:14px;line-height:1.4;transition:top .35s ease;box-sizing:border-box;',
  '}',
  '#' + BANNER_ID + '.oinb-banner--visible{top:12px;}',
  '.oinb-banner__text{flex:1;min-width:0;overflow-wrap:anywhere;}',
  '.oinb-banner__actions{display:flex;gap:6px;flex-shrink:0;}',
  '.oinb-banner__cta,.oinb-banner__copy{font:inherit;font-weight:600;padding:8px 14px;',
  'border-radius:999px;text-decoration:none;white-space:nowrap;cursor:pointer;border:0;}',
  '.oinb-banner__cta{background:#fff;color:#111318;}',
  '.oinb-banner__copy{background:rgba(255,255,255,.14);color:#fff;}',
  '.oinb-banner__close{background:transparent;border:none;color:#9aa0a6;font-size:20px;',
  'cursor:pointer;padding:0 2px;line-height:1;flex-shrink:0;}',
  '@media (max-width:420px){#' + BANNER_ID + '.oinb-banner{flex-wrap:wrap;}',
  '.oinb-banner__text{flex-basis:calc(100% - 30px);}.oinb-banner__actions{margin-left:auto;}}',
  '@media (min-width:640px){#' + BANNER_ID + '.oinb-banner{left:auto;right:20px;max-width:460px;}}'
].join('');

var DEFAULTS = {
  message: '{app} is limiting this page. For the best experience, open it in your browser.',
  noEscapeMessage: "{app} can't hand this page to your browser. Tap ··· then “Open in browser”, or copy the link.",
  ctaLabel: 'Open',
  copyLabel: 'Copy link',
  copiedLabel: 'Copied ✓',
  showCopy: true,
  autoBreakout: true,
  showBanner: true,
  bannerDelay: 400,
  respectDismiss: true,
  forceShow: false,
  apps: null,          // e.g. ['instagram','facebook'] to only target these
  exclude: null,       // e.g. ['wechat'] to ignore these
  detectGeneric: false, // also treat unknown Android WebViews ("; wv)") as in-app
  androidPackage: 'com.android.chrome', // null = let Android pick the default browser
  onDetect: null       // function (env) {}
};

function isTelegramWindow() {
  if (typeof window === 'undefined') return false;
  return 'TelegramWebview' in window || 'TelegramWebviewProxy' in window || 'TelegramWebviewProxyProto' in window;
}

function inList(list, key) {
  if (!list) return false;
  for (var i = 0; i < list.length; i++) if (list[i] === key) return true;
  return false;
}

/**
 * detectEnvironment(ua?, options?) → { ua, app, appName, isInApp, isIOS, isAndroid,
 *   isInstagram, isFacebook, canEscape }
 */
function detectEnvironment(uaOverride, opts) {
  opts = opts || {};
  var ua = uaOverride || (typeof navigator !== 'undefined' && (navigator.userAgent || navigator.vendor)) || '';
  var isIPadOS = /Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && !uaOverride;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || isIPadOS;
  var isAndroid = /Android/i.test(ua);

  var match = null;
  for (var i = 0; i < APPS.length; i++) {
    if (APPS[i].re.test(ua)) { match = APPS[i]; break; }
  }
  if (!match && !uaOverride && isTelegramWindow()) match = TELEGRAM;
  if (!match && opts.detectGeneric && isAndroid && /;\s?wv\)/.test(ua)) match = GENERIC;

  if (match && (inList(opts.exclude, match.key) || (opts.apps && !inList(opts.apps, match.key)))) match = null;

  var strategy = match ? (isIOS ? match.ios : isAndroid ? match.android : null) : null;

  return {
    ua: ua,
    app: match ? match.key : null,
    appName: match ? match.name : null,
    isInApp: !!match,
    isIOS: isIOS,
    isAndroid: isAndroid,
    // v1 compatibility
    isInstagram: !!match && (match.key === 'instagram' || match.key === 'threads'),
    isFacebook: !!match && (match.key === 'facebook' || match.key === 'messenger'),
    canEscape: !!strategy,
    _strategy: strategy,
    _autoIOS: match ? match.autoIOS : false
  };
}

function androidIntentUrl(url, pkg) {
  var m = /^(https?):\/\/(.*)$/i.exec(url);
  if (!m) return url;
  return 'intent://' + m[2] + '#Intent;scheme=' + m[1].toLowerCase() + ';action=android.intent.action.VIEW;' +
    (pkg ? 'package=' + pkg + ';' : '') + 'end';
}

function lineExternalUrl(url) {
  if (/[?&]openExternalBrowser=1/.test(url)) return url;
  var hashIdx = url.indexOf('#');
  var base = hashIdx === -1 ? url : url.slice(0, hashIdx);
  var hash = hashIdx === -1 ? '' : url.slice(hashIdx);
  return base + (base.indexOf('?') === -1 ? '?' : '&') + 'openExternalBrowser=1' + hash;
}

/** getEscapeUrl(env, url?, options?) → string | null */
function getEscapeUrl(env, currentUrl, opts) {
  opts = opts || {};
  currentUrl = currentUrl || (typeof window !== 'undefined' && window.location ? window.location.href : '');
  var s = env && env._strategy;
  if (!s || !currentUrl) return null;
  if (s === 'intent') return androidIntentUrl(currentUrl, opts.androidPackage === undefined ? DEFAULTS.androidPackage : opts.androidPackage);
  if (s === 'line') return lineExternalUrl(currentUrl);
  if (s === 'x-safari') return 'x-safari-' + currentUrl;
  if (s.indexOf('extbrowser:') === 0) return s.slice(11) + '://extbrowser/?url=' + encodeURIComponent(currentUrl);
  return null;
}

function go(url, viaMeta) {
  // Meta's iOS WebView silently drops scripted navigations to custom schemes
  // on load, but honours a meta refresh — so iOS uses a meta refresh.
  if (viaMeta && typeof document !== 'undefined' && document.head) {
    var m = document.createElement('meta');
    m.httpEquiv = 'refresh';
    m.content = '0;url=' + url;
    document.head.appendChild(m);
  } else {
    window.location.href = url;
  }
}

function sessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

function attemptBreakout(env, currentUrl, opts) {
  if (!env.isInApp || !env.canEscape) return false;
  if (env.isIOS && !env._autoIOS) return false; // needs a user tap → banner
  if (sessionGet(TRIED_KEY) === '1') return false; // one automatic try per session, never loop
  var url = getEscapeUrl(env, currentUrl, opts);
  if (!url) return false;
  sessionSet(TRIED_KEY, '1');
  go(url, env.isIOS);
  return true;
}

/**
 * escape() — trigger the handoff from your own button/click handler.
 * Returns false if no programmatic escape exists for this app.
 */
function escape(opts) {
  var env = detectEnvironment(opts && opts.userAgent, opts);
  var url = getEscapeUrl(env, null, opts);
  if (!url) return false;
  window.location.href = url;
  return true;
}

function copyText(text, done) {
  function fallback() {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) { done(false); }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
  } else {
    fallback();
  }
}

function fmt(str, env) { return String(str).replace(/\{app\}/g, env.appName || 'This app'); }

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  var style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BANNER_CSS;
  document.head.appendChild(style);
}

function showBanner(options, env, currentUrl) {
  if (!document.body || document.getElementById(BANNER_ID)) return null;
  injectStyles();

  var escapeUrl = getEscapeUrl(env, currentUrl, options);

  var banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'oinb-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('data-app', env.app || '');

  var text = document.createElement('span');
  text.className = 'oinb-banner__text';
  text.textContent = fmt(escapeUrl ? options.message : options.noEscapeMessage, env);

  var actions = document.createElement('div');
  actions.className = 'oinb-banner__actions';

  if (escapeUrl) {
    var cta = document.createElement('a');
    cta.className = 'oinb-banner__cta';
    cta.href = escapeUrl;
    cta.rel = 'noopener noreferrer';
    cta.textContent = options.ctaLabel;
    actions.appendChild(cta);
  }

  if (options.showCopy || !escapeUrl) {
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'oinb-banner__copy';
    copy.textContent = options.copyLabel;
    copy.addEventListener('click', function () {
      copyText(currentUrl, function (ok) {
        if (ok) copy.textContent = options.copiedLabel;
      });
    });
    actions.appendChild(copy);
  }

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'oinb-banner__close';
  close.setAttribute('aria-label', 'Dismiss');
  close.innerHTML = '&times;';
  close.addEventListener('click', function () {
    banner.classList.remove('oinb-banner--visible');
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 350);
    sessionSet(DISMISS_KEY, '1');
  });

  banner.appendChild(text);
  banner.appendChild(actions);
  banner.appendChild(close);
  document.body.appendChild(banner);

  requestAnimationFrame(function () { banner.classList.add('oinb-banner--visible'); });
  return banner;
}

/**
 * init(options?) — call once, early (app entry / root component).
 * Safe to call repeatedly and during SSR; no-ops outside an in-app browser.
 */
function init(userOptions) {
  var options = {};
  var k;
  for (k in DEFAULTS) options[k] = DEFAULTS[k];
  for (k in (userOptions || {})) options[k] = userOptions[k];

  var env = detectEnvironment(options.userAgent, options);
  if (typeof options.onDetect === 'function') { try { options.onDetect(env); } catch (e) {} }

  if (!env.isInApp || typeof window === 'undefined') {
    return { env: env, attemptedBreakout: false, bannerShown: false };
  }

  var currentUrl = (window.location && window.location.href) || '';
  var attempted = options.autoBreakout ? attemptBreakout(env, currentUrl, options) : false;

  var bannerShown = false;
  if (options.showBanner && typeof document !== 'undefined') {
    var dismissed = options.respectDismiss && !options.forceShow && sessionGet(DISMISS_KEY) === '1';
    if (!dismissed) {
      var show = function () { setTimeout(function () { showBanner(options, env, currentUrl); }, options.bannerDelay); };
      if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
      bannerShown = true;
    }
  }

  return { env: env, attemptedBreakout: attempted, bannerShown: bannerShown };
}

var OpenInNativeBrowser = { init: init, escape: escape, detectEnvironment: detectEnvironment, getEscapeUrl: getEscapeUrl, APPS: APPS, DEFAULTS: DEFAULTS };

// @@EXPORTS
export { init, escape, detectEnvironment, getEscapeUrl, APPS, DEFAULTS };
export default OpenInNativeBrowser;
