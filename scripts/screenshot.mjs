import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/home.png", fullPage: true });

await page.hover("text=Motorcycle");
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/nav-dropdown.png" });

await page.goto("http://localhost:3000/en/quote", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/quote.png", fullPage: true });

await page.goto("http://localhost:3000/en/catalog/motorcycle/TVS", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/catalog.png", fullPage: true });

await browser.close();
console.log("done");
