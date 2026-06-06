import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { tagToSlug } from "@/lib/slug";

/**
 * Unit tests for the MDX core: frontmatter parsing, the global tag taxonomy,
 * and the production "Vault Guardrail" (private/draft files are filtered out).
 *
 * `node:fs` is replaced with an in-memory virtual filesystem, and React's
 * `cache` is made an identity wrapper so the readers run plainly in Node.
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

function seed() {
  store.files.clear();
  store.files.set(
    `${CWD}/content/logbook/japan.mdx`,
    `---\ntitle: "Japan"\ndate: "2024-04-15"\ntags: ["travel", "milestone"]\nvisibility: "private"\n---\nBody.`
  );
  store.files.set(
    `${CWD}/content/logbook/ops-log.mdx`,
    `---\ntitle: "Ops Log"\ndate: "2024-05-01"\ntags: ["ops"]\nvisibility: "public"\n---\nBody.`
  );
  store.files.set(
    `${CWD}/content/archive/exile.mdx`,
    `---\ntitle: "Exile"\nyear: 2026\ntier: "portfolio"\nvisibility: "public"\ntech_stack: ["Electron", "TypeScript"]\n---\nBody.`
  );
  store.files.set(
    `${CWD}/content/archive/secret.mdx`,
    `---\ntitle: "Secret"\nyear: 2025\ntier: "archive"\nvisibility: "private"\ntech_stack: ["Rust"]\n---\nBody.`
  );
  store.files.set(
    `${CWD}/content/playbook/engineering/ai.mdx`,
    `---\ntitle: "AI Workflows"\ncategory: "Engineering"\nlast_updated: "2026-05-12"\nstatus: "evergreen"\nvisibility: "public"\ntags: ["ai"]\n---\nBody.`
  );
}

async function loadMdx(nodeEnv: "test" | "production") {
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.resetModules();
  return import("@/lib/mdx");
}

beforeEach(seed);
afterEach(() => vi.unstubAllEnvs());

describe("frontmatter extraction", () => {
  it("parses typed Archive frontmatter", async () => {
    const { getAllArchiveEntries } = await loadMdx("test");
    const exile = getAllArchiveEntries().find((e) => e.slug === "exile");
    expect(exile).toMatchObject({
      title: "Exile",
      year: 2026,
      tier: "portfolio",
      visibility: "public",
      tech_stack: ["Electron", "TypeScript"],
    });
  });

  it("default-denies a missing visibility flag to private", async () => {
    store.files.set(
      `${CWD}/content/logbook/no-flag.mdx`,
      `---\ntitle: "No Flag"\ndate: "2024-01-01"\ntags: []\n---\nBody.`
    );
    const { getAllLogbookEntries } = await loadMdx("test");
    const entry = getAllLogbookEntries().find((e) => e.slug === "no-flag");
    expect(entry?.visibility).toBe("private");
  });
});

describe("getAllUniqueTags", () => {
  it("aggregates and de-duplicates tags across pillars (dev)", async () => {
    const { getAllUniqueTags } = await loadMdx("test");
    const slugs = getAllUniqueTags().map(tagToSlug);
    expect(slugs).toEqual(expect.arrayContaining(["electron", "typescript", "ops", "ai", "travel"]));
    // includes a private file's tag in dev
    expect(slugs).toContain("rust");
  });
});

describe("vault guardrail (production)", () => {
  it("filters private entries out of the readers", async () => {
    const { getAllLogbookEntries, getAllArchiveEntries } = await loadMdx("production");
    expect(getAllLogbookEntries().map((e) => e.slug)).toEqual(["ops-log"]);
    expect(getAllArchiveEntries().map((e) => e.slug)).toEqual(["exile"]);
  });

  it("never exposes private tags in the public taxonomy", async () => {
    const { getAllUniqueTags } = await loadMdx("production");
    const slugs = getAllUniqueTags().map(tagToSlug);
    expect(slugs).toContain("electron");
    expect(slugs).not.toContain("rust"); // from a private archive entry
    expect(slugs).not.toContain("travel"); // from a private logbook entry
  });

  it("hard-denies a private entry on direct access", async () => {
    const { getLogbookEntry } = await loadMdx("production");
    expect(getLogbookEntry("japan")).toBeNull(); // private
    expect(getLogbookEntry("ops-log")).not.toBeNull(); // public
  });
});
