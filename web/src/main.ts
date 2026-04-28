import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b1220',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 540,
    height: 960,
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
  scene: [GameScene],
};

new Phaser.Game(config);
