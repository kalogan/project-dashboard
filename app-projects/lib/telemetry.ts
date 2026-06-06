import {
  getAllLogbookEntries,
  getAllArchiveEntries,
  getAllPlaybookEntries,
} from "@/lib/mdx";

/**
 * Activity telemetry for the contribution heatmap.
 *
 * Aggregates the meaningful date from every entry across the three pillars
 * (Logbook `date`, Archive `year`, Playbook `last_updated`) into a frequency
 * map keyed by ISO day, e.g. `{ "2026-06-01": 2, "2026-06-05": 1 }`.
 */
export type ActivityMap = Record<string, number>;

export function getActivityData(): ActivityMap {
  const dates: string[] = [];

  for (const entry of getAllLogbookEntries()) {
    if (entry.date) dates.push(entry.date);
  }
  for (const entry of getAllArchiveEntries()) {
    if (entry.year) dates.push(`${entry.year}-01-01`);
  }
  for (const entry of getAllPlaybookEntries()) {
    if (entry.last_updated) dates.push(entry.last_updated);
  }

  return dates.reduce<ActivityMap>((freq, raw) => {
    const day = raw.slice(0, 10); // normalize to YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) freq[day] = (freq[day] ?? 0) + 1;
    return freq;
  }, {});
}
