import { PlatformSDK } from './utils/PlatformSDK.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { ContractsScene } from './scenes/ContractsScene.js';
import { UnpackScene } from './scenes/UnpackScene.js';
import { PrepScene } from './scenes/PrepScene.js';
import { TestScene } from './scenes/TestScene.js';
import { ReportScene } from './scenes/ReportScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';
import { GuideScene } from './scenes/GuideScene.js';

// Глобальное повышение чёткости всех шрифтов под HiDPI / Retina экраны смартфонов
const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
const origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style = {}) {
  const mergedStyle = { resolution: dpr, ...style };
  const txtObj = origTextFactory.call(this, x, y, text, mergedStyle);
  if (typeof txtObj.setResolution === 'function') {
    txtObj.setResolution(dpr);
  }
  return txtObj;
};

const initGame = async () => {
  await PlatformSDK.init();

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 480,
    height: 800,
    backgroundColor: '#161412',
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
      BootScene,
      MenuScene,
      ContractsScene,
      UnpackScene,
      PrepScene,
      TestScene,
      ReportScene,
      UpgradeScene,
      GuideScene
    ]
  };

  new Phaser.Game(config);
};

initGame();
