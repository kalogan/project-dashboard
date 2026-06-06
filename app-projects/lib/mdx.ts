import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { tagToSlug } from "@/lib/slug";
import type {
  LogbookEntry,
  LogbookEntryMeta,
  LogbookEntryFull,
  ArchiveEntry,
  ArchiveEntryMeta,
  ArchiveEntryFull,
  ArchiveTier,
  ArchiveVisibility,
  PlaybookEntry,
  PlaybookEntryMeta,
  PlaybookEntryFull,
  PlaybookCategory,
  PlaybookStatus,
  TaggedEntry,
} from "@/types";

/**
 * Server-side MDX ingestion for The Logbook.
 *
 * Reads local `.mdx` files from `content/logbook`, parses frontmatter with
 * gray-matter, and exposes typed accessors. This module touches `node:fs` and
 * is therefore Server-Component / build-time only.
 */
const LOGBOOK_DIR = path.join(process.cwd(), "content", "logbook");

/** Coerce raw gray-matter frontmatter into a typed LogbookEntry. */
function toLogbookEntry(data: Record<string, unknown>): LogbookEntry {
  return {
    title: String(data.title ?? ""),
    date: String(data.date ?? ""),
    location: String(data.location ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    summary: String(data.summary ?? ""),
  };
}

/**
 * Read and parse every `.mdx` file in `content/logbook`, returning metadata
 * sorted by date, newest first.
 */
export const getAllLogbookEntries = cache((): LogbookEntryMeta[] => {
  if (!fs.existsSync(LOGBOOK_DIR)) return [];

  const entries = fs
    .readdirSync(LOGBOOK_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(LOGBOOK_DIR, file), "utf8");
      const { data } = matter(raw);
      return { slug, ...toLogbookEntry(data) };
    });

  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

/**
 * Load a single Logbook entry (metadata + raw MDX body) by slug, or return
 * null when no matching file exists.
 */
export function getLogbookEntry(slug: string): LogbookEntryFull | null {
  const filePath = path.join(LOGBOOK_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { slug, ...toLogbookEntry(data), content };
}

/* -------------------------------------------------------------------------- */
/* The Archive                                                                */
/* -------------------------------------------------------------------------- */

const ARCHIVE_DIR = path.join(process.cwd(), "content", "archive");

const ARCHIVE_TIERS: readonly ArchiveTier[] = ["portfolio", "demo", "archive"];

/** Narrow an arbitrary value to a known ArchiveTier, defaulting to `archive`. */
function toTier(value: unknown): ArchiveTier {
  return ARCHIVE_TIERS.includes(value as ArchiveTier)
    ? (value as ArchiveTier)
    : "archive";
}

/** Narrow an arbitrary value to a visibility flag, defaulting to `private`. */
function toVisibility(value: unknown): ArchiveVisibility {
  return value === "public" ? "public" : "private";
}

/** Coerce raw gray-matter frontmatter into a typed ArchiveEntry. */
function toArchiveEntry(data: Record<string, unknown>): ArchiveEntry {
  return {
    title: String(data.title ?? ""),
    year: Number(data.year ?? 0),
    tier: toTier(data.tier),
    category: String(data.category ?? ""),
    visibility: toVisibility(data.visibility),
    hero_media: String(data.hero_media ?? ""),
    tech_stack: Array.isArray(data.tech_stack)
      ? data.tech_stack.map(String)
      : [],
    ...(data.time_to_mvp != null
      ? { time_to_mvp: String(data.time_to_mvp) }
      : {}),
  };
}

/**
 * Read and parse every `.mdx` file in `content/archive`, returning metadata
 * sorted by `year`, newest first.
 */
export const getAllArchiveEntries = cache((): ArchiveEntryMeta[] => {
  if (!fs.existsSync(ARCHIVE_DIR)) return [];

  const entries = fs
    .readdirSync(ARCHIVE_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(ARCHIVE_DIR, file), "utf8");
      const { data } = matter(raw);
      return { slug, ...toArchiveEntry(data) };
    });

  return entries.sort((a, b) => b.year - a.year);
});

/**
 * Load a single Archive entry (metadata + raw MDX body) by slug, or return
 * null when no matching file exists.
 */
