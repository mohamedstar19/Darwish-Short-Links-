import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { linkState } from "@/lib/links";
import { platformTotals } from "@/lib/link-service";
import { STATE_STYLES } from "@/lib/link-ui";
import { requestBaseUrl } from "@/lib/request-origin";
import { BlockLinkButton, BlockUserButton } from "@/components/AdminActions";
import { fieldClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false } };
}

/** Moderation: search every link and user, block abuse */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") notFound();

  const { tab: tabParam, q: qParam } = await searchParams;
  const tab = tabParam === "users" ? "users" : "links";
  const q = (qParam ?? "").trim().slice(0, 200);
  const [t, tl, locale, baseUrl] = await Promise.all([
    getTranslations("admin"),
    getTranslations("links"),
    getLocale(),
    requestBaseUrl(),
  ]);
  const tag = locale === "ar" ? "ar-EG" : "en";
  const num = (n: number) => new Intl.NumberFormat(tag).format(n);
  const date = (d: Date) => new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(d);
  const contains = { contains: q, mode: "insensitive" as const };

  const { userCount, linkCount, clicks24h } = await platformTotals();

  const links =
    tab === "links"
      ? await prisma.link.findMany({
          where: q
            ? { OR: [{ code: contains }, { url: contains }, { title: contains }, { user: { email: contains } }] }
            : {},
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { user: { select: { email: true } } },
        })
      : [];
  const users =
    tab === "users"
      ? await prisma.user.findMany({
          where: q ? { OR: [{ email: contains }, { name: contains }] } : {},
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { _count: { select: { links: true } } },
        })
      : [];

  const tabClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-bold sm:min-h-9 ${active ? "bg-primary text-primary-foreground" : "border border-input hover:bg-muted"}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>

      <dl className="grid grid-cols-3 gap-3">
        {[
          [t("users"), userCount],
          [t("links"), linkCount],
          [t("clicks24h"), clicks24h],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4">
            <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums">{num(Number(value))}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin?tab=links" aria-current={tab === "links" ? "page" : undefined} className={tabClass(tab === "links")}>
          {t("links")}
        </Link>
        <Link href="/admin?tab=users" aria-current={tab === "users" ? "page" : undefined} className={tabClass(tab === "users")}>
          {t("users")}
        </Link>
        <form className="ms-auto flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="tab" value={tab} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t(tab === "links" ? "searchLinks" : "searchUsers")}
            aria-label={t(tab === "links" ? "searchLinks" : "searchUsers")}
            className={`${fieldClass} min-w-0 flex-1 text-sm sm:w-72`}
          />
        </form>
      </div>

      {tab === "links" && (
        <ul className="flex flex-col gap-3">
          {links.length === 0 && <p className="text-muted-foreground">{t("nothing")}</p>}
          {links.map((l) => {
            const state = linkState(l);
            return (
              <li key={l.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/links/${l.id}`}
                    dir="ltr"
                    className="block truncate text-start font-bold text-primary hover:underline dark:text-primary-light"
                  >
                    {`${baseUrl}/${l.code}`.replace(/^https?:\/\//, "")}
                  </Link>
                  <p dir="ltr" className="truncate text-start text-sm text-muted-foreground" title={l.url}>
                    <span aria-hidden>→ </span>{l.url}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className={`rounded-full px-2 py-0.5 font-bold ${STATE_STYLES[state]}`}>{tl(`state.${state}`)}</span>
                    <span dir="ltr">{l.user.email}</span>
                    <span>{date(l.createdAt)}</span>
                    <span>{tl("clicksN", { n: num(l.clickCount) })}</span>
                  </p>
                </div>
                <BlockLinkButton id={l.id} blocked={l.isBlocked} />
              </li>
            );
          })}
        </ul>
      )}

      {tab === "users" && (
        <ul className="flex flex-col gap-3">
          {users.length === 0 && <p className="text-muted-foreground">{t("nothing")}</p>}
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {u.name}{" "}
                  {u.role === "ADMIN" && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs">{t("adminBadge")}</span>
                  )}
                  {u.isBlocked && (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">{t("blockedBadge")}</span>
                  )}
                </p>
                <p dir="ltr" className="truncate text-start text-sm text-muted-foreground">
                  {u.email}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{t("joined", { date: date(u.createdAt) })}</span>
                  <span>{tl("linksN", { n: num(u._count.links) })}</span>
                </p>
              </div>
              {u.id !== user.id && <BlockUserButton id={u.id} blocked={u.isBlocked} name={u.name} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
