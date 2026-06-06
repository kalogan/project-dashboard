import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Unit tests for the Surface Engine: "On This Day" matching (month/day,
 * any year) and the evergreen fallback. Uses the same virtual-fs + identity-
 * cache mocks as the MDX tests.
 */

const store = vi.hoisted(() => ({ files: new Map<string, string>() }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T,>(fn: T) => fn };
});

vi.mock("node:fs", () => {
  const SEP = "/";
  const { files } = store;
  const existsSync = (p: string) => {
    if (files.has(p)) return true;
    const prefix = p.endsWith(SEP) ? p : p + SEP;
    return [...files.keys()].some((k) => k.startsWith(prefix));
  };
  const readFileSync = (p: string) => {
    const content = files.get(p);
    if (content === undefined) throw new Error(`ENOENT: ${p}`);
    return content;
  };
  const readdirSync = (dir: string, opts?: { withFileTypes?: boolean }) => {
    const prefix = dir.endsWith(SEP) ? dir : dir + SEP;
    const names = new Set<string>();
    const dirs = new Set<string>();
    for (const key of files.keys()) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const idx = rest.indexOf(SEP);
      if (idx === -1) names.add(rest);
      else {
        names.add(rest.slice(0, idx));
        dirs.add(rest.slice(0, idx));
      }
    }
    const list = [...names];
    if (opts?.withFileTypes) {
      return list.map((name) => ({
        name,
        isDirectory: () => dirs.has(name),
        isFile: () => !dirs.has(name),
      }));
    }
    return list;
  };
  const api = { existsSync, readFileSync, readdirSync };
  return { default: api, ...api };
});

const CWD = process.cwd();

beforeEach(() => {
  store.files.clear();
  // A logbook entry on June 6 (2015) — should match "today" = June 6, 2026.
  store.files.set(
    `${CWD}/content/logbook/sewer-rodding.mdx`,
    `---\ntitle: "Chicago Sewer Rodding"\ndate: "2015-06-06"\ntags: []\nvisibility: "public"\n---\nThe rods finally cleared the line.`
  );
  // A non-matching logbook entry.
  store.files.set(
    `${CWD}/content/logbook/japan.mdx`,
    `---\ntitle: "Japan"\ndate: "2024-04-15"\ntags: []\nvisibility: "public"\n---\nBody.`
  );
  // An evergreen playbook for the fallback.
  store.files.set(
    `${CWD}/content/playbook/tactical-life/espresso.mdx`,
    `---\ntitle: "Espresso Spec"\ncategory: "Tactical Life"\nlast_updated: "2026-06-01"\nstatus: "evergreen"\nvisibility: "public"\ntags: []\n---\nA 1:2 ratio, pulled tight.`
  );
});

describe("getHistoricalMatches", () => {
  it("matches month+day regardless of year", async () => {
    vi.resetModules();
    const { getHistoricalMatches } = await import("@/lib/surface");
    const matches = getHistoricalMatches(new Date(2026, 5, 6)); // June 6, 2026
    const titles = matches.map((m) => m.title);
    expect(titles).toContain("Chicago Sewer Rodding");
    expect(titles).not.toContain("Japan");
    expect(matches[0].year).toBe("2015");
    expect(matches[0].excerpt.length).toBeGreaterThan(0);
  });

  it("returns no matches on a date with no history", async () => {
    vi.resetModules();
    const { getHistoricalMatches } = await import("@/lib/surface");
    expect(getHistoricalMatches(new Date(2026, 0, 1))).toHaveLength(0); // Jan 1
  });
});

describe("getRandomEvergreen", () => {
  it("surfaces an evergreen playbook entry", async () => {
    vi.resetModules();
    const { getRandomEvergreen } = await import("@/lib/surface");
    const entry = getRandomEvergreen();
    expect(entry).not.toBeNull();
    expect(entry?.title).toBe("Espresso Spec");
    expect(entry?.pillar).toBe("playbook");
  });
});
