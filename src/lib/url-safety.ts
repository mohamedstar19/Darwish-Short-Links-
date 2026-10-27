/**
 * Checks on a destination URL before it becomes a short link. The schema in
 * links.ts already limits it to http(s) with a real domain name (no IPs,
 * no localhost); these checks catch abuse patterns on top of that.
 */

// Wrapping another shortener hides the real destination — a common spam trick
const OTHER_SHORTENERS = new Set([
  "bit.ly",
  "bitly.com",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "v.gd",
  "ow.ly",
  "cutt.ly",
  "rebrand.ly",
  "shorturl.at",
  "tiny.cc",
  "rb.gy",
  "t.ly",
  "s.id",
]);

export type UrlProblem = "SELF_LINK" | "SHORTENER" | "UNSAFE";

function stripWww(host: string) {
  return host.toLowerCase().replace(/^www\./, "");
}

export function checkUrlLocally(url: string, ownHost: string): UrlProblem | null {
  const host = stripWww(new URL(url).hostname);
  if (host === stripWww(ownHost.split(":")[0])) return "SELF_LINK";
  if (OTHER_SHORTENERS.has(host)) return "SHORTENER";
  return null;
}

/**
 * Google Safe Browsing lookup, only when SAFE_BROWSING_API_KEY is set.
 * Fails open (returns null) on timeouts or API errors so an outage at Google
 * doesn't stop people from creating links; admins can still block later.
 */
export async function checkSafeBrowsing(url: string): Promise<UrlProblem | null> {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          client: { clientId: "darwish-short-links", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { matches?: unknown[] };
    return data.matches?.length ? "UNSAFE" : null;
  } catch {
    return null;
  }
}
