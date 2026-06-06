import Link from "next/link";
import { getPlaybookTree } from "@/lib/mdx";

export const metadata = {
  title: "Playbook — Developer Codex",
  description:
    "Methodologies, AI workflows, and specifications — what is currently true.",
};

/**
 * Playbook overview — a hierarchical index of every system, grouped by
 * category. Emphasizes what is currently true, not when it was written.
 */
export default function PlaybookPage() {
  const tree = getPlaybookTree();

  return (
    <article>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        Playbook
      </h1>
      <p className="mt-2 max-w-2xl font-normal text-gray-400">
        A living wiki of methodologies, workflows, and specifications. Browse a
        system from the sidebar, or jump in below.
      </p>

      <div className="mt-10 space-y-10">
        {tree.map((group) => (
          <section key={group.category}>
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
              {group.category}
            </h2>
            <ul className="mt-3 border-t border-gray-800">
              {group.entries.map((entry) => (
                <li key={entry.path}>
                  <Link
                    href={entry.path}
                    className="flex items-baseline justify-between border-b border-gray-800 py-3 transition-opacity duration-150 hover:opacity-70"
                  >
                    <span className="font-semibold text-white">
                      {entry.title}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-400">
                      {entry.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
