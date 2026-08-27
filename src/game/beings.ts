import * as THREE from "three";
import { SPECIES, type SpeciesId } from "./campaign";
import type { EnemyKind } from "./world";

/** One Minecraft pixel in meters (Steve is 32px = 1.8 m). */
const U = 1.8 / 32;

type Pal = (typeof SPECIES)[SpeciesId] & {
  gi: number;
  sash: number;
  pants: number;
  boot: number;
  hair: number;
  lip: number;
};

const CLOTH: Record<SpeciesId, Pick<Pal, "gi" | "sash" | "pants" | "boot" | "hair" | "lip">> = {
  solari: { gi: 0xf0ead8, sash: 0xb03a2e, pants: 0x1c1a22, boot: 0x2a241c, hair: 0x1a1208, lip: 0xa06050 },
  veldari: { gi: 0x3d6e32, sash: 0x6a4a28, pants: 0x2a3a22, boot: 0x3a2a18, hair: 0x1a3a14, lip: 0x2a4a20 },
  cryon: { gi: 0xe8eef8, sash: 0x6a4aaa, pants: 0x3a3a58, boot: 0x2a2a40, hair: 0xd8e8ff, lip: 0xb0a0c8 },
  automata: { gi: 0x6a7078, sash: 0x5a2020, pants: 0x4a5058, boot: 0x2a2e32, hair: 0x8a9098, lip: 0x404448 },
  thrynn: { gi: 0x6a3a18, sash: 0xc4a060, pants: 0x3a2414, boot: 0x24180c, hair: 0x1a0c04, lip: 0x8a4a28 },
  aetheri: { gi: 0xe8f4ff, sash: 0x3a6a9a, pants: 0x2a3a58, boot: 0xc8d8e8, hair: 0xf4fcff, lip: 0x90b0c8 },
};

const texCache = new Map<string, THREE.CanvasTexture>();

function hex(n: number) {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function mix(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = (ar + (br - ar) * t) | 0;
  const g = (ag + (bg - ag) * t) | 0;
  const bl = (ab + (bb - ab) * t) | 0;
  return (r << 16) | (g << 8) | bl;
}

function shade(n: number, k: number) {
  return mix(n, k < 1 ? 0x000000 : 0xffffff, k < 1 ? 1 - k : k - 1);
}

function palOf(species: SpeciesId): Pal {
  return { ...SPECIES[species], ...CLOTH[species] };
}

function paint(key: string, w: number, h: number, draw: (p: (x: number, y: number, ww: number, hh: number, c: number) => void) => void) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const p = (x: number, y: number, ww: number, hh: number, col: number) => {
    ctx.fillStyle = hex(col);
    ctx.fillRect(x, y, ww, hh);
  };
  draw(p);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.cached = true;
  texCache.set(key, tex);
  return tex;
}

function matMap(tex: THREE.CanvasTexture, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshLambertMaterial({
    map: tex,
    emissive,
    emissiveIntensity: intensity,
  });
}

function matCol(color: number, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: intensity });
}

function boxMesh(
  w: number,
  h: number,
  d: number,
  material: THREE.Material | THREE.Material[],
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = false;
  return m;
}

function faceTex(species: SpeciesId, pal: Pal) {
  return paint(`face:${species}`, 16, 16, (p) => {
    p(0, 0, 16, 16, pal.head);
    p(0, 0, 16, 4, pal.hair);
    p(1, 4, 14, 1, shade(pal.hair, 0.75));
    if (species === "automata") {
      p(0, 0, 16, 16, pal.head);
      p(1, 1, 14, 14, shade(pal.head, 0.85));
      p(2, 6, 12, 4, 0x1a1010);
      p(3, 7, 10, 2, pal.eye);
      p(7, 6, 2, 4, shade(pal.accent, 1.2));
      return;
    }
    const brow = shade(pal.hair, 0.9);
    p(3, 5, 4, 1, brow);
    p(9, 5, 4, 1, brow);
    p(3, 6, 4, 3, 0xf5f5f0);
    p(9, 6, 4, 3, 0xf5f5f0);
    p(4, 7, 2, 2, pal.eye);
    p(10, 7, 2, 2, pal.eye);
    if (species === "cryon") {
      p(3, 10, 4, 2, 0xf5f5f0);
      p(9, 10, 4, 2, 0xf5f5f0);
      p(4, 10, 2, 2, pal.eye);
      p(10, 10, 2, 2, pal.eye);
    } else {
      p(6, 11, 4, 1, shade(pal.head, 0.82));
      p(7, 12, 2, 1, pal.lip);
    }
    if (species === "solari") p(5, 3, 6, 2, pal.hair);
    if (species === "aetheri") p(0, 0, 16, 5, pal.hair);
  });
}

