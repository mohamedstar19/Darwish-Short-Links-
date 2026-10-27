import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";

export function apiError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Maps auth errors to their status; anything else is a logged 500 */
export function handleApiError(e: unknown): NextResponse {
  if (e instanceof AuthError) return apiError(e.message, e.status);
  console.error("API error:", e);
  return apiError("SERVER_ERROR", 500);
}

/**
 * Cookie sessions + JSON bodies: reject cross-site mutations whose Origin
 * doesn't match this host (defence in depth on top of SameSite=Lax).
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers / server tools
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(req: NextRequest): Promise<unknown> {
  return req.json().catch(() => null);
}
