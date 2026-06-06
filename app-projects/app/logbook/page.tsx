import Link from "next/link";
import { getAllLogbookEntries, tagToSlug } from "@/lib/mdx";

export const metadata = {
  title: "Logbook — Developer Codex",
  description: "A clinical, high-contrast ledger of entries.",
};

// Shared column template keeps the header and rows in strict alignment.
const COLUMNS =
  "grid grid-cols-[8rem_12rem_1fr] md:grid-cols-[8rem_14rem_1fr_16rem] gap-x-6";

export default function LogbookPage() {
  const entries = getAllLogbookEntries();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        Logbook
      </h1>
      <p className="mt-2 font-normal text-gray-400">
        A chronological ledger — newest first.
      </p>

      <div className="mt-10 border-t border-gray-800">
        {/* Header row */}
        <div
          className={`${COLUMNS} border-b border-gray-800 px-2 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400`}
        >
          <span>Date</span>
          <span>Location</span>
          <span>Title</span>
          <span className="hidden md:block">Tags</span>
        </div>

        {/* Entry rows — each row is clickable and routes to the detail page. */}
        {entries.length === 0 ? (
          <p className="px-2 py-6 font-normal text-gray-400">
            No entries yet.
          </p>
        ) : (
          entries.map((entry) => (
            // The row link uses `display: contents` so its cells flow into the
            // shared grid, while the Tags cell sits outside it as separate tag
            // links — avoiding invalid nested anchors.
            <div
              key={entry.slug}
              className={`${COLUMNS} items-baseline border-b border-gray-800 px-2 py-4 transition-colors hover:bg-gray-900`}
            >
              <Link href={`/logbook/${entry.slug}`} className="contents">
                <time
                  dateTime={entry.date}
                  className="font-mono text-sm tabular-nums text-gray-400"
                >
                  {entry.date}
                </time>
                <span className="text-sm text-gray-400">{entry.location}</span>
                <span className="font-semibold text-white">{entry.title}</span>
              </Link>
              <span className="hidden flex-wrap gap-x-2 font-mono text-xs text-gray-400 md:flex">
                {entry.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tagToSlug(tag)}`}
                    className="transition-opacity duration-150 hover:text-white"
                  >
                    {tag}
                  </Link>
                ))}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