export function getArchiveEntry(slug: string): ArchiveEntryFull | null {
  const filePath = path.join(ARCHIVE_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { slug, ...toArchiveEntry(data), content };
}

/* -------------------------------------------------------------------------- */
/* The Playbook                                                               */
/* -------------------------------------------------------------------------- */

const PLAYBOOK_DIR = path.join(process.cwd(), "content", "playbook");

/** Narrow an arbitrary value to a PlaybookStatus, defaulting to `draft`. */
function toStatus(value: unknown): PlaybookStatus {
  return value === "evergreen" ? "evergreen" : "draft";
}

/** Coerce raw gray-matter frontmatter into a typed PlaybookEntry. */
function toPlaybookEntry(data: Record<string, unknown>): PlaybookEntry {
  return {
    title: String(data.title ?? ""),
    category: String(data.category ?? "Uncategorized"),
    last_updated: String(data.last_updated ?? ""),
    status: toStatus(data.status),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };
}

/**
 * Recursively collect the relative paths of every `.mdx` file beneath `dir`.
 * Returned paths use forward slashes and are relative to `PLAYBOOK_DIR`, so a
 * file at `playbook/engineering/cursor-rules.mdx` yields
 * `engineering/cursor-rules.mdx`.
 */
function walkMdx(dir: string, base: string = dir): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const abs = path.join(dir, dirent.name);
    if (dirent.isDirectory()) return walkMdx(abs, base);
    if (dirent.isFile() && dirent.name.endsWith(".mdx")) {
      return [path.relative(base, abs).split(path.sep).join("/")];
    }
    return [];
  });
}

/**
 * Read and parse every `.mdx` file in `content/playbook` (including nested
 * subdirectories), returning metadata with derived slug/path. Sorted by
 * category, then title, for stable hierarchical navigation.
 */
