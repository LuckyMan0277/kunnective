import Phaser from 'phaser';

const BOARD_TOP = 200;
const PIN_ROWS = 8;
const PIN_COLS = 7;
const PIN_ROW_SPACING = 60;
const PIN_COL_SPACING = 70;
const PIN_RADIUS = 6;
const SLOT_Y = 880;
const SLOT_WIDTH = 70;
const SLOT_HEIGHT = 70;
const SLOT_VALUES = [10, 5, 3, 2, 3, 5, 10] as const;
const SLOT_COLORS = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0xfacc15, 0xf97316, 0xef4444] as const;
const CUP_RADIUS = 18;
const INITIAL_BALLS = 100;
const DROPS_PER_ROUND = 3;
const GAME_WIDTH = 540;
const INDICATOR_Y = 80;
const INDICATOR_MIN_X = 40;
const INDICATOR_MAX_X = GAME_WIDTH - 40;

type CupImage = Phaser.Physics.Matter.Image & { resolved?: boolean };

interface SlotData {
  multiplier: number;
  body: MatterJS.BodyType;
}

export class GameScene extends Phaser.Scene {
  private indicatorX = GAME_WIDTH / 2;
  private indicator!: Phaser.GameObjects.Triangle;
  private guideline!: Phaser.GameObjects.Graphics;

  private dropsRemaining = DROPS_PER_ROUND;
  private dropsResolved = 0;
  private ballsThisRound = 0;

  private dropsText!: Phaser.GameObjects.Text;
  private ballsText!: Phaser.GameObjects.Text;
  private roundEndContainer!: Phaser.GameObjects.Container;

