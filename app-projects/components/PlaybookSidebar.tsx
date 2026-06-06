"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PlaybookCategory } from "@/types";

/**
 * Hierarchical Playbook navigation.
 *
 * Desktop: a sticky left column rendering the directory tree, grouped by
 * category. The active link is denoted purely by a left-border, indentation,
 * and font-weight — no color — per the stripped-down documentation aesthetic.
 *
 * Mobile: the tree collapses into a single native <select> dropdown so the
 * core text keeps the full width of the screen.
 */
export default function PlaybookSidebar({
  tree,
}: {
  tree: PlaybookCategory[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* Mobile: native select dropdown. */}
      <div className="md:hidden">
        <label htmlFor="playbook-nav" className="sr-only">
          Jump to a Playbook page
        </label>
        <select
          id="playbook-nav"
          value={pathname}
          onChange={(event) => router.push(event.target.value)}
          className="w-full border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-gray-200 focus:border-white focus:outline-none"
        >
          <option value="/playbook">Playbook — Overview</option>
          {tree.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.entries.map((entry) => (
                <option key={entry.path} value={entry.path}>
                  {entry.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Desktop: sticky tree. */}
      <nav
        aria-label="Playbook"
        className="sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto md:block"
      >
        {tree.map((group) => (
          <div key={group.category} className="mb-8">
            <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
              {group.category}
            </h2>
            <ul className="border-l border-gray-800">
              {group.entries.map((entry) => {
                const isActive = pathname === entry.path;
                return (
                  <li key={entry.path}>
                    <Link
                      href={entry.path}
                      aria-current={isActive ? "page" : undefined}
                      className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-opacity duration-150 ${
                        isActive
                          ? "border-white font-semibold text-white"
                          : "border-transparent font-normal text-gray-400 hover:border-gray-500 hover:opacity-80"
                      }`}
                    >
                      {entry.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
