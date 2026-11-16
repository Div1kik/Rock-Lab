import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';

const LAB_TIERS = {
  1: { name: 'Гаражная геолаборатория', wall: 0x292524, table: 0x57534e, accent: 0xd97706 },
  2: { name: 'Участковый пост контроля', wall: 0x262b30, table: 0x475569, accent: 0xeab308 },
  3: { name: 'Инженерный центр грунтов', wall: 0x1e293b, table: 0x64748b, accent: 0x38bdf8 },
  4: { name: 'Институт механики скал', wall: 0x172554, table: 0x475569, accent: 0x34d399 },
  5: { name: 'Геотех-комплекс «Атлант»', wall: 0x0f172a, table: 0x334155, accent: 0xfacc15 }
};

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    const labLvl = Storage.getLabLevel();
    const tier = LAB_TIERS[labLvl] || LAB_TIERS[1];

    // 1. Фон лаборатории (уютная пиксель-комната)
    this.drawLabRoom(width, height, tier, labLvl);

    // 2. Верхняя панель статуса (Баланс, Репутация, Звук)
    this.createTopBar(width, tier);

    // 3. Заголовок и плашка уровня лаборатории
    this.add.text(width / 2, 114, 'ROCK LAB', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '40px',
      fontWeight: '700',
      color: '#fef3c7',
      stroke: '#1c1917',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 156, `Ур. ${labLvl} · ${tier.name}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#fde68a',
      backgroundColor: '#1c1917cc',
      padding: { x: 12, y: 5 }
    }).setOrigin(0.5);

    // 4. Интерактивный верстак в центре
    this.createCenterWorkbench(width, height, tier);

    // 5. Главные кнопки управления
    this.createActionButton(
      width / 2,
      height - 175,
      320,
      64,
      'ДОСКА ЗАКАЗОВ',
      0xd97706,
      0xfef3c7,
      () => {
        AudioManager.playClick();
        if (this.scene.get('ContractsScene')) {
          this.scene.start('ContractsScene');
        } else {
          this.showToast('Этап 2: Доска заказов готова к подключению!');
        }
      }
    );

    this.createActionButton(
      width / 2,
      height - 95,
      320,
      54,
      'ОБОРУДОВАНИЕ И ЛАБА',
      0x334155,
      0xe2e8f0,
      () => {
        AudioManager.playClick();
        if (this.scene.get('UpgradeScene')) {
          this.scene.start('UpgradeScene');
        } else {
          this.showToast('Этап 4: Магазин улучшений подключается далее!');
        }
      }
    );

    // 6. Фирменная плашка студии внизу
    this.add.text(width / 2, height - 24, 'EASY DOPAMINE GAMES', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: 2,
      color: '#a8a29e'
    }).setOrigin(0.5).setAlpha(0.8);
  }

  drawLabRoom(w, h, tier, labLvl) {
    const g = this.add.graphics();

    g.fillStyle(tier.wall, 1);
    g.fillRect(0, 0, w, h);

    g.lineStyle(2, 0x000000, 0.16);
    for (let x = 0; x < w; x += 40) {
      g.moveTo(x, 70);
      g.lineTo(x, h * 0.64);
    }
    for (let y = 70; y < h * 0.64; y += 40) {
      g.moveTo(0, y);
      g.lineTo(w, y);
    }
    g.strokePath();

    g.fillStyle(0x1c1917, 1);
    g.fillRect(w / 2 - 130, 200, 260, 120);
    g.fillStyle(labLvl >= 3 ? 0x0ea5e9 : 0x44403c, 0.35);
    g.fillRect(w / 2 - 122, 208, 244, 104);

    g.lineStyle(3, tier.accent, 0.9);
    g.beginPath();
    g.moveTo(w / 2 - 105, 290);
    g.lineTo(w / 2 - 45, 265);
    g.lineTo(w / 2 + 15, 232);
    g.lineTo(w / 2 + 55, 224);
    g.lineTo(w / 2 + 95, 285);
    g.strokePath();

    g.fillStyle(tier.table, 1);
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle(0x1c1917, 0.45);
    g.fillRect(0, h * 0.62, w, 10);
  }

  createTopBar(w, tier) {
    const g = this.add.graphics();
    g.fillStyle(0x1c1917, 0.92);
    g.fillRect(0, 0, w, 64);
    g.lineStyle(2, tier.accent, 0.6);
    g.lineBetween(0, 64, w, 64);

    this.add.text(20, 20, `💰 ${Storage.getMoney()} ₽`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '18px',
      fontWeight: '700',
      color: '#facc15'
    });

    this.add.text(195, 20, `★ ${Storage.getReputation()}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '18px',
      fontWeight: '700',
      color: '#38bdf8'
    });

    const soundBtn = this.add.text(w - 22, 18, Storage.isSoundEnabled() ? '🔊' : '🔇', {
      fontSize: '24px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    soundBtn.on('pointerdown', () => {
      const enabled = Storage.toggleSound();
      soundBtn.setText(enabled ? '🔊' : '🔇');
      if (enabled) AudioManager.playClick();
    });
  }

  createCenterWorkbench(w, h, tier) {
    const cy = h * 0.55;

    const g = this.add.graphics();
    g.fillStyle(0x27272a, 1);
    g.fillRect(w / 2 - 76, cy - 110, 16, 150);
    g.fillRect(w / 2 + 60, cy - 110, 16, 150);
    g.fillRect(w / 2 - 86, cy - 122, 172, 22);
    g.fillStyle(tier.accent, 1);
    g.fillRect(w / 2 - 24, cy - 100, 48, 28);

    const core = this.add.image(w / 2, cy - 6, 'rock_core')
      .setScale(1.35)
      .setInteractive({ useHandCursor: true });

    const particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      emitting: false
    });

    core.on('pointerdown', () => {
      AudioManager.playLatchSnap();
      particles.emitParticleAt(core.x, core.y, 10);
      this.tweens.add({
        targets: core,
        scaleX: 1.48,
        scaleY: 1.22,
        duration: 70,
        yoyo: true
      });
    });

    this.add.text(w / 2, cy + 72, 'Нажми на образец, чтобы проверить звук стенда', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#d6d3d1'
    }).setOrigin(0.5);
  }

  createActionButton(x, y, w, h, label, bgColor, textColor, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    const drawBtn = (pressed = false) => {
      bg.clear();
      const offsetY = pressed ? 3 : 0;
      bg.fillStyle(0x000000, 0.45);
      bg.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 12);
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2 + offsetY, w, h, 12);
      bg.lineStyle(2, 0xffffff, 0.25);
      bg.strokeRoundedRect(-w / 2, -h / 2 + offsetY, w, h, 12);
    };

    drawBtn(false);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: Phaser.Display.Color.IntegerToColor(textColor).rgba
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      drawBtn(true);
      txt.y = 3;
    });

    container.on('pointerup', () => {
      drawBtn(false);
      txt.y = 0;
      onClick();
    });

    container.on('pointerout', () => {
      drawBtn(false);
      txt.y = 0;
    });

    return container;
  }

  showToast(message) {
    const { width, height } = this.scale;
    const toast = this.add.text(width / 2, height * 0.42, message, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#fef3c7',
      backgroundColor: '#1c1917ee',
      padding: { x: 14, y: 10 },
      align: 'center',
      wordWrap: { width: 340 }
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: toast.y - 25,
      delay: 1400,
      duration: 400,
      onComplete: () => toast.destroy()
    });
  }
}
