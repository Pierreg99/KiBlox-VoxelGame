import { createNoise2D, createNoise3D } from "simplex-noise";
import {
  AIR,
  BALL_COUNT,
  BEDROCK,
  CHUNK,
  CX,
  CY,
  CZ,
  DIRT,
  GRASS,
  KI,
  LEAVES,
  MOSS,
  SAND,
  SEA_LEVEL,
  STONE,
  SX,
  SY,
  SZ,
  WATER,
  WOOD,
} from "./constants";
import { makeRng } from "./rng";

export type DragonBall = {
  id: number;
  x: number;
  y: number;
  z: number;
  stars: number;
  taken: boolean;
};

export type EnemyKind = "grunt" | "shooter" | "flyer";

export type EnemySpawn = { x: number; y: number; z: number; power: number; kind: EnemyKind };

function idx(x: number, y: number, z: number) {
  return x + z * SX + y * SX * SZ;
}

export class World {
  data: Uint8Array;
  seed: number;
  spawn = { x: SX / 2 + 0.5, y: 30, z: SZ / 2 + 0.5 };
  balls: DragonBall[] = [];
  enemies: EnemySpawn[] = [];

  constructor(seed: number) {
    this.seed = seed;
    this.data = new Uint8Array(SX * SY * SZ);
  }

  inBounds(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  get(x: number, y: number, z: number) {
    if (!this.inBounds(x, y, z)) return y < 0 ? BEDROCK : AIR;
    return this.data[idx(x, y, z)]!;
  }

  set(x: number, y: number, z: number, id: number) {
    if (!this.inBounds(x, y, z)) return false;
    this.data[idx(x, y, z)] = id;
    return true;
  }

  isSolid(x: number, y: number, z: number) {
    const b = this.get(x, y, z);
    return b !== AIR && b !== LEAVES && b !== WATER;
  }

  isOpaque(x: number, y: number, z: number) {
    const b = this.get(x, y, z);
    return b !== AIR && b !== LEAVES && b !== WATER;
  }

  generate() {
    const rngT = makeRng(this.seed, 0x11);
    const rngC = makeRng(this.seed, 0x22);
    const rngE = makeRng(this.seed, 0x33);
    const rngB = makeRng(this.seed, 0x44);
    const rngI = makeRng(this.seed, 0x55);
    const noise2 = createNoise2D(makeRng(this.seed, 0x61));
    const noise3 = createNoise3D(makeRng(this.seed, 0x62));

    const height = new Int16Array(SX * SZ);
    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const e =
          0.52 * noise2(x * 0.028, z * 0.028) +
          0.3 * noise2(x * 0.07, z * 0.07) +
          0.18 * noise2(x * 0.18, z * 0.18);
        const n = (e + 1) * 0.5;
        const ridge = 1 - Math.abs(noise2(x * 0.018 + 40, z * 0.018 + 12));
        const warp = noise2(x * 0.01 + 7, z * 0.01 + 3) * 8;
        const h = 11 + n * 13 + ridge * ridge * 14 + warp * 0.15;
        height[x + z * SX] = Math.max(4, Math.min(SY - 18, h | 0));
      }
    }

    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const h = height[x + z * SX]!;
        const moist = noise2(x * 0.05 + 90, z * 0.05);
        for (let y = 0; y < SY; y++) {
          let id = AIR;
          if (y === 0) id = BEDROCK;
          else if (y < h - 4) {
            id = STONE;
            const cave = noise3(x * 0.07, y * 0.09, z * 0.07);
            if (y > 3 && y < h - 3 && cave > 0.5) id = AIR;
            else if (rngC() < 0.014) id = KI;
          } else if (y < h - 1) id = DIRT;
          else if (y === h) {
            id = moist < -0.32 && h < SEA_LEVEL + 2 ? SAND : GRASS;
          } else if (y < h) id = DIRT;
          if (id === AIR && y <= SEA_LEVEL && y > 0) id = WATER;
          this.data[idx(x, y, z)] = id;
        }
      }
    }

    // Moss along wet stone
    for (let z = 2; z < SZ - 2; z += 2) {
      for (let x = 2; x < SX - 2; x += 2) {
        const h = height[x + z * SX]!;
        if (this.get(x, h, z) !== GRASS) continue;
        if (this.get(x + 1, SEA_LEVEL, z) === WATER || h <= SEA_LEVEL + 1) {
          if (this.get(x, h - 1, z) === STONE || this.get(x, h - 1, z) === DIRT) {
            this.set(x, h - 1, z, MOSS);
          }
        }
      }
    }

    // Namek trees
    for (let i = 0; i < 220; i++) {
      const x = 3 + ((rngT() * (SX - 6)) | 0);
      const z = 3 + ((rngT() * (SZ - 6)) | 0);
      const h = height[x + z * SX]!;
      if (this.get(x, h, z) !== GRASS) continue;
      const th = 6 + ((rngT() * 6) | 0);
      for (let ty = 1; ty <= th; ty++) this.set(x, h + ty, z, WOOD);
      const top = h + th;
      const rad = 3;
      for (let dz = -rad; dz <= rad; dz++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (dx * dx + dz * dz > rad * rad + 0.5) continue;
          for (let dy = 0; dy <= 1; dy++) {
            const lx = x + dx;
            const ly = top + dy;
            const lz = z + dz;
            if (this.get(lx, ly, lz) === AIR) this.set(lx, ly, lz, LEAVES);
          }
        }
      }
    }

    // Floating ki islands
    for (let i = 0; i < 7; i++) {
      const ix = 16 + ((rngI() * (SX - 32)) | 0);
      const iz = 16 + ((rngI() * (SZ - 32)) | 0);
      const iy = 44 + ((rngI() * 8) | 0);
      const r = 4 + ((rngI() * 5) | 0);
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dz * dz > r * r) continue;
          const drop = ((1 - Math.hypot(dx, dz) / r) * 3) | 0;
          for (let dy = -1; dy <= drop + 1; dy++) {
            const id = dy === drop + 1 ? GRASS : rngI() < 0.12 ? KI : STONE;
            this.set(ix + dx, iy + dy, iz + dz, id);
          }
        }
      }
    }

    // Landmark hut near center
    const hx = (SX / 2) | 0;
    const hz = (SZ / 2) | 0;
    const hh = height[hx + hz * SX]!;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        for (let dy = 1; dy <= 3; dy++) {
          if (wall) this.set(hx + dx, hh + dy, hz + dz, WOOD);
          else this.set(hx + dx, hh + dy, hz + dz, AIR);
        }
        this.set(hx + dx, hh + 4, hz + dz, WOOD);
      }
    }
    this.set(hx, hh + 1, hz + 2, AIR);
    this.set(hx, hh + 2, hz + 2, AIR);

    this.spawn.x = hx + 0.5;
    this.spawn.z = hz - 4.5;
    this.spawn.y = height[hx + (hz - 4) * SX]! + 2;

    this.scatterBalls(rngB);

    this.enemies = [];
    for (let i = 0; i < 16; i++) {
      const x = 8 + ((rngE() * (SX - 16)) | 0);
      const z = 8 + ((rngE() * (SZ - 16)) | 0);
      const y = height[x + z * SX]! + 1;
      const dx = x - this.spawn.x;
      const dz = z - this.spawn.z;
      if (dx * dx + dz * dz < 18 * 18) continue;
      const roll = rngE();
      const kind: EnemyKind = roll > 0.78 ? "flyer" : roll > 0.48 ? "shooter" : "grunt";
      this.enemies.push({
        x: x + 0.5,
        y: kind === "flyer" ? y + 4 + rngE() * 5 : y,
        z: z + 0.5,
        power: 700 + ((rngE() * 1800) | 0) + (kind === "flyer" ? 400 : 0),
        kind,
      });
    }
  }

  surfaceY(x: number, z: number) {
    for (let y = SY - 2; y >= 1; y--) {
      if (this.isSolid(x, y, z) && !this.isSolid(x, y + 1, z)) return y + 1;
    }
    return SEA_LEVEL + 1;
  }

  scatterBalls(rng: () => number) {
    const hx = (SX / 2) | 0;
    const hz = (SZ / 2) | 0;
    this.balls = [];
    for (let i = 0; i < BALL_COUNT; i++) {
      const ang = (i / BALL_COUNT) * Math.PI * 2 + rng() * 0.4;
      const rad = 22 + rng() * 32;
      let x = (hx + Math.cos(ang) * rad) | 0;
      let z = (hz + Math.sin(ang) * rad) | 0;
      x = Math.max(4, Math.min(SX - 5, x));
      z = Math.max(4, Math.min(SZ - 5, z));
      let y = this.surfaceY(x, z);
      while (y < SY - 2 && this.isSolid(x, y, z)) y++;
      this.balls.push({ id: i, x: x + 0.5, y: y + 0.35, z: z + 0.5, stars: i + 1, taken: false });
    }
  }

  applyEdits(edits: [number, number, number, number][]) {
    for (const [x, y, z, id] of edits) this.set(x, y, z, id);
  }
}

