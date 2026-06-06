import Link from "next/link";
import { getHistoricalMatches, getRandomEvergreen } from "@/lib/surface";

/**
 * <SurfaceModule> — the dashboard's serendipity block.
 *
 * Server Component: today's date is computed on the server (no client JS). It
 * prefers an "On This Day" historical parallel and falls back to a random
 * evergreen review. The whole block is a link into the surfaced entry.
 */
export default function SurfaceModule() {
  const matches = getHistoricalMatches(new Date());
  const entry = matches[0] ?? getRandomEvergreen();
  if (!entry) return null;

  const label = matches.length > 0 ? "Historical Parallel" : "System Review";

  return (
    <Link
      href={entry.path}
      className="block border border-gray-800 bg-gray-900/50 p-6 transition-colors hover:border-gray-500"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums text-gray-400">
          {entry.year}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-bold tracking-tight text-white">
        {entry.title}
      </h3>
      {/* Ghosted excerpt (gray-500) marks this as historical, not a new update. */}
      <p className="mt-2 font-normal text-gray-500">{entry.excerpt}</p>
    </Link>
  );
}
