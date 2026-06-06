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
