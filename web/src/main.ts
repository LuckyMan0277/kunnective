import Phaser from 'phaser';
import { EditorScene } from './scenes/EditorScene';
import { DropScene } from './scenes/DropScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b1220',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 400,
    height: 800,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: {
        x: 0,
        y: 1.2,
      },
      debug: false,
    },
  },
  scene: [EditorScene, DropScene],
};

new Phaser.Game(config);
