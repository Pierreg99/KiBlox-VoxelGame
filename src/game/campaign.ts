import { BASALT, DIRT, GRASS, ICE, LAVA, SNOW, WATER } from "./constants";
import type { EnemyKind } from "./world";

export type PlanetId = "verdant" | "terra" | "cinder" | "rime" | "aether";
export type SpeciesId = "solari" | "veldari" | "cryon" | "automata" | "thrynn" | "aetheri";
export type Stage = "intro" | "gather" | "boss" | "warp" | "finale" | "done";

export type StoryLine = {
  speaker: string;
  species: SpeciesId;
  text: string;
  portrait: string;
};

export type PlanetDef = {
  id: PlanetId;
  name: string;
  subtitle: string;
  blurb: string;
  fog: number;
  bg: number;
  sun: number;
  hemiSky: number;
  hemiGround: number;
  skyUrl: string;
  surface: number;
  dirt: number;
  liquid: number;
  islandR: number;
  trees: number;
  clouds: number;
  spikes: "none" | "ice" | "basalt";
  enemyMix: { kind: EnemyKind; w: number }[];
  boss: { kind: EnemyKind; name: string; species: SpeciesId; power: number };
  npc: { name: string; species: SpeciesId; portrait: string; lines: string[] };
  intro: StoryLine[];
};

export const SPECIES: Record<
  SpeciesId,
  { name: string; body: number; head: number; accent: number; eye: number }
> = {
  solari: { name: "Solari", body: 0xc8a070, head: 0xe2c8a8, accent: 0xe8b923, eye: 0x1a1208 },
  veldari: { name: "Veldari", body: 0x4a9a3a, head: 0x3d7a32, accent: 0x2a5524, eye: 0x111111 },
  cryon: { name: "Cryon", body: 0xd0d8e8, head: 0xe8eef6, accent: 0x6a4aaa, eye: 0x70e0ff },
  automata: { name: "Automata", body: 0x8a9098, head: 0xb0b4b8, accent: 0x5a2020, eye: 0xe04030 },
  thrynn: { name: "Thrynn", body: 0x8a5a2a, head: 0x6a3a18, accent: 0xc4a060, eye: 0xe8b923 },
  aetheri: { name: "Aetheri", body: 0x7ec8e8, head: 0xd8f4ff, accent: 0x3a6a9a, eye: 0xffffff },
};

export const PLANET_ORDER: PlanetId[] = ["verdant", "terra", "cinder", "rime", "aether"];