function sideHeadTex(species: SpeciesId, pal: Pal) {
  return paint(`head-side:${species}`, 16, 16, (p) => {
    p(0, 0, 16, 16, pal.head);
    p(0, 0, 16, 7, pal.hair);
    p(0, 7, 16, 2, shade(pal.hair, 0.8));
    if (species === "automata") {
      p(0, 0, 16, 16, shade(pal.head, 0.9));
      p(6, 6, 4, 4, pal.accent);
    }
  });
}

function topHeadTex(species: SpeciesId, pal: Pal) {
  return paint(`head-top:${species}`, 16, 16, (p) => {
    p(0, 0, 16, 16, pal.hair);
    p(2, 2, 12, 12, shade(pal.hair, 1.12));
    p(5, 5, 6, 6, shade(pal.hair, 0.85));
  });
}

function giTex(species: SpeciesId, pal: Pal, kind: "front" | "back" | "side") {
  return paint(`gi:${species}:${kind}`, 16, 24, (p) => {
    p(0, 0, 16, 24, pal.gi);
    p(0, 0, 16, 3, pal.sash);
    p(0, 21, 16, 3, shade(pal.gi, 0.82));
    if (kind === "front") {
      p(7, 4, 2, 16, shade(pal.gi, 1.15));
      p(0, 4, 1, 16, pal.sash);
      p(15, 4, 1, 16, pal.sash);
      if (species === "solari") {
        p(4, 8, 8, 2, pal.accent);
        p(6, 7, 4, 4, pal.accent);
      }
      if (species === "thrynn") {
        p(3, 6, 10, 8, shade(pal.accent, 0.7));
        p(5, 8, 6, 4, pal.accent);
      }
      if (species === "automata") {
        p(5, 8, 6, 6, pal.accent);
        p(6, 9, 4, 4, pal.eye);
      }
    }
    if (kind === "back") p(4, 4, 8, 14, shade(pal.gi, 0.9));
  });
}

function limbTex(base: number, stripe: number) {
  const key = `limb:${base}:${stripe}`;
  return paint(key, 8, 16, (p) => {
    p(0, 0, 8, 16, base);
    p(0, 10, 8, 3, stripe);
    p(0, 0, 8, 2, shade(base, 0.8));
    p(0, 14, 8, 2, shade(base, 0.75));
  });
}

function skinTex(col: number) {
  return paint(`skin:${col}`, 8, 8, (p) => {
    p(0, 0, 8, 8, col);
    p(2, 2, 4, 4, shade(col, 1.08));
  });
}

function cubeMats(right: THREE.Material, left: THREE.Material, top: THREE.Material, bottom: THREE.Material, front: THREE.Material, back: THREE.Material) {
  return [right, left, top, bottom, front, back];
}

/**
 * Minecraft-proportioned humanoid (32px / 1.8 m) with ki-gi silhouette.
 * Pivot groups: hips, head, leftArm, rightArm, leftFore, rightFore, leftLeg, rightLeg, leftShin, rightShin.
 */
