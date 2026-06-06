"use client";

import { useState } from "react";

/**
 * <TerminalBlock> — a monochrome terminal panel for infrastructure commands,
 * with a one-click copy-to-clipboard control.
 *
 * Client Component: the copy button uses navigator.clipboard.writeText and
 * swaps to a crisp white checkmark for 2 seconds (never green — monochrome).
 */
export default function TerminalBlock({
  command,
  label = "bash",
}: {
  command: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <div className="my-6 border border-theme-border bg-theme-base transition-all duration-200 ease-out">
      {/* Top bar: shell label + copy control. */}
      <div className="flex items-center justify-between border-b border-theme-border px-3 py-2">
        <span className="font-mono text-xs uppercase tracking-widest text-theme-muted">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy command to clipboard"}
          className="flex items-center gap-1.5 border border-theme-border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-theme-muted transition-all duration-200 ease-out hover:bg-theme-surface hover:text-theme-text"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-relaxed text-theme-text">
        <code>{command}</code>
      </pre>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="5" y="5" width="8" height="8" rx="1" />
      <path d="M3 11V3h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3 text-theme-text"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  );
}
