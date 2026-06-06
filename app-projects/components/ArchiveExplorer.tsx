"use client";

import { useMemo, useState } from "react";
import MasonryGrid from "@/components/MasonryGrid";
import type { ArchiveEntryMeta } from "@/types";

/**
 * The Archive's interactive filtering shell.
 *
 * Default state is a polished professional showcase: only `portfolio` and
 * `demo` tiers are visible. The legacy `archive` tier — the deep, 14-year
 * history — stays hidden until the user explicitly engages the toggle, at
 * which point those entries are injected into the active dataset.
 *
 * The full dataset is loaded server-side and passed in as a prop; the toggle
 * only ever filters what is already in memory, so there is no refetch.
 */
export default function ArchiveExplorer({
  entries,
}: {
  entries: ArchiveEntryMeta[];
}) {
  const [showFullArchive, setShowFullArchive] = useState(false);

  const visibleEntries = useMemo(() => {
    if (showFullArchive) return entries; // portfolio + demo + archive
    return entries.filter(
      (entry) => entry.tier === "portfolio" || entry.tier === "demo"
    );
  }, [entries, showFullArchive]);

  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <>
      {/* Tactile, high-contrast toggle switch. */}
      <div className="mt-10 flex items-center justify-between border-y border-gray-800 py-4">
        <div>
          <label
            htmlFor="archive-toggle"
            className="block cursor-pointer font-mono text-xs uppercase tracking-widest text-gray-300"
          >
            View Full 14-Year Archive
          </label>
          <p className="mt-1 font-normal text-sm text-gray-500">
            {showFullArchive
              ? "Showing every project, legacy history included."
              : `Showcase view — ${hiddenCount} legacy ${
                  hiddenCount === 1 ? "project" : "projects"
                } hidden.`}
          </p>
        </div>

        <button
          id="archive-toggle"
          type="button"
          role="switch"
          aria-checked={showFullArchive}
          onClick={() => setShowFullArchive((v) => !v)}
          className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center border transition-colors ${
            showFullArchive
              ? "border-white bg-white"
              : "border-gray-600 bg-black"
          }`}
        >
          <span className="sr-only">Toggle full archive</span>
          <span
            aria-hidden
            className={`inline-block h-6 w-6 transform transition-transform ${
              showFullArchive
                ? "translate-x-7 bg-black"
                : "translate-x-1 bg-gray-400"
            }`}
          />
        </button>
      </div>

      <div className="mt-10">
        <MasonryGrid entries={visibleEntries} />
      </div>
    </>
  );
}
