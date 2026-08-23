import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  AIR,
  BALL_COUNT,
  BEDROCK,
  BLOCK_HARDNESS,
  BLOCK_NAMES,
  CHUNK,
  CX,
  CY,
  CZ,
  DIRT,
  EYE,
  FLY_SPEED,
  GRASS,
  GRAVITY,
  HOTBAR,
  JUMP_VEL,
  KI,
  LEAVES,
  MAX_ENERGY,
  MAX_HEALTH,
  PLAYER_H,
  PLAYER_HW,
  REACH,
  SAND,
  SAVE_VERSION,
  SPRINT_SPEED,
  SSJ_MUL,
  SSJ_POWER,
  START_POWER,
  SX,
  SY,
  SZ,
  WALK_SPEED,
  WATER,
  WOOD,
} from "./constants";
import { GameAudio } from "./audio";
import { Input } from "./input";
import { meshChunk } from "./mesher";
import { clearSave, hasSave, loadSave, writeSave, type SaveData } from "./save";
import type { Phase } from "./store";
import { useHud } from "./store";
import { createAtlasTexture, createBallTexture } from "./textures";
import { aabbHitsWorld, chunkCoords, chunkKey, raycastVoxels, World, type EnemyKind } from "./world";

type Enemy = {
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  hp: number;
  maxHp: number;
  power: number;
  cooldown: number;
  flash: number;
  alive: boolean;
  hop: number;
  kind: EnemyKind;
};

type Blast = {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  active: boolean;
  dmg: number;
  hostile: boolean;
  radius: number;
};

type Orb = {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  val: number;
  active: boolean;
};

type Debris = {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  active: boolean;
};

const _f = new THREE.Vector3();
const _r = new THREE.Vector3();
const _look = new THREE.Vector3();

export class GameEngine {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(78, 1, 0.08, 180);
  input: Input;
  audio = new GameAudio();
  world: World;
  private chunkMeshes = new Map<number, THREE.Mesh>();
  private terrainMat: THREE.MeshLambertMaterial;
  private atlas: THREE.CanvasTexture;
  private highlight: THREE.LineSegments;
  private fists: { left: THREE.Mesh; right: THREE.Mesh };
  private auraLight: THREE.PointLight;
  private ballMeshes: THREE.Mesh[] = [];
  private ballTex: THREE.CanvasTexture[] = [];
  private enemies: Enemy[] = [];
  private blasts: Blast[] = [];
  private debris: Debris[] = [];
  private orbs: Orb[] = [];
  private shenron: THREE.Group | null = null;
  private sun: THREE.DirectionalLight;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private sky: THREE.Mesh;
  private clouds: THREE.Mesh[] = [];
  energy = MAX_ENERGY;
  private charge = 0;
  private mineT = 0;
  private mineKey = "";
  private dashCd = 0;
  private combo = 0;
  private comboT = 0;
  private chargeSfx = 0;

  px = 0;
  py = 40;
  pz = 0;
  vx = 0;
  vy = 0;
  vz = 0;
  yaw = 0;
  pitch = 0;
  flying = false;
  grounded = false;
  superSaiyan = false;
  health = MAX_HEALTH;
  power = START_POWER;
  selected = 0;
  edits: [number, number, number, number][] = [];
  private punchT = 0;
  private kiCd = 0;
  private punchCd = 0;
  private placeCd = 0;
  private invuln = 0;
  private trauma = 0;
  private hitstop = 0;
  private bob = 0;
  private stepAcc = 0;
  private hudAcc = 0;
  private saveAcc = 0;
  private toastT = 0;
  private orbitT = 0;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private disposed = false;
  private meshed = false;
  private onResize: () => void;
  private onLock: () => void;
  private vis: () => void;
  private hadPointerLock = false;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x79c9c2, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = false;

    this.scene.background = new THREE.Color(0x6ec8b8);
    this.scene.fog = new THREE.Fog(0x7ed4c4, 42, 128);

