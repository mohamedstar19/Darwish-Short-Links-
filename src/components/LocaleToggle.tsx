"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const NAMES = { ar: "العربية", en: "English" } as const;

export default function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={NAMES[next]}
      lang={next}
      onClick={() =>
        start(async () => {
          await fetch("/api/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: next }),
          });
          router.refresh();
        })
      }
      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-input px-2.5 text-sm font-bold hover:bg-muted disabled:opacity-50 sm:min-h-9"
    >
      {next === "ar" ? "عربي" : "EN"}
    </button>
  );
}
