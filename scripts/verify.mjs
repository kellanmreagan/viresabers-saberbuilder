import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const url = process.env.URL || "http://localhost:5177/";
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
await page.screenshot({ path: new URL("01-initial.png", outDir).pathname, fullPage: true });

async function clickSlot(label) {
  await page.evaluate((text) => {
    const btn = [...document.querySelectorAll(".slot-btn")].find((b) =>
      b.textContent.includes(text)
    );
    if (!btn) throw new Error(`missing slot ${text}`);
    btn.click();
  }, label);
  await page.waitForSelector(".card");
}

async function clickFirstCard() {
  await page.click(".card");
  await new Promise((r) => setTimeout(r, 350));
}

await clickFirstCard();
for (const label of ["Switch", "Grip", "Pommel", "Blade"]) {
  await clickSlot(label);
  await clickFirstCard();
}
await clickSlot("Add-ons");
await clickFirstCard();

await page.screenshot({ path: new URL("02-assembled.png", outDir).pathname, fullPage: true });

const ignite = await page.$(".stage-tools button");
if (ignite) await ignite.click();
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: new URL("03-ignited.png", outDir).pathname });

const desktop = {
  total: await page.$eval(".total strong", (el) => el.textContent),
  lines: await page.$$eval(".lines li:not(.muted)", (els) => els.length),
  parts: await page.$eval(".cart-pill", (el) => el.textContent),
  canvas: Boolean(await page.$("canvas")),
  ready: await page.$eval(".ready", (el) => el.textContent.trim()),
};

await page.setViewport({ width: 390, height: 844 });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: new URL("04-mobile.png", outDir).pathname, fullPage: true });
const mobileParts = await page.$eval(".cart-pill", (el) => el.textContent);

const realErrors = errors.filter((e) => !/404|Failed to load resource/.test(e));
console.log(JSON.stringify({ desktop, mobileParts, errors, realErrors }, null, 2));
await browser.close();
if (!desktop.canvas || desktop.lines < 5) process.exit(1);
if (realErrors.length) process.exit(1);
