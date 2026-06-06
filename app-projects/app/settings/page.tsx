"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SpecSheet from "@/components/mdx/SpecSheet";
import TerminalBlock from "@/components/mdx/TerminalBlock";

/**
 * Theme settings + live preview.
 *
 * Toggles the active `next-themes` string between the three exact states; the
 * preview below (a real <TerminalBlock> and <SpecSheet>) reflects the CSS
 * variable swap instantly. Mounted-guard avoids a hydration mismatch since the
 * resolved theme is only known on the client.
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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-theme-text">
        Settings
      </h1>
      <p className="mt-2 font-normal text-theme-muted">
        Choose the aesthetic. The preview updates the instant you switch.
      </p>

      <section className="mt-10">
        <h2 className="border-b border-theme-border pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-theme-muted">
          Theme
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
      </section>

      <section className="mt-12">
        <h2 className="border-b border-theme-border pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-theme-muted">
          Live Preview
        </h2>
        <div className="mt-4">
          <SpecSheet
            title="Pull Parameters"
            specs={[
              { label: "Dose", value: "18 g in" },
              { label: "Yield", value: "36 g out" },
              { label: "Time", value: "27–30 seconds" },
            ]}
          />
          <TerminalBlock
            label="shell"
            command="grinder --purge && grinder --calibrate 18g"
          />
          <p className="font-normal text-theme-text">
            Body copy stays high-contrast in every theme. Structural{" "}
            <span className="text-theme-muted">muted metadata</span> and accents
            shift with the engine.
          </p>
        </div>
      </section>
    </main>
  );
}
