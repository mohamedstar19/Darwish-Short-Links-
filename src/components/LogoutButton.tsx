"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("logout")}
      onClick={() =>
        start(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        })
      }
      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 sm:min-h-9"
    >
      <LogOut size={18} className="rtl:-scale-x-100" aria-hidden />
      <span className="hidden sm:inline">{t("logout")}</span>
    </button>
  );
}
