import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

/** Decodes an 8-bit RGB or RGBA PNG (what our icon renderer writes) and returns its pixels as RGBA */
function decodePng(file: string) {
  const buf = readFileSync(file);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  expect(buf[24]).toBe(8); // bit depth
  const colorType = buf[25];
  expect([2, 6]).toContain(colorType); // RGB or RGBA
  const bpp = colorType === 6 ? 4 : 3;
  const idat: Buffer[] = [];
  for (let o = 8; o < buf.length; ) {
    const len = buf.readUInt32BE(o);
    if (buf.toString("ascii", o + 4, o + 8) === "IDAT") idat.push(buf.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      const p = a + b - c;
      const paeth =
        Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      const pred = [0, a, b, (a + b) >> 1, paeth][filter];
      px[y * stride + x] = (cur + pred) & 255;
    }
  }
  const pixel = (x: number, y: number) => {
    const at = y * stride + x * bpp;
    return [px[at], px[at + 1], px[at + 2], bpp === 4 ? px[at + 3] : 255];
  };
  return { width, height, pixel };
}

// A blank or broken render shows up as black on phones; make sure the icons carry the brand green
describe.each([
  ["public/brand/icon-192.png", 192],
  ["public/brand/icon-512.png", 512],
  ["public/brand/maskable-512.png", 512],
  ["src/app/apple-icon.png", 180],
])("%s", (file, size) => {
  it("has the right size and an opaque emerald background", () => {
    const png = decodePng(file);
    expect([png.width, png.height]).toEqual([size, size]);
    const [r, g, b, a] = png.pixel(Math.floor(size / 2), Math.floor(size * 0.06));
    expect(a).toBe(255);
    expect(g).toBeGreaterThan(r + 30);
    expect(g).toBeGreaterThan(b);
  });
});
