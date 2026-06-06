import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllArchiveEntries, getArchiveEntry } from "@/lib/mdx";
import { mdxComponents } from "@/components/MdxProvider";

interface PageProps {
  params: { slug: string };
}

// Hero intrinsic dimensions — explicit to reserve space and avoid layout shift.
const HERO_WIDTH = 1600;
const HERO_HEIGHT = 900;

// Pre-render every project at build time for instant, offline-ready routes.
export function generateStaticParams() {
  return getAllArchiveEntries().map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: PageProps) {
  const entry = getArchiveEntry(params.slug);
  if (!entry) return {};
  return {
    title: `${entry.title} — Archive`,
    description: `${entry.category} · ${entry.year} · ${entry.tech_stack.join(
      ", "
    )}`,
  };
}

/**
 * Dynamic Archive detail page — a Server Component.
 *
 * Frontmatter drives the header (title, year, tech stack, time-to-MVP); the raw
 * markdown body is serialized by next-mdx-remote/rsc with our monochrome
 * component map, which also exposes embeddable components like <PromptVault>.
 */
export default function ArchiveEntryPage({ params }: PageProps) {
  const entry = getArchiveEntry(params.slug);
  if (!entry) notFound();

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <Link
        href="/archive"
        className="font-mono text-sm text-gray-400 transition-colors hover:text-white"
      >
        ← Back to Archive
      </Link>

      <header className="mt-8 border-b border-gray-800 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {entry.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-gray-400">
          <span className="tabular-nums">{entry.year}</span>
          <span aria-hidden>·</span>
          <span>{entry.category}</span>
          {entry.time_to_mvp && (
            <>
              <span aria-hidden>·</span>
              <span>
                <span className="text-gray-400">MVP </span>
                {entry.time_to_mvp}
              </span>
            </>
          )}
        </div>

        {/* Tech stack — monochrome bordered tags, uppercase, letter-spaced. */}
        <ul className="mt-5 flex flex-wrap gap-2">
          {entry.tech_stack.map((tech) => (
            <li
              key={tech}
              className="border border-gray-700 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400"
            >
              {tech}
            </li>
          ))}
        </ul>
      </header>

      {/* Hero media — optimized .webp, lazy by default, fixed dimensions. */}
      <Image
        src={entry.hero_media}
        alt={`${entry.title} — hero media`}
        width={HERO_WIDTH}
        height={HERO_HEIGHT}
        sizes="(min-width: 768px) 65ch, 100vw"
        className="mt-8 h-auto w-full border border-gray-800 object-cover"
      />

      {/* Body — rendered MDX with the monochrome design tokens. */}
      <article className="mt-10">
        <MDXRemote source={entry.content} components={mdxComponents} />
      </article>
    </main>
  );
}
