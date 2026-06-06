import fs from "node:fs";
import path from "node:path";
import type { InboxItem, InboxKind } from "@/types";

/**
 * Server-only helpers for the bulk-ingestion triage queue.
 *
 * Raw, uncompressed files live in the git-ignored `_inbox` directory alongside
 * a `_meta.json` sidecar that records each file's MIME type, size, and EXIF
 * capture date (so we don't re-parse on every render).
 */

export const INBOX_DIR = path.join(process.cwd(), "_inbox");
const META_FILE = path.join(INBOX_DIR, "_meta.json");

export interface InboxMetaEntry {
  mime: string;
  capturedAt: string | null;
  size: number;
}
type InboxMeta = Record<string, InboxMetaEntry>;

/** Route a MIME type to a processing lane. */
export function mimeToKind(mime: string): InboxKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || mime.startsWith("text/")) return "doc";
  return "other";
}

/** Best-effort MIME from a file extension, for files lacking sidecar metadata. */
export function mimeFromExt(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

export function readMeta(): InboxMeta {
  try {
    return JSON.parse(fs.readFileSync(META_FILE, "utf8")) as InboxMeta;
  } catch {
    return {};
  }
}

export function writeMeta(meta: InboxMeta): void {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), "utf8");
}

/**
 * List everything currently queued in `_inbox`, newest capture first. Files
 * without sidecar metadata fall back to extension-derived MIME and no date.
 */
export function readInbox(): InboxItem[] {
  if (!fs.existsSync(INBOX_DIR)) return [];
  const meta = readMeta();

  return fs
    .readdirSync(INBOX_DIR)
    .filter((name) => name !== "_meta.json" && !name.startsWith("."))
    .map((name) => {
      const entry = meta[name];
      const mime = entry?.mime ?? mimeFromExt(name);
      const stat = fs.statSync(path.join(INBOX_DIR, name));
      return {
        name,
        mime,
        kind: mimeToKind(mime),
        capturedAt: entry?.capturedAt ?? null,
        size: entry?.size ?? stat.size,
      } satisfies InboxItem;
    })
    .sort((a, b) => {
      // Captured items first (newest), then the rest by name.
      if (a.capturedAt && b.capturedAt) {
        return b.capturedAt.localeCompare(a.capturedAt);
      }
      if (a.capturedAt) return -1;
      if (b.capturedAt) return 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Resolve a stored inbox filename to an absolute path, guarding against path
 * traversal (the result must stay inside `_inbox`).
 */
export function resolveInboxPath(name: string): string {
  const resolved = path.join(INBOX_DIR, path.basename(name));
  if (path.dirname(resolved) !== INBOX_DIR) {
    throw new Error("Invalid inbox path.");
  }
  return resolved;
}
