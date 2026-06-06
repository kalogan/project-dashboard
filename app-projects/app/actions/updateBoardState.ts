"use server";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { CONTENT_ROOT } from "@/lib/paths";
import type { Pillar } from "@/types";

/**
 * Persist a Logistics Board move by physically rewriting the source `.mdx`.
 *
 * Any prose before the first `### ` header is preserved; the board section is
 * regenerated from the new column/card ordering so the raw file and the UI stay
 * perfectly in sync. Filesystem-bound → disabled in production.
 */

interface BoardUpdate {
  pillar: Pillar;
  slug: string;
  columns: { title: string; cards: string[] }[];
}

const PILLARS: Pillar[] = ["logbook", "archive", "playbook"];

function resolveFile(pillar: Pillar, slug: string): string {
  // Playbook slugs may be nested ("engineering/ai"); logbook/archive are flat.
  const file = path.join(CONTENT_ROOT, pillar, `${slug}.mdx`);
  const resolved = path.resolve(file);
  const root = path.resolve(path.join(CONTENT_ROOT, pillar));
  if (!resolved.startsWith(root + path.sep)) throw new Error("Invalid path.");
  return resolved;
}

export async function updateBoardState(update: BoardUpdate): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Board persistence is disabled in production.");
  }
  if (!PILLARS.includes(update.pillar)) throw new Error("Invalid pillar.");

  const file = resolveFile(update.pillar, update.slug);
  if (!fs.existsSync(file)) throw new Error("Entry not found.");

  const raw = await fs.promises.readFile(file, "utf8");
  const { data, content } = matter(raw);

  // Keep any preamble before the first board column intact.
  const firstHeader = content.search(/^###\s+/m);
  const preamble = firstHeader === -1 ? content : content.slice(0, firstHeader);

  const boardText = update.columns
    .map((col) => {
      const cards = col.cards.length ? `${col.cards.join("\n")}\n` : "";
      return `### ${col.title}\n\n${cards}`;
    })
    .join("\n");

  const nextContent = `${preamble.replace(/\s+$/, "")}\n\n${boardText}`.trimStart();
  await fs.promises.writeFile(file, matter.stringify(nextContent, data), "utf8");

  revalidatePath(`/${update.pillar}/${update.slug}`);
}
