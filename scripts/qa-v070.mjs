import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await context.addInitScript(() => {
  try {
    localStorage.removeItem("kiblox-save-v7");
    localStorage.removeItem("kiblox-save-v6");
    localStorage.removeItem("kiblox-save-v5");
  } catch {
    /* ignore */
  }
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto("http://127.0.0.1:8080/?qa=v070", { waitUntil: "domcontentloaded", timeout: 25000 });
await page.getByRole("button", { name: "Kampagne", exact: true }).waitFor({ timeout: 40000 });
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/v070-title.png", timeout: 12000 });
const titleVer = await page.locator("text=0.7.0").first().isVisible().catch(() => false);

await page.getByRole("button", { name: "Kampagne", exact: true }).click();
const rulesBtn = page.getByRole("button", { name: "Verstanden", exact: true });
await rulesBtn.waitFor({ timeout: 40000 });
await page.waitForTimeout(200);
await page.screenshot({ path: "/workspace/screenshots/v070-rules.png", timeout: 12000 });
await rulesBtn.click({ force: true });

for (let i = 0; i < 6; i++) {
  const weiter = page.getByRole("button", { name: "Weiter", exact: true });
  try {
    await weiter.waitFor({ timeout: 4000 });
    await weiter.click({ force: true });
    await page.waitForTimeout(180);
  } catch {
    break;
  }
}

await page.waitForTimeout(600);
const phase = await page.evaluate(() => window.__controlsTest?.getPhase?.());
console.log("phase after story", phase);

await page.evaluate(() => window.__controlsTest?.openPanel?.("inventory"));
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/v070-inventory.png", timeout: 12000 });
const bag = await page.locator("text=Waffen und Vorrat").first().isVisible().catch(() => false);
const fists = await page.locator("text=Fäuste").first().isVisible().catch(() => false);
const pick = await page.locator("text=Spitzhacke").first().isVisible().catch(() => false);

const combat = await page.evaluate(() => window.__controlsTest?.getCombat?.());
const inv = await page.evaluate(() => window.__controlsTest?.getInv?.());
const cam = await page.evaluate(() => window.__controlsTest?.getCam?.());

const out = {
  titleVer,
  bag,
  fists,
  pick,
  phase,
  held: combat?.held,
  weapon: combat?.weapon,
  landmarks: combat?.landmarks,
  invFist: inv?.[20],
  invPick: inv?.[23],
  invBean: inv?.[25],
  parented: cam?.parented,
  orbiting: cam?.orbiting,
  camLocal: cam ? [cam.camLocalX, cam.camLocalY, cam.camLocalZ] : null,
  errors,
};
console.log(JSON.stringify(out, null, 2));

if (!titleVer) throw new Error("title missing 0.7.0");
if (!bag || !fists) throw new Error("inventory missing gear");
if (!combat?.landmarks?.length) throw new Error("no landmarks");
if ((inv?.[20] ?? 0) < 1) throw new Error("no fists in bag");
if (cam && cam.orbiting) throw new Error("camera orbiting");
if (cam && cam.parented === false) throw new Error("camera not parented");
if (errors.length) throw new Error("console: " + errors.join(" | "));

await browser.close();
console.log("qa-v070 ok");
