import Image from "next/image";
import Link from "next/link";
import type { ArchiveEntryMeta } from "@/types";

/**
 * A single Archive project card, designed to live inside the masonry grid.
 *
 * Renders the hero media (optimized .webp via next/image with explicit
 * dimensions to prevent layout shift), then the title, year, and tech stack as
 * stark monochrome metadata. No color is used to differentiate metadata — only
 * borders, uppercase typography, and letter-spacing.
 */

// Explicit intrinsic dimensions reserve space and prevent cumulative layout
// shift inside the masonry columns; the actual heights vary with the image's
// aspect ratio, which is exactly what gives the grid its variable rhythm.
const HERO_WIDTH = 1200;
const HERO_HEIGHT = 800;

export default function ProjectCard({ entry }: { entry: ArchiveEntryMeta }) {
  return (
    <Link
      href={`/archive/${entry.slug}`}
      className="group block border border-gray-800 bg-black transition-colors hover:border-gray-500"
    >
      <Image
        src={entry.hero_media}
        alt={`${entry.title} — hero media`}
        width={HERO_WIDTH}
        height={HERO_HEIGHT}
        loading="lazy"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="h-auto w-full border-b border-gray-800 object-cover"
      />

      <div className="p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-semibold tracking-tight text-white">
            {entry.title}
          </h3>
          <span className="font-mono text-sm tabular-nums text-gray-400">
            {entry.year}
          </span>
        </div>

        {/* Tech stack — stark, unstyled text tags differentiated only by
            borders, uppercase, and letter-spacing. No color. */}
        <ul className="mt-4 flex flex-wrap gap-2">
          {entry.tech_stack.map((tech) => (
            <li
              key={tech}
              className="border border-gray-700 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400 group-hover:border-gray-500"
            >
              {tech}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
