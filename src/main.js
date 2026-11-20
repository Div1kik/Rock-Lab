import { PlatformSDK } from './utils/PlatformSDK.js';
import { AudioManager } from './utils/AudioManager.js';
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

const showExitToast = (scene) => {
  if (!scene || scene._exitToastActive) return;
  scene._exitToastActive = true;
  const { width, height } = scene.scale;
  const toast = scene.add.text(width / 2, height - 165, 'Нажмите «Назад» ещё раз для выхода', {
    fontFamily: '"Rubik", sans-serif',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fef3c7',
    backgroundColor: '#1e293bee',
    padding: { x: 14, y: 8 }
  }).setOrigin(0.5).setDepth(200);

  scene.time.delayedCall(1800, () => {
    if (toast && toast.active) toast.destroy();
    scene._exitToastActive = false;
  });
};

const setupAndroidBackNavigation = (game) => {
  let lastBackPressAt = 0;

  const handleBackAction = () => {
    const activeScenes = game.scene.getScenes(true);
    const topScene = activeScenes[activeScenes.length - 1];
    if (!topScene) return false;

    const key = topScene.scene.key;

    // 1. Второстепенные экраны -> возврат в главное меню
    if (key === 'ContractsScene' || key === 'UpgradeScene' || key === 'ReportScene') {
      AudioManager.playClick();
      topScene.scene.start('MenuScene');
      return true;
    }

    if (key === 'GuideScene') {
      AudioManager.playClick();
      topScene.scene.start(topScene.returnScene || 'MenuScene');
      return true;
    }

    // 2. Сцены испытаний -> безопасный выход в меню (с остановкой гула пресса)
    if (key === 'UnpackScene' || key === 'PrepScene' || key === 'TestScene') {
      AudioManager.stopPressHum();
      AudioManager.playClick();
      topScene.scene.start('MenuScene');
      return true;
    }

    // 3. Главное меню
    if (key === 'MenuScene') {
      // Если открыто модальное окно — перезапускаем сцену, закрывая его
      if (topScene.showcaseModalOpen) {
        AudioManager.playClick();
        topScene.scene.restart({ visitProfile: topScene.visitProfile });
        return true;
      }

      // Если в гостях у коллеги — возвращаемся в свою лабораторию
      if (topScene.isVisiting && topScene.isVisiting()) {
        AudioManager.playClick();
        topScene.scene.start('MenuScene', { visitProfile: null });
        return true;
      }

      // Двойное нажатие «Назад» для выхода из игры
      const now = Date.now();
      if (now - lastBackPressAt < 2000) {
        return false; // Разрешаем выход
      }
      lastBackPressAt = now;
      showExitToast(topScene);
      return true;
    }

    return false;
  };

  // Перехват аппаратной кнопки / жеста «Назад» в Capacitor APK
  const capApp = window.Capacitor?.Plugins?.App;
  if (capApp && typeof capApp.addListener === 'function') {
    capApp.addListener('backButton', () => {
      const handled = handleBackAction();
      if (!handled && typeof capApp.exitApp === 'function') {
        capApp.exitApp();
      }
    });
  }

  // Перехват кнопки «Назад» в мобильном браузере / PWA
  try {
    window.history.pushState({ rocklab: 1 }, '');
    window.addEventListener('popstate', () => {
      const handled = handleBackAction();
      if (handled) {
        window.history.pushState({ rocklab: 1 }, '');
      }
    });
  } catch {}
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
  setupAndroidBackNavigation(game);

  window.addEventListener('resize', () => {
    window.__SAFE_TOP__ = getSafeAreaTopLogical();
    const newH = computeLogicalHeight();
    if (Math.abs(game.scale.height - newH) > 4) {
      game.scale.resize(480, newH);
    }
  });
};

initGame();
