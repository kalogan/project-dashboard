"use server";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { revalidatePath } from "next/cache";
import {
  mimeToKind,
  mimeFromExt,
  readMeta,
  writeMeta,
  resolveInboxPath,
} from "@/lib/inbox";
import type { InboxKind, Pillar } from "@/types";

/**
 * Triage commit engine.
 *
 * Takes one or more queued `_inbox` files, routes each by MIME type
 * (images → sharp/webp, videos → ffmpeg/mp4, docs → passthrough), writes the
 * optimized assets under `public/`, generates a single `.mdx` entry (a unified
 * gallery when more than one file is selected), and removes the raw originals.
 * Filesystem-bound, so disabled in production.
 */

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

const PILLARS: Pillar[] = ["logbook", "archive", "playbook"];
const MAX_IMAGE_WIDTH = 1920;
const WEBP_QUALITY = 80;

interface ProcessedAsset {
  url: string;
  kind: InboxKind;
  original: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomBase(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Aggressively compress an image to .webp. */
async function processImage(src: string, dir: string): Promise<string> {
  const buffer = await sharp(src)
    .rotate()
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const name = `${randomBase()}.webp`;
  await fs.promises.writeFile(path.join(dir, name), buffer);
  return name;
}

/**
 * Compress a video to a web-friendly H.264 mp4. ffmpeg runs as a child
 * process, so it never blocks the Node event loop for other requests.
 */
function processVideo(src: string, dir: string): Promise<string> {
  const name = `${randomBase()}.mp4`;
  const dest = path.join(dir, name);
  return new Promise((resolve, reject) => {
    ffmpeg(src)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size("?x720")
      .outputOptions(["-crf 28", "-preset veryfast", "-movflags +faststart"])
      .on("end", () => resolve(name))
      .on("error", (err) =>
        reject(new Error(`Video compression failed: ${err.message}`))
      )
      .save(dest);
  });
}

/** One asset's markdown/MDX representation. */
function assetMarkdown(asset: ProcessedAsset): string {
  if (asset.kind === "image") return `![${asset.original}](${asset.url})`;
  if (asset.kind === "video") {
    return `<video src="${asset.url}" controls className="w-full border border-gray-800" />`;
  }
  return `[${asset.original}](${asset.url})`;
}

function buildFrontmatter(
  pillar: Pillar,
  opts: { title: string; tags: string[]; date: string; hero?: string }
): Record<string, unknown> {
  const fm: Record<string, unknown> = { title: opts.title, tags: opts.tags };
  if (pillar === "logbook") {
    fm.date = opts.date;
    fm.location = "";
    fm.summary = "";
  } else if (pillar === "archive") {
    fm.year = Number(opts.date.slice(0, 4)) || new Date().getFullYear();
    fm.tier = "archive";
    fm.category = "";
    fm.visibility = "private";
    fm.hero_media = opts.hero ?? "";
    fm.tech_stack = opts.tags;
  } else {
    fm.category = "Uncategorized";
    fm.last_updated = opts.date;
    fm.status = "draft";
  }
  return fm;
}

export async function commitInbox(formData: FormData): Promise<{
  ok: boolean;
  path: string;
  count: number;
}> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Triage commit is disabled in production.");
  }

  const names = formData.getAll("names").map(String).filter(Boolean);
  const pillar = formData.get("pillar");
  const title = String(formData.get("title") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const date =
    String(formData.get("date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);

  if (names.length === 0) throw new Error("No files selected.");
  if (!PILLARS.includes(pillar as Pillar)) throw new Error("Invalid pillar.");
  if (!title) throw new Error("A title is required.");

  const slug = slugify(title);
  if (!slug) throw new Error("Title produced an empty slug.");

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const [year, month] = [date.slice(0, 4), date.slice(5, 7)];
  const mediaDir = path.join(process.cwd(), "public", "media", year, month);
  const docsDir = path.join(process.cwd(), "public", "docs");
  await fs.promises.mkdir(mediaDir, { recursive: true });

  const meta = readMeta();
  const assets: ProcessedAsset[] = [];

  for (const name of names) {
    const src = resolveInboxPath(name);
    if (!fs.existsSync(src)) continue;
    const mime = meta[name]?.mime ?? mimeFromExt(name);
    const kind = mimeToKind(mime);

    if (kind === "image") {
      const file = await processImage(src, mediaDir);
      assets.push({ url: `/media/${year}/${month}/${file}`, kind, original: name });
    } else if (kind === "video") {
      const file = await processVideo(src, mediaDir);
      assets.push({ url: `/media/${year}/${month}/${file}`, kind, original: name });
    } else {
      // docs / other: passthrough, no compression.
      await fs.promises.mkdir(docsDir, { recursive: true });
      const ext = path.extname(name) || "";
      const file = `${randomBase()}${ext}`;
      await fs.promises.copyFile(src, path.join(docsDir, file));
      assets.push({ url: `/docs/${file}`, kind, original: name });
    }
  }

  if (assets.length === 0) throw new Error("No valid files were processed.");

  const body =
    assets.length > 1
      ? `## Gallery\n\n${assets.map(assetMarkdown).join("\n\n")}\n`
      : `${assetMarkdown(assets[0])}\n`;

  const hero = assets.find((a) => a.kind === "image")?.url;
  const frontmatter = buildFrontmatter(pillar as Pillar, {
    title,
    tags,
    date,
    hero,
  });

  const dir = path.join(process.cwd(), "content", pillar as string);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(
    path.join(dir, `${slug}.mdx`),
    matter.stringify(`\n${body}`, frontmatter),
    "utf8"
  );

  // Clean up: delete the raw originals and drop their metadata.
  for (const name of names) {
    await fs.promises.rm(resolveInboxPath(name), { force: true });
    delete meta[name];
  }
  writeMeta(meta);

  revalidatePath(`/${pillar}`);
  revalidatePath("/editor");
  return { ok: true, path: `/${pillar}/${slug}`, count: assets.length };
}
