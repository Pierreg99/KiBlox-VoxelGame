import { createNoise2D, createNoise3D } from "simplex-noise";
import {
  AIR,
  BALL_COUNT,
  BASALT,
  BEDROCK,
  CHUNK,
  CLAY,
  CLOUD,
  CX,
  CY,
  CZ,
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
  SEA_LEVEL,
  SNOW,
  STONE,
  SX,
  SY,
  SZ,
  TEMPLE,
  WATER,
  WOOD,
} from "./constants";
import { PLANETS, pickKind, planetIndex, speciesFor, type PlanetId, type SpeciesId } from "./campaign";
import { makeRng } from "./rng";

export type DragonBall = {
  id: number;
  x: number;
  y: number;
  z: number;
  stars: number;
  taken: boolean;
};

export type EnemyKind = "grunt" | "shooter" | "flyer" | "brute" | "elite" | "lord";

export type EnemySpawn = {
  x: number;
  y: number;
  z: number;
  power: number;
  kind: EnemyKind;
  species: SpeciesId;
  name?: string;
  boss?: boolean;
};

export type NpcSpawn = {
  x: number;
  y: number;
  z: number;
  name: string;
  species: SpeciesId;
  portrait: string;
  lines: string[];
};

export type Landmark = { name: string; x: number; y: number; z: number };

function idx(x: number, y: number, z: number) {
  return x + z * SX + y * SX * SZ;
}

function fbm2(n: (x: number, y: number) => number, x: number, z: number, oct = 5) {
  let a = 1;
  let f = 1;
  let s = 0;
  let w = 0;
  for (let i = 0; i < oct; i++) {
    s += a * n(x * f, z * f);
    w += a;
    a *= 0.5;
    f *= 2.05;
  }
  return s / w;
}

function smooth01(t: number) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

function disk(dx: number, dz: number, r: number) {
  return dx * dx + dz * dz <= r * r + 0.45;
}

function yieldThread() {
  return new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    setTimeout(done, 0);
    try {
      const ch = new MessageChannel();
      ch.port1.onmessage = done;
      ch.port2.postMessage(0);
    } catch {
      /* setTimeout covers this */
    }
  });
}

export class World {
  data: Uint8Array;
  seed: number;
  planet: PlanetId;
  spawn = { x: SX / 2 + 0.5, y: 30, z: SZ / 2 + 0.5 };
  balls: DragonBall[] = [];
  enemies: EnemySpawn[] = [];
  npcs: NpcSpawn[] = [];
  landmarks: Landmark[] = [];

  constructor(seed: number, planet: PlanetId = "verdant") {
    this.seed = seed;
    this.planet = planet;
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
    return b !== AIR && b !== WATER && b !== LAVA;
  }

  isOpaque(x: number, y: number, z: number) {
    const b = this.get(x, y, z);
    return b !== AIR && b !== LEAVES && b !== WATER && b !== CLOUD && b !== LAVA;
  }

  isLiquid(x: number, y: number, z: number) {
    const b = this.get(x, y, z);
    return b === WATER || b === LAVA;
  }

