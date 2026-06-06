/**
 * Frontmatter contract for a single Logbook entry.
 *
 * Every `.mdx` file in `content/logbook` MUST declare these fields in its
 * frontmatter. Parsing happens server-side in `lib/mdx.ts`.
 */
export interface LogbookEntry {
  title: string;
  date: string;
  location: string;
  tags: string[];
  summary: string;
}

/**
 * A parsed Logbook entry: validated frontmatter plus the derived `slug`
 * (from the filename) used for on-demand routing.
 */
export interface LogbookEntryMeta extends LogbookEntry {
  slug: string;
}

/**
 * A fully loaded entry — metadata plus the raw MDX body for rendering on the
 * detail route.
 */
export interface LogbookEntryFull extends LogbookEntryMeta {
  content: string;
}

/**
 * The 3-tier taxonomy that powers the Archive's filtering engine.
 *
 * - `portfolio` — highly polished, showcase-grade work.
 * - `demo` — functional proofs of concept worth surfacing by default.
 * - `archive` — deep legacy history, hidden until the user opts in.
 */
export type ArchiveTier = "portfolio" | "demo" | "archive";

/** Public/private gate for an Archive entry. */
export type ArchiveVisibility = "public" | "private";

/**
 * Frontmatter contract for a single Archive entry.
 *
 * Every `.mdx` file in `content/archive` MUST declare these fields. The set is
 * strict: `tier` and `visibility` are constrained to literal unions so the
 * filtering engine and badging can rely on them.
 */
export interface ArchiveEntry {
  title: string;
  year: number;
  tier: ArchiveTier;
  category: string;
  visibility: ArchiveVisibility;
  hero_media: string;
  tech_stack: string[];
  /**
   * Optional headline metric surfaced on the detail page header
   * (e.g. "6 weeks"). Not part of the required showcase contract.
   */
  time_to_mvp?: string;
}

/**
 * A parsed Archive entry: validated frontmatter plus the derived `slug`
 * (from the filename) used for masonry cards and detail routing.
 */
export interface ArchiveEntryMeta extends ArchiveEntry {
  slug: string;
}

/**
 * A fully loaded Archive entry — metadata plus the raw MDX body for rendering
 * on the dynamic `/archive/[slug]` route.
 */
export interface ArchiveEntryFull extends ArchiveEntryMeta {
  content: string;
}

/* -------------------------------------------------------------------------- */
/* The Playbook                                                               */
/* -------------------------------------------------------------------------- */

/** Lifecycle of a Playbook page — `evergreen` is currently-true canon. */
export type PlaybookStatus = "draft" | "evergreen";

/**
 * Frontmatter contract for a single Playbook entry.
 *
 * The Playbook is a living wiki: it highlights what is currently true, not
 * when something happened — hence `last_updated` rather than a creation date.
 */
export interface PlaybookEntry {
  title: string;
  category: string;
  last_updated: string;
  status: PlaybookStatus;
}

/**
 * A parsed Playbook entry: validated frontmatter plus routing metadata derived
 * from its (possibly nested) path under `content/playbook`.
 *
 * - `slug` — path segments, e.g. `["engineering", "cursor-rules"]`.
 * - `path` — the resolved URL, e.g. `/playbook/engineering/cursor-rules`.
 */
export interface PlaybookEntryMeta extends PlaybookEntry {
  slug: string[];
  path: string;
}

/**
 * A fully loaded Playbook entry — metadata plus the raw MDX body for the
 * dynamic `/playbook/[...slug]` route.
 */
export interface PlaybookEntryFull extends PlaybookEntryMeta {
  content: string;
}

/**
 * A grouped branch of the Playbook navigation tree — one category and the
 * entries that belong to it, used to render the hierarchical sidebar.
 */
export interface PlaybookCategory {
  category: string;
  entries: PlaybookEntryMeta[];
}
