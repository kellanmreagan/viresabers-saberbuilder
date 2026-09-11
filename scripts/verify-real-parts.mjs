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
    if (!btn) throw new Error(`missing slot ${text}`);
    btn.click();
  }, label);
  await page.waitForSelector(".card");
}

async function clickCardByTitle(title) {
  await page.evaluate((t) => {
    const input = document.querySelector(".filters input");
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, title);
  const typed = await page.$(".filters input");
  await typed.click({ clickCount: 3 });
  await typed.type(title, { delay: 20 });
  await page.waitForFunction(
    (t) => [...document.querySelectorAll(".card strong")].some((el) => el.textContent.includes(t)),
    { timeout: 10000 },
    title
  );
  await page.evaluate((t) => {
    const card = [...document.querySelectorAll(".card")].find((el) =>
      el.querySelector("strong")?.textContent.includes(t)
    );
    if (!card) throw new Error(`missing card ${t}`);
    card.click();
  }, title);
  await new Promise((r) => setTimeout(r, 800));
}

await clickSlot("Emitter");
await clickCardByTitle("Fang Emitter");
await page.screenshot({ path: new URL("05-fang.png", outDir).pathname });

await clickSlot("Pommel");
await clickCardByTitle("Nova Pommel");
await page.screenshot({ path: new URL("06-fang-nova.png", outDir).pathname });

await clickSlot("Switch");
await page.click(".card");
await new Promise((r) => setTimeout(r, 300));
await clickSlot("Grip");
await page.click(".card");
await new Promise((r) => setTimeout(r, 300));
await clickSlot("Blade");
await page.click(".card");
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: new URL("07-real-stack.png", outDir).pathname });

const info = await page.evaluate(() => ({
  parts: document.querySelector(".cart-pill")?.textContent,
  titles: [...document.querySelectorAll(".lines strong")].map((el) => el.textContent),
  badges: [...document.querySelectorAll(".badge.real")].map((el) => el.textContent),
}));

const realErrors = errors.filter((e) => !/404|Failed to load resource/.test(e));
console.log(JSON.stringify({ info, errors, realErrors }, null, 2));
await browser.close();
if (!info.titles.some((t) => t.includes("Fang")) || !info.titles.some((t) => t.includes("Nova"))) {
  process.exit(1);
}
if (realErrors.length) process.exit(1);