    const hemi = new THREE.HemisphereLight(0xd8fff4, 0x2a3a24, 1.05);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xfff1c8, 1.35);
    this.sun.position.set(48, 90, 28);
    this.scene.add(this.sun);
    const fill = new THREE.DirectionalLight(0x7ec8e8, 0.28);
    fill.position.set(-30, 20, -40);
    this.scene.add(fill);

    this.sky = this.makeSky();
    this.scene.add(this.sky);
    this.spawnClouds();
    this.spawnSun();

    this.atlas = createAtlasTexture();
    this.terrainMat = new THREE.MeshLambertMaterial({
      map: this.atlas,
      vertexColors: true,
    });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(800, 600), 0.42, 0.5, 0.86);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    const hGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    this.highlight = new THREE.LineSegments(
      hGeo,
      new THREE.LineBasicMaterial({ color: 0xf4f1e6, transparent: true, opacity: 0.85 }),
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    this.fists = this.makeFists();
    this.camera.add(this.fists.left);
    this.camera.add(this.fists.right);
    this.scene.add(this.camera);

    this.auraLight = new THREE.PointLight(0xe8b923, 0, 16, 2);
    this.camera.add(this.auraLight);
    const vmLight = new THREE.PointLight(0xfff5e8, 0.9, 2.5);
    vmLight.position.set(0, 0, 0.2);
    this.camera.add(vmLight);

    this.input = new Input(canvas);
    this.world = new World((Math.random() * 1e9) | 0);

    this.onResize = () => this.resize();
    this.onLock = () => {
      const locked = document.pointerLockElement === canvas;
      if (
        !locked &&
        this.hadPointerLock &&
        useHud.getState().phase === "playing" &&
        !useHud.getState().isTouch
      ) {
        this.setPhase("paused");
      }
      this.hadPointerLock = locked;
    };
    this.vis = () => {
      if (document.hidden) this.flushSave();
      else this.audio.resume();
    };
    window.addEventListener("resize", this.onResize);
    document.addEventListener("pointerlockchange", this.onLock);
    document.addEventListener("visibilitychange", this.vis);

    canvas.addEventListener("click", () => {
      const ph = useHud.getState().phase;
      if (ph !== "playing") return;
      if (useHud.getState().isTouch) return;
      if (document.pointerLockElement !== canvas) {
        const p = canvas.requestPointerLock({ unadjustedMovement: true } as PointerLockOptions);
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => canvas.requestPointerLock());
        }
      }
    });

    this.resize();
    this.bootHud();
    this.wireControlsTest();
  }

  private bootHud() {
    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      (navigator.maxTouchPoints > 0 && window.matchMedia("(hover: none)").matches);
    useHud.getState().patch({
      hasSave: hasSave(),
      isTouch: touch,
      phase: "loading",
      loadProgress: 0.02,
    });
  }

  async start() {
    const existing = loadSave();
    if (existing) {
      this.world = new World(existing.seed);
    } else {
      this.world = new World((Math.random() * 1e9) | 0);
    }
    useHud.getState().patch({ loadProgress: 0.08 });
    await yieldFrame();
    this.world.generate();
    if (existing) {
      this.world.applyEdits(existing.edits);
      this.edits = existing.edits.slice();
      this.power = existing.power;
      this.health = existing.health;
      this.flying = existing.flying;
      this.superSaiyan = existing.superSaiyan && existing.power >= SSJ_POWER;
      this.selected = existing.selected;
      this.px = existing.pos.x;
      this.py = existing.pos.y;
      this.pz = existing.pos.z;
      this.yaw = existing.yaw;
      this.pitch = existing.pitch;
      this.energy = existing.energy;
      for (let i = 0; i < BALL_COUNT; i++) {
        const b = this.world.balls[i];
        if (b) b.taken = !!existing.balls[i];
      }
    } else {
      this.px = this.world.spawn.x;
      this.py = this.world.spawn.y;
      this.pz = this.world.spawn.z;
      this.pitch = -0.22;
    }
    useHud.getState().patch({ loadProgress: 0.18 });
    await this.buildAllChunks();
    this.spawnEntities();
    this.meshed = true;
    useHud.getState().patch({
      phase: "title",
      loadProgress: 1,
      power: this.power,
      health: this.health,
      balls: this.world.balls.map((b) => b.taken),
      ballsGot: this.world.balls.filter((b) => b.taken).length,
      superSaiyan: this.superSaiyan,
      ssjReady: this.power >= SSJ_POWER,
      hasSave: hasSave(),
    });
    this.last = performance.now();
    const loop = (now: number) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      let dt = (now - this.last) / 1000;
      this.last = now;
      dt = Math.min(dt, 0.1);
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private async buildAllChunks() {
    let n = 0;
    const total = CX * CY * CZ;
    for (let cy = 0; cy < CY; cy++) {
      for (let cz = 0; cz < CZ; cz++) {
        for (let cx = 0; cx < CX; cx++) {
          this.rebuildChunk(cx, cy, cz);
          n++;
          if (n % 10 === 0) {
            useHud.getState().patch({ loadProgress: 0.18 + (n / total) * 0.78 });
            await yieldFrame();
            if (this.disposed) return;
          }
        }
      }
    }
  }

  private rebuildChunk(cx: number, cy: number, cz: number) {
    if (cx < 0 || cy < 0 || cz < 0 || cx >= CX || cy >= CY || cz >= CZ) return;
    const key = chunkKey(cx, cy, cz);
    const old = this.chunkMeshes.get(key);
    if (old) {
      this.scene.remove(old);
      old.geometry.dispose();
      this.chunkMeshes.delete(key);
    }
    const geo = meshChunk(this.world, cx, cy, cz);
    if (!geo) return;
    const mesh = new THREE.Mesh(geo, this.terrainMat);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    this.scene.add(mesh);
    this.chunkMeshes.set(key, mesh);
  }

  private rebuildAt(x: number, y: number, z: number) {
    const { cx, cy, cz } = chunkCoords(x, y, z);
    this.rebuildChunk(cx, cy, cz);
    const lx = ((x % CHUNK) + CHUNK) % CHUNK;
    const ly = ((y % CHUNK) + CHUNK) % CHUNK;
    const lz = ((z % CHUNK) + CHUNK) % CHUNK;
    if (lx === 0) this.rebuildChunk(cx - 1, cy, cz);
    if (lx === CHUNK - 1) this.rebuildChunk(cx + 1, cy, cz);
    if (ly === 0) this.rebuildChunk(cx, cy - 1, cz);
    if (ly === CHUNK - 1) this.rebuildChunk(cx, cy + 1, cz);
    if (lz === 0) this.rebuildChunk(cx, cy, cz - 1);
    if (lz === CHUNK - 1) this.rebuildChunk(cx, cy, cz + 1);
  }

  private makeSky() {
    const geo = new THREE.SphereGeometry(110, 24, 16);
    geo.scale(-1, 1, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color(0xb8f0ea) },
        bot: { value: new THREE.Color(0x4a9a78) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bot; void main(){ float h = clamp(normalize(vP).y * 0.55 + 0.45, 0.0, 1.0); gl_FragColor = vec4(mix(bot, top, h), 1.0); }`,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return mesh;
  }

  private spawnClouds() {
    const mat = new THREE.MeshLambertMaterial({
      color: 0xe8f6f2,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    for (let i = 0; i < 14; i++) {
      const w = 6 + Math.random() * 10;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1 + Math.random(), w * 0.6), mat);
      mesh.position.set(12 + Math.random() * 104, 38 + Math.random() * 14, 12 + Math.random() * 104);
      mesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mesh);
      this.clouds.push(mesh);
    }
  }

  private spawnSun() {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff4cc }),
    );
    mesh.position.set(38, 58, -42);
    this.sky.add(mesh);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(5.4, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xffe8a0,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    mesh.add(halo);
  }

  private makeFists() {
    const geo = new THREE.BoxGeometry(0.11, 0.11, 0.26);
    const mat = new THREE.MeshLambertMaterial({ color: 0xe2c8a8 });
    const cuffM = new THREE.MeshLambertMaterial({ color: 0xeeeee8 });
    const left = new THREE.Mesh(geo, mat);
    const right = new THREE.Mesh(geo, mat);
    const cuffG = new THREE.BoxGeometry(0.13, 0.13, 0.08);
    const lc = new THREE.Mesh(cuffG, cuffM);
    const rc = new THREE.Mesh(cuffG, cuffM);
    lc.position.z = 0.12;
    rc.position.z = 0.12;
    left.add(lc);
    right.add(rc);
    left.position.set(-0.36, -0.34, -0.58);
    right.position.set(0.36, -0.34, -0.58);
    left.rotation.x = 0.22;
    right.rotation.x = 0.22;
    left.scale.setScalar(1.25);
    right.scale.setScalar(1.25);
    return { left, right };
  }

  private spawnEntities() {
    for (const t of this.ballTex) t.dispose();
    const ballGeos = new Set<THREE.BufferGeometry>();
    for (const m of this.ballMeshes) {
      this.scene.remove(m);
      ballGeos.add(m.geometry);
      (m.material as THREE.Material).dispose();
    }
    for (const g of ballGeos) g.dispose();
    this.ballMeshes = [];
    this.ballTex = [];
    const geo = new THREE.SphereGeometry(0.28, 16, 12);
    for (const b of this.world.balls) {
      const tex = createBallTexture(b.stars);
      this.ballTex.push(tex);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xe8b923,
        emissiveIntensity: 0.85,
        roughness: 0.35,
        metalness: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.y, b.z);
      mesh.visible = !b.taken;
      this.scene.add(mesh);
      this.ballMeshes.push(mesh);
    }

    for (const e of this.enemies) {
      this.scene.remove(e.mesh);
      e.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    }
    this.enemies = [];
    for (const s of this.world.enemies) {
      this.enemies.push(this.makeEnemy(s.x, s.y, s.z, s.power, s.kind));
    }

    this.clearPool(this.blasts);
    this.clearPool(this.orbs);
    this.clearPool(this.debris);

    const blastGeo = new THREE.SphereGeometry(0.16, 10, 8);
    this.blasts = [];
    for (let i = 0; i < 28; i++) {
      const mesh = new THREE.Mesh(
        blastGeo,
        new THREE.MeshBasicMaterial({
          color: 0xfff4b0,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      mesh.visible = false;
      this.scene.add(mesh);
      this.blasts.push({
        mesh,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        active: false,
        dmg: 28,
        hostile: false,
        radius: 0.16,
      });
    }

    const orbGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x7ce8ff });
    this.orbs = [];
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.orbs.push({ mesh, x: 0, y: 0, z: 0, val: 40, active: false });
    }

    const dGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const dMat = new THREE.MeshLambertMaterial({ color: 0x6a8a4a });
    this.debris = [];
    for (let i = 0; i < 48; i++) {
      const mesh = new THREE.Mesh(dGeo, dMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.debris.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, active: false });
    }
  }

  private clearPool(list: { mesh: THREE.Mesh }[]) {
    const geos = new Set<THREE.BufferGeometry>();
    for (const item of list) {
      this.scene.remove(item.mesh);
      geos.add(item.mesh.geometry);
      const mat = item.mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
    for (const g of geos) g.dispose();
    list.length = 0;
  }

  private makeEnemy(x: number, y: number, z: number, power: number, kind: EnemyKind = "grunt"): Enemy {
    const g = new THREE.Group();
    const bodyCol = kind === "flyer" ? 0x3d6a7a : kind === "shooter" ? 0x8a5a2a : 0x4a9a3a;
    const headCol = kind === "flyer" ? 0x2a4a58 : kind === "shooter" ? 0x6a3a18 : 0x3d7a32;
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(kind === "flyer" ? 0.24 : 0.28, kind === "flyer" ? 0.4 : 0.55, 4, 8),
      new THREE.MeshLambertMaterial({ color: bodyCol }),
    );
    body.position.y = kind === "flyer" ? 0.55 : 0.7;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshLambertMaterial({ color: headCol, emissive: kind === "shooter" ? 0x331800 : 0x000000, emissiveIntensity: kind === "shooter" ? 0.25 : 0 }),
    );
    head.position.y = kind === "flyer" ? 1.05 : 1.28;
    const antG = new THREE.ConeGeometry(0.05, 0.28, 6);
    antG.rotateX(Math.PI);
    const ant = new THREE.Mesh(antG, new THREE.MeshLambertMaterial({ color: 0x2a5524 }));
    ant.position.set(0.08, kind === "flyer" ? 1.28 : 1.52, 0);
    const eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshBasicMaterial({ color: kind === "shooter" ? 0xe8b923 : 0x111111 }),
    );
    eyeL.position.set(-0.08, kind === "flyer" ? 1.08 : 1.32, 0.16);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.08;
    g.add(body, head, ant, eyeL, eyeR);
    if (kind === "flyer") {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.06, 0.35),
        new THREE.MeshLambertMaterial({ color: 0x2a4a52, emissive: 0x113322, emissiveIntensity: 0.2 }),
      );
      wing.position.y = 0.7;
      g.add(wing);
    }
    g.position.set(x, y, z);
    this.scene.add(g);
    const hp = (kind === "flyer" ? 28 : kind === "shooter" ? 44 : 36) + power / 80;
    return {
      mesh: g,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      hp,
      maxHp: hp,
      power,
      cooldown: 0,
      flash: 0,
      alive: true,
      hop: Math.random() * 1.4,
      kind,
    };
  }

  playFromTitle(mode: "new" | "continue") {
    this.audio.unlock();
    this.requestLock();
    if (mode === "new") {
      void this.resetSameWorld();
      return;
    }
    this.input.enabled = true;
    this.invuln = Math.max(this.invuln, 1.4);
    this.setPhase("playing");
    this.toast("Sammle die sieben Drachenkugeln");
  }

  private async resetSameWorld() {
    clearSave();
    useHud.getState().patch({ phase: "loading", loadProgress: 0.08, hasSave: false });
    this.input.enabled = false;
    const seed = this.world.seed;
    this.clearChunks();
    this.world = new World(seed);
    this.world.generate();
    this.edits = [];
    this.resetAvatar();
    await this.buildAllChunks();
    if (this.disposed) return;
    this.spawnEntities();
    this.invuln = 1.4;
    this.input.enabled = true;
    this.setPhase("playing");
    this.toast("Sammle die sieben Drachenkugeln");
  }

  private resetAvatar() {
    this.power = START_POWER;
    this.health = MAX_HEALTH;
    this.flying = false;
    this.superSaiyan = false;
    this.selected = 0;
    this.px = this.world.spawn.x;
    this.py = this.world.spawn.y;
    this.pz = this.world.spawn.z;
    this.yaw = 0;
    this.pitch = -0.22;
    this.vx = this.vy = this.vz = 0;
    this.energy = MAX_ENERGY;
    this.charge = 0;
    this.combo = 0;
    this.comboT = 0;
    this.dashCd = 0;
    this.punchCd = 0;
    this.placeCd = 0;
    this.kiCd = 0;
    this.invuln = 0;
    this.mineT = 0;
    this.mineKey = "";
    this.punchT = 0;
    this.trauma = 0;
    this.hitstop = 0;
    this.acc = 0;
  }

  private requestLock() {
    if (useHud.getState().isTouch) return;
    const p = this.canvas.requestPointerLock({ unadjustedMovement: true } as PointerLockOptions);
    if (p && typeof (p as Promise<void>).catch === "function") {
      (p as Promise<void>).catch(() => this.canvas.requestPointerLock());
    }
  }

  async newWorld() {
    this.audio.unlock();
    clearSave();
    useHud.getState().patch({ phase: "loading", loadProgress: 0.05, hasSave: false });
    this.clearChunks();
    this.world = new World((Math.random() * 1e9) | 0);
    this.world.generate();
    this.edits = [];
    this.resetAvatar();
    await this.buildAllChunks();
    if (this.disposed) return;
    this.spawnEntities();
    useHud.getState().patch({
      phase: "title",
      loadProgress: 1,
      power: this.power,
      health: this.health,
      energy: this.energy,
      maxEnergy: MAX_ENERGY,
      balls: this.world.balls.map(() => false),
      ballsGot: 0,
      superSaiyan: false,
      ssjReady: false,
    });
  }

  resume() {
    if (useHud.getState().phase === "dead") return;
    this.input.enabled = true;
    this.setPhase("playing");
    if (!useHud.getState().isTouch) {
      const p = this.canvas.requestPointerLock({ unadjustedMovement: true } as PointerLockOptions);
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => this.canvas.requestPointerLock());
      }
    }
  }

  pause() {
    if (useHud.getState().phase !== "playing") return;
    try {
      document.exitPointerLock();
    } catch {
      /* ignore */
    }
    this.hadPointerLock = false;
    this.setPhase("paused");
    this.flushSave();
  }

  goTitle() {
    try {
      document.exitPointerLock();
    } catch {
      /* ignore */
    }
    this.hadPointerLock = false;
    this.input.enabled = false;
    this.flushSave();
    this.setPhase("title");
  }

  respawn() {
    this.health = MAX_HEALTH;
    this.energy = Math.max(this.energy, 55);
    this.px = this.world.spawn.x;
    this.py = this.world.spawn.y;
    this.pz = this.world.spawn.z;
    this.vx = this.vy = this.vz = 0;
    this.flying = true;
    this.invuln = 1.5;
    this.input.enabled = true;
    this.setPhase("playing");
    this.toast("Zurück im Nest");
    if (!useHud.getState().isTouch) this.canvas.requestPointerLock();
  }

  grantWish(kind: "power" | "heal" | "storm") {
    this.audio.wish();
    if (kind === "power") {
      this.power += 4000;
      this.energy = MAX_ENERGY;
      this.toast("Dein Ki explodiert");
    } else if (kind === "heal") {
      this.health = MAX_HEALTH;
      this.energy = MAX_ENERGY;
      this.toast("Körper und Geist erneuert");
    } else {
      this.health = MAX_HEALTH;
      this.energy = MAX_ENERGY;
      this.power += 1200;
      this.world.scatterBalls(() => Math.random());
      for (let i = 0; i < this.world.balls.length; i++) {
        const b = this.world.balls[i]!;
        const m = this.ballMeshes[i];
        if (!m) continue;
        m.visible = true;
        m.position.set(b.x, b.y, b.z);
      }
      this.toast("Die Kugeln verteilen sich neu");
    }
    this.superSaiyan = this.superSaiyan && this.power >= SSJ_POWER;
    this.setPhase("playing");
    this.input.enabled = true;
    this.hideShenron();
    if (!useHud.getState().isTouch) this.canvas.requestPointerLock();
    this.flushSave();
  }

  setMuted(m: boolean) {
    this.audio.setMuted(m);
    useHud.getState().patch({ muted: m });
  }

  private setPhase(phase: Phase) {
    useHud.getState().patch({ phase });
  }

  selectSlot(i: number) {
    if (i < 0 || i >= HOTBAR.length) return;
    this.selected = i;
    useHud.getState().patch({ selected: i });
  }

  private toast(msg: string) {
    this.toastT = 2.6;
    useHud.getState().patch({ toast: msg });
  }

  private frame(dt: number) {
    const phase = useHud.getState().phase;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.render(dt);
      return;
    }
    this.orbitT += dt;
    if (phase === "title" || phase === "loading") {
      this.titleCam();
      this.animateWorld(dt);
      this.render(dt);
      return;
    }
    if (phase === "paused" || phase === "wish" || phase === "dead") {
      this.animateWorld(dt);
      this.applyCamera(dt, true);
      this.render(dt);
      const act = this.input.poll();
      if (phase === "paused" && act.pausePressed) this.resume();
      return;
    }

    const act = this.input.poll();
    if (act.pausePressed) {
      this.pause();
      return;
    }

    this.yaw -= act.lookX;
    this.pitch -= act.lookY;
    const lim = Math.PI / 2 - 0.04;
    if (this.pitch > lim) this.pitch = lim;
    if (this.pitch < -lim) this.pitch = -lim;

    this.acc += dt;
    const STEP = 1 / 60;
    let first = true;
    while (this.acc >= STEP) {
      this.fixed(STEP, act, first);
      first = false;
      this.acc -= STEP;
    }
    this.animateWorld(dt);
    this.applyCamera(dt, false);
    this.updateHud(dt);
    this.saveAcc += dt;
    if (this.saveAcc > 12) {
      this.saveAcc = 0;
      this.flushSave();
    }
    this.render(dt);
  }

  private titleCam() {
    const s = this.world.spawn;
    const t = this.orbitT * 0.18;
    const r = 26;
    this.camera.position.set(s.x + Math.cos(t) * r, s.y + 12, s.z + Math.sin(t) * r);
    this.camera.lookAt(s.x, s.y + 3, s.z);
  }

  private forwardRight() {
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    _f.set(fx, 0, fz);
    _r.set(rx, 0, rz);
    return { fx, fz, rx, rz };
  }

  private lookDir() {
    const cp = Math.cos(this.pitch);
    _look.set(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
    return _look;
  }

  private fixed(dt: number, act: ReturnType<Input["poll"]>, edges: boolean) {
    if (act.hotbar !== null && edges) this.selected = act.hotbar;
    if (act.scroll && edges) {
      this.selected = (this.selected + act.scroll + HOTBAR.length) % HOTBAR.length;
    }

    if (edges && act.ssjPressed) this.toggleSsj();
    if (edges && act.dashPressed) this.tryDash();

    const { fx, fz, rx, rz } = this.forwardRight();
    const ssj = this.superSaiyan ? SSJ_MUL : 1;

    if (edges && act.jumpPressed && this.grounded && !this.flying) {
      this.vy = JUMP_VEL * (this.superSaiyan ? 1.2 : 1);
      this.grounded = false;
      this.audio.jump();
    } else if (edges && act.jumpPressed && !this.grounded && !this.flying) {
      this.flying = true;
      this.toast("Flugmodus");
    }

    if (this.flying) {
      const spd = FLY_SPEED * ssj;
      this.vx = (act.moveX * rx + act.moveY * fx) * spd;
      this.vz = (act.moveX * rz + act.moveY * fz) * spd;
      let up = 0;
      if (act.jump) up += 1;
      if (act.sprint || act.flyDown) up -= 1;
      if (up === 0 && useHud.getState().isTouch) up = -0.34;
      this.vy = up * spd * 0.85;
    } else {
      const spd = (act.sprint ? SPRINT_SPEED : WALK_SPEED) * ssj;
      const wishX = act.moveX * rx + act.moveY * fx;
      const wishZ = act.moveX * rz + act.moveY * fz;
      const accel = this.grounded ? 28 : 8;
      this.vx += (wishX * spd - this.vx) * Math.min(1, accel * dt);
      this.vz += (wishZ * spd - this.vz) * Math.min(1, accel * dt);
      this.vy -= GRAVITY * dt;
      if (this.grounded && act.moveX === 0 && act.moveY === 0) {
        this.vx *= 0.72;
        this.vz *= 0.72;
      }
    }

    this.moveCollide(dt, act.jump);

    if (this.py < -8) {
      this.hurt(25, "Absturz");
      this.px = this.world.spawn.x;
      this.py = this.world.spawn.y;
      this.pz = this.world.spawn.z;
      this.vx = this.vy = this.vz = 0;
    }

    this.kiCd = Math.max(0, this.kiCd - dt);
    this.punchCd = Math.max(0, this.punchCd - dt);
    this.placeCd = Math.max(0, this.placeCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.punchT = Math.max(0, this.punchT - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.comboT = Math.max(0, this.comboT - dt);
    if (this.comboT <= 0) this.combo = 0;

    const regen = (this.superSaiyan ? 18 : 16) * dt;
    this.energy = Math.min(MAX_ENERGY, this.energy + regen);
    if (this.superSaiyan) {
      this.energy -= 14 * dt;
      if (this.energy <= 0) {
        this.energy = 0;
        this.superSaiyan = false;
        this.toast("Aura erlischt");
      }
    }

    if (act.ki) {
      this.charge = Math.min(1.2, this.charge + dt * (this.superSaiyan ? 1.35 : 1));
      this.chargeSfx -= dt;
      if (this.chargeSfx <= 0 && this.charge > 0.15) {
        this.chargeSfx = 0.12;
        this.audio.charge(this.charge);
      }
    }
    if (edges && act.kiReleased) {
      if (this.charge > 0.02) {
        const shot = this.charge < 0.18 ? 0.45 : this.charge;
        this.fireKi(shot);
      }
      this.charge = 0;
    } else if (!act.ki) {
      this.charge = 0;
    }

    if (edges && act.punchPressed && this.punchCd <= 0) {
      const e = this.nearestEnemy(2.6);
      if (e && e.alive) this.doPunch();
      else this.mineT = 0;
    }
    if (act.punch && this.punchT <= 0) this.tickMine(dt);
    else if (!act.punch) {
      this.mineT = 0;
      this.mineKey = "";
    }
    if (edges && act.placePressed && this.placeCd <= 0) this.placeBlock();

    this.updateBlasts(dt);
    this.updateEnemies(dt);
    this.updateDebris(dt);
    this.updateOrbs(dt);
    this.collectBalls();

    const moving = Math.hypot(this.vx, this.vz) > 1.2 && this.grounded && !this.flying;
    if (moving) {
      this.stepAcc += dt;
      if (this.stepAcc > 0.38) {
        this.stepAcc = 0;
        this.audio.step();
      }
      this.bob += dt * 9;
    } else {
      this.stepAcc = 0;
      this.bob *= 0.9;
    }
  }

  private moveCollide(dt: number, swimUp: boolean) {
    const speed = Math.hypot(this.vx, this.vy, this.vz);
    const steps = Math.max(1, Math.ceil((speed * dt) / 0.18));
    const sdt = dt / steps;
    let grounded = false;
    for (let i = 0; i < steps; i++) {
      this.px += this.vx * sdt;
      if (aabbHitsWorld(this.world, this.px, this.py, this.pz, PLAYER_HW, PLAYER_H)) {
        const step = 1.05;
        if (
          !this.flying &&
          this.vy <= 0.45 &&
          !aabbHitsWorld(this.world, this.px, this.py + step, this.pz, PLAYER_HW, PLAYER_H)
        ) {
          this.py += step;
        } else {
          this.px -= this.vx * sdt;
          this.vx = 0;
        }
      }
      this.pz += this.vz * sdt;
      if (aabbHitsWorld(this.world, this.px, this.py, this.pz, PLAYER_HW, PLAYER_H)) {
        const step = 1.05;
        if (
          !this.flying &&
          this.vy <= 0.45 &&
          !aabbHitsWorld(this.world, this.px, this.py + step, this.pz, PLAYER_HW, PLAYER_H)
        ) {
          this.py += step;
        } else {
          this.pz -= this.vz * sdt;
          this.vz = 0;
        }
      }
      this.py += this.vy * sdt;
      if (aabbHitsWorld(this.world, this.px, this.py, this.pz, PLAYER_HW, PLAYER_H)) {
        this.py -= this.vy * sdt;
        if (this.vy <= 0) grounded = true;
        this.vy = 0;
      }
    }
    this.grounded = grounded;
    if (grounded) this.flying = false;
    this.px = Math.max(1.2, Math.min(SX - 1.2, this.px));
    this.pz = Math.max(1.2, Math.min(SZ - 1.2, this.pz));
    this.py = Math.max(1, Math.min(SY - 3, this.py));

    const wx = Math.floor(this.px);
    const wz = Math.floor(this.pz);
    const wet =
      this.world.get(wx, Math.floor(this.py + 0.2), wz) === WATER ||
      this.world.get(wx, Math.floor(this.py + 1.05), wz) === WATER;
    if (wet && !this.flying) {
      this.vx *= 0.84;
      this.vz *= 0.84;
      if (this.vy < -1.5) this.vy *= 0.62;
      if (swimUp) this.vy = Math.max(this.vy, 5.6);
    }
  }

  private eye() {
    return { x: this.px, y: this.py + EYE, z: this.pz };
  }

  private aimHit() {
    const e = this.eye();
    const d = this.lookDir();
    return raycastVoxels(this.world, e.x, e.y, e.z, d.x, d.y, d.z, REACH);
  }

  private doPunch() {
    this.punchCd = 0.28;
    this.punchT = 0.22;
    this.audio.punch();
    const e = this.nearestEnemy(2.6);
    if (e && e.alive) {
      const dmg = (18 + this.power / 400) * (this.superSaiyan ? 1.8 : 1) * (1 + this.combo * 0.08);
      this.damageEnemy(e, dmg, 5.5);
      this.trauma = Math.min(1, this.trauma + 0.22);
      this.hitstop = 0.045;
    }
  }

  private tryDash() {
    if (this.dashCd > 0) return;
    if (this.energy < 16) {
      this.toast("Zu wenig Energie");
      return;
    }
    this.energy -= 16;
    this.dashCd = 0.82;
    this.invuln = Math.max(this.invuln, 0.24);
    const d = this.lookDir();
    const spd = 26 * (this.superSaiyan ? 1.35 : 1);
    this.vx = d.x * spd;
    this.vy = d.y * spd * 0.55;
    this.vz = d.z * spd;
    this.audio.dash();
    this.trauma = Math.min(1, this.trauma + 0.16);
    this.burst(this.px, this.py + 0.8, this.pz, 7);
  }

  private tickMine(dt: number) {
    const hit = this.aimHit();
    if (!hit || hit.block === AIR || hit.block === WATER || hit.block === BEDROCK) {
      this.mineT = 0;
      this.mineKey = "";
      return;
    }
    const key = `${hit.x},${hit.y},${hit.z}`;
    if (key !== this.mineKey) {
      this.mineKey = key;
      this.mineT = 0;
    }
    const hard = BLOCK_HARDNESS[hit.block] ?? 0.4;
    if (hard <= 0) {
      this.breakBlock(hit.x, hit.y, hit.z, hit.block);
      this.mineT = 0;
      this.mineKey = "";
      return;
    }
    this.mineT += dt * (this.superSaiyan ? 1.85 : 1);
    if (this.mineT >= hard) {
      this.breakBlock(hit.x, hit.y, hit.z, hit.block);
      this.mineT = 0;
      this.mineKey = "";
    }
  }

  private placeBlock() {
    const hit = this.aimHit();
    if (!hit) return;
    const id = HOTBAR[this.selected]!;
    const x = hit.x + hit.nx;
    const y = hit.y + hit.ny;
    const z = hit.z + hit.nz;
    if (this.world.get(x, y, z) !== AIR) return;
    if (aabbHitsWorld(this.world, this.px, this.py, this.pz, PLAYER_HW, PLAYER_H)) {
      /* still check new block vs player */
    }
    const px = this.px,
      py = this.py,
      pz = this.pz;
    const overlaps =
      x + 1 > px - PLAYER_HW &&
      x < px + PLAYER_HW &&
      y + 1 > py &&
      y < py + PLAYER_H &&
      z + 1 > pz - PLAYER_HW &&
      z < pz + PLAYER_HW;
    if (overlaps) return;
    this.world.set(x, y, z, id);
    this.edits.push([x, y, z, id]);
    this.rebuildAt(x, y, z);
    this.placeCd = 0.16;
    this.audio.place();
  }

  private breakBlock(x: number, y: number, z: number, block: number) {
    if (block === 8) return; // bedrock
    this.world.set(x, y, z, AIR);
    this.edits.push([x, y, z, AIR]);
    this.rebuildAt(x, y, z);
    this.audio.break();
    this.burst(x + 0.5, y + 0.5, z + 0.5, 8);
    if (block === KI) {
      this.power += 55;
      this.toast("Ki-Kristall absorbiert");
    }
    this.trauma = Math.min(1, this.trauma + 0.08);
  }

  private fireKi(charge: number) {
    if (this.kiCd > 0) return;
    const cost = 10 + charge * 22;
    if (this.energy < cost * 0.45) {
      this.toast("Ki erschöpft");
      return;
    }
    this.energy = Math.max(0, this.energy - cost);
    this.kiCd = this.superSaiyan ? 0.12 : 0.2;
    const heavy = charge > 0.72;
    if (heavy) this.audio.beam();
    else this.audio.ki();
    this.punchT = 0.14;
    const e = this.eye();
    const d = this.lookDir();
    const b = this.blasts.find((x) => !x.active);
    if (!b) return;
    b.active = true;
    b.hostile = false;
    b.life = 1.35 + charge * 0.55;
    b.dmg = (22 + this.power / 260) * (0.55 + charge) * (this.superSaiyan ? 1.9 : 1);
    b.radius = 0.14 + charge * 0.26;
    const spd = (36 + charge * 22) * (this.superSaiyan ? 1.28 : 1);
    b.x = e.x + d.x * 0.7;
    b.y = e.y + d.y * 0.7;
    b.z = e.z + d.z * 0.7;
    b.vx = d.x * spd;
    b.vy = d.y * spd;
    b.vz = d.z * spd;
    const mat = b.mesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(heavy ? 0xfff6d8 : this.superSaiyan ? 0xffe066 : 0xb4f0ff);
    b.mesh.scale.setScalar(0.85 + charge * 2.1);
    b.mesh.visible = true;
    b.mesh.position.set(b.x, b.y, b.z);
    this.trauma = Math.min(1, this.trauma + 0.1 + charge * 0.12);
  }

  private enemyKi(e: Enemy) {
    const b = this.blasts.find((x) => !x.active);
    if (!b) return;
    const tx = this.px - e.x;
    const ty = this.py + EYE - (e.y + 1.15);
    const tz = this.pz - e.z;
    const len = Math.hypot(tx, ty, tz) || 1;
    const spd = 17;
    b.active = true;
    b.hostile = true;
    b.dmg = 9 + e.power / 340;
    b.radius = 0.18;
    b.life = 2.1;
    b.x = e.x + (tx / len) * 0.55;
    b.y = e.y + 1.15;
    b.z = e.z + (tz / len) * 0.55;
    b.vx = (tx / len) * spd;
    b.vy = (ty / len) * spd;
    b.vz = (tz / len) * spd;
    const mat = b.mesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(0xff7048);
    b.mesh.scale.setScalar(1.2);
    b.mesh.visible = true;
    b.mesh.position.set(b.x, b.y, b.z);
  }

  private updateBlasts(dt: number) {
    for (const b of this.blasts) {
      if (!b.active) continue;
      const ox = b.x,
        oy = b.y,
        oz = b.z;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.life -= dt;
      b.mesh.position.set(b.x, b.y, b.z);
      const step = Math.hypot(b.x - ox, b.y - oy, b.z - oz);
      const hit = raycastVoxels(this.world, ox, oy, oz, b.x - ox, b.y - oy, b.z - oz, step + 0.01);
      if (hit) {
        const soft =
          hit.block === LEAVES ||
          hit.block === KI ||
          hit.block === GRASS ||
          hit.block === DIRT ||
          hit.block === SAND ||
          hit.block === WOOD;
        const heavy = !b.hostile && b.dmg > 48 && hit.block !== BEDROCK && hit.block !== WATER;
        if (soft || heavy) this.breakBlock(hit.x, hit.y, hit.z, hit.block);
        this.burst(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 6);
        b.active = false;
        b.mesh.visible = false;
        continue;
      }
      if (b.hostile) {
        const dx = b.x - this.px;
        const dy = b.y - (this.py + EYE);
        const dz = b.z - this.pz;
        if (dx * dx + dy * dy + dz * dz < 0.9) {
          this.hurt(b.dmg, "Ki-Schütze");
          this.burst(b.x, b.y, b.z, 5);
          b.active = false;
          b.mesh.visible = false;
          continue;
        }
      } else {
        let dead = false;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const dx = b.x - e.x;
          const dy = b.y - (e.y + 0.8);
          const dz = b.z - e.z;
          const r = 0.55 + b.radius;
          if (dx * dx + dy * dy + dz * dz < r * r) {
            this.damageEnemy(e, b.dmg, 8);
            dead = true;
            break;
          }
        }
        if (dead) {
          b.active = false;
          b.mesh.visible = false;
          continue;
        }
      }
      if (b.life <= 0 || b.y < 0 || b.y > SY + 10) {
        b.active = false;
        b.mesh.visible = false;
      }
    }
  }

  private nearestEnemy(range: number) {
    const e = this.eye();
    const d = this.lookDir();
    let best: Enemy | null = null;
    let bestT = range;
    for (const en of this.enemies) {
      if (!en.alive) continue;
      const dx = en.x - e.x;
      const dy = en.y + 0.8 - e.y;
      const dz = en.z - e.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > range) continue;
      const dot = (dx * d.x + dy * d.y + dz * d.z) / dist;
      if (dot > 0.65 && dist < bestT) {
        best = en;
        bestT = dist;
      }
    }
    return best;
  }

  private damageEnemy(e: Enemy, dmg: number, knock: number) {
    e.hp -= dmg;
    e.flash = 0.12;
    this.audio.hit();
    const dx = e.x - this.px;
    const dz = e.z - this.pz;
    const len = Math.hypot(dx, dz) || 1;
    e.vx += (dx / len) * knock;
    e.vz += (dz / len) * knock;
    e.vy += 3;
    this.burst(e.x, e.y + 0.9, e.z, 10);
    this.combo += 1;
    this.comboT = 1.7;
    if (e.hp <= 0) {
      e.alive = false;
      e.mesh.visible = false;
      const gain = 180 + ((e.power / 8) | 0);
      this.power += gain;
      this.toast(`+${gain} Ki`);
      this.trauma = Math.min(1, this.trauma + 0.35);
      this.hitstop = 0.07;
      this.spawnOrb(e.x, e.y + 0.7, e.z, 28 + (e.kind === "flyer" ? 14 : 0));
      if (e.kind === "shooter") this.spawnOrb(e.x + 0.3, e.y + 0.9, e.z, 18);
    }
  }

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.flash = Math.max(0, e.flash - dt);
      e.hop -= dt;
      const dx = this.px - e.x;
      const dz = this.pz - e.z;
      const dist = Math.hypot(dx, dz);
      const body = e.mesh.children[0] as THREE.Mesh | undefined;
      if (body && body.material instanceof THREE.MeshLambertMaterial) {
        const rest = e.kind === "flyer" ? 0x3d6a7a : e.kind === "shooter" ? 0x8a5a2a : 0x4a9a3a;
        body.material.color.setHex(e.flash > 0 ? 0xf4f1e6 : rest);
      }
      if (e.kind === "flyer") {
        const targetY = this.py + 4.2;
        e.vy = (targetY - e.y) * 1.6;
        const spd = 5.4;
        if (dist > 1.6) {
          e.vx += ((dx / dist) * spd - e.vx) * 3 * dt;
          e.vz += ((dz / dist) * spd - e.vz) * 3 * dt;
        } else {
          e.vx *= 0.9;
          e.vz *= 0.9;
        }
        if (dist < 2.1 && e.cooldown <= 0 && useHud.getState().phase === "playing") {
          e.cooldown = 1.15;
          this.hurt(13 + e.power / 380, "Luftjäger");
        }
        this.moveEntity(e, dt, true);
      } else if (e.kind === "shooter") {
        const ideal = 11;
        if (dist < 46 && dist > 0.4) {
          const push = dist < ideal ? -1 : 1;
          const spd = 3.1;
          e.vx += ((dx / dist) * push * spd - e.vx) * 4 * dt;
          e.vz += ((dz / dist) * push * spd - e.vz) * 4 * dt;
          if (e.hop <= 0 && this.onGround(e.x, e.y, e.z)) {
            e.vy = 4.4;
            e.hop = 0.9 + Math.random() * 0.5;
          }
        } else {
          e.vx *= 0.9;
          e.vz *= 0.9;
        }
        e.vy -= GRAVITY * dt;
        this.moveEntity(e, dt, false);
        if (dist < 22 && dist > 3.2 && e.cooldown <= 0 && useHud.getState().phase === "playing") {
          e.cooldown = 1.55;
          this.enemyKi(e);
        }
      } else {
        if (dist < 48 && dist > 1.3) {
          const spd = 3.4;
          e.vx += ((dx / dist) * spd - e.vx) * 4 * dt;
          e.vz += ((dz / dist) * spd - e.vz) * 4 * dt;
          if (e.hop <= 0 && this.onGround(e.x, e.y, e.z)) {
            e.vy = 5.2;
            e.hop = 0.7 + Math.random() * 0.6;
          }
        } else {
          e.vx *= 0.9;
          e.vz *= 0.9;
        }
        e.vy -= GRAVITY * dt;
        this.moveEntity(e, dt, false);
        if (dist < 1.55 && e.cooldown <= 0 && useHud.getState().phase === "playing") {
          e.cooldown = 1.05;
          this.hurt(11 + e.power / 400, "Saibaman");
          const k = 6;
          this.vx -= (dx / (dist || 1)) * k;
          this.vz -= (dz / (dist || 1)) * k;
        }
      }
      e.mesh.position.set(e.x, e.y, e.z);
      e.mesh.rotation.y = Math.atan2(dx, dz);
      if (e.kind === "flyer") {
        const wing = e.mesh.children[5] as THREE.Mesh | undefined;
        if (wing) wing.rotation.z = Math.sin(this.orbitT * 14) * 0.18;
      }
    }
  }

  private onGround(x: number, y: number, z: number) {
    return this.world.isSolid(Math.floor(x), Math.floor(y - 0.08), Math.floor(z));
  }

  private moveEntity(e: Enemy, dt: number, flying: boolean) {
    const hw = 0.28;
    const h = flying ? 1.1 : 1.45;
    e.x += e.vx * dt;
    if (aabbHitsWorld(this.world, e.x, e.y, e.z, hw, h)) {
      e.x -= e.vx * dt;
      e.vx = 0;
    }
    e.z += e.vz * dt;
    if (aabbHitsWorld(this.world, e.x, e.y, e.z, hw, h)) {
      e.z -= e.vz * dt;
      e.vz = 0;
    }
    e.y += e.vy * dt;
    if (aabbHitsWorld(this.world, e.x, e.y, e.z, hw, h)) {
      e.y -= e.vy * dt;
      e.vy = 0;
    }
  }

  private hurt(n: number, src: string) {
    if (this.invuln > 0) return;
    const taken = n * (this.superSaiyan ? 0.65 : 1);
    this.health -= taken;
    this.invuln = 0.55;
    this.audio.hurt();
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.toast(`${src} trifft dich`);
    if (this.health <= 0) {
      this.health = 0;
      try {
        document.exitPointerLock();
      } catch {
        /* ignore */
      }
      this.setPhase("dead");
      this.flushSave();
    }
  }

  private collectBalls() {
    for (let i = 0; i < this.world.balls.length; i++) {
      const b = this.world.balls[i]!;
      if (b.taken) continue;
      const dx = b.x - this.px;
      const dy = b.y - (this.py + 0.9);
      const dz = b.z - this.pz;
      if (dx * dx + dy * dy + dz * dz < 1.6) {
        b.taken = true;
        const m = this.ballMeshes[i];
        if (m) m.visible = false;
        this.power += 420 + b.stars * 80;
        this.audio.collect();
        this.toast(`${b.stars}-Sterne-Kugel`);
        const got = this.world.balls.filter((x) => x.taken).length;
        if (got >= BALL_COUNT) {
          this.openWish();
        }
      }
    }
  }

  private openWish() {
    this.showShenron();
    this.audio.wish();
    try {
      document.exitPointerLock();
    } catch {
      /* ignore */
    }
    this.setPhase("wish");
  }

  private showShenron() {
    this.hideShenron();
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x2f9a4a, emissive: 0x145522, emissiveIntensity: 0.4 });
    const eyeM = new THREE.MeshBasicMaterial({ color: 0xe8b923 });
    for (let i = 0; i < 18; i++) {
      const s = 0.55 + (1 - i / 18) * 0.7;
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), mat);
      const t = i / 3;
      m.position.set(Math.sin(t) * 2.2, i * 0.85, Math.cos(t * 0.85) * 1.4);
      g.add(m);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), mat);
    head.position.set(0, 16.2, 0);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeM);
    eyeL.position.set(-0.35, 16.4, 0.85);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.35;
    g.add(head, eyeL, eyeR);
    g.position.set(this.px, this.py + 6, this.pz - 8);
    this.scene.add(g);
    this.shenron = g;
    this.scene.fog = new THREE.Fog(0x1a3028, 20, 80);
    this.scene.background = new THREE.Color(0x1a3028);
  }

  private hideShenron() {
    if (this.shenron) {
      this.scene.remove(this.shenron);
      this.shenron.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      this.shenron = null;
    }
    this.scene.fog = new THREE.Fog(0x7ed4c4, 42, 128);
    this.scene.background = new THREE.Color(0x6ec8b8);
  }

  private toggleSsj() {
    if (this.power < SSJ_POWER) {
      this.toast(`Noch ${(SSJ_POWER - this.power | 0).toLocaleString("de-DE")} Ki bis Super Saiyan`);
      return;
    }
    this.superSaiyan = !this.superSaiyan;
    if (this.superSaiyan) {
      this.audio.ssj();
      this.toast("Super Saiyan");
      this.trauma = 0.6;
    } else {
      this.toast("Aura erlischt");
    }
  }

  private burst(x: number, y: number, z: number, n: number) {
    let left = n;
    for (const d of this.debris) {
      if (left <= 0) break;
      if (d.active) continue;
      d.active = true;
      d.life = 0.45 + Math.random() * 0.3;
      d.mesh.visible = true;
      d.mesh.position.set(x, y, z);
      d.vx = (Math.random() - 0.5) * 8;
      d.vy = 3 + Math.random() * 5;
      d.vz = (Math.random() - 0.5) * 8;
      left--;
    }
  }

  private spawnOrb(x: number, y: number, z: number, val: number) {
    const o = this.orbs.find((x) => !x.active);
    if (!o) return;
    o.active = true;
    o.x = x;
    o.y = y;
    o.z = z;
    o.val = val;
    o.mesh.visible = true;
    o.mesh.position.set(x, y, z);
  }

  private updateOrbs(dt: number) {
    for (const o of this.orbs) {
      if (!o.active) continue;
      o.mesh.rotation.y += dt * 2.4;
      o.mesh.position.set(o.x, o.y + Math.sin(this.orbitT * 4 + o.x) * 0.08, o.z);
      const dx = o.x - this.px;
      const dy = o.y - (this.py + 0.9);
      const dz = o.z - this.pz;
      if (dx * dx + dy * dy + dz * dz < 1.7) {
        this.energy = Math.min(MAX_ENERGY, this.energy + o.val);
        this.audio.collect();
        o.active = false;
        o.mesh.visible = false;
      }
    }
  }

  private updateDebris(dt: number) {
    for (const d of this.debris) {
      if (!d.active) continue;
      d.vy -= GRAVITY * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.x += dt * 6;
      d.life -= dt;
      if (d.life <= 0) {
        d.active = false;
        d.mesh.visible = false;
      }
    }
  }

  private animateWorld(dt: number) {
    const t = this.orbitT;
    for (let i = 0; i < this.ballMeshes.length; i++) {
      const b = this.world.balls[i];
      const m = this.ballMeshes[i];
      if (!b || !m || b.taken) continue;
      m.position.y = b.y + Math.sin(t * 2 + i) * 0.12;
      m.rotation.y += dt * 0.9;
    }
    if (this.shenron) {
      this.shenron.rotation.y += dt * 0.15;
      this.shenron.position.y += Math.sin(t * 1.4) * 0.01;
    }
    for (const c of this.clouds) {
      c.position.x += dt * 0.42;
      if (c.position.x > SX + 16) c.position.x = -12;
    }
  }

  private applyCamera(dt: number, paused: boolean) {
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    const shake = this.trauma * this.trauma;
    const ox = (Math.random() - 0.5) * shake * 0.28;
    const oy = (Math.random() - 0.5) * shake * 0.28;
    const bobY = this.grounded && !this.flying ? Math.sin(this.bob) * 0.045 : 0;
    this.camera.position.set(this.px + ox, this.py + EYE + oy + bobY, this.pz);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    const punch = this.punchT > 0 ? Math.sin((this.punchT / 0.22) * Math.PI) : 0;
    const ch = this.charge;
    this.fists.right.position.set(0.36, -0.34, -0.58 - punch * 0.34);
    this.fists.left.position.set(-0.36, -0.34, -0.58 - punch * 0.14);
    const glow = this.superSaiyan ? 0xe8b923 : ch > 0.05 ? 0xc8f4ff : 0xe2c8a8;
    (this.fists.right.material as THREE.MeshLambertMaterial).color.setHex(glow);
    (this.fists.left.material as THREE.MeshLambertMaterial).color.setHex(glow);
    this.fists.right.scale.setScalar(1.25 + ch * 0.45);
    this.fists.left.scale.setScalar(1.25 + ch * 0.28);
    this.auraLight.intensity = this.superSaiyan ? 3.2 : ch * 2.6;
    this.auraLight.color.setHex(this.superSaiyan ? 0xe8b923 : 0x7ce8ff);

    const hit = paused ? null : this.aimHit();
    if (hit) {
      this.highlight.visible = true;
      this.highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      const hard = BLOCK_HARDNESS[hit.block] ?? 0.4;
      const prog = this.mineKey && hard > 0 ? Math.min(1, this.mineT / hard) : 0;
      (this.highlight.material as THREE.LineBasicMaterial).opacity = 0.85 - prog * 0.45;
      this.highlight.scale.setScalar(1 + prog * 0.04);
    } else {
      this.highlight.visible = false;
    }
    void dt;
  }

  private updateHud(dt: number) {
    this.hudAcc += dt;
    this.toastT -= dt;
    if (this.toastT <= 0 && useHud.getState().toast) useHud.getState().patch({ toast: null });
    if (this.hudAcc < 0.07) return;
    this.hudAcc = 0;
    const hit = this.aimHit();
    const lookE = this.nearestEnemy(18);
    const { fx, fz, rx, rz } = this.forwardRight();
    const radar = this.world.balls
      .filter((b) => !b.taken)
      .map((b) => {
        const dx = b.x - this.px;
        const dz = b.z - this.pz;
        const relX = dx * rx + dz * rz;
        const relZ = dx * fx + dz * fz;
        return {
          id: b.id,
          stars: b.stars,
          dist: Math.hypot(dx, dz),
          angle: Math.atan2(relX, relZ),
        };
      });
    const got = this.world.balls.filter((b) => b.taken).length;
    const mineHit = hit;
    const hard = mineHit ? (BLOCK_HARDNESS[mineHit.block] ?? 0.4) : 0;
    const mining =
      this.mineKey && hard > 0 ? Math.min(1, this.mineT / hard) : 0;
    useHud.getState().patch({
      health: Math.max(0, this.health),
      maxHealth: MAX_HEALTH,
      power: this.power | 0,
      flying: this.flying,
      superSaiyan: this.superSaiyan,
      ssjReady: this.power >= SSJ_POWER,
      balls: this.world.balls.map((b) => b.taken),
      ballsGot: got,
      selected: this.selected,
      target: hit ? BLOCK_NAMES[hit.block] ?? null : null,
      radar,
      lookPower: lookE && lookE.alive ? lookE.power | 0 : null,
      wishReady: got >= BALL_COUNT,
      energy: this.energy,
      maxEnergy: MAX_ENERGY,
      charge: this.charge / 1.2,
      mining,
      dashReady: this.dashCd <= 0 && this.energy >= 16,
      combo: this.combo,
    });
  }

  private render(_dt: number) {
    this.sky.position.copy(this.camera.position);
    this.composer.render();
  }

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomPass.setSize(w, h);
  }

  flushSave() {
    if (!this.meshed) return;
    const data: SaveData = {
      version: SAVE_VERSION,
      seed: this.world.seed,
      power: this.power,
      health: this.health,
      energy: this.energy,
      flying: this.flying,
      superSaiyan: this.superSaiyan,
      balls: this.world.balls.map((b) => b.taken),
      edits: this.edits.slice(-2500),
      pos: { x: this.px, y: this.py, z: this.pz },
      yaw: this.yaw,
      pitch: this.pitch,
      selected: this.selected,
    };
    writeSave(data);
    useHud.getState().patch({ hasSave: true });
  }

  private clearChunks() {
    for (const m of this.chunkMeshes.values()) {
      this.scene.remove(m);
      m.geometry.dispose();
    }
    this.chunkMeshes.clear();
  }

  private wireControlsTest() {
    window.__controlsTest = {
      getYaw: () => this.yaw,
      getSpeed: () => Math.hypot(this.vx, this.vz),
      getPos: () => ({ x: this.px, y: this.py, z: this.pz }),
      setKeys: (codes: string[]) => this.input.injectKeys(codes),
      setPose: (x: number, y: number, z: number, yaw: number) => {
        this.px = x;
        this.py = y;
        this.pz = z;
        this.yaw = yaw;
        this.pitch = 0;
        this.vx = this.vy = this.vz = 0;
        this.flying = true;
      },
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.flushSave();
    this.input.dispose();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("pointerlockchange", this.onLock);
    document.removeEventListener("visibilitychange", this.vis);
    this.clearChunks();
    this.clearPool(this.blasts);
    this.clearPool(this.orbs);
    this.clearPool(this.debris);
    for (const e of this.enemies) {
      this.scene.remove(e.mesh);
      e.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    }
    this.enemies = [];
    for (const t of this.ballTex) t.dispose();
    const ballGeos = new Set<THREE.BufferGeometry>();
    for (const m of this.ballMeshes) {
      this.scene.remove(m);
      ballGeos.add(m.geometry);
      (m.material as THREE.Material).dispose();
    }
    for (const g of ballGeos) g.dispose();
    this.ballMeshes = [];
    this.hideShenron();
    const cloudMat = this.clouds[0]?.material;
    for (const c of this.clouds) {
      this.scene.remove(c);
      c.geometry.dispose();
    }
    if (cloudMat) {
      if (Array.isArray(cloudMat)) cloudMat.forEach((m) => m.dispose());
      else cloudMat.dispose();
    }
    this.clouds = [];
    this.atlas.dispose();
    this.terrainMat.dispose();
    this.highlight.geometry.dispose();
    (this.highlight.material as THREE.Material).dispose();
    this.sky.geometry.dispose();
    (this.sky.material as THREE.Material).dispose();
    this.composer.dispose();
    this.renderer.dispose();
    window.__controlsTest = undefined;
  }
}

function yieldFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPos: () => { x: number; y: number; z: number };
      setKeys: (codes: string[]) => void;
      setPose?: (x: number, y: number, z: number, yaw: number) => void;
    };
  }
}
