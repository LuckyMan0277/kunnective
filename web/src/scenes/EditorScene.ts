import Phaser from 'phaser';
import type {
  LevelConfig,
  GeometryEntry,
  MultiplierGate,
  DeleteGate,
  BouncePad,
  SpawnConfig,
  Collector,
} from '../drop/types';
import { testLevel } from '../drop/testLevel';
import { exportLevelAsTs } from '../editor/exportLevel';

type ToolKind = 'select' | 'rect' | 'ramp' | 'multiplier' | 'delete' | 'bounce';

interface EditorEntity {
  id: string;
  kind: 'rect' | 'ramp' | 'multiplier' | 'delete' | 'bounce' | 'spawn' | 'collector';
  x: number;
  y: number;
  width?: number;
  height?: number;
  length?: number;
  thickness?: number;
  angle?: number;
  multiplier?: number;
  moving?: boolean;
  minX?: number;
  maxX?: number;
  speed?: number;
  remaining?: number;
  bounceVy?: number;
  bounceVx?: number;
  spreadX?: number;
  intervalMs?: number;
}

const TOOL_COLORS: Record<string, number> = {
  rect: 0x9ca3af,
  ramp: 0x9ca3af,
  multiplier: 0x9ca3af,
  delete: 0xef4444,
  bounce: 0x3b82f6,
  spawn: 0xfbbf24,
  collector: 0xfbbf24,
};

const GRID_COLS = 5;
const GRID_ROWS = 7;
const GRID_CELL_W = 400 / GRID_COLS;
const GRID_CELL_H = 800 / GRID_ROWS;

export interface EditorSceneInit {
  level?: LevelConfig;
}

export class EditorScene extends Phaser.Scene {
  private entities: EditorEntity[] = [];
  private spawn: SpawnConfig = { ...testLevel.spawn };
  private collector: Collector = { ...testLevel.collector };
  private inputBalls = testLevel.inputBalls;
  private maxPhysicalBalls = testLevel.maxPhysicalBalls;

