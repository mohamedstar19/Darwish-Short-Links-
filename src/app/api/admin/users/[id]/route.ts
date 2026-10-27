import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { apiError, handleApiError, isSameOrigin, readJson } from "@/lib/api";

const schema = z.object({ isBlocked: z.boolean() });

/** Block a user: they're signed out at once and all their links stop redirecting */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    const admin = await requireAdmin();
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return apiError("INVALID_INPUT", 400);

    const id = (await params).id;
    if (id === admin.id) return apiError("CANNOT_BLOCK_SELF", 400);
    const { isBlocked } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({ where: { id }, data: { isBlocked } });
      if (count) {
        await tx.link.updateMany({
          // Links an admin blocked on their own keep that block after an unblock
          where: { userId: id, ...(isBlocked ? { isBlocked: false } : { blockedReason: "USER_BLOCKED" }) },
          data: isBlocked
            ? { isBlocked: true, blockedReason: "USER_BLOCKED" }
            : { isBlocked: false, blockedReason: null },
        });
      }
      return count;
    });
    if (!updated) return apiError("NOT_FOUND", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
