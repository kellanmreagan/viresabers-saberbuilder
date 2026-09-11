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
await page.goto("http://localhost:5177/", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("body", { timeout: 20000 });
console.log("slot texts", await page.$$eval(".slot-btn", (els) => els.map((e) => e.textContent)));
console.log("body start", (await page.$eval("body", (el) => el.innerText)).slice(0, 400));
await page.waitForSelector(".slot-btn", { timeout: 20000 });

async function clickSlot(label) {
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll(".slot-btn")].find((b) => b.textContent.trim() === text);
    if (!btn) {
      throw new Error(
        `no slot ${text}: ${[...document.querySelectorAll(".slot-btn")].map((b) => b.textContent.trim()).join("|")}`
      );
    }
    btn.click();
  }, label);
}
async function searchAndClick(title) {
  const input = await page.$(".filters input");
  await input.click({ clickCount: 3 });
  await input.type(title, { delay: 12 });
  await page.waitForFunction(
    (t) => [...document.querySelectorAll(".card strong")].some((el) => el.textContent.includes(t)),
    { timeout: 8000 },
    title
  );
  await page.evaluate((t) => {
    [...document.querySelectorAll(".card")]
      .find((el) => el.querySelector("strong")?.textContent.includes(t))
      .click();
  }, title);
  await new Promise((r) => setTimeout(r, 600));
}

await clickSlot("Grip");
await searchAndClick("Fang Grip");
console.log("after fang", errors, "slots", await page.$$eval(".slot-btn", (els) => els.length));
await page.screenshot({ path: new URL("43-fang-only.png", outDir).pathname });
await clickSlot("Pommel");
await searchAndClick("Rook Pommel");
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: new URL("43-fit.png", outDir).pathname });
const chip = await page.$eval(".placeholder-chip", (el) => el.textContent.trim());
console.log(JSON.stringify({ chip, errors }, null, 2));
await browser.close();
if (!chip.includes("Rook") || !chip.includes("Fang")) process.exit(1);
if (errors.filter((e) => !/404|Failed to load resource/.test(e)).length) process.exit(1);