export const getAllPlaybookEntries = cache((): PlaybookEntryMeta[] => {
  return walkMdx(PLAYBOOK_DIR)
    .map((relPath) => {
      const slug = relPath.replace(/\.mdx$/, "").split("/");
      const raw = fs.readFileSync(path.join(PLAYBOOK_DIR, relPath), "utf8");
      const { data } = matter(raw);
      return {
        slug,
        path: `/playbook/${slug.join("/")}`,
        ...toPlaybookEntry(data),
      };
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
    );
});

/**
 * Build the hierarchical navigation tree: entries grouped by their `category`
 * frontmatter, with categories and entries alphabetized for a stable sidebar.
 */
export function getPlaybookTree(): PlaybookCategory[] {
  const byCategory = new Map<string, PlaybookEntryMeta[]>();

  for (const entry of getAllPlaybookEntries()) {
    const bucket = byCategory.get(entry.category) ?? [];
    bucket.push(entry);
    byCategory.set(entry.category, bucket);
  }

  return Array.from(byCategory.entries())
    .map(([category, entries]) => ({ category, entries }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Load a single Playbook entry (metadata + raw MDX body) by slug segments, or
 * return null when no matching file exists.
 */
export function getPlaybookEntry(slug: string[]): PlaybookEntryFull | null {
  const filePath = path.join(PLAYBOOK_DIR, `${slug.join("/")}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    path: `/playbook/${slug.join("/")}`,
    ...toPlaybookEntry(data),
    content,
  };
}

/* -------------------------------------------------------------------------- */
/* Global tag taxonomy                                                        */
/* -------------------------------------------------------------------------- */

// Re-exported so server callers can keep importing it from here, while client
// components import it directly from the fs-free "@/lib/slug".
export { tagToSlug };

/**
 * Collapse all three pillars into a single normalized shape for the tag
 * taxonomy. Archive entries expose their `tech_stack` as tags; Logbook and
 * Playbook expose their `tags`. Each entry carries a `sortKey` for descending
 * chronological ordering.
 */
export const getTaggedEntries = cache((): TaggedEntry[] => {
  const logbook: TaggedEntry[] = getAllLogbookEntries().map((entry) => ({
    pillar: "logbook",
    title: entry.title,
    path: `/logbook/${entry.slug}`,
    tags: entry.tags,
    display: entry.date,
    sortKey: new Date(entry.date).getTime() || 0,
  }));

  const archive: TaggedEntry[] = getAllArchiveEntries().map((entry) => ({
    pillar: "archive",
    title: entry.title,
    path: `/archive/${entry.slug}`,
    tags: entry.tech_stack,
    display: String(entry.year),
    sortKey: new Date(`${entry.year}-01-01`).getTime() || 0,
  }));

  const playbook: TaggedEntry[] = getAllPlaybookEntries().map((entry) => ({
    pillar: "playbook",
    title: entry.title,
    path: entry.path,
    tags: entry.tags,
    display: entry.last_updated,
    sortKey: new Date(entry.last_updated).getTime() || 0,
  }));

  return [...logbook, ...archive, ...playbook];
});

/**
 * Every unique tag across all three pillars, de-duplicated by slug (so
 * "TypeScript" and "typescript" collapse) and sorted alphabetically.
 */
export function getAllUniqueTags(): string[] {
  const bySlug = new Map<string, string>();
  for (const entry of getTaggedEntries()) {
    for (const tag of entry.tags) {
      const slug = tagToSlug(tag);
      if (slug && !bySlug.has(slug)) bySlug.set(slug, tag);
    }
  }
  return Array.from(bySlug.values()).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}

/** Every entry (newest first) whose tags include the given tag slug. */
export function getEntriesByTagSlug(tagSlug: string): TaggedEntry[] {
  return getTaggedEntries()
    .filter((entry) => entry.tags.some((tag) => tagToSlug(tag) === tagSlug))
    .sort((a, b) => b.sortKey - a.sortKey);
}

/* -------------------------------------------------------------------------- */
/* Bi-directional (wiki-style) links                                          */
/* -------------------------------------------------------------------------- */

/** A resolvable reference to a single page. */
export interface SlugRef {
  slug: string;
  title: string;
  path: string;
}

const WIKILINK_RE = /\[\[([^\]\n]+)\]\]/g;

/** Normalize a wiki-link target to a comparable key. */
function normalizeTarget(target: string): string {
  return target.trim().toLowerCase();
}

/**
 * Every page across the three pillars as `{ slug, title, path, content }`.
 * Playbook entries are keyed by their final path segment so `[[ai-workflows]]`
 * resolves regardless of nesting depth.
 */
const getAllFullEntries = cache((): (SlugRef & { content: string })[] => {
  const out: (SlugRef & { content: string })[] = [];

  for (const entry of getAllLogbookEntries()) {
    const full = getLogbookEntry(entry.slug);
    out.push({
      slug: entry.slug,
      title: entry.title,
      path: `/logbook/${entry.slug}`,
      content: full?.content ?? "",
    });
  }
  for (const entry of getAllArchiveEntries()) {
    const full = getArchiveEntry(entry.slug);
    out.push({
      slug: entry.slug,
      title: entry.title,
      path: `/archive/${entry.slug}`,
      content: full?.content ?? "",
    });
  }
  for (const entry of getAllPlaybookEntries()) {
    const full = getPlaybookEntry(entry.slug);
    out.push({
      slug: entry.slug[entry.slug.length - 1],
      title: entry.title,
      path: entry.path,
      content: full?.content ?? "",
    });
  }

  return out;
});

/** Resolve a slug → page reference for wiki-link resolution. First wins. */
export const getSlugIndex = cache((): Record<string, SlugRef> => {
  const index: Record<string, SlugRef> = {};
  for (const { slug, title, path } of getAllFullEntries()) {
    const key = normalizeTarget(slug);
    if (!index[key]) index[key] = { slug, title, path };
  }
  return index;
});

/**
 * Build the master backlink graph: for each target slug, the list of pages
 * that link to it via `[[target]]`. Computed entirely on the server.
 */
export const generateBacklinkGraph = cache((): Record<string, SlugRef[]> => {
  const graph: Record<string, SlugRef[]> = {};

  for (const source of getAllFullEntries()) {
    const seen = new Set<string>();
    for (const match of Array.from(source.content.matchAll(WIKILINK_RE))) {
      const target = normalizeTarget(match[1]);
      if (target === normalizeTarget(source.slug)) continue; // ignore self-links
      if (seen.has(target)) continue;
      seen.add(target);
      (graph[target] ??= []).push({
        slug: source.slug,
        title: source.title,
        path: source.path,
      });
    }
  }

  return graph;
});

/** Incoming links for a single page slug (empty array if none). */
export function getBacklinks(slug: string): SlugRef[] {
  return generateBacklinkGraph()[normalizeTarget(slug)] ?? [];
}

/**
 * Rewrite `[[target]]` syntax into `<WikiLink target="…" />` JSX, skipping
 * fenced and inline code so command samples are left untouched.
 */
export function injectWikiLinks(content: string): string {
  return content
    .split(/(```[\s\S]*?```)/g)
    .map((segment, fenceIndex) => {
      if (fenceIndex % 2 === 1) return segment; // fenced code block
      return segment
        .split(/(`[^`]*`)/g)
        .map((part, codeIndex) => {
          if (codeIndex % 2 === 1) return part; // inline code
          return part.replace(WIKILINK_RE, (_match, target: string) => {
            const escaped = target.trim().replace(/"/g, "&quot;");
            return `<WikiLink target="${escaped}" />`;
          });
        })
        .join("");
    })
    .join("");
}
