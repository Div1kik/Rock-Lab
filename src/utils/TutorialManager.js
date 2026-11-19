import { Storage } from './Storage.js';
import { AudioManager } from './AudioManager.js';

/**
 * Пошаговый интерактивный Spotlight-туториал для ROCK LAB
 */
class TutorialController {
  constructor() {
    this.overlayGroup = null;
  }

  isActive() {
    return !Storage.isTutorialCompleted();
  }

  getStep() {
    return Storage.getTutorialStep();
  }

  advanceTo(stepIndex) {
    Storage.setTutorialStep(stepIndex);
  }

  complete(scene = null) {
    this.clear(scene);
    Storage.completeTutorial();
  }

  restart(scene) {
    Storage.resetTutorial();
    if (scene && scene.scene) {
      scene.scene.restart();
    }
  }

  clear(scene) {
    if (this.overlayGroup) {
      this.overlayGroup.destroy(true);
      this.overlayGroup = null;
    }
    if (scene && scene._tutBlocker) {
      scene._tutBlocker.destroy();
      scene._tutBlocker = null;
    }
  }

  /**
   * Показывает затемнение с вырезом (Spotlight) вокруг нужного элемента и карточку-подсказку.
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {object|null} opts.hole - { x, y, w, h } центр и размеры подсвечиваемой области (сквозь неё проходят клики!)
   * @param {number} opts.cardY - Y-координата карточки с текстом
   * @param {string} opts.badge - Заголовок шага (напр. "ШАГ 1/8 · ЗАКАЗЫ")
   * @param {string} opts.text - Текст объяснения
   * @param {string|null} opts.nextLabel - Если задано, рисует кнопку "ДАЛЕЕ →" (для информационных шагов)
   * @param {Function|null} opts.onNext - Колбэк при нажатии "ДАЛЕЕ →"
   * @param {boolean} opts.blockOutside - Блокировать ли нажатия вне подсвеченного окна (по умолчанию true)
   */
  showSpotlight(scene, opts) {
    this.clear(scene);
    if (!this.isActive()) return;

    const { width, height } = scene.scale;
    const {
      hole = null,
      cardY = 210,
      badge = 'ОБУЧЕНИЕ · ИНСТРУКТАЖ',
      text = '',
      nextLabel = null,
      onNext = null,
      blockOutside = true
    } = opts;

    const group = scene.add.container(0, 0).setDepth(110);
    this.overlayGroup = group;

    const dimG = scene.add.graphics();
    dimG.fillStyle(0x060912, 0.78);

    if (hole) {
      const left = Math.max(0, hole.x - hole.w / 2);
      const right = Math.min(width, hole.x + hole.w / 2);
      const top = Math.max(0, hole.y - hole.h / 2);
      const bottom = Math.min(height, hole.y + hole.h / 2);

      // 4 прямоугольника вокруг подсвеченной зоны, чтобы клики свободно проходили сквозь "дырку"
      if (top > 0) dimG.fillRect(0, 0, width, top);
      if (bottom < height) dimG.fillRect(0, bottom, width, height - bottom);
      if (left > 0) dimG.fillRect(0, top, left, bottom - top);
      if (right < width) dimG.fillRect(right, top, width - right, bottom - top);

      // Блокеры по краям (не перекрывают сам hole!)
      if (blockOutside) {
        if (top > 0) {
          group.add(scene.add.zone(width / 2, top / 2, width, top).setInteractive());
        }
        if (bottom < height) {
          group.add(scene.add.zone(width / 2, bottom + (height - bottom) / 2, width, height - bottom).setInteractive());
        }
        if (left > 0) {
          group.add(scene.add.zone(left / 2, top + (bottom - top) / 2, left, bottom - top).setInteractive());
        }
        if (right < width) {
          group.add(scene.add.zone(right + (width - right) / 2, top + (bottom - top) / 2, width - right, bottom - top).setInteractive());
        }
      }

      // Пульсирующая золотая рамка вокруг целевого элемента
      const frame = scene.add.graphics();
      frame.lineStyle(3, 0xfacc15, 1);
      frame.strokeRoundedRect(left - 2, top - 2, right - left + 4, bottom - top + 4, 12);
      group.add(frame);

      scene.tweens.add({
        targets: frame,
        alpha: 0.35,
        duration: 550,
        yoyo: true,
        repeat: -1
      });
    } else {
      dimG.fillRect(0, 0, width, height);
      if (blockOutside) {
        group.add(scene.add.zone(width / 2, height / 2, width, height).setInteractive());
      }
    }

    group.add(dimG);

    // Карточка инструктора
    const cardW = 388;
    const hasBtn = Boolean(nextLabel);
    const cardH = hasBtn ? 168 : 132;
    const cx = width / 2;

    const card = scene.add.graphics();
    card.fillStyle(0x141926, 0.98);
    card.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
    card.lineStyle(2.5, 0x38bdf8, 1);
    card.strokeRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);

    const badgeTxt = scene.add.text(cx - cardW / 2 + 16, cardY - cardH / 2 + 18, `👷 ${badge}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0, 0.5);

    const skipBtn = scene.add.text(cx + cardW / 2 - 14, cardY - cardH / 2 + 18, 'Пропустить ✕', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '10px',
      fontWeight: '600',
      color: '#94a3b8'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.complete(scene);
    });

    const bodyTxt = scene.add.text(
      cx,
      cardY + (hasBtn ? -8 : 10),
      text,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '600',
        color: '#f8fafc',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: cardW - 32 }
      }
    ).setOrigin(0.5);

    group.add([card, badgeTxt, skipBtn, bodyTxt]);

    if (hasBtn) {
      const nextBtn = scene.add.text(cx, cardY + cardH / 2 - 24, nextLabel, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#0f172a',
        backgroundColor: '#facc15',
        padding: { x: 18, y: 7 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      nextBtn.on('pointerdown', () => {
        AudioManager.playClick();
        if (typeof onNext === 'function') {
          onNext();
        } else {
          this.clear(scene);
        }
      });

      group.add(nextBtn);
    }
  }
}

export const TutorialManager = new TutorialController();
