"use client";

/**
 * A discreet header affordance that opens the command palette. The palette
 * itself owns its state and also responds to Cmd/Ctrl+K; this button just
 * dispatches the shared `codex:search` event so the two stay decoupled.
 */
export default function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("codex:search"))}
      aria-label="Open search (Command or Control + K)"
      aria-keyshortcuts="Meta+K Control+K"
      className="flex items-center gap-2 border border-gray-700 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400 transition-opacity duration-150 hover:opacity-70"
    >
      <span>Search</span>
      <kbd className="border border-gray-700 px-1 text-gray-400">⌘K</kbd>
    </button>
  );
}
