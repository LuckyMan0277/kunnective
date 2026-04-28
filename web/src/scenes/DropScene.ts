import Phaser from 'phaser';
import type { LevelConfig } from '../drop/types';
import { testLevel } from '../drop/testLevel';
import { GeometryBuilder } from '../drop/GeometryBuilder';
import { BallManager } from '../drop/BallManager';
import { GateManager } from '../drop/GateManager';

export interface DropSceneInit {
  level?: LevelConfig;
  onDropComplete?: (resultBalls: number) => void;
}

const MAX_DURATION_MS = 30000;

export class DropScene extends Phaser.Scene {
  private level: LevelConfig = testLevel;
  private onDropComplete?: (resultBalls: number) => void;
  private ballManager!: BallManager;
  private gateManager!: GateManager;

  private inputBalls = 0;
  private valuePerBall = 1;
  private spawnedBalls = 0;
  private targetSpawnCount = 0;
  private resultBalls = 0;
  private dropping = false;
  private finished = false;
  private startedAt = 0;

  private uiInput!: Phaser.GameObjects.Text;
  private uiSpawned!: Phaser.GameObjects.Text;
  private uiAlive!: Phaser.GameObjects.Text;
  private uiResult!: Phaser.GameObjects.Text;
  private dropButton!: Phaser.GameObjects.Rectangle;
  private endText?: Phaser.GameObjects.Text;
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('DropScene');
  }

  init(data: DropSceneInit): void {
    if (data?.level) this.level = data.level;
    if (data?.onDropComplete) this.onDropComplete = data.onDropComplete;
  }

  create(): void {
    this.inputBalls = this.level.inputBalls;
    if (this.inputBalls > this.level.maxPhysicalBalls) {
      this.targetSpawnCount = this.level.maxPhysicalBalls;
      this.valuePerBall = Math.ceil(this.inputBalls / this.level.maxPhysicalBalls);
    } else {
      this.targetSpawnCount = this.inputBalls;
      this.valuePerBall = 1;
    }

    this.spawnedBalls = 0;
    this.resultBalls = 0;
    this.finished = false;
    this.dropping = false;

    GeometryBuilder.build(this, this.level.geometry);
    this.ballManager = new BallManager(this, this.level);
    this.gateManager = new GateManager(this, this.level, this.ballManager);

    this.drawCollector();
    this.buildUi();
  }

  private drawCollector(): void {
    const c = this.level.collector;
    this.add.rectangle(c.x, c.y, c.width, c.height, 0xfacc15, 0.25).setStrokeStyle(2, 0xfde047, 0.7);
  }

  private buildUi(): void {
    const baseStyle = { fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#ffffff' };
    this.uiInput = this.add.text(8, 8, '', baseStyle);
    this.uiSpawned = this.add.text(8, 26, '', baseStyle);
    this.uiAlive = this.add.text(8, 44, '', baseStyle);
    this.uiResult = this.add.text(8, 62, '', baseStyle);

    const btnX = 200;
    const btnY = 30;
    this.dropButton = this.add.rectangle(btnX, btnY, 110, 40, 0x8b5cf6).setStrokeStyle(2, 0xffffff, 0.7);
    this.add.text(btnX, btnY, 'DROP', { ...baseStyle, fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
    this.dropButton.setInteractive({ useHandCursor: true }).on('pointerup', () => this.startDrop());

    this.refreshUi();
  }

  private startDrop(): void {
    if (this.dropping || this.finished) return;
    this.dropping = true;
    this.startedAt = this.time.now;
    this.dropButton.setFillStyle(0x6b7280);
    this.spawnTimer = this.time.addEvent({
      delay: this.level.spawn.intervalMs,
      repeat: this.targetSpawnCount - 1,
      callback: () => this.spawnNext(),
    });
  }

  private spawnNext(): void {
    if (this.spawnedBalls >= this.targetSpawnCount) return;
    if (!this.ballManager.hasCapacity()) {
      const sample: { ball: import('../drop/types').BallSprite | null } = { ball: null };
      this.ballManager.forEach(b => {
        if (!sample.ball) sample.ball = b;
      });
      if (sample.ball && sample.ball.count !== undefined) {
        sample.ball.count += this.valuePerBall;
      }
      this.spawnedBalls++;
      return;
    }
    this.ballManager.spawnInitial(this.valuePerBall);
    this.spawnedBalls++;
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;
    const dt = delta / 1000;
    this.gateManager.update(dt);
    this.gateManager.processBalls(ball => {
      this.resultBalls += ball.count ?? 0;
      this.ballManager.destroyBall(ball);
    });

    this.ballManager.forEach(ball => {
      if (ball.y > 900 || ball.x < -50 || ball.x > 450 || ball.y < -50) {
        this.ballManager.destroyBall(ball);
      }
    });
    this.ballManager.cullExpired(_time);

    this.refreshUi();
    this.maybeFinish(_time);
  }

  private refreshUi(): void {
    this.uiInput.setText(`Input: ${this.inputBalls} (×${this.valuePerBall}/ball)`);
    this.uiSpawned.setText(`Spawned: ${this.spawnedBalls}/${this.targetSpawnCount}`);
    this.uiAlive.setText(`Alive: ${this.ballManager.size()}`);
    this.uiResult.setText(`Result: ${this.resultBalls}`);
  }

  private maybeFinish(now: number): void {
    if (!this.dropping) return;
    const allSpawned = this.spawnedBalls >= this.targetSpawnCount;
    const noneAlive = this.ballManager.size() === 0;
    const timedOut = now - this.startedAt > MAX_DURATION_MS;
    if ((allSpawned && noneAlive) || timedOut) {
      this.finished = true;
      this.dropping = false;
      this.spawnTimer?.remove();
      this.showEndScreen();
      this.onDropComplete?.(this.resultBalls);
      this.registry.set('dropResult', this.resultBalls);
      this.events.emit('drop-complete', this.resultBalls);
    }
  }

  private showEndScreen(): void {
    this.endText = this.add.text(200, 400, `RESULT\n${this.resultBalls}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    this.endText.setStroke('#000000', 4);
  }
}
