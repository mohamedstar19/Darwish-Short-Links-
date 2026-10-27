"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "./LinksList";

/**
 * Clicks per day as one-hue bars. Hover or focus a bar for its exact value;
 * the same numbers are available as a table below for screen readers.
 * Bars follow the reading direction, so in Arabic the newest day is on the left.
 */
export default function DailyChart({ daily }: { daily: { day: string; count: number }[] }) {
  const t = useTranslations("stats");
  const { num } = useFormatters();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.count));
  const dayLabel = (day: string) => {
    const [, m, d] = day.split("-");
    return `${Number(d)}/${Number(m)}`;
  };
  const shown = active === null ? null : daily[active];
  const total = daily.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
        {t("noClicksYet")}
      </p>
    );
  }

  return (
    <figure>
      <div className="mb-2 flex h-6 items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("max", { n: num(max) })}</span>
        {shown && (
          <span className="font-bold tabular-nums" aria-live="polite">
            {dayLabel(shown.day)} · {t("clicksN", { n: num(shown.count) })}
          </span>
        )}
      </div>
      <div
        className="flex h-40 items-end gap-[2px] border-b border-border"
        onMouseLeave={() => setActive(null)}
      >
        {daily.map((d, i) => (
          <button
            key={d.day}
            type="button"
            aria-label={`${d.day}: ${t("clicksN", { n: num(d.count) })}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="group flex h-full min-w-0 flex-1 items-end focus-visible:outline-none"
          >
            <span
              className={`animate-grow-y block w-full rounded-t-[4px] transition-opacity ${
                d.count ? "bg-primary dark:bg-primary-light" : ""
              } ${active === i ? "opacity-100" : active === null ? "opacity-90" : "opacity-50"} group-focus-visible:ring-2 group-focus-visible:ring-gold`}
              style={
                {
                  height: d.count ? `${Math.max(3, (d.count / max) * 100)}%` : 0,
                  "--i": i,
                } as React.CSSProperties
              }
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{dayLabel(daily[0].day)}</span>
        <span>{dayLabel(daily[daily.length - 1].day)}</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-bold text-muted-foreground">{t("asTable")}</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 text-start font-semibold">{t("day")}</th>
              <th className="py-1 text-end font-semibold">{t("clicks")}</th>
            </tr>
          </thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr key={d.day} className="border-t border-border">
                <td className="py-1 tabular-nums" dir="ltr" style={{ textAlign: "start" }}>
                  {d.day}
                </td>
                <td className="py-1 text-end tabular-nums">{num(d.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
