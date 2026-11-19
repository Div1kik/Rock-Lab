import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { TEST_CATALOG } from '../data/contracts.js';
import { AchievementManager } from '../utils/AchievementManager.js';
import { TutorialManager } from '../utils/TutorialManager.js';

export class TestScene extends Phaser.Scene {
  constructor() {
    super('TestScene');
  }

  init(data) {
    this.contract = data?.contract || Storage.getActiveContract();
    this.prepAccuracy = data?.prepAccuracy ?? 90;
    this.testsQueue = [...(this.contract?.tests || ['uniaxial'])];
    this.currentTestIdx = 0;
    this.scores = [];
    this.phaseActive = false;
    this.updateHandler = null;

    this.isFrozenRock = this.contract?.rock?.trait === 'frozen';
    this.coreTempC = -12.0;
    this.thawPenalty = 0;

    const staffLvl = Storage.getPerkLevel('assistant');
    const maxAuto = Storage.hasRnd('rnd_double_staff') ? 2 : 1;
    this.autoTestsRemaining = staffLvl >= 6 && this.testsQueue.length >= 2 ? maxAuto : 0;
  }

  createRockBlock(x, y, w, h) {
    return this.add.tileSprite(x, y, w, h, 'rock_tex')
      .setTint(this.contract.rock.color);
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x181e29, 1);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x222a38, 1);
    bg.fillRoundedRect(14, 96, width - 28, height - 114, 16);
    bg.lineStyle(2, 0x334155, 1);
    bg.strokeRoundedRect(14, 96, width - 28, height - 114, 16);

    this.stepTxt = this.add.text(width / 2, 24, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontWeight: '700',
      color: '#7dd3fc'
    }).setOrigin(0.5);

    this.titleTxt = this.add.text(width / 2, 50, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#f8fafc'
    }).setOrigin(0.5);

    this.subTxt = this.add.text(width / 2, 74, `${this.contract.rock.name} · ${this.contract.rock.traitLabel}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      color: this.isFrozenRock ? '#38bdf8' : '#cbd5e1'
    }).setOrigin(0.5);

    this.tempBadge = null;
    if (this.isFrozenRock) {
      this.tempBadge = this.add.text(width - 24, 108, '❄️ -12.0°C', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        fontWeight: '700',
        color: '#38bdf8',
        backgroundColor: '#0f172a',
        padding: { x: 8, y: 4 }
      }).setOrigin(1, 0).setDepth(40);
    }

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 60, max: 180 },
      scale: { start: 1.3, end: 0 },
      lifespan: 450,
      emitting: false
    }).setDepth(50);

    this.stageContainer = this.add.container(0, 0);
    this.startNextTest();
  }

  startNextTest() {
    AudioManager.stopPressHum();
    this.updateHandler = null;
    this.phaseActive = false;
    this.stageContainer.removeAll(true);

    if (this.currentTestIdx >= this.testsQueue.length) {
      this.finishAllTests();
      return;
    }

    const testKey = this.testsQueue[this.currentTestIdx];
    const meta = TEST_CATALOG[testKey] || { name: 'Испытание грунта' };

    this.stepTxt.setText(`ЭТАП 3 · СТЕНД ${this.currentTestIdx + 1} ИЗ ${this.testsQueue.length}`);
    this.titleTxt.setText(meta.name.toUpperCase());

    if (testKey !== 'uniaxial' && this.autoTestsRemaining > 0 && this.currentTestIdx < this.testsQueue.length - 1) {
      this.autoTestsRemaining -= 1;
      AudioManager.playLatchSnap();
      this.scores.push(97);

      const { width, height } = this.scale;
      const autoBanner = this.add.text(
        width / 2,
        height * 0.46,
        `👷 СТАРШИЙ ЛАБОРАНТ ВЫПОЛНИЛ СТЕНД!\n«${meta.name}»\n\nЗамер зафиксирован с точностью 97%`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '16px',
          fontWeight: '700',
          color: '#4ade80',
          backgroundColor: '#0f172af2',
          padding: { x: 20, y: 16 },
          align: 'center',
          wordWrap: { width: width - 64 },
          lineSpacing: 5
        }
      ).setOrigin(0.5).setDepth(60);

      this.stageContainer.add(autoBanner);

      this.time.delayedCall(1150, () => {
        this.currentTestIdx += 1;
        this.startNextTest();
      });
      return;
    }

    if (testKey === 'uniaxial') {
      this.buildUniaxialTest();
    } else if (testKey === 'shear_cut' || testKey === 'shear') {
      this.buildShearTest({ withVerticalLoad: false, isCrack: false });
    } else if (testKey === 'shear_crack') {
      this.buildShearTest({ withVerticalLoad: false, isCrack: true });
    } else if (testKey === 'shear_load') {
      this.buildShearTest({ withVerticalLoad: true, isCrack: false });
    } else if (testKey === 'water_sat') {
      this.buildWaterSaturationTest();
    } else if (testKey === 'frost_test') {
      this.buildFrostResistanceTest();
    } else if (testKey === 'ultrasonic') {
      this.buildUltrasonicTest();
    } else if (testKey === 'triaxial') {
      this.buildTriaxialTest();
    } else {
      this.buildUniaxialTest();
    }
  }

  spawnRockShatter(cx, cy, count = 10, spread = 95) {
    for (let i = 0; i < count; i++) {
      const w = 8 + Math.random() * 14;
      const h = 6 + Math.random() * 12;
      const shard = this.createRockBlock(
        cx + (Math.random() - 0.5) * 34,
        cy + (Math.random() - 0.5) * 44,
        w,
        h
      ).setDepth(55);

      this.stageContainer.add(shard);

      const dirX = (Math.random() - 0.5) * 2 * spread;
      const jumpY = -20 - Math.random() * 45;
      this.tweens.add({
        targets: shard,
        x: shard.x + dirX,
        y: shard.y + jumpY + 95,
        angle: (Math.random() - 0.5) * 360,
        alpha: 0,
        duration: 520 + Math.random() * 180,
        ease: 'Quad.easeIn'
      });
    }
  }

  completeCurrentTest(accuracy0to100, labelText) {
    if (!this.phaseActive) return;
    this.phaseActive = false;
    this.updateHandler = null;
    AudioManager.stopPressHum();

    const clamped = Math.max(0, Math.min(100, Math.round(accuracy0to100)));
    this.scores.push(clamped);

    const { width, height } = this.scale;
    const color = clamped >= 75 ? '#4ade80' : clamped >= 45 ? '#facc15' : '#f87171';

    const banner = this.add.text(width / 2, height * 0.48, `${labelText}\nТочность замера: ${clamped}%`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color,
      backgroundColor: '#0f172aee',
      padding: { x: 18, y: 12 },
      align: 'center'
    }).setOrigin(0.5).setDepth(60);

    this.stageContainer.add(banner);

    this.time.delayedCall(950, () => {
      this.currentTestIdx += 1;
      this.startNextTest();
    });
  }

  buildUniaxialTest() {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');
    const sensorsLvl = Storage.getUpgradeLevel('sensors');
    const hasGoldPress = Storage.hasRnd('rnd_gold_press');
    const hasAiRnd = Storage.hasRnd('rnd_ai');
    const isBrittle = this.contract?.rock?.trait === 'brittle';
    const frameColors = [0x64748b, 0x0284c9, 0x059669, 0x7c3aed, 0xbe123c, 0xd97706];
    const pressAccent = hasGoldPress ? 0xfacc15 : frameColors[Math.min(frameColors.length - 1, pressLvl - 1)];

    const hint = this.add.text(
      width / 2,
      134,
      isBrittle
        ? '⚠️ Хрупкий гранит! Узкий пик разрушения —\nотпусти пресс точно в зелёной зоне!'
        : 'Зажми пресс и отпусти в ЗЕЛЁНОЙ зоне\nпрямо перед разрушением цилиндра',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: isBrittle ? '#fca5a5' : '#e2e8f0',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2 - 18;
    const cy = 335;

    const frame = this.add.graphics();
    const colW = pressLvl >= 3 || hasGoldPress ? 22 : 18;
    frame.fillStyle(hasGoldPress ? 0xb45309 : 0x64748b, 1);
    frame.fillRect(cx - 104, cy - 124, colW, 224);
    frame.fillRect(cx + 82, cy - 124, colW, 224);
    frame.fillStyle(pressAccent, 1);
    frame.fillRoundedRect(cx - 116, cy - 142, 232, 28, 6);
    frame.fillStyle(hasGoldPress ? 0x78350f : 0x334155, 1);
    frame.fillRoundedRect(cx - 116, cy + 94, 232, 26, 6);

    if (pressLvl >= 2 || hasGoldPress) {
      frame.fillStyle(0x1e293b, 1);
      frame.fillRoundedRect(cx - 142, cy - 20, 24, 96, 8);
      frame.lineStyle(2, pressAccent, 0.9);
      frame.strokeRoundedRect(cx - 142, cy - 20, 24, 96, 8);
      frame.lineStyle(3, 0xf59e0b, 0.85);
      frame.lineBetween(cx - 130, cy - 20, cx - 130, cy - 128);
      frame.lineBetween(cx - 130, cy - 128, cx - 116, cy - 128);
    }

    if (pressLvl >= 4 || hasGoldPress) {
      frame.fillStyle(hasGoldPress ? 0xd97706 : 0x475569, 1);
      frame.fillRoundedRect(cx - 34, cy - 166, 68, 24, 5);
    }

    if (sensorsLvl >= 2 || hasAiRnd) {
      frame.fillStyle(0x38bdf8, 1);
      frame.fillRect(cx - 82, cy + 12, 8, 22);
      frame.fillRect(cx + 74, cy + 12, 8, 22);
      frame.lineStyle(1, 0x38bdf8, 0.5);
      frame.lineBetween(cx - 74, cy + 23, cx + 74, cy + 23);
    }

    const lowerPlaten = this.add.rectangle(cx, cy + 84, 118, 18, hasGoldPress ? 0xfde047 : 0x94a3b8);

    const baseCoreH = 116;
    const baseCoreW = 68;
    const coreBottomY = cy + 75;
    const core = this.createRockBlock(cx, coreBottomY - baseCoreH / 2, baseCoreW, baseCoreH);

    const piston = this.add.rectangle(cx, cy - 58, 118, 20, hasGoldPress ? 0xfacc15 : 0xf59e0b);
    const rod = this.add.rectangle(cx, cy - 96, 30, 58, hasGoldPress ? 0xfef08a : 0xcbd5e1);
    const cracks = this.add.graphics();

    const barX = width - 58;
    const barY = 215;
    const barH = 240;
    const barW = 26;

    const brittleNarrow = isBrittle ? 0.05 : 0;
    const aiExpand = hasAiRnd ? 0.04 : 0;
    const targetMin = 0.68 - Math.min(0.11, (pressLvl - 1) * 0.025) - aiExpand + brittleNarrow;
    const targetMax = 0.86 + Math.min(0.06, (pressLvl - 1) * 0.015) + aiExpand * 0.5;

    const gaugeBg = this.add.graphics();
    gaugeBg.fillStyle(0x0f172a, 1);
    gaugeBg.fillRoundedRect(barX - barW / 2, barY, barW, barH, 6);

    const greenTop = barY + barH * (1 - targetMax);
    const greenH = barH * (targetMax - targetMin);
    gaugeBg.fillStyle(0x22c55e, 0.9);
    gaugeBg.fillRect(barX - barW / 2 + 3, greenTop, barW - 6, greenH);

    gaugeBg.fillStyle(0xef4444, 0.9);
    gaugeBg.fillRect(barX - barW / 2 + 3, barY + 3, barW - 6, barH * (1 - targetMax) - 3);

    const needle = this.add.rectangle(barX, barY + barH, barW + 14, 5, 0xfacc15);
    const mpaReadout = this.add.text(cx, cy + 146, '0.0 МПа', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '20px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ПОДАЧА ПРЕССА');

    this.stageContainer.add([
      hint, frame, lowerPlaten, core, cracks, rod, piston, gaugeBg, needle, mpaReadout, btn.container
    ]);

    let load = 0;
    let holding = false;
    this.phaseActive = true;
    const speed = Math.max(0.32, 0.56 - (pressLvl - 1) * 0.045);

    btn.zone.on('pointerdown', () => { if (this.phaseActive) holding = true; });

    const releasePress = () => {
      if (!holding || !this.phaseActive) return;
      holding = false;
      AudioManager.stopPressHum();

      if (load >= 0.94 && load < 1.0) {
        AchievementManager.unlock(this, 'edge_of_rupture');
      }

      if (load >= targetMin && load <= targetMax) {
        const center = (targetMin + targetMax) / 2;
        const dist = Math.abs(load - center) / ((targetMax - targetMin) / 2);
        const acc = 100 - dist * 22;
        AudioManager.playRockCrack();
        this.particles.emitParticleAt(cx, cy + 18, 18);
        this.spawnRockShatter(cx, cy + 18, 8, 70);
        this.completeCurrentTest(acc, 'ПИК ПРОЧНОСТИ ЗАФИКСИРОВАН!');
      } else if (load < targetMin) {
        const acc = Math.max(15, (load / targetMin) * 65);
        AudioManager.playClick();
        this.completeCurrentTest(acc, 'НЕДОГРУЗ: КЕРН НЕ ДОВЕДЁН ДО ПИКА');
      } else {
        const over = (load - targetMax) / Math.max(0.05, 1 - targetMax);
        const acc = Math.max(32, Math.round(68 - over * 34));
        AudioManager.playRockCrack();
        this.particles.emitParticleAt(cx, cy + 18, 24);
        this.spawnRockShatter(cx, cy + 18, 12, 95);
        core.setAlpha(0.55);
        this.completeCurrentTest(acc, 'ПЕРЕДЕРЖКА В КРАСНОЙ ЗОНЕ!');
      }
    };

    btn.zone.on('pointerup', releasePress);
    btn.zone.on('pointerout', releasePress);

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;
      if (holding) {
        load += speed * dt;
        AudioManager.updatePressHum(load);

        const approach = Math.min(1, load / 0.12);
        const compress = Math.max(0, (load - 0.12) / 0.88);
        const curCoreH = baseCoreH - compress * 16;
        const curCoreW = baseCoreW + compress * 6;

        core.width = curCoreW;
        core.height = curCoreH;
        core.y = coreBottomY - curCoreH / 2;

        const targetPistonY = (coreBottomY - curCoreH) - 10;
        piston.y = (cy - 58) * (1 - approach) + targetPistonY * approach;
        rod.y = piston.y - 38;

        needle.y = barY + barH * (1 - Math.min(1, load));

        if (load > 0.65) {
          core.x = cx + (Math.random() - 0.5) * 3;
        }

        const displayMpa = (load * (this.contract.trueStrengthMpa / 0.77)).toFixed(1);
        mpaReadout.setText(`${displayMpa} МПа`);

        cracks.clear();
        if (load > 0.38) {
          cracks.lineStyle(2.5, 0x0f172a, 0.95);
          cracks.beginPath();
          cracks.moveTo(cx - 12, cy - 10);
          cracks.lineTo(cx + 5, cy + 20);
          if (load > 0.58) {
            cracks.lineTo(cx - 10, cy + 56);
            cracks.moveTo(cx + 14, cy + 6);
            cracks.lineTo(cx - 4, cy + 44);
          }
          cracks.strokePath();
        }

        if (load >= 1) {
          holding = false;
          AudioManager.playRockCrack();
          this.cameras.main.shake(190, 0.013);
          this.particles.emitParticleAt(cx, cy + 18, 34);
          this.spawnRockShatter(cx, cy + 18, 18, 130);
          core.setAlpha(0.15);
          this.completeCurrentTest(20, 'ПЕРЕГРУЗ! ОБРАЗЕЦ РАЗРУШЕН В ПЫЛЬ');
        }
      }
    };

    if (TutorialManager.isActive()) {
      TutorialManager.advanceTo(6);
      TutorialManager.showSpotlight(this, {
        hole: { x: width / 2, y: height - 110, w: 326, h: 88 },
        cardY: 196,
        badge: 'ШАГ 7/8 · ГИДРАВЛИЧЕСКИЙ ПРЕСС',
        text: 'Зажми подачу давления и ОТПУСТИ кнопку, когда жёлтая\nстрелка на шкале справа попадёт в ЗЕЛЁНУЮ зону!'
      });
    }
  }

  buildShearTest({ withVerticalLoad, isCrack }) {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');
    const totalHitsNeeded = withVerticalLoad ? 2 : 3;

    const hintText = isCrack
      ? 'Срез по неровной трещине (сколу): лови пик\nсопротивления в зелёной зоне (×3)'
      : withVerticalLoad
        ? 'Сначала зажми вертикальный прижим (σ),\nзатем поймай срез двух шайб в зелёной зоне (×2)'
        : 'Срез по гладкому распилу двух шайб:\nфиксируй сдвиг в зелёной зоне (×3)';

    const hint = this.add.text(width / 2, 134, hintText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      color: '#e2e8f0',
      align: 'center'
    }).setOrigin(0.5);

    const cx = width / 2;
    const cy = 310;

    const lowerBox = this.add.rectangle(cx, cy + 24, 184, 42, 0x475569).setStrokeStyle(2, 0x0f172a);
    const lowerCore = this.createRockBlock(cx, cy + 12, 142, 24);
    const upperCore = this.createRockBlock(cx, cy - 12, 142, 24);
    const upperBox = this.add.rectangle(cx, cy - 24, 184, 42, isCrack ? 0xb45309 : 0x64748b).setStrokeStyle(2, 0x0f172a);
    const clampPlate = this.add.rectangle(cx, cy - 72, 136, 18, 0x38bdf8);

    const seamG = this.add.graphics();
    if (isCrack) {
      seamG.lineStyle(3, 0xfacc15, 0.95);
      seamG.beginPath();
      seamG.moveTo(cx - 72, cy);
      for (let sx = -60; sx <= 72; sx += 16) {
        seamG.lineTo(cx + sx, cy + (sx % 32 === 0 ? -5 : 5));
      }
      seamG.strokePath();
    } else {
      seamG.lineStyle(2, 0x38bdf8, 0.9);
      seamG.lineBetween(cx - 74, cy, cx + 74, cy);
    }

    const trackW = 330;
    const trackH = 34;
    const trackX = width / 2 - trackW / 2;
    const trackY = 435;

    const trackBg = this.add.graphics();
    const zoneGraphic = this.add.graphics();
    const slider = this.add.rectangle(width / 2, trackY + trackH / 2, 10, trackH + 12, 0xfef3c7);

    const statusTxt = this.add.text(width / 2, 495, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fde68a'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, '');

    this.stageContainer.add([
      hint, lowerBox, lowerCore, upperCore, upperBox, seamG, clampPlate,
      trackBg, zoneGraphic, slider, statusTxt, btn.container
    ]);

    let mode = withVerticalLoad ? 'clamp' : 'slide';
    let clampVal = 0;
    let clampHolding = false;

    let hitsDone = 0;
    let hitAccuracies = [];
    let sliderPos = 0;
    let sliderDir = 1;
    let zoneStart = 0.35;
    let zoneWidth = Math.min(0.36, (isCrack ? 0.21 : 0.25) + (pressLvl - 1) * 0.025);

    const redrawTrack = () => {
      trackBg.clear();
      trackBg.fillStyle(0x0f172a, 1);
      trackBg.fillRoundedRect(trackX, trackY, trackW, trackH, 8);
      trackBg.lineStyle(2, 0x475569, 1);
      trackBg.strokeRoundedRect(trackX, trackY, trackW, trackH, 8);

      zoneGraphic.clear();
      zoneGraphic.fillStyle(mode === 'clamp' ? 0x38bdf8 : isCrack ? 0xf59e0b : 0x22c55e, 0.9);
      zoneGraphic.fillRect(
        trackX + trackW * zoneStart,
        trackY + 3,
        trackW * zoneWidth,
        trackH - 6
      );
    };

    const setupNextSlidePass = () => {
      mode = 'slide';
      const baseW = isCrack ? 0.21 : 0.25;
      zoneWidth = Math.max(0.13, (baseW + (pressLvl - 1) * 0.02) - hitsDone * 0.03);
      zoneStart = 0.15 + Math.random() * (0.7 - zoneWidth);
      statusTxt.setText(`${isCrack ? 'Скол' : 'Срез'}: ${hitsDone} / ${totalHitsNeeded}`);
      btn.setLabel(isCrack ? 'ТАП: СДВИГ ПО ТРЕЩИНЕ' : 'ТАП: СДВИГ ПО РАСПИЛУ');
      redrawTrack();
    };

    if (mode === 'clamp') {
      zoneStart = 0.62;
      zoneWidth = 0.22;
      statusTxt.setText('Фаза 1: Вертикальное обжатие σ');
      btn.setLabel('УДЕРЖИВАТЬ: ПРИЖИМ');
      redrawTrack();
    } else {
      setupNextSlidePass();
    }

    this.phaseActive = true;

    btn.zone.on('pointerdown', () => {
      if (!this.phaseActive) return;

      if (mode === 'clamp') {
        clampHolding = true;
        return;
      }

      const zoneCenter = zoneStart + zoneWidth / 2;
      const half = zoneWidth / 2;
      const dist = Math.abs(sliderPos - zoneCenter);

      let passScore = 0;
      if (dist <= half) {
        passScore = 100 - (dist / half) * 25;
        AudioManager.playLatchSnap();
      } else {
        passScore = Math.max(10, 60 - (dist - half) * 140);
        AudioManager.playClick();
      }

      hitAccuracies.push(passScore);
      hitsDone += 1;

      upperBox.x = cx + hitsDone * 14;
      upperCore.x = cx + hitsDone * 14;
      this.particles.emitParticleAt(cx, cy, 12);
      this.spawnRockShatter(cx + hitsDone * 10, cy, 4, 45);

      if (hitsDone >= totalHitsNeeded) {
        const avg = hitAccuracies.reduce((a, b) => a + b, 0) / hitAccuracies.length;
        this.completeCurrentTest(avg, isCrack ? 'СРЕЗ ПО ТРЕЩИНЕ ЗАФИКСИРОВАН!' : 'СРЕЗ ПО РАСПИЛУ ЗАВЕРШЁН!');
      } else {
        setupNextSlidePass();
      }
    });

    btn.zone.on('pointerup', () => {
      if (mode === 'clamp' && clampHolding && this.phaseActive) {
        clampHolding = false;
        AudioManager.stopPressHum();
        const zoneCenter = zoneStart + zoneWidth / 2;
        const dist = Math.abs(clampVal - zoneCenter);
        const clampScore = dist <= zoneWidth / 2 ? 95 : Math.max(30, 80 - dist * 120);
        hitAccuracies.push(clampScore);
        AudioManager.playLatchSnap();
        setupNextSlidePass();
      }
    });

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;

      if (mode === 'clamp') {
        if (clampHolding) {
          clampVal = Math.min(1, clampVal + 0.65 * dt);
          AudioManager.updatePressHum(clampVal);
          clampPlate.y = cy - 72 + clampVal * 26;
          slider.x = trackX + trackW * clampVal;
          if (clampVal >= 1) {
            clampHolding = false;
            AudioManager.stopPressHum();
            hitAccuracies.push(35);
            setupNextSlidePass();
          }
        }
        return;
      }

      const crackBonusSpeed = isCrack ? 0.14 : 0;
      const baseSpeed = Math.max(0.75, 1.12 - (pressLvl - 1) * 0.08) + hitsDone * 0.18 + crackBonusSpeed;
      sliderPos += sliderDir * baseSpeed * dt;
      if (sliderPos >= 1) {
        sliderPos = 1;
        sliderDir = -1;
      } else if (sliderPos <= 0) {
        sliderPos = 0;
        sliderDir = 1;
      }
      slider.x = trackX + trackW * sliderPos;
    };
  }

  buildWaterSaturationTest() {
    const { width, height } = this.scale;
    const sensorsLvl = Storage.getUpgradeLevel('sensors');

    const hint = this.add.text(
      width / 2,
      134,
      'Зажми подачу воды в вакуумную ванну — насыть керн\nровно до отметки 100% на электронных весах!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e2e8f0',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 296;

    const scaleBase = this.add.graphics();
    scaleBase.fillStyle(0x475569, 1);
    scaleBase.fillRoundedRect(cx - 110, cy + 68, 220, 46, 8);
    scaleBase.fillStyle(0x0f172a, 1);
    scaleBase.fillRoundedRect(cx - 82, cy + 77, 164, 28, 5);

    const tankW = 152;
    const tankH = 134;
    const tankLeftX = cx - tankW / 2;
    const tankTopY = cy - 68;
    const tankBottomY = tankTopY + tankH;

    const tankBg = this.add.graphics();
    tankBg.fillStyle(0x0f172a, 0.85);
    tankBg.fillRect(tankLeftX, tankTopY, tankW, tankH);

    const core = this.createRockBlock(cx, cy + 16, 62, 92);

    const waterG = this.add.graphics();
    const tankBorder = this.add.graphics();
    tankBorder.lineStyle(3, 0x38bdf8, 0.95);
    tankBorder.strokeRect(tankLeftX, tankTopY, tankW, tankH);

    const drawWater = (ratio, activeBubbles) => {
      waterG.clear();
      const innerX = tankLeftX + 2;
      const innerW = tankW - 4;
      const maxH = tankH - 4;
      const curH = Math.max(4, Math.min(maxH, ratio * maxH));
      const topY = tankBottomY - 2 - curH;

      waterG.fillStyle(0x0ea5e9, 0.5);
      waterG.fillRect(innerX, topY, innerW, curH);
      waterG.lineStyle(2, 0x7dd3fc, 0.9);
      waterG.lineBetween(innerX, topY, innerX + innerW, topY);

      if (activeBubbles && curH > 28) {
        waterG.fillStyle(0xe0f2fe, 0.9);
        for (let b = 0; b < 5; b++) {
          const bx = cx + (Math.random() - 0.5) * 58;
          const by = tankBottomY - 10 - Math.random() * (curH - 14);
          waterG.fillCircle(bx, by, 2 + Math.random() * 2);
        }
      }
    };
    drawWater(0.03, false);

    const weightLcd = this.add.text(cx, cy + 91, 'm₀ = 412.0 г (Сухой)', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const barW = 320;
    const barX = width / 2 - barW / 2;
    const barY = 445;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0f172a, 1);
    barBg.fillRoundedRect(barX, barY, barW, 28, 8);

    const tol = 0.14 + (sensorsLvl - 1) * 0.02;
    barBg.fillStyle(0x22c55e, 0.9);
    barBg.fillRect(barX + barW * (0.78 - tol / 2), barY + 3, barW * tol, 22);

    const marker = this.add.rectangle(barX + 6, barY + 14, 10, 34, 0xfacc15);
    const statusTxt = this.add.text(width / 2, 496, 'Водопоглощение W: 0.0%', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fde68a'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: НАСЫЩЕНИЕ ВОДОЙ');

    this.stageContainer.add([
      hint, scaleBase, tankBg, core, waterG, tankBorder, weightLcd, barBg, marker, statusTxt, btn.container
    ]);

    let sat = 0;
    let holding = false;
    this.phaseActive = true;

    btn.zone.on('pointerdown', () => { if (this.phaseActive) holding = true; });

    const releaseWater = () => {
      if (!holding || !this.phaseActive) return;
      holding = false;
      AudioManager.stopPressHum();

      const diff = Math.abs(sat - 0.78);
      const acc = diff <= tol / 2 ? 100 - (diff / (tol / 2)) * 20 : Math.max(25, 80 - diff * 130);
      AudioManager.playLatchSnap();
      this.completeCurrentTest(acc, 'КОЭФФИЦИЕНТ РАЗМЯГЧЕНИЯ ЗАМЕРЕН!');
    };

    btn.zone.on('pointerup', releaseWater);
    btn.zone.on('pointerout', releaseWater);

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;
      if (holding) {
        sat += 0.52 * dt;
        AudioManager.updatePressHum(sat * 0.7);
        drawWater(Math.min(1, sat), true);
        marker.x = barX + barW * Math.min(1, sat);

        const wPct = (sat * 6.4).toFixed(2);
        const mass = (412 + sat * 26.4).toFixed(1);
        weightLcd.setText(`m₁ = ${mass} г`);
        statusTxt.setText(`Водопоглощение W: ${wPct}%`);

        if (sat >= 1) {
          holding = false;
          AudioManager.stopPressHum();
          this.completeCurrentTest(30, 'ПЕРЕЛИВ ВАННЫ! ПОГРЕШНОСТЬ ВЗВЕШИВАНИЯ');
        }
      }
    };
  }

  buildFrostResistanceTest() {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');

    const hint = this.add.text(
      width / 2,
      134,
      'Быстрыми тапами нагони холод в криокамере до -20°C,\nзатем удерживай режим заморозки 2.5 сек!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e2e8f0',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 305;

    const chamber = this.add.graphics();
    chamber.fillStyle(0x082f49, 1);
    chamber.fillRoundedRect(cx - 96, cy - 105, 192, 195, 16);
    chamber.lineStyle(5, 0x38bdf8, 0.95);
    chamber.strokeRoundedRect(cx - 96, cy - 105, 192, 195, 16);

    const core = this.createRockBlock(cx, cy, 74, 114);
    const iceFx = this.add.graphics();

    const barW = 320;
    const barX = width / 2 - barW / 2;
    const barY = 445;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0f172a, 1);
    barBg.fillRoundedRect(barX, barY, barW, 28, 8);

    barBg.fillStyle(0x38bdf8, 0.9);
    barBg.fillRect(barX + barW * 0.68, barY + 3, barW * 0.24, 22);

    const marker = this.add.rectangle(barX + 6, barY + 14, 10, 34, 0xfacc15);
    const tempTxt = this.add.text(width / 2, 496, 'Камера: +18.0°C', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '16px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, 'ТАПАЙ: ВКЛЮЧИТЬ КОМПРЕССОР!');

    this.stageContainer.add([
      hint, chamber, core, iceFx, barBg, marker, tempTxt, btn.container
    ]);

    let phase = 'cool';
    let coldRatio = 0;
    let holdTimer = 0;
    const holdReq = 2.5;
    let inZoneTime = 0;
    let holding = false;
    this.phaseActive = true;

    const renderIceVisuals = (ratio) => {
      iceFx.clear();
      if (ratio <= 0.08) return;

      iceFx.fillStyle(0xe0f2fe, ratio * 0.52);
      iceFx.fillRoundedRect(cx - 38, cy - 58, 76, 116, 6);

      iceFx.lineStyle(2, 0xbae6fd, ratio * 0.95);
      const spikes = Math.floor(ratio * 10);
      for (let i = 0; i < spikes; i++) {
        const sy = cy - 48 + i * 11;
        iceFx.lineBetween(cx - 38, sy, cx - 50 - ratio * 8, sy - 4);
        iceFx.lineBetween(cx + 38, sy, cx + 50 + ratio * 8, sy - 4);
      }

      iceFx.fillStyle(0xffffff, ratio * 0.9);
      for (let s = 0; s < 14; s++) {
        const sx = cx - 80 + ((s * 37 + Math.floor(ratio * 120)) % 160);
        const sy = cy - 90 + ((s * 53 + Math.floor(ratio * 240)) % 175);
        iceFx.fillCircle(sx, sy, 2);
      }
    };

    btn.zone.on('pointerdown', () => {
      if (!this.phaseActive) return;
      if (phase === 'cool') {
        coldRatio = Math.min(1, coldRatio + 0.12);
        AudioManager.playDrillTick();
        if (coldRatio >= 0.72) {
          phase = 'hold';
          AudioManager.playLatchSnap();
          hint.setText('Температура -20°C достигнута! Удерживай\nтермостат в голубой зоне 2.5 сек!');
          btn.setLabel('УДЕРЖИВАТЬ: ТЕРМОСТАТ -20°C');
        }
      } else {
        holding = true;
      }
    });

    btn.zone.on('pointerup', () => { holding = false; });
    btn.zone.on('pointerout', () => { holding = false; });

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;

      if (phase === 'cool') {
        coldRatio = Math.max(0, coldRatio - 0.2 * dt);
        renderIceVisuals(coldRatio);
        marker.x = barX + barW * coldRatio;
        const deg = (18 - coldRatio * 43).toFixed(1);
        tempTxt.setText(`Камера: ${deg > 0 ? '+' + deg : deg}°C`);
        return;
      }

      holdTimer += dt;
      const drift = Math.max(0.24, 0.36 - (pressLvl - 1) * 0.03);
      coldRatio = holding
        ? Math.min(1, coldRatio + drift * 1.35 * dt)
        : Math.max(0, coldRatio - drift * dt);

      renderIceVisuals(coldRatio);
      marker.x = barX + barW * coldRatio;
      const deg = (18 - coldRatio * 43).toFixed(1);
      tempTxt.setText(`Заморозка (${Math.max(0, holdReq - holdTimer).toFixed(1)}с): ${deg}°C`);

      if (coldRatio >= 0.68 && coldRatio <= 0.92) {
        inZoneTime += dt;
      }

      if (holdTimer >= holdReq) {
        const acc = 35 + (inZoneTime / holdReq) * 65;
        AudioManager.playLatchSnap();
        this.particles.emitParticleAt(cx, cy, 18);
        this.completeCurrentTest(acc, 'ЦИКЛ МОРОЗОСТОЙКОСТИ F200 ПРОЙДЕН!');
      }
    };
  }

  buildUltrasonicTest() {
    const { width, height } = this.scale;
    const sensorsLvl = Storage.getUpgradeLevel('sensors');

    const hint = this.add.text(
      width / 2,
      134,
      'Зажми кнопку генератора импульсов — поймай\nрезонанс ультразвуковой волны на осциллографе!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e2e8f0',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 260;

    const leftSensor = this.add.rectangle(cx - 95, cy, 26, 56, 0x38bdf8).setStrokeStyle(2, 0x0f172a);
    const rightSensor = this.add.rectangle(cx + 95, cy, 26, 56, 0x38bdf8).setStrokeStyle(2, 0x0f172a);
    const core = this.createRockBlock(cx, cy, 160, 64);

    const scopeW = 340;
    const scopeH = 130;
    const scopeX = cx - scopeW / 2;
    const scopeY = 330;

    const scopeBg = this.add.graphics();
    scopeBg.fillStyle(0x090d16, 1);
    scopeBg.fillRoundedRect(scopeX, scopeY, scopeW, scopeH, 10);
    scopeBg.lineStyle(2, 0x38bdf8, 0.85);
    scopeBg.strokeRoundedRect(scopeX, scopeY, scopeW, scopeH, 10);

    const targetAmp = 0.72;
    const tol = 0.12 + (sensorsLvl - 1) * 0.02;
    scopeBg.fillStyle(0x22c55e, 0.25);
    scopeBg.fillRect(scopeX + 4, scopeY + scopeH * (1 - targetAmp - tol) / 2, scopeW - 8, scopeH * tol);

    const waveGraphics = this.add.graphics();
    const vpReadout = this.add.text(cx, 482, 'Скорость волны Vp: 0 м/с', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '16px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ИМПУЛЬС УЗК');

    this.stageContainer.add([
      hint, leftSensor, rightSensor, core, scopeBg, waveGraphics, vpReadout, btn.container
    ]);

    let freq = 0;
    let holding = false;
    let phaseShift = 0;
    this.phaseActive = true;

    btn.zone.on('pointerdown', () => { if (this.phaseActive) holding = true; });

    const releasePulse = () => {
      if (!holding || !this.phaseActive) return;
      holding = false;
      AudioManager.stopPressHum();

      const diff = Math.abs(freq - targetAmp);
      const acc = diff <= tol ? 100 - (diff / tol) * 20 : Math.max(25, 75 - diff * 130);
      AudioManager.playLatchSnap();
      this.completeCurrentTest(acc, 'ПРОЗВУЧИВАНИЕ УЗК ЗАВЕРШЕНО!');
    };

    btn.zone.on('pointerup', releasePulse);
    btn.zone.on('pointerout', releasePulse);

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;
      phaseShift += dt * 12;

      if (holding) {
        freq = Math.min(1, freq + 0.58 * dt);
        AudioManager.updatePressHum(freq * 0.8);
      } else {
        freq = Math.max(0.08, freq - 0.35 * dt);
      }

      const vp = Math.round(1800 + freq * 3600);
      vpReadout.setText(`Скорость волны Vp: ${vp} м/с`);

      waveGraphics.clear();
      const inZone = Math.abs(freq - targetAmp) <= tol;
      waveGraphics.lineStyle(3, inZone ? 0x4ade80 : 0x38bdf8, 1);
      waveGraphics.beginPath();

      const midY = scopeY + scopeH / 2;
      const ampPx = (scopeH * 0.44) * freq;
      for (let x = 0; x <= scopeW - 16; x += 6) {
        const y = midY + Math.sin(x * 0.06 + phaseShift) * ampPx;
        if (x === 0) waveGraphics.moveTo(scopeX + 8 + x, y);
        else waveGraphics.lineTo(scopeX + 8 + x, y);
      }
      waveGraphics.strokePath();

      if (freq >= 1) {
        holding = false;
        AudioManager.stopPressHum();
        this.completeCurrentTest(35, 'ПЕРЕГРУЗ ДАТЧИКА УЗК!');
      }
    };
  }

  buildTriaxialTest() {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');
    const hasAiRnd = Storage.hasRnd('rnd_ai');

    const hint = this.add.text(
      width / 2,
      130,
      'Фаза 1: Быстрыми тапами накачай боковой обжим (σ₃)\nот гидронасоса в камеру стабилометра!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e2e8f0',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2 + 12;
    const cy = 310;

    const pressFrame = this.add.graphics();
    pressFrame.fillStyle(0x64748b, 1);
    pressFrame.fillRect(cx - 122, cy - 135, 16, 250);
    pressFrame.fillRect(cx + 106, cy - 135, 16, 250);
    pressFrame.fillStyle(0x0284c9, 1);
    pressFrame.fillRoundedRect(cx - 134, cy - 150, 268, 22, 6);
    pressFrame.fillStyle(0x334155, 1);
    pressFrame.fillRoundedRect(cx - 134, cy + 108, 268, 22, 6);

    const pumpG = this.add.graphics();
    pumpG.fillStyle(0x334155, 1);
    pumpG.fillRoundedRect(26, cy + 28, 56, 86, 8);
    pumpG.lineStyle(2, 0x38bdf8, 0.8);
    pumpG.strokeRoundedRect(26, cy + 28, 56, 86, 8);
    pumpG.fillStyle(0x0f172a, 1);
    pumpG.fillCircle(54, cy + 52, 14);
    pumpG.lineStyle(2, 0xfacc15, 1);
    pumpG.lineBetween(54, cy + 52, 62, cy + 44);
    pumpG.lineStyle(5, 0x38bdf8, 0.85);
    pumpG.beginPath();
    pumpG.moveTo(82, cy + 72);
    pumpG.lineTo(cx - 68, cy + 72);
    pumpG.strokePath();

    const cellW = 136;
    const cellH = 168;
    const cellLeftX = cx - cellW / 2;
    const cellTopY = cy - 84;
    const cellBottomY = cellTopY + cellH;

    const cellBg = this.add.graphics();
    cellBg.fillStyle(0x090d16, 0.94);
    cellBg.fillRect(cellLeftX, cellTopY, cellW, cellH);

    const fluidG = this.add.graphics();
    const drawCellFluid = (ratio) => {
      fluidG.clear();
      const innerX = cellLeftX + 2;
      const innerW = cellW - 4;
      const maxH = cellH - 4;
      const curH = Math.max(4, Math.min(maxH, ratio * maxH));
      const topY = cellBottomY - 2 - curH;

      fluidG.fillStyle(0x0284c9, 0.45);
      fluidG.fillRect(innerX, topY, innerW, curH);
      fluidG.lineStyle(2, 0x38bdf8, 0.9);
      fluidG.lineBetween(innerX, topY, innerX + innerW, topY);
    };
    drawCellFluid(0.03);

    const cellFrame = this.add.graphics();
    cellFrame.lineStyle(4, 0x94a3b8, 0.95);
    cellFrame.strokeRect(cellLeftX, cellTopY, cellW, cellH);
    cellFrame.fillStyle(0x64748b, 1);
    cellFrame.fillRect(cellLeftX - 8, cellTopY - 12, 6, cellH + 24);
    cellFrame.fillRect(cellLeftX + cellW + 2, cellTopY - 12, 6, cellH + 24);
    cellFrame.fillStyle(0x475569, 1);
    cellFrame.fillRoundedRect(cellLeftX - 14, cellTopY - 14, cellW + 28, 16, 5);
    cellFrame.fillRoundedRect(cellLeftX - 14, cellBottomY - 2, cellW + 28, 16, 5);

    const pedestal = this.add.rectangle(cx, cellBottomY - 14, 62, 20, 0x64748b);
    const coreH = 84;
    const coreW = 46;
    const coreBottomY = cellBottomY - 24;
    const core = this.createRockBlock(cx, coreBottomY - coreH / 2, coreW, coreH);
    const membrane = this.add.rectangle(cx, coreBottomY - coreH / 2, coreW + 2, coreH)
      .setStrokeStyle(2, 0x1e293b, 0.95);

    const sideArrows = this.add.graphics();

    const pistonStartY = cy - 34;
    const axialCap = this.add.rectangle(cx, pistonStartY, 56, 14, 0xf59e0b);
    const axialRod = this.add.rectangle(cx, pistonStartY - 46, 20, 82, 0xe2e8f0);

    const barW = 320;
    const barX = width / 2 - barW / 2;
    const barY = 456;
    const barBg = this.add.graphics();
    const marker = this.add.rectangle(barX + 6, barY + 14, 10, 34, 0xfacc15);

    const statusTxt = this.add.text(width / 2, 504, 'Боковой обжим σ₃: 0 кПа', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, 'ТАПАЙ: НАКАЧАТЬ ОБЖИМ σ₃');

    this.stageContainer.add([
      hint, pressFrame, pumpG, cellBg, fluidG, cellFrame, pedestal, core, membrane,
      sideArrows, axialRod, axialCap, barBg, marker, statusTxt, btn.container
    ]);

    let phase = 'confine';
    let sigma3 = 0;
    let axialLoad = 0;
    let holdingAxial = false;

    const aiExpand = hasAiRnd ? 0.04 : 0;
    const axialTargetMin = 0.68 - Math.min(0.1, (pressLvl - 1) * 0.02) - aiExpand;
    const axialTargetMax = 0.87 + Math.min(0.05, (pressLvl - 1) * 0.015) + aiExpand * 0.5;

    const drawGauge = (isAxialMode) => {
      barBg.clear();
      barBg.fillStyle(0x0f172a, 1);
      barBg.fillRoundedRect(barX, barY, barW, 28, 8);
      if (!isAxialMode) {
        barBg.fillStyle(0x38bdf8, 0.9);
        barBg.fillRect(barX + barW * 0.68, barY + 3, barW * 0.24, 22);
      } else {
        barBg.fillStyle(0x22c55e, 0.9);
        barBg.fillRect(barX + barW * axialTargetMin, barY + 3, barW * (axialTargetMax - axialTargetMin), 22);
        barBg.fillStyle(0xef4444, 0.9);
        barBg.fillRect(barX + barW * axialTargetMax, barY + 3, barW * (1 - axialTargetMax) - 3, 22);
      }
    };

    drawGauge(false);
    this.phaseActive = true;

    btn.zone.on('pointerdown', () => {
      if (!this.phaseActive || phase === 'transition_pause') return;

      if (phase === 'confine') {
        sigma3 = Math.min(1, sigma3 + 0.135);
        AudioManager.playDrillTick();
        if (sigma3 >= 0.74) {
          phase = 'transition_pause';
          AudioManager.playLatchSnap();

          const toast = this.add.text(
            width / 2,
            cy - 10,
            '✓ БОКОВОЙ ОБЖИМ σ₃ ЗАДАН!\nПодготовка осевого пресса…',
            {
              fontFamily: '"Rubik", sans-serif',
              fontSize: '15px',
              fontWeight: '700',
              color: '#4ade80',
              backgroundColor: '#0f172aee',
              padding: { x: 14, y: 10 },
              align: 'center'
            }
          ).setOrigin(0.5).setDepth(55);
          this.stageContainer.add(toast);
          btn.setLabel('⏳ ПЕРЕКЛЮЧЕНИЕ НА ПРЕСС…');

          this.time.delayedCall(1100, () => {
            if (!this.phaseActive) return;
            toast.destroy();
            phase = 'axial';
            drawGauge(true);
            marker.x = barX + 6;
            hint.setText('Фаза 2: Зажми осевой пресс (σ₁) и отпусти\nв ЗЕЛЁНОЙ зоне пика разрушения!');
            btn.setLabel('УДЕРЖИВАТЬ: ОСЕВОЙ ПРЕСС σ₁');
          });
        }
      } else if (phase === 'axial') {
        holdingAxial = true;
      }
    });

    const releaseAxial = () => {
      if (phase !== 'axial' || !holdingAxial || !this.phaseActive) return;
      holdingAxial = false;
      AudioManager.stopPressHum();

      if (axialLoad >= 0.94 && axialLoad < 1.0) {
        AchievementManager.unlock(this, 'edge_of_rupture');
      }

      if (axialLoad >= axialTargetMin && axialLoad <= axialTargetMax) {
        const center = (axialTargetMin + axialTargetMax) / 2;
        const dist = Math.abs(axialLoad - center) / ((axialTargetMax - axialTargetMin) / 2);
        const acc = 100 - dist * 20;
        AudioManager.playRockCrack();
        this.particles.emitParticleAt(cx, cy + 16, 18);
        this.spawnRockShatter(cx, cy + 16, 7, 50);
        this.completeCurrentTest(acc, 'ТРЁХОСНОЕ РАЗРУШЕНИЕ ЗАФИКСИРОВАНО!');
      } else if (axialLoad < axialTargetMin) {
        const acc = Math.max(20, (axialLoad / axialTargetMin) * 65);
        AudioManager.playClick();
        this.completeCurrentTest(acc, 'НЕДОГРУЗ ПО ОСИ σ₁!');
      } else {
        const over = (axialLoad - axialTargetMax) / Math.max(0.05, 1 - axialTargetMax);
        const acc = Math.max(35, Math.round(70 - over * 32));
        AudioManager.playRockCrack();
        this.particles.emitParticleAt(cx, cy + 16, 20);
        this.spawnRockShatter(cx, cy + 16, 9, 55);
        this.completeCurrentTest(acc, 'ПЕРЕДЕРЖКА ПО ОСИ σ₁!');
      }
    };

    btn.zone.on('pointerup', releaseAxial);
    btn.zone.on('pointerout', releaseAxial);

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;

      if (phase === 'confine') {
        sigma3 = Math.max(0, sigma3 - 0.16 * dt);
        drawCellFluid(sigma3);
        marker.x = barX + barW * sigma3;
        statusTxt.setText(`Боковой обжим σ₃: ${Math.round(sigma3 * 600)} кПа`);

        sideArrows.clear();
        if (sigma3 > 0.25) {
          sideArrows.lineStyle(2, 0x38bdf8, 0.9);
          [-8, 16, 40].forEach((dy) => {
            sideArrows.lineBetween(cx - 56, cy + dy, cx - 32, cy + dy);
            sideArrows.lineBetween(cx + 56, cy + dy, cx + 32, cy + dy);
          });
        }
        return;
      }

      if (phase === 'transition_pause') {
        return;
      }

      if (holdingAxial) {
        const axialSpeed = Math.max(0.34, 0.54 - (pressLvl - 1) * 0.04);
        axialLoad += axialSpeed * dt;
        AudioManager.updatePressHum(axialLoad);

        const approach = Math.min(1, axialLoad / 0.1);
        const compress = Math.max(0, (axialLoad - 0.1) / 0.9);
        const curCoreH = coreH - compress * 12;
        const curCoreW = coreW + compress * 4;

        core.width = curCoreW;
        core.height = curCoreH;
        core.y = coreBottomY - curCoreH / 2;
        membrane.width = curCoreW + 2;
        membrane.height = curCoreH;
        membrane.y = core.y;

        const targetCapY = (coreBottomY - curCoreH) - 7;
        axialCap.y = pistonStartY * (1 - approach) + targetCapY * approach;
        axialRod.y = axialCap.y - 46;
        marker.x = barX + barW * Math.min(1, axialLoad);

        const devMpa = (axialLoad * (this.contract.trueStrengthMpa / 0.77)).toFixed(1);
        statusTxt.setText(`Обжим σ₃: 450 кПа | Ось σ₁: ${devMpa} МПа`);
        statusTxt.setColor('#facc15');

        if (axialLoad >= 1) {
          holdingAxial = false;
          AudioManager.stopPressHum();
          AudioManager.playRockCrack();
          this.cameras.main.shake(170, 0.011);
          this.particles.emitParticleAt(cx, cy + 16, 28);
          this.spawnRockShatter(cx, cy + 16, 12, 60);
          core.setAlpha(0.25);
          this.completeCurrentTest(25, 'СМЯТИЕ ОБРАЗЦА В КАМЕРЕ!');
        }
      }
    };
  }

  createHoldButton(x, y, w, h, label) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    const draw = (pressed) => {
      bg.clear();
      const oy = pressed ? 3 : 0;
      bg.fillStyle(0x000000, 0.45);
      bg.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 14);
      bg.fillStyle(pressed ? 0xb45309 : 0xd97706, 1);
      bg.fillRoundedRect(-w / 2, -h / 2 + oy, w, h, 14);
      bg.lineStyle(2, 0xfef3c7, 0.35);
      bg.strokeRoundedRect(-w / 2, -h / 2 + oy, w, h, 14);
    };

    draw(false);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    const zone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { draw(true); txt.y = 3; });
    zone.on('pointerup', () => { draw(false); txt.y = 0; });
    zone.on('pointerout', () => { draw(false); txt.y = 0; });

    container.add([bg, txt, zone]);

    return {
      container,
      zone,
      setLabel: (newText) => txt.setText(newText)
    };
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.isFrozenRock && this.tempBadge) {
      const cryoLvl = Storage.getPerkLevel('cryobox');
      const warmRate = 0.42 / (1 + cryoLvl * 0.65);
      this.coreTempC = Math.min(2.0, this.coreTempC + warmRate * dt);
      const tStr = this.coreTempC > 0 ? `+${this.coreTempC.toFixed(1)}` : this.coreTempC.toFixed(1);
      this.tempBadge.setText(`❄️ ${tStr}°C`);
      if (this.coreTempC >= -2.0) {
        this.tempBadge.setColor('#f87171');
        this.thawPenalty = 12;
      }
    }

    if (this.updateHandler) {
      this.updateHandler(dt);
    }
  }

  finishAllTests() {
    TutorialManager.clear(this);

    if (this.isFrozenRock && this.coreTempC <= -9.5) {
      AchievementManager.unlock(this, 'ice_nerves');
    }

    const sensorsLvl = Storage.getUpgradeLevel('sensors');
    const calPct = Storage.getWear('calibration');
    const calDriftPenalty = Math.round(((100 - calPct) / 100) * 8);
    const aiBonus = Storage.hasRnd('rnd_ai') ? 3 : 0;

    const testsAvg = this.scores.length
      ? this.scores.reduce((a, b) => a + b, 0) / this.scores.length
      : 70;

    const avgAccuracy = Math.max(15, Math.round(testsAvg * 0.75 + this.prepAccuracy * 0.25 - this.thawPenalty));

    const rawErrorPct = Math.max(2, Math.round((100 - avgAccuracy) * 0.42 - (sensorsLvl - 1) * 2.5 - aiBonus + calDriftPenalty));
    const errorPct = Math.max(2, Math.min(38, rawErrorPct));

    const sign = Math.random() < 0.5 ? -1 : 1;
    const distortion = (errorPct / 100) * (0.4 + Math.random() * 0.6) * sign;
    const measuredMpa = Math.max(5, Math.round(this.contract.trueStrengthMpa * (1 + distortion)));

    this.scene.start('ReportScene', {
      contract: this.contract,
      avgAccuracy,
      errorPct,
      measuredMpa
    });
  }
}
