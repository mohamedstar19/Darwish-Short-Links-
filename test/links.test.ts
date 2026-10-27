import { describe, expect, it } from "vitest";
import { ALPHABET, createLinkSchema, linkState, normalizeCode, randomCode, updateLinkSchema } from "@/lib/links";

const parse = (v: unknown) => createLinkSchema.safeParse(v);

describe("createLinkSchema", () => {
  it("accepts http(s) URLs and treats an empty code as 'generate one'", () => {
    const r = parse({ url: " https://example.com/a?b=1 ", code: "  ", title: " " });
    expect(r.success && r.data).toEqual({ url: "https://example.com/a?b=1", code: undefined, title: null });
  });

  it("lowercases custom codes", () => {
    expect(parse({ url: "https://example.com", code: "Ramadan-2026" }).data?.code).toBe("ramadan-2026");
  });

  it.each([
    "javascript:alert(1)",
    "ftp://example.com",
    "https://localhost/x",
    "http://127.0.0.1/admin",
    "http://[::1]/",
    "data:text/html,hi",
    "example.com",
  ])("rejects %s", (url) => {
    expect(parse({ url }).success).toBe(false);
  });

  it.each(["ab", "-ab", "ab-", "a.b", "a/b", "a b", "x".repeat(51)])("rejects code %j", (code) => {
    expect(parse({ url: "https://example.com", code }).success).toBe(false);
  });

  it("rejects an expiry in the past", () => {
    expect(parse({ url: "https://example.com", expiresAt: "2020-01-01T00:00:00Z" }).success).toBe(false);
  });
});

describe("updateLinkSchema", () => {
  it("does not allow changing the code", () => {
    expect(updateLinkSchema.safeParse({ code: "new" }).success).toBe(false);
  });
  it("allows clearing the expiry", () => {
    expect(updateLinkSchema.safeParse({ expiresAt: null }).data).toEqual({ expiresAt: null });
  });
});

describe("codes", () => {
  it("generates codes from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = randomCode();
      expect(code).toHaveLength(7);
      expect([...code].every((c) => ALPHABET.includes(c))).toBe(true);
      expect(normalizeCode(code)).toBe(code);
    }
  });
  it("normalizes case and rejects invalid codes", () => {
    expect(normalizeCode("AbC")).toBe("abc");
    expect(normalizeCode("favicon.ico")).toBeNull();
  });
});

describe("linkState", () => {
  const base = { isActive: true, isBlocked: false, expiresAt: null };
  it("orders blocked > paused > expired > active", () => {
    expect(linkState(base)).toBe("active");
    expect(linkState({ ...base, expiresAt: new Date(Date.now() - 1) })).toBe("expired");
    expect(linkState({ ...base, isActive: false, expiresAt: new Date(0) })).toBe("paused");
    expect(linkState({ ...base, isActive: false, isBlocked: true })).toBe("blocked");
  });
});
