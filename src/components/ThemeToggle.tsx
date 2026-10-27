"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains("dark");

export default function ThemeToggle() {
  const t = useTranslations("nav");
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode: the toggle still works for this page */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("darkMode")}
      aria-pressed={dark}
      className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg hover:bg-muted sm:h-9 sm:w-9"
    >
      {dark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}
