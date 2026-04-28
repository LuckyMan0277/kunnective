import Phaser from 'phaser';

const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;
const CUP_Y = 100;
const CUP_WIDTH = 60;
const CUP_HEIGHT = 40;
const CUP_MIN_X = CUP_WIDTH / 2 + 20;
const CUP_MAX_X = GAME_WIDTH - CUP_WIDTH / 2 - 20;
const POUR_BALL_COUNT = 20;
const POUR_INTERVAL_MS = 60;
const DROPS_PER_ROUND = 3;
const BALL_RADIUS = 6;
const GATE_WIDTH = 70;
const GATE_HEIGHT = 60;
const GATE_GAP = 90;
const GATE_ROW_Y = 640;
const GATE_INITIAL_SPEED = 80;
const GATE_SPEED_STEP = 20;
const GATE_SPEED_MAX = 200;
const GATE_SPEED_INTERVAL_MS = 5000;
const COLLECTOR_Y = 900;

type GateKind = 'x2' | 'x3' | 'x4' | 'penalty' | 'trampoline' | 'mystery';

interface GateDef {
  kind: GateKind;
  color: number;
  label: string;
}

const ALL_GATES: GateDef[] = [
  { kind: 'x2', color: 0x22c55e, label: 'x2' },
  { kind: 'x3', color: 0x3b82f6, label: 'x3' },
  { kind: 'x4', color: 0xa855f7, label: 'x4' },
  { kind: 'penalty', color: 0xef4444, label: '÷5' },
  { kind: 'trampoline', color: 0xfacc15, label: '↑' },
  { kind: 'mystery', color: 0x6b7280, label: '?' },
];

interface Gate {
  kind: GateKind;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  body: MatterJS.BodyType;
  groupOffsetX: number;
}

type BallSprite = Phaser.Physics.Matter.Image & { value?: number; passed?: Set<MatterJS.BodyType>; counted?: boolean };

