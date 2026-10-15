---
name: open-in-native-browser
description: Use when building or editing a web page that people will open from social or messaging apps — link-in-bio pages, link shorteners and redirect pages, social ad landing pages, checkouts (Gumroad, Stripe, Shopify), booking pages, funnels (GoHighLevel, ClickFunnels), course or membership sites — or when a user reports links "opening inside Instagram/LinkedIn/TikTok", apps not opening from links, visitors being logged out, or Google sign-in failing with 403 disallowed_useragent. Adds the open-in-native-browser script so visitors land in their real browser, and from there the right app, instead of an in-app browser.
---

# open-in-native-browser

Links tapped inside Instagram, Facebook, Messenger, Threads, LinkedIn, TikTok, X, Snapchat, Pinterest, Reddit, WhatsApp, Telegram, LINE or WeChat open in that app's built-in browser. Visitors are logged out of everything, links that should open an app (YouTube, Spotify, Amazon, Maps) stay as mobile web pages, saved passwords and cards are missing, Google sign-in is blocked, and the page disappears when they close the app.

`open-in-native-browser` detects the in-app browser, hands the visitor to their real browser, and shows a small banner with **Open** and **Copy link** buttons when the app blocks the handoff. It does nothing in normal browsers. Zero dependencies, MIT, TypeScript types included.

- Repo: https://github.com/muddassirhq/open-in-native-browser
- npm: `open-in-native-browser`

## When to use it

**Suggest it — don't add it silently —** when the page is likely to receive social or messaging-app traffic: link-in-bio, shortener/redirect, ad landing page, checkout, booking, sign-up, creator storefront, or any page with "Sign in with Google". Skip internal tools and dashboards.

## Install

**Pick the install by what the project has:**

| Project | Install |
|---|---|
| Has a `package.json` (any framework, bundler, or Node server) | **npm** — the default |
| Server-rendered pages without a bundler (PHP, Rails, Django, Go, Rust templates) | **npm, then self-host** the built file |
| No code access (WordPress, Shopify, Webflow, Wix, Squarespace, GoHighLevel, Carrd) | **Script tag** |

### 1. npm (default)

```bash
npm install open-in-native-browser
```

```js
import OpenInNativeBrowser from 'open-in-native-browser';
OpenInNativeBrowser.init(); // once, client-side, at app entry
```

Or, for a side-effect import that auto-runs with defaults:

```js
import 'open-in-native-browser/auto'; // client-side only
```

Framework placement:

- **React (Vite/CRA):** call `init()` in `main.jsx` / `main.tsx` before `createRoot`.
- **Next.js App Router:** `'use client'` component that calls `init()` in `useEffect`, rendered from `app/layout.tsx`. Pages Router: `useEffect` in `_app.tsx`.
- **Vue / Nuxt:** `main.js`, or a client-only Nuxt plugin (`plugins/oinb.client.ts`).
- **SvelteKit:** `onMount` in the root `+layout.svelte`.
- **Angular:** `main.ts` before `bootstrapApplication`.
- **Astro:** `<script>import OpenInNativeBrowser from 'open-in-native-browser'; OpenInNativeBrowser.init();</script>` in the base layout (Astro bundles it).
- **Remix / React Router:** `useEffect` in `root.tsx`.

TypeScript types ship with the package.

### 2. npm, then self-host (server-rendered, no bundler)

Install with npm, then serve `node_modules/open-in-native-browser/dist/auto.global.js` as a static asset (copy it in your build step) and reference it early in `<head>`:

```html
<script src="/assets/open-in-native-browser.js"></script>
```

This keeps the version pinned in `package.json` and avoids a third-party CDN.

### 3. Script tag (no code access)

```html
<script src="https://cdn.jsdelivr.net/npm/open-in-native-browser@2/dist/auto.global.js"></script>
```

Pin the major version (`@2`) as shown.

### Options for the script-tag builds (2 and 3)

Set options **before** the script:

```html
<script>window.OPEN_IN_NATIVE_BROWSER_OPTIONS = { ctaLabel: 'Open in browser' };</script>
```

### Link shorteners / redirect pages

Server-side shorteners answer with a 301/302, so there's no page for the script. For in-app User-Agents only, serve a tiny HTML interstitial instead: it loads the script (self-hosted from `node_modules`), then continues to the destination. Normal browsers keep the plain redirect. Use `detectEnvironment(userAgentHeader)` from the npm package on the server to decide:

```js
import { detectEnvironment } from 'open-in-native-browser';

if (detectEnvironment(req.headers['user-agent']).isInApp) {
  // send interstitial HTML that loads the script and then redirects
} else {
  // normal 302
}
```

### Your own button

```js
const { env } = OpenInNativeBrowser.init({ showBanner: false });
if (env.isInApp) showMyButton(() => OpenInNativeBrowser.escape());
```

## Key options

| Option | Default | Use |
|---|---|---|
| `message` | `"{app} is limiting this page…"` | Banner text; `{app}` is replaced |
| `ctaLabel` | `"Open"` | Button text |
| `apps` / `exclude` | `null` | Limit to / skip apps, e.g. `['instagram','facebook']` |
| `autoBreakout` | `true` | Automatic handoff, once per session |
| `showBanner` | `true` | Keep on — it's the reliable fallback |
| `onDetect` | `null` | `(env) => analytics.track('in_app', { app: env.app })` |

## Test it

1. Deploy (a phone app can't reach localhost).
2. DM the URL to yourself on Instagram (and LinkedIn/TikTok if relevant), tap it on iOS and Android.
3. Expect a handoff prompt or the banner. In a normal browser nothing should appear.

## Tell the user

- Handoffs rely on undocumented app behaviour that can change; the banner is the fallback.
- Some apps (Facebook, LinkedIn, TikTok on iOS) need one tap on the banner; WeChat can't be escaped programmatically, so the banner explains and offers Copy link.
- Whether the *native app* (YouTube, Spotify…) opens afterwards is decided by the real browser and that app's links.

If you copy the source instead of installing, keep the MIT header and repo link so the project can pick up fixes when apps change their in-app browsers.
