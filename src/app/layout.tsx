import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import AnimatedBackground from "@/components/AnimatedBackground";
import "./globals.css";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site");
  return {
    title: { default: t("name"), template: `%s | ${t("name")}` },
    description: t("description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#011713" },
  ],
};

// Applies the saved theme before paint so dark mode doesn't flash
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("site");
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${cairo.variable} flex min-h-dvh flex-col antialiased`}>
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-2"
          >
            {t("skipToContent")}
          </a>
          <AnimatedBackground />
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
            {t("footer")}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
