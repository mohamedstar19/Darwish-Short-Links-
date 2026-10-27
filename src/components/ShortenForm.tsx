"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Card, Input } from "@/components/ui";
import CopyButton from "./CopyButton";
import QrCode from "./QrCode";

export const LINK_ERRORS = [
  "INVALID_INPUT",
  "CODE_TAKEN",
  "CODE_RESERVED",
  "SELF_LINK",
  "SHORTENER",
  "UNSAFE",
  "RATE_LIMITED",
  "NOT_FOUND",
];

/** <input type="date"> → end of that day in the browser's time zone */
export function endOfDayIso(date: string) {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null;
}

export default function ShortenForm({ baseUrl }: { baseUrl: string }) {
  const t = useTranslations("links");
  const te = useTranslations("errors");
  const router = useRouter();
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string; url: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.get("url"),
          code: data.get("code") ?? "",
          title: data.get("title") ?? "",
          expiresAt: endOfDayIso(String(data.get("expires") ?? "")),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(LINK_ERRORS.includes(body?.error) ? te(body.error) : te("SERVER_ERROR"));
        return;
      }
      setCreated({ code: body.item.code, url: body.item.url });
      form.reset();
      setMore(false);
      router.refresh();
    } catch {
      setError(te("SERVER_ERROR"));
    } finally {
      setLoading(false);
    }
  }

  const short = created ? `${baseUrl}/${created.code}` : "";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="url"
              type="url"
              dir="ltr"
              required
              maxLength={2048}
              placeholder={t("urlPlaceholder")}
              aria-label={t("url")}
              className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" loading={loading} className="sm:px-8">
              {t("shorten")}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMore(!more)}
            aria-expanded={more}
            className="self-start text-sm font-bold text-primary hover:underline dark:text-primary-light"
          >
            {more ? "−" : "+"} {t("moreOptions")}
          </button>

          {more && (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">{t("customCode")}</span>
                <div
                  dir="ltr"
                  className="flex items-center overflow-hidden rounded-lg border border-border bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <span className="max-w-[45%] shrink-0 truncate bg-muted px-2 py-2.5 text-sm text-muted-foreground">
                    {baseUrl.replace(/^https?:\/\//, "")}/
                  </span>
                  <input
                    name="code"
                    pattern="[a-zA-Z0-9][a-zA-Z0-9\-]{1,48}[a-zA-Z0-9]"
                    maxLength={50}
                    placeholder="ramadan"
                    className="min-w-0 flex-1 bg-transparent px-2 py-2.5 lowercase outline-none"
                  />
                </div>
                <span className="mt-1 block text-xs text-muted-foreground">{t("customCodeHint")}</span>
              </label>
              <Input name="title" label={t("title")} maxLength={120} />
              <Input name="expires" type="date" label={t("expires")} />
            </div>
          )}

          {error && <Alert>{error}</Alert>}
        </form>
      </Card>

      {created && (
        <Card className="border-gold/50">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 text-center sm:text-start">
              <p className="text-sm text-muted-foreground">{t("ready")}</p>
              <a
                href={short}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="mt-1 block break-all text-xl font-extrabold text-primary hover:underline dark:text-primary-light"
              >
                {short.replace(/^https?:\/\//, "")}
              </a>
              <p dir="ltr" className="mt-1 truncate text-sm text-muted-foreground">
                → {created.url}
              </p>
              <div className="mt-3">
                <CopyButton text={short} />
              </div>
            </div>
            <QrCode url={short} name={created.code} />
          </div>
        </Card>
      )}
    </div>
  );
}
