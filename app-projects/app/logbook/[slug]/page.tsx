import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLogbookEntries, getLogbookEntry, tagToSlug } from "@/lib/mdx";
import Mdx from "@/components/Mdx";
import Backlinks from "@/components/Backlinks";
import LogisticsBoard from "@/components/LogisticsBoard";

interface PageProps {
  params: { slug: string };
}

// Pre-render every entry at build time for an offline-ready, instant route.
export function generateStaticParams() {
  return getAllLogbookEntries().map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: PageProps) {
  const entry = getLogbookEntry(params.slug);
  if (!entry) return {};
  return {
    title: `${entry.title} — Logbook`,
    description: entry.summary,
  };
}

export default function LogbookEntryPage({ params }: PageProps) {
  const entry = getLogbookEntry(params.slug);
  if (!entry) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/logbook"
        className="font-mono text-sm text-gray-400 transition-colors hover:text-white"
      >
        ← Logbook
      </Link>

      <header className="mt-8 border-b border-gray-800 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {entry.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-gray-400">
          <time dateTime={entry.date} className="tabular-nums">
            {entry.date}
          </time>
          <span aria-hidden>·</span>
          <span>{entry.location}</span>
          {entry.tags.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="flex flex-wrap gap-x-3">
                {entry.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tagToSlug(tag)}`}
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {tag}
                  </Link>
                ))}
              </span>
            </>
          )}
        </div>
        <p className="mt-6 font-normal text-gray-300">{entry.summary}</p>
      </header>

      <article className="mt-8">
        {entry.layout === "board" ? (
          <LogisticsBoard
            source={entry.content}
            pillar="logbook"
            slug={entry.slug}
          />
        ) : (
          <Mdx source={entry.content} />
        )}
      </article>

      <Backlinks slug={entry.slug} />
    </main>
  );
}
