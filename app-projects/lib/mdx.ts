import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
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
export function getAllLogbookEntries(): LogbookEntryMeta[] {
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
}

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
export function getAllArchiveEntries(): ArchiveEntryMeta[] {
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
}

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
export function getAllPlaybookEntries(): PlaybookEntryMeta[] {
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
}

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
