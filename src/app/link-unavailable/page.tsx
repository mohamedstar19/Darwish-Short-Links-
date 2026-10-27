import Link from "next/link";
import { ShieldBan, Unlink } from "lucide-react";
import { buttonClass } from "@/components/ui";
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
      <span
        className={`animate-pop grid h-16 w-16 place-items-center rounded-2xl ${
          key === "blocked" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary dark:bg-primary-light/15 dark:text-primary-light"
        }`}
      >
        {key === "blocked" ? <ShieldBan size={32} aria-hidden /> : <Unlink size={32} aria-hidden />}
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-primary dark:text-primary-light">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t(`reason.${key}`)}</p>
      <Link
        href="/"
        className={`${buttonClass()} mt-8`}
      >
        {t("home")}
      </Link>
    </div>
  );
}
