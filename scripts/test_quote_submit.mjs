import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/en/quote", { waitUntil: "networkidle" });

await page.fill('input[placeholder="Full name"]', "Test Buyer");
await page.fill('input[placeholder="Company"]', "Test Importadora SA");
await page.fill('input[placeholder="Country"]', "Colombia");
await page.fill('input[placeholder="Email"]', "test@example.com");
await page.fill('input[placeholder="WhatsApp number"]', "+57 300 0000000");
await page.fill('textarea', "Apache RTR 160 brake shoe x 20");
await page.click('button[type="submit"]');
await page.waitForSelector("text=Thank you!", { timeout: 10000 });
await page.screenshot({ path: "screenshots/quote-success.png" });
console.log("SUCCESS: success message rendered");

await browser.close();
