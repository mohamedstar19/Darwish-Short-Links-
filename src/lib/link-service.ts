import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isReserved, randomCode } from "@/lib/links";
import { countryFrom, parseUserAgent, referrerHost } from "@/lib/analytics";

export class LinkError extends Error {}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * Creates a link with the requested code, or a random one. Random codes retry
 * on the (rare) collision instead of checking first, so two requests can't race.
 */
export async function createLink(data: {
  userId: string;
  url: string;
  code?: string;
  title?: string | null;
  expiresAt?: Date | null;
}) {
  const { code, ...rest } = data;
  if (code) {
    if (isReserved(code)) throw new LinkError("CODE_RESERVED");
    try {
      return await prisma.link.create({ data: { ...rest, code } });
    } catch (e) {
      if (isUniqueViolation(e)) throw new LinkError("CODE_TAKEN");
      throw e;
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const generated = randomCode();
    if (isReserved(generated)) continue;
    try {
      return await prisma.link.create({ data: { ...rest, code: generated } });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw new Error("Could not generate a unique code");
}

/** Saves one click; never throws, so analytics can't break a redirect */
export async function recordClick(linkId: string, headers: Headers, ownHost: string) {
  try {
    const { device, browser, os } = parseUserAgent(headers.get("user-agent") ?? "");
    await prisma.$transaction([
      prisma.click.create({
        data: {
          linkId,
          device,
          browser,
          os,
          country: countryFrom(headers),
          referrer: referrerHost(headers.get("referer"), ownHost),
        },
      }),
      prisma.link.update({
        where: { id: linkId },
        data: { clickCount: { increment: 1 }, lastClickedAt: new Date() },
      }),
    ]);
  } catch (e) {
    console.error("recordClick failed:", e);
  }
}

export const STATS_TIMEZONE = "Africa/Cairo";

export type LinkStats = {
  days: number;
  total: number;
  daily: { day: string; count: number }[];
  referrers: { name: string | null; count: number }[];
  countries: { name: string | null; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string | null; count: number }[];
  os: { name: string | null; count: number }[];
};

function lastNDays(days: number): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: STATS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return Array.from({ length: days }, (_, i) =>
    fmt.format(new Date(Date.now() - (days - 1 - i) * 86400000)),
  );
}

/** Clicks for one link over the last N days, grouped for the stats page */
export async function linkStats(linkId: string, days = 30): Promise<LinkStats> {
  const since = new Date(Date.now() - days * 86400000);
  const where = { linkId, createdAt: { gte: since } };

  const top = async (field: "referrer" | "country" | "device" | "browser" | "os", take = 8) => {
    const rows = await prisma.click.groupBy({
      by: [field],
      where,
      _count: { _all: true },
      orderBy: { _count: { [field]: "desc" } },
      take,
    });
    return rows.map((r) => ({ name: r[field] as string | null, count: r._count._all }));
  };

  const [dailyRows, referrers, countries, devices, browsers, os] = await Promise.all([
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${STATS_TIMEZONE}, 'YYYY-MM-DD') AS day,
             COUNT(*) AS count
      FROM "Click"
      WHERE "linkId" = ${linkId} AND "createdAt" >= ${since}
      GROUP BY 1`,
    top("referrer"),
    top("country"),
    top("device", 3),
    top("browser", 6),
    top("os", 6),
  ]);

  const byDay = new Map(dailyRows.map((r) => [r.day, Number(r.count)]));
  const daily = lastNDays(days).map((day) => ({ day, count: byDay.get(day) ?? 0 }));

  return {
    days,
    total: daily.reduce((s, d) => s + d.count, 0),
    daily,
    referrers,
    countries,
    devices: devices.map((d) => ({ name: d.name ?? "desktop", count: d.count })),
    browsers,
    os,
  };
}

/** Headline numbers for the admin page */
export async function platformTotals() {
  const dayAgo = new Date(Date.now() - 86400000);
  const [userCount, linkCount, clicks24h] = await Promise.all([
    prisma.user.count(),
    prisma.link.count(),
    prisma.click.count({ where: { createdAt: { gte: dayAgo } } }),
  ]);
  return { userCount, linkCount, clicks24h };
}
