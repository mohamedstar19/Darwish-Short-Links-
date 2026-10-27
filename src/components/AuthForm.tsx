"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button, Card, Input } from "@/components/ui";
import PasswordInput from "./PasswordInput";

const KNOWN_ERRORS = [
  "INVALID_INPUT",
  "INVALID_CREDENTIALS",
  "EMAIL_TAKEN",
  "ACCOUNT_BLOCKED",
  "RATE_LIMITED",
];

/** Only same-site paths, so ?next= can't send people to another site */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => null))?.error;
        setError(KNOWN_ERRORS.includes(code) ? te(code) : te("SERVER_ERROR"));
        return;
      }
      router.push(safeNext(params.get("next")));
      router.refresh();
    } catch {
      setError(te("SERVER_ERROR"));
    } finally {
      setLoading(false);
    }
  }

  const other = mode === "login" ? "register" : "login";
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="mb-1 text-2xl font-extrabold">{t(`${mode}.title`)}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t(`${mode}.subtitle`)}</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "register" && (
            <Input name="name" label={t("name")} required minLength={2} maxLength={80} autoComplete="name" />
          )}
          <Input name="email" type="email" dir="ltr" label={t("email")} required autoComplete="email" />
          <PasswordInput
            name="password"
            label={t("password")}
            required
            minLength={mode === "register" ? 8 : 1}
            maxLength={128}
            hint={mode === "register" ? t("passwordHint") : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {error && <Alert>{error}</Alert>}
          <Button type="submit" loading={loading}>
            {t(`${mode}.submit`)}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t(`${mode}.switchPrompt`)}{" "}
          <Link
            href={`/${other}${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}
            className="font-bold text-primary hover:underline dark:text-primary-light"
          >
            {t(`${other}.title`)}
          </Link>
        </p>
      </Card>
    </div>
  );
}
