import { MAX_ENERGY, MAX_HEALTH, SAVE_KEY, SAVE_VERSION, START_POWER } from "./constants";
import type { PlanetId, Stage } from "./campaign";

export type SaveData = {
  version: number;
  seed: number;
  power: number;
  health: number;
  energy: number;
  flying: boolean;
  superSaiyan: boolean;
  balls: boolean[];
  edits: [number, number, number, number][];
  pos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  selected: number;
  planet: PlanetId;
  campaign: boolean;
  stage: Stage;
  unlocked: PlanetId[];
  bossDown: PlanetId[];
};

const defaults = (): SaveData => ({
  version: SAVE_VERSION,
  seed: (Math.random() * 1e9) | 0,
  power: START_POWER,
  health: MAX_HEALTH,
  energy: MAX_ENERGY,
  flying: false,
  superSaiyan: false,
  balls: [false, false, false, false, false, false, false],
  edits: [],
  pos: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  selected: 0,
  planet: "verdant",
  campaign: false,
  stage: "intro",
  unlocked: ["verdant"],
  bossDown: [],
});

function migrate(raw: Partial<SaveData>): SaveData {
  const d = defaults();
  return {
    ...d,
    ...raw,
    version: SAVE_VERSION,
    energy: typeof raw.energy === "number" ? raw.energy : MAX_ENERGY,
    balls: raw.balls?.length === 7 ? raw.balls : d.balls,
    edits: Array.isArray(raw.edits) ? raw.edits.slice(-2500) : [],
    planet: raw.planet ?? "verdant",
    campaign: !!raw.campaign,
    stage: raw.stage ?? "intro",
    unlocked: raw.unlocked?.length ? raw.unlocked : ["verdant"],
    bossDown: Array.isArray(raw.bossDown) ? raw.bossDown : [],
  };
}

export function loadSave(): SaveData | null {
  try {
    const t = localStorage.getItem(SAVE_KEY);
    if (!t) return null;
    const parsed = JSON.parse(t) as SaveData;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData) {
  try {
    const blob: SaveData = { ...data, version: SAVE_VERSION, edits: data.edits.slice(-2500) };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  } catch {
    /* quota / private mode */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}
