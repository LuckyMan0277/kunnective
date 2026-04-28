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

    { id: 'guardR_outer', type: 'ramp', x: 355, y: 250, length: 70, thickness: 8, angle: 70 },
    { id: 'guardR_inner', type: 'ramp', x: 270, y: 250, length: 70, thickness: 8, angle: -70 },

    { id: 'guideL', type: 'ramp', x: 90, y: 290, length: 90, thickness: 8, angle: 20 },

    { id: 'splitter', type: 'rect', x: 200, y: 430, width: 10, height: 90 },

    { id: 'leadToPad', type: 'ramp', x: 165, y: 560, length: 80, thickness: 8, angle: 18 },

    { id: 'funnelL', type: 'ramp', x: 110, y: 720, length: 180, thickness: 12, angle: 22 },
    { id: 'funnelR', type: 'ramp', x: 290, y: 720, length: 180, thickness: 12, angle: -22 },
  ],

  gates: [
    { id: 'g1', type: 'multiplier', x: 200, y: 150, width: 200, multiplier: 2, moving: false },

    { id: 'g2', type: 'multiplier', x: 200, y: 360, width: 100, multiplier: 3,
      moving: true, minX: 110, maxX: 290, speed: 90 },

    { id: 'g4', type: 'multiplier', x: 90, y: 360, width: 90, multiplier: 2, moving: false },

    { id: 'g3', type: 'multiplier', x: 320, y: 470, width: 80, multiplier: 4, moving: false },
  ],

  deleteGates: [
    { id: 'd1', type: 'delete', x: 320, y: 320, width: 80, remaining: 8 },
  ],

  pads: [
    { id: 'p1', type: 'bounce', x: 110, y: 620, width: 100, height: 16, bounceVy: -28, bounceVx: 0 },
  ],

  collector: {
    x: 200,
    y: 760,
    width: 130,
    height: 30,
  },
};
