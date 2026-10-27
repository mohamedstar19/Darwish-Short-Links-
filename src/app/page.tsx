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
      <div className="relative mx-auto max-w-2xl text-center">
        {/* Calm zone: keeps the animated background from running behind the headline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -inset-y-10 -z-[1] sm:-inset-x-10 bg-[radial-gradient(closest-side,var(--background)_70%,transparent)]"
        />
        <h1 className="animate-rise text-3xl font-extrabold leading-tight [text-wrap:balance] text-primary sm:text-5xl dark:text-primary-light">
          <span className="text-sheen">{t("title")}</span>
        </h1>
        <p
          className="animate-rise mt-4 text-lg text-muted-foreground"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {t("subtitle")}
        </p>
      </div>

      <div className="animate-rise mx-auto mt-10 max-w-3xl" style={{ "--i": 2 } as React.CSSProperties}>
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
        {FEATURES.map((f, i) => {
          const Icon = ICONS[f];
          return (
            <li
              key={f}
              className="group animate-rise rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-md"
              style={{ "--i": i + 3 } as React.CSSProperties}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 text-primary dark:bg-primary-light/15 dark:text-primary-light">
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