  private slots: SlotData[] = [];
  private cupTextureKey = 'cupTexture';

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.createCupTexture();
    this.createWalls();
    this.createPins();
    this.createSlots();
    this.createIndicator();
    this.createHud();
    this.createRoundEndOverlay();
    this.setupInput();
    this.setupCollisions();
    this.refreshHud();
  }

  private createCupTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x8b5cf6, 1);
    g.fillCircle(CUP_RADIUS, CUP_RADIUS, CUP_RADIUS);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(CUP_RADIUS, CUP_RADIUS, CUP_RADIUS);
    g.generateTexture(this.cupTextureKey, CUP_RADIUS * 2, CUP_RADIUS * 2);
    g.destroy();
  }

  private createWalls(): void {
    // invisible side walls + ceiling so cups stay inside the play area
    const wallThickness = 40;
    const height = this.scale.height;
    const opts = { isStatic: true, restitution: 0.2, friction: 0.1 };
    this.matter.add.rectangle(-wallThickness / 2, height / 2, wallThickness, height, opts);
    this.matter.add.rectangle(GAME_WIDTH + wallThickness / 2, height / 2, wallThickness, height, opts);
    this.matter.add.rectangle(GAME_WIDTH / 2, -wallThickness / 2, GAME_WIDTH, wallThickness, opts);
  }

  private createPins(): void {
    for (let row = 0; row < PIN_ROWS; row++) {
      const offsetX = (row % 2) * (PIN_COL_SPACING / 2);
      const usableWidth = (PIN_COLS - 1) * PIN_COL_SPACING;
      const startX = (GAME_WIDTH - usableWidth) / 2;
      const y = BOARD_TOP + row * PIN_ROW_SPACING;
      for (let col = 0; col < PIN_COLS; col++) {
        const x = startX + col * PIN_COL_SPACING + offsetX;
        if (x < 20 || x > GAME_WIDTH - 20) continue;
        this.add.circle(x, y, PIN_RADIUS, 0xffffff);
        this.matter.add.circle(x, y, PIN_RADIUS, { isStatic: true, restitution: 0.6, friction: 0.05 });
      }
    }
  }

  private createSlots(): void {
    const totalWidth = SLOT_VALUES.length * SLOT_WIDTH;
    const startX = (GAME_WIDTH - totalWidth) / 2 + SLOT_WIDTH / 2;
    SLOT_VALUES.forEach((multiplier, i) => {
      const x = startX + i * SLOT_WIDTH;
      const color = SLOT_COLORS[i];
      this.add.rectangle(x, SLOT_Y, SLOT_WIDTH - 4, SLOT_HEIGHT, color, 0.85).setStrokeStyle(2, 0xffffff, 0.4);
      this.add.text(x, SLOT_Y, `x${multiplier}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const body = this.matter.add.rectangle(x, SLOT_Y, SLOT_WIDTH - 4, SLOT_HEIGHT, {
        isStatic: true,
        isSensor: true,
        label: `slot:${i}`,
      });
      this.slots.push({ multiplier, body });
    });
  }

  private createIndicator(): void {
    this.guideline = this.add.graphics();
    this.indicator = this.add.triangle(
      this.indicatorX,
      INDICATOR_Y,
      0, -10,
      10, 10,
      -10, 10,
      0xffffff,
    );
    this.drawGuideline();
  }

  private drawGuideline(): void {
    this.guideline.clear();
    this.guideline.lineStyle(1, 0xffffff, 0.25);
    const x = this.indicatorX;
    let y = INDICATOR_Y + 20;
    while (y < BOARD_TOP - 10) {
      this.guideline.lineBetween(x, y, x, y + 8);
      y += 16;
    }
  }

  private createHud(): void {
    const style = {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    };
    this.dropsText = this.add.text(20, 20, '', style);
    this.ballsText = this.add.text(GAME_WIDTH - 20, 20, '', style).setOrigin(1, 0);
  }

  private createRoundEndOverlay(): void {
    const bg = this.add.rectangle(GAME_WIDTH / 2, this.scale.height / 2, GAME_WIDTH, 240, 0x000000, 0.7);
    const title = this.add.text(0, -50, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const button = this.add.rectangle(0, 40, 200, 60, 0x8b5cf6).setStrokeStyle(2, 0xffffff, 0.6);
    const buttonText = this.add.text(0, 40, 'Tap to Restart', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerup', () => this.restartRound());

    this.roundEndContainer = this.add.container(GAME_WIDTH / 2, this.scale.height / 2, [bg, title, button, buttonText]);
    this.roundEndContainer.setVisible(false);
    this.roundEndContainer.setData('title', title);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updateIndicator(pointer.x);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.updateIndicator(pointer.x);
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > this.scale.height - 100) return;
      if (this.roundEndContainer.visible) return;
      this.dropCup();
    });
  }

  private updateIndicator(x: number): void {
    this.indicatorX = Phaser.Math.Clamp(x, INDICATOR_MIN_X, INDICATOR_MAX_X);
    this.indicator.setX(this.indicatorX);
    this.drawGuideline();
  }

  private dropCup(): void {
    if (this.dropsRemaining <= 0) return;
    this.dropsRemaining--;
    const cup = this.matter.add.image(this.indicatorX, INDICATOR_Y + 30, this.cupTextureKey, undefined, {
      shape: { type: 'circle', radius: CUP_RADIUS },
      restitution: 0.5,
      friction: 0.05,
      density: 0.002,
    }) as CupImage;
    cup.resolved = false;
    this.refreshHud();
  }

  private setupCollisions(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const slot = this.slots.find(s => s.body === pair.bodyA || s.body === pair.bodyB);
        if (!slot) continue;
        const otherBody = slot.body === pair.bodyA ? pair.bodyB : pair.bodyA;
        const cup = otherBody.gameObject as CupImage | null;
        if (!cup || cup.resolved) continue;
        cup.resolved = true;
        this.resolveCup(cup, slot.multiplier);
      }
    });
  }

  private resolveCup(cup: CupImage, multiplier: number): void {
    const finalBalls = INITIAL_BALLS * multiplier;
    this.ballsThisRound += finalBalls;
    this.spawnPopup(cup.x, cup.y - 20, `+${finalBalls}`);
    cup.destroy();
    this.dropsResolved++;
    this.refreshHud();
    if (this.dropsResolved >= DROPS_PER_ROUND) {
      this.showRoundEnd();
    }
  }

  private spawnPopup(x: number, y: number, text: string): void {
    const popup = this.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#fde047',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy(),
    });
  }

  private refreshHud(): void {
    this.dropsText.setText(`Drops: ${this.dropsRemaining}/${DROPS_PER_ROUND}`);
    this.ballsText.setText(`Balls: ${this.ballsThisRound}`);
  }

  private showRoundEnd(): void {
    const title = this.roundEndContainer.getData('title') as Phaser.GameObjects.Text;
    title.setText(`Round End\n${this.ballsThisRound} balls`);
    title.setAlign('center');
    this.roundEndContainer.setVisible(true);
  }

  private restartRound(): void {
    this.dropsRemaining = DROPS_PER_ROUND;
    this.dropsResolved = 0;
    this.ballsThisRound = 0;
    this.roundEndContainer.setVisible(false);
    this.refreshHud();
  }
}
