import Phaser from 'phaser';
import type { GeometryEntry } from './types';

export class GeometryBuilder {
  static build(scene: Phaser.Scene, entries: GeometryEntry[]): void {
    for (const e of entries) {
      if (e.type === 'rect') {
        const w = e.width ?? 20;
        const h = e.height ?? 20;
        scene.add.rectangle(e.x, e.y, w, h, 0x334155).setStrokeStyle(1, 0x475569, 1);
        scene.matter.add.rectangle(e.x, e.y, w, h, { isStatic: true, friction: 0.1, restitution: 0.2 });
      } else if (e.type === 'ramp') {
        const length = e.length ?? 100;
        const thickness = e.thickness ?? 10;
        const angleDeg = e.angle ?? 0;
        const angleRad = Phaser.Math.DegToRad(angleDeg);
        const rect = scene.add.rectangle(e.x, e.y, length, thickness, 0x475569).setStrokeStyle(1, 0x64748b, 1);
        rect.setRotation(angleRad);
        scene.matter.add.rectangle(e.x, e.y, length, thickness, {
          isStatic: true,
          angle: angleRad,
          friction: 0,
          frictionStatic: 0,
          restitution: 0.2,
        });
      }
    }
  }
}
