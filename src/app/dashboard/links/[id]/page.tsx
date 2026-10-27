import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { linkStats } from "@/lib/link-service";
import { linkState } from "@/lib/links";
import { requestBaseUrl } from "@/lib/request-origin";
import CopyButton from "@/components/CopyButton";
import QrCode from "@/components/QrCode";
import DailyChart from "@/components/DailyChart";
import Breakdown from "@/components/Breakdown";
import { STATE_STYLES } from "@/lib/link-ui";

export async function generateMetadata() {
  const t = await getTranslations("stats");
  return { title: t("title") };
}

export default async function LinkStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/dashboard/links/${id}`);

  // Owners see their own links; admins can open any link from the admin page
  const link = await prisma.link.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, userId: user.id },
  });
  if (!link) notFound();

  const [t, tl, locale, stats, baseUrl] = await Promise.all([
    getTranslations("stats"),
    getTranslations("links"),
    getLocale(),
    linkStats(link.id),
    requestBaseUrl(),
  ]);
  const tag = locale === "ar" ? "ar-EG" : "en";
  const num = (n: number) => new Intl.NumberFormat(tag).format(n);
  const pct = (r: number) => new Intl.NumberFormat(tag, { style: "percent" }).format(r);
  const date = (d: Date) =>
    new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" }).format(d);
  const countries = new Intl.DisplayNames([tag], { type: "region" });
  const short = `${baseUrl}/${link.code}`;
  const state = linkState(link);

  const label = (v: string | null, fallback: string) => v ?? fallback;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-bold text-primary hover:underline sm:min-h-9 dark:text-primary-light"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden />
        {t("back")}
      </Link>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-xl font-extrabold [overflow-wrap:anywhere]">
            {link.title ?? <span dir="ltr">/{link.code}</span>}
          </h1>
          <a
            href={short}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="block break-all text-start text-lg font-bold text-primary hover:underline dark:text-primary-light"
          >
            {short.replace(/^https?:\/\//, "")}
          </a>
          <p dir="ltr" className="mt-1 break-all text-start text-sm text-muted-foreground">
            <span aria-hidden>→ </span>
            {link.url}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATE_STYLES[state]}`}>
              {tl(`state.${state}`)}
            </span>
            <CopyButton text={short} />
          </div>
          {link.isBlocked && link.blockedReason && (
            <p className="mt-2 text-sm text-danger">
              {link.blockedReason === "USER_BLOCKED"
                ? t("userBlocked")
                : t("blockedReason", { reason: link.blockedReason })}
            </p>
          )}
        </div>
        <QrCode url={short} name={link.code} />
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <dt className="text-sm text-muted-foreground">{t("allTime")}</dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">{num(link.clickCount)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <dt className="text-sm text-muted-foreground">{t("lastNDays", { n: num(stats.days) })}</dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums">{num(stats.total)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <dt className="text-sm text-muted-foreground">{t("lastClick")}</dt>
          <dd className="mt-2 font-bold">{link.lastClickedAt ? date(link.lastClickedAt) : "—"}</dd>
        </div>
      </dl>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-bold">{t("daily", { n: num(stats.days) })}</h2>
        <DailyChart daily={stats.daily} />
      </section>

      {/* Breakdowns only mean something once there are clicks */}
      {stats.total > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Breakdown
            title={t("referrers")}
            total={stats.total}
            empty={t("none")}
            format={num}
            percent={pct}
            rows={stats.referrers.map((r) => ({
              label: label(r.name, t("direct")),
              count: r.count,
              dir: r.name ? "ltr" : undefined,
            }))}
          />
          <Breakdown
            title={t("countries")}
            total={stats.total}
            empty={t("none")}
            format={num}
            percent={pct}
            rows={stats.countries.map((r) => ({
              label: r.name ? (countries.of(r.name) ?? r.name) : t("unknown"),
              count: r.count,
            }))}
          />
          <Breakdown
            title={t("devices")}
            total={stats.total}
            empty={t("none")}
            format={num}
            percent={pct}
            rows={stats.devices.map((r) => ({
              label: t(`device.${r.name as "mobile" | "tablet" | "desktop"}`),
              count: r.count,
            }))}
          />
          <Breakdown
            title={t("browsers")}
            total={stats.total}
            empty={t("none")}
            format={num}
            percent={pct}
            rows={stats.browsers.map((r) => ({ label: label(r.name, t("unknown")), count: r.count }))}
          />
          <Breakdown
            title={t("os")}
            total={stats.total}
            empty={t("none")}
            format={num}
            percent={pct}
            rows={stats.os.map((r) => ({ label: label(r.name, t("unknown")), count: r.count }))}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("privacyNote")}</p>
    </div>
  );
}
