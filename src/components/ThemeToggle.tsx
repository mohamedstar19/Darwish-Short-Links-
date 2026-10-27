"use client";

import { useTranslations } from "next-intl";

export default function ThemeToggle() {
  const t = useTranslations("nav");
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* private mode: the toggle still works for this page */
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("theme")}
      className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"
    >
      <span className="dark:hidden" aria-hidden>🌙</span>
      <span className="hidden dark:inline" aria-hidden>☀️</span>
    </button>
  );
}
