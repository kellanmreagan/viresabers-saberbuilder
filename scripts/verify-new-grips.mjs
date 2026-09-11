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
await page.waitForSelector(".slot-btn", { timeout: 20000 });

async function clickSlot(label) {
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll(".slot-btn")].find((b) => b.textContent.trim() === text);
    if (!btn) throw new Error(`no slot ${text}`);
    btn.click();
  }, label);
}
async function searchAndClick(title) {
  await page.evaluate((t) => {
    const input = document.querySelector(".filters input");
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc.set.call(input, t);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, title);
  await page.waitForFunction(
    (t) => [...document.querySelectorAll(".card strong")].some((el) => el.textContent.includes(t)),
    { timeout: 15000 },
    title
  );
  await page.evaluate((t) => {
    [...document.querySelectorAll(".card")]
      .find((el) => el.querySelector("strong")?.textContent.includes(t))
      .click();
  }, title);
  await new Promise((r) => setTimeout(r, 700));
}

await clickSlot("Pommel");
await searchAndClick("Rook Pommel");
await clickSlot("Switch");
await searchAndClick("Rook Switch (USB-C)");
await clickSlot("Grip");
await searchAndClick("Sentinel Grip");
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: new URL("51-sentinel-grip.png", outDir).pathname });
const chip1 = await page.$eval(".placeholder-chip", (el) => el.textContent.trim());

await searchAndClick("Throttle Grip");
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: new URL("51-throttle-grip.png", outDir).pathname });
const chip2 = await page.$eval(".placeholder-chip", (el) => el.textContent.trim());

console.log(JSON.stringify({ chip1, chip2, errors }, null, 2));
await browser.close();
if (!chip1.includes("Sentinel grip")) process.exit(1);
if (!chip2.includes("Throttle grip")) process.exit(1);
if (errors.filter((e) => !/404|Failed to load resource/.test(e)).length) process.exit(1);
