import * as THREE from "three";
import { SPECIES, type SpeciesId } from "./campaign";
import type { EnemyKind } from "./world";

export function makeBeing(kind: EnemyKind, species: SpeciesId): THREE.Group {
  const g = new THREE.Group();
  const pal = SPECIES[species];
  const scale = kind === "lord" ? 1.55 : kind === "elite" ? 1.28 : kind === "brute" ? 1.35 : 1;
  const flyer = kind === "flyer";
  const bodyH = flyer ? 0.4 : kind === "brute" ? 0.7 : 0.55;
  const bodyR = flyer ? 0.24 : kind === "brute" ? 0.38 : 0.28;

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(bodyR, bodyH, 4, 8),
    new THREE.MeshLambertMaterial({
      color: pal.body,
      emissive: pal.accent,
      emissiveIntensity: species === "cryon" || species === "aetheri" ? 0.18 : 0.05,
    }),
  );
  body.position.y = flyer ? 0.55 : 0.72;
  body.name = "body";

  const headGeo =
    species === "automata"
      ? new THREE.BoxGeometry(0.42, 0.38, 0.42)
      : species === "cryon"
        ? new THREE.SphereGeometry(0.26, 10, 8)
        : new THREE.SphereGeometry(0.22, 10, 8);
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshLambertMaterial({
      color: pal.head,
      emissive: pal.accent,
      emissiveIntensity: species === "automata" ? 0.12 : 0.08,
    }),
  );
  head.position.y = flyer ? 1.05 : kind === "brute" ? 1.45 : 1.28;

  g.add(body, head);

  if (species === "veldari") {
    const antG = new THREE.ConeGeometry(0.05, 0.28, 6);
    antG.rotateX(Math.PI);
    const ant = new THREE.Mesh(antG, new THREE.MeshLambertMaterial({ color: pal.accent }));
    ant.position.set(0.08, head.position.y + 0.24, 0);
    const ant2 = ant.clone();
    ant2.position.x = -0.08;
    g.add(ant, ant2);
  }

  if (species === "thrynn") {
    const horn = new THREE.ConeGeometry(0.07, 0.38, 6);
    const h1 = new THREE.Mesh(horn, new THREE.MeshLambertMaterial({ color: pal.accent }));
    const h2 = h1.clone();
    h1.position.set(-0.16, head.position.y + 0.28, 0);
    h2.position.set(0.16, head.position.y + 0.22, 0);
    h1.rotation.z = 0.45;
    h2.rotation.z = -0.35;
    g.add(h1, h2);
  }

  if (species === "cryon") {
    const crown = new THREE.ConeGeometry(0.12, kind === "lord" ? 0.55 : 0.28, 5);
    const c = new THREE.Mesh(
      crown,
      new THREE.MeshLambertMaterial({ color: pal.accent, emissive: pal.eye, emissiveIntensity: 0.35 }),
    );
    c.position.y = head.position.y + (kind === "lord" ? 0.42 : 0.28);
    g.add(c);
  }

  if (species === "automata") {
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: pal.eye }),
    );
    visor.position.set(0, head.position.y, 0.22);
    g.add(visor);
  }

  const eyeY = head.position.y + (species === "automata" ? -0.02 : 0.04);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(species === "cryon" ? 0.04 : 0.05, 6, 6),
    new THREE.MeshBasicMaterial({ color: pal.eye }),
  );
  if (species === "cryon") {
    const offsets: [number, number][] = [
      [-0.09, 0.06],
      [0.09, 0.06],
      [-0.09, -0.05],
      [0.09, -0.05],
    ];
    for (const [ox, oy] of offsets) {
      const e = eye.clone();
      e.position.set(ox, eyeY + oy, 0.2);
      g.add(e);
    }
  } else if (species !== "automata") {
    eye.position.set(-0.08, eyeY, 0.16);
    const eyeR = eye.clone();
    eyeR.position.x = 0.08;
    g.add(eye, eyeR);
  }

  if (flyer) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.06, 0.38),
      new THREE.MeshLambertMaterial({ color: pal.accent, emissive: pal.body, emissiveIntensity: 0.2 }),
    );
    wing.position.y = 0.7;
    wing.name = "wing";
    g.add(wing);
  }

  if (kind === "lord") {
    const cape = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.4, 8),
      new THREE.MeshLambertMaterial({ color: pal.accent, transparent: true, opacity: 0.7 }),
    );
    cape.position.y = 0.4;
    cape.rotation.x = Math.PI;
    g.add(cape);
  }

  g.scale.setScalar(scale);
  return g;
}

export function hpFor(kind: EnemyKind, power: number) {
  const base =
    kind === "lord" ? 160 : kind === "elite" ? 90 : kind === "brute" ? 70 : kind === "flyer" ? 28 : kind === "shooter" ? 44 : 36;
  return base + power / 80;
}
