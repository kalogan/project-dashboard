import {
  getAllArchiveEntries,
  getArchiveEntry,
  getAllPlaybookEntries,
  getPlaybookEntry,
} from "@/lib/mdx";

/**
 * Global search index.
 *
 * Built statically at build time (`force-static`) into a single lightweight
 * JSON payload that the client-side command palette fetches once and searches
 * with fuse.js — no database, no per-keystroke server round trips.
 *
 * SECURITY — what is excluded from the public index:
 *   1. The entire `content/logbook` directory (the private timeline) is never
 *      read here, so it can never leak into the index.
 *   2. Any Archive entry with `visibility: 'private'` is dropped.
 *
 * Each record carries only `title`, `url_path`, `category`, and a short
 * `excerpt` — never the full markdown body — to keep the payload tiny.
 */
export const dynamic = "force-static";

interface SearchRecord {
  title: string;
  url_path: string;
  category: string;
  excerpt: string;
}

const EXCERPT_LENGTH = 160;

/**
 * Reduce a raw MDX body to a short, plain-text excerpt: strip frontmatter
 * leftovers, code fences, JSX tags, and markdown syntax, then truncate. Keeps
 * the index small and prevents full-body content from bloating the payload.
 */
function toExcerpt(body: string): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/<[^>]+>/g, " ") // JSX / HTML tags
    .replace(/[#>*_`~-]/g, " ") // markdown punctuation
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= EXCERPT_LENGTH) return plain;
  return `${plain.slice(0, EXCERPT_LENGTH).trimEnd()}…`;
}

function buildIndex(): SearchRecord[] {
  const records: SearchRecord[] = [];

  // Archive — public entries only.
  for (const meta of getAllArchiveEntries()) {
    if (meta.visibility !== "public") continue;
    const full = getArchiveEntry(meta.slug);
    records.push({
      title: meta.title,
      url_path: `/archive/${meta.slug}`,
      category: meta.category,
      excerpt: full ? toExcerpt(full.content) : "",
    });
  }

  // Playbook — all entries (no private timeline here).
  for (const meta of getAllPlaybookEntries()) {
    const full = getPlaybookEntry(meta.slug);
    records.push({
      title: meta.title,
      url_path: meta.path,
      category: meta.category,
      excerpt: full ? toExcerpt(full.content) : "",
    });
  }

  // NOTE: content/logbook is intentionally never indexed (private timeline).
  return records;
}

export function GET() {
  return Response.json(buildIndex());
}
