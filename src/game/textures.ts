import * as THREE from "three";
import {
  AIR,
  BASALT,
  BEDROCK,
  CLAY,
  CLOUD,
  DIRT,
  GRASS,
  ICE,
  KI,
  LAVA,
  LEAVES,
  METAL,
  MOSS,
  PATH,
  SAND,
  SNOW,
  STONE,
  TEMPLE,
  WATER,
  WOOD,
} from "./constants";

const TILE = 64;
const COLS = 4;
const ROWS = 8;
const ATLAS_W = TILE * COLS;
const ATLAS_H = TILE * ROWS;

function hash(n: number) {
  n = (n ^ 61) ^ (n >>> 16);
  n = Math.imul(n, 9);
  n = n + (n << 3);
  n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}

function wrap(i: number, n: number) {
  return ((i % n) + n) % n;
}

function hash2(x: number, y: number) {
  return hash(wrap(x | 0, TILE) * 374761 + wrap(y | 0, TILE) * 668265);
}

/** Seamless value noise. `cell` (px) must divide TILE. */
function valueNoise(px: number, py: number, cell: number) {
  const period = TILE / cell;
  const x = px / cell;
  const y = py / cell;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const x0 = wrap(xi, period);
  const x1 = wrap(xi + 1, period);
  const y0 = wrap(yi, period);
  const y1 = wrap(yi + 1, period);
  const a = hash(x0 * 374761 + y0 * 668265);
  const b = hash(x1 * 374761 + y0 * 668265);
  const c = hash(x0 * 374761 + y1 * 668265);
  const d = hash(x1 * 374761 + y1 * 668265);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number) {
  return valueNoise(x, y, 16) * 0.5 + valueNoise(x, y, 8) * 0.32 + valueNoise(x, y, 4) * 0.18;
}

function rgb(r: number, g: number, b: number): [number, number, number] {
  return [clamp255(r), clamp255(g), clamp255(b)];
}

function waveX(x: number, periods: number) {
  return Math.sin(((x + 0.5) / TILE) * Math.PI * 2 * periods);
}

function waveY(y: number, periods: number) {
  return Math.sin(((y + 0.5) / TILE) * Math.PI * 2 * periods);
}

function setPx(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
) {
  const i = (y * ATLAS_W + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

function tileOrigin(id: number) {
  return { tx: (id % COLS) * TILE, ty: Math.floor(id / COLS) * TILE };
}

function fillTile(
  data: Uint8ClampedArray,
  id: number,
  fn: (lx: number, ly: number) => [number, number, number],
) {
  const { tx, ty } = tileOrigin(id);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const [r, g, b] = fn(x, y);
      setPx(data, tx + x, ty + y, r, g, b);
    }
  }
}

function clamp255(n: number) {
  return n < 0 ? 0 : n > 255 ? 255 : n | 0;
}

/** Atlas tile indices — match public/game/atlas.png */
export const TILE_GRASS_TOP = 0;
export const TILE_GRASS_SIDE = 1;
export const TILE_DIRT = 2;
export const TILE_STONE = 3;
export const TILE_SAND = 4;
export const TILE_WOOD = 5;
export const TILE_LEAVES = 6;
export const TILE_KI = 7;
export const TILE_BEDROCK = 8;
export const TILE_WATER = 9;
export const TILE_MOSS = 10;
export const TILE_TEMPLE = 11;
export const TILE_CLAY = 12;
export const TILE_CLOUD = 13;
export const TILE_WOOD_TOP = 14;
export const TILE_PATH = 15;
export const TILE_SNOW = 16;
export const TILE_ICE = 17;
export const TILE_LAVA = 18;
export const TILE_METAL = 19;
export const TILE_BASALT = 20;

