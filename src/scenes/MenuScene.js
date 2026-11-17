import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';

const LAB_TIERS = {
  1: { name: 'Гаражная геолаборатория', wall: 0x262320, table: 0x57504a, accent: 0xeab308 },
  2: { name: 'Участковый пост контроля', wall: 0x23272e, table: 0x4b5563, accent: 0xf59e0b },
  3: { name: 'Инженерный центр грунтов', wall: 0x1e2631, table: 0x475569, accent: 0x38bdf8 },
  4: { name: 'Институт механики скал', wall: 0x1b2432, table: 0x3f4c5e, accent: 0x34d399 },
  5: { name: 'Геотех-комплекс «Атлант»', wall: 0x17202e, table: 0x374151, accent: 0xfacc15 }
};

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.eqBars = [];
    this.eqTimer = 0;
    this.trackTxt = null;
  }

  create() {
    const { width, height } = this.scale;
    const labLvl = Storage.getLabLevel();
    const tier = LAB_TIERS[labLvl] || LAB_TIERS[1];

    this.inputGuardUntil = performance.now() + 260;

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      emitting: false
    }).setDepth(30);

    this.drawLabRoom(width, height, tier, labLvl);
    this.createTopBar(width, tier);

    this.add.text(width / 2, 98, 'ROCK LAB', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '36px',
      fontWeight: '700',
      color: '#fef3c7',
      stroke: '#1c1917',
      strokeThickness: 6
    }).setOrigin(0.5);

    const auditLeft = Storage.getAuditBonus();
    const subLabel = auditLeft > 0
      ? `Ур. ${labLvl} · ${tier.name} · 🛡️ Аккредитация (+15% ×${auditLeft})`
      : `Ур. ${labLvl} · ${tier.name}`;

    this.add.text(width / 2, 134, subLabel, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '600',
      color: auditLeft > 0 ? '#4ade80' : '#fde68a',
      backgroundColor: '#1c1917cc',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5);

    this.createCenterWorkbench(width, height, tier, labLvl);
    this.createMaintenancePanel(width, height);
    this.createMiniPlayer(width, height, tier);

    this.createActionButton(
      width / 2,
      height - 178,
      340,
      54,
      'ДОСКА ЗАКАЗОВ',
      0xd97706,
      0xffffff,
      () => {
        AudioManager.playClick();
        this.scene.start('ContractsScene');
      }
    );

    const halfW = 165;
    this.createActionButton(
      width / 2 - halfW / 2 - 5,
      height - 110,
      halfW,
      48,
      '⚙️ МАГАЗИН',
      0x334155,
      0xf8fafc,
      () => {
        AudioManager.playClick();
        this.scene.start('UpgradeScene');
      },
      14
    );

    this.createActionButton(
      width / 2 + halfW / 2 + 5,
      height - 110,
      halfW,
      48,
      '📖 ГОСТы',
      0x0369a1,
      0xf0f9ff,
      () => {
        AudioManager.playClick();
        this.scene.start('GuideScene', { returnScene: 'MenuScene' });
      },
      14
    );

    this.add.text(width / 2, height - 18, 'EASY DOPAMINE GAMES', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: 2,
      color: '#a8a29e'
    }).setOrigin(0.5).setAlpha(0.85);
  }

  drawLabRoom(w, h, tier, labLvl) {
    const g = this.add.graphics();
    const decorLvl = Storage.getPerkLevel('decor');
    const showcaseLvl = Storage.getPerkLevel('showcase');

    g.fillStyle(tier.wall, 1);
    g.fillRect(0, 0, w, h);

    g.fillStyle(0xfef3c7, 0.06 + decorLvl * 0.02);
    g.fillTriangle(w / 2, 64, 40, h * 0.56, w - 40, h * 0.56);

    g.lineStyle(1.5, 0x000000, 0.18);
    for (let x = 0; x < w; x += 40) {
      g.moveTo(x, 64);
      g.lineTo(x, h * 0.56);
    }
    for (let y = 64; y < h * 0.56; y += 40) {
      g.moveTo(0, y);
      g.lineTo(w, y);
    }
    g.strokePath();

    g.fillStyle(0x3f3f46, 1);
    g.fillRect(0, 68, w, 10);
    g.fillStyle(tier.accent, 0.25 + decorLvl * 0.06);
    g.fillRect(0, 78, w, 4);

    if (labLvl >= 5) {
      g.fillStyle(0x0284c9, 0.45);
      g.fillRoundedRect(w / 2 - 175, 160, 350, 112, 10);
      g.lineStyle(4, 0x94a3b8, 1);
      g.strokeRoundedRect(w / 2 - 175, 160, 350, 112, 10);
      g.fillStyle(0x334155, 0.9);
      g.fillTriangle(w / 2 - 165, 270, w / 2 - 70, 192, w / 2 + 25, 270);
      g.fillTriangle(w / 2 - 20, 270, w / 2 + 85, 184, w / 2 + 170, 270);
    } else {
      g.fillStyle(0x14161b, 1);
      g.fillRoundedRect(w / 2 - 135, 162, 270, 102, 8);
      g.lineStyle(3, 0x4b5563, 1);
      g.strokeRoundedRect(w / 2 - 135, 162, 270, 102, 8);

      g.fillStyle(0x0ea5e9, 0.12);
      g.fillRect(w / 2 - 127, 170, 254, 86);

      g.lineStyle(1, 0x334155, 0.6);
      g.lineBetween(w / 2 - 120, 212, w / 2 + 120, 212);
      g.lineStyle(2.5, tier.accent, 0.9);
      g.beginPath();
      g.moveTo(w / 2 - 110, 244);
      g.lineTo(w / 2 - 50, 222);
      g.lineTo(w / 2 + 10, 190);
      g.lineTo(w / 2 + 55, 184);
      g.lineTo(w / 2 + 95, 240);
      g.strokePath();
    }

    // Витрина с найденными минералами слева
    const foundGems = Storage.getGems();
    if (showcaseLvl > 0 || labLvl >= 2 || foundGems.length > 0) {
      const shelfX = 20;
      const shelfY = 172;
      g.fillStyle(0x18181b, 0.95);
      g.fillRoundedRect(shelfX, shelfY, 68, 160, 6);
      g.lineStyle(2, tier.accent, 0.8);
      g.strokeRoundedRect(shelfX, shelfY, 68, 160, 6);

      for (let i = 0; i < 4; i++) {
        const sy = shelfY + 24 + i * 35;
        g.fillStyle(0x3f3f46, 1);
        g.fillRect(shelfX + 8, sy + 14, 52, 4);

        if (foundGems[i]) {
          const gx = shelfX + 34;
          const gy = sy + 4;
          g.fillStyle(foundGems[i].color, 1);
          g.beginPath();
          g.moveTo(gx, gy - 9);
          g.lineTo(gx + 8, gy);
          g.lineTo(gx, gy + 9);
          g.lineTo(gx - 8, gy);
          g.closePath();
          g.fillPath();
          g.lineStyle(1.5, 0xffffff, 0.9);
          g.strokePath();
        } else {
          g.fillStyle(0x27272a, 1);
          g.fillCircle(shelfX + 34, sy + 4, 3);
        }
      }
    }

    g.fillStyle(0xfef3c7, 0.9);
    g.fillRect(w - 82, 188, 56, 70);
    g.lineStyle(2, 0x78350f, 1);
    g.strokeRect(w - 82, 188, 56, 70);
    g.fillStyle(0x78350f, 0.75);
    g.fillRect(w - 74, 200, 40, 5);
    g.fillRect(w - 74, 212, 32, 4);
    g.fillRect(w - 74, 222, 36, 4);
    if (labLvl >= 3) {
      g.fillStyle(0xd97706, 1);
      g.fillCircle(w - 54, 242, 8);
    }

    g.fillStyle(tier.table, 1);
    g.fillRect(0, h * 0.54, w, h * 0.46);
    g.fillStyle(0x27272a, 1);
    g.fillRect(0, h * 0.54, w, 12);
    g.fillStyle(0x71717a, 1);
    g.fillRect(0, h * 0.54, w, 3);
  }

  createTopBar(w, tier) {
    const g = this.add.graphics();
    g.fillStyle(0x14161b, 0.95);
    g.fillRect(0, 0, w, 64);
    g.lineStyle(2, tier.accent, 0.65);
    g.lineBetween(0, 64, w, 64);

    this.moneyTxt = this.add.text(20, 20, `💰 ${Storage.getMoney()} ₽`, {
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
      if (performance.now() < this.inputGuardUntil) return;
      const enabled = Storage.toggleSound();
      soundBtn.setText(enabled ? '🔊' : '🔇');
      if (enabled) AudioManager.playClick();
    });
  }

  createCenterWorkbench(w, h, tier, labLvl) {
    const cy = h * 0.46;
    const coffeeLvl = Storage.getPerkLevel('coffee');

    const g = this.add.graphics();
    g.fillStyle(0x3f3f46, 1);
    g.fillRect(w / 2 - 76, cy - 96, 16, 134);
    g.fillRect(w / 2 + 60, cy - 96, 16, 134);
    g.fillStyle(tier.accent, 1);
    g.fillRoundedRect(w / 2 - 86, cy - 110, 172, 22, 6);
    g.fillRect(w / 2 - 22, cy - 88, 44, 24);

    const core = this.add.image(w / 2, cy - 4, 'rock_core')
      .setScale(1.22)
      .setInteractive({ useHandCursor: true });

    if (labLvl >= 4) {
      const laser = this.add.rectangle(w / 2, cy - 22, 94, 3, 0x34d399, 0.85);
      this.tweens.add({
        targets: laser,
        y: cy + 24,
        duration: 1200,
        yoyo: true,
        repeat: -1
      });
    }

    core.on('pointerdown', () => {
      if (performance.now() < this.inputGuardUntil) return;
      AudioManager.playCorePickup();
      this.particles.emitParticleAt(core.x, core.y, 10);
      this.tweens.add({
        targets: core,
        scaleX: 1.36,
        scaleY: 1.12,
        duration: 70,
        yoyo: true
      });
    });

    if (coffeeLvl > 0) {
      const cmX = w - 64;
      const cmY = cy + 6;
      const cm = this.add.graphics();
      cm.fillStyle(0x1f2937, 1);
      cm.fillRoundedRect(cmX - 28, cmY - 46, 56, 76, 8);
      cm.fillStyle(0xdc2626, 1);
      cm.fillRect(cmX - 24, cmY - 40, 48, 16);
      cm.fillStyle(0xfef3c7, 1);
      cm.fillRect(cmX - 8, cmY + 6, 16, 18);

      const cmZone = this.add.zone(cmX, cmY - 8, 64, 84).setInteractive({ useHandCursor: true });
      cmZone.on('pointerdown', () => {
        if (performance.now() < this.inputGuardUntil) return;
        AudioManager.playLatchSnap();
        this.particles.emitParticleAt(cmX, cmY - 4, 8);
      });
    }
  }

  createMaintenancePanel(w, h) {
    const panelY = h * 0.585;
    const panelW = 340;
    const panelH = 62;
    const startX = w / 2 - panelW / 2;

    if (this.maintContainer) {
      this.maintContainer.destroy();
    }
    this.maintContainer = this.add.container(0, 0);

    const items = [
      { key: 'saw', label: '🪚 Диск пилы', cost: 25 },
      { key: 'grinder', label: '⚙️ Абразив', cost: 25 },
      { key: 'calibration', label: '📐 Поверка', cost: 35 }
    ];

    const colW = (panelW - 12) / 3;
    items.forEach((item, idx) => {
      const x = startX + idx * (colW + 6);
      const pct = Storage.getWear(item.key);
      const isLow = pct < 50;
      const needsService = pct < 100;

      const card = this.add.graphics();
      card.fillStyle(0x14161b, 0.94);
      card.fillRoundedRect(x, panelY, colW, panelH, 8);
      card.lineStyle(1.5, isLow ? 0xf59e0b : 0x475569, 0.9);
      card.strokeRoundedRect(x, panelY, colW, panelH, 8);

      const t1 = this.add.text(x + colW / 2, panelY + 12, item.label, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '10px',
        fontWeight: '700',
        color: '#e2e8f0'
      }).setOrigin(0.5);

      const pctColor = pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171';
      const t2 = this.add.text(x + colW / 2, panelY + 29, `${pct}%`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
        fontWeight: '700',
        color: pctColor
      }).setOrigin(0.5);

      const actionLabel = needsService ? `ТО · ${item.cost} ₽` : 'В НОРМЕ';
      const canPay = needsService && Storage.getMoney() >= item.cost;
      const t3 = this.add.text(x + colW / 2, panelY + 48, actionLabel, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: canPay ? '#0f172a' : '#94a3b8',
        backgroundColor: canPay ? '#facc15' : '#27272a',
        padding: { x: 6, y: 2 }
      }).setOrigin(0.5);

      this.maintContainer.add([card, t1, t2, t3]);

      if (canPay) {
        const zone = this.add.zone(x + colW / 2, panelY + panelH / 2, colW, panelH)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          if (performance.now() < this.inputGuardUntil) return;
          if (Storage.spendMoney(item.cost)) {
            Storage.restoreWear(item.key);
            AudioManager.playLatchSnap();
            if (this.moneyTxt) this.moneyTxt.setText(`💰 ${Storage.getMoney()} ₽`);
            this.createMaintenancePanel(w, h);
          }
        });
        this.maintContainer.add(zone);
      }
    });
  }

  createMiniPlayer(w, h, tier) {
    const px = w / 2;
    const py = h * 0.695;
    const pw = 340;
    const ph = 46;

    const container = this.add.container(px, py);
    const bg = this.add.graphics();
    bg.fillStyle(0x14161b, 0.96);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 10);
    bg.lineStyle(2, tier.accent, 0.75);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 10);

    const icon = this.add.text(-pw / 2 + 12, 0, '📻', {
      fontSize: '19px'
    }).setOrigin(0, 0.5);

    const curTrack = AudioManager.getCurrentTrack();
    this.trackTxt = this.add.text(-pw / 2 + 40, -7, curTrack.name, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0, 0.5);

    const defaultSub = 'ТАПНИ ЧТОБЫ СМЕНИТЬ ТРЕК ⏭';
    const subLabel = this.add.text(-pw / 2 + 40, 10, defaultSub, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '9px',
      fontWeight: '600',
      color: '#94a3b8'
    }).setOrigin(0, 0.5);

    this.eqBars = [];
    for (let i = 0; i < 4; i++) {
      const bar = this.add.rectangle(pw / 2 - 90 + i * 6, 12, 4, 16, tier.accent)
        .setOrigin(0.5, 1);
      this.eqBars.push(bar);
    }

    const nextZone = this.add.zone(-30, 0, pw - 74, ph).setInteractive({ useHandCursor: true });
    nextZone.on('pointerdown', () => {
      if (performance.now() < this.inputGuardUntil) return;
      const next = AudioManager.nextTrack();
      this.trackTxt.setText(next.name);
      this.tweens.add({
        targets: container,
        scaleX: 0.98,
        scaleY: 0.98,
        duration: 60,
        yoyo: true
      });
    });

    // Явная кнопка режима воспроизведения справа (ВСЕ ↻ / 1 ТРЕК)
    const modeW = 56;
    const modeH = 32;
    const modeX = pw / 2 - 34;
    const modeBtnContainer = this.add.container(modeX, 0);
    const modeBg = this.add.graphics();
    const modeLabel = this.add.text(0, 0, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px',
      fontWeight: '700',
      align: 'center'
    }).setOrigin(0.5);

    const drawModeBtn = (mode) => {
      const isLoop = mode === 'loop';
      modeBg.clear();
      modeBg.fillStyle(isLoop ? 0xfacc15 : 0x0284c9, 1);
      modeBg.fillRoundedRect(-modeW / 2, -modeH / 2, modeW, modeH, 7);
      modeBg.lineStyle(1.5, 0xffffff, 0.45);
      modeBg.strokeRoundedRect(-modeW / 2, -modeH / 2, modeW, modeH, 7);
      modeLabel.setText(isLoop ? '🔂\n1 ТРЕК' : '🔁\nВСЕ ↻');
      modeLabel.setColor(isLoop ? '#0f172a' : '#ffffff');
    };

    drawModeBtn(AudioManager.getPlayMode());
    modeBtnContainer.add([modeBg, modeLabel]);

    const modeZone = this.add.zone(modeX, 0, modeW + 6, ph).setInteractive({ useHandCursor: true });
    modeZone.on('pointerdown', () => {
      if (performance.now() < this.inputGuardUntil) return;
      const newMode = AudioManager.togglePlayMode();
      drawModeBtn(newMode);

      this.tweens.add({
        targets: modeBtnContainer,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 65,
        yoyo: true
      });

      subLabel.setText(newMode === 'loop' ? 'РЕЖИМ: ПОВТОР ОДНОГО ТРЕКА' : 'РЕЖИМ: ВСЕ ТРЕКИ ПО КРУГУ');
      subLabel.setColor(newMode === 'loop' ? '#facc15' : '#38bdf8');
      this.time.delayedCall(1400, () => {
        if (subLabel && subLabel.active) {
          subLabel.setText(defaultSub);
          subLabel.setColor('#94a3b8');
        }
      });
    });

    container.add([bg, icon, this.trackTxt, subLabel, ...this.eqBars, nextZone, modeBtnContainer, modeZone]);
  }

  update(time, delta) {
    if (!this.eqBars.length) return;
    this.eqTimer += delta;
    if (this.eqTimer >= 130) {
      this.eqTimer = 0;
      const active = Storage.isSoundEnabled();
      this.eqBars.forEach((bar) => {
        bar.height = active ? 4 + Math.random() * 14 : 3;
      });
      if (this.trackTxt) {
        const currentName = AudioManager.getCurrentTrack().name;
        if (this.trackTxt.text !== currentName) {
          this.trackTxt.setText(currentName);
        }
      }
    }
  }

  createActionButton(x, y, w, h, label, bgColor, textColor, onClick, fontSize = 17) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    let isPressed = false;

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

    container.on('pointerdown', () => {
      if (performance.now() < this.inputGuardUntil) return;
      isPressed = true;
      drawBtn(true);
      txt.y = 3;
    });
    container.on('pointerup', () => {
      if (!isPressed) return;
      isPressed = false;
      drawBtn(false);
      txt.y = 0;
      onClick();
    });
    container.on('pointerout', () => {
      isPressed = false;
      drawBtn(false);
      txt.y = 0;
    });

    return container;
  }
}
