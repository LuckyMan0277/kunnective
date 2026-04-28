import type { LevelConfig } from './types';

export const testLevel: LevelConfig = {
  inputBalls: 50,
  maxPhysicalBalls: 120,

  spawn: {
    x: 200,
    y: 60,
    spreadX: 20,
    intervalMs: 40,
  },

  geometry: [
    { id: 'wallLeft', type: 'rect', x: 14, y: 400, width: 24, height: 760 },
    { id: 'wallRight', type: 'rect', x: 386, y: 400, width: 24, height: 760 },

    { id: 'divider1', type: 'rect', x: 200, y: 470, width: 10, height: 100 },

    { id: 'guideX4', type: 'ramp', x: 320, y: 320, length: 90, thickness: 8, angle: -25 },

    { id: 'funnelL', type: 'ramp', x: 83, y: 700, length: 126, thickness: 12, angle: 25 },
    { id: 'funnelR', type: 'ramp', x: 317, y: 700, length: 126, thickness: 12, angle: -25 },
  ],

  gates: [
    { id: 'g1', type: 'multiplier', x: 200, y: 160, width: 130, multiplier: 2, moving: false },

    { id: 'g2', type: 'multiplier', x: 200, y: 280, width: 110, multiplier: 3, moving: true, minX: 130, maxX: 270, speed: 80 },

    { id: 'g3', type: 'multiplier', x: 310, y: 430, width: 90, multiplier: 4, moving: false },

    { id: 'g4', type: 'multiplier', x: 100, y: 360, width: 110, multiplier: 2, moving: false },
  ],

  deleteGates: [
    { id: 'd1', type: 'delete', x: 310, y: 380, width: 70, remaining: 10 },
  ],

  pads: [
    { id: 'p1', type: 'bounce', x: 130, y: 600, width: 110, height: 16, bounceVy: -28, bounceVx: 0 },
  ],

  collector: {
    x: 200,
    y: 760,
    width: 120,
    height: 30,
  },
};
