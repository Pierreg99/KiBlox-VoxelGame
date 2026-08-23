import * as THREE from "three";
import { AIR, BEDROCK, DIRT, GRASS, KI, LEAVES, MOSS, SAND, STONE, WATER, WOOD } from "./constants";

const TILE = 32;
const COLS = 4;
const ATLAS = TILE * COLS;

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
  const i = (y * ATLAS + x) * 4;
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

/** Atlas tile indices */
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

export function faceTile(block: number, ny: number): number {
  if (block === GRASS) {
    if (ny > 0) return TILE_GRASS_TOP;
    if (ny < 0) return TILE_DIRT;
    return TILE_GRASS_SIDE;
  }
  if (block === DIRT) return TILE_DIRT;
  if (block === STONE) return TILE_STONE;
  if (block === SAND) return TILE_SAND;
  if (block === WOOD) return TILE_WOOD;
  if (block === LEAVES) return TILE_LEAVES;
  if (block === KI) return TILE_KI;
  if (block === BEDROCK) return TILE_BEDROCK;
  if (block === WATER) return TILE_WATER;
  if (block === MOSS) return TILE_MOSS;
  if (block === AIR) return TILE_STONE;
  return TILE_STONE;
}

export function createAtlasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS;
  canvas.height = ATLAS;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(ATLAS, ATLAS);
  const d = img.data;

  fillTile(d, TILE_GRASS_TOP, (x, y) => {
    const n = noise2(x * 0.28, y * 0.28);
    const n2 = noise2(x * 0.9, y * 0.9);
    const blade = hash(x * 91 + y * 17) > 0.82 ? 22 : 0;
    const tuft = n2 > 0.72 ? 18 : 0;
    return [
      clamp255(36 + n * 28 + blade),
      clamp255(128 + n * 48 + tuft),
      clamp255(38 + n * 22),
    ];
  });

  fillTile(d, TILE_GRASS_SIDE, (x, y) => {
    if (y < 6) {
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
    return [
      clamp255(92 + ring + n * 16),
      clamp255(58 + ring * 0.5 + n * 10),
      clamp255(32 + n * 8),
    ];
  });

  fillTile(d, TILE_LEAVES, (x, y) => {
    const n = noise2(x * 0.5, y * 0.5);
    const hole = hash(x * 29 + y * 47) > 0.78;
    if (hole) return [28, 64, 36];
    return [clamp255(36 + n * 20), clamp255(96 + n * 36), clamp255(48 + n * 16)];
  });

  fillTile(d, TILE_KI, (x, y) => {
    const cx = x - 16;
    const cy = y - 16;
    const r = Math.hypot(cx, cy);
    const n = noise2(x * 0.45, y * 0.45);
    const core = Math.max(0, 1 - r / 16);
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
    return [
      clamp255(28 + n * 18),
      clamp255(118 + n * 30 + band),
      clamp255(148 + n * 28 + band),
    ];
  });

  fillTile(d, TILE_MOSS, (x, y) => {
    const n = noise2(x * 0.3, y * 0.3);
    const moss = hash(x * 19 + y * 41) > 0.55;
    if (moss) return [clamp255(48 + n * 16), clamp255(102 + n * 28), clamp255(44 + n * 12)];
    const g = 88 + n * 22;
    return [clamp255(g - 6), clamp255(g + 8), clamp255(g - 4)];
  });

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const ATLAS_COLS = COLS;
export const ATLAS_SIZE = ATLAS;
export const TILE_SIZE = TILE;

export function tileUv(tile: number, u: number, v: number, inset = 0.02): [number, number] {
  const col = tile % COLS;
  const row = Math.floor(tile / COLS);
  const su = 1 / COLS;
  const sv = 1 / COLS;
  return [col * su + inset * su + u * su * (1 - 2 * inset), 1 - (row * sv + inset * sv + (1 - v) * sv * (1 - 2 * inset))];
}

export function createBallTexture(stars: number): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
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
