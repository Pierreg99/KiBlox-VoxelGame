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

function noise2(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(xi * 374761 + yi * 668265);
  const b = hash((xi + 1) * 374761 + yi * 668265);
  const c = hash(xi * 374761 + (yi + 1) * 668265);
  const d = hash((xi + 1) * 374761 + (yi + 1) * 668265);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
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
    const n = noise2(x * 0.28, y * 0.28);
    const n2 = noise2(x * 0.9, y * 0.9);
    const blade = hash(x * 91 + y * 17) > 0.82 ? 22 : 0;
    const tuft = n2 > 0.72 ? 18 : 0;
    return [clamp255(36 + n * 28 + blade), clamp255(128 + n * 48 + tuft), clamp255(38 + n * 22)];
  });
  fillTile(d, TILE_GRASS_SIDE, (x, y) => {
    if (y < 12) {
      const n = noise2(x * 0.4, y * 0.4);
      return [clamp255(52 + n * 24), clamp255(122 + n * 28), clamp255(44 + n * 16)];
    }
    const n = noise2(x * 0.25, y * 0.25);
    return [clamp255(118 + n * 28), clamp255(78 + n * 18), clamp255(42 + n * 12)];
  });
  fillTile(d, TILE_DIRT, (x, y) => {
    const n = noise2(x * 0.3, y * 0.3);
    const p = hash(x * 13 + y * 71) > 0.92 ? -20 : 0;
    return [clamp255(124 + n * 22 + p), clamp255(82 + n * 14 + p), clamp255(46 + n * 10)];
  });
  fillTile(d, TILE_STONE, (x, y) => {
    const n = noise2(x * 0.22, y * 0.22);
    const crack = hash(x * 3 + y * 11) > 0.94 ? -30 : 0;
    const g = 96 + n * 28 + crack;
    return [clamp255(g - 4), clamp255(g + 4), clamp255(g - 2)];
  });
  fillTile(d, TILE_SAND, (x, y) => {
    const n = noise2(x * 0.4, y * 0.4);
    return [clamp255(198 + n * 20), clamp255(178 + n * 16), clamp255(110 + n * 12)];
  });
  fillTile(d, TILE_WOOD, (x, y) => {
    const ring = Math.sin(x * 0.9) * 10;
    const n = noise2(x * 0.15, y * 0.5);
    return [clamp255(92 + ring + n * 16), clamp255(58 + ring * 0.5 + n * 10), clamp255(32 + n * 8)];
  });
  fillTile(d, TILE_LEAVES, (x, y) => {
    const n = noise2(x * 0.5, y * 0.5);
    const hole = hash(x * 29 + y * 47) > 0.78;
    if (hole) return [28, 64, 36];
    return [clamp255(36 + n * 20), clamp255(96 + n * 36), clamp255(48 + n * 16)];
  });
  fillTile(d, TILE_KI, (x, y) => {
    const cx = x - 32;
    const cy = y - 32;
    const r = Math.hypot(cx, cy);
    const n = noise2(x * 0.45, y * 0.45);
    const core = Math.max(0, 1 - r / 32);
    const facet = Math.abs(Math.sin(x * 0.6) * Math.cos(y * 0.6));
    return [
      clamp255(30 + core * 200 + facet * 40 + n * 20),
      clamp255(160 + core * 90 + n * 24),
      clamp255(210 + core * 45),
    ];
  });
  fillTile(d, TILE_BEDROCK, (x, y) => {
    const n = noise2(x * 0.55, y * 0.55);
    const g = 28 + n * 22;
    return [clamp255(g), clamp255(g + 4), clamp255(g + 2)];
  });
  fillTile(d, TILE_WATER, (x, y) => {
    const n = noise2(x * 0.2, y * 0.35);
    const band = Math.sin((x + y) * 0.45) * 12;
    return [clamp255(28 + n * 18), clamp255(118 + n * 30 + band), clamp255(148 + n * 28 + band)];
  });
  fillTile(d, TILE_MOSS, (x, y) => {
    const n = noise2(x * 0.3, y * 0.3);
    const moss = hash(x * 19 + y * 41) > 0.55;
    if (moss) return [clamp255(48 + n * 16), clamp255(102 + n * 28), clamp255(44 + n * 12)];
    const g = 88 + n * 22;
    return [clamp255(g - 6), clamp255(g + 8), clamp255(g - 4)];
  });
  fillTile(d, TILE_TEMPLE, (x, y) => {
    const n = noise2(x * 0.2, y * 0.2);
    return [clamp255(186 + n * 16), clamp255(176 + n * 14), clamp255(148 + n * 12)];
  });
  fillTile(d, TILE_CLAY, (x, y) => {
    const n = noise2(x * 0.35, y * 0.35);
    return [clamp255(168 + n * 22), clamp255(92 + n * 16), clamp255(54 + n * 10)];
  });
  fillTile(d, TILE_CLOUD, (x, y) => {
    const n = noise2(x * 0.18, y * 0.18);
    return [clamp255(220 + n * 20), clamp255(236 + n * 12), clamp255(232 + n * 14)];
  });
  fillTile(d, TILE_WOOD_TOP, (x, y) => {
    const n = noise2(x * 0.22, y * 0.22);
    const ring = Math.sin((x + y) * 0.35 + n) * 10;
    return [clamp255(128 + ring + n * 8), clamp255(86 + ring * 0.6), clamp255(48 + n * 6)];
  });
  fillTile(d, TILE_PATH, (x, y) => {
    const n = noise2(x * 0.32, y * 0.32);
    const p = hash(x * 21 + y * 53) > 0.9 ? 18 : 0;
    return [clamp255(168 + n * 18 + p), clamp255(132 + n * 14 + p), clamp255(78 + n * 10)];
  });
  fillTile(d, TILE_SNOW, (x, y) => {
    const n = noise2(x * 0.4, y * 0.4);
    const spark = hash(x * 11 + y * 29) > 0.92 ? 30 : 0;
    return [clamp255(228 + n * 18 + spark), clamp255(236 + n * 14 + spark), clamp255(242 + n * 10)];
  });
  fillTile(d, TILE_ICE, (x, y) => {
    const n = noise2(x * 0.22, y * 0.5);
    const crack = hash(x * 7 + y * 13) > 0.94 ? -40 : 0;
    return [clamp255(140 + n * 40 + crack), clamp255(198 + n * 30), clamp255(220 + n * 20)];
  });
  fillTile(d, TILE_LAVA, (x, y) => {
    const n = noise2(x * 0.18, y * 0.18);
    const crack = noise2(x * 0.55 + 9, y * 0.55) > 0.62;
    return crack
      ? [clamp255(220 + n * 30), clamp255(90 + n * 40), 24]
      : [clamp255(48 + n * 20), clamp255(18 + n * 10), 12];
  });
  fillTile(d, TILE_METAL, (x, y) => {
    const n = noise2(x * 0.3, y * 0.12);
    const rivet = hash(x * 17 + y * 41) > 0.96 ? 40 : 0;
    return [clamp255(92 + n * 28 + rivet), clamp255(98 + n * 24 + rivet), clamp255(108 + n * 22)];
  });
  fillTile(d, TILE_BASALT, (x, y) => {
    const n = noise2(x * 0.26, y * 0.26);
    const pore = hash(x * 23 + y * 19) > 0.88 ? -28 : 0;
    return [clamp255(42 + n * 18 + pore), clamp255(40 + n * 16 + pore), clamp255(44 + n * 14)];
  });

  ctx.putImageData(img, 0, 0);
  return styleAtlas(new THREE.CanvasTexture(canvas)) as THREE.CanvasTexture;
}

export function loadAtlasTexture(): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (tex: THREE.Texture) => {
      if (settled) return;
      settled = true;
      resolve(tex);
    };
    const t = window.setTimeout(() => finish(createAtlasTexture()), 4000);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      "/game/atlas.png",
      (tex) => {
        window.clearTimeout(t);
        finish(styleAtlas(tex));
      },
      undefined,
      () => {
        window.clearTimeout(t);
        finish(createAtlasTexture());
      },
    );
  });
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
