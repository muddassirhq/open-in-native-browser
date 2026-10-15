# open-in-native-browser

**Links shared on Instagram should open where people expect — their real browser or the app — not inside Instagram.**

[![npm](https://img.shields.io/npm/v/open-in-native-browser)](https://www.npmjs.com/package/open-in-native-browser)
[![gzip size](https://img.shields.io/bundlephobia/minzip/open-in-native-browser)](https://bundlephobia.com/package/open-in-native-browser)
[![license](https://img.shields.io/npm/l/open-in-native-browser)](LICENSE)

▶️ [12-second demo](https://www.youtube.com/shorts/Q87Aih7On0o) · 🧪 [Live demo page](https://muddassirhq.github.io/open-in-native-browser)

## The problem

You tap a link in someone's Instagram bio. It doesn't open Safari or Chrome. It opens Instagram's own mini-browser:

- **You're logged out of everything.** No saved passwords, no saved cards, no cart.
- **Links that should open an app don't.** YouTube, Spotify, Amazon or Maps load as clunky mobile pages instead of the app you're already signed into.
- **Checkouts and sign-ups stall.** No autofill, no Apple Pay/Google Pay sheet you're used to, and "Sign in with Google" is blocked outright (`403 disallowed_useragent`).
- **The page vanishes.** Close Instagram and it's gone — no tab, no history.

Facebook, Messenger, Threads, LinkedIn, TikTok, X, Snapchat and others all do the same. Visitors don't know why the link "feels broken" — they just leave.

## The fix

It detects the in-app browser, hands the visitor to their real browser (which then opens the right app), and — when the app blocks the handoff — shows a small banner with an **Open** button and a **Copy link** fallback. In normal browsers it does nothing.

```bash
npm install open-in-native-browser
```

```js
import OpenInNativeBrowser from 'open-in-native-browser';
OpenInNativeBrowser.init();
```

No build step? One script tag works too:

```html
<script src="https://cdn.jsdelivr.net/npm/open-in-native-browser@2/dist/auto.global.js"></script>
```

Perfect for **link-in-bio pages, link shorteners, ad landing pages, checkouts (Gumroad, Stripe, Shopify), booking pages, funnels (GoHighLevel, ClickFunnels), course and membership sites.**

## Supported in-app browsers

| App | iOS handoff | Android handoff | Auto (no tap) on iOS |
|---|---|---|---|
| Instagram | `instagram://extbrowser` | Chrome intent | ✅ |
| Threads | `barcelona://extbrowser` | Chrome intent | ✅ |
| Facebook / Messenger | `x-safari-https` (tap) | Chrome intent | Banner |
| LinkedIn | `x-safari-https` (tap) | Chrome intent | Banner |
| TikTok | `x-safari-https` (tap) | Chrome intent | Banner |
| X / Twitter, Snapchat, Pinterest, Reddit | `x-safari-https` (tap) | Chrome intent | Banner |
| WhatsApp, Telegram | `x-safari-https` | Chrome intent | ✅ |
| LINE | official `?openExternalBrowser=1` | same | ✅ |
| WeChat | none available | none available | Banner explains + Copy link |

Android always attempts the handoff automatically (once per session). These handoffs are undocumented app behaviour that can change — which is why the banner always ships as a fallback. **Tested an app on a real device? [Open an issue](https://github.com/muddassirhq/open-in-native-browser/issues/new) with app, OS and result** — the table above is kept current from those reports.

## Install

### Any website (no build step)

Put it as early as possible in `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/open-in-native-browser@2/dist/auto.global.js"></script>
```

Works anywhere you can add custom head code: WordPress, Shopify, Webflow, Framer, Squarespace, Wix, Carrd, GoHighLevel, Ghost. Customise by defining options first:

```html
<script>
  window.OPEN_IN_NATIVE_BROWSER_OPTIONS = { ctaLabel: 'Open in browser' };
</script>
<script src="https://cdn.jsdelivr.net/npm/open-in-native-browser@2/dist/auto.global.js"></script>
```

Set `window.OPEN_IN_NATIVE_BROWSER_NO_AUTOINIT = true` to load it without running, then call `window.OpenInNativeBrowser.init()` yourself.

### npm (React, Vue, Svelte, Angular, Next.js, Astro…)

```bash
npm install open-in-native-browser
```

```js
import OpenInNativeBrowser from 'open-in-native-browser';

OpenInNativeBrowser.init(); // once, client-side, at app entry
```

TypeScript types included. See `examples/` for React, Vue, Next.js, Angular and Svelte.

### Platforms

| Platform | How |
|---|---|
| Link shorteners / redirect pages | Load the script on the interstitial *before* redirecting |

### Using an AI coding agent?

Point it at [`skills/open-in-native-browser/SKILL.md`](skills/open-in-native-browser/SKILL.md) (or [`llms.txt`](llms.txt)) and it'll know when and how to add this.

## API

```js
OpenInNativeBrowser.init(options?)            // → { env, attemptedBreakout, bannerShown }
OpenInNativeBrowser.escape(options?)          // trigger the handoff from your own button → boolean
OpenInNativeBrowser.detectEnvironment(ua?, options?) // → { app, appName, isInApp, isIOS, isAndroid, canEscape, … }
OpenInNativeBrowser.getEscapeUrl(env, url?, options?) // → string | null
```

| Option | Default | Description |
|---|---|---|
| `message` | `"{app} is limiting this page…"` | Banner text; `{app}` becomes the app name |
| `noEscapeMessage` | WeChat-style instructions | Text when no handoff exists |
| `ctaLabel` / `copyLabel` / `copiedLabel` | `"Open"` / `"Copy link"` / `"Copied ✓"` | Button labels |
| `showCopy` | `true` | Show the Copy link button |
| `autoBreakout` | `true` | Try the automatic handoff (once per session, never loops) |
| `showBanner` | `true` | Show the fallback banner |
| `bannerDelay` | `400` | ms before the banner appears |
| `respectDismiss` | `true` | Stay hidden for the session once dismissed |
| `forceShow` | `false` | Ignore a previous dismissal (testing) |
| `apps` / `exclude` | `null` | Only / never act inside these apps, e.g. `['instagram','facebook']` |
| `detectGeneric` | `false` | Also treat unknown Android WebViews as in-app |
| `androidPackage` | `"com.android.chrome"` | Browser for the Android handoff; `null` lets Android choose |
| `onDetect` | `null` | `(env) => {}` — e.g. send `env.app` to analytics |
| `userAgent` | `navigator.userAgent` | Override for testing |

Upgrading from v1? `init()`, `detectEnvironment()`, `isInstagram` and `isFacebook` still work. v2 acts in more apps by default — pass `apps: ['instagram','facebook']` to keep v1 behaviour.

## Styling

The banner is `#oinb-banner` (classes prefixed `oinb-`, styles in one scoped `<style>` tag). Override with higher specificity. `data-app` on the banner holds the detected app.

## Limitations

- Detection is User-Agent based (plus a window check for Telegram). Best-effort, never a security boundary.
- Handoff methods are unofficial and change. The banner is the reliable fallback; keep `showBanner` on.
- Opening a native app *from* the real browser depends on that app's universal/app links — the browser decides, not this library.

## Related

- [Awesome Link Shorteners](https://github.com/muddassirhq/awesome-link-shorteners) — hosted and open-source shorteners, link-in-bio and app-opener tools, compared on whether links open properly from in-app browsers.

## Development

```bash
npm test   # builds src/index.js + dist/auto.global.js from src/index.mjs, then runs UA tests
```

Edit `src/index.mjs` only; the other two files are generated.

## License

MIT