export function faceTile(block: number, ny: number): number {
  if (block === GRASS) {
    if (ny > 0) return TILE_GRASS_TOP;
    if (ny < 0) return TILE_DIRT;
    return TILE_GRASS_SIDE;
  }
  if (block === DIRT) return TILE_DIRT;
  if (block === STONE) return TILE_STONE;
  if (block === SAND) return TILE_SAND;
  if (block === WOOD) return ny === 0 ? TILE_WOOD : TILE_WOOD_TOP;
  if (block === LEAVES) return TILE_LEAVES;
  if (block === KI) return TILE_KI;
  if (block === BEDROCK) return TILE_BEDROCK;
  if (block === WATER) return TILE_WATER;
  if (block === MOSS) return TILE_MOSS;
  if (block === TEMPLE) return TILE_TEMPLE;
  if (block === CLAY) return TILE_CLAY;
  if (block === CLOUD) return TILE_CLOUD;
  if (block === PATH) return TILE_PATH;
  if (block === SNOW) return TILE_SNOW;
  if (block === ICE) return TILE_ICE;
  if (block === LAVA) return TILE_LAVA;
  if (block === METAL) return TILE_METAL;
  if (block === BASALT) return TILE_BASALT;
  if (block === AIR) return TILE_STONE;
  return TILE_STONE;
}

