import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const out = "/workspace/screenshots";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(url + `?qa=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("button:has-text('Kampagne'), button:has-text('Fortsetzen')", { timeout: 90000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/v51-title.png` });

const fortsetzen = page.getByRole("button", { name: "Fortsetzen", exact: true });
const kampagne = page.getByRole("button", { name: "Kampagne", exact: true });
if (await fortsetzen.count()) await fortsetzen.click();
else if (await kampagne.count()) await kampagne.click();
else await page.getByRole("button", { name: "Neue Kampagne", exact: true }).click();

await page.waitForTimeout(800);
for (let i = 0; i < 6; i++) {
  const weiter = page.getByRole("button", { name: "Weiter", exact: true });
  if (await weiter.count()) {
    await weiter.click({ force: true });
    await page.waitForTimeout(250);
  } else break;
}

await page.waitForFunction(() => window.__controlsTest && window.__controlsTest.getPhase?.() === "playing", {
  timeout: 90000,
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/v51-play.png` });

const start = await page.evaluate(() => window.__controlsTest.getPos());
await page.evaluate(() => {
  const t = window.__controlsTest;
  const p = t.getPos();
  t.setPose(p.x, p.y + 1.15, p.z, 0, false);
});
await page.waitForTimeout(1200);
const afterHop = await page.evaluate(() => window.__controlsTest.getPos());

await page.evaluate(() => {
  const t = window.__controlsTest;
  const p = t.getPos();
  t.setPose(p.x, 0.2, p.z, 0, false);
});
await page.waitForTimeout(200);
const afterVoid = await page.evaluate(() => window.__controlsTest.getPos());

const stuckBedrock = afterHop.y < 1.6 || afterVoid.y < 1.6;
const fellThrough = afterHop.y < start.y - 2.2;
const didNotLand = afterHop.y > start.y + 1.3;
const rescued = afterVoid.y > start.y - 3 && afterVoid.y < start.y + 6;
const ok = !stuckBedrock && !fellThrough && !didNotLand && rescued;

await page.screenshot({ path: `${out}/v51-after-fall.png` });

const report = {
  ok,
  errors,
  startY: start.y,
  landY: afterHop.y,
  voidY: afterVoid.y,
  stuckBedrock,
  fellThrough,
  didNotLand,
  rescued,
};
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (!ok || errors.length) process.exit(1);
