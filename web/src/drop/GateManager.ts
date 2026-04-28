import Phaser from 'phaser';
import type { BallSprite, BouncePad, DeleteGate, LevelConfig, MultiplierGate } from './types';
import { BallManager } from './BallManager';

interface GateRuntime<T> {
  config: T;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  currentX: number;
  direction: 1 | -1;
  frozen: boolean;
}

export class GateManager {
  private gates: GateRuntime<MultiplierGate>[] = [];
  private deletes: GateRuntime<DeleteGate>[] = [];
  private pads: GateRuntime<BouncePad>[] = [];

  constructor(private scene: Phaser.Scene, private level: LevelConfig, private balls: BallManager) {
    this.buildGates();
    this.buildDeletes();
    this.buildPads();
  }

  private labelStyle = (size: number) => ({
    fontFamily: 'system-ui, sans-serif',
    fontSize: `${size}px`,
    color: '#ffffff',
    fontStyle: 'bold',
  });

  private buildGates(): void {
    for (const g of this.level.gates) {
      const color = g.multiplier >= 4 ? 0xa855f7 : g.multiplier === 3 ? 0x3b82f6 : 0x22c55e;
      const rect = this.scene.add.rectangle(g.x, g.y, g.width, 16, color, 0.85).setStrokeStyle(2, 0xffffff, 0.5);
      const label = this.scene.add.text(g.x, g.y, `x${g.multiplier}`, this.labelStyle(18)).setOrigin(0.5);
      this.gates.push({ config: g, rect, label, currentX: g.x, direction: 1, frozen: false });
    }
  }

  private buildDeletes(): void {
    for (const d of this.level.deleteGates) {
      const rect = this.scene.add.rectangle(d.x, d.y, d.width, 16, 0xef4444, 0.85).setStrokeStyle(2, 0xffffff, 0.5);
      const label = this.scene.add.text(d.x, d.y, `-${d.remaining}`, this.labelStyle(16)).setOrigin(0.5);
      this.deletes.push({ config: { ...d }, rect, label, currentX: d.x, direction: 1, frozen: false });
    }
  }

  private buildPads(): void {
    for (const p of this.level.pads) {
      const rect = this.scene.add.rectangle(p.x, p.y, p.width, p.height, 0x3b82f6, 0.85).setStrokeStyle(2, 0xffffff, 0.5);
      const label = this.scene.add.text(p.x, p.y, '↑', this.labelStyle(20)).setOrigin(0.5);
      this.pads.push({ config: p, rect, label, currentX: p.x, direction: 1, frozen: false });
    }
  }

  update(dt: number): void {
    for (const g of this.gates) {
      const cfg = g.config;
      if (!cfg.moving) continue;
      if (g.frozen) continue;
      const speed = cfg.speed ?? 60;
      g.currentX += g.direction * speed * dt;
      if (cfg.maxX !== undefined && g.currentX >= cfg.maxX) {
        g.currentX = cfg.maxX;
        g.direction = -1;
      } else if (cfg.minX !== undefined && g.currentX <= cfg.minX) {
        g.currentX = cfg.minX;
        g.direction = 1;
      }
      g.rect.setX(g.currentX);
      g.label.setX(g.currentX);
    }
  }

  processBalls(onCollect: (ball: BallSprite) => void): void {
    const collector = this.level.collector;
    const collectorMinX = collector.x - collector.width / 2;
    const collectorMaxX = collector.x + collector.width / 2;
    const collectorMinY = collector.y - collector.height / 2;
    const collectorMaxY = collector.y + collector.height / 2;

    this.balls.forEach(ball => {
      if (!ball.alive) return;
      const prevY = ball.prevY ?? ball.y;
      const currentY = ball.y;
      const x = ball.x;

      if (x >= collectorMinX && x <= collectorMaxX && currentY >= collectorMinY && currentY <= collectorMaxY) {
        onCollect(ball);
        ball.prevY = currentY;
        return;
      }

      for (const g of this.gates) {
        const cfg = g.config;
        const gx = g.currentX;
        const gy = cfg.y;
        const gw = cfg.width;
        if (!ball.usedTriggerIds || ball.usedTriggerIds.has(cfg.id)) continue;
        const inX = x >= gx - gw / 2 && x <= gx + gw / 2;
        if (!inX) continue;
        const crossedDown = prevY < gy && currentY >= gy;
        const crossedUp = prevY > gy && currentY <= gy;
        if (crossedDown || crossedUp) {
          ball.usedTriggerIds.add(cfg.id);
          if (cfg.moving) {
            g.frozen = true;
          }
          this.applyMultiplier(ball, cfg);
        }
      }

      for (let i = this.deletes.length - 1; i >= 0; i--) {
        const d = this.deletes[i];
        const cfg = d.config;
        if (!ball.usedTriggerIds || ball.usedTriggerIds.has(cfg.id)) continue;
        const inX = x >= cfg.x - cfg.width / 2 && x <= cfg.x + cfg.width / 2;
        if (!inX) continue;
        const crossedDown = prevY < cfg.y && currentY >= cfg.y;
        const crossedUp = prevY > cfg.y && currentY <= cfg.y;
        if (crossedDown || crossedUp) {
          ball.usedTriggerIds.add(cfg.id);
          cfg.remaining -= 1;
          d.label.setText(`-${cfg.remaining}`);
          this.balls.destroyBall(ball);
          if (cfg.remaining <= 0) {
            d.rect.destroy();
            d.label.destroy();
            this.deletes.splice(i, 1);
          }
          ball.prevY = currentY;
          return;
        }
      }

      for (const p of this.pads) {
        const cfg = p.config;
        if (!ball.usedTriggerIds || ball.usedTriggerIds.has(cfg.id)) continue;
        const inX = x >= cfg.x - cfg.width / 2 && x <= cfg.x + cfg.width / 2;
        const padTop = cfg.y - cfg.height / 2;
        const padBottom = cfg.y + cfg.height / 2;
        if (!inX) continue;
        const enteredFromAbove = prevY < padTop && currentY >= padTop && currentY <= padBottom + 4;
        if (enteredFromAbove) {
          ball.usedTriggerIds.add(cfg.id);
          ball.setVelocity(cfg.bounceVx ?? 0, cfg.bounceVy);
          // 발판을 밟은 공은 multiplier 게이트를 다시 발동할 수 있게 한다
          for (const mg of this.gates) {
            ball.usedTriggerIds.delete(mg.config.id);
          }
        }
      }

      ball.prevY = currentY;
    });
  }

  private applyMultiplier(ball: BallSprite, cfg: MultiplierGate): void {
    const m = cfg.multiplier;
    if (!this.balls.hasCapacity()) {
      ball.count = (ball.count ?? 1) * m;
      return;
    }
    const clonesNeeded = m - 1;
    for (let i = 0; i < clonesNeeded; i++) {
      if (!this.balls.hasCapacity()) {
        const left = clonesNeeded - i;
        ball.count = (ball.count ?? 1) * (1 + left);
        break;
      }
      const presetUsed = new Set(ball.usedTriggerIds ?? []);
      const offsetX = Phaser.Math.FloatBetween(-8, 8);
      const offsetY = Phaser.Math.FloatBetween(2, 8);
      const vx = Phaser.Math.FloatBetween(-1, 1);
      const vy = Phaser.Math.FloatBetween(0.5, 1.5);
      this.balls.spawnAt(ball.x + offsetX, ball.y + offsetY, ball.count ?? 1, presetUsed, vx, vy);
    }
  }
}
