import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("unavailable");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <p className="text-5xl font-extrabold text-gold">404</p>
      <p className="mt-3 text-muted-foreground">{t("notFound")}</p>
      <Link href="/" className={`${buttonClass()} mt-8`}>
        {t("home")}
      </Link>
    </div>
  );
}
