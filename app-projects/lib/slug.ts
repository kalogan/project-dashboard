/**
 * Pure slug helpers — no Node/filesystem imports, so this module is safe to
 * import from Client Components (unlike `lib/mdx`, which touches `node:fs`).
 */

/**
 * Normalize a frontmatter tag into a URL slug. Any run of non-alphanumeric
 * characters collapses to a single hyphen, so "UI/UX Design" → "ui-ux-design".
 */
export function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