function styleAtlas(tex: THREE.Texture) {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createAtlasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(ATLAS_W, ATLAS_H);
  const d = img.data;

  fillTile(d, TILE_GRASS_TOP, (x, y) => {
    const n = fbm(x, y);
    const speck = hash2(x, y);
    let r = 112 + n * 22;
    let g = 148 + n * 20;
    let b = 36 + n * 10;
    if (speck > 0.78) {
      r = 72 + n * 12;
      g = 118 + n * 16;
      b = 28;
    } else if (speck < 0.08) {
      r += 28;
      g += 10;
    }
    return rgb(r, g, b);
  });
  fillTile(d, TILE_GRASS_SIDE, (x, y) => {
    const dirtN = fbm(x, y);
    const pebble = hash2(x, y) > 0.93 ? -18 : 0;
    const dirt: [number, number, number] = [
      148 + dirtN * 16 + pebble,
      86 + dirtN * 12 + pebble,
      52 + dirtN * 8,
    ];
    if (y < 11) {
      const n = fbm(x, y);
      const blade = hash2(x, y) > 0.8 ? 18 : 0;
      return rgb(108 + n * 18 + (blade ? -18 : 8), 140 + n * 16, 34 + n * 8);
    }
    if (y < 15) {
      const t = (y - 11) / 4;
      return rgb(
        108 + (dirt[0] - 108) * t,
        140 + (dirt[1] - 140) * t,
        34 + (dirt[2] - 34) * t,
      );
    }
    return rgb(dirt[0], dirt[1], dirt[2]);
  });
  fillTile(d, TILE_DIRT, (x, y) => {
    const n = fbm(x, y);
    const pebble = hash2(x, y);
    let r = 148 + n * 18;
    let g = 86 + n * 12;
    let b = 52 + n * 8;
    if (pebble > 0.91) {
      r -= 22;
      g -= 14;
      b -= 8;
    } else if (pebble < 0.07) {
      r += 16;
      g += 10;
    }
    return rgb(r, g, b);
  });
  fillTile(d, TILE_STONE, (x, y) => {
    const n = fbm(x, y);
    const cell = valueNoise(x, y, 8);
    const crack =
      Math.abs(waveX(x, 4) * waveY(y, 3)) > 0.92 || hash2(x, y) > 0.97 ? -28 : 0;
    const g = 102 + n * 22 + (cell - 0.5) * 18 + crack;
    return rgb(g - 6, g + 2, g - 2);
  });
  fillTile(d, TILE_SAND, (x, y) => {
    const n = fbm(x, y);
    const grain = hash2(x, y);
    let r = 210 + n * 16;
    let g = 186 + n * 14;
    let b = 118 + n * 10;
    if (grain > 0.9) {
      r -= 24;
      g -= 18;
      b -= 10;
    }
    return rgb(r, g, b);
  });
  fillTile(d, TILE_WOOD, (x, y) => {
    const grain = waveX(x, 8) * 11 + (valueNoise(x, y, 8) - 0.5) * 10;
    const pith = Math.abs(waveX(x, 4)) > 0.92 ? -16 : 0;
    const knot = hash2(x, y >> 2) > 0.96 ? -22 : 0;
    const n = valueNoise(x, y, 4);
    return rgb(78 + grain + pith + knot, 54 + grain * 0.4, 86 + grain * 0.45);
  });
  fillTile(d, TILE_LEAVES, (x, y) => {
    const n = fbm(x, y);
    const hole = hash2(x, y) > 0.8;
    if (hole) return rgb(48, 78, 22);
    const vein = Math.abs(waveX(x, 6) + waveY(y, 5)) < 0.12 ? 12 : 0;
    return rgb(118 + n * 24, 158 + n * 22 + vein, 40 + n * 10);
  });
  fillTile(d, TILE_KI, (x, y) => {
    const hx = Math.abs(wrap(x + 8, 16) - 8) / 8;
    const hy = Math.abs(wrap(y + 8, 16) - 8) / 8;
    const hex = hx * 0.65 + hy * 0.35;
    const n = fbm(x, y);
    if (hex > 0.78) return rgb(20 + n * 10, 90 + n * 20, 130);
    return rgb(40 + (1 - hex) * 80, 190 + n * 20, 220 + (1 - hex) * 30);
  });
  fillTile(d, TILE_BEDROCK, (x, y) => {
    const n = fbm(x, y);
    const speck = hash2(x, y) > 0.9 ? 18 : 0;
    const g = 32 + n * 20 + speck;
    return rgb(g, g + 3, g + 6);
  });
  fillTile(d, TILE_WATER, (x, y) => {
    const n = fbm(x, y);
    const caustic = waveX(x, 3) * 0.5 + waveY(y, 2) * 0.5;
    const band = caustic * 16;
    return rgb(18 + n * 10, 168 + n * 18 + band, 176 + n * 16 + band);
  });
  fillTile(d, TILE_MOSS, (x, y) => {
    const n = fbm(x, y);
    const moss = hash2(x, y) > 0.42;
    if (moss) return rgb(44 + n * 16, 108 + n * 26, 46 + n * 12);
    const g = 96 + n * 18;
    return rgb(g - 8, g + 6, g - 4);
  });
  fillTile(d, TILE_TEMPLE, (x, y) => {
    const bw = 8;
    const bh = 8;
    const col = wrap(Math.floor(x / bw), TILE / bw);
    const row = wrap(Math.floor(y / bh), TILE / bh);
    const lx = wrap(x, bw);
    const ly = wrap(y, bh);
    const mortar = lx === 0 || ly === 0;
    const n = valueNoise(x, y, 8);
    if (mortar) return rgb(118 + n * 8, 96 + n * 6, 64);
    const seed = col * 17 + row * 31;
    const stroke =
      (lx === 2 || lx === 5 || ly === 2 || ly === 5 || wrap(lx + ly + seed, 5) === 0) &&
      hash2(col, row) > 0.35;
    if (stroke && lx > 1 && ly > 1 && lx < 7 && ly < 7) return rgb(92, 64, 36);
    return rgb(196 + n * 10, 168 + n * 8, 118 + n * 6);
  });
  fillTile(d, TILE_CLAY, (x, y) => {
    const n = fbm(x, y);
    const pit = hash2(x, y) > 0.94 ? -20 : 0;
    return rgb(176 + n * 18 + pit, 98 + n * 12 + pit, 58 + n * 8);
  });
  fillTile(d, TILE_CLOUD, (x, y) => {
    const n = fbm(x, y);
    const puff = valueNoise(x, y, 16);
    return rgb(226 + n * 12 + puff * 8, 234 + n * 10, 240 + n * 8);
  });
  fillTile(d, TILE_WOOD_TOP, (x, y) => {
    const dx = x - 31.5;
    const dy = y - 31.5;
    const r = Math.hypot(dx, dy);
    const ring = Math.sin(r * 0.55) * 10;
    const n = valueNoise(x, y, 8);
    return rgb(112 + ring + n * 6, 86 + ring * 0.4, 118 + ring * 0.5);
  });
  fillTile(d, TILE_PATH, (x, y) => {
    const n = fbm(x, y);
    const pebble = hash2(x, y) > 0.88 ? 20 : 0;
    return rgb(162 + n * 16 + pebble, 128 + n * 12 + pebble, 74 + n * 8);
  });
  fillTile(d, TILE_SNOW, (x, y) => {
    const n = fbm(x, y);
    const spark = hash2(x, y) > 0.93 ? 28 : 0;
    return rgb(232 + n * 12 + spark, 238 + n * 10 + spark, 246 + n * 6);
  });
  fillTile(d, TILE_ICE, (x, y) => {
    const n = fbm(x, y);
    const crack = Math.abs(waveX(x, 5) + waveY(y, 2)) < 0.08 ? -36 : 0;
    const sheen = waveX(x, 2) * 10;
    return rgb(148 + n * 28 + crack + sheen, 206 + n * 18, 228 + n * 12);
  });
  fillTile(d, TILE_LAVA, (x, y) => {
    const crust = fbm(x, y);
    const vein = valueNoise(x, y, 8);
    if (vein > 0.58) return rgb(232 + crust * 20, 92 + crust * 40, 18);
    return rgb(42 + crust * 18, 16 + crust * 8, 10);
  });
  fillTile(d, TILE_METAL, (x, y) => {
    const brush = valueNoise(x, y, 2);
    const trace = wrap(x + y * 2, 16) === 0 || wrap(x, 16) === 3;
    if (trace && hash2(x >> 2, y >> 2) > 0.45) return rgb(70, 170, 190);
    const n = brush * 18;
    return rgb(68 + n, 74 + n, 86 + n);
  });
  fillTile(d, TILE_BASALT, (x, y) => {
    const n = fbm(x, y);
    const pore = hash2(x, y) > 0.86 ? -26 : 0;
    const hex = Math.abs(waveX(x, 4) * waveY(y, 3)) > 0.88 ? -10 : 0;
    return rgb(44 + n * 16 + pore + hex, 40 + n * 14 + pore, 46 + n * 12 + pore);
  });

  ctx.putImageData(img, 0, 0);
  return styleAtlas(new THREE.CanvasTexture(canvas)) as THREE.CanvasTexture;
}

