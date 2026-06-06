import { notFound } from "next/navigation";
import { getAllPlaybookEntries, getPlaybookEntry } from "@/lib/mdx";
import Mdx from "@/components/Mdx";

interface PageProps {
  params: { slug: string[] };
}

// Pre-render every Playbook page (including nested ones) at build time.
export function generateStaticParams() {
  return getAllPlaybookEntries().map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: PageProps) {
  const entry = getPlaybookEntry(params.slug);
  if (!entry) return {};
  return {
    title: `${entry.title} — Playbook`,
    description: `${entry.category} · ${entry.status}`,
  };
}

/**
 * A single Playbook page. Server Component: reads and serializes the MDX body
 * with the monochrome component map. Constrained to max-w-prose for readable
 * line lengths, with the `last_updated` stamp tucked subtly at the very bottom.
 */
export default function PlaybookEntryPage({ params }: PageProps) {
  const entry = getPlaybookEntry(params.slug);
  if (!entry) notFound();

  return (
    <article className="max-w-prose">
      <header className="border-b border-gray-800 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
          {entry.category}
          {entry.status === "draft" && (
            <span className="ml-2 border border-gray-700 px-1.5 py-0.5">
              Draft
            </span>
          )}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
          {entry.title}
        </h1>
      </header>

      <div className="mt-2">
        <Mdx source={entry.content} />
      </div>

      {/* Evergreen focus: when, not prominent. Subtle stamp at the very end. */}
      {entry.last_updated && (
        <footer className="mt-16 border-t border-gray-800 pt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
            Last updated {entry.last_updated}
          </p>
        </footer>
      )}
    </article>
  );
}
