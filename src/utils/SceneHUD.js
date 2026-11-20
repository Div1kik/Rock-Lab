import { Storage } from './Storage.js';
import { AudioManager } from './AudioManager.js';

export const SceneHUD = {
  attachTestControls(scene, { onBeforeExit = null } = {}) {
    const { width, height } = scene.scale;
    const btnY = 26;

    // Кнопка возврата в меню (слева вверху)
    const menuBtn = scene.add.text(14, btnY, '🏠 МЕНЮ', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#1e293b',
      padding: { x: 9, y: 6 }
    }).setOrigin(0, 0.5).setDepth(80).setInteractive({ useHandCursor: true });

    // Кнопка звука (справа вверху)
    const soundBtn = scene.add.text(width - 14, btnY, Storage.isSoundEnabled() ? '🔊' : '🔇', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      backgroundColor: '#1e293b',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0.5).setDepth(80).setInteractive({ useHandCursor: true });

    soundBtn.on('pointerdown', () => {
      const enabled = Storage.toggleSound();
      soundBtn.setText(enabled ? '🔊' : '🔇');
      if (enabled) AudioManager.playClick();
    });

    menuBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.openExitConfirm(scene, width, height, onBeforeExit);
    });

    return { menuBtn, soundBtn };
  },

  openExitConfirm(scene, width, height, onBeforeExit) {
    if (scene._exitModalOpen) return;
    scene._exitModalOpen = true;

    const modal = scene.add.container(0, 0).setDepth(120);
    const blocker = scene.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dim = scene.add.graphics();
    dim.fillStyle(0x090d16, 0.88);
    dim.fillRect(0, 0, width, height);

    const cardW = 340;
    const cardH = 210;
    const cx = width / 2;
    const cy = height / 2;

    const panel = this.addPanel(scene, cx - cardW / 2, cy - cardH / 2, cardW, cardH);

    const title = scene.add.text(cx, cy - 64, 'ПРЕРВАТЬ ИСПЫТАНИЕ?', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    const desc = scene.add.text(
      cx,
      cy - 16,
      'Текущий прогресс образца не сохранится,\nно контракт останется активным в лаборатории.',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 4
      }
    ).setOrigin(0.5);

    const stayBtn = scene.add.text(cx - 78, cy + 56, 'ПРОДОЛЖИТЬ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#4ade80',
      padding: { x: 14, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const leaveBtn = scene.add.text(cx + 82, cy + 56, 'В МЕНЮ →', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#dc2626',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    stayBtn.on('pointerdown', () => {
      AudioManager.playClick();
      scene._exitModalOpen = false;
      modal.destroy();
    });

    leaveBtn.on('pointerdown', () => {
      AudioManager.playClick();
      AudioManager.stopPressHum();
      scene._exitModalOpen = false;
      if (typeof onBeforeExit === 'function') onBeforeExit();
      modal.destroy();
      scene.scene.start('MenuScene');
    });

    modal.add([blocker, dim, panel, title, desc, stayBtn, leaveBtn]);
  },

  addPanel(scene, x, y, w, h) {
    const g = scene.add.graphics();
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(x, y, w, h, 14);
    g.lineStyle(2.5, 0xfacc15, 0.95);
    g.strokeRoundedRect(x, y, w, h, 14);
    return g;
  }
};
