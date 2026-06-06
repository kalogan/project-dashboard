import Link from "next/link";
import { getAllLogbookEntries } from "@/lib/mdx";

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
          className={`${COLUMNS} border-b border-gray-800 px-2 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500`}
        >
          <span>Date</span>
          <span>Location</span>
          <span>Title</span>
          <span className="hidden md:block">Tags</span>
        </div>

        {/* Entry rows — each row is clickable and routes to the detail page. */}
        {entries.length === 0 ? (
          <p className="px-2 py-6 font-normal text-gray-500">
            No entries yet.
          </p>
        ) : (
          entries.map((entry) => (
            <Link
              key={entry.slug}
              href={`/logbook/${entry.slug}`}
              className={`${COLUMNS} items-baseline border-b border-gray-800 px-2 py-4 transition-colors hover:bg-gray-900`}
            >
              <time
                dateTime={entry.date}
                className="font-mono text-sm tabular-nums text-gray-400"
              >
                {entry.date}
              </time>
              <span className="text-sm text-gray-400">{entry.location}</span>
              <span className="font-semibold text-white">{entry.title}</span>
              <span className="hidden font-mono text-xs text-gray-500 md:block">
                {entry.tags.join(", ")}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
