"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Theme engine wrapper. Drives the `data-theme` attribute on <html> across the
 * three exact themes; `disableTransitionOnChange` prevents a color sweep while
 * switching, and there is no `system` theme (the three are explicit).
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      themes={["light", "dark", "visceral"]}
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