export const PLANETS: Record<PlanetId, PlanetDef> = {
  verdant: {
    id: "verdant",
    name: "Verdant",
    subtitle: "Die grüne Welt",
    blurb: "Moosinseln, Schirmbäume, das Dorf der Veldari.",
    fog: 0x7ed4c4,
    bg: 0x6ec8b8,
    sun: 0xfff1c8,
    hemiSky: 0xd8fff4,
    hemiGround: 0x2a3a24,
    skyUrl: "/game/sky-verdant.jpg",
    surface: GRASS,
    dirt: DIRT,
    liquid: WATER,
    islandR: 0.7,
    trees: 220,
    clouds: 8,
    spikes: "none",
    enemyMix: [
      { kind: "grunt", w: 0.28 },
      { kind: "shooter", w: 0.36 },
      { kind: "brute", w: 0.22 },
      { kind: "flyer", w: 0.14 },
    ],
    boss: { kind: "elite", name: "Rax", species: "cryon", power: 6800 },
    npc: {
      name: "Ältester Venn",
      species: "veldari",
      portrait: "/game/portrait-venn.jpg",
      lines: [
        "Fremder Solari. Die Cryon haben unsere Kugeln verstreut.",
        "Sieben Sterne. Ein Wunsch. Dann öffnet sich das Tor.",
        "Rax, ihr Späher-Hauptmann, wartet am Tempel. Sei vorsichtig.",
      ],
    },
    intro: [
      {
        speaker: "Ältester Venn",
        species: "veldari",
        portrait: "/game/portrait-venn.jpg",
        text: "Verdant stirbt nicht an Feuer. Es stirbt an Stille — seit die Cryon landeten.",
      },
      {
        speaker: "Ältester Venn",
        species: "veldari",
        portrait: "/game/portrait-venn.jpg",
        text: "Sammle die sieben Kugeln. Besiege Rax. Orryx hört nur den, der beides trägt.",
      },
    ],
  },
  terra: {
    id: "terra",
    name: "Terra",
    subtitle: "Die blaue Wiege",
    blurb: "Kontinente, Lehmstädte, Automata-Schrott aus einem alten Krieg.",
    fog: 0xa8c8e0,
    bg: 0x7aa8d0,
    sun: 0xfff4dc,
    hemiSky: 0xe8f0ff,
    hemiGround: 0x3a4a30,
    skyUrl: "/game/sky-terra.jpg",
    surface: GRASS,
    dirt: DIRT,
    liquid: WATER,
    islandR: 1.15,
    trees: 160,
    clouds: 6,
    spikes: "none",
    enemyMix: [
      { kind: "shooter", w: 0.38 },
      { kind: "brute", w: 0.32 },
      { kind: "elite", w: 0.12 },
      { kind: "grunt", w: 0.18 },
    ],
    boss: { kind: "elite", name: "Einheit Sieben", species: "automata", power: 8600 },
    npc: {
      name: "Archivarin Lira",
      species: "solari",
      portrait: "/game/portrait-lira.jpg",
      lines: [
        "Terra hat den Krieg überlebt. Die Automata nicht ihre Befehle.",
        "Einheit Sieben bewacht die letzte Kugelkette im Steinbruch.",
      ],
    },
    intro: [
      {
        speaker: "Archivarin Lira",
        species: "solari",
        portrait: "/game/portrait-lira.jpg",
        text: "Willkommen auf der Wiege. Hier lernten die Solari das Fliegen — und das Verlieren.",
      },
    ],
  },
  cinder: {
    id: "cinder",
    name: "Cinder",
    subtitle: "Die Glut",
    blurb: "Basalt, Lavaflüsse, Thrynn-Söldner im Sold der Cryon.",
    fog: 0x6a3020,
    bg: 0x4a1810,
    sun: 0xff8844,
    hemiSky: 0xffc8a0,
    hemiGround: 0x2a1008,
    skyUrl: "/game/sky-cinder.jpg",
    surface: BASALT,
    dirt: BASALT,
    liquid: LAVA,
    islandR: 0.78,
    trees: 0,
    clouds: 4,
    spikes: "basalt",
    enemyMix: [
      { kind: "brute", w: 0.42 },
      { kind: "shooter", w: 0.28 },
      { kind: "flyer", w: 0.18 },
      { kind: "elite", w: 0.12 },
    ],
    boss: { kind: "elite", name: "Skarn", species: "thrynn", power: 11800 },
    npc: {
      name: "Schmiedin Oru",
      species: "thrynn",
      portrait: "/game/portrait-oru.jpg",
      lines: [
        "Skarn verkaufte den Klan an Veyra. Hol ihn vom Spieß.",
        "Lava trägt kein Ki. Flieg, oder verbrenn.",
      ],
    },
    intro: [
      {
        speaker: "Schmiedin Oru",
        species: "thrynn",
        portrait: "/game/portrait-oru.jpg",
        text: "Cinder kennt keine Gnade. Nur Glut, Horn und Vertrag.",
      },
    ],
  },
  rime: {
    id: "rime",
    name: "Rime",
    subtitle: "Der Frostthron",
    blurb: "Gletscher, Eisspitzen, der Hof der Cryon.",
    fog: 0xb8d0e8,
    bg: 0x8ab0d0,
    sun: 0xe8f4ff,
    hemiSky: 0xf4fbff,
    hemiGround: 0x2a3a4a,
    skyUrl: "/game/sky-rime.jpg",
    surface: SNOW,
    dirt: ICE,
    liquid: ICE,
    islandR: 0.72,
    trees: 40,
    clouds: 10,
    spikes: "ice",
    enemyMix: [
      { kind: "shooter", w: 0.3 },
      { kind: "flyer", w: 0.32 },
      { kind: "elite", w: 0.22 },
      { kind: "brute", w: 0.16 },
    ],
    boss: { kind: "lord", name: "Hohe Veyra", species: "cryon", power: 16200 },
    npc: {
      name: "Läufer Nyx",
      species: "aetheri",
      portrait: "/game/portrait-nyx.jpg",
      lines: [
        "Veyra sitzt im Eispalast. Sie nennt Verdant eine Ernte.",
        "Brich ihren Ki-Mantel. Dann fällt der Thron.",
      ],
    },
    intro: [
      {
        speaker: "Läufer Nyx",
        species: "aetheri",
        portrait: "/game/portrait-nyx.jpg",
        text: "Rime atmet kalt. Die Cryon wurden hier nicht geboren — sie wurden geschliffen.",
      },
    ],
  },
  aether: {
    id: "aether",
    name: "Aether",
    subtitle: "Die Warte",
    blurb: "Wolkeninseln über dem Orbit. Orryx wartet auf den letzten Wunsch.",
    fog: 0x6a88c0,
    bg: 0x1a2040,
    sun: 0xffe8a0,
    hemiSky: 0xc8d8ff,
    hemiGround: 0x101428,
    skyUrl: "/game/sky-aether.jpg",
    surface: GRASS,
    dirt: DIRT,
    liquid: WATER,
    islandR: 0.42,
    trees: 80,
    clouds: 14,
    spikes: "none",
    enemyMix: [
      { kind: "flyer", w: 0.42 },
      { kind: "shooter", w: 0.26 },
      { kind: "elite", w: 0.24 },
      { kind: "brute", w: 0.08 },
    ],
    boss: { kind: "lord", name: "Lord Kryll", species: "cryon", power: 24000 },
    npc: {
      name: "Wächterin Aeon",
      species: "aetheri",
      portrait: "/game/portrait-aeon.jpg",
      lines: [
        "Hier endet die Jagd. Kryll will den Wunsch selbst.",
        "Sieben Kugeln. Ein Herr. Dann spricht Orryx wahr.",
      ],
    },
    intro: [
      {
        speaker: "Wächterin Aeon",
        species: "aetheri",
        portrait: "/game/portrait-aeon.jpg",
        text: "Die Warte hängt zwischen Welten. Wer hier wünscht, formt alle fünf.",
      },
    ],
  },
};

