"use client";

import ProjectCard from "@/components/ProjectCard";
import type { ArchiveEntryMeta } from "@/types";

/**
 * CSS-columns masonry layout for Archive project cards.
 *
 * A pure CSS-columns approach (rather than a JS measuring library) keeps the
 * chronological DOM order intact — cards flow down each column in the exact
 * order they are passed — while gracefully absorbing the variable heights of
 * different cards. `break-inside-avoid` stops a card from splitting across a
 * column boundary.
 *
 * Marked `'use client'` so it can sit directly beneath the interactive
 * filtering shell without forcing a server/client boundary mid-tree.
 */
export default function MasonryGrid({
  entries,
}: {
  entries: ArchiveEntryMeta[];
}) {
  if (entries.length === 0) {
    return (
      <p className="border-t border-gray-800 py-12 text-center font-normal text-gray-500">
        No projects to show.
      </p>
    );
  }

  return (
    <div className="columns-1 gap-6 [column-fill:_balance] sm:columns-2 lg:columns-3">
      {entries.map((entry) => (
        <div key={entry.slug} className="mb-6 break-inside-avoid">
          <ProjectCard entry={entry} />
        </div>
      ))}
    </div>
  );
}