export function makeBeing(kind: EnemyKind, species: SpeciesId): THREE.Group {
  const g = new THREE.Group();
  const pal = palOf(species);
  const scale = kind === "lord" ? 1.48 : kind === "elite" ? 1.22 : kind === "brute" ? 1.34 : kind === "flyer" ? 0.94 : 1;
  const glow = species === "cryon" || species === "aetheri" || kind === "lord" ? 0.18 : kind === "elite" ? 0.1 : 0;

  const face = matMap(faceTex(species, pal), pal.eye, glow * 0.4);
  const headSide = matMap(sideHeadTex(species, pal));
  const headTop = matMap(topHeadTex(species, pal));
  const neck = matCol(pal.head);
  const giF = matMap(giTex(species, pal, "front"), pal.accent, glow);
  const giB = matMap(giTex(species, pal, "back"));
  const giS = matMap(giTex(species, pal, "side"));
  const sashM = matCol(pal.sash, pal.accent, 0.12);
  const pantsM = matMap(limbTex(pal.pants, pal.boot));
  const sleeveM = matMap(limbTex(pal.gi, pal.sash));
  const skinM = matMap(skinTex(pal.head));
  const bootM = matCol(pal.boot);

  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 12 * U;

  const torso = boxMesh(8 * U, 12 * U, 4 * U, cubeMats(giS, giS, sashM, pantsM, giF, giB), 0, 6 * U, 0);
  torso.name = "body";
  const wrap = boxMesh(8.6 * U, 8 * U, 4.6 * U, giS, 0, 7 * U, 0);
  wrap.name = "gi";
  const sash = boxMesh(8.8 * U, 1.6 * U, 4.8 * U, sashM, 0, 1.6 * U, 0);
  sash.name = "sash";
  hips.add(torso, wrap, sash);

  const headG = new THREE.Group();
  headG.name = "head";
  headG.position.y = 12 * U;
  const skull = boxMesh(8 * U, 8 * U, 8 * U, cubeMats(headSide, headSide, headTop, neck, face, headSide), 0, 4 * U, 0);
  skull.name = "skull";
  headG.add(skull);
  addHair(headG, species, pal, kind);
  addFaceExtras(headG, species, pal);
  hips.add(headG);

  const leftArm = makeArm(sleeveM, skinM, pal, -1, species === "thrynn" ? 1.12 : 1);
  leftArm.name = "leftArm";
  leftArm.position.set(-6 * U, 12 * U, 0);
  const rightArm = makeArm(sleeveM, skinM, pal, 1, species === "thrynn" ? 1.12 : 1);
  rightArm.name = "rightArm";
  rightArm.position.set(6 * U, 12 * U, 0);
  hips.add(leftArm, rightArm);

  const leftLeg = makeLeg(pantsM, bootM, -1);
  leftLeg.name = "leftLeg";
  leftLeg.position.set(-2 * U, 12 * U, 0);
  const rightLeg = makeLeg(pantsM, bootM, 1);
  rightLeg.name = "rightLeg";
  rightLeg.position.set(2 * U, 12 * U, 0);
  g.add(leftLeg, rightLeg, hips);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 14),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.name = "shadow";
  g.add(shadow);

  if (kind === "flyer" || species === "aetheri") {
    const wingM = matCol(pal.accent, pal.body, 0.28);
    const wing = boxMesh(22 * U, 0.7 * U, 7 * U, wingM, 0, 20 * U, -1.2 * U);
    wing.name = "wing";
    g.add(wing);
  }
  if (kind === "lord" || kind === "elite") {
    const cape = boxMesh(10 * U, 18 * U, 1 * U, matCol(pal.accent, pal.body, 0.14), 0, 16 * U, 3.2 * U);
    cape.rotation.x = 0.16;
    cape.name = "cape";
    g.add(cape);
  }
  if (kind === "elite" || kind === "lord") {
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.045, 8, 22),
      new THREE.MeshBasicMaterial({
        color: pal.eye,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = 0.95;
    aura.name = "aura";
    g.add(aura);
  }

  g.scale.setScalar(scale);
  g.userData.kind = kind;
  g.userData.species = species;
  return g;
}

function makeArm(sleeve: THREE.Material, skin: THREE.Material, pal: Pal, side: number, thick = 1) {
  const g = new THREE.Group();
  const t = thick;
  const upper = boxMesh(4 * U * t, 6 * U, 4 * U * t, sleeve, 0, -3 * U, 0);
  const fore = new THREE.Group();
  fore.name = side < 0 ? "leftFore" : "rightFore";
  fore.position.y = -6 * U;
  const lower = boxMesh(3.6 * U * t, 5 * U, 3.6 * U * t, sleeve, 0, -2.5 * U, 0);
  lower.name = "forearm";
  const cuff = boxMesh(4.2 * U * t, 1.2 * U, 4.2 * U * t, matCol(pal.sash), 0, -5.2 * U, 0);
  const fist = boxMesh(4.2 * U, 3.2 * U, 4.6 * U, skin, 0, -6.6 * U, 0.4 * U);
  fist.name = "fist";
  fore.add(lower, cuff, fist);
  g.add(upper, fore);
  g.rotation.z = side * 0.06;
  return g;
}

