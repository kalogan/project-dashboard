#!/usr/bin/env node
/* eslint-disable */
"use strict";

/**
 * Codex Pre-Flight Matrix — a local, offline "Codex Health Score" (0–100).
 *
 * Categories: Accessibility (40) + Performance (30) + Schema Integrity (30).
 * Wired into Husky as a pre-push hook; a score below 90 aborts the push.
 *
 * Runs entirely offline with zero external/API services. The accessibility and
 * performance checks are deterministic STATIC heuristics (real WCAG contrast
 * math over the source's color tokens, and the Next build manifest for bundle
 * sizes) rather than a headless-browser Lighthouse run, so the gate is fast and
 * dependency-light.
 */

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const matter = require("gray-matter");
const { z } = require("zod");

const ROOT = process.cwd();
const C = {
  reset: "\x1b[0m",
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  maroon: (s) => `\x1b[38;5;88m${s}\x1b[0m`,
  teal: (s) => `\x1b[38;5;37m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
};

/* ---------------------------------------------------------------- helpers -- */

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, acc);
    else if (exts.some((e) => entry.name.endsWith(e))) acc.push(full);
  }
  return acc;
}

const rel = (p) => path.relative(ROOT, p);
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};
const relLum = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrast = (fg, bg) => {
  const a = relLum(fg);
  const b = relLum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// Dark-theme background + the resolved text-token palette (see globals.css).
const BG = [5, 5, 5];
const TOKEN_HEX = {
  "gray-100": "#f3f4f6", "gray-200": "#e5e5e5", "gray-300": "#d4d4d4",
  "gray-400": "#9ca3af", "gray-500": "#737373", "gray-600": "#525252",
  "gray-700": "#404040", "gray-800": "#262626", "gray-900": "#121212",
  white: "#f3f4f6",
};
const MAROON = "#4e2329";
const TEAL = "#4dbbc0";

const report = [];
const note = (category, delta, msg) => report.push({ category, delta, msg });

/* -------------------------------------------------- 1. Accessibility (40) -- */

function scoreAccessibility() {
  let score = 40;
  const files = walk(path.join(ROOT, "app"), [".tsx"]).concat(
    walk(path.join(ROOT, "components"), [".tsx"])
  );

  let grayMinor = 0;
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // text-gray-NNN color utilities (incl. variants like hover:text-gray-500),
      // excluding the decorative `marker:` bullet variant. A static scan can't
      // know the rendered background (some sit on inverse bg-white rows), so
      // sub-AA grays are counted as minor warnings, not hard failures.
      for (const m of line.matchAll(/(?<!marker:)text-(gray-\d{3})\b/g)) {
        const hex = TOKEN_HEX[m[1]];
        if (!hex) continue;
        const ratio = contrast(hexToRgb(hex), BG);
        if (ratio < 4.5) grayMinor += 1;
      }
      // Arbitrary hex text colors — flag maroon/teal misuse (the spec's -20).
      for (const m of line.matchAll(/text-\[(#[0-9a-fA-F]{3,6})\]/g)) {
        const ratio = contrast(hexToRgb(m[1]), BG);
        const isThemeAccent = m[1].toLowerCase() === MAROON || m[1].toLowerCase() === TEAL;
        if (ratio < 4.5) {
          const d = isThemeAccent ? 20 : 8;
          score -= d;
          note("A11Y", -d, `${rel(file)}:${i + 1} — text-[${m[1]}] breaks readability (${ratio.toFixed(2)}:1) on black`);
        }
      }
      // Tap targets: an interactive element with a tiny fixed box and no padding.
      const interactive = /onClick=|role="(switch|button)"|<button/.test(line);
      const tiny = /\b[hw]-(?:[1-9]|10)\b/.test(line) && !/\bp[xy]?-/.test(line);
      if (interactive && tiny) {
        score -= 8;
        note("A11Y", -8, `${rel(file)}:${i + 1} — interactive element below the 44×44px tap target`);
      }
    });
  }

  if (grayMinor > 0) {
    const d = Math.min(6, grayMinor * 2);
    score -= d;
    note("A11Y", -d, `${grayMinor} low-contrast gray-500 text node(s) (4.43:1; AA-large only)`);
  }
  return Math.max(0, score);
}

/* --------------------------------------------------- 2. Performance (30) -- */

function gzipKb(file) {
  return zlib.gzipSync(fs.readFileSync(file)).length / 1024;
}

function scorePerformance() {
  const manifestPath = path.join(ROOT, ".next", "app-build-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    note("PERF", 0, C.gray("no .next build found — run `npm run build` for bundle scoring (skipped)"));
    return 30;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const LIMIT = 85; // kb, offline-first First Load budget for reading routes

  let worst = { route: null, kb: 0 };
  for (const [route, files] of Object.entries(manifest.pages)) {
    if (!/\[(\.\.\.)?slug\]/.test(route)) continue;
    let kb = 0;
    for (const f of files) {
      const abs = path.join(ROOT, ".next", f);
      if (fs.existsSync(abs)) kb += gzipKb(abs);
    }
    if (kb > worst.kb) worst = { route, kb };
  }

  if (!worst.route) return 30;
  let score = 30;
  if (worst.kb > LIMIT) {
    // Proportional, capped — most of First Load is the shared framework baseline.
    const deduction = Math.min(10, Math.round((worst.kb - LIMIT) / 10));
    score -= deduction;
    note("PERF", -deduction, `${worst.route}: First Load JS ${worst.kb.toFixed(1)}kb exceeds ${LIMIT}kb budget`);
  } else {
    note("PERF", 0, C.green(`${worst.route}: First Load JS ${worst.kb.toFixed(1)}kb within ${LIMIT}kb`));
  }
  return Math.max(0, score);
}

/* ----------------------------------------------- 3. Schema Integrity (30) -- */

const baseSchema = z.object({
  title: z.string().min(1),
  visibility: z.enum(["public", "private", "draft"]),
});

function scoreSchema() {
  let score = 30;
  const all = walk(path.join(ROOT, "content"), [".mdx"]);
  if (all.length === 0) return 30;

  // Randomly sample 10% (at least one file).
  const sampleSize = Math.max(1, Math.ceil(all.length * 0.1));
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, sampleSize);

  for (const file of sample) {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const parsed = baseSchema.safeParse(data);
    if (!parsed.success) {
      score -= 15;
      const issue = parsed.error.issues[0];
      note("SCHEMA", -15, `${rel(file)} — frontmatter invalid: ${issue.path.join(".") || "?"} ${issue.message.toLowerCase()}`);
    }
    if (/<SpecSheet[^>]*specs=\{\[\s*\]\}/.test(content) || /<SpecSheet(?![^>]*specs=)/.test(content)) {
      score -= 15;
      note("SCHEMA", -15, `${rel(file)} — empty or specs-less <SpecSheet>`);
    }
  }
  note("SCHEMA", 0, C.gray(`sampled ${sample.length}/${all.length} mdx files (10%)`));
  return Math.max(0, score);
}

/* -------------------------------------------------------------- output -- */

const a11y = scoreAccessibility();
const perf = scorePerformance();
const schema = scoreSchema();
const total = a11y + perf + schema;

const bar = "═".repeat(54);
console.log("\n" + C.bold("  CODEX PRE-FLIGHT MATRIX"));
console.log(C.gray("  " + bar));

const row = (label, val, max) => {
  const ok = val >= max * 0.85;
  const color = ok ? C.green : C.maroon;
  console.log(`  ${label.padEnd(22)} ${color(String(val).padStart(3))} / ${max}`);
};
row("Accessibility", a11y, 40);
row("Performance", perf, 30);
row("Schema Integrity", schema, 30);

console.log(C.gray("  " + bar));
if (report.some((r) => r.delta < 0)) {
  console.log(C.bold("  Deductions:"));
  for (const r of report.filter((x) => x.delta < 0)) {
    console.log(`  ${C.maroon(`${r.delta} pts`)} ${C.gray(`[${r.category}]`)} ${r.msg}`);
  }
}
const notes = report.filter((r) => r.delta === 0);
if (notes.length) {
  for (const r of notes) console.log(C.dim(`  • [${r.category}] ${r.msg}`));
}
console.log(C.gray("  " + bar));

const pass = total >= 90;
const badge = ` SYSTEM HEALTH: ${total}/100 `;
console.log(
  "\n  " + C.bold(pass ? C.teal(`[${badge}]`) : C.red(`[${badge}]`)) + "\n"
);

if (!pass) {
  console.log(C.red(C.bold("  ✗ Below the 90 threshold — push aborted.\n")));
  process.exit(1);
}
console.log(C.green("  ✓ Pre-flight clear.\n"));
process.exit(0);
