# open-in-native-browser

Detect when a visitor is inside Instagram's or Facebook's in-app browser
(a sandboxed WebView, not their default browser) and help them escape to
their device's native browser — automatically where possible, and always
with a visible, dismissible banner and manual "Open" button as a fallback.

Works with any framework (React, Vue, Angular, Svelte, Next.js, plain HTML)
because it's zero-dependency, framework-agnostic JavaScript.

## Why this exists

Meta's in-app browsers (opened when someone taps a link from Instagram or
Facebook) can break things like OAuth logins, some payment flows, and
third-party cookies. Deep-link "breakout" tricks (`instagram://extbrowser/…`
on iOS, Android `intent://` links) can silently hand the user off to Safari
or Chrome — but Meta can and does change WebView behavior, so **no automatic
method is guaranteed to keep working**. This package tries the automatic
route first and always shows a clear, honest fallback so the user is never
stuck without an explanation or a way out.

## Install

```bash
npm install open-in-native-browser
```

## Usage

### Any bundler-based framework (React, Vue, Angular, Svelte, Next.js…)

```js
import OpenInNativeBrowser from 'open-in-native-browser';

OpenInNativeBrowser.init();
```

Call `init()` once, as early as reasonably possible (root component /
app entry point). It is safe to call more than once — it no-ops outside
an Instagram/Facebook in-app browser and won't double-inject the banner.

See `examples/react-example.jsx` and `examples/vue-and-next.md` for
copy-pasteable snippets for React, Vue, Next.js, Angular, and Svelte.

### Plain HTML, no build step

Drop the standalone build straight into `<head>` — it attaches
`window.OpenInNativeBrowser` and auto-runs on `DOMContentLoaded`:

```html
<script src="/node_modules/open-in-native-browser/dist/auto.global.js"></script>
```

Or straight from a CDN, no install needed:

```html
<script src="https://unpkg.com/open-in-native-browser/dist/auto.global.js"></script>
```

To customize options for the auto-init build, set `window.OPEN_IN_NATIVE_BROWSER_OPTIONS`
*before* the script tag runs, or set `window.OPEN_IN_NATIVE_BROWSER_NO_AUTOINIT = true`
and call `window.OpenInNativeBrowser.init(options)` yourself whenever you're ready.

See `examples/plain-html.html` for a full example.

## What it does

1. **Detects** Instagram / Facebook in-app browsers via User-Agent sniffing
   (`Instagram`, `FBAN`/`FBAV`/`FB_IAB`/`FBIOS`), plus iOS vs. Android.
2. **Attempts an automatic breakout:**
   - iOS: navigates to `instagram://extbrowser/?url=<encoded current URL>`,
     then a moment later tries an `x-safari-<url>` handoff as a second
     attempt in case the first is ignored.
   - Android: navigates to an `intent://…#Intent;scheme=https;package=com.android.chrome;end`
     URL built from the current page.
3. **Shows a small, dismissible banner** (only inside an in-app browser —
   it never renders on regular mobile or desktop browsers) explaining
   what's happening, with a CTA button that links to the same escape URL
   so the user can trigger it manually with a tap.
4. Does **nothing at all** if the visitor isn't in a Meta in-app browser.

## API

```js
OpenInNativeBrowser.init(options?)
```

| Option           | Type      | Default                                                             | Description                                                                 |
|------------------|-----------|----------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `message`        | `string`  | "Instagram is restricting this website's features. For the best experience, tap here to open in your default browser." | Banner copy.                                                                 |
| `ctaLabel`       | `string`  | `"Open"`                                                              | Text on the banner's call-to-action button.                                  |
| `autoBreakout`   | `boolean` | `true`                                                                | Whether to attempt the automatic deep-link handoff.                          |
| `showBanner`     | `boolean` | `true`                                                                | Whether to show the fallback banner.                                         |
| `bannerDelay`    | `number`  | `400`                                                                 | Milliseconds to wait before showing the banner (gives the auto-breakout a beat to work first). |
| `respectDismiss` | `boolean` | `true`                                                                | If the user dismissed the banner earlier this session, don't show it again this session. |
| `forceShow`      | `boolean` | `false`                                                               | Show the banner even if previously dismissed this session.                   |
| `userAgent`      | `string`  | `navigator.userAgent`                                                 | Override for testing.                                                        |

`init()` returns `{ env, attemptedBreakout, bannerShown }` where `env` is the
result of `OpenInNativeBrowser.detectEnvironment()` (`isInstagram`, `isFacebook`,
`isInApp`, `isIOS`, `isAndroid`).

## Styling

The banner's CSS is injected as a single scoped `<style>` block (ids/classes
prefixed `oinb-`) and won't touch your site's existing styles. Override it
by targeting `#oinb-banner` in your own stylesheet with higher specificity
or `!important` if needed.

## Limitations & honesty note

- User-Agent sniffing can be spoofed or changed by Meta at any time; treat
  detection as best-effort, not a security boundary.
- The deep-link breakout methods are unofficial/observed behaviors, not a
  documented, guaranteed API — that's exactly why the fallback banner with a
  manual link always ships alongside them.
- This only targets Instagram/Facebook's in-app browser specifically, per
  the original requirement — it does not attempt to detect other in-app
  browsers (TikTok, LinkedIn, etc.).

## Troubleshooting

- **Banner shows up on a regular browser.** It shouldn't — `detectEnvironment()`
  only reports `isInApp: true` for Instagram/Facebook User-Agents. If you're
  seeing it elsewhere, check whether you're testing with a UA-spoofing
  extension, and pass your actual `navigator.userAgent` into
  `IABBreakout.detectEnvironment(ua)` to inspect what's being matched.
- **Auto-breakout doesn't fire on a specific device.** This is expected
  sometimes — see "Limitations & honesty note" above. The banner's manual
  "Open" button is the reliable fallback; make sure `showBanner` isn't set
  to `false`.
- **Banner won't reappear after I dismissed it while testing.** That's
  `respectDismiss` (default `true`) suppressing it for the rest of the
  browser session. Clear `sessionStorage`, use a private/incognito tab, or
  pass `{ forceShow: true }` while testing.

## Contributing

Issues and pull requests are welcome — see the repo's issue tracker linked
in `package.json`.

## License

MIT
