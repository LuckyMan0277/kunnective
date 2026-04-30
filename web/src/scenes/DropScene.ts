import Phaser from 'phaser';
import type { LevelConfig } from '../drop/types';
import { testLevel } from '../drop/testLevel';
import { GeometryBuilder } from '../drop/GeometryBuilder';
import { BallManager, BALL_TEXTURE_KEY } from '../drop/BallManager';
import { GateManager } from '../drop/GateManager';

const COLOR_COLLECTOR = 0x8bd3dd;

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
  private dropX = 0;
  private aiming = true;
  private indicator!: Phaser.GameObjects.Image;
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
    this.cameras.main.setBackgroundColor('#fef6e4');
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

    this.dropX = this.level.spawn.x;
    this.indicator = this.add.image(this.dropX, this.level.spawn.y, BALL_TEXTURE_KEY)
      .setAlpha(0.6)
      .setScale(1.4);
    this.aiming = true;
    this.setupInput();
  }

  private drawCollector(): void {
    const c = this.level.collector;
    this.add.rectangle(c.x, c.y, c.width, c.height, COLOR_COLLECTOR, 0.25).setStrokeStyle(2, 0x2d2a4a, 0.18);
  }

  private buildUi(): void {
    const baseStyle = { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fontSize: '16px', fontStyle: '700', color: '#2d2a4a' };
    this.uiInput = this.add.text(8, 8, '', baseStyle);
    this.uiSpawned = this.add.text(8, 26, '', baseStyle);
    this.uiAlive = this.add.text(8, 44, '', baseStyle);
    this.uiResult = this.add.text(8, 62, '', baseStyle);

    this.add.text(390, 8, 'Drag & release to drop', { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fontSize: '12px', color: '#2d2a4a' }).setOrigin(1, 0);

    this.add.text(390, 780, 'Editor', {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontStyle: '600',
      color: '#2d2a4a',
      backgroundColor: '#8bd3dd',
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('EditorScene', { level: this.level }));

    this.refreshUi();
  }

  private startDrop(): void {
    if (this.dropping || this.finished) return;
    this.dropping = true;
    this.startedAt = this.time.now;
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
    this.ballManager.spawnInitial(this.valuePerBall, this.dropX);
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
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: '32px',
      color: '#2d2a4a',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    this.endText.setStroke('#ffffff', 4);
  }

  private setupInput(): void {
    const minX = 42;
    const maxX = 358;
    const updateIndicator = (x: number) => {
      if (!this.aiming) return;
      this.dropX = Phaser.Math.Clamp(x, minX, maxX);
      this.indicator.setX(this.dropX);
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => updateIndicator(p.x));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      updateIndicator(p.x);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      updateIndicator(p.x);
      if (!this.aiming) return;
      this.aiming = false;
      this.indicator.setVisible(false);
      this.startDrop();
    });
  }
}
