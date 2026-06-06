import fs from "node:fs";
import path from "node:path";

/**
 * Seed the isolated test content root with a known fixture so the search flow
 * has something deterministic to find. Writes ONLY into `_test-content`.
 */
export default function globalSetup() {
  const root = path.join(process.cwd(), "_test-content");
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(path.join(process.cwd(), "_test-inbox"), {
    recursive: true,
    force: true,
  });

  const archive = path.join(root, "archive");
  fs.mkdirSync(archive, { recursive: true });
  fs.writeFileSync(
    path.join(archive, "recall-test.mdx"),
    `---
title: "Recall Test"
year: 2026
tier: "portfolio"
visibility: "public"
tech_stack: ["TypeScript"]
---

A fixture entry describing a bioluminescent reactor for full-text recall.
`,
    "utf8"
  );
}