  private currentTool: ToolKind = 'select';
  private selectedId: string | null = null;
  private entityGameObjects: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  private spawnObj?: Phaser.GameObjects.Arc;
  private collectorObj?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('EditorScene');
  }

  init(data: EditorSceneInit): void {
    const src = data?.level ?? testLevel;
    this.spawn = { ...src.spawn };
    this.collector = { ...src.collector };
    this.inputBalls = src.inputBalls;
    this.maxPhysicalBalls = src.maxPhysicalBalls;
    this.entities = this.fromLevelConfig(src);
  }

  create(): void {
    const container = document.getElementById('editor-overlay');
    if (container) container.style.display = 'block';

    this.add.rectangle(200, 400, 400, 800, 0x1f2937, 0.9);

    this.drawGrid();
    this.renderEntities();
    this.buildOverlay();
    this.setupInput();

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      const c = document.getElementById('editor-overlay');
      if (c) {
        c.innerHTML = '';
        c.style.display = 'none';
      }
    });
  }

  private drawGrid(): void {
    const g = this.add.graphics();
    g.lineStyle(1, 0x64748b, 0.25);
    for (let c = 0; c <= GRID_COLS; c++) {
      g.lineBetween(c * GRID_CELL_W, 0, c * GRID_CELL_W, 800);
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      g.lineBetween(0, r * GRID_CELL_H, 400, r * GRID_CELL_H);
    }
    g.setDepth(-10);
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const col = Phaser.Math.Clamp(
      Math.round((x - GRID_CELL_W / 2) / GRID_CELL_W),
      0,
      GRID_COLS - 1
    );
    const row = Phaser.Math.Clamp(
      Math.round((y - GRID_CELL_H / 2) / GRID_CELL_H),
      0,
      GRID_ROWS - 1
    );
    return {
      x: col * GRID_CELL_W + GRID_CELL_W / 2,
      y: row * GRID_CELL_H + GRID_CELL_H / 2,
    };
  }

  private fromLevelConfig(level: LevelConfig): EditorEntity[] {
    const entities: EditorEntity[] = [];

    level.geometry.forEach((g) => {
      entities.push({
        id: g.id,
        kind: g.type,
        x: g.x,
        y: g.y,
        width: g.width,
        height: g.height,
        length: g.length,
        thickness: g.thickness,
        angle: g.angle,
      });
    });

    level.gates.forEach((g) => {
      entities.push({
        id: g.id,
        kind: 'multiplier',
        x: g.x,
        y: g.y,
        width: g.width,
        multiplier: g.multiplier,
        moving: g.moving,
        minX: g.minX,
        maxX: g.maxX,
        speed: g.speed,
      });
    });

    level.deleteGates.forEach((d) => {
      entities.push({
        id: d.id,
        kind: 'delete',
        x: d.x,
        y: d.y,
        width: d.width,
        remaining: d.remaining,
      });
    });

    level.pads.forEach((p) => {
      entities.push({
        id: p.id,
        kind: 'bounce',
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        bounceVy: p.bounceVy,
        bounceVx: p.bounceVx,
      });
    });

    return entities;
  }

  private toLevelConfig(): LevelConfig {
    const geometry: GeometryEntry[] = [];
    const gates: MultiplierGate[] = [];
    const deleteGates: DeleteGate[] = [];
    const pads: BouncePad[] = [];

    this.entities.forEach((e) => {
      if (e.kind === 'rect' || e.kind === 'ramp') {
        geometry.push({
          id: e.id,
          type: e.kind,
          x: e.x,
          y: e.y,
          width: e.width!,
          height: e.height,
          length: e.length,
          thickness: e.thickness,
          angle: e.angle,
        });
      } else if (e.kind === 'multiplier') {
        gates.push({
          id: e.id,
          type: 'multiplier',
          x: e.x,
          y: e.y,
          width: e.width!,
          multiplier: e.multiplier!,
          moving: e.moving,
          minX: e.minX,
          maxX: e.maxX,
          speed: e.speed,
        });
      } else if (e.kind === 'delete') {
        deleteGates.push({
          id: e.id,
          type: 'delete',
          x: e.x,
          y: e.y,
          width: e.width!,
          remaining: e.remaining!,
        });
      } else if (e.kind === 'bounce') {
        pads.push({
          id: e.id,
          type: 'bounce',
          x: e.x,
          y: e.y,
          width: e.width!,
          height: e.height!,
          bounceVy: e.bounceVy!,
          bounceVx: e.bounceVx ?? 0,
        });
      }
    });

    return {
      inputBalls: this.inputBalls,
      maxPhysicalBalls: this.maxPhysicalBalls,
      spawn: this.spawn,
      geometry,
      gates,
      deleteGates,
      pads,
      collector: this.collector,
    };
  }

  private getEntity(id: string): EditorEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  private nextEntityId(kind: string): string {
    return `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private renderEntities(): void {
    this.entityGameObjects.forEach((obj) => obj.destroy());
    this.entityGameObjects.clear();
    this.spawnObj?.destroy();
    this.spawnObj = undefined;
    this.collectorObj?.destroy();
    this.collectorObj = undefined;

    this.spawnObj = this.add
      .circle(this.spawn.x, this.spawn.y, 8, TOOL_COLORS.spawn)
      .setInteractive({ draggable: this.currentTool === 'select' });
    this.spawnObj.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const snapped = this.snapToGrid(dragX, dragY);
        this.spawn.x = snapped.x;
        this.spawn.y = snapped.y;
        this.spawnObj!.setPosition(snapped.x, snapped.y);
      }
    );

    this.collectorObj = this.add
      .rectangle(
        this.collector.x,
        this.collector.y,
        this.collector.width,
        this.collector.height
      )
      .setFillStyle(TOOL_COLORS.collector, 0.3)
      .setStrokeStyle(1, TOOL_COLORS.collector, 0.7)
      .setInteractive({ draggable: this.currentTool === 'select' });
    this.collectorObj.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const snapped = this.snapToGrid(dragX, dragY);
        this.collector.x = snapped.x;
        this.collector.y = snapped.y;
        this.collectorObj!.setPosition(snapped.x, snapped.y);
      }
    );

    this.entities.forEach((e) => {
      let gameObj: Phaser.GameObjects.Rectangle;

      if (e.kind === 'rect' || e.kind === 'ramp' || e.kind === 'delete' || e.kind === 'bounce') {
        const w = e.width || 80;
        const h =
          e.height ||
          (e.kind === 'ramp' ? e.thickness || 10 : e.kind === 'delete' ? 50 : 16);
        gameObj = this.add
          .rectangle(e.x, e.y, w, h)
          .setFillStyle(
            e.kind === 'delete'
              ? TOOL_COLORS.delete
              : e.kind === 'bounce'
                ? TOOL_COLORS.bounce
                : TOOL_COLORS[e.kind]
          )
          .setStrokeStyle(e.id === this.selectedId ? 2 : 0, 0xffffff, 1);

        if (e.kind === 'ramp' && e.angle) {
          gameObj.setRotation((e.angle * Math.PI) / 180);
        }
      } else {
        gameObj = this.add
          .rectangle(e.x, e.y, 16, 16)
          .setFillStyle(TOOL_COLORS[e.kind])
          .setStrokeStyle(e.id === this.selectedId ? 2 : 0, 0xffffff, 1);
      }

      gameObj.setInteractive({ draggable: this.currentTool === 'select' });

      gameObj.on('pointerdown', () => {
        if (this.currentTool === 'select') {
          this.selectEntity(e.id);
        }
      });

      gameObj.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const snapped = this.snapToGrid(dragX, dragY);
        e.x = snapped.x;
        e.y = snapped.y;
        gameObj.setPosition(snapped.x, snapped.y);
      });

      this.entityGameObjects.set(e.id, gameObj);
    });
  }

  private selectEntity(id: string): void {
    this.selectedId = id;
    this.updatePropertiesPanel();
    this.renderEntities();
  }

  private deleteSelectedEntity(): void {
    if (!this.selectedId) return;
    this.entities = this.entities.filter((e) => e.id !== this.selectedId);
    this.selectedId = null;
    this.renderEntities();
    this.updatePropertiesPanel();
  }

  private setTool(tool: ToolKind): void {
    this.currentTool = tool;
    this.entityGameObjects.forEach((obj) => {
      if (obj.input) obj.input.draggable = tool === 'select';
    });
    if (this.spawnObj?.input) this.spawnObj.input.draggable = tool === 'select';
    if (this.collectorObj?.input) this.collectorObj.input.draggable = tool === 'select';
    this.updateToolButtons();
  }

  private placeNewEntity(worldX: number, worldY: number): void {
    if (
      (this.spawnObj && this.spawnObj.getBounds().contains(worldX, worldY)) ||
      (this.collectorObj && this.collectorObj.getBounds().contains(worldX, worldY))
    ) {
      return;
    }

    const snapped = this.snapToGrid(worldX, worldY);
    const newEntity: EditorEntity = {
      id: this.nextEntityId(this.currentTool),
      kind: this.currentTool as Exclude<ToolKind, 'select'>,
      x: snapped.x,
      y: snapped.y,
    };

    switch (this.currentTool) {
      case 'rect':
        newEntity.width = 80;
        newEntity.height = 16;
        break;
      case 'ramp':
        newEntity.length = 100;
        newEntity.thickness = 10;
        newEntity.angle = 20;
        break;
      case 'multiplier':
        newEntity.width = 90;
        newEntity.multiplier = 2;
        newEntity.moving = false;
        break;
      case 'delete':
        newEntity.width = 80;
        newEntity.remaining = 5;
        break;
      case 'bounce':
        newEntity.width = 100;
        newEntity.height = 16;
        newEntity.bounceVy = -28;
        newEntity.bounceVx = 0;
        break;
    }

    this.entities.push(newEntity);
    this.selectedId = newEntity.id;
    this.currentTool = 'select';
    this.renderEntities();
    this.updatePropertiesPanel();
    this.updateToolButtons();
  }

  private setupInput(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.currentTool === 'select') return;
      this.placeNewEntity(p.worldX, p.worldY);
    });

    this.input.keyboard?.on('keydown-DELETE', () => {
      this.deleteSelectedEntity();
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.selectedId = null;
      this.renderEntities();
      this.updatePropertiesPanel();
    });
  }

  private buildOverlay(): void {
    const container = document.getElementById('editor-overlay');
    if (!container) return;

    container.innerHTML = `
      <div class="ed-section">
        <h3>Tools</h3>
        <div class="ed-tools">
          <button data-tool="select">Select</button>
          <button data-tool="rect">Wall</button>
          <button data-tool="ramp">Ramp</button>
          <button data-tool="multiplier">Multiplier</button>
          <button data-tool="delete">Delete</button>
          <button data-tool="bounce">Bounce</button>
        </div>
      </div>
      <div class="ed-section">
        <h3>Properties</h3>
        <div id="ed-props">No selection</div>
      </div>
      <div class="ed-section">
        <h3>Actions</h3>
        <button id="ed-delete">Delete (Del)</button>
        <button id="ed-play">Play</button>
        <button id="ed-export">Export</button>
      </div>
      <textarea id="ed-export-out" rows="10"></textarea>
    `;

    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool as ToolKind;
        this.setTool(tool);
      });
    });

    document.getElementById('ed-delete')?.addEventListener('click', () => {
      this.deleteSelectedEntity();
    });

    document.getElementById('ed-play')?.addEventListener('click', () => {
      const level = this.toLevelConfig();
      const c = document.getElementById('editor-overlay');
      if (c) c.style.display = 'none';
      this.scene.start('DropScene', { level });
    });

    document.getElementById('ed-export')?.addEventListener('click', () => {
      const level = this.toLevelConfig();
      const code = exportLevelAsTs(level);
      const textarea = document.getElementById('ed-export-out') as HTMLTextAreaElement;
      if (textarea) textarea.value = code;
    });

    this.updateToolButtons();
    this.updatePropertiesPanel();
  }

  private updateToolButtons(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
      if (btn.dataset.tool === this.currentTool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private updatePropertiesPanel(): void {
    const propsDiv = document.getElementById('ed-props');
    if (!propsDiv) return;

    if (!this.selectedId) {
      propsDiv.innerHTML = 'No selection';
      return;
    }

    const entity = this.getEntity(this.selectedId);
    if (!entity) {
      propsDiv.innerHTML = 'No selection';
      return;
    }

    const handleChange = (
      prop: string,
      raw: string,
      fieldType: 'number' | 'string' | 'bool'
    ) => {
      let value: unknown = raw;
      if (fieldType === 'number') value = Number(raw);
      if (fieldType === 'bool') value = raw === 'true';
      (entity as unknown as Record<string, unknown>)[prop] = value;
      this.renderEntities();
      this.updatePropertiesPanel();
    };

    let html = `
      <div class="ed-row">
        <label>ID:</label>
        <span>${entity.id}</span>
      </div>
      <div class="ed-row">
        <label>Kind:</label>
        <span>${entity.kind}</span>
      </div>
      <div class="ed-row">
        <label>X:</label>
        <input type="number" data-prop="x" value="${entity.x}" />
      </div>
      <div class="ed-row">
        <label>Y:</label>
        <input type="number" data-prop="y" value="${entity.y}" />
      </div>
    `;

    if (entity.width !== undefined) {
      html += `
        <div class="ed-row">
          <label>Width:</label>
          <input type="number" data-prop="width" value="${entity.width}" />
        </div>
      `;
    }

    if (entity.height !== undefined) {
      html += `
        <div class="ed-row">
          <label>Height:</label>
          <input type="number" data-prop="height" value="${entity.height}" />
        </div>
      `;
    }

    if (entity.length !== undefined) {
      html += `
        <div class="ed-row">
          <label>Length:</label>
          <input type="number" data-prop="length" value="${entity.length}" />
        </div>
      `;
    }

    if (entity.thickness !== undefined) {
      html += `
        <div class="ed-row">
          <label>Thickness:</label>
          <input type="number" data-prop="thickness" value="${entity.thickness}" />
        </div>
      `;
    }

    if (entity.angle !== undefined) {
      html += `
        <div class="ed-row">
          <label>Angle:</label>
          <input type="number" data-prop="angle" value="${entity.angle}" />
        </div>
      `;
    }

    if (entity.multiplier !== undefined) {
      html += `
        <div class="ed-row">
          <label>Multiplier:</label>
          <select data-prop="multiplier">
            <option value="2" ${entity.multiplier === 2 ? 'selected' : ''}>2x</option>
            <option value="3" ${entity.multiplier === 3 ? 'selected' : ''}>3x</option>
            <option value="4" ${entity.multiplier === 4 ? 'selected' : ''}>4x</option>
          </select>
        </div>
      `;
    }

    if (entity.moving !== undefined) {
      html += `
        <div class="ed-row">
          <label>Moving:</label>
          <input type="checkbox" data-prop="moving" ${entity.moving ? 'checked' : ''} />
        </div>
      `;
      if (entity.moving) {
        html += `
          <div class="ed-row">
            <label>MinX:</label>
            <input type="number" data-prop="minX" value="${entity.minX ?? 0}" />
          </div>
          <div class="ed-row">
            <label>MaxX:</label>
            <input type="number" data-prop="maxX" value="${entity.maxX ?? 400}" />
          </div>
          <div class="ed-row">
            <label>Speed:</label>
            <input type="number" data-prop="speed" value="${entity.speed ?? 50}" />
          </div>
        `;
      }
    }

    if (entity.remaining !== undefined) {
      html += `
        <div class="ed-row">
          <label>Remaining:</label>
          <input type="number" data-prop="remaining" value="${entity.remaining}" />
        </div>
      `;
    }

    if (entity.bounceVy !== undefined) {
      html += `
        <div class="ed-row">
          <label>Bounce Vy:</label>
          <input type="number" data-prop="bounceVy" value="${entity.bounceVy}" />
        </div>
      `;
    }

    if (entity.bounceVx !== undefined) {
      html += `
        <div class="ed-row">
          <label>Bounce Vx:</label>
          <input type="number" data-prop="bounceVx" value="${entity.bounceVx}" />
        </div>
      `;
    }

    propsDiv.innerHTML = html;

    propsDiv.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-prop]').forEach((el) => {
      el.addEventListener('change', () => {
        const prop = el.dataset.prop as string;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          handleChange(prop, (el as HTMLInputElement).checked ? 'true' : 'false', 'bool');
        } else if (el.tagName === 'SELECT') {
          handleChange(prop, el.value, 'number');
        } else {
          handleChange(prop, el.value, 'number');
        }
      });
    });
  }
}
