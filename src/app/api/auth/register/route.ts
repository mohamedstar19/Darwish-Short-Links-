import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { registerSchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { apiError, handleApiError, isSameOrigin, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    if (!rateLimit(`register:${clientIp(req.headers)}`, 5, 3600)) {
      return apiError("RATE_LIMITED", 429);
    }
    const parsed = registerSchema.safeParse(await readJson(req));
    if (!parsed.success) return apiError("INVALID_INPUT", 400);
    const { name, email, password } = parsed.data;

    try {
      const user = await prisma.user.create({
        data: { name, email, passwordHash: await hashPassword(password) },
        select: { id: true },
      });
      await createSession(user.id);
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return apiError("EMAIL_TAKEN", 409);
      }
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
