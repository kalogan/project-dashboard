import { NextResponse } from "next/server";

/**
 * Vault guardrail.
 *
 * The editor, bulk-upload staging, and CMS telemetry expose filesystem writes
 * and API-key-backed routes. They are strictly local tools, so on the deployed
 * (production) build any request to them is hard-404'd — the interface is
 * entirely inaccessible from the open web.
 */
export function middleware() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/editor/:path*", "/editor", "/api/inbox/:path*", "/api/telemetry"],
};
