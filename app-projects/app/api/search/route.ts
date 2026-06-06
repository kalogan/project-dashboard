import { generateSearchIndex } from "@/lib/mdx";

/**
 * The full-text search index, served as a static JSON asset (lazily fetched by
 * the command palette and searched client-side with flexsearch).
 *
 * SECURITY — built from the visibility-gated readers, so on the production
 * build the body text of private/draft entries (and the entire Logbook) is
 * NEVER serialized here. In development it includes everything for full local
 * recall.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(generateSearchIndex());
}
