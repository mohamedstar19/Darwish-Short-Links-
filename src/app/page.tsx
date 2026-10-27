import Link from "next/link";
import { ChartColumn, Link2, QrCode, SlidersHorizontal } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requestBaseUrl } from "@/lib/request-origin";
import ShortenForm from "@/components/ShortenForm";

const FEATURES = ["short", "qr", "stats", "control"] as const;
const ICONS = { short: Link2, qr: QrCode, stats: ChartColumn, control: SlidersHorizontal };

export default async function HomePage() {
  const t = await getTranslations("home");
  const user = await getCurrentUser();
  const baseUrl = await requestBaseUrl();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold leading-tight [text-wrap:balance] text-primary sm:text-5xl dark:text-primary-light">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {/* Visitors can paste a link right away; it's kept through sign-up */}
        <ShortenForm baseUrl={baseUrl} guest={!user} />
        {!user && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-bold text-primary hover:underline dark:text-primary-light">
              {t("ctaLogin")}
            </Link>
          </p>
        )}
      </div>

      <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = ICONS[f];
          return (
            <li key={f} className="rounded-2xl border border-border bg-card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-primary-light/15 dark:text-primary-light">
                <Icon size={22} aria-hidden />
              </span>
              <h2 className="mt-3 font-bold">{t(`features.${f}.title`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`features.${f}.body`)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