export function loadAtlasTexture(): Promise<THREE.Texture> {
  return Promise.resolve(createAtlasTexture());
}

export function loadGameTexture(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (tex: THREE.Texture | null) => {
      if (settled) return;
      settled = true;
      resolve(tex);
    };
    const t = window.setTimeout(() => finish(null), 4000);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        window.clearTimeout(t);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        finish(tex);
      },
      undefined,
      () => {
        window.clearTimeout(t);
        finish(null);
      },
    );
  });
}

export const ATLAS_COLS = COLS;
export const ATLAS_ROWS = ROWS;
export const ATLAS_SIZE = ATLAS_W;
export const TILE_SIZE = TILE;

export function tileUv(tile: number, u: number, v: number, inset = 0.02): [number, number] {
  const col = tile % COLS;
  const row = Math.floor(tile / COLS);
  const su = 1 / COLS;
  const sv = 1 / ROWS;
  return [
    col * su + inset * su + u * su * (1 - 2 * inset),
    1 - (row * sv + inset * sv + (1 - v) * sv * (1 - 2 * inset)),
  ];
}

export function createBallTexture(stars: number, base?: HTMLImageElement | null): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  if (base) {
    ctx.drawImage(base, 0, 0, s, s);
  } else {
    const g = ctx.createRadialGradient(s * 0.38, s * 0.34, 8, s * 0.5, s * 0.5, s * 0.5);
    g.addColorStop(0, "#ffe27a");
    g.addColorStop(0.55, "#e8b923");
    g.addColorStop(1, "#8a5a08");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(80,40,0,0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const layout: [number, number][][] = [
    [[0, 0]],
    [
      [-0.18, 0],
      [0.18, 0],
    ],
    [
      [0, -0.2],
      [-0.2, 0.14],
      [0.2, 0.14],
    ],
    [
      [-0.16, -0.16],
      [0.16, -0.16],
      [-0.16, 0.16],
      [0.16, 0.16],
    ],
    [
      [0, 0],
      [-0.22, -0.18],
      [0.22, -0.18],
      [-0.22, 0.18],
      [0.22, 0.18],
    ],
    [
      [-0.2, -0.18],
      [0.2, -0.18],
      [-0.22, 0.06],
      [0.22, 0.06],
      [-0.12, 0.24],
      [0.12, 0.24],
    ],
    [
      [0, -0.24],
      [-0.2, -0.1],
      [0.2, -0.1],
      [0, 0],
      [-0.2, 0.14],
      [0.2, 0.14],
      [0, 0.28],
    ],
  ];
  const pts = layout[Math.max(0, Math.min(6, stars - 1))]!;
  ctx.fillStyle = "#6b1210";
  for (const [ox, oy] of pts) {
    star(ctx, s * (0.5 + ox), s * (0.5 + oy), 7, 3, 5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rOuter: number,
  rInner: number,
  n: number,
) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / n - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
