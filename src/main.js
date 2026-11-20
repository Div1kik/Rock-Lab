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

const getSafeAreaTopLogical = () => {
  if (typeof window === 'undefined' || !document?.documentElement) return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px';
  const px = parseFloat(raw) || 0;
  const cw = window.innerWidth || 480;
  const scale = 480 / Math.max(1, cw);
  return Math.round(Phaser.Math.Clamp(px * scale, 0, 56));
};

// Глобальное сглаживание шрифтов под HiDPI без искажения пропорций верстки
const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
const origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style = {}) {
  const nextStyle = { resolution: dpr, ...style };

  if (nextStyle.fontFamily && nextStyle.fontFamily.includes('JetBrains Mono')) {
    nextStyle.fontFamily = '"Rubik", -apple-system, BlinkMacSystemFont, sans-serif';
  }

  const txtObj = origTextFactory.call(this, x, y, text, nextStyle);
  if (typeof txtObj.setResolution === 'function') {
    txtObj.setResolution(dpr);
  }
  return txtObj;
};

const computeLogicalHeight = () => {
  const container = document.getElementById('game-container');
  const cw = container?.clientWidth || window.innerWidth || 480;
  const ch = container?.clientHeight || window.innerHeight || 800;
  const aspect = ch / Math.max(1, cw);
  return Math.round(Phaser.Math.Clamp(480 * aspect, 760, 1120));
};

const initGame = async () => {
  await PlatformSDK.init();
  window.__SAFE_TOP__ = getSafeAreaTopLogical();

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 480,
    height: computeLogicalHeight(),
    backgroundColor: '#14161b',
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

  const game = new Phaser.Game(config);

  window.addEventListener('resize', () => {
    window.__SAFE_TOP__ = getSafeAreaTopLogical();
    const newH = computeLogicalHeight();
    if (Math.abs(game.scale.height - newH) > 4) {
      game.scale.resize(480, newH);
    }
  });
};

initGame();
