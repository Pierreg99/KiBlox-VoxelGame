import { create } from "zustand";
import { BALL_COUNT, HOTBAR, MAX_ENERGY, MAX_HEALTH, START_POWER } from "./constants";

export type Phase = "title" | "loading" | "playing" | "paused" | "wish" | "dead";

export type RadarBlip = { id: number; angle: number; dist: number; stars: number };

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
};

export const useHud = create<HudState & { patch: (p: Partial<HudState>) => void }>((set) => ({
  ...initial,
  patch: (p) => set(p),
}));
