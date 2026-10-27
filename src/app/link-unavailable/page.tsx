import Link from "next/link";
import { getTranslations } from "next-intl/server";

const REASONS = ["missing", "paused", "expired", "blocked"] as const;

export async function generateMetadata() {
  const t = await getTranslations("unavailable");
  return { title: t("title"), robots: { index: false } };
}

/** Where a short link lands when it doesn't exist, is paused, expired, or blocked */
export default async function LinkUnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const t = await getTranslations("unavailable");
  const { reason } = await searchParams;
  const key = REASONS.find((r) => r === reason) ?? "missing";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <span className="text-5xl" aria-hidden>
        {key === "blocked" ? "⛔" : "🔗"}
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-primary dark:text-primary-light">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t(`reason.${key}`)}</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary-dark"
      >
        {t("home")}
      </Link>
    </div>
  );
}
