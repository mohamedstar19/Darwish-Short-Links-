import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Link2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { buttonClass } from "@/components/ui";
import LocaleToggle from "./LocaleToggle";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";

export default async function Header() {
  const t = await getTranslations("nav");
  const ts = await getTranslations("site");
  const user = await getCurrentUser();

  const nav = user
    ? [
        { href: "/dashboard", label: t("dashboard") },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: t("admin") }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2 sm:gap-2">
        <Link
          href="/"
          aria-label={ts("name")}
          className="me-auto flex min-h-11 items-center gap-2 font-extrabold text-primary dark:text-primary-light"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Link2 size={20} aria-hidden />
          </span>
          <span className="hidden sm:inline">{ts("name")}</span>
        </Link>
        {nav.length > 0 && <NavLinks items={nav} />}
        <LocaleToggle />
        <ThemeToggle />
        {user ? (
          <LogoutButton />
        ) : (
          <Link href="/login" className={`${buttonClass("primary", "sm")} ms-1`}>
            {t("login")}
          </Link>
        )}
      </div>
    </header>
  );
}
