import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { apiError, isSameOrigin } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return apiError("BAD_ORIGIN", 403);
  await destroySession();
  return NextResponse.json({ ok: true });
}
