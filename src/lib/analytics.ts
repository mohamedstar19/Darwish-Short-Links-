/**
 * Turns request headers into the anonymous facts stored per click:
 * device type, browser, OS, referrer host and country. No IP is kept.
 */

const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|slack|curl|wget|python-|go-http|java\/|headless|lighthouse|monitor/i;

/** Link previews and crawlers aren't people clicking, so they aren't counted */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

export type Device = "mobile" | "tablet" | "desktop";

export function parseUserAgent(ua: string): { device: Device; browser: string | null; os: string | null } {
  const device: Device = /ipad|tablet|(android(?!.*mobile))/i.test(ua)
    ? "tablet"
    : /mobi|iphone|ipod|android/i.test(ua)
      ? "mobile"
      : "desktop";

  // Order matters: Edge/Opera/Samsung UAs also contain "Chrome" and "Safari"
  const browser =
    /edg(e|a|ios)?\//i.test(ua) ? "Edge"
    : /opr\/|opera/i.test(ua) ? "Opera"
    : /samsungbrowser/i.test(ua) ? "Samsung Internet"
    : /firefox|fxios/i.test(ua) ? "Firefox"
    : /chrome|crios/i.test(ua) ? "Chrome"
    : /safari/i.test(ua) ? "Safari"
    : null;

  const os =
    /windows/i.test(ua) ? "Windows"
    : /iphone|ipad|ipod/i.test(ua) ? "iOS"
    : /android/i.test(ua) ? "Android"
    : /mac os x|macintosh/i.test(ua) ? "macOS"
    : /linux/i.test(ua) ? "Linux"
    : null;

  return { device, browser, os };
}

export function referrerHost(referer: string | null, ownHost: string): string | null {
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === ownHost.split(":")[0].replace(/^www\./, "")) return null;
    return host.slice(0, 255);
  } catch {
    return null;
  }
}

/** Country from the hosting CDN (Vercel or Cloudflare), when it sends one */
export function countryFrom(headers: Headers): string | null {
  const c = (headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"))?.toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) && c !== "XX" ? c : null;
}
