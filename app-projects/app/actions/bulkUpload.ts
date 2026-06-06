"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import ExifParser from "exif-parser";
import { INBOX_DIR, mimeToKind, readMeta, writeMeta } from "@/lib/inbox";

/**
 * Bulk media ingestion — drop many raw files into the triage `_inbox`.
 *
 * Files are stored uncompressed; for images we extract EXIF `DateTimeOriginal`
 * up front so triage already knows when each memory occurred. Compression is
 * deferred to the commit step. Filesystem-bound, so disabled in production.
 */

/** Sanitize an original filename: keep a readable base, strip anything risky. */
function safeName(original: string): string {
  const base = path
    .basename(original)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  const unique = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  return `${unique}-${base || "file"}`;
}

/** Pull EXIF DateTimeOriginal (Unix seconds) → ISO day, or null. */
function exifDate(buffer: Buffer): string | null {
  try {
    const { tags } = ExifParser.create(buffer).parse();
    const seconds = tags?.DateTimeOriginal;
    if (typeof seconds === "number" && seconds > 0) {
      return new Date(seconds * 1000).toISOString().slice(0, 10);
    }
  } catch {
    // Not a JPEG/TIFF or no EXIF block — fine, leave undated.
  }
  return null;
}

export async function bulkUpload(formData: FormData): Promise<{ count: number }> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Bulk ingestion is disabled in production.");
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) throw new Error("No files provided.");

  await fs.promises.mkdir(INBOX_DIR, { recursive: true });
  const meta = readMeta();

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = safeName(file.name);
    await fs.promises.writeFile(path.join(INBOX_DIR, stored), buffer);

    const mime = file.type || "application/octet-stream";
    meta[stored] = {
      mime,
      size: buffer.length,
      capturedAt: mimeToKind(mime) === "image" ? exifDate(buffer) : null,
    };
  }

  writeMeta(meta);
  revalidatePath("/editor");
  return { count: files.length };
}
