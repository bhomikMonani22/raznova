import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/home2-top.png" });

await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/home2-marquee.png" });

await page.evaluate(() => window.scrollBy(0, 1600));
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/home2-why.png" });

await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/home2-markets.png" });

await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/home2-quotecta.png" });

await page.hover("text=Part Brands");
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/home2-partbrands-dropdown.png" });

await page.goto("http://localhost:3000/en/brands/Varroc", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/brand-varroc.png", fullPage: true });

await page.goto("http://localhost:3000/en/brands/UCAL", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/brand-ucal.png", fullPage: true });

await browser.close();
console.log("done");
