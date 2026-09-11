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

await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector(".card", { timeout: 20000 });

async function clickSlot(label) {
  await page.evaluate((text) => {
    [...document.querySelectorAll(".slot-btn")]
      .find((b) => b.textContent.includes(text))
      .click();
  }, label);
  await page.waitForSelector(".card");
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
  await new Promise((r) => setTimeout(r, 400));
}

await clickSlot("Emitter");
await searchAndClick("Fang Emitter");
await clickSlot("Grip");
await searchAndClick("Vortex Grip");
await clickSlot("Switch");
await searchAndClick("Rook Switch");
await clickSlot("Blade");
await searchAndClick("1\" Pixel Blade");
await clickSlot("Pommel");
await searchAndClick("Guardian Double Connector");
await page.screenshot({ path: new URL("30-connector.png", outDir).pathname });

const hasBtn = await page.evaluate(() =>
  [...document.querySelectorAll(".stage-tools button")].some((b) =>
    /double bladed/i.test(b.textContent)
  )
);
await page.evaluate(() => {
  [...document.querySelectorAll(".stage-tools button")]
    .find((b) => /double bladed/i.test(b.textContent))
    .click();
});
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: new URL("31-staff.png", outDir).pathname });

await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: new URL("32-staff-blades.png", outDir).pathname });

const info = await page.evaluate(() => ({
  saberToggle: !!document.querySelector(".saber-toggle"),
  ignite: [...document.querySelectorAll(".stage-tools button")].map((b) => b.textContent.trim()),
  bLines: [...document.querySelectorAll(".lines em")].filter((e) =>
    /saber b/i.test(e.textContent)
  ).length,
}));
const realErrors = errors.filter((e) => !/404|Failed to load resource/.test(e));
console.log(JSON.stringify({ hasBtn, info, realErrors }, null, 2));
await browser.close();
if (!hasBtn || !info.saberToggle || realErrors.length) process.exit(1);
