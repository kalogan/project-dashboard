import {
  getAllLogbookEntries,
  getLogbookEntry,
  getAllPlaybookEntries,
  getPlaybookEntry,
} from "@/lib/mdx";
import type { Pillar } from "@/types";

/**
 * The Surface Engine — actively resurfaces history to fight information rot.
 *
 * Finds entries whose month+day match today ("On This Day") and, failing that,
 * surfaces a random evergreen playbook for review. All date logic runs on the
 * server; nothing here touches the client.
 */

export interface SurfaceEntry {
  pillar: Pillar;
  title: string;
  path: string;
  year: string;
  excerpt: string;
}

/** Strip MDX to plain text and keep the first ~2 sentences. */
function toExcerpt(body: string): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = plain.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) {
    return `${sentences[0].trim()} ${sentences[1].trim()}`;
  }
  return plain.length > 180 ? `${plain.slice(0, 180).trimEnd()}…` : plain;
}

const monthDay = (iso: string) => iso.slice(5, 10); // "MM-DD"

/**
 * Entries across the Logbook and Playbook whose month/day match `currentDate`,
 * regardless of year. (Archive entries only carry a year, so they're excluded
 * from same-day matching.)
 */
export function getHistoricalMatches(currentDate: Date): SurfaceEntry[] {
  const key = `${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(
    currentDate.getDate()
  ).padStart(2, "0")}`;

  const matches: SurfaceEntry[] = [];

  for (const entry of getAllLogbookEntries()) {
    if (entry.date && monthDay(entry.date) === key) {
      const full = getLogbookEntry(entry.slug);
      matches.push({
        pillar: "logbook",
        title: entry.title,
        path: `/logbook/${entry.slug}`,
        year: entry.date.slice(0, 4),
        excerpt: full ? toExcerpt(full.content) : entry.summary,
      });
    }
  }

  for (const entry of getAllPlaybookEntries()) {
    if (entry.last_updated && monthDay(entry.last_updated) === key) {
      const full = getPlaybookEntry(entry.slug);
      matches.push({
        pillar: "playbook",
        title: entry.title,
        path: entry.path,
        year: entry.last_updated.slice(0, 4),
        excerpt: full ? toExcerpt(full.content) : "",
      });
    }
  }

  return matches;
}

/**
 * Serendipity fallback: a random evergreen playbook so the dashboard always
 * presents a piece of active knowledge for review. Returns null if none exist.
 */
export function getRandomEvergreen(): SurfaceEntry | null {
  const evergreen = getAllPlaybookEntries().filter(
    (entry) => entry.status === "evergreen"
  );
  if (evergreen.length === 0) return null;

  const pick = evergreen[Math.floor(Math.random() * evergreen.length)];
  const full = getPlaybookEntry(pick.slug);
  return {
    pillar: "playbook",
    title: pick.title,
    path: pick.path,
    year: pick.last_updated.slice(0, 4) || "—",
    excerpt: full ? toExcerpt(full.content) : "",
  };
}
