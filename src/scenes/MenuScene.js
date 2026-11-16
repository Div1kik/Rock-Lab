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

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      emitting: false
    }).setDepth(30);

    this.drawLabRoom(width, height, tier, labLvl);
    this.createTopBar(width, tier);

    this.add.text(width / 2, 108, 'ROCK LAB', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '40px',
      fontWeight: '700',
      color: '#fef3c7',
      stroke: '#1c1917',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 148, `Ур. ${labLvl} · ${tier.name}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#fde68a',
      backgroundColor: '#1c1917cc',
      padding: { x: 12, y: 5 }
    }).setOrigin(0.5);

    this.createCenterWorkbench(width, height, tier, labLvl);

    // Главная кнопка: ДОСКА ЗАКАЗОВ
    this.createActionButton(
      width / 2,
      height - 196,
      340,
      58,
      'ДОСКА ЗАКАЗОВ',
      0xd97706,
      0xfef3c7,
      () => {
        AudioManager.playClick();
        this.scene.start('ContractsScene');
      }
    );

    // Вторая строка кнопок: СТАНКИ И ЛАБА + МЕТОДЫ И ГОСТЫ
    const halfW = 165;
    this.createActionButton(
      width / 2 - halfW / 2 - 5,
      height - 124,
      halfW,
      52,
      '⚙️ МАГАЗИН',
      0x334155,
      0xe2e8f0,
      () => {
        AudioManager.playClick();
        this.scene.start('UpgradeScene');
      },
      14
    );

    this.createActionButton(
      width / 2 + halfW / 2 + 5,
      height - 124,
      halfW,
      52,
      '📖 ГОСТы',
      0x1e3a8a,
      0xbfdbfe,
      () => {
        AudioManager.playClick();
        this.scene.start('GuideScene', { returnScene: 'MenuScene' });
      },
      14
    );

    this.add.text(width / 2, height - 22, 'EASY DOPAMINE GAMES', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: 2,
      color: '#a8a29e'
    }).setOrigin(0.5).setAlpha(0.8);
  }

  drawLabRoom(w, h, tier, labLvl) {
    const g = this.add.graphics();
    const decorLvl = Storage.getPerkLevel('decor');
    const showcaseLvl = Storage.getPerkLevel('showcase');

    g.fillStyle(tier.wall, 1);
    g.fillRect(0, 0, w, h);

    g.lineStyle(2, 0x000000, 0.16);
    for (let x = 0; x < w; x += 40) {
      g.moveTo(x, 64);
      g.lineTo(x, h * 0.64);
    }
    for (let y = 64; y < h * 0.64; y += 40) {
      g.moveTo(0, y);
      g.lineTo(w, y);
    }
    g.strokePath();

    if (decorLvl > 0 || labLvl >= 3) {
      g.fillStyle(tier.accent, 0.14 + decorLvl * 0.04);
      g.fillRect(0, 64, w, 14);
      g.fillRect(0, h * 0.62 - 8, w, 8);
    }

    if (labLvl >= 5) {
      g.fillStyle(0x0284c9, 0.45);
      g.fillRoundedRect(w / 2 - 175, 178, 350, 125, 10);
      g.lineStyle(4, 0x94a3b8, 1);
      g.strokeRoundedRect(w / 2 - 175, 178, 350, 125, 10);
      g.fillStyle(0x334155, 0.9);
      g.fillTriangle(w / 2 - 165, 300, w / 2 - 70, 210, w / 2 + 25, 300);
      g.fillTriangle(w / 2 - 20, 300, w / 2 + 85, 198, w / 2 + 170, 300);
    } else {
      g.fillStyle(0x1c1917, 1);
      g.fillRoundedRect(w / 2 - 135, 184, 270, 114, 8);
      g.lineStyle(3, 0x44403c, 1);
      g.strokeRoundedRect(w / 2 - 135, 184, 270, 114, 8);

      g.fillStyle(labLvl >= 3 ? 0x0ea5e9 : 0x44403c, 0.28);
      g.fillRect(w / 2 - 127, 192, 254, 98);

      g.lineStyle(3, tier.accent, 0.95);
      g.beginPath();
      g.moveTo(w / 2 - 110, 274);
      g.lineTo(w / 2 - 50, 248);
      g.lineTo(w / 2 + 10, 214);
      g.lineTo(w / 2 + 55, 206);
      g.lineTo(w / 2 + 95, 268);
      g.strokePath();
    }

    if (showcaseLvl > 0 || labLvl >= 2) {
      const shelfX = 24;
      const shelfY = 210;
      g.fillStyle(0x1c1917, 0.95);
      g.fillRoundedRect(shelfX, shelfY, 64, 150, 6);
      g.lineStyle(2, tier.accent, 0.7);
      g.strokeRoundedRect(shelfX, shelfY, 64, 150, 6);

      const gemColors = [0x38bdf8, 0xfacc15, 0x34d399, 0xf43f5e];
      const count = Math.max(1, showcaseLvl);
      for (let i = 0; i < count; i++) {
        const sy = shelfY + 26 + i * 32;
        g.fillStyle(0x57534e, 1);
        g.fillRect(shelfX + 8, sy + 14, 48, 4);
        g.fillStyle(gemColors[i % gemColors.length], 1);
        g.fillCircle(shelfX + 32, sy + 4, 9);
      }
    }

    if (labLvl >= 3) {
      g.fillStyle(0xfef3c7, 0.9);
      g.fillRect(w - 84, 214, 56, 72);
      g.lineStyle(3, 0xd97706, 1);
      g.strokeRect(w - 84, 214, 56, 72);
      g.fillStyle(0xd97706, 1);
      g.fillCircle(w - 56, 264, 8);
    }

    g.fillStyle(tier.table, 1);
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle(0x1c1917, 0.5);
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

  createCenterWorkbench(w, h, tier, labLvl) {
    const cy = h * 0.54;
    const coffeeLvl = Storage.getPerkLevel('coffee');

    const g = this.add.graphics();
    g.fillStyle(0x27272a, 1);
    g.fillRect(w / 2 - 78, cy - 112, 16, 152);
    g.fillRect(w / 2 + 62, cy - 112, 16, 152);
    g.fillStyle(tier.accent, 1);
    g.fillRoundedRect(w / 2 - 88, cy - 126, 176, 24, 6);
    g.fillRect(w / 2 - 24, cy - 102, 48, 28);

    const core = this.add.image(w / 2, cy - 6, 'rock_core')
      .setScale(1.35)
      .setInteractive({ useHandCursor: true });

    if (labLvl >= 4) {
      const laser = this.add.rectangle(w / 2, cy - 26, 94, 3, 0x34d399, 0.85);
      this.tweens.add({
        targets: laser,
        y: cy + 28,
        duration: 1200,
        yoyo: true,
        repeat: -1
      });
    }

    core.on('pointerdown', () => {
      AudioManager.playCorePickup();
      this.particles.emitParticleAt(core.x, core.y, 10);
      this.tweens.add({
        targets: core,
        scaleX: 1.48,
        scaleY: 1.22,
        duration: 70,
        yoyo: true
      });
    });

    if (coffeeLvl > 0) {
      const cmX = w - 66;
      const cmY = cy + 8;
      const cm = this.add.graphics();
      cm.fillStyle(0x18181b, 1);
      cm.fillRoundedRect(cmX - 28, cmY - 46, 56, 76, 8);
      cm.fillStyle(0xdc2626, 1);
      cm.fillRect(cmX - 24, cmY - 40, 48, 16);
      cm.fillStyle(0xfef3c7, 1);
      cm.fillRect(cmX - 8, cmY + 6, 16, 18);

      const cmZone = this.add.zone(cmX, cmY - 8, 64, 84).setInteractive({ useHandCursor: true });
      cmZone.on('pointerdown', () => {
        AudioManager.playLatchSnap();
        this.particles.emitParticleAt(cmX, cmY - 4, 8);
      });
    }
  }

  createActionButton(x, y, w, h, label, bgColor, textColor, onClick, fontSize = 17) {
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
      fontSize: `${fontSize}px`,
      fontWeight: '700',
      color: Phaser.Display.Color.IntegerToColor(textColor).rgba
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => { drawBtn(true); txt.y = 3; });
    container.on('pointerup', () => { drawBtn(false); txt.y = 0; onClick(); });
    container.on('pointerout', () => { drawBtn(false); txt.y = 0; });

    return container;
  }
}
