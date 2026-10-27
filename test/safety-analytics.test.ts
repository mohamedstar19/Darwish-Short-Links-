import { describe, expect, it } from "vitest";
import { checkUrlLocally } from "@/lib/url-safety";
import { countryFrom, isBot, parseUserAgent, referrerHost } from "@/lib/analytics";

describe("checkUrlLocally", () => {
  it("blocks links back to this site and to other shorteners", () => {
    expect(checkUrlLocally("https://www.drw.sh/abc", "drw.sh")).toBe("SELF_LINK");
    expect(checkUrlLocally("https://bit.ly/xyz", "drw.sh")).toBe("SHORTENER");
    expect(checkUrlLocally("https://example.com", "drw.sh")).toBeNull();
  });
});

describe("analytics", () => {
  const iphone =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const androidChrome =
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
  const edge =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0";

  it("parses device, browser and OS", () => {
    expect(parseUserAgent(iphone)).toEqual({ device: "mobile", browser: "Safari", os: "iOS" });
    expect(parseUserAgent(androidChrome)).toEqual({ device: "mobile", browser: "Chrome", os: "Android" });
    expect(parseUserAgent(edge)).toEqual({ device: "desktop", browser: "Edge", os: "Windows" });
  });

  it("skips link previews and crawlers", () => {
    expect(isBot("WhatsApp/2.24.1 A")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot(iphone)).toBe(false);
  });

  it("keeps only the referrer host, ignoring this site", () => {
    expect(referrerHost("https://www.facebook.com/some/post?id=1", "drw.sh")).toBe("facebook.com");
    expect(referrerHost("https://drw.sh/dashboard", "drw.sh")).toBeNull();
    expect(referrerHost("not a url", "drw.sh")).toBeNull();
  });

  it("reads the CDN country header", () => {
    expect(countryFrom(new Headers({ "x-vercel-ip-country": "eg" }))).toBe("EG");
    expect(countryFrom(new Headers({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(countryFrom(new Headers())).toBeNull();
  });
});