function makeLeg(pants: THREE.Material, boot: THREE.Material, side: number) {
  const g = new THREE.Group();
  const thigh = boxMesh(4 * U, 6 * U, 4 * U, pants, 0, -3 * U, 0);
  const shin = new THREE.Group();
  shin.name = side < 0 ? "leftShin" : "rightShin";
  shin.position.y = -6 * U;
  const calf = boxMesh(3.8 * U, 4.4 * U, 3.8 * U, pants, 0, -2.2 * U, 0);
  const foot = boxMesh(4.2 * U, 2.4 * U, 5.2 * U, boot, 0, -5.4 * U, 0.6 * U);
  foot.name = "boot";
  shin.add(calf, foot);
  g.add(thigh, shin);
  return g;
}

function addHair(head: THREE.Group, species: SpeciesId, pal: Pal, kind: EnemyKind) {
  const hairM = matCol(pal.hair, pal.eye, species === "solari" ? 0.06 : 0.14);
  if (species === "solari") {
    head.add(boxMesh(8.6 * U, 2.4 * U, 8.6 * U, hairM, 0, 7.4 * U, 0));
    const spikes: [number, number, number, number, number][] = [
      [0, -2.2 * U, 8.4 * U, -0.55, 2.2 * U],
      [-2.4 * U, -0.6 * U, 6.6 * U, -0.28, 1.8 * U],
      [2.4 * U, -0.6 * U, 6.6 * U, -0.28, 1.8 * U],
      [0, 2.4 * U, 4.2 * U, 0.45, 1.6 * U],
      [-1.6 * U, 1.6 * U, 5.2 * U, 0.2, 1.5 * U],
      [1.6 * U, 1.6 * U, 5.2 * U, 0.2, 1.5 * U],
    ];
    if (kind === "lord" || kind === "elite") {
      spikes.push([0, -3.2 * U, 11 * U, -0.72, 2.4 * U]);
    }
    for (const [x, z, h, rx, w] of spikes) {
      const s = boxMesh(w, h, w, hairM, x, 8 * U + h * 0.15, z);
      s.rotation.x = rx;
      head.add(s);
    }
  } else if (species === "veldari") {
    const antG = new THREE.ConeGeometry(0.9 * U, 6 * U, 6);
    antG.rotateX(Math.PI);
    const a = new THREE.Mesh(antG, hairM);
    a.position.set(1.8 * U, 8.6 * U, 0);
    const b = a.clone();
    b.position.x = -1.8 * U;
    head.add(a, b);
    head.add(boxMesh(8.4 * U, 1.6 * U, 8.4 * U, hairM, 0, 8.2 * U, 0));
  } else if (species === "cryon") {
    const n = kind === "lord" ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const s = boxMesh(1.4 * U, kind === "lord" ? 9 * U : 5.4 * U, 1.4 * U, hairM, (i - (n - 1) / 2) * 2.2 * U, 9.2 * U, 0);
      head.add(s);
    }
  } else if (species === "thrynn") {
    const horn = new THREE.ConeGeometry(1.2 * U, 7 * U, 6);
    const h1 = new THREE.Mesh(horn, hairM);
    const h2 = h1.clone();
    h1.position.set(-3.2 * U, 7.6 * U, 0.4 * U);
    h2.position.set(3.2 * U, 6.6 * U, 0.4 * U);
    h1.rotation.z = 0.55;
    h2.rotation.z = -0.42;
    head.add(h1, h2);
    head.add(boxMesh(8.2 * U, 1.4 * U, 8.2 * U, matCol(pal.sash), 0, 8 * U, 0));
  } else if (species === "aetheri") {
    head.add(boxMesh(8.8 * U, 2.2 * U, 8.8 * U, hairM, 0, 8 * U, 0));
    const bun = boxMesh(3.4 * U, 3.4 * U, 3.4 * U, hairM, 0, 10.4 * U, 0);
    bun.name = "bun";
    head.add(bun);
  } else if (species === "automata") {
    head.add(boxMesh(9 * U, 1.4 * U, 9 * U, matCol(pal.accent, pal.eye, 0.3), 0, 8.4 * U, 0));
  }
}

function addFaceExtras(head: THREE.Group, species: SpeciesId, pal: Pal) {
  if (species === "automata") return;
  const brow = boxMesh(7 * U, 0.5 * U, 0.4 * U, matCol(pal.hair), 0, 5.4 * U, 4.05 * U);
  head.add(brow);
}

