import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { RARE_INCLUSIONS } from '../data/contracts.js';

const LAB_TIERS = {
  1: { name: 'Гаражная геолаборатория', wall: 0x262320, table: 0x57504a, accent: 0xeab308 },
  2: { name: 'Участковый пост контроля', wall: 0x23272e, table: 0x4b5563, accent: 0xf59e0b },
  3: { name: 'Инженерный центр грунтов', wall: 0x1e2631, table: 0x475569, accent: 0x38bdf8 },
  4: { name: 'Институт механики скал', wall: 0x1b2432, table: 0x3f4c5e, accent: 0x34d399 },
  5: { name: 'Геотех-комплекс «Атлант»', wall: 0x17202e, table: 0x374151, accent: 0xfacc15 }
};

const SKIN_PALETTES = {
  default: { coat: 0xf8fafc, pants: 0x334155, helmet: 0xfacc15 },
  miner: { coat: 0xf97316, pants: 0x1e293b, helmet: 0xffffff },
  arctic: { coat: 0x0284c9, pants: 0x0f172a, helmet: 0x38bdf8 },
  gold: { coat: 0xfacc15, pants: 0x78350f, helmet: 0xfef08a }
};

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.eqBars = [];
    this.eqTimer = 0;
    this.trackTxt = null;
    this.showcaseModalOpen = false;
    this.staffActors = [];
  }

  create() {
    const { width, height } = this.scale;
    const labLvl = Storage.getLabLevel();
    const tier = LAB_TIERS[labLvl] || LAB_TIERS[1];

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

    this.add.text(width / 2, 92, 'ROCK LAB', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '34px',
      fontWeight: '700',
      color: '#fef3c7',
      stroke: '#1c1917',
      strokeThickness: 6
    }).setOrigin(0.5);

    const auditLeft = Storage.getAuditBonus();
    const subLabel = auditLeft > 0
      ? `Ур. ${labLvl} · ${tier.name} · 🛡️ Аккредитация (+15% ×${auditLeft})`
      : `Ур. ${labLvl} · ${tier.name}`;

    this.add.text(width / 2, 126, subLabel, {
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
    const hasNeon = Storage.hasDecor('neon');
    const hasGeoMap = Storage.hasDecor('geomap');
    const hasCooler = Storage.hasDecor('cooler');
    const hasPlants = Storage.hasDecor('plants');

    g.fillStyle(tier.wall, 1);
    g.fillRect(0, 0, w, h);

    // Световой конус или неоновая подсветка потолка
    g.fillStyle(hasNeon ? 0x38bdf8 : 0xfef3c7, 0.06 + decorLvl * 0.02);
    g.fillTriangle(w / 2, 64, 30, h * 0.56, w - 30, h * 0.56);

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

    // Потолочная балка + неон
    g.fillStyle(0x3f3f46, 1);
    g.fillRect(0, 66, w, 9);
    g.fillStyle(hasNeon ? 0x38bdf8 : tier.accent, hasNeon ? 0.85 : 0.25 + decorLvl * 0.06);
    g.fillRect(0, 75, w, 4);

    // Окно/табло в глубине цеха (или карта месторождений)
    if (labLvl >= 5) {
      g.fillStyle(0x0284c9, 0.42);
      g.fillRoundedRect(w / 2 - 140, 148, 280, 96, 10);
      g.lineStyle(3, 0x94a3b8, 1);
      g.strokeRoundedRect(w / 2 - 140, 148, 280, 96, 10);
      g.fillStyle(0x334155, 0.9);
      g.fillTriangle(w / 2 - 130, 242, w / 2 - 55, 174, w / 2 + 20, 242);
      g.fillTriangle(w / 2 - 15, 242, w / 2 + 70, 168, w / 2 + 132, 242);
    } else {
      g.fillStyle(0x14161b, 1);
      g.fillRoundedRect(w / 2 - 115, 150, 230, 88, 8);
      g.lineStyle(2.5, 0x4b5563, 1);
      g.strokeRoundedRect(w / 2 - 115, 150, 230, 88, 8);

      g.fillStyle(0x0ea5e9, 0.12);
      g.fillRect(w / 2 - 108, 157, 216, 74);

      if (hasGeoMap) {
        // Континентальные контуры и маячки месторождений на карте
        g.fillStyle(0x15803d, 0.55);
        g.fillRoundedRect(w / 2 - 92, 168, 64, 34, 8);
        g.fillRoundedRect(w / 2 - 10, 164, 96, 44, 10);
        g.fillStyle(0xfacc15, 1);
        g.fillCircle(w / 2 - 64, 182, 4);
        g.fillCircle(w / 2 + 22, 178, 4);
        g.fillCircle(w / 2 + 58, 192, 4);
      } else {
        g.lineStyle(1, 0x334155, 0.6);
        g.lineBetween(w / 2 - 100, 194, w / 2 + 100, 194);
        g.lineStyle(2.5, tier.accent, 0.9);
        g.beginPath();
        g.moveTo(w / 2 - 92, 220);
        g.lineTo(w / 2 - 42, 200);
        g.lineTo(w / 2 + 8, 174);
        g.lineTo(w / 2 + 48, 168);
        g.lineTo(w / 2 + 84, 216);
        g.strokePath();
      }
    }

    // Витрина редких минералов (появляется после покупки со 2-го ур. лабы)
    const foundGems = Storage.getGems();
    if (showcaseLvl > 0) {
      const shelfX = 16;
      const shelfY = 156;
      const shelfW = 62;
      const shelfH = 148;

      g.fillStyle(0x18181b, 0.95);
      g.fillRoundedRect(shelfX, shelfY, shelfW, shelfH, 6);
      g.lineStyle(2, tier.accent, 0.85);
      g.strokeRoundedRect(shelfX, shelfY, shelfW, shelfH, 6);

      const displayed = Storage.getDisplayedGems();
      for (let i = 0; i < 4; i++) {
        const sy = shelfY + 22 + i * 32;
        g.fillStyle(0x3f3f46, 1);
        g.fillRect(shelfX + 7, sy + 13, 48, 4);

        if (displayed[i]) {
          const gx = shelfX + 31;
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
          g.fillCircle(shelfX + 31, sy + 4, 3);
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
      const boxX = 16;
      const boxY = 254;
      g.fillStyle(0x292524, 0.95);
      g.fillRoundedRect(boxX, boxY, 62, 50, 6);
      g.lineStyle(1.5, 0x78716c, 0.8);
      g.strokeRoundedRect(boxX, boxY, 62, 50, 6);

      this.add.text(boxX + 31, boxY + 16, '📦 СКЛАД', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: '#fde68a'
      }).setOrigin(0.5);

      this.add.text(boxX + 31, boxY + 34, `💎 ${foundGems.length} шт.`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#38bdf8'
      }).setOrigin(0.5);

      const boxZone = this.add.zone(boxX + 31, boxY + 25, 68, 56).setInteractive({ useHandCursor: true });
      boxZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        this.showcaseModalOpen = true;
        AudioManager.playClick();
        this.openShowcaseModal(tier);
      });
    }

    // Кулер с водой (декор)
    if (hasCooler) {
      const cx = w - 42;
      const cy = 278;
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(cx - 14, cy - 16, 28, 44, 4);
      g.fillStyle(0x38bdf8, 0.85);
      g.fillRoundedRect(cx - 11, cy - 42, 22, 26, 6);
      g.fillStyle(0x0284c9, 1);
      g.fillRect(cx - 6, cy - 6, 4, 6);
      g.fillStyle(0xef4444, 1);
      g.fillRect(cx + 2, cy - 6, 4, 6);
    }

    // Живые растения в горшках (декор)
    if (hasPlants) {
      const px = hasCooler ? w - 78 : w - 44;
      const py = 294;
      g.fillStyle(0xb45309, 1);
      g.fillRect(px - 10, py - 4, 20, 16);
      g.fillStyle(0x22c55e, 1);
      g.fillCircle(px, py - 14, 11);
      g.fillCircle(px - 8, py - 10, 8);
      g.fillCircle(px + 8, py - 10, 8);
    }

    // Сертификат аккредитации на правой стене
    g.fillStyle(0xfef3c7, 0.9);
    g.fillRect(w - 72, 164, 52, 62);
    g.lineStyle(2, 0x78350f, 1);
    g.strokeRect(w - 72, 164, 52, 62);
    g.fillStyle(0x78350f, 0.75);
    g.fillRect(w - 64, 174, 36, 4);
    g.fillRect(w - 64, 184, 28, 4);
    g.fillRect(w - 64, 194, 32, 4);

    // Пол и длинный лабораторный верстак
    g.fillStyle(tier.table, 1);
    g.fillRect(0, h * 0.54, w, h * 0.46);
    g.fillStyle(0x27272a, 1);
    g.fillRect(0, h * 0.54, w, 12);
    g.fillStyle(0x71717a, 1);
    g.fillRect(0, h * 0.54, w, 3);
  }

  // =========================================================================
  // ЖИВАЯ МИНИ-ЛАБОРАТОРИЯ СО СТЕНДАМИ И ХОДЯЩИМИ ПЕРСОНАЖАМИ
  // =========================================================================
  createLiveMiniLab(w, h, tier, labLvl) {
    const benchY = h * 0.54;
    const pressLvl = Storage.getUpgradeLevel('press');
    const sawLvl = Storage.getUpgradeLevel('saw');
    const hasWater = Storage.isTestUnlocked('water_sat');
    const hasUltrasonic = Storage.isTestUnlocked('ultrasonic');
    const hasTriaxial = Storage.isTestUnlocked('triaxial');
    const coffeeLvl = Storage.getPerkLevel('coffee');
    const assistantLvl = Storage.getPerkLevel('assistant');

    const eqG = this.add.graphics().setDepth(6);

    // 1. Отрезной станок (слева на верстаке)
    const sawX = 112;
    eqG.fillStyle(0x334155, 1);
    eqG.fillRoundedRect(sawX - 24, benchY - 24, 48, 24, 4);
    eqG.fillStyle(sawLvl >= 3 ? 0x10b981 : 0xd97706, 1);
    eqG.fillRoundedRect(sawX - 18, benchY - 42, 36, 18, 4);
    eqG.fillStyle(0xcbd5e1, 1);
    eqG.fillCircle(sawX, benchY - 24, 11);

    // 2. Главный гидропресс по центру (меняется от уровня press)
    const pressX = w / 2;
    const pressColors = [0xd97706, 0xca8a04, 0x059669, 0x0284c9, 0x4f46e5, 0xfacc15];
    const pCol = pressColors[Math.min(pressColors.length - 1, pressLvl - 1)];
    eqG.fillStyle(0x3f3f46, 1);
    eqG.fillRect(pressX - 30, benchY - 66, 8, 66);
    eqG.fillRect(pressX + 22, benchY - 66, 8, 66);
    eqG.fillStyle(pCol, 1);
    eqG.fillRoundedRect(pressX - 36, benchY - 76, 72, 14, 4);
    eqG.fillRect(pressX - 10, benchY - 62, 20, 14);
    // Образец керна внутри пресса
    eqG.fillStyle(0xd6d3d1, 1);
    eqG.fillRect(pressX - 11, benchY - 28, 22, 28);

    // 3. Дополнительные купленные стенды справа на верстаке
    if (hasTriaxial) {
      // Стабилометр (колба с давлением)
      const tx = w - 132;
      eqG.fillStyle(0x1e293b, 1);
      eqG.fillRoundedRect(tx - 16, benchY - 56, 32, 56, 5);
      eqG.fillStyle(0x38bdf8, 0.45);
      eqG.fillRect(tx - 11, benchY - 48, 22, 36);
    } else if (hasUltrasonic || hasWater) {
      // Сушильный шкаф / УЗК блок
      const ux = w - 132;
      eqG.fillStyle(0x475569, 1);
      eqG.fillRoundedRect(ux - 18, benchY - 44, 36, 44, 5);
      eqG.fillStyle(0x0ea5e9, 0.8);
      eqG.fillRect(ux - 11, benchY - 36, 22, 14);
    }

    // 4. Кофемашина на правом краю верстака
    if (coffeeLvl > 0) {
      const cmX = w - 76;
      eqG.fillStyle(0x1f2937, 1);
      eqG.fillRoundedRect(cmX - 16, benchY - 34, 32, 34, 5);
      eqG.fillStyle(0xdc2626, 1);
      eqG.fillRect(cmX - 13, benchY - 30, 26, 9);
      eqG.fillStyle(0xfef3c7, 1);
      eqG.fillRect(cmX - 4, benchY - 12, 8, 10);
    }

    // Интерактивная зона по центру верстака (клик запускает тест-искры)
    const benchZone = this.add.zone(w / 2, benchY - 36, w - 120, 76)
      .setInteractive({ useHandCursor: true })
      .setDepth(8);
    benchZone.on('pointerdown', (ptr) => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playCorePickup();
      this.particles.emitParticleAt(ptr.x, benchY - 24, 10);
    });

    // 5. Живые персонажи, которые ходят по цеху вдоль верстака
    const skin = SKIN_PALETTES[Storage.getActiveSkin()] || SKIN_PALETTES.default;
    this.spawnLabWorker(w / 2 - 48, benchY, skin, false);

    if (assistantLvl > 0) {
      const internPalette = { coat: 0x38bdf8, pants: 0x1e293b, helmet: 0xfef3c7 };
      this.spawnLabWorker(w / 2 + 54, benchY, internPalette, true);
    }
  }

  spawnLabWorker(startX, benchY, palette, isIntern) {
    const { width } = this.scale;
    const worker = this.add.container(startX, benchY - 2).setDepth(7);

    const g = this.add.graphics();
    // Ноги
    g.fillStyle(palette.pants, 1);
    g.fillRect(-7, -22, 5, 22);
    g.fillRect(2, -22, 5, 22);
    // Халат / комбинезон
    g.fillStyle(palette.coat, 1);
    g.fillRoundedRect(-10, -48, 20, 28, 5);
    // Голова и каска
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(0, -56, 8);
    g.fillStyle(palette.helmet, 1);
    g.slice(0, -58, 9, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    g.fillPath();

    // Если стажёр — держит в руках ящик с кернами
    if (isIntern) {
      g.fillStyle(0x92400e, 1);
      g.fillRoundedRect(8, -38, 16, 13, 3);
    }

    worker.add(g);

    const minX = 96;
    const maxX = width - 96;
    const actor = {
      sprite: worker,
      dir: isIntern ? -1 : 1,
      speed: isIntern ? 28 : 22,
      minX,
      maxX,
      pauseTimer: isIntern ? 0.6 : 1.4,
      bobPhase: Math.random() * Math.PI * 2
    };

    const hitZone = this.add.zone(0, -34, 34, 68).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playClick();
      this.particles.emitParticleAt(worker.x, worker.y - 45, 6);
      this.tweens.add({
        targets: worker,
        y: benchY - 12,
        duration: 110,
        yoyo: true
      });
    });
    worker.add(hitZone);

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

    // Анимация ходьбы персонажей по лаборатории
    for (const actor of this.staffActors) {
      if (actor.pauseTimer > 0) {
        actor.pauseTimer -= dt;
        continue;
      }
      actor.sprite.x += actor.dir * actor.speed * dt;
      actor.sprite.scaleX = actor.dir >= 0 ? 1 : -1;
      actor.bobPhase += dt * 11;
      actor.sprite.y = this.scale.height * 0.54 - 2 - Math.abs(Math.sin(actor.bobPhase)) * 3;

      if (actor.sprite.x >= actor.maxX) {
        actor.sprite.x = actor.maxX;
        actor.dir = -1;
        actor.pauseTimer = 0.8 + Math.random() * 1.4;
      } else if (actor.sprite.x <= actor.minX) {
        actor.sprite.x = actor.minX;
        actor.dir = 1;
        actor.pauseTimer = 0.8 + Math.random() * 1.4;
      } else if (Math.random() < 0.004) {
        actor.pauseTimer = 0.7 + Math.random() * 1.2;
      }
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
