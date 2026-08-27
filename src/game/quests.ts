import {
  BASALT,
  BLOCK_COUNT,
  CLOUD,
  ICE,
  KI,
  METAL,
  SSJ_POWER,
  TEMPLE,
} from "./constants";
import { PLANETS, type PlanetId, type Stage } from "./campaign";

export type GameMode = "story" | "creative" | "sandbox";

export type QuestId = string;

export type QuestDef = {
  id: QuestId;
  title: string;
  hint: string;
  target: number;
};

export type QuestStats = {
  mined: number;
  placed: number;
  kills: number;
  types: number;
  tower: number;
  temple: number;
  balls: number;
  power: number;
  flown: boolean;
  talked: boolean;
  bossDown: boolean;
  wished: boolean;
  sky: boolean;
};

export type QuestView = {
  title: string;
  hint: string;
  value: number;
  target: number;
  done: number;
  total: number;
  list: { id: QuestId; title: string; hint: string; value: number; target: number; complete: boolean }[];
};

export const MODE_META: Record<GameMode, { name: string; tag: string; blurb: string; rules: string[] }> = {
  story: {
    name: "Kampagne",
    tag: "Orbit-Saga",
    blurb: "Fünf Welten. Bewachte Kugeln. Ein Wunsch, der Tore öffnet — wenn du überlebst.",
    rules: [
      "Kampagne ist hart. Späher bewachen die Kugeln. Treffer zählen.",
      "Rede mit dem Ältesten (E). Dann Radar, sieben Sterne, Wächter, Wunsch.",
      "Ki verdient man sich. Super Saiyan erst spät (4500). Wunsch auf Kraft gibt wenig.",
      "Sturz und Lava töten. I-Frames sind kurz. Ausweichen, laden, treffen.",
      "Abbauen füllt das Inventar. Setzen verbraucht Blöcke.",
      "W vor, A links, D rechts, S zurück. Shift schleichen. Strg sprinten. Z zoomen.",
      "I Inventar · J Aufgaben · H Regeln · ESC Pause.",
    ],
  },
  creative: {
    name: "Kreativ",
    tag: "Bauen ohne Limit",
    blurb: "Unendliche Blöcke, kein Schaden. Aufgaben formen die Insel.",
    rules: [
      "Alle Blöcke sind frei. Nichts trifft dich.",
      "Linksklick bricht, Rechtsklick setzt. I wählt den Block.",
      "Leertaste in der Luft startet Ki-Flug. W vor, A links, D rechts, S zurück. Leertaste hoch, Shift runter, Strg schneller. Z zoomen.",
      "Aufgaben stehen oben. J öffnet die Liste.",
      "1–9 Hotbar · ESC Pause · H Regeln.",
    ],
  },
  sandbox: {
    name: "Freies Spiel",
    tag: "Jagd & Bau",
    blurb: "Kugeln, Kampf und Bau auf einer Welt — ohne Kampagnen-Tor.",
    rules: [
      "Sammle sieben Kugeln für einen Wunsch.",
      "Besiege Späher, schöpfe Ki, werde Super Saiyan (F ab 4500).",
      "Abbauen füllt das Inventar. Ohne Vorrat kein Setzen.",
      "W vor, A links, D rechts, S zurück. Shift schleichen. Strg sprinten. Leertaste hoch, Shift runter im Flug.",
      "I Inventar · J Aufgaben · H Regeln · ESC Pause.",
    ],
  },
};

export function emptyStats(): QuestStats {
  return {
    mined: 0,
    placed: 0,
    kills: 0,
    types: 0,
    tower: 0,
    temple: 0,
    balls: 0,
    power: 0,
    flown: false,
    talked: false,
    bossDown: false,
    wished: false,
    sky: false,
  };
}

export function emptyInv(): number[] {
  return Array.from({ length: BLOCK_COUNT }, () => 0);
}

export function starterInv(): number[] {
  const a = emptyInv();
  a[1] = 16; // grass
  a[2] = 16; // dirt
  a[3] = 12; // stone
  a[4] = 8; // sand
  a[5] = 10; // wood
  a[7] = 3; // ki
  return a;
}

export function campaignInv(): number[] {
  const a = emptyInv();
  a[1] = 8;
  a[2] = 6;
  a[3] = 4;
  a[5] = 4;
  a[7] = 1;
  return a;
}

export function countTypes(inv: number[]): number {
  let n = 0;
  for (let i = 1; i < inv.length; i++) if ((inv[i] ?? 0) > 0) n++;
  return n;
}

export function storyQuests(planet: PlanetId): QuestDef[] {
  const p = PLANETS[planet];
  return [
    { id: `${planet}-talk`, title: `Sprich mit ${p.npc.name}`, hint: "Nah heran, dann E", target: 1 },
    { id: `${planet}-orbs`, title: "Sieben Sternenkugeln", hint: "Dem Radar folgen", target: 7 },
    { id: `${planet}-boss`, title: `Besiege ${p.boss.name}`, hint: "Am Tempel der Welt", target: 1 },
    { id: `${planet}-wish`, title: "Wunsch an Orryx", hint: "Sieben Sterne, ein Herr", target: 1 },
  ];
}