export function poseBeing(
  g: THREE.Group,
  t: number,
  state: { speed: number; flying: boolean; attacking: boolean; grounded: boolean },
) {
  const hips = g.getObjectByName("hips") as THREE.Group | undefined;
  const leftArm = g.getObjectByName("leftArm") as THREE.Group | undefined;
  const rightArm = g.getObjectByName("rightArm") as THREE.Group | undefined;
  const leftFore = g.getObjectByName("leftFore") as THREE.Group | undefined;
  const rightFore = g.getObjectByName("rightFore") as THREE.Group | undefined;
  const leftLeg = g.getObjectByName("leftLeg") as THREE.Group | undefined;
  const rightLeg = g.getObjectByName("rightLeg") as THREE.Group | undefined;
  const leftShin = g.getObjectByName("leftShin") as THREE.Group | undefined;
  const rightShin = g.getObjectByName("rightShin") as THREE.Group | undefined;
  const wing = g.getObjectByName("wing") as THREE.Mesh | undefined;
  const aura = g.getObjectByName("aura") as THREE.Mesh | undefined;
  const cape = g.getObjectByName("cape") as THREE.Mesh | undefined;
  const head = g.getObjectByName("head") as THREE.Group | undefined;
  const shadow = g.getObjectByName("shadow") as THREE.Mesh | undefined;
  const bun = g.getObjectByName("bun") as THREE.Mesh | undefined;

  const amp = Math.min(1.15, state.speed / 5.2);
  const run = amp > 0.65;
  const walkT = t * (run ? 11.5 : 8.6);

  if (state.flying) {
    const flap = Math.sin(t * 7.5);
    if (leftArm) {
      leftArm.rotation.x = Math.PI * 0.88;
      leftArm.rotation.z = -0.18;
    }
    if (rightArm) {
      rightArm.rotation.x = Math.PI * 0.88;
      rightArm.rotation.z = 0.18;
    }
    if (leftFore) leftFore.rotation.x = 0.35;
    if (rightFore) rightFore.rotation.x = 0.35;
    if (leftLeg) leftLeg.rotation.x = 0.42;
    if (rightLeg) rightLeg.rotation.x = 0.18;
    if (leftShin) leftShin.rotation.x = 0.25;
    if (rightShin) rightShin.rotation.x = 0.12;
    if (hips) {
      hips.rotation.x = 0.52;
      hips.position.y = 12 * U;
    }
    if (shadow) shadow.visible = false;
    if (cape) cape.rotation.x = 0.55 + flap * 0.08;
  } else {
    const swing = Math.sin(walkT) * amp * 0.95;
    const knee = Math.max(0, -Math.sin(walkT)) * amp * 0.7;
    const kneeR = Math.max(0, Math.sin(walkT)) * amp * 0.7;
    const bob = state.grounded ? Math.abs(Math.sin(walkT)) * amp * 0.045 : 0;
    if (state.attacking) {
      if (leftArm) {
        leftArm.rotation.x = 0.35;
        leftArm.rotation.z = -0.25;
      }
      if (rightArm) {
        rightArm.rotation.x = -1.65;
        rightArm.rotation.z = 0.12;
      }
      if (leftFore) leftFore.rotation.x = 0.4;
      if (rightFore) rightFore.rotation.x = -0.35;
    } else {
      if (leftArm) {
        leftArm.rotation.x = swing;
        leftArm.rotation.z = -0.06;
      }
      if (rightArm) {
        rightArm.rotation.x = -swing;
        rightArm.rotation.z = 0.06;
      }
      if (leftFore) leftFore.rotation.x = 0.15 + Math.max(0, swing) * 0.35;
      if (rightFore) rightFore.rotation.x = 0.15 + Math.max(0, -swing) * 0.35;
    }
    if (leftLeg) leftLeg.rotation.x = state.grounded ? -swing : 0.25;
    if (rightLeg) rightLeg.rotation.x = state.grounded ? swing : 0.4;
    if (leftShin) leftShin.rotation.x = state.grounded ? knee : 0.35;
    if (rightShin) rightShin.rotation.x = state.grounded ? kneeR : 0.2;
    if (hips) {
      hips.rotation.x = run ? 0.12 : 0;
      hips.rotation.z = state.grounded ? Math.sin(walkT) * amp * 0.04 : 0;
      hips.position.y = 12 * U + bob;
    }
    if (shadow) {
      shadow.visible = state.grounded;
      shadow.scale.setScalar(1 - bob * 2);
    }
    if (cape) cape.rotation.x = 0.16 + amp * 0.2 + Math.sin(t * 5) * 0.04;
  }

  if (head) {
    head.rotation.y = Math.sin(t * 1.35) * 0.1;
    head.rotation.x = state.flying ? -0.15 : state.attacking ? 0.08 : Math.sin(t * 2.2) * 0.03;
  }
  if (wing) {
    wing.rotation.z = Math.sin(t * 12) * 0.28;
    wing.position.y = 20 * U + Math.sin(t * 12) * 0.04;
  }
  if (aura) {
    aura.rotation.z = t * 2.6;
    const s = 1 + Math.sin(t * 6.2) * 0.07;
    aura.scale.set(s, s, 1);
  }
  if (bun) bun.position.y = 10.4 * U + Math.sin(t * 3) * 0.02;
}

