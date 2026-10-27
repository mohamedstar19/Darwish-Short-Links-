import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/auth/schemas";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { apiError, handleApiError, isSameOrigin, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
    const parsed = loginSchema.safeParse(await readJson(req));
    if (!parsed.success) return apiError("INVALID_INPUT", 400);
    const { email, password } = parsed.data;

    const ip = clientIp(req.headers);
    if (!rateLimit(`login:${ip}`, 20, 900) || !rateLimit(`login:${email}`, 10, 900)) {
      return apiError("RATE_LIMITED", 429);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, isBlocked: true },
    });
    if (!user) {
      await burnPasswordCheck(password);
      return apiError("INVALID_CREDENTIALS", 401);
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return apiError("INVALID_CREDENTIALS", 401);
    }
    if (user.isBlocked) return apiError("ACCOUNT_BLOCKED", 403);

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
