export const FIST = 20;
export const SWORD = 21;
export const STAFF = 22;
export const PICK = 23;
export const CANNON = 24;
export const BEAN = 25;
export const VIAL = 26;

export const ITEM_MAX = 27;

export const ITEM_NAMES: Record<number, string> = {
  [FIST]: "Fäuste",
  [SWORD]: "Ki-Klinge",
  [STAFF]: "Kampfstab",
  [PICK]: "Spitzhacke",
  [CANNON]: "Ki-Rohr",
  [BEAN]: "Senzu",
  [VIAL]: "Ki-Phiole",
};

export type WeaponStat = {
  dmg: number;
  range: number;
  speed: number;
  heavy: number;
  mine: number;
  kiMul: number;
};

export const WEAPON_STATS: Record<number, WeaponStat> = {
  [FIST]: { dmg: 1, range: 2.1, speed: 0.3, heavy: 1.55, mine: 1, kiMul: 1 },
  [SWORD]: { dmg: 1.6, range: 2.85, speed: 0.4, heavy: 2.15, mine: 0.75, kiMul: 1 },
  [STAFF]: { dmg: 1.28, range: 3.15, speed: 0.46, heavy: 1.9, mine: 0.65, kiMul: 1.1 },
  [PICK]: { dmg: 0.9, range: 2.15, speed: 0.36, heavy: 1.35, mine: 2.45, kiMul: 0.85 },
  [CANNON]: { dmg: 0.72, range: 2.05, speed: 0.5, heavy: 1.2, mine: 0.5, kiMul: 1.5 },
};

export function isWeapon(id: number) {
  return id === FIST || id === SWORD || id === STAFF || id === PICK || id === CANNON;
}

export function isConsumable(id: number) {
  return id === BEAN || id === VIAL;
}

export function isGear(id: number) {
  return isWeapon(id) || isConsumable(id);
}

export function weaponOf(id: number): WeaponStat {
  return WEAPON_STATS[id] ?? WEAPON_STATS[FIST]!;
}

export const GEAR_LIST = [FIST, SWORD, STAFF, PICK, CANNON, BEAN, VIAL] as const;

export const WEAPON_LIST = [FIST, SWORD, STAFF, PICK, CANNON] as const;

export const CONSUMABLE_LIST = [BEAN, VIAL] as const;

export function kitName(id: number) {
  if (id === SWORD) return "sword";
  if (id === STAFF) return "staff";
  if (id === PICK) return "pick";
  if (id === CANNON) return "cannon";
  return "fist";
}

export function voxGearKey(id: number) {
  if (id === FIST) return "fist";
  if (id === SWORD) return "sword";
  if (id === STAFF) return "staff";
  if (id === PICK) return "pick";
  if (id === CANNON) return "cannon";
  if (id === BEAN) return "bean";
  if (id === VIAL) return "vial";
  return null;
}