export function planetIndex(id: PlanetId) {
  return PLANET_ORDER.indexOf(id);
}

export function nextPlanet(id: PlanetId): PlanetId | null {
  const i = planetIndex(id);
  return i >= 0 && i < PLANET_ORDER.length - 1 ? PLANET_ORDER[i + 1]! : null;
}

export function pickKind(mix: { kind: EnemyKind; w: number }[], rng: () => number): EnemyKind {
  let r = rng();
  for (const m of mix) {
    r -= m.w;
    if (r <= 0) return m.kind;
  }
  return mix[0]?.kind ?? "grunt";
}

export function speciesFor(kind: EnemyKind, planet: PlanetId): SpeciesId {
  if (kind === "brute") return planet === "cinder" ? "thrynn" : "thrynn";
  if (kind === "shooter") return planet === "terra" || planet === "cinder" ? "automata" : "cryon";
  if (kind === "flyer") return planet === "aether" ? "aetheri" : "cryon";
  if (kind === "elite" || kind === "lord") return PLANETS[planet].boss.species;
  if (planet === "verdant") return rngBit(kind) ? "veldari" : "cryon";
  return "cryon";
}

function rngBit(kind: EnemyKind) {
  return kind === "grunt";
}

export function kindLabel(kind: EnemyKind, species: SpeciesId) {
  if (kind === "lord") return `${SPECIES[species].name}-Fürst`;
  if (kind === "elite") return `${SPECIES[species].name}-Elite`;
  if (kind === "brute") return `${SPECIES[species].name}-Brutaler`;
  if (kind === "flyer") return `${SPECIES[species].name}-Jäger`;
  if (kind === "shooter") return `${SPECIES[species].name}-Schütze`;
  return `${SPECIES[species].name}-Späher`;
}
