import Link from "next/link";
import { getBacklinks } from "@/lib/mdx";

/**
 * <Backlinks> — the incoming half of the bi-directional link graph.
 *
 * Server Component: queries the server-side backlink graph for pages that link
 * to this one and renders a tight list. If nothing links here, it returns null
 * and stays completely invisible.
 */
export default function Backlinks({ slug }: { slug: string }) {
  const incoming = getBacklinks(slug);
  if (incoming.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-800 pt-6">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
        Backlinks
      </h2>
      <ul className="mt-3 space-y-1">
        {incoming.map((ref) => (
          <li key={ref.path}>
            <Link
              href={ref.path}
              className="font-normal text-gray-300 transition-colors hover:text-white"
            >
              ← {ref.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
