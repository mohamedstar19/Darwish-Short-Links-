"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

export function BlockLinkButton({ id, blocked }: { id: string; blocked: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={blocked ? "outline" : "danger"}
      loading={pending}
      onClick={() => {
        const reason = blocked ? "" : prompt(t("blockReasonPrompt"));
        if (reason === null) return;
        start(async () => {
          const res = await fetch(`/api/admin/links/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isBlocked: !blocked, blockedReason: reason }),
          });
          if (!res.ok) alert(t("failed"));
          router.refresh();
        });
      }}
    >
      {blocked ? t("unblock") : t("block")}
    </Button>
  );
}

export function BlockUserButton({ id, blocked, name }: { id: string; blocked: boolean; name: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={blocked ? "outline" : "danger"}
      loading={pending}
      onClick={() => {
        if (!blocked && !confirm(t("confirmBlockUser", { name }))) return;
        start(async () => {
          const res = await fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isBlocked: !blocked }),
          });
          if (!res.ok) alert(t("failed"));
          router.refresh();
        });
      }}
    >
      {blocked ? t("unblock") : t("block")}
    </Button>
  );
}
