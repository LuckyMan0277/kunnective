import Phaser from 'phaser';

export type GeometryType = 'rect' | 'ramp';

export interface GeometryEntry {
  id: string;
  type: GeometryType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  length?: number;
  thickness?: number;
  angle?: number;
}

export interface MultiplierGate {
  id: string;
  type: 'multiplier';
  x: number;
  y: number;
  width: number;
  multiplier: number;
  moving?: boolean;
  minX?: number;
  maxX?: number;
  speed?: number;
}

export interface DeleteGate {
  id: string;
  type: 'delete';
  x: number;
  y: number;
  width: number;
  remaining: number;
}

export interface BouncePad {
  id: string;
  type: 'bounce';
  x: number;
  y: number;
  width: number;
  height: number;
  bounceVy: number;
  bounceVx?: number;
}

export interface Collector {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpawnConfig {
  x: number;
  y: number;
  spreadX: number;
  intervalMs: number;
}

export interface LevelConfig {
  inputBalls: number;
  maxPhysicalBalls: number;
  spawn: SpawnConfig;
  geometry: GeometryEntry[];
  gates: MultiplierGate[];
  deleteGates: DeleteGate[];
  pads: BouncePad[];
  collector: Collector;
}

export type BallSprite = Phaser.Physics.Matter.Image & {
  count?: number;
  prevY?: number;
  alive?: boolean;
  usedTriggerIds?: Set<string>;
  spawnedAt?: number;
};
