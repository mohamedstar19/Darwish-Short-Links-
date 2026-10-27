"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      disabled={pending}
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
      className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold hover:bg-muted disabled:opacity-50"
      lang={next}
    >
      {next === "ar" ? "عربي" : "EN"}
    </button>
  );
}