export function makeViewArms() {
  const skin = matCol(0xe8c8a4);
  const gi = matCol(0xf2ead8);
  const band = matCol(0xb03a2e);
  const arm = (side: number) => {
    const g = new THREE.Group();
    const upper = boxMesh(0.14, 0.32, 0.14, gi, 0, -0.12, 0);
    const fore = new THREE.Group();
    fore.name = "forearmG";
    fore.position.y = -0.3;
    const lower = boxMesh(0.13, 0.28, 0.13, gi, 0, -0.12, 0);
    lower.name = "forearm";
    const cuff = boxMesh(0.15, 0.07, 0.15, band, 0, -0.26, 0);
    const fist = boxMesh(0.15, 0.14, 0.17, skin, 0, -0.36, -0.02);
    fist.name = "fist";
    fore.add(lower, cuff, fist);
    g.add(upper, fore);
    g.position.set(side * 0.38, -0.22, -0.48);
    g.rotation.x = 0.42;
    g.rotation.z = side * 0.12;
    g.scale.setScalar(1.15);
    return g;
  };
  return { left: arm(-1), right: arm(1) };
}

export function poseViewArms(
  fists: { left: THREE.Group; right: THREE.Group },
  punchT: number,
  charge: number,
  bob: number,
  grounded: boolean,
  flying: boolean,
  superSaiyan: boolean,
  lookSwayX = 0,
  lookSwayY = 0,
  crouch = false,
) {
  const punch = punchT > 0 ? Math.sin((punchT / 0.22) * Math.PI) : 0;
  const walk = grounded && !flying ? Math.sin(bob) : 0;
  const dip = crouch ? -0.1 : 0;
  fists.right.position.set(
    0.38 + lookSwayX * 0.14,
    -0.22 + dip + walk * 0.02 - lookSwayY * 0.1,
    -0.48 - punch * 0.42,
  );
  fists.left.position.set(
    -0.38 + lookSwayX * 0.14,
    -0.22 + dip - walk * 0.02 - lookSwayY * 0.1,
    -0.48 - punch * 0.12,
  );
  fists.right.rotation.x = 0.42 - punch * 1.05 - lookSwayY * 0.35;
  fists.left.rotation.x = 0.42 - punch * 0.28 - lookSwayY * 0.25;
  fists.right.rotation.y = lookSwayX * 0.2;
  fists.left.rotation.y = lookSwayX * 0.2;
  const rf = fists.right.getObjectByName("forearmG") as THREE.Group | undefined;
  const lf = fists.left.getObjectByName("forearmG") as THREE.Group | undefined;
  if (rf) rf.rotation.x = -punch * 0.45;
  if (lf) lf.rotation.x = -punch * 0.12;
  const glow = superSaiyan ? 0xe8b923 : charge > 0.05 ? 0xc8f4ff : 0xe8c8a4;
  const paint = (root: THREE.Group) => {
    const fist = root.getObjectByName("fist") as THREE.Mesh | undefined;
    if (fist && fist.material instanceof THREE.MeshLambertMaterial) fist.material.color.setHex(glow);
  };
  paint(fists.right);
  paint(fists.left);
  fists.right.scale.setScalar(1.15 + charge * 0.35);
  fists.left.scale.setScalar(1.15 + charge * 0.2);
}

export function hpFor(kind: EnemyKind, power: number) {
  const base =
    kind === "lord" ? 160 : kind === "elite" ? 90 : kind === "brute" ? 70 : kind === "flyer" ? 28 : kind === "shooter" ? 44 : 36;
  return base + power / 80;
}
