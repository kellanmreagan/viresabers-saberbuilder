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
await page.screenshot({ path: new URL("20-no-blade.png", outDir).pathname });

const toolsBefore = await page.evaluate(() => ({
  ignite: [...document.querySelectorAll(".stage-tools button")].some((b) =>
    /ignite|retract/i.test(b.textContent)
  ),
  swatches: !!document.querySelector(".swatches"),
}));

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
  await new Promise((r) => setTimeout(r, 500));
}

await clickSlot("Emitter");
await searchAndClick("Fang Emitter");
await clickSlot("Pommel");
await searchAndClick("Nova Pommel");
await clickSlot("Grip");
await searchAndClick("Vortex Grip");
await page.screenshot({ path: new URL("21-hilt-only.png", outDir).pathname });

await clickSlot("Blade");
await searchAndClick("1\" Pixel Blade");
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: new URL("22-long-blade.png", outDir).pathname });

const toolsAfter = await page.evaluate(() => ({
  ignite: [...document.querySelectorAll(".stage-tools button")].some((b) =>
    /ignite|retract/i.test(b.textContent)
  ),
  swatches: !!document.querySelector(".swatches"),
}));

const realErrors = errors.filter((e) => !/404|Failed to load resource|validateDOMNesting/.test(e));
console.log(JSON.stringify({ toolsBefore, toolsAfter, realErrors }, null, 2));
await browser.close();
if (toolsBefore.ignite || toolsBefore.swatches) process.exit(1);
if (!toolsAfter.ignite || !toolsAfter.swatches) process.exit(1);
if (realErrors.length) process.exit(1);
