import { useEffect, useState } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { flushPendingToast } from '@/lib/toast';
import { resolveTheme, useThemeStore } from '@/stores/theme-store';

// Mounted once in Layout.astro. sonner's toast() function works from
// anywhere (zustand stores, plain functions) as long as this is in the DOM.
export default function Toaster() {
  const preference = useThemeStore((state) => state.preference);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setResolved(resolveTheme(preference));
  }, [preference]);

  useEffect(() => {
    flushPendingToast();
  }, []);

  return <SonnerToaster theme={resolved} position="bottom-right" richColors closeButton />;
}
