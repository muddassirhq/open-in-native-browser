export type AppKey =
  | 'instagram' | 'facebook' | 'messenger' | 'threads' | 'linkedin' | 'tiktok'
  | 'snapchat' | 'twitter' | 'pinterest' | 'reddit' | 'whatsapp' | 'telegram'
  | 'line' | 'wechat' | 'webview';

export interface Environment {
  ua: string;
  /** Detected app, or null outside an in-app browser. */
  app: AppKey | null;
  /** Human-readable app name, e.g. "Instagram". */
  appName: string | null;
  isInApp: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  /** True when a programmatic handoff exists for this app/platform. */
  canEscape: boolean;
  /** v1 compatibility: Instagram or Threads. */
  isInstagram: boolean;
  /** v1 compatibility: Facebook or Messenger. */
  isFacebook: boolean;
}

export interface Options {
  /** Banner text. `{app}` is replaced with the app name. */
  message?: string;
  /** Banner text when no handoff exists (e.g. WeChat). */
  noEscapeMessage?: string;
  ctaLabel?: string;
  copyLabel?: string;
  copiedLabel?: string;
  /** Show a "Copy link" button next to "Open". Default true. */
  showCopy?: boolean;
  /** Try the automatic handoff (once per session). Default true. */
  autoBreakout?: boolean;
  showBanner?: boolean;
  /** ms before the banner appears. Default 400. */
  bannerDelay?: number;
  respectDismiss?: boolean;
  forceShow?: boolean;
  /** Only act inside these apps. */
  apps?: AppKey[] | null;
  /** Never act inside these apps. */
  exclude?: AppKey[] | null;
  /** Treat unknown Android WebViews ("; wv)") as in-app. Default false. */
  detectGeneric?: boolean;
  /** Android browser package for the intent handoff. null = system default. Default "com.android.chrome". */
  androidPackage?: string | null;
  /** Called once with the detected environment (also outside in-app browsers). */
  onDetect?: ((env: Environment) => void) | null;
  /** Override the User-Agent (testing). */
  userAgent?: string;
}

export interface InitResult {
  env: Environment;
  attemptedBreakout: boolean;
  bannerShown: boolean;
}

export interface AppDefinition {
  key: AppKey;
  name: string;
  re: RegExp;
  ios: string | null;
  android: string | null;
  autoIOS: boolean;
}

export declare function init(options?: Options): InitResult;
/** Trigger the handoff from your own button. Returns false when no handoff exists. */
export declare function escape(options?: Options): boolean;
export declare function detectEnvironment(userAgent?: string, options?: Options): Environment;
export declare function getEscapeUrl(env: Environment, url?: string | null, options?: Options): string | null;
export declare const APPS: AppDefinition[];
export declare const DEFAULTS: Required<Omit<Options, 'userAgent'>>;

declare const OpenInNativeBrowser: {
  init: typeof init;
  escape: typeof escape;
  detectEnvironment: typeof detectEnvironment;
  getEscapeUrl: typeof getEscapeUrl;
  APPS: typeof APPS;
  DEFAULTS: typeof DEFAULTS;
};
export default OpenInNativeBrowser;

declare global {
  interface Window {
    OpenInNativeBrowser?: typeof OpenInNativeBrowser;
    OPEN_IN_NATIVE_BROWSER_OPTIONS?: Options;
    OPEN_IN_NATIVE_BROWSER_NO_AUTOINIT?: boolean;
  }
}
