import type { Config } from "tailwindcss";

/**
 * Developer Codex — Design System
 *
 * Strict monochrome enforcement: the color palette is fully replaced (not
 * extended) so that no chromatic colors (blues, reds, greens) can leak into
 * the UI. Visual hierarchy is built exclusively from True Black, True White,
 * a neutral grayscale spectrum, borders, spacing, and typographic weight.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    // Top-level `colors` REPLACES the Tailwind defaults — monochrome only.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "#000000", // True Black
      white: "#FFFFFF", // True White
      gray: {
        100: "#F5F5F5",
        200: "#E5E5E5",
        300: "#D4D4D4",
        400: "#A3A3A3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
        800: "#262626",
        900: "#171717",
      },
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
    },
  },
  plugins: [],
};
export default config;
