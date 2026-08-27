export const CHUNK = 16;
export const CX = 8;
export const CY = 5;
export const CZ = 8;
export const SX = CX * CHUNK; // 128
export const SY = CY * CHUNK; // 80
export const SZ = CZ * CHUNK; // 128

export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const SAND = 4;
export const WOOD = 5;
export const LEAVES = 6;
export const KI = 7;
export const BEDROCK = 8;
export const WATER = 9;
export const MOSS = 10;
export const TEMPLE = 11;
export const CLAY = 12;
export const CLOUD = 13;
export const PATH = 14;
export const SNOW = 15;
export const ICE = 16;
export const LAVA = 17;
export const METAL = 18;
export const BASALT = 19;

export const BLOCK_COUNT = 20;

export const BLOCK_NAMES: Record<number, string> = {
  [AIR]: "Luft",
  [GRASS]: "Namek-Gras",
  [DIRT]: "Erde",
  [STONE]: "Stein",
  [SAND]: "Sand",
  [WOOD]: "Holz",
  [LEAVES]: "Blätter",
  [KI]: "Ki-Kristall",
  [BEDROCK]: "Grundstein",
  [WATER]: "Wasser",
  [MOSS]: "Moosstein",
  [TEMPLE]: "Tempelstein",
  [CLAY]: "Lehm",
  [CLOUD]: "Wolkenflaum",
  [PATH]: "Pfad",
  [SNOW]: "Schnee",
  [ICE]: "Eis",
  [LAVA]: "Lava",
  [METAL]: "Metall",
  [BASALT]: "Basalt",
};

/** Seconds to mine while holding the strike button. */
export const BLOCK_HARDNESS: Record<number, number> = {
  [AIR]: 0,
  [GRASS]: 0.18,
  [DIRT]: 0.24,
  [SAND]: 0.16,
  [LEAVES]: 0.08,
  [WOOD]: 0.42,
  [STONE]: 0.72,
  [MOSS]: 0.64,
  [KI]: 0.38,
  [WATER]: 0,
  [BEDROCK]: 99,
  [TEMPLE]: 0.9,
  [CLAY]: 0.22,
  [CLOUD]: 0.12,
  [PATH]: 0.2,
  [SNOW]: 0.16,
  [ICE]: 0.55,
  [LAVA]: 0,
  [METAL]: 1.1,
  [BASALT]: 0.82,
};

export const HOTBAR = [20, 23, 1, 2, 3, 5, 7, 25, 26] as const;
export const CREATIVE_HOTBAR = [20, 21, 22, 23, 24, 1, 3, 11, 7] as const;
export const PLACEABLE = [
  GRASS,
  DIRT,
  STONE,
  SAND,
  WOOD,
  LEAVES,
  KI,
  MOSS,
  TEMPLE,
  CLAY,
  CLOUD,
  PATH,
  SNOW,
  ICE,
  METAL,
  BASALT,
] as const;
export const INV_STACK = 99;

export const PLAYER_HW = 0.32;
export const PLAYER_H = 1.72;
export const EYE = 1.52;
export const WALK_SPEED = 6.9;
export const SNEAK_SPEED = 2.15;
export const SPRINT_SPEED = 11.2;
export const FLY_SPEED = 20;
export const FLY_BOOST = 1.55;
export const SSJ_MUL = 1.75;
export const JUMP_VEL = 9.1;
export const GRAVITY = 28;
export const WALK_ACCEL = 80;
export const AIR_ACCEL = 22;
export const FLY_ACCEL = 26;
export const FLY_DRAG = 7;
export const PLACE_DELAY = 0.2;
export const COYOTE_TIME = 0.16;
export const JUMP_BUFFER = 0.14;
export const STEP_HEIGHT = 1.08;
export const SNAP_DOWN = 0.55;
export const SSJ_POWER = 4500;
export const MAX_HEALTH = 100;
export const START_POWER = 320;
export const MAX_ENERGY = 100;
export const CAMP_START_POWER = 150;
export const CAMP_IFRAMES = 0.16;
export const CAMP_ENERGY_REGEN = 4.6;
export const CAMP_SSJ_DRAIN = 20;
export const CAMP_WISH_POWER = 650;
export const CAMP_KILL_KI = 32;
export const CAMP_BALL_KI = 48;
export const REACH = 6.8;
export const BALL_COUNT = 7;
export const SEA_LEVEL = 16;

export const SAVE_KEY = "kiblox-save-v7";
export const SAVE_VERSION = 7;
