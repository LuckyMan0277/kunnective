import Phaser from 'phaser';
import type { BallSprite, LevelConfig } from './types';

const BALL_RADIUS = 6;
const BALL_TEXTURE_KEY = 'ballTexture';
const BALL_LIFETIME_MS = 15000;

export class BallManager {
  private balls = new Set<BallSprite>();

  constructor(private scene: Phaser.Scene, private level: LevelConfig) {
    this.ensureTexture();
  }

  private ensureTexture(): void {
    if (this.scene.textures.exists(BALL_TEXTURE_KEY)) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    g.lineStyle(1, 0xfde047, 1);
    g.strokeCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    g.generateTexture(BALL_TEXTURE_KEY, BALL_RADIUS * 2, BALL_RADIUS * 2);
    g.destroy();
  }

  size(): number {
    return this.balls.size;
  }

  forEach(cb: (b: BallSprite) => void): void {
    this.balls.forEach(cb);
  }

  spawnInitial(valuePerBall: number): void {
    const { x, y, spreadX } = this.level.spawn;
    const jitter = Phaser.Math.FloatBetween(-spreadX / 2, spreadX / 2);
    const ball = this.createBall(x + jitter, y, valuePerBall, undefined);
    this.balls.add(ball);
  }

  spawnAt(x: number, y: number, count: number, presetUsedIds?: Set<string>, vx = 0, vy = 0): BallSprite {
    const ball = this.createBall(x, y, count, presetUsedIds);
    if (vx !== 0 || vy !== 0) ball.setVelocity(vx, vy);
    this.balls.add(ball);
    return ball;
  }

  private createBall(x: number, y: number, count: number, presetUsedIds: Set<string> | undefined): BallSprite {
    const ball = this.scene.matter.add.image(x, y, BALL_TEXTURE_KEY, undefined, {
      shape: { type: 'circle', radius: BALL_RADIUS },
      restitution: 0.3,
      friction: 0.05,
      density: 0.001,
    }) as BallSprite;
    ball.count = count;
    ball.prevY = y;
    ball.alive = true;
    ball.usedTriggerIds = new Set(presetUsedIds ?? []);
    ball.spawnedAt = this.scene.time.now;
    return ball;
  }

  destroyBall(ball: BallSprite): void {
    if (!ball.alive) return;
    ball.alive = false;
    this.balls.delete(ball);
    ball.destroy();
  }

  cullExpired(now: number): void {
    this.balls.forEach(b => {
      if (b.spawnedAt !== undefined && now - b.spawnedAt > BALL_LIFETIME_MS) {
        this.destroyBall(b);
      }
    });
  }

  hasCapacity(): boolean {
    return this.balls.size < this.level.maxPhysicalBalls;
  }
}
