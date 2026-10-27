"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Link2 } from "lucide-react";
import { Alert, Button, Card, FieldError, Input, fieldClass } from "@/components/ui";
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

// Which field each API error belongs to, so the message shows next to it
const URL_ERRORS = ["SELF_LINK", "SHORTENER", "UNSAFE"];
const CODE_ERRORS = ["CODE_TAKEN", "CODE_RESERVED"];

/** <input type="date"> → end of that day in the browser's time zone */
export function endOfDayIso(date: string) {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null;
}

/**
 * The main "paste a link" form. Visitors who aren't signed in can paste a URL
 * too; it's carried through sign-up and waiting in the form afterwards.
 */
export default function ShortenForm({
  baseUrl,
  guest = false,
  initialUrl = "",
}: {
  baseUrl: string;
  guest?: boolean;
  initialUrl?: string;
}) {
  const t = useTranslations("links");
  const te = useTranslations("errors");
  const router = useRouter();
  const id = useId();
  const urlRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ field: "url" | "code" | "form"; text: string } | null>(null);
  const [created, setCreated] = useState<{ code: string; url: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const url = String(data.get("url") ?? "").trim();

    if (guest) {
      router.push(`/register?next=${encodeURIComponent(`/dashboard?url=${encodeURIComponent(url)}`)}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          code: data.get("code") ?? "",
          title: data.get("title") ?? "",
          expiresAt: endOfDayIso(String(data.get("expires") ?? "")),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const code: string = body?.error;
        const text = LINK_ERRORS.includes(code) ? te(code) : te("SERVER_ERROR");
        const field = URL_ERRORS.includes(code) ? "url" : CODE_ERRORS.includes(code) ? "code" : "form";
        setError({ field, text });
        if (field === "url") urlRef.current?.focus();
        if (field === "code") requestAnimationFrame(() => codeRef.current?.focus());
        return;
      }
      setCreated({ code: body.item.code, url: body.item.url });
      form.reset();
      setMore(false);
      // Drop a ?url= carried over from sign-up so a refresh doesn't refill the form
      if (initialUrl) router.replace(window.location.pathname, { scroll: false });
      router.refresh();
    } catch {
      setError({ field: "form", text: te("SERVER_ERROR") });
    } finally {
      setLoading(false);
    }
  }

  const short = created ? `${baseUrl}/${created.code}` : "";
  const urlError = error?.field === "url" ? error.text : null;
  const codeError = error?.field === "code" ? error.text : null;
  // The code field must be visible to show its error
  const showMore = more || !!codeError;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor={`${id}-url`} className="mb-1.5 block text-sm font-semibold">
              {t("url")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={urlRef}
                id={`${id}-url`}
                name="url"
                type="url"
                inputMode="url"
                dir="ltr"
                required
                maxLength={2048}
                defaultValue={initialUrl}
                placeholder="https://"
                aria-invalid={urlError ? true : undefined}
                aria-describedby={urlError ? `${id}-url-error` : undefined}
                className={`${fieldClass} min-h-12 text-base sm:flex-1`}
              />
              <Button type="submit" loading={loading} className="min-h-12 sm:px-8">
                <Link2 size={18} aria-hidden />
                {t("shorten")}
              </Button>
            </div>
            <FieldError id={`${id}-url-error`} error={urlError} />
            {guest && <p className="mt-2 text-xs text-muted-foreground">{t("guestHint")}</p>}
          </div>

          {!guest && (
            <>
              <button
                type="button"
                onClick={() => setMore(!showMore)}
                aria-expanded={showMore}
                aria-controls={`${id}-more`}
                className="inline-flex min-h-11 cursor-pointer items-center gap-1 self-start rounded-lg text-sm font-bold text-primary hover:underline sm:min-h-9 dark:text-primary-light"
              >
                <ChevronDown
                  size={16}
                  aria-hidden
                  className={`transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}
                />
                {t("moreOptions")}
              </button>

              <div id={`${id}-more`} hidden={!showMore} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor={`${id}-code`} className="mb-1.5 block text-sm font-semibold">
                    {t("customCode")}
                  </label>
                  <div
                    dir="ltr"
                    className={`flex min-h-11 items-center overflow-hidden rounded-lg border bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 ${
                      codeError ? "border-danger" : "border-input"
                    }`}
                  >
                    <span className="max-w-[45%] shrink-0 self-stretch truncate bg-muted px-2 py-2.5 text-sm text-muted-foreground">
                      {baseUrl.replace(/^https?:\/\//, "")}/
                    </span>
                    <input
                      ref={codeRef}
                      id={`${id}-code`}
                      name="code"
                      pattern="[a-zA-Z0-9][a-zA-Z0-9\-]{1,48}[a-zA-Z0-9]"
                      maxLength={50}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="ramadan"
                      aria-invalid={codeError ? true : undefined}
                      aria-describedby={`${codeError ? `${id}-code-error ` : ""}${id}-code-hint`}
                      className="min-w-0 flex-1 bg-transparent px-2 py-2.5 lowercase outline-none"
                    />
                  </div>
                  <FieldError id={`${id}-code-error`} error={codeError} />
                  <p id={`${id}-code-hint`} className="mt-1 text-xs text-muted-foreground">
                    {t("customCodeHint")}
                  </p>
                </div>
                <Input name="title" label={t("title")} maxLength={120} />
                <Input name="expires" type="date" label={t("expires")} />
              </div>
            </>
          )}

          {error?.field === "form" && <Alert>{error.text}</Alert>}
        </form>
      </Card>

      {created && (
        <Card className="animate-pop border-gold/60">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 text-center sm:text-start" role="status">
              <p className="text-sm text-muted-foreground">{t("ready")}</p>
              <a
                href={short}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="mt-1 block text-xl font-extrabold text-primary [overflow-wrap:anywhere] hover:underline dark:text-primary-light"
              >
                {short.replace(/^https?:\/\//, "")}
              </a>
              <p dir="ltr" className="mt-1 truncate text-sm text-muted-foreground" title={created.url}>
                <span aria-hidden>→ </span>{created.url}
              </p>
              <div className="mt-3">
                <CopyButton text={short} variant="gold" />
              </div>
            </div>
            <QrCode url={short} name={created.code} />
          </div>
        </Card>
      )}
    </div>
  );
}
