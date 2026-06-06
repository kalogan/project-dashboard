import Image from "next/image";
import Link from "next/link";
import SearchTrigger from "@/components/SearchTrigger";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import SurfaceModule from "@/components/SurfaceModule";
import VaultModule from "@/components/VaultModule";
import {
  getAllLogbookEntries,
  getAllArchiveEntries,
  getAllPlaybookEntries,
} from "@/lib/mdx";

// Regenerate daily so the heatmap window and the "On This Day" surface track
// the current date without per-request cost.
export const revalidate = 86400;

/**
 * The Root Command Center — a high-density, situational-awareness dashboard.
 *
 * Server Component: all data comes from local MDX reads at build/dev time, so
 * the page snaps onto the screen with no spinners or suspense boundaries.
 * Imagery is strictly limited to the single "Latest Shipped" project to keep
 * the surface clinical and fast; everything else is purely typographic.
 */
export default function Home() {
  const recentLogs = getAllLogbookEntries().slice(0, 3);
  const latestShipped = getAllArchiveEntries().find(
    (entry) => entry.tier === "portfolio"
  );
  const activeSystems = [...getAllPlaybookEntries()]
    .sort(
      (a, b) =>
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    )
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Command Center
        </h1>
        <SearchTrigger />
      </div>

      {/* Full-width telemetry banner above the three-column layout. */}
      <div className="mt-10">
        <ActivityHeatmap />
      </div>

      {/* Surface Engine — On This Day / random evergreen review. */}
      <div className="mt-10">
        <SurfaceModule />
      </div>

      {/* Local-only Vault: private/draft roster (never rendered in production). */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-10">
          <VaultModule />
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Highlight — the only imagery on the page. */}
        <section>
          <SectionHeader>Latest Shipped</SectionHeader>
          {latestShipped ? (
            <Link
              href={`/archive/${latestShipped.slug}`}
              className="group mt-4 block transition-opacity duration-150 hover:opacity-90"
            >
              {latestShipped.hero_media && (
                <Image
                  src={latestShipped.hero_media}
                  alt={`${latestShipped.title} — hero media`}
                  width={1200}
                  height={800}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="h-auto w-full border border-gray-800 object-cover"
                />
              )}
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <h3 className="font-bold text-white">{latestShipped.title}</h3>
                <span className="font-mono text-sm tabular-nums text-gray-400">
                  {latestShipped.year}
                </span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {latestShipped.tech_stack.map((tech) => (
                  <li
                    key={tech}
                    className="border border-gray-700 px-2 py-0.5 font-mono text-[0.6rem] font-normal uppercase tracking-widest text-gray-400"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </Link>
          ) : (
            <p className="mt-4 text-sm font-normal text-gray-400">
              No shipped projects yet.
            </p>
          )}
        </section>

        {/* Active Systems — tight text-only list, timestamps right-aligned. */}
        <section>
          <SectionHeader>Active Systems</SectionHeader>
          <ul className="mt-4">
            {activeSystems.map((entry) => (
              <li key={entry.path}>
                <Link
                  href={entry.path}
                  className="flex items-baseline justify-between gap-4 border-b border-gray-800 py-2 transition-opacity duration-150 hover:opacity-70"
                >
                  <span className="truncate font-bold text-white">
                    {entry.title}
                  </span>
                  <time className="flex-shrink-0 font-mono text-sm tabular-nums text-gray-400">
                    {entry.last_updated}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Life Ledger — the tabular logbook index format from Phase 2. */}
        <section>
          <SectionHeader>Recent Logs</SectionHeader>
          <ul className="mt-4">
            {recentLogs.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/logbook/${entry.slug}`}
                  className="grid grid-cols-[6rem_1fr] gap-x-3 border-b border-gray-800 py-2 transition-opacity duration-150 hover:opacity-70"
                >
                  <time className="font-mono text-sm tabular-nums text-gray-400">
                    {entry.date}
                  </time>
                  <span className="font-bold text-white">{entry.title}</span>
                  <span className="col-start-2 text-sm font-normal text-gray-400">
                    {entry.location}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

/** Stark, uppercase section header with a hairline rule beneath. */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-gray-800 pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
      {children}
    </h2>
  );
}
