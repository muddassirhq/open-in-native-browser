### Vue 3 (Composition API)

```vue
<script setup>
import { onMounted } from 'vue';
import OpenInNativeBrowser from 'open-in-native-browser';

onMounted(() => {
  OpenInNativeBrowser.init();
});
</script>
```

### Next.js (App Router)

Create a small client component and mount it once in your root layout:

```tsx
// app/components/OpenInNativeBrowserInit.tsx
'use client';
import { useEffect } from 'react';
import OpenInNativeBrowser from 'open-in-native-browser';

export default function OpenInNativeBrowserInit() {
  useEffect(() => { OpenInNativeBrowser.init(); }, []);
  return null;
}
```

```tsx
// app/layout.tsx
import OpenInNativeBrowserInit from './components/OpenInNativeBrowserInit';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <OpenInNativeBrowserInit />
        {children}
      </body>
    </html>
  );
}
```

### Angular

```ts
// app.component.ts
import { Component, OnInit } from '@angular/core';
import OpenInNativeBrowser from 'open-in-native-browser';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent implements OnInit {
  ngOnInit() {
    OpenInNativeBrowser.init();
  }
}
```

### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import OpenInNativeBrowser from 'open-in-native-browser';

  onMount(() => {
    OpenInNativeBrowser.init();
  });
</script>
```
