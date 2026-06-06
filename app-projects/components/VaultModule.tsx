import Link from "next/link";
import { getNonPublicEntries } from "@/lib/mdx";

/**
 * The local "Vault" — a development-only roster of every private/draft entry.
 *
 * It must only ever render in dev (the caller gates this), and in production
 * the readers return nothing anyway. A dashed border and explicit
 * [ PRIVATE ] / [ DRAFT ] tokens make an entry's gate status unmistakable.
 */
export default function VaultModule() {
  const entries = getNonPublicEntries();
  if (entries.length === 0) return null;

  return (
    <section className="border border-dashed border-gray-500 p-6">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
        Vault — local only ({entries.length})
      </h2>
      <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400">
        These never ship to production.
      </p>

      <ul className="mt-4">
        {entries.map((entry) => (
          <li key={`${entry.pillar}:${entry.path}`}>
            <Link
              href={entry.path}
              className="flex items-baseline gap-3 border-b border-gray-800 py-2 transition-opacity duration-150 hover:opacity-70"
            >
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-gray-400">
                {entry.visibility === "draft" ? "[ DRAFT ]" : "[ PRIVATE ]"}
              </span>
              <span className="flex-1 font-semibold text-white">
                {entry.title}
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-gray-400">
                {entry.pillar}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
