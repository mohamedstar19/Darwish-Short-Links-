import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { apiError, handleApiError, isSameOrigin, readJson } from "@/lib/api";
import { createLinkSchema } from "@/lib/links";
import { createLink, LinkError } from "@/lib/link-service";
import { checkSafeBrowsing, checkUrlLocally } from "@/lib/url-safety";
import { rateLimit } from "@/lib/rate-limit";
import { appHost } from "@/lib/env";

/** The signed-in user's links, newest first */
export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    const user = await requireUser();
    if (!rateLimit(`create:h:${user.id}`, 30, 3600) || !rateLimit(`create:d:${user.id}`, 200, 86400)) {
      return apiError("RATE_LIMITED", 429);
    }

    const parsed = createLinkSchema.safeParse(await readJson(req));
    if (!parsed.success) return apiError("INVALID_INPUT", 400);
    const { url, code, title, expiresAt } = parsed.data;

    const problem =
      checkUrlLocally(url, appHost(req.nextUrl.origin)) ?? (await checkSafeBrowsing(url));
    if (problem) return apiError(problem, 400);

    try {
      const item = await createLink({ userId: user.id, url, code, title, expiresAt });
      return NextResponse.json({ item }, { status: 201 });
    } catch (e) {
      if (e instanceof LinkError) return apiError(e.message, 409);
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
