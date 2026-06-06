"use server";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CONTENT_ROOT } from "@/lib/paths";

/**
 * Local-first content authoring.
 *
 * Writes a fully-formed `.mdx` file (frontmatter + body) into the correct
 * `content/[pillar]` directory, then revalidates and redirects to the freshly
 * created page. This touches the local filesystem and is intended for `next
 * dev` only — it is guarded against production where the FS is read-only.
 */

const PILLARS = ["logbook", "archive", "playbook"] as const;
type Pillar = (typeof PILLARS)[number];

function isPillar(value: unknown): value is Pillar {
  return PILLARS.includes(value as Pillar);
}

/** Sanitize a title into a URL-friendly slug for the `.mdx` filename. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip special characters
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse repeats
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

export async function saveMdxFile(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Content authoring is disabled in production.");
  }

  const pillar = formData.get("pillar");
  const title = String(formData.get("title") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const body = String(formData.get("body") ?? "");

  if (!isPillar(pillar)) throw new Error("Invalid pillar.");
  if (!title) throw new Error("A title is required.");

  const slug = slugify(title);
  if (!slug) throw new Error("Title produced an empty slug.");

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const today = new Date().toISOString().slice(0, 10);

  // Compose pillar-appropriate frontmatter so the new entry parses cleanly
  // against the existing typed readers.
  const frontmatter: Record<string, unknown> = { title, tags };
  if (pillar === "logbook") {
    // The Logbook is the private timeline — never public.
    frontmatter.visibility = "private";
    frontmatter.date = today;
    frontmatter.location = "";
    frontmatter.summary = "";
  } else if (pillar === "archive") {
    frontmatter.visibility = "public";
    frontmatter.year = new Date().getFullYear();
    frontmatter.tier = "demo";
    frontmatter.category = "";
    frontmatter.hero_media = "";
    frontmatter.tech_stack = tags;
  } else {
    frontmatter.visibility = "public";
    frontmatter.category = "Uncategorized";
    frontmatter.last_updated = today;
    frontmatter.status = "draft";
  }

  const fileContents = matter.stringify(`\n${body.trim()}\n`, frontmatter);

  const dir = path.join(CONTENT_ROOT, pillar);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, `${slug}.mdx`), fileContents, "utf8");

  // Refresh the index + the new page, then jump straight to the result.
  const destination = `/${pillar}/${slug}`;
  revalidatePath(`/${pillar}`);
  revalidatePath(destination);
  redirect(destination);
}
