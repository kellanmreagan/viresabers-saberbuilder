import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const url = "http://localhost:5177/";
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
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".card", { timeout: 20000 });

async function clickSlot(label) {
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll(".slot-btn")].find((b) =>
      b.textContent.includes(text)
    );
    btn.click();
  }, label);
  await page.waitForSelector(".card");
}

async function searchAndClick(title) {
  const input = await page.$(".filters input");
  await input.click({ clickCount: 3 });
  await input.type(title, { delay: 15 });
  await page.waitForFunction(
    (t) => [...document.querySelectorAll(".card strong")].some((el) => el.textContent.includes(t)),
    { timeout: 8000 },
    title
  );
  await page.evaluate((t) => {
    const card = [...document.querySelectorAll(".card")].find((el) =>
      el.querySelector("strong")?.textContent.includes(t)
    );
    card.click();
  }, title);
  await new Promise((r) => setTimeout(r, 600));
}

await clickSlot("Emitter");
await searchAndClick("Phoenix Emitter");
await page.screenshot({ path: new URL("10-phoenix.png", outDir).pathname });

const swatchCount = await page.$$eval(".metal-swatch", (els) => els.length);
if (swatchCount > 1) {
  await page.click(".metal-swatch:last-child");
  await new Promise((r) => setTimeout(r, 400));
}
await page.screenshot({ path: new URL("11-phoenix-color.png", outDir).pathname });

await clickSlot("Grip");
await searchAndClick("Vortex Grip");
await page.screenshot({ path: new URL("13-vortex-colors.png", outDir).pathname });
await clickSlot("Switch");
await searchAndClick("Rook Switch");
await clickSlot("Pommel");
await searchAndClick("Nova Pommel");
await clickSlot("Blade");
await searchAndClick("1\" Pixel Blade");
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: new URL("12-stack-style.png", outDir).pathname });

const info = await page.evaluate(() => ({
  parts: document.querySelector(".cart-pill")?.textContent,
  selects: document.querySelectorAll(".metal-select").length,
  swatches: document.querySelectorAll(".metal-swatch").length,
  floor: [...document.querySelectorAll("canvas")].length,
}));
const realErrors = errors.filter((e) => !/404|Failed to load resource/.test(e));
console.log(JSON.stringify({ info, errors, realErrors }, null, 2));
await browser.close();
if (realErrors.length) process.exit(1);
if (info.selects < 1) process.exit(1);
