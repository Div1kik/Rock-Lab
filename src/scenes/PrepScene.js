import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';

export class PrepScene extends Phaser.Scene {
  constructor() {
    super('PrepScene');
  }

  init(data) {
    this.contract = data?.contract || Storage.getActiveContract();
    this.prepSpecs = this.buildSpecimenSpecs(this.contract?.tests || ['uniaxial']);
    this.currentSpecIdx = 0;
    this.prepScores = [];
    this.sawSoundTimer = 0;
  }

  // Формируем список образцов с реальными размерами ГОСТ под назначенные испытания
  buildSpecimenSpecs(tests) {
    const hasCompression = tests.includes('uniaxial') || tests.includes('triaxial');
    const hasShear = tests.includes('shear') || tests.includes('shear_load');
    const specs = [];

    if (hasCompression) {
      specs.push({
        label: 'Цилиндр под сжатие',
        targetH: 100.0,
        targetD: 50.0,
        sawKeepW: 165,
        sawCoreH: 62,
        calCoreW: 145,
        calCoreH: 72
      });
    }

    if (hasShear) {
      specs.push({
        label: 'Кольцо под сдвиг',
        targetH: 35.0,
        targetD: 70.0,
        sawKeepW: 85,
        sawCoreH: 86,
        calCoreW: 66,
        calCoreH: 112
      });
    }

    if (!specs.length) {
      specs.push({
        label: 'Стандартный керн',
        targetH: 100.0,
        targetD: 50.0,
        sawKeepW: 165,
        sawCoreH: 62,
        calCoreW: 145,
        calCoreH: 72
      });
    }

    return specs;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x292524, 1);
    bg.fillRoundedRect(14, 92, width - 28, height - 110, 16);
    bg.lineStyle(2, 0x44403c, 1);
    bg.strokeRoundedRect(14, 92, width - 28, height - 110, 16);

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

