// Regenerates the PNG app icons from the SVGs in this folder.
//   node design/icons/render-pngs.mjs       (needs Playwright with Chromium installed)
// The SVG markup is inlined into the page: an <img src="file://..."> from
// setContent is blocked and would silently produce blank (black-looking) icons.
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";

const here = import.meta.dirname;
const root = path.resolve(here, "../..");
const jobs = [
  ["1-chain.svg", 192, "public/brand/icon-192.png"],
  ["1-chain.svg", 512, "public/brand/icon-512.png"],
  ["1-chain-maskable.svg", 512, "public/brand/maskable-512.png"],
  ["1-chain-full.svg", 180, "src/app/apple-icon.png"],
];

const browser = await chromium.launch();
for (const [src, size, out] of jobs) {
  const svg = fs.readFileSync(path.join(here, src), "utf8").replace("<svg ", `<svg width="${size}" height="${size}" `);
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: path.join(root, out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log("wrote", out);
}
await browser.close();