export class GameScene extends Phaser.Scene {
  private cupX = GAME_WIDTH / 2;
  private cup!: Phaser.GameObjects.Rectangle;
  private dropsRemaining = DROPS_PER_ROUND;
  private ballsThisRound = 0;
  private dropsText!: Phaser.GameObjects.Text;
  private ballsText!: Phaser.GameObjects.Text;
  private gates: Gate[] = [];
  private gateGroupX = 0;
  private gateSpeed = GATE_INITIAL_SPEED;
  private gateDirection = 1;
  private collectorBody!: MatterJS.BodyType;
  private activeBalls = new Set<BallSprite>();
  private ballTextureKey = 'ballTexture';
  private pouring = false;
  private roundEndContainer!: Phaser.GameObjects.Container;
  private gateGroupMinX = 0;
  private gateGroupMaxX = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.createTextures();
    this.createWalls();
    this.createCollector();
    this.createGates();
    this.createCup();
    this.createHud();
    this.createRoundEndOverlay();
    this.setupInput();
    this.setupCollisions();
    this.scheduleSpeedUp();
    this.refreshHud();
  }

  private createTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    g.lineStyle(1, 0xfde047, 1);
    g.strokeCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    g.generateTexture(this.ballTextureKey, BALL_RADIUS * 2, BALL_RADIUS * 2);
    g.destroy();
  }

  private createWalls(): void {
    const t = 40;
    const opts = { isStatic: true, restitution: 0.1, friction: 0.05 };
    this.matter.add.rectangle(-t / 2, GAME_HEIGHT / 2, t, GAME_HEIGHT, opts);
    this.matter.add.rectangle(GAME_WIDTH + t / 2, GAME_HEIGHT / 2, t, GAME_HEIGHT, opts);
    this.matter.add.rectangle(GAME_WIDTH / 2, -t / 2, GAME_WIDTH, t, opts);
  }

  private createCollector(): void {
    this.collectorBody = this.matter.add.rectangle(GAME_WIDTH / 2, COLLECTOR_Y, GAME_WIDTH, 40, {
      isStatic: true,
      isSensor: true,
      label: 'collector',
    });
  }

  private createGates(): void {
    const picked = this.pickGates();
    const totalWidth = picked.length * GATE_WIDTH + (picked.length - 1) * (GATE_GAP - GATE_WIDTH);
    const startX = (GAME_WIDTH - totalWidth) / 2 + GATE_WIDTH / 2;

    picked.forEach((def, i) => {
      const offsetX = startX + i * GATE_GAP - GAME_WIDTH / 2;
      const x = GAME_WIDTH / 2 + offsetX;
      const rect = this.add.rectangle(x, GATE_ROW_Y, GATE_WIDTH, GATE_HEIGHT, def.color, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.5);
      const label = this.add.text(x, GATE_ROW_Y, def.label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const body = this.matter.add.rectangle(x, GATE_ROW_Y, GATE_WIDTH, GATE_HEIGHT, {
        isStatic: true,
        isSensor: true,
        label: `gate:${def.kind}:${i}`,
      });
      this.gates.push({ kind: def.kind, rect, label, body, groupOffsetX: offsetX });
    });

    const halfTotal = totalWidth / 2;
    this.gateGroupMinX = halfTotal + 10;
    this.gateGroupMaxX = GAME_WIDTH - halfTotal - 10;
  }

  private pickGates(): GateDef[] {
    const pool = [...ALL_GATES];
    const result: GateDef[] = [];
    const penalty = pool.splice(pool.findIndex(g => g.kind === 'penalty'), 1)[0];
    result.push(penalty);
    const positiveKinds: GateKind[] = ['x2', 'x3', 'x4'];
    const positivePool = pool.filter(g => positiveKinds.includes(g.kind));
    const positivePick = positivePool[Math.floor(Math.random() * positivePool.length)];
    result.push(positivePick);
    const remaining = pool.filter(g => g !== positivePick);
    Phaser.Utils.Array.Shuffle(remaining);
    result.push(remaining[0], remaining[1]);
    Phaser.Utils.Array.Shuffle(result);
    return result;
  }

  private createCup(): void {
    this.cup = this.add.rectangle(this.cupX, CUP_Y, CUP_WIDTH, CUP_HEIGHT, 0x8b5cf6, 1)
      .setStrokeStyle(2, 0xffffff, 0.7);
  }

  private createHud(): void {
    const style = { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#ffffff' };
    this.dropsText = this.add.text(20, 20, '', style);
    this.ballsText = this.add.text(GAME_WIDTH - 20, 20, '', style).setOrigin(1, 0);
  }

  private createRoundEndOverlay(): void {
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, 240, 0x000000, 0.75);
    const title = this.add.text(0, -40, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    const button = this.add.rectangle(0, 50, 220, 60, 0x8b5cf6).setStrokeStyle(2, 0xffffff, 0.6);
    const buttonText = this.add.text(0, 50, 'Tap to Restart', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerup', (_: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.restartRound();
    });

    this.roundEndContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [bg, title, button, buttonText]);
    this.roundEndContainer.setVisible(false);
    this.roundEndContainer.setData('title', title);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > GAME_HEIGHT - 200) return;
      this.cupX = Phaser.Math.Clamp(pointer.x, CUP_MIN_X, CUP_MAX_X);
      this.cup.setX(this.cupX);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > GAME_HEIGHT - 200) return;
      this.cupX = Phaser.Math.Clamp(pointer.x, CUP_MIN_X, CUP_MAX_X);
      this.cup.setX(this.cupX);
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.roundEndContainer.visible) return;
      if (pointer.y > GAME_HEIGHT - 200) return;
      this.startPour();
    });
  }

  private startPour(): void {
    if (this.pouring) return;
    if (this.dropsRemaining <= 0) return;
    this.pouring = true;
    this.dropsRemaining--;
    this.refreshHud();
    let fired = 0;
    const timer = this.time.addEvent({
      delay: POUR_INTERVAL_MS,
      repeat: POUR_BALL_COUNT - 1,
      callback: () => {
        this.spawnBall();
        fired++;
        if (fired >= POUR_BALL_COUNT) {
          this.pouring = false;
          timer.remove();
        }
      },
    });
  }

  private spawnBall(): void {
    const jitter = Phaser.Math.Between(-6, 6);
    const ball = this.matter.add.image(this.cupX + jitter, CUP_Y + CUP_HEIGHT / 2 + 4, this.ballTextureKey, undefined, {
      shape: { type: 'circle', radius: BALL_RADIUS },
      restitution: 0.2,
      friction: 0.05,
      density: 0.001,
    }) as BallSprite;
    ball.value = 1;
    ball.passed = new Set();
    ball.counted = false;
    ball.setVelocity(Phaser.Math.FloatBetween(-0.4, 0.4), 0.5);
    this.activeBalls.add(ball);
  }

  private setupCollisions(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const collectorPair = (a === this.collectorBody || b === this.collectorBody);
        if (collectorPair) {
          const otherBody = a === this.collectorBody ? b : a;
          const ball = otherBody.gameObject as BallSprite | null;
          if (ball && !ball.counted) {
            this.collectBall(ball);
          }
          continue;
        }
        const gate = this.gates.find(g => g.body === a || g.body === b);
        if (!gate) continue;
        const otherBody = gate.body === a ? b : a;
        const ball = otherBody.gameObject as BallSprite | null;
        if (!ball || !ball.passed) continue;
        if (ball.passed.has(gate.body)) continue;
        ball.passed.add(gate.body);
        this.applyGateEffect(ball, gate);
      }
    });
  }

  private applyGateEffect(ball: BallSprite, gate: Gate): void {
    const value = ball.value ?? 1;
    switch (gate.kind) {
      case 'x2':
        ball.value = value * 2;
        break;
      case 'x3':
        ball.value = value * 3;
        break;
      case 'x4':
        ball.value = value * 4;
        break;
      case 'penalty':
        ball.value = Math.max(0, Math.floor(value / 5));
        break;
      case 'trampoline':
        ball.setVelocityY(-12);
        break;
      case 'mystery': {
        const m = Phaser.Math.Between(1, 5);
        ball.value = value * m;
        break;
      }
    }
  }

  private collectBall(ball: BallSprite): void {
    ball.counted = true;
    const value = ball.value ?? 0;
    this.ballsThisRound += value;
    this.activeBalls.delete(ball);
    ball.destroy();
    this.refreshHud();
    this.maybeFinishRound();
  }

  private maybeFinishRound(): void {
    if (this.dropsRemaining === 0 && !this.pouring && this.activeBalls.size === 0) {
      this.showRoundEnd();
    }
  }

  private refreshHud(): void {
    this.dropsText.setText(`Drops: ${this.dropsRemaining}/${DROPS_PER_ROUND}`);
    this.ballsText.setText(`Balls: ${this.ballsThisRound}`);
  }

  private showRoundEnd(): void {
    const title = this.roundEndContainer.getData('title') as Phaser.GameObjects.Text;
    title.setText(`Round End\n${this.ballsThisRound} balls`);
    this.roundEndContainer.setVisible(true);
  }

  private restartRound(): void {
    this.activeBalls.forEach(b => b.destroy());
    this.activeBalls.clear();
    this.dropsRemaining = DROPS_PER_ROUND;
    this.ballsThisRound = 0;
    this.gateSpeed = GATE_INITIAL_SPEED;
    this.roundEndContainer.setVisible(false);
    this.refreshHud();
  }

  private scheduleSpeedUp(): void {
    this.time.addEvent({
      delay: GATE_SPEED_INTERVAL_MS,
      loop: true,
      callback: () => {
        this.gateSpeed = Math.min(GATE_SPEED_MAX, this.gateSpeed + GATE_SPEED_STEP);
      },
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.gateGroupX += this.gateDirection * this.gateSpeed * dt;
    if (this.gateGroupX > this.gateGroupMaxX - GAME_WIDTH / 2) {
      this.gateGroupX = this.gateGroupMaxX - GAME_WIDTH / 2;
      this.gateDirection = -1;
    } else if (this.gateGroupX < this.gateGroupMinX - GAME_WIDTH / 2) {
      this.gateGroupX = this.gateGroupMinX - GAME_WIDTH / 2;
      this.gateDirection = 1;
    }
    const groupCenter = GAME_WIDTH / 2 + this.gateGroupX;
    this.gates.forEach(g => {
      const x = groupCenter + g.groupOffsetX;
      g.rect.setX(x);
      g.label.setX(x);
      (this.matter.body as unknown as { setPosition: (body: MatterJS.BodyType, position: { x: number; y: number }) => void }).setPosition(g.body, { x, y: GATE_ROW_Y });
    });

    this.activeBalls.forEach(ball => {
      if (ball.y > GAME_HEIGHT + 50) {
        if (!ball.counted) this.collectBall(ball);
      }
    });
  }
}