    this.subTxt = this.add.text(width / 2, 78, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#a8a29e'
    }).setOrigin(0.5);

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 70, max: 190 },
      scale: { start: 1.2, end: 0 },
      lifespan: 360,
      emitting: false
    }).setDepth(50);

    this.stageContainer = this.add.container(0, 0);
    this.startSpecimenPrep();
  }

  startSpecimenPrep() {
    if (this.currentSpecIdx >= this.prepSpecs.length) {
      const avgPrep = Math.round(
        this.prepScores.reduce((a, b) => a + b, 0) / this.prepScores.length
      );
      this.scene.start('TestScene', {
        contract: this.contract,
        prepAccuracy: avgPrep
      });
      return;
    }

    const spec = this.prepSpecs[this.currentSpecIdx];
    this.stepTxt.setText(
      `ЭТАП 2: ОБРАЗЕЦ ${this.currentSpecIdx + 1} ИЗ ${this.prepSpecs.length} (${spec.label.toUpperCase()})`
    );
    this.subTxt.setText(
      `${this.contract.rock.name} · Требуемый размер ГОСТ: H=${spec.targetH} мм × D=${spec.targetD} мм`
    );

    this.startSawPhase(spec);
  }

  // =========================================================================
  // ФАЗА 1: ОТРЕЗНОЙ СТАНОК С ТИСКАМИ, ОХЛАЖДЕНИЕМ И РЕЛЬСОВОЙ ПИЛОЙ
  // =========================================================================
  startSawPhase(spec) {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    const sawLvl = Storage.getUpgradeLevel('saw');
    this.titleTxt.setText(`ОТРЕЗНОЙ СТАНОК [Ур. ${sawLvl}]`);

    const hint = this.add.text(
      width / 2,
      128,
      `Зажми подачу — отрежь образец по разметке\nпод размер ${spec.targetH}×${spec.targetD} мм`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 335;

    // 1. Массивная станина и тиски фиксации керна
    const bed = this.add.graphics();
    bed.fillStyle(0x3f3f46, 1);
    bed.fillRoundedRect(cx - 185, cy + 44, 370, 34, 8);
    // Левый упор и винтовой зажим тисков
    bed.fillStyle(0x52525b, 1);
    bed.fillRect(cx - 165, cy - 38, 24, 82);
    bed.fillStyle(0x94a3b8, 1);
    bed.fillRect(cx - 182, cy - 8, 17, 10);
    bed.fillCircle(cx - 182, cy - 3, 12);

    // 2. Длинный керн из ящика (рабочая часть + отрезаемый кусок)
    const keepW = spec.sawKeepW;
    const scrapW = 270 - keepW;
    const coreH = spec.sawCoreH;
    const leftX = cx - 140;
    const cutX = leftX + keepW;
    const coreCenterY = cy + 44 - coreH / 2;

    const mainCore = this.add.rectangle(leftX + keepW / 2, coreCenterY, keepW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    const scrapCore = this.add.rectangle(cutX + scrapW / 2, coreCenterY, scrapW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // Линия разметки (лазерный луч на Ур. 3+, иначе мелок)
    const cutLine = this.add.graphics();
    if (sawLvl >= 3) {
      cutLine.lineStyle(2, 0xef4444, 0.9);
      cutLine.lineBetween(cutX, cy - 75, cutX, cy + 44);
    } else {
      cutLine.lineStyle(3, 0x22c55e, 0.95);
      for (let y = cy - 46; y < cy + 44; y += 12) {
        cutLine.lineBetween(cutX, y, cutX, y + 6);
      }
    }

    // 3. Рельсовая направляющая
    const railY = cy - 94;
    const railStartX = cx - 155;
    const railEndX = cutX;
    const railG = this.add.graphics();
    railG.fillStyle(0x52525b, 1);
    railG.fillRect(cx - 176, railY - 6, 16, 144);
    railG.fillRect(cx + 160, railY - 6, 16, 144);
    railG.fillStyle(0x71717a, 1);
    railG.fillRoundedRect(cx - 180, railY - 8, 360, 16, 4);

    // 4. Каретка с циркулярной пилой и форсункой охлаждения
    const carriageColors = [0xd97706, 0xeab308, 0x22c55e, 0x38bdf8, 0xa855f7, 0xf43f5e];
    const cColor = carriageColors[Math.min(carriageColors.length - 1, sawLvl - 1)];

    const sawContainer = this.add.container(railStartX, railY);
    const bladeOffsetY = 94;

    const blade = this.add.circle(0, bladeOffsetY, 44, 0x94a3b8).setStrokeStyle(4, 0xf8fafc);
    const teeth = this.add.graphics();
    teeth.y = bladeOffsetY;
    teeth.lineStyle(2, 0x334155, 1);
    teeth.lineBetween(-36, 0, 36, 0);
    teeth.lineBetween(0, -36, 0, 36);
    teeth.lineBetween(-25, -25, 25, 25);
    teeth.lineBetween(-25, 25, 25, -25);

    const carriageBody = this.add.graphics();
    carriageBody.fillStyle(0x27272a, 1);
    carriageBody.fillRoundedRect(-26, -18, 52, 36, 6);
    carriageBody.fillStyle(cColor, 1);
    carriageBody.fillRoundedRect(-22, 16, 44, 48, 6);
    // Трубка подачи воды на диск
    carriageBody.fillStyle(0x38bdf8, 1);
    carriageBody.fillRect(-30, 32, 8, 36);
    // Защитный кожух диска
    carriageBody.fillStyle(cColor, 1);
    carriageBody.slice(0, bladeOffsetY, 48, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    carriageBody.fillPath();

    sawContainer.add([blade, teeth, carriageBody]);

    const barW = 280;
    const barX = width / 2 - barW / 2;
    const barY = 458;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x141210, 1);
    barBg.fillRoundedRect(barX, barY, barW, 22, 6);
    const barFill = this.add.rectangle(barX + 3, barY + 3, 2, 16, cColor).setOrigin(0, 0);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ПОДАЧА ПИЛЫ ПО РЕЛЬСЕ');

    this.stageContainer.add([
      hint, bed, mainCore, scrapCore, cutLine, railG, sawContainer, barBg, barFill, btn.container
    ]);

    let cutProgress = 0;
    let cutting = false;
    let finished = false;
    const cutSpeed = 0.48 + (sawLvl - 1) * 0.11;

    btn.zone.on('pointerdown', () => { if (!finished) cutting = true; });
    btn.zone.on('pointerup', () => { cutting = false; });
    btn.zone.on('pointerout', () => { cutting = false; });

    this.currentUpdate = (dt) => {
      if (finished) return;
      teeth.angle += cutting ? 860 * dt : 160 * dt;

      if (cutting) {
        cutProgress = Math.min(1, cutProgress + cutSpeed * dt);
        sawContainer.x = railStartX + (railEndX - railStartX) * cutProgress;
        barFill.width = Math.max(2, (barW - 6) * cutProgress);

        this.sawSoundTimer += dt * 1000;
        if (this.sawSoundTimer >= 60) {
          this.sawSoundTimer = 0;
          AudioManager.playSawCut();
          if (cutProgress > 0.55) {
            this.particles.emitParticleAt(sawContainer.x, coreCenterY, 5);
          }
        }

        if (cutProgress >= 1) {
          finished = true;
          cutting = false;
          AudioManager.playRockCrack();
          this.particles.emitParticleAt(cutX, coreCenterY, 20);
          this.prepScores.push(96);

          this.tweens.add({
            targets: scrapCore,
            x: scrapCore.x + 35,
            y: scrapCore.y + 130,
            angle: 28,
            alpha: 0,
            duration: 420,
            ease: 'Quad.easeIn'
          });

          this.tweens.add({
            targets: sawContainer,
            x: railStartX,
            duration: 360,
            ease: 'Cubic.easeOut'
          });

          this.time.delayedCall(740, () => {
            this.startMeasurePhase(spec);
          });
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 2: ЗАМЕР ГАБАРИТОВ ПОД ВЫБРАННЫЙ ТИП ИСПЫТАНИЯ
  // =========================================================================
  startMeasurePhase(spec) {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    const calLvl = Storage.getUpgradeLevel('caliper');
    this.titleTxt.setText(`ШТАНГЕНЦИРКУЛЬ [Ур. ${calLvl}]`);

    const hint = this.add.text(
      width / 2,
      128,
      `Зажми и отпусти, когда губки прижмутся к образцу\n(Норма: H = ${spec.targetH} мм, D = ${spec.targetD} мм)`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 310;

    const calThemes = [
      { bar: 0x94a3b8, slider: 0x475569, accent: 0x38bdf8 },
      { bar: 0xcbd5e1, slider: 0x334155, accent: 0xfacc15 },
      { bar: 0xe2e8f0, slider: 0x1e293b, accent: 0x4ade80 },
      { bar: 0x64748b, slider: 0x0f172a, accent: 0x38bdf8 },
      { bar: 0x334155, slider: 0x18181b, accent: 0xa855f7 },
      { bar: 0x1e293b, slider: 0x09090b, accent: 0xf43f5e }
    ];
    const theme = calThemes[Math.min(calThemes.length - 1, calLvl - 1)];

    const coreW = spec.calCoreW;
    const coreH = spec.calCoreH;
    const core = this.add.rectangle(cx, cy + 16, coreW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // Горизонтальный штангенциркуль (высота цилиндра / толщина кольца H)
    const hCaliperGroup = this.add.container(0, 0);
    const beamY = cy - coreH / 2 - 22;
    const beamStartX = cx - coreW / 2 - 12;

    const hBeam = this.add.graphics();
    hBeam.fillStyle(theme.bar, 1);
    hBeam.fillRoundedRect(beamStartX, beamY - 12, 310, 24, 4);
    hBeam.fillRect(beamStartX, beamY - 12, 12, coreH + 34);
    hBeam.lineStyle(1, 0x0f172a, 0.7);
    for (let x = beamStartX + 18; x < beamStartX + 300; x += 8) {
      const tickH = (x - beamStartX) % 24 === 0 ? 10 : 5;
      hBeam.lineBetween(x, beamY + 12 - tickH, x, beamY + 12);
    }

    const hSlider = this.add.container(cx + 125, beamY);
    const hSliderG = this.add.graphics();
    hSliderG.fillStyle(theme.slider, 1);
    hSliderG.fillRoundedRect(-6, -18, 68, 36, 6);
    hSliderG.lineStyle(2, theme.accent, 0.9);
    hSliderG.strokeRoundedRect(-6, -18, 68, 36, 6);
    hSliderG.fillStyle(theme.bar, 1);
    hSliderG.fillRect(0, 12, 10, coreH + 10);
    hSlider.add(hSliderG);
    hCaliperGroup.add([hBeam, hSlider]);

    // Вертикальный штангенциркуль (диаметр D)
    const vCaliperGroup = this.add.container(0, 0).setVisible(false);
    const vBeamX = cx - coreW / 2 - 26;
    const vBeamTopY = cy + 16 - coreH / 2 - 12;

    const vBeam = this.add.graphics();
    vBeam.fillStyle(theme.bar, 1);
    vBeam.fillRoundedRect(vBeamX - 12, vBeamTopY, 24, 225, 4);
    vBeam.fillRect(vBeamX - 12, vBeamTopY, coreW + 46, 12);
    vBeam.lineStyle(1, 0x0f172a, 0.7);
    for (let y = vBeamTopY + 18; y < vBeamTopY + 215; y += 8) {
      const tickW = (y - vBeamTopY) % 24 === 0 ? 10 : 5;
      vBeam.lineBetween(vBeamX + 12 - tickW, y, vBeamX + 12, y);
    }

    const vSlider = this.add.container(vBeamX, cy + 125);
    const vSliderG = this.add.graphics();
    vSliderG.fillStyle(theme.slider, 1);
    vSliderG.fillRoundedRect(-18, -6, 36, 54, 6);
    vSliderG.lineStyle(2, theme.accent, 0.9);
    vSliderG.strokeRoundedRect(-18, -6, 36, 54, 6);
    vSliderG.fillStyle(theme.bar, 1);
    vSliderG.fillRect(12, 0, coreW + 22, 10);
    vSlider.add(vSliderG);
    vCaliperGroup.add([vBeam, vSlider]);

    // Цифровое табло
    const lcdBg = this.add.graphics();
    lcdBg.fillStyle(0x0f172a, 1);
    lcdBg.fillRoundedRect(cx - 145, 448, 290, 54, 10);
    lcdBg.lineStyle(2, theme.accent, 0.9);
    lcdBg.strokeRoundedRect(cx - 145, 448, 290, 54, 10);

    const lcdText = this.add.text(cx, 475, `ВЫСОТА (H): ${(spec.targetH + 35).toFixed(1)} мм`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '18px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const resultSummary = this.add.text(width / 2, 518, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#4ade80'
    }).setOrigin(0.5);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ЗАМЕР ВЫСОТЫ (H)');

    this.stageContainer.add([
      hint, core, hCaliperGroup, vCaliperGroup, lcdBg, lcdText, resultSummary, btn.container
    ]);

    let step = 'length';
    let gap = 1.0;
    let holding = false;
    let measuredH = spec.targetH;
    let measuredD = spec.targetD;

    const jawSpeed = Math.max(0.42, 0.75 - (calLvl - 1) * 0.06);

    btn.zone.on('pointerdown', () => {
      if (step !== 'done') holding = true;
    });

    const releaseJaw = () => {
      if (!holding || step === 'done') return;
      holding = false;
      AudioManager.playLatchSnap();

      const error = Math.abs(gap);
      const stepAcc = Math.max(35, Math.round(100 - error * 220));
      this.prepScores.push(stepAcc);

      if (step === 'length') {
        measuredH = (spec.targetH + gap * 35).toFixed(1);
        resultSummary.setText(`✓ Высота (H): ${measuredH} мм`);
        step = 'width';
        gap = 1.0;
        hCaliperGroup.setVisible(false);
        vCaliperGroup.setVisible(true);
        btn.setLabel('УДЕРЖИВАТЬ: ЗАМЕР ДИАМЕТРА (D)');
      } else if (step === 'width') {
        measuredD = (spec.targetD + gap * 20).toFixed(1);
        step = 'done';
        resultSummary.setText(`✓ H = ${measuredH} мм  |  D = ${measuredD} мм — Образец готов!`);
        this.particles.emitParticleAt(cx, cy + 16, 14);

        this.time.delayedCall(850, () => {
          this.currentSpecIdx += 1;
          this.startSpecimenPrep();
        });
      }
    };

    btn.zone.on('pointerup', releaseJaw);
    btn.zone.on('pointerout', releaseJaw);

    this.currentUpdate = (dt) => {
      if (!holding || step === 'done') return;

      gap -= jawSpeed * dt;
      if (gap < -0.25) {
        gap = -0.25;
        releaseJaw();
        return;
      }

      if (step === 'length') {
        const currentSpan = coreW + gap * 115;
        hSlider.x = cx - coreW / 2 + currentSpan;
        const mm = (spec.targetH + gap * 35).toFixed(1);
        lcdText.setText(`ВЫСОТА (H): ${mm} мм`);
        lcdText.setColor(Math.abs(gap) <= 0.08 ? '#4ade80' : '#38bdf8');
      } else {
        const currentSpan = coreH + gap * 80;
        vSlider.y = cy + 16 - coreH / 2 + currentSpan;
        const mm = (spec.targetD + gap * 20).toFixed(1);
        lcdText.setText(`ДИАМЕТР (D): ${mm} мм`);
        lcdText.setColor(Math.abs(gap) <= 0.08 ? '#4ade80' : '#38bdf8');
      }
    };
  }

  createActionBtn(x, y, w, h, label) {
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
      fontSize: '14px',
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
    if (this.currentUpdate) {
      this.currentUpdate(delta / 1000);
    }
  }
}
