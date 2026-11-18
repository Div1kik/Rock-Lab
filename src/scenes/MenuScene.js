import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { RARE_INCLUSIONS, MEGA_PROJECTS } from '../data/contracts.js';

const LAB_TIERS = {
  1: { name: 'Гаражная геолаборатория', wall: 0x292524, floor: 0x3f3a36, table: 0x57504a, accent: 0xeab308 },
  2: { name: 'Участковый пост контроля', wall: 0x242933, floor: 0x333a47, table: 0x4b5563, accent: 0xf59e0b },
  3: { name: 'Инженерный центр грунтов', wall: 0x1e293b, floor: 0x2c3a4f, table: 0x475569, accent: 0x38bdf8 },
  4: { name: 'Институт механики скал', wall: 0x172536, floor: 0x22354a, table: 0x3f4c5e, accent: 0x34d399 },
  5: { name: 'Геотех-комплекс «Атлант»', wall: 0x141d2e, floor: 0x1e2c42, table: 0x374151, accent: 0xfacc15 }
};

const LAB_THEMES = {
  loft: { wall: 0x3b1f16, floor: 0x291d18, table: 0x5c3424, accent: 0xf97316 },
  arctic: { wall: 0x0c2d48, floor: 0x164263, table: 0x1e6091, accent: 0x7dd3fc },
  cyber: { wall: 0x091e26, floor: 0x0f2f38, table: 0x134e4a, accent: 0x2dd4bf },
  gold: { wall: 0x1c1917, floor: 0x292524, table: 0x451a03, accent: 0xfacc15 }
};

const SKIN_PALETTES = {
  default: { coat: 0xf8fafc, pants: 0x334155, helmet: 0xfacc15 },
  miner: { coat: 0xf97316, pants: 0x1e293b, helmet: 0xffffff },
  arctic: { coat: 0x0284c9, pants: 0x0f172a, helmet: 0x38bdf8 },
  gold: { coat: 0xfacc15, pants: 0x78350f, helmet: 0xfef08a }
};

const ENGINEER_LINES = [
  'Керн плотный, по ГОСТу пройдёт!',
  'Проверяю калибровку датчиков...',
  'Неплоскостность торцов в допуске!',
  'Готовим расчёты для Стройки века!',
  'Пора выпить чашечку кофе ☕'
];

