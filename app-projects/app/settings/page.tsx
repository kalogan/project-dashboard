"use client";

import { useTheme } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";
import SpecSheet from "@/components/mdx/SpecSheet";
import TerminalBlock from "@/components/mdx/TerminalBlock";

/**
 * Theme settings + live preview.
 *
 * The toggle sets the active `next-themes` string; the preview below (a real
 * <TerminalBlock> and <SpecSheet>) reflects the CSS variable swap instantly.
 */
export default function SettingsPage() {
  // Touch the hook so the page is firmly client-rendered alongside the toggle.
  useTheme();

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
        <div className="mt-4">
          <ThemeToggle />
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