  async generate(onProgress?: (p: number) => void, aborted?: () => boolean) {
    const P = PLANETS[this.planet];
    const rngT = makeRng(this.seed, 0x11);
    const rngC = makeRng(this.seed, 0x22);
    const rngE = makeRng(this.seed, 0x33);
    const rngB = makeRng(this.seed, 0x44);
    const rngI = makeRng(this.seed, 0x55);
    const rngR = makeRng(this.seed, 0x66);
    const rngP = makeRng(this.seed, 0x77);
    const noiseE = createNoise2D(makeRng(this.seed, 0x61));
    const noiseM = createNoise2D(makeRng(this.seed, 0x63));
    const noiseW = createNoise2D(makeRng(this.seed, 0x64));
    const noise3 = createNoise3D(makeRng(this.seed, 0x62));
    const noiseRav = createNoise3D(makeRng(this.seed, 0x67));

    const height = new Int16Array(SX * SZ);
    const moistA = new Float32Array(SX * SZ);
    const elevA = new Float32Array(SX * SZ);
    const cx0 = SX * 0.5;
    const cz0 = SZ * 0.5;

    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const wx = x + noiseW(x * 0.012, z * 0.012) * 16;
        const wz = z + noiseW(x * 0.012 + 40, z * 0.012 + 9) * 16;
        const eRaw = (fbm2(noiseE, wx * 0.016, wz * 0.016, 5) + 1) * 0.5;
        const ridge = 1 - Math.abs(noiseE(x * 0.014 + 8, z * 0.014 + 3));
        const ridge2 = ridge * ridge;
        const moist = (fbm2(noiseM, x * 0.021 + 90, z * 0.021, 4) + 1) * 0.5;
        const dx = (x - cx0) / (SX * 0.52);
        const dz = (z - cz0) / (SZ * 0.52);
        const radial = Math.hypot(dx, dz);
        const island = 1 - smooth01((radial - P.islandR) / 0.4);
        let elev = eRaw * 0.52 + ridge2 * 0.48;
        elev = Math.pow(elev, 1.18) * (0.38 + 0.62 * island);
        let h = 8 + elev * 44;
        if (elev > 0.78) h += (elev - 0.78) * 26;
        if (moist > 0.62 && elev > 0.22 && elev < 0.5 && island > 0.35) {
          h -= 2.2 + (moist - 0.62) * 8;
        }
        if (elev > 0.38 && elev < 0.58 && moist < 0.48) h = Math.round(h / 3) * 3;
        if (island < 0.18) h = Math.min(h, SEA_LEVEL - 2);
        height[x + z * SX] = Math.max(3, Math.min(SY - 20, h | 0));
        moistA[x + z * SX] = moist;
        elevA[x + z * SX] = elev;
      }
      if ((z & 15) === 15) {
        onProgress?.(0.04 + (z / SZ) * 0.2);
        if (aborted?.()) return;
        await yieldThread();
      }
    }

    for (let r = 0; r < 6; r++) {
      let x = 16 + ((rngR() * (SX - 32)) | 0);
      let z = 16 + ((rngR() * (SZ - 32)) | 0);
      for (let step = 0; step < 110; step++) {
        const hi = height[x + z * SX]!;
        if (hi <= SEA_LEVEL) break;
        for (let oz = -1; oz <= 1; oz++) {
          for (let ox = -1; ox <= 1; ox++) {
            const xx = x + ox;
            const zz = z + oz;
            if (xx < 1 || zz < 1 || xx >= SX - 1 || zz >= SZ - 1) continue;
            const i = xx + zz * SX;
            height[i] = Math.min(height[i]!, SEA_LEVEL - (Math.abs(ox) + Math.abs(oz) === 0 ? 2 : 1));
          }
        }
        let bestX = x;
        let bestZ = z;
        let bestH = hi;
        for (let k = 0; k < 8; k++) {
          const nx = x + ((rngR() * 3) | 0) - 1;
          const nz = z + ((rngR() * 3) | 0) - 1;
          if (nx < 2 || nz < 2 || nx >= SX - 2 || nz >= SZ - 2) continue;
          const nh = height[nx + nz * SX]!;
          if (nh <= bestH) {
            bestH = nh;
            bestX = nx;
            bestZ = nz;
          }
        }
        if (bestX === x && bestZ === z) {
          x += rngR() < 0.5 ? -1 : 1;
          z += rngR() < 0.5 ? -1 : 1;
        } else {
          x = bestX;
          z = bestZ;
        }
      }
    }
    if (aborted?.()) return;
    onProgress?.(0.26);
    await yieldThread();

    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const h = height[x + z * SX]!;
        const moist = moistA[x + z * SX]!;
        const elev = elevA[x + z * SX]!;
        const yTop = Math.max(h, SEA_LEVEL);
        for (let y = 0; y <= yTop; y++) {
          let id = AIR;
          if (y === 0) id = BEDROCK;
          else if (y < h - 5) {
            id = STONE;
            if (y > 4) {
              const cave = noise3(x * 0.06, y * 0.085, z * 0.06);
              if (y < h - 2 && cave > 0.52) id = AIR;
              else if (y > 6) {
                const ravine = Math.abs(noiseRav(x * 0.035, y * 0.04, z * 0.035));
                if (y < h - 1 && ravine < 0.07 && elev > 0.28) id = AIR;
              }
              if (id === STONE) {
                if (cave > 0.38 && cave < 0.46 && rngC() < 0.22) id = KI;
                else if (rngC() < 0.012) id = KI;
              }
            } else if (rngC() < 0.012) id = KI;
          } else if (y < h - 1) {
            id = elev > 0.7 ? STONE : P.dirt;
          } else if (y === h) {
            if (h <= SEA_LEVEL + 1) {
              if (P.liquid === LAVA) id = BASALT;
              else if (P.liquid === ICE) id = ICE;
              else id = moist > 0.55 ? CLAY : SAND;
            } else if (elev > 0.74) id = this.planet === "cinder" ? BASALT : STONE;
            else if (moist > 0.62 && h < SEA_LEVEL + 7 && P.surface === GRASS) id = MOSS;
            else if (moist < 0.28 && P.surface === GRASS) id = SAND;
            else id = P.surface;
          } else if (y < h) id = P.dirt;
          if (id === AIR && y <= SEA_LEVEL && y > 0) id = P.liquid;
          this.data[idx(x, y, z)] = id;
        }
      }
      if ((z & 3) === 3) {
        onProgress?.(0.26 + (z / SZ) * 0.5);
        if (aborted?.()) return;
        await yieldThread();
      }
    }

    // Seal 1-block surface pits so walking doesn't drop through speckles.
    for (let z = 1; z < SZ - 1; z++) {
      for (let x = 1; x < SX - 1; x++) {
        const h = height[x + z * SX]!;
        if (h <= 1) continue;
        const here = this.get(x, h, z);
        if (here !== AIR && here !== WATER && here !== LAVA) continue;
        let n = 0;
        for (const [ox, oz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          if (this.isSolid(x + ox, h, z + oz)) n++;
        }
        if (n >= 3) this.set(x, h, z, P.surface);
      }
    }

    for (let z = 2; z < SZ - 2; z += 2) {
      for (let x = 2; x < SX - 2; x += 2) {
        const h = height[x + z * SX]!;
        if (this.get(x, h, z) !== P.surface && this.get(x, h, z) !== MOSS) continue;
        if (this.get(x + 1, SEA_LEVEL, z) === WATER || h <= SEA_LEVEL + 1) {
          if (this.get(x, h - 1, z) === STONE || this.get(x, h - 1, z) === DIRT) {
            this.set(x, h - 1, z, MOSS);
          }
        }
      }
    }

    // Waterfalls down cliffs into the sea
    for (let z = 3; z < SZ - 3; z++) {
      for (let x = 3; x < SX - 3; x++) {
        const h = height[x + z * SX]!;
        if (h < SEA_LEVEL + 5) continue;
        const neigh: [number, number][] = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (const [ox, oz] of neigh) {
          const nh = height[x + ox + (z + oz) * SX]!;
          if (h - nh < 5) continue;
          if (nh > SEA_LEVEL + 3) continue;
          for (let y = nh + 1; y <= h; y++) {
            if (this.get(x + ox, y, z + oz) === AIR) this.set(x + ox, y, z + oz, WATER);
          }
          break;
        }
      }
    }

    const vx = (SX / 2) | 0;
    const vz = (SZ / 2 + 4) | 0;
    const plazaH = Math.max(SEA_LEVEL + 3, height[vx + vz * SX]!);

    // Temple on highest dry plateau
    let tx = (SX * 0.3) | 0;
    let tz = (SZ * 0.68) | 0;
    let best = -1;
    for (let i = 0; i < 90; i++) {
      const x = 18 + ((rngT() * (SX - 36)) | 0);
      const z = 18 + ((rngT() * (SZ - 36)) | 0);
      const e = elevA[x + z * SX]!;
      const h = height[x + z * SX]!;
      if (e > best && h > SEA_LEVEL + 8 && Math.hypot(x - vx, z - vz) > 22) {
        best = e;
        tx = x;
        tz = z;
      }
    }
    const th = height[tx + tz * SX]!;

    const occupied = (x: number, z: number) => {
      const dxv = x - vx;
      const dzv = z - vz;
      if (dxv * dxv + dzv * dzv < 14 * 14) return true;
      const dxt = x - tx;
      const dzt = z - tz;
      return dxt * dxt + dzt * dzt < 12 * 12;
    };

    // Umbrella trees
    for (let i = 0; i < P.trees; i++) {
      const x = 4 + ((rngT() * (SX - 8)) | 0);
      const z = 4 + ((rngT() * (SZ - 8)) | 0);
      if (occupied(x, z)) continue;
      const h = height[x + z * SX]!;
      const moist = moistA[x + z * SX]!;
      if (this.get(x, h, z) !== GRASS) continue;
      if (moist < 0.2 || moist > 0.84) continue;
      const giant = rngT() < 0.1;
      const treeH = giant ? 14 + ((rngT() * 6) | 0) : 10 + ((rngT() * 5) | 0);
      for (let ty = 1; ty <= treeH; ty++) this.set(x, h + ty, z, WOOD);
      if (rngT() < 0.5) {
        const by = h + ((treeH * 0.55) | 0);
        const bx = x + (rngT() < 0.5 ? 1 : -1);
        this.set(bx, by, z, WOOD);
        this.set(bx, by + 1, z, WOOD);
      }
      const top = h + treeH;
      const rad = giant ? 6 : 4;
      for (let dy = -1; dy <= 3; dy++) {
        const r = Math.max(2, rad - Math.abs(dy) - (dy < 0 ? 1 : 0));
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (!disk(dx, dz, r + 0.15)) continue;
            const lx = x + dx;
            const ly = top + dy;
            const lz = z + dz;
            if (this.get(lx, ly, lz) === AIR) this.set(lx, ly, lz, LEAVES);
          }
        }
      }
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (this.get(x + dx, top, z + dz) === AIR) this.set(x + dx, top, z + dz, LEAVES);
        }
      }
    }

    // Cloud islands
    for (let i = 0; i < P.clouds; i++) {
      const ix = 14 + ((rngI() * (SX - 28)) | 0);
      const iz = 14 + ((rngI() * (SZ - 28)) | 0);
      const iy = 54 + ((rngI() * 10) | 0);
      const r = 4 + ((rngI() * 5) | 0);
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (!disk(dx, dz, r)) continue;
          const drop = ((1 - Math.hypot(dx, dz) / r) * 3) | 0;
          for (let dy = -2; dy <= drop + 1; dy++) {
            let id = STONE;
            if (dy <= -1) id = CLOUD;
            else if (dy === drop + 1) id = rngI() < 0.2 ? KI : P.surface;
            else if (rngI() < 0.12) id = KI;
            this.set(ix + dx, iy + dy, iz + dz, id);
          }
        }
      }
    }

    // Flatten plaza
    for (let dz = -6; dz <= 6; dz++) {
      for (let dx = -6; dx <= 6; dx++) {
        if (!disk(dx, dz, 6.2)) continue;
        const xx = vx + dx;
        const zz = vz + dz;
        if (!this.inBounds(xx, 1, zz)) continue;
        for (let y = 1; y < SY - 2; y++) {
          if (y < plazaH) {
            if (this.get(xx, y, zz) === AIR || this.get(xx, y, zz) === WATER || this.get(xx, y, zz) === LAVA) {
              this.set(xx, y, zz, y > plazaH - 3 ? P.dirt : STONE);
            }
          } else if (y === plazaH) {
            this.set(xx, y, zz, Math.abs(dx) <= 1 || Math.abs(dz) <= 1 ? PATH : P.surface);
          } else if (y < plazaH + 6) this.set(xx, y, zz, AIR);
        }
        height[xx + zz * SX] = plazaH;
      }
    }

    // Clay pod houses
    const hutOff: [number, number][] = [
      [5, 3],
      [-6, 4],
      [7, -5],
      [-5, -6],
      [0, 8],
    ];
    for (const [ox, oz] of hutOff) {
      const hx = vx + ox;
      const hz = vz + oz;
      const hh = plazaH;
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          const d = Math.hypot(dx, dz);
          if (d > 2.35) continue;
          this.set(hx + dx, hh, hz + dz, CLAY);
          const wall = d > 1.55;
          for (let dy = 1; dy <= 3; dy++) {
            if (wall) this.set(hx + dx, hh + dy, hz + dz, CLAY);
            else this.set(hx + dx, hh + dy, hz + dz, AIR);
          }
          if (d <= 1.8) this.set(hx + dx, hh + 4, hz + dz, WOOD);
          if (d <= 1.05) this.set(hx + dx, hh + 5, hz + dz, WOOD);
        }
      }
      this.set(hx, hh + 6, hz, LEAVES);
      this.set(hx, hh + 1, hz + 2, AIR);
      this.set(hx, hh + 2, hz + 2, AIR);
    }

    // Ziggurat temple
    for (let layer = 0; layer < 4; layer++) {
      const r = 6 - layer * 2;
      const y = th + layer;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          this.set(tx + dx, y, tz + dz, TEMPLE);
          for (let fy = height[tx + dx + (tz + dz) * SX]! + 1; fy < y; fy++) {
            if (this.get(tx + dx, fy, tz + dz) === AIR) this.set(tx + dx, fy, tz + dz, TEMPLE);
          }
        }
      }
    }
    for (let s = 0; s < 5; s++) {
      for (let w = -1; w <= 1; w++) {
        this.set(tx + w, th + s, tz + 7 - s, TEMPLE);
      }
    }
    const pillars: [number, number][] = [
      [-5, -5],
      [5, -5],
      [-5, 5],
      [5, 5],
    ];
    for (const [px, pz] of pillars) {
      for (let dy = 1; dy <= 6; dy++) this.set(tx + px, th + dy, tz + pz, TEMPLE);
    }
    this.set(tx, th + 4, tz, KI);
    this.set(tx, th + 5, tz, KI);

    // Lookout tower
    const lx = Math.max(10, Math.min(SX - 11, vx + 18));
    const lz = Math.max(10, Math.min(SZ - 11, vz - 16));
    const lh = height[lx + lz * SX]!;
    for (let dy = 1; dy <= 9; dy++) {
      for (const [dx, dz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as [number, number][]) {
        this.set(lx + dx, lh + dy, lz + dz, WOOD);
      }
    }
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) this.set(lx + dx, lh + 10, lz + dz, WOOD);
    }
    this.set(lx, lh + 1, lz, AIR);
    this.set(lx, lh + 2, lz, AIR);

    // Crystal groves
    for (let g = 0; g < 7; g++) {
      const gx = 10 + ((rngI() * (SX - 20)) | 0);
      const gz = 10 + ((rngI() * (SZ - 20)) | 0);
      if (occupied(gx, gz)) continue;
      const gh = height[gx + gz * SX]!;
      if (gh <= SEA_LEVEL + 1) continue;
      for (let k = 0; k < 8; k++) {
        const ox = ((rngI() * 5) | 0) - 2;
        const oz = ((rngI() * 5) | 0) - 2;
        const tall = 1 + ((rngI() * 3) | 0);
        for (let dy = 1; dy <= tall; dy++) this.set(gx + ox, gh + dy, gz + oz, KI);
      }
    }

    const walkPath = (x0: number, z0: number, x1: number, z1: number) => {
      let x = x0;
      let z = z0;
      for (let i = 0; i < 240; i++) {
        if (!this.inBounds(x, 1, z)) break;
        const h = height[x + z * SX]!;
        if (h <= SEA_LEVEL) {
          this.set(x, SEA_LEVEL + 1, z, WOOD);
          this.set(x, SEA_LEVEL + 2, z, AIR);
        } else {
          const top = this.get(x, h, z);
          if (top === GRASS || top === DIRT || top === SAND || top === MOSS || top === PATH) {
            this.set(x, h, z, PATH);
          }
        }
        if (x === x1 && z === z1) break;
        let bestX = x;
        let bestZ = z;
        let best = 1e9;
        for (let oz = -1; oz <= 1; oz++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oz) continue;
            const nx = x + ox;
            const nz = z + oz;
            if (nx < 2 || nz < 2 || nx >= SX - 2 || nz >= SZ - 2) continue;
            const manh = Math.abs(nx - x1) + Math.abs(nz - z1);
            const climb = Math.abs(height[nx + nz * SX]! - h);
            const score = manh + climb * 1.35 + rngP() * 0.2;
            if (score < best) {
              best = score;
              bestX = nx;
              bestZ = nz;
            }
          }
        }
        if (bestX === x && bestZ === z) break;
        x = bestX;
        z = bestZ;
      }
    };
    walkPath(vx, vz, tx, tz);
    walkPath(vx, vz, lx, lz);
    walkPath(vx, vz + 6, vx, Math.min(SZ - 8, vz + 28));

    this.spawn.x = vx + 0.5;
    this.spawn.z = vz - 3.5;
    let sy = this.surfaceY(vx, vz - 3);
    if (this.get(vx, sy - 1, vz - 3) === WATER || sy <= SEA_LEVEL + 1) {
      for (let r = 2; r < 18; r++) {
        let found = false;
        for (let a = 0; a < 16; a++) {
          const sx = vx + Math.round(Math.cos((a / 16) * Math.PI * 2) * r);
          const sz = vz - 3 + Math.round(Math.sin((a / 16) * Math.PI * 2) * r);
          const y = this.surfaceY(sx, sz);
          if (y > SEA_LEVEL + 2 && this.isSolid(sx, y - 1, sz)) {
            this.spawn.x = sx + 0.5;
            this.spawn.z = sz + 0.5;
            sy = y;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
    this.spawn.y = sy + 0.05;
    {
      const sx = Math.floor(this.spawn.x);
      const sz = Math.floor(this.spawn.z);
      for (let y = Math.floor(this.spawn.y); y <= Math.floor(this.spawn.y) + 2; y++) {
        if (this.isSolid(sx, y, sz)) this.set(sx, y, sz, AIR);
      }
    }

    this.scatterBalls(rngB);
    if (this.balls[0]) {
      this.balls[0]!.x = tx + 0.5;
      this.balls[0]!.z = tz + 0.5;
      this.balls[0]!.y = th + 6.4;
    }
    for (const b of this.balls) {
      const bx = Math.floor(b.x);
      const bz = Math.floor(b.z);
      const by = Math.floor(b.y) - 1;
      for (let oz = -1; oz <= 1; oz++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (this.get(bx + ox, by, bz + oz) === AIR) this.set(bx + ox, by, bz + oz, TEMPLE);
        }
      }
    }

    this.enemies = [];
    const rank = planetIndex(this.planet);
    const patrol = 20 + rank * 6;
    const pushE = (
      x: number,
      z: number,
      kind: EnemyKind,
      power: number,
      extra?: { name?: string; boss?: boolean; fly?: boolean },
    ) => {
      const y = (this.surfaceY(Math.floor(x), Math.floor(z)) || SEA_LEVEL) + 0.05;
      this.enemies.push({
        x: x + (extra?.boss ? 0 : 0.5),
        y: extra?.fly || kind === "flyer" || kind === "lord" ? y + 4 + rngE() * 5 : y,
        z: z + (extra?.boss ? 0 : 0.5),
        power,
        kind,
        species: extra?.boss ? P.boss.species : speciesFor(kind, this.planet),
        name: extra?.name,
        boss: extra?.boss,
      });
    };
    for (let i = 0; i < patrol; i++) {
      const x = 8 + ((rngE() * (SX - 16)) | 0);
      const z = 8 + ((rngE() * (SZ - 16)) | 0);
      const dx = x - this.spawn.x;
      const dz = z - this.spawn.z;
      if (dx * dx + dz * dz < 12 * 12) continue;
      const kind = pickKind(P.enemyMix, rngE);
      const power =
        1100 +
        rank * 900 +
        ((rngE() * (1600 + rank * 500)) | 0) +
        (kind === "flyer" ? 500 : kind === "brute" ? 800 : kind === "elite" ? 1200 : 0);
      pushE(x, z, kind, power, { fly: kind === "flyer" });
    }
    for (const b of this.balls) {
      for (let g = 0; g < 2; g++) {
        const ang = rngE() * Math.PI * 2;
        const rad = 3.2 + rngE() * 3.4;
        const gx = Math.max(4, Math.min(SX - 5, b.x + Math.cos(ang) * rad));
        const gz = Math.max(4, Math.min(SZ - 5, b.z + Math.sin(ang) * rad));
        const kind = pickKind(P.enemyMix, rngE);
        const power = 1400 + rank * 1100 + ((rngE() * 900) | 0);
        pushE(gx, gz, kind, power);
      }
    }
    for (let t = 0; t < 3; t++) {
      const ang = (t / 3) * Math.PI * 2;
      pushE(tx + Math.cos(ang) * 5.5, tz + Math.sin(ang) * 5.5, t === 0 ? "brute" : pickKind(P.enemyMix, rngE), 1800 + rank * 1200);
    }
    const by = this.surfaceY(tx, tz);
    this.enemies.push({
      x: tx + 0.5,
      y: P.boss.kind === "flyer" || P.boss.kind === "lord" ? by + 5 : by,
      z: tz + 0.5,
      power: P.boss.power,
      kind: P.boss.kind,
      species: P.boss.species,
      name: P.boss.name,
      boss: true,
    });

    this.npcs = [
      {
        x: this.spawn.x + 1.6,
        y: this.spawn.y,
        z: this.spawn.z - 4.5,
        name: P.npc.name,
        species: P.npc.species,
        portrait: P.npc.portrait,
        lines: P.npc.lines,
      },
    ];

    this.landmarks = [
      { name: "Nest", x: this.spawn.x, y: this.spawn.y, z: this.spawn.z },
      { name: "Tempel", x: tx + 0.5, y: th + 4, z: tz + 0.5 },
    ];
    this.carveMaps(P.id, rngI, height, vx, vz, plazaH, tx, tz, th);

    if (P.spikes !== "none") {
      const block = P.spikes === "ice" ? ICE : BASALT;
      for (let i = 0; i < 48; i++) {
        const x = 6 + ((rngI() * (SX - 12)) | 0);
        const z = 6 + ((rngI() * (SZ - 12)) | 0);
        const h = height[x + z * SX]!;
        if (h <= SEA_LEVEL) continue;
        const tall = 3 + ((rngI() * 7) | 0);
        for (let dy = 1; dy <= tall; dy++) this.set(x, h + dy, z, dy === tall ? KI : block);
      }
    }

    onProgress?.(1);
  }

  surfaceY(x: number, z: number) {
    for (let y = SY - 2; y >= 1; y--) {
      if (this.isSolid(x, y, z) && !this.isSolid(x, y + 1, z)) return y + 1;
    }
    return SEA_LEVEL + 1;
  }

  private mark(name: string, x: number, z: number) {
    this.landmarks.push({ name, x: x + 0.5, y: this.surfaceY(x, z), z: z + 0.5 });
  }

  private pillar(x: number, z: number, h: number, block: number, cap?: number) {
    const y0 = this.surfaceY(x, z);
    for (let dy = 0; dy < h; dy++) this.set(x, y0 + dy, z, dy === h - 1 && cap != null ? cap : block);
  }

  private carveMaps(
    planet: PlanetId,
    rng: () => number,
    height: Int16Array,
    vx: number,
    vz: number,
    plazaH: number,
    tx: number,
    tz: number,
    th: number,
  ) {
    const pick = () => {
      for (let i = 0; i < 24; i++) {
        const x = 10 + ((rng() * (SX - 20)) | 0);
        const z = 10 + ((rng() * (SZ - 20)) | 0);
        const h = height[x + z * SX] ?? 0;
        if (h <= SEA_LEVEL + 2) continue;
        if (Math.hypot(x - vx, z - vz) < 16) continue;
        if (Math.hypot(x - tx, z - tz) < 14) continue;
        return { x, z, h };
      }
      return { x: vx + 18, z: vz + 14, h: plazaH };
    };

    if (planet === "verdant") {
      const a = pick();
      for (let dy = 0; dy < 9; dy++) {
        this.set(a.x, a.h + dy, a.z, WOOD);
        if (dy > 4) {
          this.set(a.x + 1, a.h + dy, a.z, WOOD);
          this.set(a.x - 1, a.h + dy, a.z, WOOD);
          this.set(a.x, a.h + dy, a.z + 1, WOOD);
          this.set(a.x, a.h + dy, a.z - 1, WOOD);
        }
      }
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) this.set(a.x + dx, a.h + 9, a.z + dz, LEAVES);
      this.set(a.x, a.h + 10, a.z, KI);
      this.mark("Wachturm", a.x, a.z);
      const b = pick();
      for (let i = -6; i <= 6; i++) {
        this.set(b.x + i, Math.max(SEA_LEVEL, b.h - 2), b.z, SAND);
        this.set(b.x + i, Math.max(1, b.h - 3), b.z, WATER);
      }
      this.mark("Flussbett", b.x, b.z);
    } else if (planet === "terra") {
      const a = pick();
      for (let dz = -3; dz <= 3; dz++) {
        for (let dx = -3; dx <= 3; dx++) {
          for (let dy = 0; dy < 4; dy++) {
            if (Math.hypot(dx, dz) < 3.4) this.set(a.x + dx, a.h - dy, a.z + dz, AIR);
          }
          if (Math.abs(dx) === 3 || Math.abs(dz) === 3) this.set(a.x + dx, a.h - 4, a.z + dz, METAL);
        }
      }
      this.set(a.x, a.h - 3, a.z, KI);
      this.mark("Steinbruch", a.x, a.z);
      const b = pick();
      for (let dy = 0; dy < 5; dy++) this.set(b.x, b.h + dy, b.z, METAL);
      this.set(b.x + 1, b.h + 2, b.z, METAL);
      this.set(b.x - 1, b.h + 1, b.z, METAL);
      this.mark("Schrottkamm", b.x, b.z);
    } else if (planet === "cinder") {
      const a = pick();
      for (let i = 0; i < 10; i++) {
        this.set(a.x + i, a.h, a.z, BASALT);
        this.set(a.x + i, a.h, a.z + 1, BASALT);
        this.set(a.x + i, a.h - 1, a.z, LAVA);
      }
      this.mark("Lavabrücke", a.x + 5, a.z);
      const b = pick();
      for (let dy = 0; dy < 8; dy++) this.set(b.x, b.h + dy, b.z, BASALT);
      this.set(b.x, b.h + 8, b.z, LAVA);
      this.set(b.x + 1, b.h + 3, b.z, METAL);
      this.set(b.x - 1, b.h + 3, b.z, METAL);
      this.mark("Esse", b.x, b.z);
    } else if (planet === "rime") {
      const a = pick();
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const x = (a.x + Math.cos(ang) * 5) | 0;
        const z = (a.z + Math.sin(ang) * 5) | 0;
        this.pillar(x, z, 6 + ((rng() * 4) | 0), ICE, KI);
      }
      this.mark("Eiskranz", a.x, a.z);
      const b = pick();
      for (let dy = 0; dy < 11; dy++) this.set(b.x, b.h + dy, b.z, ICE);
      this.set(b.x, b.h + 11, b.z, KI);
      this.mark("Frostnadel", b.x, b.z);
    } else {
      const a = pick();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const x = (a.x + Math.cos(ang) * 6) | 0;
        const z = (a.z + Math.sin(ang) * 6) | 0;
        this.set(x, a.h + 6, z, CLOUD);
        this.set(x, a.h + 7, z, KI);
      }
      this.mark("Torring", a.x, a.z);
      const b = pick();
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = -2; dx <= 2; dx++) this.set(b.x + dx, b.h + 8 + dy, b.z, CLOUD);
      }
      this.mark("Himmelssteg", b.x, b.z);
    }
    void th;
    this.layPath(vx, vz, tx, tz, height, plazaH);
    const gate = pick();
    if (planet === "verdant") {
      this.ruinRing(gate.x, gate.z, 4, WOOD, LEAVES);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) this.set(gate.x + dx, gate.h, gate.z + dz, PATH);
      this.set(gate.x, gate.h + 1, gate.z, KI);
      this.mark("Dorf", gate.x, gate.z);
    } else if (planet === "terra") {
      this.ruinRing(gate.x, gate.z, 5, METAL, KI);
      this.mark("Relais", gate.x, gate.z);
    } else if (planet === "cinder") {
      this.ruinRing(gate.x, gate.z, 4, BASALT, LAVA);
      this.mark("Aschtor", gate.x, gate.z);
    } else if (planet === "rime") {
      this.ruinRing(gate.x, gate.z, 5, ICE, KI);
      this.mark("Gletschertor", gate.x, gate.z);
    } else {
      this.ruinRing(gate.x, gate.z, 5, CLOUD, KI);
      this.mark("Wolkentor", gate.x, gate.z);
    }
  }

  private layPath(ax: number, az: number, bx: number, bz: number, height: Int16Array, plazaH: number) {
    const steps = 22;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = Math.max(1, Math.min(SX - 2, (ax + (bx - ax) * t) | 0));
      const z = Math.max(1, Math.min(SZ - 2, (az + (bz - az) * t) | 0));
      const h = height[x + z * SX] ?? plazaH;
      this.set(x, h, z, PATH);
      this.set(x + 1, h, z, PATH);
    }
    this.mark("Pfad", ((ax + bx) / 2) | 0, ((az + bz) / 2) | 0);
  }

  private ruinRing(x: number, z: number, r: number, block: number, cap?: number) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const px = (x + Math.cos(ang) * r) | 0;
      const pz = (z + Math.sin(ang) * r) | 0;
      this.pillar(px, pz, 3 + (i % 3), block, cap);
    }
  }

  scatterBalls(rng: () => number) {
    const hx = (SX / 2) | 0;
    const hz = (SZ / 2) | 0;
    this.balls = [];
    for (let i = 0; i < BALL_COUNT; i++) {
      const ang = (i / BALL_COUNT) * Math.PI * 2 + rng() * 0.45;
      const rad = 18 + rng() * 38;
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
  const maxX = Math.floor(x + hw - 1e-6);
  const minY = Math.floor(y + 1e-4);
  const maxY = Math.floor(y + h - 1e-4);
  const minZ = Math.floor(z - hw);
  const maxZ = Math.floor(z + hw - 1e-6);
  for (let iy = minY; iy <= maxY; iy++) {
    for (let iz = minZ; iz <= maxZ; iz++) {
      for (let ix = minX; ix <= maxX; ix++) {
        if (world.isSolid(ix, iy, iz)) return true;
      }
    }
  }
  return false;
}

/** Highest solid top (blockY+1) under an XZ AABB, searching down from fromY. */
export function supportY(world: World, px: number, pz: number, fromY: number, hw: number) {
  const minX = Math.floor(px - hw);
  const maxX = Math.floor(px + hw - 1e-6);
  const minZ = Math.floor(pz - hw);
  const maxZ = Math.floor(pz + hw - 1e-6);
  const y0 = Math.min(SY - 2, Math.max(0, Math.floor(fromY)));
  let best = -Infinity;
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let y = y0; y >= 0; y--) {
        if (world.isSolid(x, y, z)) {
          if (y + 1 > best) best = y + 1;
          break;
        }
      }
    }
  }
  return best === -Infinity ? null : best;
}
