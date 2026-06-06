import type { ReactNode } from "react";

/**
 * <Changelog> — a connected, Git-history-style timeline node for documenting
 * iterative version history inside a project's MDX body.
 *
 * Server Component. Stack multiple blocks and the continuous 2px left-border
 * reads as one unbroken line; the timeline visual is purely CSS (border +
 * absolutely-positioned node), so the markup stays clean for screen readers.
 */
export default function Changelog({
  version,
  date,
  children,
}: {
  version: string;
  date: string;
  children: ReactNode;
}) {
  return (
    <article className="relative border-l-2 border-gray-800 pb-8 pl-6 first-of-type:mt-10">
      {/* Update node sitting on the timeline. */}
      <span
        aria-hidden
        className="absolute left-0 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full border border-gray-500 bg-black"
      />

      <div className="flex flex-wrap items-center gap-3">
        <code className="border border-gray-800 bg-gray-900 px-2 py-1 font-mono text-xs text-white">
          {version}
        </code>
        <time
          dateTime={date}
          className="font-mono text-sm tabular-nums text-gray-400"
        >
          {date}
        </time>
      </div>

      <div className="mt-2 font-normal leading-relaxed text-gray-300">
        {children}
      </div>
    </article>
  );
}
