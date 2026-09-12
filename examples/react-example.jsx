import { useEffect } from 'react';
import OpenInNativeBrowser from 'open-in-native-browser';

// Call this once near the root of your app (e.g. App.jsx / _app.jsx / layout.tsx)
export function useOpenInNativeBrowser(options) {
  useEffect(() => {
    OpenInNativeBrowser.init(options);
    // no cleanup needed — init() is a one-shot check + optional banner mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function App() {
  useOpenInNativeBrowser({
    message: 'Open this in your browser for the full experience.',
    ctaLabel: 'Open in browser'
  });

  return <div>Your app...</div>;
}
