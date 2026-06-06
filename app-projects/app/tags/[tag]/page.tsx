import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllUniqueTags, getEntriesByTagSlug, tagToSlug } from "@/lib/mdx";
import type { Pillar } from "@/types";

interface PageProps {
  params: { tag: string };
}

const PILLAR_LABEL: Record<Pillar, string> = {
  logbook: "LOGBOOK",
  archive: "ARCHIVE",
  playbook: "PLAYBOOK",
};

// Pre-render a page for every unique tag slug across the codex.
export function generateStaticParams() {
  const seen = new Set<string>();
  return getAllUniqueTags()
    .map((tag) => tagToSlug(tag))
    .filter((slug) => slug && !seen.has(slug) && seen.add(slug))
    .map((tag) => ({ tag }));
}

export function generateMetadata({ params }: PageProps) {
  return {
    title: `#${params.tag} — Tags`,
    description: `Everything across the codex tagged ${params.tag}.`,
  };
}

/**
 * A unified, cross-pillar timeline for a single tag. Deliberately a single
 * clinical text ledger (never the masonry grid or logbook table) so the view
 * is consistent regardless of where each entry originated.
 */
export default function TagPage({ params }: PageProps) {
  const entries = getEntriesByTagSlug(params.tag);
  if (entries.length === 0) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-white">
          <span className="text-gray-400">#</span>
          {params.tag}
        </h1>
        <p className="mt-2 font-mono text-sm uppercase tracking-widest text-gray-400">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </header>

      <ul className="mt-6">
        {entries.map((entry) => (
          <li key={`${entry.pillar}:${entry.path}`}>
            <Link
              href={entry.path}
              className="flex items-baseline gap-4 border-b border-gray-800 py-3 transition-opacity duration-150 hover:opacity-70"
            >
              <time className="w-20 flex-shrink-0 font-mono text-sm tabular-nums text-gray-400">
                {entry.display}
              </time>
              <span className="flex-1 font-semibold text-white">
                {entry.title}
              </span>
              <span className="flex-shrink-0 border border-gray-800 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-gray-400">
                {PILLAR_LABEL[entry.pillar]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
