import path from "node:path";

/**
 * Filesystem roots for content + the triage inbox.
 *
 * Both are overridable via env vars so the E2E suite can redirect all reads and
 * writes into throwaway temp directories (`_test-content`, `_test-inbox`),
 * never touching the real codex data.
 */
const cwd = process.cwd();

export const CONTENT_ROOT =
  process.env.CODEX_CONTENT_DIR ?? path.join(cwd, "content");

export const INBOX_DIR =
  process.env.CODEX_INBOX_DIR ?? path.join(cwd, "_inbox");
