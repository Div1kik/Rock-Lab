import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';

export class PrepScene extends Phaser.Scene {
  constructor() {
    super('PrepScene');
  }

  init(data) {
    this.contract = data?.contract || Storage.getActiveContract();
    this.prepScores = [];
    this.sawSoundTimer = 0;
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

    this.stepTxt = this.add.text(width / 2, 26, 'ЭТАП 2: ПОДГОТОВКА ОБРАЗЦА', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.titleTxt = this.add.text(width / 2, 54, 'ОТРЕЗНОЙ СТАНОК', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '20px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0.5);

    this.subTxt = this.add.text(width / 2, 78, `${this.contract.rock.name} · Подгонка под ГОСТ (100×50 мм)`, {
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
    this.startSawPhase();
  }

  // =========================================================================
  // ФАЗА 1: ЦИРКУЛЯРНАЯ ПИЛА НА РЕЛЬСОВОЙ ДОРОЖКЕ
  // =========================================================================
  startSawPhase() {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    const sawLvl = Storage.getUpgradeLevel('saw');
    this.titleTxt.setText(`ОТРЕЗНОЙ СТАНОК [Ур. ${sawLvl}]`);

    const hint = this.add.text(
      width / 2,
      128,
      'Зажми подачу — каретка с пилой проедет по рельсе\nи отрежет лишний торец по разметке (100 мм)',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 335;

    // 1. Станина и упоры станка
    const bed = this.add.graphics();
    bed.fillStyle(0x3f3f46, 1);
    bed.fillRoundedRect(cx - 180, cy + 36, 360, 34, 8);
    bed.fillStyle(0x52525b, 1);
    bed.fillRect(cx - 160, cy - 32, 22, 68); // упор слева

    // 2. Длинный необработанный керн (основная часть + отрезаемый торец)
    const keepW = 160;
    const scrapW = 110;
    const coreH = 64;
    const leftX = cx - 135;
    const cutX = leftX + keepW;

    const mainCore = this.add.rectangle(leftX + keepW / 2, cy + 4, keepW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    const scrapCore = this.add.rectangle(cutX + scrapW / 2, cy + 4, scrapW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // Пунктирная линия реза
    const cutLine = this.add.graphics();
    cutLine.lineStyle(3, 0x22c55e, 0.95);
    for (let y = cy - 42; y < cy + 46; y += 12) {
      cutLine.lineBetween(cutX, y, cutX, y + 6);
    }

    // 3. Рельсовая направляющая дорожка над станком
    const railY = cy - 92;
    const railStartX = cx - 155;
    const railEndX = cutX;
    const railG = this.add.graphics();
    // Стойки рельсы
    railG.fillStyle(0x52525b, 1);
    railG.fillRect(cx - 172, railY - 6, 16, 134);
    railG.fillRect(cx + 156, railY - 6, 16, 134);
    // Сама рельса-дорожка
    railG.fillStyle(0x71717a, 1);
    railG.fillRoundedRect(cx - 175, railY - 8, 350, 16, 4);
    railG.lineStyle(2, 0x27272a, 1);
    railG.lineBetween(cx - 165, railY, cx + 165, railY);

    // 4. Каретка с циркулярной пилой (визуал меняется от sawLvl)
    const carriageColors = [0xd97706, 0xeab308, 0x22c55e, 0x38bdf8, 0xa855f7, 0xf43f5e];
    const cColor = carriageColors[Math.min(carriageColors.length - 1, sawLvl - 1)];

    const sawContainer = this.add.container(railStartX, railY);

    // Диск пилы (опускается в плоскость реза ниже рельсы)
    const bladeOffsetY = 92;
    const blade = this.add.circle(0, bladeOffsetY, 44, 0x94a3b8).setStrokeStyle(4, 0xf8fafc);
    const teeth = this.add.graphics();
    teeth.y = bladeOffsetY;
    teeth.lineStyle(2, 0x334155, 1);
    teeth.lineBetween(-36, 0, 36, 0);
    teeth.lineBetween(0, -36, 0, 36);
    teeth.lineBetween(-25, -25, 25, 25);
    teeth.lineBetween(-25, 25, 25, -25);

    // Защитный кожух и мотор каретки на рельсе
    const carriageBody = this.add.graphics();
    carriageBody.fillStyle(0x27272a, 1);
    carriageBody.fillRoundedRect(-26, -18, 52, 36, 6);
    carriageBody.fillStyle(cColor, 1);
    carriageBody.fillRoundedRect(-22, 16, 44, 48, 6);
    // Полукруглый кожух диска
    carriageBody.fillStyle(cColor, 1);
    carriageBody.slice(0, bladeOffsetY, 48, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    carriageBody.fillPath();

    sawContainer.add([blade, teeth, carriageBody]);

    // Прогресс-бар хода каретки
    const barW = 280;
    const barX = width / 2 - barW / 2;
    const barY = 455;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x141210, 1);
    barBg.fillRoundedRect(barX, barY, barW, 22, 6);
    const barFill = this.add.rectangle(barX + 3, barY + 3, 2, 16, cColor).setOrigin(0, 0);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ПОДАЧА ПИЛЫ ПО РЕЛЬСЕ');

    this.stageContainer.add([
      hint, bed, mainCore, scrapCore, cutLine, railG, sawContainer, barBg, barFill, btn.container
    ]);

    let cutProgress = 0; // 0..1
    let cutting = false;
    let finished = false;
    const cutSpeed = 0.45 + (sawLvl - 1) * 0.11;

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
          if (cutProgress > 0.65) {
            this.particles.emitParticleAt(sawContainer.x, cy + 4, 6);
          }
        }

        if (cutProgress >= 1) {
          finished = true;
          cutting = false;
          AudioManager.playRockCrack();
          this.particles.emitParticleAt(cutX, cy + 4, 22);
          this.prepScores.push(96);

          // Отрезанный кусок падает вниз
          this.tweens.add({
            targets: scrapCore,
            x: scrapCore.x + 35,
            y: scrapCore.y + 130,
            angle: 28,
            alpha: 0,
            duration: 420,
            ease: 'Quad.easeIn'
          });

          // Каретка возвращается в исходное положение по рельсе
          this.tweens.add({
            targets: sawContainer,
            x: railStartX,
            duration: 380,
            ease: 'Cubic.easeOut'
          });

          this.time.delayedCall(780, () => {
            this.startMeasurePhase();
          });
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 2: ВИЗУАЛЬНЫЙ ШТАНГЕНЦИРКУЛЬ СО ШКАЛОЙ И ДИСПЛЕЕМ
  // =========================================================================
  startMeasurePhase() {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    const calLvl = Storage.getUpgradeLevel('caliper');
    this.titleTxt.setText(`ШТАНГЕНЦИРКУЛЬ [Ур. ${calLvl}]`);

    const hint = this.add.text(
      width / 2,
      128,
      'Зажми кнопку и отпусти, когда подвижная рамка\nштангенциркуля плотно упрётся в край керна!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 310;

    // Цвета корпуса штангенциркуля в зависимости от уровня
    const calThemes = [
      { bar: 0x94a3b8, slider: 0x475569, accent: 0x38bdf8 },
      { bar: 0xcbd5e1, slider: 0x334155, accent: 0xfacc15 },
      { bar: 0xe2e8f0, slider: 0x1e293b, accent: 0x4ade80 },
      { bar: 0x64748b, slider: 0x0f172a, accent: 0x38bdf8 },
      { bar: 0x334155, slider: 0x18181b, accent: 0xa855f7 },
      { bar: 0x1e293b, slider: 0x09090b, accent: 0xf43f5e }
    ];
    const theme = calThemes[Math.min(calThemes.length - 1, calLvl - 1)];

    // Готовый отпиленный керн в центре
    const coreW = 140; // 100.0 мм
    const coreH = 74;  // 50.0 мм
    const core = this.add.rectangle(cx, cy + 16, coreW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // --- ГОРИЗОНТАЛЬНЫЙ ШТАНГЕНЦИРКУЛЬ (для замера длины H) ---
    const hCaliperGroup = this.add.container(0, 0);
    const beamY = cy - 42;
    const beamStartX = cx - coreW / 2 - 12;

    const hBeam = this.add.graphics();
    // Основная штанга с миллиметровыми рисками
    hBeam.fillStyle(theme.bar, 1);
    hBeam.fillRoundedRect(beamStartX, beamY - 12, 310, 24, 4);
    // Неподвижная левая измерительная губка
    hBeam.fillRect(beamStartX, beamY - 12, 12, 108);
    hBeam.lineStyle(1, 0x0f172a, 0.7);
    for (let x = beamStartX + 18; x < beamStartX + 300; x += 8) {
      const tickH = (x - beamStartX) % 24 === 0 ? 10 : 5;
      hBeam.lineBetween(x, beamY + 12 - tickH, x, beamY + 12);
    }

    // Подвижная рамка (каретка с цифровой шкалой)
    const hSlider = this.add.container(cx + 125, beamY);
    const hSliderG = this.add.graphics();
    hSliderG.fillStyle(theme.slider, 1);
    hSliderG.fillRoundedRect(-6, -18, 68, 36, 6);
    hSliderG.lineStyle(2, theme.accent, 0.9);
    hSliderG.strokeRoundedRect(-6, -18, 68, 36, 6);
    // Подвижная правая губка
    hSliderG.fillStyle(theme.bar, 1);
    hSliderG.fillRect(0, 12, 10, 84);
    hSlider.add(hSliderG);

    hCaliperGroup.add([hBeam, hSlider]);

    // --- ВЕРТИКАЛЬНЫЙ ШТАНГЕНЦИРКУЛЬ (для замера диаметра D) ---
    const vCaliperGroup = this.add.container(0, 0).setVisible(false);
    const vBeamX = cx - 64;
    const vBeamTopY = cy + 16 - coreH / 2 - 12;

    const vBeam = this.add.graphics();
    vBeam.fillStyle(theme.bar, 1);
    vBeam.fillRoundedRect(vBeamX - 12, vBeamTopY, 24, 215, 4);
    // Неподвижная верхняя губка
    vBeam.fillRect(vBeamX - 12, vBeamTopY, 124, 12);
    vBeam.lineStyle(1, 0x0f172a, 0.7);
    for (let y = vBeamTopY + 18; y < vBeamTopY + 205; y += 8) {
      const tickW = (y - vBeamTopY) % 24 === 0 ? 10 : 5;
      vBeam.lineBetween(vBeamX + 12 - tickW, y, vBeamX + 12, y);
    }

    const vSlider = this.add.container(vBeamX, cy + 115);
    const vSliderG = this.add.graphics();
    vSliderG.fillStyle(theme.slider, 1);
    vSliderG.fillRoundedRect(-18, -6, 36, 54, 6);
    vSliderG.lineStyle(2, theme.accent, 0.9);
    vSliderG.strokeRoundedRect(-18, -6, 36, 54, 6);
    // Подвижная нижняя губка
    vSliderG.fillStyle(theme.bar, 1);
    vSliderG.fillRect(12, 0, 100, 10);
    vSlider.add(vSliderG);

    vCaliperGroup.add([vBeam, vSlider]);

    // Цифровое табло штангенциркуля
    const lcdBg = this.add.graphics();
    lcdBg.fillStyle(0x0f172a, 1);
    lcdBg.fillRoundedRect(cx - 140, 445, 280, 54, 10);
    lcdBg.lineStyle(2, theme.accent, 0.9);
    lcdBg.strokeRoundedRect(cx - 140, 445, 280, 54, 10);

    const lcdText = this.add.text(cx, 472, 'ДЛИНА (H): 135.0 мм', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '19px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const resultSummary = this.add.text(width / 2, 518, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#4ade80'
    }).setOrigin(0.5);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: СВЕСТИ ГУБКИ (ДЛИНА)');

    this.stageContainer.add([
      hint, core, hCaliperGroup, vCaliperGroup, lcdBg, lcdText, resultSummary, btn.container
    ]);

    let step = 'length';
    let gap = 1.0;
    let holding = false;
    let measuredH = 100;
    let measuredD = 50;

    // Чем выше уровень циркуля, тем плавнее и точнее ход губок
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
        measuredH = (100 + gap * 35).toFixed(1);
        resultSummary.setText(`✓ Длина зафиксирована: ${measuredH} мм`);
        step = 'width';
        gap = 1.0;
        hCaliperGroup.setVisible(false);
        vCaliperGroup.setVisible(true);
        btn.setLabel('УДЕРЖИВАТЬ: ЗАМЕР ДИАМЕТРА');
      } else if (step === 'width') {
        measuredD = (50 + gap * 20).toFixed(1);
        step = 'done';
        resultSummary.setText(`✓ H = ${measuredH} мм  |  D = ${measuredD} мм — Готово к прессу!`);
        this.particles.emitParticleAt(cx, cy + 16, 14);

        this.time.delayedCall(900, () => {
          const avgPrep = Math.round(
            this.prepScores.reduce((a, b) => a + b, 0) / this.prepScores.length
          );
          this.scene.start('TestScene', {
            contract: this.contract,
            prepAccuracy: avgPrep,
            dimensions: { h: measuredH, d: measuredD }
          });
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
        const mm = (100 + gap * 35).toFixed(1);
        lcdText.setText(`ДЛИНА (H): ${mm} мм`);
        lcdText.setColor(Math.abs(gap) <= 0.08 ? '#4ade80' : '#38bdf8');
      } else {
        const currentSpan = coreH + gap * 85;
        vSlider.y = cy + 16 - coreH / 2 + currentSpan;
        const mm = (50 + gap * 20).toFixed(1);
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