export function chunkKey(cx: number, cy: number, cz: number) {
  return cx + cy * 32 + cz * 32 * 8;
}

export function chunkCoords(wx: number, wy: number, wz: number) {
  return {
    cx: Math.floor(wx / CHUNK),
    cy: Math.floor(wy / CHUNK),
    cz: Math.floor(wz / CHUNK),
  };
}

export { CX, CY, CZ, CHUNK };

export type RayHit = {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  dist: number;
  block: number;
};

export function raycastVoxels(
  world: World,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
): RayHit | null {
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;
  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;
  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);
  const frac = (v: number, step: number) => (step > 0 ? 1 - (v - Math.floor(v)) : v - Math.floor(v));
  let tMaxX = tDeltaX * frac(ox, stepX);
  let tMaxY = tDeltaY * frac(oy, stepY);
  let tMaxZ = tDeltaZ * frac(oz, stepZ);
  let nx = 0;
  let ny = 0;
  let nz = 0;
  let t = 0;
  for (let i = 0; i < maxDist * 4 + 4; i++) {
    if (t > maxDist) return null;
    const block = world.get(x, y, z);
    if (block !== AIR && block !== WATER) return { x, y, z, nx, ny, nz, dist: t, block };
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        x += stepX;
        t = tMaxX;
        tMaxX += tDeltaX;
        nx = -stepX;
        ny = 0;
        nz = 0;
      } else {
        z += stepZ;
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        nx = 0;
        ny = 0;
        nz = -stepZ;
      }
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      nx = 0;
      ny = -stepY;
      nz = 0;
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      nx = 0;
      ny = 0;
      nz = -stepZ;
    }
  }
  return null;
}

export function aabbHitsWorld(
  world: World,
  x: number,
  y: number,
  z: number,
  hw: number,
  h: number,
) {
  const minX = Math.floor(x - hw);
  const maxX = Math.floor(x + hw);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + h - 1e-4);
  const minZ = Math.floor(z - hw);
  const maxZ = Math.floor(z + hw);
  for (let iy = minY; iy <= maxY; iy++) {
    for (let iz = minZ; iz <= maxZ; iz++) {
      for (let ix = minX; ix <= maxX; ix++) {
        if (world.isSolid(ix, iy, iz)) return true;
      }
    }
  }
  return false;
}
