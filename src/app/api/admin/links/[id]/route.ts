import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { apiError, handleApiError, isSameOrigin, readJson } from "@/lib/api";

const schema = z.object({
  isBlocked: z.boolean(),
  blockedReason: z.string().trim().max(200).optional(),
});

/** Block or unblock any link (e.g. spam or phishing). Owners can't undo a block. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    await requireAdmin();
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return apiError("INVALID_INPUT", 400);
    const { isBlocked, blockedReason } = parsed.data;

    const { count } = await prisma.link.updateMany({
      where: { id: (await params).id },
      data: { isBlocked, blockedReason: isBlocked ? blockedReason || null : null },
    });
    if (!count) return apiError("NOT_FOUND", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
