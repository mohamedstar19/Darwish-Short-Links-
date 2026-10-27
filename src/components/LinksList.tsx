"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ChartColumn,
  Link2,
  Infinity as InfinityIcon,
  Pause,
  Pencil,
  Play,
  QrCode as QrIcon,
  Trash2,
} from "lucide-react";
import { Alert, Button, Input, buttonClass, fieldClass } from "@/components/ui";
import type { LinkState } from "@/lib/links";
import { STATE_STYLES } from "@/lib/link-ui";
import CopyButton from "./CopyButton";
import QrCode from "./QrCode";
import { endOfDayIso, LINK_ERRORS } from "./ShortenForm";

export type LinkRow = {
  id: string;
  code: string;
  url: string;
  title: string | null;
  state: LinkState;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  lastClickedAt: string | null;
};

export function useFormatters() {
  const locale = useLocale();
  const tag = locale === "ar" ? "ar-EG" : "en";
  return {
    num: (n: number) => new Intl.NumberFormat(tag).format(n),
    date: (iso: string) => new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(new Date(iso)),
  };
}

export default function LinksList({ items, baseUrl }: { items: LinkRow[]; baseUrl: string }) {
  const t = useTranslations("links");
  const { num } = useFormatters();
  const [filter, setFilter] = useState("");

  const q = filter.trim().toLowerCase();
  const visible = q
    ? items.filter((l) => [l.code, l.url, l.title ?? ""].some((v) => v.toLowerCase().includes(q)))
    : items;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {t("myLinks")} ({num(items.length)})
        </h2>
        {items.length > 0 && (
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className={`${fieldClass} text-sm sm:w-64`}
          />
        )}
      </div>
      {items.length === 0 ? (
        <div
          className="animate-rise flex flex-col items-center gap-3 rounded-xl border border-dashed border-input bg-card/60 p-8 text-center text-muted-foreground"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <span className="grid h-12 w-12 animate-[pop_500ms_ease-out_600ms_both] place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-primary-light/15 dark:text-primary-light">
            <Link2 size={24} aria-hidden />
          </span>
          {t("empty")}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">{t("noMatch")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((l, i) => (
            <LinkItem key={l.id} index={i} link={l} short={`${baseUrl}/${l.code}`} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LinkItem({ link, short, index }: { link: LinkRow; short: string; index: number }) {
  const t = useTranslations("links");
  const te = useTranslations("errors");
  const router = useRouter();
  const { num, date } = useFormatters();
  const [panel, setPanel] = useState<"none" | "qr" | "edit">("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => null))?.error;
        setError(LINK_ERRORS.includes(code) ? te(code) : te("SERVER_ERROR"));
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t("confirmDelete", { code: link.code }))) return;
    setBusy(true);
    const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError(te("SERVER_ERROR"));
    router.refresh();
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const expires = String(data.get("expires") ?? "");
    const ok = await patch({
      url: String(data.get("url") ?? "").trim(),
      title: data.get("title") ?? "",
      // Only send the date when it changed, so an already-expired link can still be edited
      ...(expires && expires !== link.expiresAt?.slice(0, 10) ? { expiresAt: endOfDayIso(expires) } : {}),
    });
    if (ok) setPanel("none");
  }

  const toggle = (p: typeof panel) => setPanel(panel === p ? "none" : p);

  return (
    <li
      className="animate-rise rounded-xl border border-border bg-card/95 p-4 transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-md"
      style={{ "--i": index + 2 } as React.CSSProperties}
      aria-label={link.title ?? link.code}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {link.title && <p className="mb-0.5 truncate font-bold">{link.title}</p>}
          <a
            href={short}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="block truncate text-start font-bold text-primary hover:underline dark:text-primary-light"
          >
            {short.replace(/^https?:\/\//, "")}
          </a>
          <p dir="ltr" className="truncate text-start text-sm text-muted-foreground" title={link.url}>
            <span aria-hidden>→ </span>
            {link.url}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className={`rounded-full px-2 py-0.5 font-bold ${STATE_STYLES[link.state]}`}>
              {t(`state.${link.state}`)}
            </span>
            <span>{t("createdOn", { date: date(link.createdAt) })}</span>
            {link.expiresAt && <span>{t("expiresOn", { date: date(link.expiresAt) })}</span>}
          </p>
        </div>
        <Link
          href={`/dashboard/links/${link.id}`}
          className="min-w-14 shrink-0 rounded-lg px-2 py-1 text-center hover:bg-muted"
        >
          <span className="block text-2xl font-extrabold tabular-nums">{num(link.clickCount)}</span>
          <span className="block text-xs text-muted-foreground">{t("clicks")}</span>
          <span className="sr-only">{t("viewStats")}</span>
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={short} />
        <Button size="sm" variant="outline" onClick={() => toggle("qr")} aria-expanded={panel === "qr"}>
          <QrIcon size={16} aria-hidden />
          QR
        </Button>
        <Link href={`/dashboard/links/${link.id}`} className={buttonClass("outline", "sm")}>
          <ChartColumn size={16} aria-hidden />
          {t("stats")}
        </Link>
        {link.state !== "blocked" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggle("edit")}
              aria-expanded={panel === "edit"}
            >
              <Pencil size={16} aria-hidden />
              {t("edit")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => patch({ isActive: link.state === "paused" })}
            >
              {link.state === "paused" ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
              {link.state === "paused" ? t("resume") : t("pause")}
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" className="ms-auto text-danger" disabled={busy} onClick={remove}>
          <Trash2 size={16} aria-hidden />
          {t("delete")}
        </Button>
      </div>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {panel === "qr" && (
        <div className="mt-4">
          <QrCode url={short} name={link.code} />
        </div>
      )}

      {panel === "edit" && (
        <form onSubmit={saveEdit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              name="url"
              type="url"
              dir="ltr"
              required
              maxLength={2048}
              label={t("destination")}
              defaultValue={link.url}
            />
          </div>
          <Input name="title" label={t("title")} maxLength={120} defaultValue={link.title ?? ""} />
          <Input
            name="expires"
            type="date"
            label={t("expires")}
            defaultValue={link.expiresAt?.slice(0, 10) ?? ""}
          />
          <p className="text-xs text-muted-foreground sm:col-span-2">{t("codeFixed")}</p>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" size="sm" loading={busy}>
              {t("save")}
            </Button>
            {link.expiresAt && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => (await patch({ expiresAt: null })) && setPanel("none")}
              >
                <InfinityIcon size={16} aria-hidden />
                {t("removeExpiry")}
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel("none")}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
