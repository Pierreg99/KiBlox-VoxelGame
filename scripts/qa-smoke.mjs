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

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("button:has-text('Spielen'), button:has-text('Fortsetzen')", { timeout: 60000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/v4-title.png` });

const playBtn = page.getByRole("button", { name: /Spielen|Fortsetzen/ }).first();
await playBtn.click();
await page.waitForFunction(() => window.__controlsTest && window.__controlsTest.getPos, { timeout: 90000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/v4-play.png` });

const wait = (ms) => page.waitForTimeout(ms);

const probe = await page.evaluate(() => {
  const t = window.__controlsTest;
  return { pos: t.getPos(), yaw: t.getYaw(), speed: t.getSpeed(), phase: t.getPhase?.() };
});

await page.evaluate(() => {
  const t = window.__controlsTest;
  const p = t.getPos();
  t.setPose(p.x, p.y, p.z, 0, false);
  t.setKeys(["KeyW"]);
});
await wait(450);
const w = await page.evaluate(() => window.__controlsTest.getPos());

await page.evaluate(() => window.__controlsTest.setKeys([]));
await wait(80);
await page.evaluate(() => {
  const t = window.__controlsTest;
  const p = t.getPos();
  t.setPose(p.x, p.y, p.z, 0, false);
  t.setKeys(["KeyA"]);
});
await wait(450);
const a = await page.evaluate(() => window.__controlsTest.getPos());

await page.evaluate(() => window.__controlsTest.setKeys([]));
await wait(80);
await page.evaluate(() => {
  const t = window.__controlsTest;
  const p = t.getPos();
  t.setPose(p.x, p.y, p.z, 0, false);
  t.setKeys(["KeyD"]);
});
await wait(450);
const d = await page.evaluate(() => window.__controlsTest.getPos());
await page.evaluate(() => window.__controlsTest.setKeys([]));

const mined = await page.evaluate(() => {
  const t = window.__controlsTest;
  t.setLook(0, -0.55);
  return t.mineNow?.() ?? null;
});

const placed = await page.evaluate(() => {
  const t = window.__controlsTest;
  t.setLook(0, -0.35);
  return t.placeNow?.() ?? null;
});

const balls = await page.evaluate(() => window.__controlsTest.getBalls?.() ?? []);
const wishPhase = await page.evaluate(() => window.__controlsTest.takeAllBalls?.());
await wait(400);
await page.screenshot({ path: `${out}/v4-wish.png` });

const wishBtn = page.getByRole("button", { name: /Mehr Kraft/ }).first();
let wished = false;
if (await wishBtn.count()) {
  await wishBtn.click();
  await wait(400);
  wished = true;
}
const afterWish = await page.evaluate(() => window.__controlsTest.getPhase?.());

const result = {
  errors,
  probe,
  wSign: w.z < probe.pos.z,
  aSign: a.x < w.x || a.x < probe.pos.x,
  dSign: d.x > a.x,
  mined,
  placed,
  ballCount: balls.length,
  wishPhase,
  wished,
  afterWish,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (errors.length) process.exit(2);
if (!result.wSign || result.ballCount !== 7 || wishPhase !== "wish" || afterWish !== "playing") {
  process.exit(3);
}
