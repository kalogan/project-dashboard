import { statfs } from "node:fs/promises";
import { getRateWindow } from "@/lib/rateLimit";
import { readStatus } from "@/lib/inbox";

/**
 * Local CMS telemetry: disk headroom, Gemini RPM window, and media-compression
 * progress. Polled by the editor's status bar. Always dynamic (live values).
 */
export const dynamic = "force-dynamic";

const CRITICAL_DISK_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB staging floor.

function humanBytes(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(0)} GB Available`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB Available`;
}

export async function GET() {
  let disk = { human: "Unknown", availableBytes: 0, critical: false };
  try {
    const fsStat = await statfs(process.cwd());
    const availableBytes = fsStat.bavail * fsStat.bsize;
    disk = {
      human: humanBytes(availableBytes),
      availableBytes,
      critical: availableBytes < CRITICAL_DISK_BYTES,
    };
  } catch {
    // statfs unsupported on this platform — leave disk as Unknown.
  }

  return Response.json({
    disk,
    api: getRateWindow(),
    media: readStatus(),
  });
}
