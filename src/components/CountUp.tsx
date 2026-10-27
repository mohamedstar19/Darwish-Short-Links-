"use client";

import { useEffect, useRef } from "react";

/**
 * A number that counts up from 0 when it first appears. The server renders the
 * final value (no layout shift, works without JS); reduced motion skips the count.
 */
export default function CountUp({
  value,
  locale,
  durationMs = 700,
}: {
  value: number;
  locale: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fmt = new Intl.NumberFormat(locale);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out: fast start, gentle landing
      el.textContent = fmt.format(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = fmt.format(value);
    };
  }, [value, locale, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat(locale).format(value)}
    </span>
  );
}
