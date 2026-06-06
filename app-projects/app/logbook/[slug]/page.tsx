import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllLogbookEntries, getLogbookEntry } from "@/lib/mdx";

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
        className="font-mono text-sm text-gray-500 transition-colors hover:text-white"
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
              <span className="text-gray-500">{entry.tags.join(", ")}</span>
            </>
          )}
        </div>
        <p className="mt-6 font-normal text-gray-300">{entry.summary}</p>
      </header>

      <article className="mt-8 max-w-none space-y-4 font-normal text-gray-300 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-6 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-white">
        <MDXRemote source={entry.content} />
      </article>
    </main>
  );
}
