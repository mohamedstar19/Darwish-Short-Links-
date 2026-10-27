import "server-only";
import { headers } from "next/headers";
import { appUrl } from "@/lib/env";

/** Base URL for building short links in server components */
export async function requestBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return appUrl(`${proto}://${host}`);
}
