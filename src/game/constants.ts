export const CHUNK = 16;
export const CX = 8;
export const CY = 4;
export const CZ = 8;
export const SX = CX * CHUNK; // 128
export const SY = CY * CHUNK; // 64
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

export const BLOCK_COUNT = 11;

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
};

export const HOTBAR = [GRASS, DIRT, STONE, WOOD, KI] as const;

export const PLAYER_HW = 0.32;
export const PLAYER_H = 1.72;
export const EYE = 1.52;
export const WALK_SPEED = 6.4;
export const SPRINT_SPEED = 9.8;
export const FLY_SPEED = 16;
export const SSJ_MUL = 1.75;
export const JUMP_VEL = 8.6;
export const GRAVITY = 24;
export const SSJ_POWER = 4500;
export const MAX_HEALTH = 100;
export const START_POWER = 320;
export const MAX_ENERGY = 100;
export const REACH = 6.8;
export const BALL_COUNT = 7;
export const SEA_LEVEL = 15;

export const SAVE_KEY = "kiblox-save-v2";
export const SAVE_VERSION = 2;
