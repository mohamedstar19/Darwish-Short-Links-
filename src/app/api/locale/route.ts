import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { apiError, readJson } from "@/lib/api";

/** Saves the UI language in a cookie (the URL has no locale prefix) */
export async function POST(req: NextRequest) {
  const body = (await readJson(req)) as { locale?: unknown } | null;
  if (!isLocale(body?.locale)) return apiError("INVALID_INPUT", 400);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
  });
  return res;
}
