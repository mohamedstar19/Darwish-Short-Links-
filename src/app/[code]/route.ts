import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { linkState, normalizeCode } from "@/lib/links";
import { isBot } from "@/lib/analytics";
import { recordClick } from "@/lib/link-service";
import { appHost, appUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * The short link itself: /{code} → destination with a 302, so pausing,
 * expiring or editing a link takes effect immediately. The click is saved
 * after the response is sent.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const origin = appUrl(req.nextUrl.origin);
  const code = normalizeCode((await params).code);
  if (!code) {
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  const link = await prisma.link.findUnique({
    where: { code },
    select: { id: true, url: true, isActive: true, isBlocked: true, expiresAt: true },
  });
  const state = link ? linkState(link) : "missing";
  if (!link || state !== "active") {
    return NextResponse.redirect(new URL(`/link-unavailable?reason=${state}`, origin), {
      status: 302,
      headers: NO_STORE,
    });
  }

  if (req.method === "GET" && !isBot(req.headers.get("user-agent"))) {
    const headers = new Headers(req.headers);
    const host = appHost(req.nextUrl.origin);
    after(() => recordClick(link.id, headers, host));
  }

  return NextResponse.redirect(link.url, { status: 302, headers: NO_STORE });
}
