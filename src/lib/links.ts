import { randomInt } from "node:crypto";
import { z } from "zod";

/**
 * Short-code rules. Codes live at the site root (`/{code}`), so app routes
 * are reserved, and codes are lowercase so "Ramadan" and "ramadan" can't be
 * two different links that look the same.
 */

// No look-alikes (0/o, 1/l/i) so codes are easy to read and type
export const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const GENERATED_LENGTH = 7;

export const CODE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

// Top-level app paths and words that would confuse people as a short link
export const RESERVED_CODES = new Set([
  "admin",
  "api",
  "app",
  "dashboard",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "settings",
  "account",
  "about",
  "help",
  "terms",
  "privacy",
  "link-unavailable",
  "static",
  "assets",
  "robots",
  "sitemap",
  "favicon",
  "www",
]);

export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export function isReserved(code: string) {
  return RESERVED_CODES.has(code);
}

export function randomCode(length = GENERATED_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export const MAX_URL_LENGTH = 2048;

const destination = z
  .string()
  .trim()
  .max(MAX_URL_LENGTH)
  .pipe(z.url({ protocol: /^https?$/, hostname: z.regexes.domain }));

const optionalTitle = z
  .string()
  .trim()
  .max(120)
  .transform((v) => v || null)
  .nullable()
  .optional();

const optionalExpiry = z.iso
  .datetime({ offset: true })
  .transform((v) => new Date(v))
  .refine((d) => d.getTime() > Date.now(), "EXPIRY_IN_PAST")
  .nullable()
  .optional();

export const createLinkSchema = z.object({
  url: destination,
  // Empty means "generate one"
  code: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().toLowerCase().regex(CODE_PATTERN).optional(),
  ),
  title: optionalTitle,
  expiresAt: optionalExpiry,
});

// The code is fixed once created: it may already be printed or shared
export const updateLinkSchema = z
  .object({
    url: destination.optional(),
    title: optionalTitle,
    isActive: z.boolean().optional(),
    expiresAt: optionalExpiry,
  })
  .strict();

export type LinkState = "active" | "paused" | "expired" | "blocked";

export function linkState(
  link: { isActive: boolean; isBlocked: boolean; expiresAt: Date | null },
  now = new Date(),
): LinkState {
  if (link.isBlocked) return "blocked";
  if (!link.isActive) return "paused";
  if (link.expiresAt && link.expiresAt <= now) return "expired";
  return "active";
}
