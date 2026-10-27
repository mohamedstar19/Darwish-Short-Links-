import { linkState } from "@/lib/links";
import type { LinkRow } from "@/components/LinksList";

type DbLink = {
  id: string;
  code: string;
  url: string;
  title: string | null;
  isActive: boolean;
  isBlocked: boolean;
  clickCount: number;
  createdAt: Date;
  expiresAt: Date | null;
  lastClickedAt: Date | null;
};

/** Database row → plain props for client components */
export function toLinkRow(l: DbLink): LinkRow {
  return {
    id: l.id,
    code: l.code,
    url: l.url,
    title: l.title,
    state: linkState(l),
    clickCount: l.clickCount,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt?.toISOString() ?? null,
    lastClickedAt: l.lastClickedAt?.toISOString() ?? null,
  };
}
