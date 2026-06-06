"use server";

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Local-first media ingestion.
 *
 * Accepts a raw pasted/dropped image, aggressively compresses it to .webp with
 * sharp, and writes it into a chronologically organized folder under
 * `public/media/YYYY/MM/`. Returns the public relative URL.
 *
 * Filesystem-bound and dev-only: guarded against production so a Vercel build
 * (read-only FS) can never invoke it.
 */

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;

/** Random, collision-resistant base filename. */
function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function uploadImage(formData: FormData): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Media upload is disabled in production.");
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image provided.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}.`);
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Compress + convert: cap the width, never enlarge, strip to webp@80.
  const webp = await sharp(inputBuffer)
    .rotate() // honor EXIF orientation before resize
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const fileName = `${randomName()}.webp`;

  const dir = path.join(process.cwd(), "public", "media", year, month);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, fileName), webp);

  return `/media/${year}/${month}/${fileName}`;
}
