"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

export default function CopyButton({ text, variant = "gold" }: { text: string; variant?: "gold" | "outline" }) {
  const t = useTranslations("links");
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked: the link is still visible to copy by hand */
        }
      }}
    >
      <span aria-live="polite">{copied ? `✓ ${t("copied")}` : `📋 ${t("copy")}`}</span>
    </Button>
  );
}
