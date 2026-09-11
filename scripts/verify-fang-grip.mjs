import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const outDir = new URL("../tmp-verify/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5177/", { waitUntil: "networkidle0", timeout: 90000 });
await page.waitForSelector(".card", { timeout: 20000 });
await page.evaluate(() => {
  [...document.querySelectorAll(".slot-btn")].find((b) => b.textContent.includes("Grip")).click();
});
await page.waitForSelector(".card");
const input = await page.$(".filters input");
await input.click({ clickCount: 3 });
await input.type("Fang Grip", { delay: 15 });
await page.waitForFunction(() =>
  [...document.querySelectorAll(".card strong")].some((el) => el.textContent.includes("Fang Grip"))
);
await page.evaluate(() => {
  [...document.querySelectorAll(".card")]
    .find((el) => el.querySelector("strong")?.textContent.includes("Fang Grip"))
    .click();
});
await new Promise((r) => setTimeout(r, 8000));
await page.screenshot({ path: new URL("41-fang-grip.png", outDir).pathname });
const chip = await page.$eval(".placeholder-chip", (el) => el.textContent.trim());
console.log(JSON.stringify({ chip, errors }, null, 2));
await browser.close();
if (!chip.includes("Fang grip")) process.exit(1);
if (errors.filter((e) => !/404|Failed to load resource/.test(e)).length) process.exit(1);
