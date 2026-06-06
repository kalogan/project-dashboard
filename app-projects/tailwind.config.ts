import type { Config } from "tailwindcss";

/**
 * Developer Codex — Design System
 *
 * The palette is fully replaced (no chromatic colors leak in by default) and is
 * driven entirely by RGB-channel CSS variables, so the theme engine
 * (`next-themes` + `[data-theme]` in globals.css) can swap the exact output for
 * the `light`, `dark`, and `visceral` themes without touching components.
 *
 * Channel-based vars (`5 5 5`) let Tailwind's opacity modifiers keep working,
 * e.g. `bg-black/80` → `rgb(var(--c-black) / 0.8)`.
 */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      // The structural monochrome ramp — themed via CSS variables. `black` and
      // `white` are semantic (deepest surface / strongest text), so they invert
      // correctly in the light theme rather than meaning a literal color.
      black: v("--c-black"),
      white: v("--c-white"),
      gray: {
        100: v("--c-gray-100"),
        200: v("--c-gray-200"),
        300: v("--c-gray-300"),
        400: v("--c-gray-400"),
        500: v("--c-gray-500"),
        600: v("--c-gray-600"),
        700: v("--c-gray-700"),
        800: v("--c-gray-800"),
        900: v("--c-gray-900"),
      },
      // Named, role-based theme tokens (the engine's public API).
      "theme-base": v("--c-black"),
      "theme-surface": v("--c-gray-900"),
      "theme-text": v("--c-white"),
      "theme-muted": v("--c-gray-400"),
      "theme-border": v("--c-gray-800"),
      "theme-accent": v("--c-accent"),
      "theme-glow": v("--c-glow"),
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      // Constrain font weights to the design system's hierarchy levels.
      fontWeight: {
        normal: "400",
        semibold: "600",
        extrabold: "800",
      },
      boxShadow: {
        glow: "0 0 12px rgb(var(--c-glow) / 0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
