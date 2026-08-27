import * as THREE from "three";
import { AIR, CHUNK, CLOUD, KI, LEAVES, SX, SY, SZ, WATER } from "./constants";
import { ATLAS_COLS, ATLAS_ROWS, TILE_SIZE, faceTile } from "./textures";
import type { World } from "./world";

const DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const FACE_VERTS: number[][][] = [
  [
    [1, 0, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 1, 1],
    [1, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
  ],
  [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
  ],
];

const FACE_UV: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

const FACE_SHADE = [0.76, 0.76, 1.05, 0.48, 0.86, 0.62];

function opaque(world: World, x: number, y: number, z: number) {
  const b = world.get(x, y, z);
  return b !== AIR && b !== LEAVES && b !== WATER && b !== CLOUD;
}

function tileUv(tile: number, u: number, v: number): [number, number] {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const su = 1 / ATLAS_COLS;
  const sv = 1 / ATLAS_ROWS;
  const insetU = 0.5 / TILE_SIZE / ATLAS_COLS + 0.001;
  const insetV = 0.5 / TILE_SIZE / ATLAS_ROWS + 0.001;
  return [col * su + insetU + u * (su - insetU * 2), 1 - (row * sv + insetV + (1 - v) * (sv - insetV * 2))];
}

function vertexAO(
  world: World,
  wx: number,
  wy: number,
  wz: number,
  nx: number,
  ny: number,
  nz: number,
  px: number,
  py: number,
  pz: number,
) {
  const bx = wx + nx;
  const by = wy + ny;
  const bz = wz + nz;
  let s1 = false;
  let s2 = false;
  let c = false;
  if (nx !== 0) {
    const dy = py * 2 - 1;
    const dz = pz * 2 - 1;
    s1 = opaque(world, bx, by + dy, bz);
    s2 = opaque(world, bx, by, bz + dz);
    c = opaque(world, bx, by + dy, bz + dz);
  } else if (ny !== 0) {
    const dx = px * 2 - 1;
    const dz = pz * 2 - 1;
    s1 = opaque(world, bx + dx, by, bz);
    s2 = opaque(world, bx, by, bz + dz);
    c = opaque(world, bx + dx, by, bz + dz);
  } else {
    const dx = px * 2 - 1;
    const dy = py * 2 - 1;
    s1 = opaque(world, bx + dx, by, bz);
    s2 = opaque(world, bx, by + dy, bz);
    c = opaque(world, bx + dx, by + dy, bz);
  }
  const occ = s1 && s2 ? 0 : 3 - (Number(s1) + Number(s2) + Number(c));
  return 0.55 + (occ / 3) * 0.45;
}

export function meshChunk(world: World, cx: number, cy: number, cz: number): THREE.BufferGeometry | null {
  const ox = cx * CHUNK;
  const oy = cy * CHUNK;
  const oz = cz * CHUNK;
  if (ox >= SX || oy >= SY || oz >= SZ || ox < 0 || oy < 0 || oz < 0) return null;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  const xMax = Math.min(CHUNK, SX - ox);
  const yMax = Math.min(CHUNK, SY - oy);
  const zMax = Math.min(CHUNK, SZ - oz);

  for (let ly = 0; ly < yMax; ly++) {
    for (let lz = 0; lz < zMax; lz++) {
      for (let lx = 0; lx < xMax; lx++) {
        const wx = ox + lx;
        const wy = oy + ly;
        const wz = oz + lz;
        const block = world.get(wx, wy, wz);
        if (block === AIR) continue;
        const leaf = block === LEAVES || block === CLOUD;
        const water = block === WATER;
        for (let f = 0; f < 6; f++) {
          const [dx, dy, dz] = DIRS[f]!;
          const nb = world.get(wx + dx, wy + dy, wz + dz);
          if (water) {
            if (nb !== AIR && nb !== LEAVES) continue;
          } else if (leaf) {
            if (nb === LEAVES || opaque(world, wx + dx, wy + dy, wz + dz)) continue;
          } else if (opaque(world, wx + dx, wy + dy, wz + dz)) {
            continue;
          }
          const tile = faceTile(block, dy);
          const shade = FACE_SHADE[f]!;
          const tint = block === KI ? 1.45 : water ? 1.08 : 1;
          const verts = FACE_VERTS[f]!;
          for (let v = 0; v < 4; v++) {
            const p = verts[v]!;
            positions.push(wx + p[0]!, wy + p[1]!, wz + p[2]!);
            normals.push(dx, dy, dz);
            const [uu, vv] = FACE_UV[v]!;
            const [u, tv] = tileUv(tile, uu, vv);
            uvs.push(u, tv);
            const ao = vertexAO(world, wx, wy, wz, dx, dy, dz, p[0]!, p[1]!, p[2]!);
            const s = shade * tint * ao;
            if (block === KI) colors.push(s * 1.05, s * 1.15, s * 1.2);
            else if (water) colors.push(s * 0.55, s * 0.95, s * 1.15);
            else colors.push(s, s, s);
          }
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const faces = positions.length / 12;
  const index = new Uint32Array(faces * 6);
  for (let i = 0; i < faces; i++) {
    const v = i * 4;
    const o = i * 6;
    index[o] = v;
    index[o + 1] = v + 1;
    index[o + 2] = v + 2;
    index[o + 3] = v;
    index[o + 4] = v + 2;
    index[o + 5] = v + 3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  return geo;
}
