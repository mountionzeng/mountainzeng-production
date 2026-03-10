export type SpinMode = "random" | "target";

export interface DiceRotation {
  x: number;
  y: number;
}

export interface SpinConfig {
  fastDurationMs: number;
  slowDurationMs: number;
  fastSpeedMultiplier: number;
  extraSpinTurnsMin: number;
  extraSpinTurnsRange: number;
}

export const FACE_ROTATIONS: Record<number, DiceRotation> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: -90 },
  6: { x: 0, y: 180 },
};

export const SPIN_CONFIG: SpinConfig = {
  fastDurationMs: 4700,
  slowDurationMs: 3200,
  fastSpeedMultiplier: 10,
  extraSpinTurnsMin: 1,
  extraSpinTurnsRange: 2,
};

const DEFAULT_FACE_ROTATION = FACE_ROTATIONS[1];

export function getSpinDurationMs(mode: SpinMode, config: SpinConfig = SPIN_CONFIG): number {
  return mode === "random" ? config.fastDurationMs : config.slowDurationMs;
}

export function getSpinSpeedMultiplier(mode: SpinMode, config: SpinConfig = SPIN_CONFIG): number {
  return mode === "random" ? config.fastSpeedMultiplier : 1;
}

export function randomFaceId(totalFaces: number, random: () => number = Math.random): number {
  return Math.floor(random() * totalFaces) + 1;
}

export function buildSpinRotation(
  faceId: number,
  mode: SpinMode,
  config: SpinConfig = SPIN_CONFIG,
  random: () => number = Math.random
): DiceRotation {
  const target = FACE_ROTATIONS[faceId] ?? DEFAULT_FACE_ROTATION;
  const speedMultiplier = getSpinSpeedMultiplier(mode, config);

  // 额外旋转使用 360 的整数倍，确保最终稳定停在目标面
  const extraTurnsX =
    (Math.floor(random() * config.extraSpinTurnsRange) + config.extraSpinTurnsMin) *
    speedMultiplier;
  const extraTurnsY =
    (Math.floor(random() * config.extraSpinTurnsRange) + config.extraSpinTurnsMin) *
    speedMultiplier;
  const dirX = random() > 0.5 ? 1 : -1;
  const dirY = random() > 0.5 ? 1 : -1;

  return {
    x: target.x + extraTurnsX * 360 * dirX,
    y: target.y + extraTurnsY * 360 * dirY,
  };
}
