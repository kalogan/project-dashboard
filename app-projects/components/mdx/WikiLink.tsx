import Link from "next/link";
import { getSlugIndex } from "@/lib/mdx";

/**
 * <WikiLink> — resolves an Obsidian-style `[[target]]` reference to its page.
 *
 * Server Component: it reads the slug index at render time. Resolved links are
 * visually distinct from standard outbound links (dotted underline, gray-300 →
 * white on hover). An unresolved target degrades gracefully to a gray-600 stub
 * rather than breaking the build — a visual cue for a page yet to be written.
 */
export default function WikiLink({ target }: { target: string }) {
  const ref = getSlugIndex()[target.trim().toLowerCase()];

  if (!ref) {
    return (
      <span
        title={`Unwritten: ${target}`}
        // WCAG: gray-600 on black fails AA (~2.6:1); gray-400 passes (8.3:1).
        // The dotted gray-700 underline + the absence of a link keeps it
        // visually distinct as an unwritten stub.
        className="border-b border-dotted border-gray-700 italic text-gray-400"
      >
        {target}
      </span>
    );
  }

  return (
    <Link
      href={ref.path}
      className="border-b border-dotted border-gray-500 text-gray-300 transition-colors hover:text-white"
    >
      {ref.title}
    </Link>
  );
}
