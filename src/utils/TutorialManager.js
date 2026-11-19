import { Storage } from './Storage.js';
import { AudioManager } from './AudioManager.js';

/**
 * Пошаговый интерактивный туториал для ROCK LAB с сохранением видимости сцены и приборов
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
   * Показывает лёгкую подсветку вокруг целевого элемента и карточку-подсказку,
   * не скрывая в темноте сам процесс испытания.
   */
  showSpotlight(scene, opts) {
    this.clear(scene);
    if (!this.isActive()) return;

    const { width } = scene.scale;
    const {
      hole = null,
      cardY = 210,
      badge = 'ОБУЧЕНИЕ · ИНСТРУКТАЖ',
      text = '',
      nextLabel = null,
      onNext = null
    } = opts;

    const group = scene.add.container(0, 0).setDepth(110);
    this.overlayGroup = group;

    // Лёгкая атмосферная вуаль (не блокирует клики и оставляет сцену хорошо читаемой)
    const softVeil = scene.add.graphics();
    softVeil.fillStyle(0x090d16, 0.24);
    softVeil.fillRect(0, 0, width, scene.scale.height);
    group.add(softVeil);

    if (hole) {
      const left = Math.max(8, hole.x - hole.w / 2);
      const top = Math.max(8, hole.y - hole.h / 2);
      const rw = Math.min(width - 16, hole.w);
      const rh = hole.h;

      const frame = scene.add.graphics();
      frame.lineStyle(3, 0xfacc15, 1);
      frame.strokeRoundedRect(left - 2, top - 2, rw + 4, rh + 4, 12);
      frame.lineStyle(1.5, 0x38bdf8, 0.75);
      frame.strokeRoundedRect(left - 6, top - 6, rw + 12, rh + 12, 15);
      group.add(frame);

      scene.tweens.add({
        targets: frame,
        alpha: 0.4,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
    }

    // Карточка инструктора
    const cardW = 412;
    const hasBtn = Boolean(nextLabel);
    const cardH = hasBtn ? 186 : 134;
    const cx = width / 2;

    const card = scene.add.graphics();
    card.fillStyle(0x141926, 0.96);
    card.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
    card.lineStyle(2.5, 0x38bdf8, 0.95);
    card.strokeRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);

    const badgeTxt = scene.add.text(cx - cardW / 2 + 14, cardY - cardH / 2 + 18, `👷 ${badge}`, {
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
      cardY + (hasBtn ? -12 : 8),
      text,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11.5px',
        fontWeight: '600',
        color: '#f8fafc',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: cardW - 28 }
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
