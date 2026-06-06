"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

/**
 * Minimal, high-contrast breadcrumb trail for the Playbook, e.g.
 *
 *   Playbook / Engineering / Cursor Rules
 *
 * Derived directly from the URL path; segments are humanized (kebab-case →
 * Title Case). Separated by simple slashes, no chevrons or color.
 */

/** "ai-workflows" → "Ai Workflows" → tidy a couple of known acronyms. */
function humanize(segment: string): string {
  return decodeURIComponent(segment)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(/\bAi\b/g, "AI");
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  // Drop empty leading segment from the leading slash.
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="font-mono text-xs uppercase tracking-widest text-gray-400"
    >
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;

        return (
          <Fragment key={href}>
            {index > 0 && <span className="px-2 text-gray-400">/</span>}
            {isLast ? (
              <span aria-current="page" className="text-white">
                {humanize(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="transition-opacity duration-150 hover:opacity-60"
              >
                {humanize(segment)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
