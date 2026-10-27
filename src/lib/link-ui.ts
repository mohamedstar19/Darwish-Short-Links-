import type { LinkState } from "@/lib/links";

/** Badge colors per link state (plain module so server and client can share it) */
export const STATE_STYLES: Record<LinkState, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-muted text-muted-foreground",
  expired: "bg-gold/15 text-primary-dark dark:text-gold-light",
  blocked: "bg-danger/10 text-danger",
};
