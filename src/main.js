import { PlatformSDK } from './utils/PlatformSDK.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';

const initGame = async () => {
  await PlatformSDK.init();

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 480,
    height: 800,
    backgroundColor: '#161412',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene]
  };

  new Phaser.Game(config);
};

initGame();
