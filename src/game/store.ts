import { create } from "zustand";
import { BALL_COUNT, HOTBAR, MAX_ENERGY, MAX_HEALTH, START_POWER } from "./constants";
import type { PlanetId, Stage } from "./campaign";
import type { GameMode } from "./quests";

export type Phase =
  | "title"
  | "loading"
  | "playing"
  | "paused"
  | "wish"
  | "dead"
  | "story"
  | "warp"
  | "inventory"
  | "quests"
  | "rules";

export type RadarBlip = { id: number; angle: number; dist: number; stars: number };

export type QuestRow = {
  id: string;
  title: string;
  hint: string;
  value: number;
  target: number;
  complete: boolean;
};

export type HudState = {
  phase: Phase;
  loadProgress: number;
  health: number;
  maxHealth: number;
  power: number;
  flying: boolean;
  superSaiyan: boolean;
  ssjReady: boolean;
  balls: boolean[];
  selected: number;
  hotbar: number[];
  inventory: number[];
  toast: string | null;
  target: string | null;
  radar: RadarBlip[];
  lookPower: number | null;
  muted: boolean;
  hasSave: boolean;
  isTouch: boolean;
  wishReady: boolean;
  ballsGot: number;
  energy: number;
  maxEnergy: number;
  charge: number;
  mining: number;
  dashReady: boolean;
  combo: number;
  campaign: boolean;
  mode: GameMode;
  planet: PlanetId;
  planetName: string;
  stage: Stage;
  quest: string;
  questHint: string;
  questValue: number;
  questTarget: number;
  questDone: number;
  questTotal: number;
  questList: QuestRow[];
  storySpeaker: string;
  storyText: string;
  storyPortrait: string;
  lookName: string | null;
  unlocked: PlanetId[];
  npcHint: boolean;
};

const initial: HudState = {
  phase: "loading",
  loadProgress: 0,
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  power: START_POWER,
  flying: false,
  superSaiyan: false,
  ssjReady: false,
  balls: Array.from({ length: BALL_COUNT }, () => false),
  selected: 0,
  hotbar: [...HOTBAR],
  inventory: Array.from({ length: 20 }, () => 0),
  toast: null,
  target: null,
  radar: [],
  lookPower: null,
  muted: false,
  hasSave: false,
  isTouch: false,
  wishReady: false,
  ballsGot: 0,
  energy: MAX_ENERGY,
  maxEnergy: MAX_ENERGY,
  charge: 0,
  mining: 0,
  dashReady: true,
  combo: 0,
  campaign: false,
  mode: "story",
  planet: "verdant",
  planetName: "Verdant",
  stage: "intro",
  quest: "",
  questHint: "",
  questValue: 0,
  questTarget: 1,
  questDone: 0,
  questTotal: 0,
  questList: [],
  storySpeaker: "",
  storyText: "",
  storyPortrait: "",
  lookName: null,
  unlocked: ["verdant"],
  npcHint: false,
};

export const useHud = create<HudState & { patch: (p: Partial<HudState>) => void }>((set) => ({
  ...initial,
  patch: (p) => set(p),
}));