export const CREATIVE_QUESTS: QuestDef[] = [
  { id: "creat-mine", title: "Erster Bruch", hint: "Baue 24 Blöcke ab", target: 24 },
  { id: "creat-place", title: "Erste Mauer", hint: "Setze 16 Blöcke", target: 16 },
  { id: "creat-palette", title: "Palette", hint: "Halte 8 Blockarten im Beutel", target: 8 },
  { id: "creat-tower", title: "Turm", hint: "Setze 8 Blöcke über dem Spawn", target: 8 },
  { id: "creat-fly", title: "Ki-Flug", hint: "Spring in der Luft ein zweites Mal", target: 1 },
  { id: "creat-temple", title: "Heiligtum", hint: "Setze 12 Tempel-, Metall- oder Ki-Steine", target: 12 },
  { id: "creat-sky", title: "Wolkenkante", hint: "Flieg hoch oder tritt auf Wolkenflaum", target: 1 },
];

export const SANDBOX_QUESTS: QuestDef[] = [
  { id: "sand-orbs", title: "Sieben Kugeln", hint: "Dem Radar folgen", target: 7 },
  { id: "sand-kills", title: "Späher jagen", hint: "Besiege 5 Gegner", target: 5 },
  { id: "sand-place", title: "Lager bauen", hint: "Setze 12 Blöcke", target: 12 },
  { id: "sand-ssj", title: "Super Saiyan", hint: "Erreiche 4500 Ki, dann F", target: 1 },
];

export function chainFor(mode: GameMode, planet: PlanetId): QuestDef[] {
  if (mode === "story") return storyQuests(planet);
  if (mode === "creative") return CREATIVE_QUESTS;
  return SANDBOX_QUESTS;
}

export function valueOf(id: QuestId, s: QuestStats): number {
  if (id.endsWith("-talk")) return s.talked ? 1 : 0;
  if (id.endsWith("-orbs") || id === "sand-orbs") return s.balls;
  if (id.endsWith("-boss")) return s.bossDown ? 1 : 0;
  if (id.endsWith("-wish")) return s.wished ? 1 : 0;
  if (id === "creat-mine") return s.mined;
  if (id === "creat-place" || id === "sand-place") return s.placed;
  if (id === "creat-palette") return s.types;
  if (id === "creat-tower") return s.tower;
  if (id === "creat-fly") return s.flown ? 1 : 0;
  if (id === "creat-temple") return s.temple;
  if (id === "creat-sky") return s.sky ? 1 : 0;
  if (id === "sand-kills") return s.kills;
  if (id === "sand-ssj") return s.power >= SSJ_POWER ? 1 : 0;
  return 0;
}

function storyActive(planet: PlanetId, stage: Stage): QuestId | null {
  if (stage === "intro") return `${planet}-talk`;
  if (stage === "gather") return `${planet}-orbs`;
  if (stage === "boss") return `${planet}-boss`;
  if (stage === "warp" || stage === "finale") return `${planet}-wish`;
  return null;
}

export function describeQuest(
  mode: GameMode,
  planet: PlanetId,
  stage: Stage,
  stats: QuestStats,
  done: QuestId[],
): QuestView {
  const chain = chainFor(mode, planet);
  const doneSet = new Set(done);
  const list = chain.map((q) => {
    const value = Math.min(q.target, valueOf(q.id, stats));
    const complete = doneSet.has(q.id) || value >= q.target;
    return { id: q.id, title: q.title, hint: q.hint, value: complete ? q.target : value, target: q.target, complete };
  });
  const finished = list.filter((q) => q.complete).length;
  let active = list.find((q) => !q.complete) ?? null;
  if (mode === "story") {
    const sid = storyActive(planet, stage);
    active = sid ? (list.find((q) => q.id === sid) ?? active) : null;
    if (stage === "done") active = null;
  }
  if (!active) {
    return {
      title: mode === "story" ? "Orbit-Saga beendet" : "Alle Aufgaben erfüllt",
      hint: mode === "creative" ? "Baue weiter, die Insel ist dein" : "Freies Spiel bleibt offen",
      value: 1,
      target: 1,
      done: chain.length,
      total: chain.length,
      list,
    };
  }
  return {
    title: active.title,
    hint: active.hint,
    value: active.value,
    target: active.target,
    done: finished,
    total: chain.length,
    list,
  };
}

export function completeReady(chain: QuestDef[], stats: QuestStats, done: QuestId[]): QuestDef | null {
  const doneSet = new Set(done);
  for (const q of chain) {
    if (doneSet.has(q.id)) continue;
    if (valueOf(q.id, stats) >= q.target) return q;
    return null;
  }
  return null;
}

export function isSacred(block: number) {
  return block === TEMPLE || block === METAL || block === KI || block === ICE || block === BASALT;
}

export function isCloud(block: number) {
  return block === CLOUD;
}
