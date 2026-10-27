import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { apiError, handleApiError, isSameOrigin, readJson } from "@/lib/api";
import { updateLinkSchema } from "@/lib/links";
import { linkStats } from "@/lib/link-service";
import { checkSafeBrowsing, checkUrlLocally } from "@/lib/url-safety";
import { appHost } from "@/lib/env";

type Ctx = { params: Promise<{ id: string }> };

/** Only the owner sees or changes a link; others get 404 so ids can't be probed */
async function ownLink(id: string, userId: string) {
  return prisma.link.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const item = await ownLink((await params).id, user.id);
    if (!item) return apiError("NOT_FOUND", 404);
    return NextResponse.json({ item, stats: await linkStats(item.id) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    const user = await requireUser();
    const link = await ownLink((await params).id, user.id);
    if (!link) return apiError("NOT_FOUND", 404);

    const parsed = updateLinkSchema.safeParse(await readJson(req));
    if (!parsed.success) return apiError("INVALID_INPUT", 400);
    const data = parsed.data;

    if (data.url && data.url !== link.url) {
      const problem =
        checkUrlLocally(data.url, appHost(req.nextUrl.origin)) ?? (await checkSafeBrowsing(data.url));
      if (problem) return apiError(problem, 400);
    }

    const item = await prisma.link.update({ where: { id: link.id }, data });
    return NextResponse.json({ item });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    const user = await requireUser();
    const { count } = await prisma.link.deleteMany({
      where: { id: (await params).id, userId: user.id },
    });
    if (!count) return apiError("NOT_FOUND", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
