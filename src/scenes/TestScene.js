import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { TEST_CATALOG } from '../data/contracts.js';

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
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x292524, 1);
    bg.fillRoundedRect(14, 96, width - 28, height - 114, 16);
    bg.lineStyle(2, 0x44403c, 1);
    bg.strokeRoundedRect(14, 96, width - 28, height - 114, 16);

    this.stepTxt = this.add.text(width / 2, 26, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.titleTxt = this.add.text(width / 2, 54, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '20px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0.5);

    this.subTxt = this.add.text(width / 2, 78, `${this.contract.rock.name} · ${this.contract.title}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#a8a29e'
    }).setOrigin(0.5);

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

    if (testKey === 'uniaxial') {
      this.buildUniaxialTest();
    } else if (testKey === 'shear') {
      this.buildShearTest(false);
    } else if (testKey === 'shear_load') {
      this.buildShearTest(true);
    } else if (testKey === 'triaxial') {
      this.buildTriaxialTest();
    } else {
      this.buildUniaxialTest();
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
      backgroundColor: '#141210ee',
      padding: { x: 18, y: 12 },
      align: 'center'
    }).setOrigin(0.5).setDepth(60);

    this.stageContainer.add(banner);

    this.time.delayedCall(950, () => {
      this.currentTestIdx += 1;
      this.startNextTest();
    });
  }

  // =========================================================================
  // 1. ОДНООСНОЕ СЖАТИЕ (Цилиндр 100×50 мм под гидропрессом)
  // =========================================================================
  buildUniaxialTest() {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');
    const frameColors = [0x3f3f46, 0x475569, 0x0284c9, 0x059669, 0x7c3aed, 0xe11d48];
    const pressAccent = frameColors[Math.min(frameColors.length - 1, pressLvl - 1)];

    const hint = this.add.text(width / 2, 128, 'Зажми пресс и отпусти в ЗЕЛЁНОЙ зоне\nпрямо перед разрушением цилиндра (100×50 мм)', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      color: '#e7e5e4',
      align: 'center'
    }).setOrigin(0.5);

    const cx = width / 2 - 18;
    const cy = 330;

    // Силовая рама пресса и защитный кожух
    const frame = this.add.graphics();
    frame.fillStyle(0x52525b, 1);
    frame.fillRect(cx - 102, cy - 124, 18, 224);
    frame.fillRect(cx + 84, cy - 124, 18, 224);
    frame.fillStyle(pressAccent, 1);
    frame.fillRoundedRect(cx - 114, cy - 140, 228, 26, 6);
    frame.fillStyle(0x3f3f46, 1);
    frame.fillRoundedRect(cx - 114, cy + 94, 228, 26, 6);
    // Полупрозрачный защитный экран
    frame.fillStyle(0x38bdf8, 0.08);
    frame.fillRect(cx - 84, cy - 98, 168, 192);

    // Нижний штамп и цилиндрический керн
    const lowerPlaten = this.add.rectangle(cx, cy + 84, 118, 18, 0x71717a);
    const core = this.add.image(cx, cy + 32, 'rock_core')
      .setScale(1.42)
      .setTint(this.contract.rock.color);

    // Верхняя нажимная плита и шток гидроцилиндра
    const piston = this.add.rectangle(cx, cy - 75, 118, 20, 0xd97706);
    const rod = this.add.rectangle(cx, cy - 105, 30, 44, 0x94a3b8);

    const cracks = this.add.graphics();

    // Вертикальный манометр нагрузки (справа от пресса)
    const barX = width - 58;
    const barY = 210;
    const barH = 240;
    const barW = 26;

    const targetMin = 0.68 - Math.min(0.12, (pressLvl - 1) * 0.025);
    const targetMax = 0.86 + Math.min(0.06, (pressLvl - 1) * 0.015);

    const gaugeBg = this.add.graphics();
    gaugeBg.fillStyle(0x141210, 1);
    gaugeBg.fillRoundedRect(barX - barW / 2, barY, barW, barH, 6);

    const greenTop = barY + barH * (1 - targetMax);
    const greenH = barH * (targetMax - targetMin);
    gaugeBg.fillStyle(0x22c55e, 0.85);
    gaugeBg.fillRect(barX - barW / 2 + 3, greenTop, barW - 6, greenH);

    gaugeBg.fillStyle(0xef4444, 0.85);
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

    btn.zone.on('pointerdown', () => {
      if (this.phaseActive) holding = true;
    });

    const releasePress = () => {
      if (!holding || !this.phaseActive) return;
      holding = false;
      AudioManager.stopPressHum();

      if (load >= targetMin && load <= targetMax) {
        const center = (targetMin + targetMax) / 2;
        const dist = Math.abs(load - center) / ((targetMax - targetMin) / 2);
        const acc = 100 - dist * 22;
        AudioManager.playRockCrack();
        this.particles.emitParticleAt(cx, cy + 30, 18);
        this.completeCurrentTest(acc, 'ПИК ПРОЧНОСТИ ЗАФИКСИРОВАН!');
      } else if (load < targetMin) {
        const acc = Math.max(15, (load / targetMin) * 65);
        AudioManager.playClick();
        this.completeCurrentTest(acc, 'НЕДОГРУЗ: КЕРН НЕ ДОВЕДЁН ДО ПИКА');
      }
    };

    btn.zone.on('pointerup', releasePress);
    btn.zone.on('pointerout', releasePress);

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;
      if (holding) {
        load += speed * dt;
        AudioManager.updatePressHum(load);

        piston.y = cy - 75 + load * 42;
        rod.y = piston.y - 30;
        needle.y = barY + barH * (1 - Math.min(1, load));

        const displayMpa = (load * (this.contract.trueStrengthMpa / 0.77)).toFixed(1);
        mpaReadout.setText(`${displayMpa} МПа`);

        cracks.clear();
        if (load > 0.45) {
          cracks.lineStyle(2, 0x1c1917, 0.9);
          cracks.beginPath();
          cracks.moveTo(cx - 10, cy + 5);
          cracks.lineTo(cx + 4, cy + 32);
          if (load > 0.65) {
            cracks.lineTo(cx - 8, cy + 62);
            cracks.moveTo(cx + 12, cy + 18);
            cracks.lineTo(cx - 2, cy + 48);
          }
          cracks.strokePath();
        }

        if (load >= 1) {
          holding = false;
          AudioManager.playRockCrack();
          this.cameras.main.shake(180, 0.012);
          this.particles.emitParticleAt(cx, cy + 30, 32);
          core.setAlpha(0.25);
          this.completeCurrentTest(20, 'ПЕРЕГРУЗ! ОБРАЗЕЦ РАЗРУШЕН В ПЫЛЬ');
        }
      }
    };
  }

  // =========================================================================
  // 2 & 3. ПРЯМОЙ СДВИГ / СДВИГ СО СЖАТИЕМ (Кольцо 35×70 мм в сдвиговой обойме)
  // =========================================================================
  buildShearTest(withVerticalLoad) {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');
    const totalHitsNeeded = withVerticalLoad ? 2 : 3;

    const hint = this.add.text(
      width / 2,
      128,
      withVerticalLoad
        ? 'Сначала зажми вертикальный прижим (σ),\nзатем поймай срез кольца 35×70 мм (×2)'
        : 'Нажимай ФИКСИРОВАТЬ СРЕЗ, когда\nбегунок проходит зелёную зону (×3)',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 305;

    // Сдвиговая каретка под низкое широкое кольцо 35×70 мм
    const lowerBox = this.add.rectangle(cx, cy + 22, 180, 42, 0x57534e).setStrokeStyle(2, 0x1c1917);
    const coreSlice = this.add.rectangle(cx, cy, 142, 46, this.contract.rock.color).setStrokeStyle(2, 0x1c1917);
    const upperBox = this.add.rectangle(cx, cy - 22, 180, 42, 0x78716c).setStrokeStyle(2, 0x1c1917);
    const clampPlate = this.add.rectangle(cx, cy - 82, 136, 18, 0x38bdf8);

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
      hint, lowerBox, coreSlice, upperBox, clampPlate,
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
    let zoneWidth = Math.min(0.36, 0.24 + (pressLvl - 1) * 0.025);

    const redrawTrack = () => {
      trackBg.clear();
      trackBg.fillStyle(0x141210, 1);
      trackBg.fillRoundedRect(trackX, trackY, trackW, trackH, 8);
      trackBg.lineStyle(2, 0x57534e, 1);
      trackBg.strokeRoundedRect(trackX, trackY, trackW, trackH, 8);

      zoneGraphic.clear();
      zoneGraphic.fillStyle(mode === 'clamp' ? 0x38bdf8 : 0x22c55e, 0.85);
      zoneGraphic.fillRect(
        trackX + trackW * zoneStart,
        trackY + 3,
        trackW * zoneWidth,
        trackH - 6
      );
    };

    const setupNextSlidePass = () => {
      mode = 'slide';
      zoneWidth = Math.max(0.14, (0.25 + (pressLvl - 1) * 0.02) - hitsDone * 0.03);
      zoneStart = 0.15 + Math.random() * (0.7 - zoneWidth);
      statusTxt.setText(`Срез: ${hitsDone} / ${totalHitsNeeded}`);
      btn.setLabel('ТАП: ФИКСИРОВАТЬ СРЕЗ');
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
      this.particles.emitParticleAt(cx, cy, 10);

      if (hitsDone >= totalHitsNeeded) {
        const avg = hitAccuracies.reduce((a, b) => a + b, 0) / hitAccuracies.length;
        this.completeCurrentTest(avg, 'ПЛОСКОСТЬ СДВИГА ОПРЕДЕЛЕНА!');
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
          clampPlate.y = cy - 82 + clampVal * 32;
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

      const baseSpeed = Math.max(0.75, 1.15 - (pressLvl - 1) * 0.08) + hitsDone * 0.18;
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

  // =========================================================================
  // 4. ТРЁХОСНАЯ КАМЕРА (СТАБИЛОМЕТР)
  // =========================================================================
  buildTriaxialTest() {
    const { width, height } = this.scale;
    const pressLvl = Storage.getUpgradeLevel('press');

    const hint = this.add.text(width / 2, 128, 'Фаза 1: Быстрыми тапами накачай\nдавление обжима в камере до отметки!', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      color: '#e7e5e4',
      align: 'center'
    }).setOrigin(0.5);

    const cx = width / 2;
    const cy = 315;

    const chamber = this.add.graphics();
    chamber.fillStyle(0x0f172a, 1);
    chamber.fillRoundedRect(cx - 78, cy - 112, 156, 214, 18);
    chamber.lineStyle(4, 0x38bdf8, 0.85);
    chamber.strokeRoundedRect(cx - 78, cy - 112, 156, 214, 18);
    // Крышка и шток стабилометра
    chamber.fillStyle(0x475569, 1);
    chamber.fillRoundedRect(cx - 86, cy - 126, 172, 18, 6);
    chamber.fillRect(cx - 12, cy - 152, 24, 28);

    const fluid = this.add.rectangle(cx, cy + 98, 148, 10, 0x0284c9, 0.45).setOrigin(0.5, 1);

    const core = this.add.image(cx, cy + 12, 'rock_core')
      .setScale(1.25)
      .setTint(this.contract.rock.color);

    const barW = 320;
    const barX = width / 2 - barW / 2;
    const barY = 455;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x141210, 1);
    barBg.fillRoundedRect(barX, barY, barW, 28, 8);

    barBg.fillStyle(0x22c55e, 0.85);
    barBg.fillRect(barX + barW * 0.68, barY + 3, barW * 0.24, 22);

    const marker = this.add.rectangle(barX + 6, barY + 14, 10, 34, 0xfacc15);

    const statusTxt = this.add.text(width / 2, 505, 'Давление обжима: 0 кПа', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const btn = this.createHoldButton(width / 2, height - 110, 310, 74, 'ТАПАЙ: НАКАЧАТЬ КАМЕРУ!');

    this.stageContainer.add([hint, chamber, fluid, core, barBg, marker, statusTxt, btn.container]);

    let phase = 'pump';
    let pressure = 0;
    let holdTimer = 0;
    const holdRequired = 2.6;
    let inZoneTime = 0;
    let isHoldingBtn = false;

    this.phaseActive = true;

    btn.zone.on('pointerdown', () => {
      if (!this.phaseActive) return;

      if (phase === 'pump') {
        pressure = Math.min(1, pressure + 0.115);
        AudioManager.playDrillTick();
        if (pressure >= 0.72) {
          phase = 'hold';
          AudioManager.playLatchSnap();
          hint.setText('Фаза 2: Удерживай кнопку 2.6 сек,\nдержа стрелку в зелёном секторе!');
          btn.setLabel('УДЕРЖИВАЙ БАЛАНС');
        }
      } else {
        isHoldingBtn = true;
      }
    });

    btn.zone.on('pointerup', () => { isHoldingBtn = false; });
    btn.zone.on('pointerout', () => { isHoldingBtn = false; });

    this.updateHandler = (dt) => {
      if (!this.phaseActive) return;

      if (phase === 'pump') {
        pressure = Math.max(0, pressure - 0.22 * dt);
        fluid.height = 10 + pressure * 194;
        marker.x = barX + barW * pressure;
        statusTxt.setText(`Давление обжима: ${Math.round(pressure * 600)} кПа`);
        return;
      }

      holdTimer += dt;
      const drift = Math.max(0.24, 0.38 - (pressLvl - 1) * 0.03);
      if (isHoldingBtn) {
        pressure = Math.min(1, pressure + drift * 1.35 * dt);
        AudioManager.updatePressHum(pressure);
      } else {
        pressure = Math.max(0, pressure - drift * dt);
      }

      fluid.height = 10 + pressure * 194;
      marker.x = barX + barW * pressure;

      if (pressure >= 0.68 && pressure <= 0.92) {
        inZoneTime += dt;
      }

      const left = Math.max(0, holdRequired - holdTimer).toFixed(1);
      statusTxt.setText(`Стабилизация: ${left} сек`);

      if (holdTimer >= holdRequired) {
        const ratio = inZoneTime / holdRequired;
        const acc = 30 + ratio * 70;
        AudioManager.playRockCrack();
        this.particles.emitParticleAt(cx, cy + 10, 16);
        this.completeCurrentTest(acc, 'ТРЁХОСНОЕ СЖАТИЕ ЗАВЕРШЕНО!');
      }
    };
  }

  createHoldButton(x, y, w, h, label) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    const draw = (pressed) => {
      bg.clear();
      const oy = pressed ? 3 : 0;
      bg.fillStyle(0x000000, 0.5);
      bg.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 14);
      bg.fillStyle(pressed ? 0xb45309 : 0xd97706, 1);
      bg.fillRoundedRect(-w / 2, -h / 2 + oy, w, h, 14);
      bg.lineStyle(2, 0xfef3c7, 0.35);
      bg.strokeRoundedRect(-w / 2, -h / 2 + oy, w, h, 14);
    };

    draw(false);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
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
    if (this.updateHandler) {
      this.updateHandler(delta / 1000);
    }
  }

  finishAllTests() {
    const sensorsLvl = Storage.getUpgradeLevel('sensors');
    const testsAvg = this.scores.length
      ? this.scores.reduce((a, b) => a + b, 0) / this.scores.length
      : 70;

    // Комбинируем точность распила/обмера (25%) и точность на стендах (75%)
    const avgAccuracy = Math.round(testsAvg * 0.75 + this.prepAccuracy * 0.25);

    const rawErrorPct = Math.max(2, Math.round((100 - avgAccuracy) * 0.42 - (sensorsLvl - 1) * 2.5));
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
