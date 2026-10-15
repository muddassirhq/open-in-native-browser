import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { detectEnvironment, getEscapeUrl } from '../src/index.mjs';

const require = createRequire(import.meta.url);

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.240205.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36';

const cases = [
  ['instagram', 'ios', `${IOS} Instagram 337.0.3.23.54 (iPhone14,5; iOS 17_5; en_US; en-US; scale=3.00; 1170x2532; 614391512)`],
  ['instagram', 'android', `${AND} Instagram 337.0.0.35.102 Android (34/14; 420dpi; 1080x2400; Google; Pixel 7)`],
  ['facebook', 'ios', `${IOS} [FBAN/FBIOS;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]`],
  ['facebook', 'android', `${AND} [FB_IAB/FB4A;FBAV/460.0.0.48.109;]`],
  ['messenger', 'ios', `${IOS} [FBAN/MessengerForiOS;FBAV/460.0.0.42.106;FBBV/600000000;FBDV/iPhone14,5]`],
  ['threads', 'ios', `${IOS} Barcelona 320.0.0.25.82 (iPhone14,5; iOS 17_5; en_US; en-US; scale=3.00; 1170x2532; 589154416)`],
  ['linkedin', 'ios', `${IOS} [LinkedInApp]/9.29.6`],
  ['linkedin', 'android', `${AND} [LinkedInApp]/4.1.903`],
  ['tiktok', 'ios', `${IOS} musical_ly_34.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US`],
  ['tiktok', 'android', `${AND} trill_340103 BytedanceWebview/d8a21c6`],
  ['snapchat', 'ios', `${IOS} Snapchat/12.90.0.40 (like Safari/8617.2.4.10.8, panda)`],
  ['twitter', 'ios', `${IOS} Twitter for iPhone/10.48`],
  ['pinterest', 'ios', `${IOS} [Pinterest/iOS]`],
  ['whatsapp', 'ios', `${IOS} WAiOS/24.10.79`],
  ['line', 'ios', `${IOS} Safari Line/14.6.0`],
  ['wechat', 'ios', `${IOS} MicroMessenger/8.0.49(0x18003133) NetType/WIFI Language/en`],
];

for (const [app, os, ua] of cases) {
  test(`detects ${app} on ${os}`, () => {
    const env = detectEnvironment(ua);
    assert.equal(env.app, app);
    assert.equal(env.isInApp, true);
    assert.equal(os === 'ios' ? env.isIOS : env.isAndroid, true);
  });
}

const notInApp = {
  'Safari iOS': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Chrome iOS': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1',
  'Chrome Android': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
  'Samsung Internet': 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  'Desktop Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
for (const [name, ua] of Object.entries(notInApp)) {
  test(`ignores ${name}`, () => assert.equal(detectEnvironment(ua).isInApp, false));
}

test('generic Android WebView only when opted in', () => {
  assert.equal(detectEnvironment(AND).isInApp, false);
  assert.equal(detectEnvironment(AND, { detectGeneric: true }).app, 'webview');
});

test('apps / exclude filters', () => {
  const ig = cases[0][2];
  assert.equal(detectEnvironment(ig, { exclude: ['instagram'] }).isInApp, false);
  assert.equal(detectEnvironment(ig, { apps: ['facebook'] }).isInApp, false);
  assert.equal(detectEnvironment(ig, { apps: ['instagram'] }).isInApp, true);
});

test('v1 compatibility flags', () => {
  assert.equal(detectEnvironment(cases[0][2]).isInstagram, true);
  assert.equal(detectEnvironment(cases[2][2]).isFacebook, true);
});

const url = 'https://example.com/shop?x=1#buy';
const esc = (ua, o) => getEscapeUrl(detectEnvironment(ua), url, o);

test('escape URLs per strategy', () => {
  assert.equal(esc(cases[0][2]), 'instagram://extbrowser/?url=' + encodeURIComponent(url));
  assert.equal(esc(cases[5][2]), 'barcelona://extbrowser/?url=' + encodeURIComponent(url));
  assert.equal(esc(cases[2][2]), 'x-safari-' + url);
  assert.equal(esc(cases[3][2]), 'intent://example.com/shop?x=1#buy#Intent;scheme=https;action=android.intent.action.VIEW;package=com.android.chrome;end');
  assert.equal(esc(cases[3][2], { androidPackage: null }), 'intent://example.com/shop?x=1#buy#Intent;scheme=https;action=android.intent.action.VIEW;end');
  assert.equal(esc(cases[14][2]), 'https://example.com/shop?x=1&openExternalBrowser=1#buy');
  assert.equal(esc(cases[15][2]), null);
});

test('CommonJS build matches ESM', () => {
  const cjs = require('../src/index.js');
  assert.equal(typeof cjs.init, 'function');
  assert.equal(typeof cjs.default.init, 'function');
  assert.equal(cjs.detectEnvironment(cases[6][2]).app, 'linkedin');
});
