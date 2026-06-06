"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Theme selector. Sets the active `next-themes` string, which drives the
 * `data-theme` attribute on <html>. Mounted-guard avoids a hydration mismatch
 * since the resolved theme is only known on the client.
 */
const THEMES: { id: string; label: string; blurb: string }[] = [
  { id: "light", label: "Light", blurb: "Off-white, charcoal text." },
  { id: "dark", label: "Dark", blurb: "Clinical pitch-black default." },
  {
    id: "visceral",
    label: "Visceral",
    blurb: "Maroon structure, bioluminescent teal accents.",
  },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div role="group" aria-label="Theme" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {THEMES.map(({ id, label, blurb }) => {
        const active = mounted && theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={active}
            className={`rounded-none border p-4 text-left transition-all duration-200 ease-out ${
              active
                ? "border-theme-accent text-theme-text shadow-glow"
                : "border-theme-border text-theme-muted hover:border-theme-accent hover:text-theme-text"
            }`}
          >
            <span className="block font-mono text-xs font-semibold uppercase tracking-widest">
              {label}
              {active && <span className="text-theme-accent"> ●</span>}
            </span>
            <span className="mt-1 block text-sm font-normal">{blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
