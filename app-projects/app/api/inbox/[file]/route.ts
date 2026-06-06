import fs from "node:fs";
import { mimeFromExt, readMeta, resolveInboxPath } from "@/lib/inbox";

/**
 * Serves raw triage files from `_inbox` so the editor can render thumbnails.
 * `_inbox` lives outside `public`, so it is otherwise unreachable over HTTP.
 *
 * Dev-only: returns 404 in production (the inbox never exists there anyway),
 * and `resolveInboxPath` blocks path traversal.
 */
export const dynamic = "force-dynamic";

export function GET(
  _request: Request,
  { params }: { params: { file: string } }
) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  let filePath: string;
  try {
    filePath = resolveInboxPath(params.file);
  } catch {
    return new Response("Invalid path", { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const data = fs.readFileSync(filePath);
  const mime = readMeta()[params.file]?.mime ?? mimeFromExt(params.file);
  return new Response(data, {
    headers: { "Content-Type": mime, "Cache-Control": "no-store" },
  });
}