const INTERN_LINES = [
  'Несу ящик на распил!',
  'Все саморезы выкручены, шеф!',
  'Подготовил шайбы для среза!',
  'Штангенциркуль обнулён!',
  'Учусь работать на стабилометре!'
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.eqBars = [];
    this.eqTimer = 0;
    this.trackTxt = null;
    this.showcaseModalOpen = false;
    this.staffActors = [];
    this.navNodes = [];
  }

  create() {
    const { width, height } = this.scale;
    const labLvl = Storage.getLabLevel();
    const baseTier = LAB_TIERS[labLvl] || LAB_TIERS[1];
    const customTheme = LAB_THEMES[Storage.getActiveLabTheme()];
    const tier = customTheme ? { ...baseTier, ...customTheme } : baseTier;

    this.showcaseModalOpen = false;
    this.staffActors = [];
    this.inputGuardUntil = performance.now() + 260;

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      emitting: false
    }).setDepth(30);

    this.drawLabRoom(width, height, tier, labLvl);
    this.createTopBar(width, tier);

    this.add.text(width / 2, 90, 'ROCK LAB', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '32px',
      fontWeight: '700',
      color: '#fef3c7',
      stroke: '#1c1917',
      strokeThickness: 6
    }).setOrigin(0.5);

    const auditLeft = Storage.getAuditBonus();
    const completedMegas = Storage.getCompletedMegasCount();
    let subLabel = `Ур. ${labLvl} · ${tier.name}`;
    if (auditLeft > 0) {
      subLabel += ` · 🛡️ +15% (×${auditLeft})`;
    } else if (completedMegas > 0) {
      subLabel += ` · 🏗️ Строек века: ${completedMegas}/${MEGA_PROJECTS.length}`;
    }

    this.add.text(width / 2, 122, subLabel, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '600',
      color: auditLeft > 0 ? '#4ade80' : '#fde68a',
      backgroundColor: '#1c1917cc',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5);

    this.createLiveMiniLab(width, height, tier, labLvl);
    this.createMaintenancePanel(width, height);
    this.createMiniPlayer(width, height, tier);

    this.createActionButton(
      width / 2,
      height - 178,
      340,
      54,
      'ДОСКА ЗАКАЗОВ И СТРОЙКИ ВЕКА',
      0xd97706,
      0xffffff,
      () => {
        AudioManager.playClick();
        this.scene.start('ContractsScene');
      },
      15
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

  showSpeechBubble(targetContainer, text, accentColor = 0xfacc15) {
    if (targetContainer.activeBubble) {
      targetContainer.activeBubble.destroy();
      targetContainer.activeBubble = null;
    }

    const bubble = this.add.container(targetContainer.x, targetContainer.y - 74).setDepth(28);
    const label = this.add.text(0, 0, text, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '10px',
      fontWeight: '700',
      color: '#0f172a',
      align: 'center',
      wordWrap: { width: 145 }
    }).setOrigin(0.5);

    const padX = 10;
    const padY = 6;
    const bw = Math.max(76, label.width + padX * 2);
    const bh = label.height + padY * 2;

    const bg = this.add.graphics();
    bg.fillStyle(0xfef3c7, 0.98);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.lineStyle(2, accentColor, 1);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.fillStyle(0xfef3c7, 0.98);
    bg.fillTriangle(-5, bh / 2, 5, bh / 2, 0, bh / 2 + 6);

    bubble.add([bg, label]);
    bubble.setScale(0.3);
    targetContainer.activeBubble = bubble;

    this.tweens.add({
      targets: bubble,
      scale: 1,
      duration: 160,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(2100, () => {
      if (!bubble.active) return;
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        y: bubble.y - 10,
        duration: 240,
        onComplete: () => {
          if (targetContainer.activeBubble === bubble) {
            targetContainer.activeBubble = null;
          }
          bubble.destroy();
        }
      });
    });
  }

  drawLabRoom(w, h, tier, labLvl) {
    const g = this.add.graphics();
    const decorLvl = Storage.getPerkLevel('decor');
    const showcaseLvl = Storage.getPerkLevel('showcase');
    const hasNeon = Storage.isDecorActive('neon');
    const hasGeoMap = Storage.isDecorActive('geomap');
    const hasCooler = Storage.isDecorActive('cooler');
    const hasPlants = Storage.isDecorActive('plants');
    const activeTheme = Storage.getActiveLabTheme();

    const backWallY = 266;
    const frontBenchY = h * 0.545;

    g.fillStyle(tier.wall, 1);
    g.fillRect(0, 64, w, backWallY - 64);

    if (activeTheme === 'loft' || (activeTheme === 'default' && labLvl === 1)) {
      g.lineStyle(1, 0x000000, 0.22);
      for (let by = 80; by < backWallY; by += 18) {
        g.lineBetween(0, by, w, by);
        const shift = (by / 18) % 2 === 0 ? 0 : 20;
        for (let bx = shift; bx < w; bx += 40) {
          g.lineBetween(bx, by, bx, by + 18);
        }
      }
    } else {
      g.lineStyle(1.5, 0x000000, 0.16);
      for (let x = 0; x < w; x += 48) {
        g.lineBetween(x, 64, x, backWallY);
      }
      g.lineBetween(0, 165, w, 165);
    }

    g.fillStyle(tier.floor, 1);
    g.fillRect(0, backWallY, w, frontBenchY - backWallY);
    g.fillStyle(0x0f172a, 0.65);
    g.fillRect(0, backWallY, w, 6);

    g.lineStyle(1.5, 0x000000, 0.25);
    const center = w / 2;
    for (let i = -4; i <= 4; i++) {
      g.lineBetween(center + i * 44, backWallY, center + i * 64, frontBenchY);
    }
    g.lineBetween(0, (backWallY + frontBenchY) / 2, w, (backWallY + frontBenchY) / 2);

    g.fillStyle(hasNeon ? 0x38bdf8 : 0xfef3c7, 0.06 + decorLvl * 0.02);
    g.fillTriangle(w / 2, 66, 20, frontBenchY, w - 20, frontBenchY);

    g.fillStyle(0x27272a, 1);
    g.fillRect(0, 66, w, 9);
    g.fillStyle(hasNeon ? 0x38bdf8 : tier.accent, hasNeon ? 0.9 : 0.35 + decorLvl * 0.08);
    g.fillRect(0, 75, w, 4);

    if (labLvl >= 5) {
      g.fillStyle(0x0284c9, 0.45);
      g.fillRoundedRect(w / 2 - 122, 138, 244, 78, 8);
      g.lineStyle(3, 0x94a3b8, 1);
      g.strokeRoundedRect(w / 2 - 122, 138, 244, 78, 8);
      g.fillStyle(0x334155, 0.92);
      g.fillTriangle(w / 2 - 114, 214, w / 2 - 48, 158, w / 2 + 16, 214);
      g.fillTriangle(w / 2 - 12, 214, w / 2 + 62, 152, w / 2 + 116, 214);
    } else {
      g.fillStyle(0x14161b, 1);
      g.fillRoundedRect(w / 2 - 104, 140, 208, 74, 8);
      g.lineStyle(2.5, 0x4b5563, 1);
      g.strokeRoundedRect(w / 2 - 104, 140, 208, 74, 8);
      g.fillStyle(0x0ea5e9, 0.12);
      g.fillRect(w / 2 - 98, 146, 196, 62);

      if (hasGeoMap) {
        g.fillStyle(0x15803d, 0.65);
        g.fillRoundedRect(w / 2 - 82, 154, 56, 30, 6);
        g.fillRoundedRect(w / 2 - 8, 152, 84, 38, 8);
        g.fillStyle(0xfacc15, 1);
        g.fillCircle(w / 2 - 58, 168, 4);
        g.fillCircle(w / 2 + 18, 164, 4);
        g.fillCircle(w / 2 + 52, 176, 4);
      } else {
        g.lineStyle(2, tier.accent, 0.9);
        g.beginPath();
        g.moveTo(w / 2 - 84, 198);
        g.lineTo(w / 2 - 38, 182);
        g.lineTo(w / 2 + 6, 160);
        g.lineTo(w / 2 + 44, 154);
        g.lineTo(w / 2 + 78, 194);
        g.strokePath();
      }
    }

    const foundGems = Storage.getGems();
    if (showcaseLvl > 0) {
      const shelfX = 14;
      const shelfY = 148;
      const shelfW = 58;
      const shelfH = 144;

      g.fillStyle(0x18181b, 0.96);
      g.fillRoundedRect(shelfX, shelfY, shelfW, shelfH, 6);
      g.lineStyle(2, tier.accent, 0.85);
      g.strokeRoundedRect(shelfX, shelfY, shelfW, shelfH, 6);

      const displayed = Storage.getDisplayedGems();
      for (let i = 0; i < 4; i++) {
        const sy = shelfY + 20 + i * 31;
        g.fillStyle(0x3f3f46, 1);
        g.fillRect(shelfX + 7, sy + 13, 44, 4);

        if (displayed[i]) {
          const gx = shelfX + 29;
          const gy = sy + 4;
          g.fillStyle(displayed[i].color, 1);
          g.beginPath();
          g.moveTo(gx, gy - 8);
          g.lineTo(gx + 7, gy);
          g.lineTo(gx, gy + 8);
          g.lineTo(gx - 7, gy);
          g.closePath();
          g.fillPath();
          g.lineStyle(1.5, 0xffffff, 0.9);
          g.strokePath();
        } else {
          g.fillStyle(0x27272a, 1);
          g.fillCircle(shelfX + 29, sy + 4, 3);
        }
      }

      this.leftDoor = this.add.rectangle(shelfX + 2, shelfY + 2, shelfW / 2 - 2, shelfH - 4, 0x38bdf8, 0.16)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x7dd3fc, 0.55);
      this.rightDoor = this.add.rectangle(shelfX + shelfW - 2, shelfY + 2, shelfW / 2 - 2, shelfH - 4, 0x38bdf8, 0.16)
        .setOrigin(1, 0)
        .setStrokeStyle(1, 0x7dd3fc, 0.55);

      this.add.text(shelfX + shelfW / 2, shelfY + shelfH + 10, `💎 ${foundGems.length}/${RARE_INCLUSIONS.length}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: '#fef3c7',
        backgroundColor: '#14161bdd',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      const shelfZone = this.add.zone(shelfX + shelfW / 2, shelfY + shelfH / 2, shelfW + 14, shelfH + 24)
        .setInteractive({ useHandCursor: true });

      shelfZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        this.showcaseModalOpen = true;
        AudioManager.playLatchSnap();

        this.tweens.add({
          targets: [this.leftDoor, this.rightDoor],
          scaleX: 0.12,
          duration: 240,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.openShowcaseModal(tier);
          }
        });
      });
    } else if (foundGems.length > 0) {
      const boxX = 14;
      const boxY = 246;
      g.fillStyle(0x292524, 0.95);
      g.fillRoundedRect(boxX, boxY, 58, 48, 6);
      g.lineStyle(1.5, 0x78716c, 0.8);
      g.strokeRoundedRect(boxX, boxY, 58, 48, 6);

      this.add.text(boxX + 29, boxY + 15, '📦 СКЛАД', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: '#fde68a'
      }).setOrigin(0.5);

      this.add.text(boxX + 29, boxY + 32, `💎 ${foundGems.length} шт.`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#38bdf8'
      }).setOrigin(0.5);

      const boxZone = this.add.zone(boxX + 29, boxY + 24, 64, 54).setInteractive({ useHandCursor: true });
      boxZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        this.showcaseModalOpen = true;
        AudioManager.playClick();
        this.openShowcaseModal(tier);
      });
    }

    const floorLineY = backWallY + 28;
    if (hasCooler) {
      const cx = w - 34;
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(cx - 13, floorLineY - 40, 26, 40, 4);
      g.lineStyle(1.5, 0x64748b, 1);
      g.strokeRoundedRect(cx - 13, floorLineY - 40, 26, 40, 4);
      g.fillStyle(0x38bdf8, 0.85);
      g.fillRoundedRect(cx - 10, floorLineY - 64, 20, 24, 5);
      g.fillStyle(0x0284c9, 1);
      g.fillRect(cx - 5, floorLineY - 26, 4, 5);
      g.fillStyle(0xef4444, 1);
      g.fillRect(cx + 2, floorLineY - 26, 4, 5);
    }

    if (hasPlants) {
      const px = hasCooler ? w - 68 : w - 36;
      g.fillStyle(0xb45309, 1);
      g.fillRect(px - 10, floorLineY - 16, 20, 16);
      g.lineStyle(1.5, 0x78350f, 1);
      g.strokeRect(px - 10, floorLineY - 16, 20, 16);
      g.fillStyle(0x22c55e, 1);
      g.fillCircle(px, floorLineY - 26, 11);
      g.fillCircle(px - 8, floorLineY - 22, 8);
      g.fillCircle(px + 8, floorLineY - 22, 8);
    }

    g.fillStyle(0xfef3c7, 0.92);
    g.fillRect(w - 64, 146, 46, 56);
    g.lineStyle(2, 0x78350f, 1);
    g.strokeRect(w - 64, 146, 46, 56);
    g.fillStyle(0x78350f, 0.75);
    g.fillRect(w - 57, 155, 32, 4);
    g.fillRect(w - 57, 164, 24, 4);
    g.fillRect(w - 57, 173, 28, 4);
    if (labLvl >= 3) {
      g.fillStyle(0xd97706, 1);
      g.fillCircle(w - 41, 189, 6);
    }

    g.fillStyle(tier.table, 1);
    g.fillRect(0, frontBenchY, w, h - frontBenchY);
    g.fillStyle(0x18181b, 1);
    g.fillRect(0, frontBenchY, w, 11);
    g.fillStyle(0x71717a, 1);
    g.fillRect(0, frontBenchY, w, 3);
  }

  createLiveMiniLab(w, h, tier, labLvl) {
    const backFloorY = 286;
    const midFloorY = 340;
    const frontBenchY = h * 0.545;

    const pressLvl = Storage.getUpgradeLevel('press');
    const sawLvl = Storage.getUpgradeLevel('saw');
    const grinderLvl = Storage.getUpgradeLevel('grinder');

    const hasSplit = Storage.isTestUnlocked('shear_crack');
    const hasWater = Storage.isTestUnlocked('water_sat');
    const hasUltrasonic = Storage.isTestUnlocked('ultrasonic');
    const hasFrost = Storage.isTestUnlocked('frost_test');
    const hasShearLoad = Storage.isTestUnlocked('shear_load');
    const hasTriaxial = Storage.isTestUnlocked('triaxial');

    const hasCryoBox = Storage.getPerkLevel('cryobox') > 0;
    const coffeeLvl = Storage.getPerkLevel('coffee');
    const assistantLvl = Storage.getPerkLevel('assistant');

    const hasLoungeSofa = Storage.isDecorActive('lounge_sofa');
    const hasArchiveDesk = Storage.isDecorActive('archive_desk');
    const hasRoboArm = Storage.isDecorActive('robo_arm');
    const hasRoboRover = Storage.isDecorActive('robo_rover');
    const hasRoboDog = Storage.isDecorActive('robo_dog');
    const hasRoboHumanoid = Storage.isDecorActive('robo_humanoid');

    const backG = this.add.graphics().setDepth(4);

    if (hasWater) {
      const wx = 112;
      backG.fillStyle(0x475569, 1);
      backG.fillRoundedRect(wx - 20, backFloorY - 46, 40, 46, 4);
      backG.lineStyle(1.5, 0x0f172a, 0.9);
      backG.strokeRoundedRect(wx - 20, backFloorY - 46, 40, 46, 4);
      backG.fillStyle(0xf97316, 0.85);
      backG.fillRect(wx - 13, backFloorY - 38, 26, 16);
      backG.fillStyle(0xe2e8f0, 1);
      backG.fillRect(wx - 12, backFloorY - 16, 24, 4);
      backG.fillStyle(0x38bdf8, 1);
      backG.fillCircle(wx + 12, backFloorY - 8, 2.5);
    }

    if (hasFrost) {
      const fx = 166;
      backG.fillStyle(0x1e3a8a, 1);
      backG.fillRoundedRect(fx - 20, backFloorY - 50, 40, 50, 5);
      backG.lineStyle(1.5, 0x38bdf8, 1);
      backG.strokeRoundedRect(fx - 20, backFloorY - 50, 40, 50, 5);
      backG.fillStyle(0xbae6fd, 0.85);
      backG.fillRect(fx - 12, backFloorY - 40, 24, 18);
      backG.lineStyle(1.5, 0x0284c9, 1);
      backG.lineBetween(fx - 6, backFloorY - 31, fx + 6, backFloorY - 31);
      backG.lineBetween(fx, backFloorY - 37, fx, backFloorY - 25);
    }

    if (labLvl >= 2) {
      const rx = w / 2 + 18;
      backG.fillStyle(0x3f3f46, 1);
      backG.fillRect(rx - 26, backFloorY - 48, 4, 48);
      backG.fillRect(rx + 22, backFloorY - 48, 4, 48);
      backG.fillRect(rx - 26, backFloorY - 34, 52, 3);
      backG.fillRect(rx - 26, backFloorY - 16, 52, 3);
      backG.fillStyle(0x92400e, 1);
      backG.fillRect(rx - 18, backFloorY - 44, 16, 10);
      backG.fillStyle(0xd6d3d1, 1);
      backG.fillRect(rx + 4, backFloorY - 26, 14, 10);
    }

    if (hasCryoBox) {
      const cbx = w - 122;
      backG.fillStyle(0x0284c9, 1);
      backG.fillRoundedRect(cbx - 16, backFloorY - 24, 32, 24, 4);
      backG.lineStyle(1.5, 0x0f172a, 0.9);
      backG.strokeRoundedRect(cbx - 16, backFloorY - 24, 32, 24, 4);
      backG.fillStyle(0xe0f2fe, 1);
      backG.fillRect(cbx - 16, backFloorY - 26, 32, 5);
    }

    const midG = this.add.graphics().setDepth(9);
    const midX = w / 2;

    if (labLvl === 1) {
      midG.fillStyle(0x78350f, 1);
      midG.fillRect(midX - 30, midFloorY - 18, 60, 5);
      midG.fillRect(midX - 26, midFloorY - 13, 5, 13);
      midG.fillRect(midX + 21, midFloorY - 13, 5, 13);
      midG.fillStyle(0xfef3c7, 0.9);
      midG.fillRect(midX - 18, midFloorY - 21, 24, 3);
    } else if (labLvl <= 3) {
      midG.fillStyle(0x334155, 1);
      midG.fillRoundedRect(midX - 42, midFloorY - 22, 84, 22, 4);
      midG.lineStyle(1.5, 0x0f172a, 0.9);
      midG.strokeRoundedRect(midX - 42, midFloorY - 22, 84, 22, 4);
      midG.fillStyle(0x0f172a, 1);
      midG.fillRect(midX - 16, midFloorY - 42, 32, 18);
      midG.fillStyle(0x38bdf8, 0.85);
      midG.fillRect(midX - 13, midFloorY - 39, 26, 12);
      midG.fillStyle(0x94a3b8, 1);
      midG.fillRect(midX - 4, midFloorY - 24, 8, 3);
    } else {
      midG.fillStyle(0x1e293b, 1);
      midG.fillRoundedRect(midX - 58, midFloorY - 24, 116, 24, 6);
      midG.lineStyle(2, tier.accent, 0.9);
      midG.strokeRoundedRect(midX - 58, midFloorY - 24, 116, 24, 6);
      midG.fillStyle(0x38bdf8, 0.9);
      midG.fillRect(midX - 46, midFloorY - 15, 18, 5);
      midG.fillStyle(0x4ade80, 0.9);
      midG.fillRect(midX - 22, midFloorY - 15, 18, 5);

      const projX = midX - 22;
      const projY = midFloorY - 24;
      midG.fillStyle(0x0f172a, 1);
      midG.fillRoundedRect(projX - 12, projY - 4, 24, 4, 2);
      midG.fillStyle(0x38bdf8, 0.22);
      midG.fillTriangle(projX - 10, projY - 4, projX + 10, projY - 4, projX, projY - 36);

      const holoGroup = this.add.container(projX, projY - 20).setDepth(10);
      const hG = this.add.graphics();
      hG.fillStyle(0x38bdf8, 0.35);
      hG.fillRoundedRect(-8, -11, 16, 22, 3);
      hG.lineStyle(1.5, 0x7dd3fc, 0.95);
      hG.strokeRoundedRect(-8, -11, 16, 22, 3);
      hG.lineStyle(1, 0xe0f2fe, 0.8);
      hG.lineBetween(-5, -4, 4, -2);
      hG.lineBetween(-3, 4, 6, 6);
      hG.lineStyle(1.5, 0x4ade80, 1);
      hG.lineBetween(-12, 0, 12, 0);
      holoGroup.add(hG);

      this.tweens.add({
        targets: holoGroup,
        y: projY - 25,
        duration: 1150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (hasLoungeSofa) {
      const sx = 98;
      midG.fillStyle(0x92400e, 1);
      midG.fillRoundedRect(sx - 24, midFloorY - 26, 48, 16, 4);
      midG.fillStyle(0xd97706, 1);
      midG.fillRoundedRect(sx - 20, midFloorY - 14, 40, 10, 3);
      midG.fillStyle(0x78350f, 1);
      midG.fillRoundedRect(sx - 26, midFloorY - 18, 5, 18, 2);
      midG.fillRoundedRect(sx + 21, midFloorY - 18, 5, 18, 2);
    }

    if (hasArchiveDesk) {
      const ax = w - 102;
      midG.fillStyle(0x334155, 1);
      midG.fillRoundedRect(ax - 20, midFloorY - 34, 40, 34, 4);
      midG.lineStyle(1.5, 0x0f172a, 0.9);
      midG.strokeRoundedRect(ax - 20, midFloorY - 34, 40, 34, 4);
      [-28, -18, -8].forEach((dy) => {
        midG.fillStyle(0x475569, 1);
        midG.fillRect(ax - 15, midFloorY + dy, 30, 7);
        midG.fillStyle(0xfacc15, 1);
        midG.fillRect(ax - 4, midFloorY + dy + 2, 8, 2);
      });
    }

    if (hasRoboArm) {
      const armX = midX + 26;
      const armY = midFloorY - 24;
      midG.fillStyle(0x64748b, 1);
      midG.fillRoundedRect(armX - 12, armY - 6, 24, 6, 2);

      const armPivot = this.add.container(armX, armY - 6).setDepth(10);
      const aG = this.add.graphics();
      aG.lineStyle(5, 0xdc2626, 1);
      aG.lineBetween(0, 0, -10, -24);
      aG.lineBetween(-10, -24, 14, -40);
      aG.fillStyle(0xfacc15, 1);
      aG.fillCircle(-10, -24, 4);
      aG.fillStyle(0x38bdf8, 1);
      aG.fillCircle(14, -40, 4);
      armPivot.add(aG);

      const armHit = this.add.zone(0, -20, 42, 48).setInteractive({ useHandCursor: true });
      armHit.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        AudioManager.playLatchSnap();
        this.particles.emitParticleAt(armX + 12, armY - 42, 12);
        this.showSpeechBubble(armPivot, 'МАНИПУЛЯТОР: ЛАЗЕРНЫЙ ЗАХВАТ ⚡', 0xef4444);
        this.tweens.add({
          targets: armPivot,
          angle: -26,
          duration: 180,
          yoyo: true
        });
      });
      armPivot.add(armHit);

      this.tweens.add({
        targets: armPivot,
        angle: 18,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const eqG = this.add.graphics().setDepth(14);

    const sawX = 52;
    eqG.fillStyle(0x334155, 1);
    eqG.fillRoundedRect(sawX - 20, frontBenchY - 20, 40, 20, 4);
    eqG.lineStyle(1.5, 0x0f172a, 0.9);
    eqG.strokeRoundedRect(sawX - 20, frontBenchY - 20, 40, 20, 4);
    eqG.fillStyle(sawLvl >= 3 ? 0x10b981 : 0xd97706, 1);
    eqG.fillRoundedRect(sawX - 15, frontBenchY - 36, 30, 16, 4);
    eqG.fillStyle(0xcbd5e1, 1);
    eqG.fillCircle(sawX, frontBenchY - 20, 9);

    const grX = 102;
    eqG.fillStyle(0x1e293b, 1);
    eqG.fillRoundedRect(grX - 16, frontBenchY - 18, 32, 18, 3);
    eqG.lineStyle(1.5, 0x0f172a, 0.9);
    eqG.strokeRoundedRect(grX - 16, frontBenchY - 18, 32, 18, 3);
    eqG.fillStyle(grinderLvl >= 2 ? 0x38bdf8 : 0x94a3b8, 1);
    eqG.fillEllipse(grX, frontBenchY - 20, 28, 8);

    if (hasSplit) {
      const spX = 148;
      eqG.fillStyle(0x475569, 1);
      eqG.fillRect(spX - 12, frontBenchY - 38, 24, 38);
      eqG.lineStyle(1.5, 0x0f172a, 0.9);
      eqG.strokeRect(spX - 12, frontBenchY - 38, 24, 38);
      eqG.fillStyle(0xf59e0b, 1);
      eqG.fillTriangle(spX - 7, frontBenchY - 26, spX + 7, frontBenchY - 26, spX, frontBenchY - 12);
    }

    const pressX = w / 2;
    const pressColors = [0xd97706, 0xca8a04, 0x059669, 0x0284c9, 0x4f46e5, 0xfacc15];
    const pCol = pressColors[Math.min(pressColors.length - 1, pressLvl - 1)];
    eqG.fillStyle(0x3f3f46, 1);
    eqG.fillRect(pressX - 26, frontBenchY - 62, 7, 62);
    eqG.fillRect(pressX + 19, frontBenchY - 62, 7, 62);
    eqG.fillStyle(pCol, 1);
    eqG.fillRoundedRect(pressX - 32, frontBenchY - 72, 64, 13, 4);
    eqG.lineStyle(1.5, 0x0f172a, 0.9);
    eqG.strokeRoundedRect(pressX - 32, frontBenchY - 72, 64, 13, 4);
    eqG.fillRect(pressX - 9, frontBenchY - 59, 18, 12);
    eqG.fillStyle(0xd6d3d1, 1);
    eqG.fillRect(pressX - 10, frontBenchY - 26, 20, 26);

    if (hasShearLoad) {
      const shX = pressX + 62;
      eqG.fillStyle(0x334155, 1);
      eqG.fillRoundedRect(shX - 18, frontBenchY - 28, 36, 28, 4);
      eqG.lineStyle(1.5, 0x0f172a, 0.9);
      eqG.strokeRoundedRect(shX - 18, frontBenchY - 28, 36, 28, 4);
      eqG.fillStyle(0x0284c9, 1);
      eqG.fillRect(shX - 12, frontBenchY - 36, 24, 8);
    }

    if (hasUltrasonic) {
      const ux = pressX + 110;
      eqG.fillStyle(0x0f172a, 1);
      eqG.fillRoundedRect(ux - 16, frontBenchY - 34, 32, 34, 4);
      eqG.lineStyle(1.5, 0x4ade80, 1);
      eqG.strokeRoundedRect(ux - 16, frontBenchY - 34, 32, 34, 4);
      eqG.lineBetween(ux - 11, frontBenchY - 18, ux - 4, frontBenchY - 26);
      eqG.lineBetween(ux - 4, frontBenchY - 26, ux + 4, frontBenchY - 10);
      eqG.lineBetween(ux + 4, frontBenchY - 10, ux + 11, frontBenchY - 20);
    }

    if (hasTriaxial) {
      const tx = w - 84;
      eqG.fillStyle(0x1e293b, 1);
      eqG.fillRoundedRect(tx - 15, frontBenchY - 54, 30, 54, 5);
      eqG.lineStyle(1.5, 0x0f172a, 0.9);
      eqG.strokeRoundedRect(tx - 15, frontBenchY - 54, 30, 54, 5);
      eqG.fillStyle(0x38bdf8, 0.5);
      eqG.fillRect(tx - 10, frontBenchY - 46, 20, 34);
    }

    if (coffeeLvl > 0) {
      const cmX = w - 38;
      eqG.fillStyle(0x1f2937, 1);
      eqG.fillRoundedRect(cmX - 15, frontBenchY - 32, 30, 32, 5);
      eqG.fillStyle(0xdc2626, 1);
      eqG.fillRect(cmX - 12, frontBenchY - 28, 24, 8);
      eqG.fillStyle(0xfef3c7, 1);
      eqG.fillRect(cmX - 4, frontBenchY - 11, 8, 9);
    }

    // =========================================================================
    // НАВИГАЦИОННЫЙ ГРАФ ПРОХОДОВ (Персонажи и роботы обходят всю мебель!)
    // =========================================================================
    const topLaneY = 304;
    const botLaneY = frontBenchY - 6;
    const leftCorridorX = 62;
    const midLeftCorridorX = 138;
    const midRightCorridorX = w - 138;
    const rightCorridorX = w - 64;

    this.navNodes = [
      // Верхний проход (0..3) — за мебелью центрального ряда
      { id: 0, x: leftCorridorX, y: topLaneY, neighbors: [1, 4] },
      { id: 1, x: midLeftCorridorX, y: topLaneY, neighbors: [0, 2, 5] },
      { id: 2, x: midRightCorridorX, y: topLaneY, neighbors: [1, 3, 6] },
      { id: 3, x: rightCorridorX, y: topLaneY, neighbors: [2, 7] },
      // Нижний проход вдоль передних станков (4..7) — перед мебелью центрального ряда
      { id: 4, x: leftCorridorX, y: botLaneY, neighbors: [0, 5] },
      { id: 5, x: midLeftCorridorX, y: botLaneY, neighbors: [1, 4, 6] },
      { id: 6, x: midRightCorridorX, y: botLaneY, neighbors: [2, 5, 7] },
      { id: 7, x: rightCorridorX, y: botLaneY, neighbors: [3, 6] }
    ];

    const skin = SKIN_PALETTES[Storage.getActiveSkin()] || SKIN_PALETTES.default;
    this.spawnLabWorker(4, skin, 'engineer', 0);

    const extraStaffCount = assistantLvl > 0 ? Math.min(3, Math.floor((assistantLvl + 1) / 2)) : 0;
    const internPalettes = [
      { coat: 0x38bdf8, pants: 0x1e293b, helmet: 0xfef3c7 },
      { coat: 0x34d399, pants: 0x1e293b, helmet: 0xffffff },
      { coat: 0xa78bfa, pants: 0x1e293b, helmet: 0xfacc15 }
    ];

    const startNodes = [7, 1, 2];
    for (let i = 0; i < extraStaffCount; i++) {
      this.spawnLabWorker(startNodes[i % startNodes.length], internPalettes[i % internPalettes.length], 'intern', i + 1);
    }

    if (hasRoboHumanoid) {
      const androidPalette = { coat: 0x94a3b8, pants: 0x0f172a, helmet: 0x38bdf8 };
      this.spawnLabWorker(6, androidPalette, 'android', 9);
    }

    if (hasRoboRover) {
      this.spawnMobileRobot(0, 'rover');
    }

    if (hasRoboDog) {
      this.spawnMobileRobot(5, 'dog');
    }
  }

  pickNextNeighborNode(currentNodeId, prevNodeId) {
    const node = this.navNodes[currentNodeId] || this.navNodes[0];
    const choices = node.neighbors.filter((id) => id !== prevNodeId);
    const pool = choices.length > 0 ? choices : node.neighbors;
    const nextId = pool[Math.floor(Math.random() * pool.length)];
    return this.navNodes[nextId] || node;
  }

  spawnLabWorker(startNodeId, palette, role, seedIdx) {
    const startNode = this.navNodes[startNodeId] || this.navNodes[0];
    const worker = this.add.container(startNode.x, startNode.y).setDepth(6);

    const g = this.add.graphics();
    g.fillStyle(palette.pants, 1);
    g.fillRect(-7, -22, 5, 22);
    g.fillRect(2, -22, 5, 22);
    g.fillStyle(palette.coat, 1);
    g.fillRoundedRect(-10, -48, 20, 28, 5);

    if (role === 'android') {
      g.fillStyle(0xcbd5e1, 1);
      g.fillRoundedRect(-8, -64, 16, 15, 4);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(-5, -59, 10, 4);
    } else {
      g.fillStyle(0xfde68a, 1);
      g.fillCircle(0, -56, 8);
      g.fillStyle(palette.helmet, 1);
      g.slice(0, -58, 9, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
      g.fillPath();
    }

    if (role === 'intern' && seedIdx % 2 === 1) {
      g.fillStyle(0x92400e, 1);
      g.fillRoundedRect(8, -38, 16, 13, 3);
    }

    worker.add(g);

    const nextNode = this.pickNextNeighborNode(startNode.id, -1);
    const actor = {
      sprite: worker,
      role,
      currentNodeId: startNode.id,
      prevNodeId: -1,
      targetNodeId: nextNode.id,
      targetX: nextNode.x,
      targetY: nextNode.y,
      speed: role === 'intern' ? 32 : role === 'android' ? 28 : 24,
      pauseTimer: 0.4 + seedIdx * 0.35
    };

    const hitZone = this.add.zone(0, -34, 38, 72).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playClick();
      this.particles.emitParticleAt(worker.x, worker.y - 45, 7);

      if (role === 'android') {
        this.showSpeechBubble(worker, 'АТЛАНТ-X: СКАНИРОВАНИЕ ПОРОДЫ 99.8%', 0x38bdf8);
      } else if (role === 'intern') {
        const line = INTERN_LINES[Math.floor(Math.random() * INTERN_LINES.length)];
        this.showSpeechBubble(worker, line, 0x34d399);
      } else {
        const line = ENGINEER_LINES[Math.floor(Math.random() * ENGINEER_LINES.length)];
        this.showSpeechBubble(worker, line, 0xfacc15);
      }

      this.tweens.add({
        targets: worker,
        y: worker.y - 10,
        duration: 110,
        yoyo: true
      });
    });
    worker.add(hitZone);

    this.staffActors.push(actor);
  }

  spawnMobileRobot(startNodeId, type) {
    const startNode = this.navNodes[startNodeId] || this.navNodes[0];
    const bot = this.add.container(startNode.x, startNode.y).setDepth(6);
    const g = this.add.graphics();

    if (type === 'rover') {
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(-16, -22, 32, 16, 5);
      g.lineStyle(1.5, 0x0f172a, 0.9);
      g.strokeRoundedRect(-16, -22, 32, 16, 5);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(0, -25, 4);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(-10, -4, 5);
      g.fillCircle(10, -4, 5);
    } else {
      g.fillStyle(0xfacc15, 1);
      g.fillRoundedRect(-14, -22, 28, 10, 4);
      g.lineStyle(1.5, 0x0f172a, 0.9);
      g.strokeRoundedRect(-14, -22, 28, 10, 4);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(-11, -12, 4, 12);
      g.fillRect(7, -12, 4, 12);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(10, -25, 7, 5);
    }

    bot.add(g);

    const nextNode = this.pickNextNeighborNode(startNode.id, -1);
    const actor = {
      sprite: bot,
      role: type,
      currentNodeId: startNode.id,
      prevNodeId: -1,
      targetNodeId: nextNode.id,
      targetX: nextNode.x,
      targetY: nextNode.y,
      speed: type === 'rover' ? 38 : 46,
      pauseTimer: 0.3
    };

    const hitZone = this.add.zone(0, -16, 40, 36).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playLatchSnap();
      this.particles.emitParticleAt(bot.x, bot.y - 20, 10);

      if (type === 'dog') {
        this.showSpeechBubble(bot, 'ГАВ-СКАН! КЕРН ОБНАРУЖЕН 🐕📡', 0xfacc15);
        this.tweens.add({
          targets: bot,
          y: bot.y - 22,
          angle: 360,
          duration: 380,
          ease: 'Back.easeOut',
          onComplete: () => { bot.angle = 0; }
        });
      } else {
        this.showSpeechBubble(bot, 'РОБО-КУРЬЕР: ТУРБО-ДОСТАВКА ⚡', 0x38bdf8);
        actor.pauseTimer = 0;
        actor.speed = 95;
        this.time.delayedCall(1200, () => { actor.speed = 38; });
      }
    });
    bot.add(hitZone);

    this.staffActors.push(actor);
  }

  openShowcaseModal(tier) {
    const { width, height } = this.scale;
    const modalContainer = this.add.container(0, 0).setDepth(60);
    const hasShowcase = Storage.getPerkLevel('showcase') > 0;

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x090d16, 0.94);
    dimBg.fillRect(0, 0, width, height);

    const boxW = 396;
    const boxH = 650;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x181c26, 1);
    panel.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    panel.lineStyle(3, tier.accent, 1);
    panel.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const title = this.add.text(
      width / 2,
      boxY + 24,
      hasShowcase ? '💎 СКЛАД И ВИТРИНА МИНЕРАЛОВ' : '📦 СКЛАД НАЙДЕННЫХ МИНЕРАЛОВ',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '15px',
        fontWeight: '700',
        color: '#fef3c7'
      }
    ).setOrigin(0.5);

    const foundGems = Storage.getGems();
    const subText = hasShowcase
      ? `Найдено: ${foundGems.length}/${RARE_INCLUSIONS.length} · Выбери до 4 образцов на полку`
      : `Найдено: ${foundGems.length}/${RARE_INCLUSIONS.length} · Купи витрину в Магазине (Ур. 2+)`;

    const sub = this.add.text(width / 2, boxY + 46, subText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    modalContainer.add([blocker, dimBg, panel, title, sub]);

    RARE_INCLUSIONS.forEach((gem, idx) => {
      const owned = foundGems.find((g) => g.id === gem.id);
      const ry = boxY + 66 + idx * 57;
      const rowH = 51;

      const rowG = this.add.graphics();
      rowG.fillStyle(owned ? 0x222938 : 0x131720, 1);
      rowG.fillRoundedRect(boxX + 14, ry, boxW - 28, rowH, 8);
      rowG.lineStyle(1.5, owned ? gem.color : 0x334155, owned ? 0.9 : 0.6);
      rowG.strokeRoundedRect(boxX + 14, ry, boxW - 28, rowH, 8);

      const iconTxt = this.add.text(boxX + 34, ry + rowH / 2, owned ? gem.icon : '❓', {
        fontSize: '20px'
      }).setOrigin(0.5).setAlpha(owned ? 1 : 0.45);

      const nameTxt = this.add.text(
        boxX + 56,
        ry + 15,
        owned ? `${gem.name}${owned.count > 1 ? ` (×${owned.count})` : ''}` : 'Неизвестный образец',
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          fontWeight: '700',
          color: owned ? '#f8fafc' : '#64748b'
        }
      ).setOrigin(0, 0.5);

      const descTxt = this.add.text(
        boxX + 56,
        ry + 35,
        owned ? `${gem.rarity} · Ценность ${gem.value} ₽` : `Редкость: ${gem.rarity}`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '10px',
          color: owned ? '#38bdf8' : '#475569'
        }
      ).setOrigin(0, 0.5);

      modalContainer.add([rowG, iconTxt, nameTxt, descTxt]);

      if (owned && hasShowcase) {
        const isShown = Storage.isGemDisplayed(gem.id);
        const toggleBtn = this.add.text(
          boxX + boxW - 24,
          ry + rowH / 2,
          isShown ? '✅ НА ПОЛКЕ' : '+ НА ПОЛКУ',
          {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '9px',
            fontWeight: '700',
            color: isShown ? '#0f172a' : '#fef3c7',
            backgroundColor: isShown ? '#4ade80' : '#334155',
            padding: { x: 7, y: 5 }
          }
        ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        toggleBtn.on('pointerdown', () => {
          AudioManager.playLatchSnap();
          Storage.toggleGemDisplay(gem.id);
          modalContainer.destroy();
          this.openShowcaseModal(tier);
        });

        modalContainer.add(toggleBtn);
      }
    });

    const closeBtn = this.add.text(width / 2, boxY + boxH - 28, 'ЗАКРЫТЬ И ОБНОВИТЬ ПОЛКУ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#d97706',
      padding: { x: 20, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      AudioManager.playLatchSnap();
      modalContainer.destroy();
      this.scene.restart();
    });

    modalContainer.add(closeBtn);
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
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      const enabled = Storage.toggleSound();
      soundBtn.setText(enabled ? '🔊' : '🔇');
      if (enabled) AudioManager.playClick();
    });
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
          if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
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
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
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
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
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
    const dt = delta / 1000;

    for (const actor of this.staffActors) {
      if (actor.sprite.activeBubble) {
        actor.sprite.activeBubble.setPosition(actor.sprite.x, actor.sprite.y - 74);
      }

      if (actor.pauseTimer > 0) {
        actor.pauseTimer -= dt;
        continue;
      }

      const dx = actor.targetX - actor.sprite.x;
      const dy = actor.targetY - actor.sprite.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        if (Math.random() < 0.35) {
          this.particles.emitParticleAt(actor.sprite.x, actor.sprite.y - 26, 3);
        }
        const prevId = actor.currentNodeId;
        actor.currentNodeId = actor.targetNodeId;
        const nextNode = this.pickNextNeighborNode(actor.currentNodeId, prevId);
        actor.targetNodeId = nextNode.id;
        actor.targetX = nextNode.x;
        actor.targetY = nextNode.y;
        actor.pauseTimer = 0.7 + Math.random() * 1.4;
        continue;
      }

      const step = Math.min(dist, actor.speed * dt);
      actor.sprite.x += (dx / dist) * step;
      actor.sprite.y += (dy / dist) * step;
      if (Math.abs(dx) > 1) {
        actor.sprite.scaleX = dx >= 0 ? 1 : -1;
      }
      // Y-сортировка глубины: в верхнем проходе (y <= 316) персонаж за центральной мебелью (depth 7), в нижнем — перед ней (depth 12)
      actor.sprite.setDepth(actor.sprite.y <= 318 ? 7 : 12);
    }

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
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
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
