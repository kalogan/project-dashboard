import { getActivityData } from "@/lib/telemetry";

/**
 * GitHub-style contribution heatmap — strictly monochrome.
 *
 * Server Component: all aggregation and grid construction happen at build/dev
 * time, so the client receives nothing but a static grid of pre-colored divs
 * (no client JS, no layout thrash). Tooltips use the native `title` attribute.
 */

const DAYS = 365;

/** Map an entry count to a grayscale intensity class. */
function intensityClass(count: number): string {
  if (count <= 0) return "bg-transparent border border-gray-900";
  if (count === 1) return "bg-gray-800";
  if (count === 2) return "bg-gray-600";
  if (count === 3) return "bg-gray-400";
  return "bg-white";
}

/** Local-time ISO day (YYYY-MM-DD) — avoids UTC off-by-one from toISOString. */
function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ActivityHeatmap() {
  const activity = getActivityData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // The 365 days leading up to today, oldest first.
  const days: Date[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Pad the front so each grid row corresponds to a weekday (Sun..Sat).
  const leadingBlanks = days[0].getDay();

  return (
    <section aria-label="Activity over the past year">
      <h2 className="border-b border-gray-800 pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
        Activity
      </h2>

      {/* dir=rtl on the scroller starts the scroll at the right edge (most
          recent days) with no client JS; dir=ltr on the grid keeps the visual
          order chronological. */}
      <div
        dir="rtl"
        className="mt-4 snap-x overflow-x-auto overflow-y-hidden pb-2"
      >
        <div dir="ltr" className="grid grid-flow-col grid-rows-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} aria-hidden className="h-2.5 w-2.5" />
          ))}
          {days.map((date) => {
            const key = isoDay(date);
            const count = activity[key] ?? 0;
            return (
              <div
                key={key}
                title={`${key}: ${count} ${count === 1 ? "entry" : "entries"}`}
                className={`h-2.5 w-2.5 rounded-sm ${intensityClass(count)}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
