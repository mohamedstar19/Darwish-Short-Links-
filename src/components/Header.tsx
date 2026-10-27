import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import LocaleToggle from "./LocaleToggle";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const t = await getTranslations("nav");
  const ts = await getTranslations("site");
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link href="/" className="me-auto flex items-center gap-2 font-extrabold text-primary dark:text-primary-light">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden>
            🔗
          </span>
          <span className="hidden sm:inline">{ts("name")}</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-1 text-sm font-bold">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-muted">
              {t("dashboard")}
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-muted">
                {t("admin")}
              </Link>
            )}
          </nav>
        )}
        <LocaleToggle />
        <ThemeToggle />
        {user ? (
          <LogoutButton />
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
          >
            {t("login")}
          </Link>
        )}
      </div>
    </header>
  );
}
