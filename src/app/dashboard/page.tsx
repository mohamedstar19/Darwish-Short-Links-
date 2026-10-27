import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requestBaseUrl } from "@/lib/request-origin";
import { toLinkRow } from "@/lib/serialize";
import ShortenForm from "@/components/ShortenForm";
import LinksList from "@/components/LinksList";
import CountUp from "@/components/CountUp";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  // A link pasted on the home page before signing up
  const { url: pending } = await searchParams;
  const initialUrl = typeof pending === "string" ? pending.slice(0, 2048) : "";
  const t = await getTranslations("dashboard");

  const [links, baseUrl] = await Promise.all([
    prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    requestBaseUrl(),
  ]);
  const totalClicks = links.reduce((s, l) => s + l.clickCount, 0);
  const numberLocale = (await getTranslations("site"))("numberLocale");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t("greeting", { name: user.name })}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <dl className="flex gap-3">
          <div className="min-w-20 rounded-xl border border-border bg-card/95 px-4 py-2 text-center">
            <dt className="text-xs text-muted-foreground">{t("totalLinks")}</dt>
            <dd className="text-xl font-extrabold">
              <CountUp value={links.length} locale={numberLocale} />
            </dd>
          </div>
          <div className="min-w-20 rounded-xl border border-border bg-card/95 px-4 py-2 text-center">
            <dt className="text-xs text-muted-foreground">{t("totalClicks")}</dt>
            <dd className="text-xl font-extrabold">
              <CountUp value={totalClicks} locale={numberLocale} />
            </dd>
          </div>
        </dl>
      </div>
      <div className="animate-rise" style={{ "--i": 1 } as React.CSSProperties}>
        <ShortenForm baseUrl={baseUrl} initialUrl={initialUrl} />
      </div>
      <LinksList items={links.map(toLinkRow)} baseUrl={baseUrl} />
    </div>
  );
}
