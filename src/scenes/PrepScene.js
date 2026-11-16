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

  buildSpecimenSpecs(tests) {
    const specs = [];

    const needsCylinder = tests.some((t) =>
      ['uniaxial', 'triaxial', 'ultrasonic', 'water_sat', 'frost_test'].includes(t)
    );
    const needsTwoDiscs = tests.some((t) => ['shear_cut', 'shear_load'].includes(t));
    const needsSplit = tests.includes('shear_crack');

    if (needsCylinder) {
      specs.push({
        mode: 'cylinder',
        label: 'Цилиндр (H=100 × D=50 мм)',
        targetH: 100.0,
        targetD: 50.0,
        sawKeepW: 165,
        sawCoreH: 62,
        calCoreW: 156,
        calCoreH: 78
      });
    }

    if (needsTwoDiscs) {
      specs.push({
        mode: 'two_discs',
        label: 'Две шайбы (H=35 × D=70 мм)',
        targetH: 35.0,
        targetD: 70.0,
        sawKeepW: 68,
        sawCoreH: 88,
        calCoreW: 56,
        calCoreH: 112
      });
    }

    if (needsSplit) {
      specs.push({
        mode: 'split_core',
        label: 'Раскол керна (H=70 × D=70 мм)',
        targetH: 70.0,
        targetD: 70.0,
        calCoreW: 104,
        calCoreH: 104
      });
    }

    if (!specs.length) {
      specs.push({
        mode: 'cylinder',
        label: 'Цилиндр (H=100 × D=50 мм)',
        targetH: 100.0,
        targetD: 50.0,
        sawKeepW: 165,
        sawCoreH: 62,
        calCoreW: 156,
        calCoreH: 78
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
      fontSize: '12px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.titleTxt = this.add.text(width / 2, 54, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '19px',
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
    this.stepTxt.setText(`ЭТАП 2: ЗАГОТОВКА ${this.currentSpecIdx + 1}/${this.prepSpecs.length}`);
    this.subTxt.setText(`${this.contract.rock.name} · ${spec.label}`);

    if (spec.mode === 'split_core') {
      this.startSplitCrackPhase(spec);
    } else {
      this.startSawPhase(spec);
    }
  }

  afterCutOrSplit(spec) {
    const grinderLvl = Storage.getUpgradeLevel('grinder');
    // Если шлифовальный станок куплен и это пилёный образец (цилиндр или шайбы) -> этап шлифовки торцов!
    if (grinderLvl > 0 && spec.mode !== 'split_core') {
      this.startGrinderPhase(spec, grinderLvl);
    } else {
      // Без шлифовального станка остаётся небольшой природный перекос торцов
      if (spec.mode !== 'split_core') {
        this.prepScores.push(82);
      }
      this.startMeasurePhase(spec);
    }
  }

  // =========================================================================
  // ФАЗА 1А: ОТРЕЗНОЙ СТАНОК
  // =========================================================================
  startSawPhase(spec) {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    const sawLvl = Storage.getUpgradeLevel('saw');
    const cutsNeeded = spec.mode === 'two_discs' ? 2 : 1;
    let cutsDone = 0;

    this.titleTxt.setText(`ОТРЕЗНОЙ СТАНОК [Ур. ${sawLvl}]`);

    const hint = this.add.text(
      width / 2,
      128,
      cutsNeeded === 2
        ? 'Напилить ДВЕ шайбы (H=35 × D=70 мм) для сдвига!\nЗажми подачу пилы для реза №1 и №2'
        : `Зажми подачу — отрежь образец по разметке (H=${spec.targetH} мм)`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 335;

    const bed = this.add.graphics();
    bed.fillStyle(0x3f3f46, 1);
    bed.fillRoundedRect(cx - 185, cy + 44, 370, 34, 8);
    bed.fillStyle(0x52525b, 1);
    bed.fillRect(cx - 165, cy - 38, 24, 82);
    bed.fillStyle(0x94a3b8, 1);
    bed.fillRect(cx - 182, cy - 8, 17, 10);
    bed.fillCircle(cx - 182, cy - 3, 12);

    const discW = spec.sawKeepW;
    const coreH = spec.sawCoreH;
    const leftX = cx - 140;
    const coreCenterY = cy + 44 - coreH / 2;

    const cut1X = leftX + discW;
    const cut2X = leftX + discW * 2;

    const disc1 = this.add.rectangle(leftX + discW / 2, coreCenterY, discW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    const disc2 = this.add.rectangle(
      leftX + discW + (cutsNeeded === 2 ? discW / 2 : (270 - discW) / 2),
      coreCenterY,
      cutsNeeded === 2 ? discW : 270 - discW,
      coreH,
      this.contract.rock.color
    ).setStrokeStyle(2, 0x1c1917);

    const scrapW = Math.max(40, 270 - discW * 2);
    const scrap = cutsNeeded === 2
      ? this.add.rectangle(cut2X + scrapW / 2, coreCenterY, scrapW, coreH, this.contract.rock.color)
          .setStrokeStyle(2, 0x1c1917)
      : null;

    const cutLines = this.add.graphics();
    const drawCutMarks = () => {
      cutLines.clear();
      const targets = cutsNeeded === 2 ? [cut1X, cut2X] : [cut1X];
      targets.forEach((tx, idx) => {
        const done = idx < cutsDone;
        cutLines.lineStyle(sawLvl >= 3 ? 2 : 3, done ? 0x4ade80 : sawLvl >= 3 ? 0xef4444 : 0x22c55e, 0.95);
        cutLines.lineBetween(tx, cy - 55, tx, cy + 44);
      });
    };
    drawCutMarks();

    const railY = cy - 94;
    const railStartX = cx - 155;
    const railG = this.add.graphics();
    railG.fillStyle(0x52525b, 1);
    railG.fillRect(cx - 176, railY - 6, 16, 144);
    railG.fillRect(cx + 160, railY - 6, 16, 144);
    railG.fillStyle(0x71717a, 1);
    railG.fillRoundedRect(cx - 180, railY - 8, 360, 16, 4);

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

    const carriageBody = this.add.graphics();
    carriageBody.fillStyle(0x27272a, 1);
    carriageBody.fillRoundedRect(-26, -18, 52, 36, 6);
    carriageBody.fillStyle(cColor, 1);
    carriageBody.fillRoundedRect(-22, 16, 44, 48, 6);
    carriageBody.fillStyle(0x38bdf8, 1);
    carriageBody.fillRect(-30, 32, 8, 36);
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

    const btn = this.createActionBtn(
      width / 2,
      height - 110,
      310,
      74,
      cutsNeeded === 2 ? 'УДЕРЖИВАТЬ: ОТПИЛИТЬ ШАЙБУ №1' : 'УДЕРЖИВАТЬ: ОТРЕЗАТЬ КЕРН'
    );

    const items = [hint, bed, disc1, disc2, cutLines, railG, sawContainer, barBg, barFill, btn.container];
    if (scrap) items.splice(4, 0, scrap);
    this.stageContainer.add(items);

    let cutProgress = 0;
    let cutting = false;
    let locked = false;
    const cutSpeed = 0.52 + (sawLvl - 1) * 0.11;

    btn.zone.on('pointerdown', () => { if (!locked) cutting = true; });
    btn.zone.on('pointerup', () => { cutting = false; });
    btn.zone.on('pointerout', () => { cutting = false; });

    this.currentUpdate = (dt) => {
      if (locked) return;
      teeth.angle += cutting ? 860 * dt : 160 * dt;

      if (cutting) {
        const currentTargetX = cutsDone === 0 ? cut1X : cut2X;
        const startX = cutsDone === 0 ? railStartX : cut1X;

        cutProgress = Math.min(1, cutProgress + cutSpeed * dt);
        sawContainer.x = startX + (currentTargetX - startX) * cutProgress;
        barFill.width = Math.max(2, (barW - 6) * cutProgress);

        this.sawSoundTimer += dt * 1000;
        if (this.sawSoundTimer >= 65) {
          this.sawSoundTimer = 0;
          AudioManager.playSawCut();
          if (cutProgress > 0.5) {
            this.particles.emitParticleAt(sawContainer.x, coreCenterY, 5);
          }
        }

        if (cutProgress >= 1) {
          cutting = false;
          cutsDone += 1;
          AudioManager.playRockCrack();
          this.particles.emitParticleAt(currentTargetX, coreCenterY, 18);
          drawCutMarks();

          if (cutsDone < cutsNeeded) {
            cutProgress = 0;
            barFill.width = 2;
            btn.setLabel('УДЕРЖИВАТЬ: ОТПИЛИТЬ ШАЙБУ №2');
          } else {
            locked = true;
            this.prepScores.push(96);
            const dropTarget = cutsNeeded === 2 ? scrap : disc2;
            if (dropTarget) {
              this.tweens.add({
                targets: dropTarget,
                x: dropTarget.x + 35,
                y: dropTarget.y + 130,
                angle: 28,
                alpha: 0,
                duration: 400,
                ease: 'Quad.easeIn'
              });
            }

            this.tweens.add({
              targets: sawContainer,
              x: railStartX,
              duration: 340
            });

            this.time.delayedCall(650, () => {
              this.afterCutOrSplit(spec);
            });
          }
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 1Б: ГИДРОКЛИН-КОЛУН (Отцентрован строго по стыку половинок!)
  // =========================================================================
  startSplitCrackPhase(spec) {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    this.titleTxt.setText('ГИДРАВЛИЧЕСКИЙ КОЛУН (СКОЛ)');

    const hint = this.add.text(
      width / 2,
      128,
      'Зажми подачу клина, чтобы расколоть керн пополам\nдля испытания среза по неровной трещине!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 345;

    // Нижняя опора-призма
    const anvil = this.add.rectangle(cx, cy + 56, 220, 26, 0x3f3f46);

    // Две половинки керна со стыком ровно на cx
    const leftHalf = this.add.rectangle(cx - 46, cy + 8, 92, 70, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);
    const rightHalf = this.add.rectangle(cx + 46, cy + 8, 92, 70, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // Ось симметрии штока и клина строго на cx (через Graphics с локальным (0,0) = остриё клина)
    const ram = this.add.rectangle(cx, cy - 122, 24, 52, 0x94a3b8);

    const wedgeStartY = cy - 60;
    const wedge = this.add.graphics();
    wedge.x = cx;
    wedge.y = wedgeStartY;
    wedge.fillStyle(0xfacc15, 1);
    wedge.lineStyle(2, 0xb45309, 1);
    wedge.beginPath();
    wedge.moveTo(0, 0);      // Остриё клина строго в (cx, wedge.y)
    wedge.lineTo(-24, -44);  // Левый верхний угол
    wedge.lineTo(24, -44);   // Правый верхний угол
    wedge.closePath();
    wedge.fillPath();
    wedge.strokePath();

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: РАСКОЛОТЬ КЕРН');

    this.stageContainer.add([hint, anvil, leftHalf, rightHalf, ram, wedge, btn.container]);

    let pressure = 0;
    let holding = false;
    let splitDone = false;

    btn.zone.on('pointerdown', () => { if (!splitDone) holding = true; });
    btn.zone.on('pointerup', () => { holding = false; AudioManager.stopPressHum(); });
    btn.zone.on('pointerout', () => { holding = false; AudioManager.stopPressHum(); });

    this.currentUpdate = (dt) => {
      if (splitDone) return;
      if (holding) {
        pressure = Math.min(1, pressure + 0.72 * dt);
        AudioManager.updatePressHum(pressure);
        wedge.y = wedgeStartY + pressure * 42;
        ram.y = wedge.y - 62;

        if (pressure >= 1) {
          splitDone = true;
          holding = false;
          AudioManager.stopPressHum();
          AudioManager.playRockCrack();
          this.cameras.main.shake(160, 0.01);
          this.particles.emitParticleAt(cx, cy + 8, 22);
          this.prepScores.push(95);

          this.tweens.add({ targets: leftHalf, x: cx - 64, angle: -8, duration: 280 });
          this.tweens.add({ targets: rightHalf, x: cx + 64, angle: 8, duration: 280 });

          this.time.delayedCall(720, () => {
            this.afterCutOrSplit(spec);
          });
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 1В: ТОРЦЕШЛИФОВАЛЬНЫЙ СТАНОК (Выравнивание торцов после распила!)
  // =========================================================================
  startGrinderPhase(spec, grinderLvl) {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    this.titleTxt.setText(`ТОРЦЕШЛИФОВАЛЬНЫЙ СТАНОК [Ур. ${grinderLvl}]`);

    const hint = this.add.text(
      width / 2,
      128,
      'Зажми подачу шлифовального круга, чтобы вывести\nидеальную плоскопараллельность торцов (ГОСТ 21153.2)!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 325;

    // Вращающаяся планшайба шлифовального станка
    const wheelColors = [0x64748b, 0x38bdf8, 0x22c55e, 0xa855f7, 0xfacc15];
    const wColor = wheelColors[Math.min(wheelColors.length - 1, grinderLvl - 1)];

    const wheelContainer = this.add.container(cx, cy);
    const outerDisc = this.add.circle(0, 0, 112, 0x334155).setStrokeStyle(5, wColor);
    const innerDisc = this.add.circle(0, 0, 78, 0x475569).setStrokeStyle(2, 0x94a3b8);
    const gritMarks = this.add.graphics();
    gritMarks.lineStyle(2, wColor, 0.7);
    for (let a = 0; a < 360; a += 30) {
      const rad = Phaser.Math.DegToRad(a);
      gritMarks.lineBetween(Math.cos(rad) * 30, Math.sin(rad) * 30, Math.cos(rad) * 104, Math.sin(rad) * 104);
    }
    wheelContainer.add([outerDisc, innerDisc, gritMarks]);

    // Образец прижатый к шлифовальному диску и заусенцы на торцах (которые исчезают при шлифовке)
    const core = this.add.rectangle(cx, cy, spec.calCoreW, spec.calCoreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    const burrs = this.add.graphics();
    const drawBurrs = (roughness) => {
      burrs.clear();
      if (roughness <= 0.05) return;
      burrs.lineStyle(3, 0xfacc15, roughness);
      const halfW = spec.calCoreW / 2;
      const halfH = spec.calCoreH / 2;
      for (let y = -halfH + 6; y <= halfH - 6; y += 12) {
        const jag = 6 * roughness;
        burrs.lineBetween(cx - halfW, cy + y, cx - halfW - jag, cy + y + 4);
        burrs.lineBetween(cx + halfW, cy + y, cx + halfW + jag, cy + y + 4);
      }
    };
    drawBurrs(1.0);

    // Шкала гладкости торцов
    const barW = 280;
    const barX = width / 2 - barW / 2;
    const barY = 462;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x141210, 1);
    barBg.fillRoundedRect(barX, barY, barW, 22, 6);
    const barFill = this.add.rectangle(barX + 3, barY + 3, 2, 16, wColor).setOrigin(0, 0);

    const statusTxt = this.add.text(width / 2, 498, 'Неплоскостность торцов: 0.45 мм', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#fde68a'
    }).setOrigin(0.5);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ШЛИФОВКА ТОРЦОВ');

    this.stageContainer.add([
      hint, wheelContainer, core, burrs, barBg, barFill, statusTxt, btn.container
    ]);

    let polish = 0; // 0..1
    let grinding = false;
    let done = false;
    const grindSpeed = 0.58 + (grinderLvl - 1) * 0.14;

    btn.zone.on('pointerdown', () => { if (!done) grinding = true; });
    btn.zone.on('pointerup', () => { grinding = false; });
    btn.zone.on('pointerout', () => { grinding = false; });

    this.currentUpdate = (dt) => {
      if (done) return;
      gritMarks.angle += grinding ? 620 * dt : 90 * dt;

      if (grinding) {
        polish = Math.min(1, polish + grindSpeed * dt);
        barFill.width = Math.max(2, (barW - 6) * polish);
        drawBurrs(1 - polish);

        const dev = Math.max(0.01, (0.45 * (1 - polish))).toFixed(2);
        statusTxt.setText(`Неплоскостность торцов: ${dev} мм (допуск ≤ 0.05)`);

        this.sawSoundTimer += dt * 1000;
        if (this.sawSoundTimer >= 70) {
          this.sawSoundTimer = 0;
          AudioManager.playSawCut();
          this.particles.emitParticleAt(cx + (Math.random() - 0.5) * spec.calCoreW, cy, 4);
        }

        if (polish >= 1) {
          done = true;
          grinding = false;
          AudioManager.playLatchSnap();
          statusTxt.setText('✓ Торцы отшлифованы в зеркало (0.01 мм)!');
          statusTxt.setColor('#4ade80');
          // Бонус за шлифовку повышает итоговую точность подготовки до 100%
          this.prepScores.push(Math.min(100, 96 + grinderLvl));

          this.time.delayedCall(650, () => {
            this.startMeasurePhase(spec);
          });
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 2: ЗАМЕР ГАБАРИТОВ ШТАНГЕНЦИРКУЛЕМ
  // =========================================================================
  startMeasurePhase(spec) {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    const calLvl = Storage.getUpgradeLevel('caliper');
    this.titleTxt.setText(`ШТАНГЕНЦИРКУЛЬ [Ур. ${calLvl}]`);

    const hint = this.add.text(
      width / 2,
      126,
      `1) Замерь высоту H (↔ норма ${spec.targetH} мм)\n2) Замерь диаметр D (↕ норма ${spec.targetD} мм)`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 278;

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
    const core = this.add.rectangle(cx, cy, coreW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // 1. Горизонтальный штангенциркуль (замер высоты H по горизонтали)
    const hCaliperGroup = this.add.container(0, 0);
    const beamY = cy - coreH / 2 - 22;
    const beamStartX = cx - coreW / 2 - 12;
    const hBeamLen = Math.min(340, coreW + 165);

    const hBeam = this.add.graphics();
    hBeam.fillStyle(theme.bar, 1);
    hBeam.fillRoundedRect(beamStartX, beamY - 11, hBeamLen, 22, 4);
    hBeam.fillRect(beamStartX, beamY - 11, 12, coreH + 34);
    hBeam.lineStyle(1, 0x0f172a, 0.7);
    for (let x = beamStartX + 18; x < beamStartX + hBeamLen - 8; x += 8) {
      const tickH = (x - beamStartX) % 24 === 0 ? 10 : 5;
      hBeam.lineBetween(x, beamY + 11 - tickH, x, beamY + 11);
    }

    const hMaxTravel = 80;
    const hSlider = this.add.container(cx + coreW / 2 + hMaxTravel, beamY);
    const hSliderG = this.add.graphics();
    hSliderG.fillStyle(theme.slider, 1);
    hSliderG.fillRoundedRect(-6, -16, 62, 32, 6);
    hSliderG.lineStyle(2, theme.accent, 0.9);
    hSliderG.strokeRoundedRect(-6, -16, 62, 32, 6);
    hSliderG.fillStyle(theme.bar, 1);
    hSliderG.fillRect(0, 11, 10, coreH + 12);
    hSlider.add(hSliderG);
    hCaliperGroup.add([hBeam, hSlider]);

    // 2. Вертикальный штангенциркуль (замер диаметра D по вертикали)
    const vCaliperGroup = this.add.container(0, 0).setVisible(false);
    const vBeamX = cx - coreW / 2 - 24;
    const vBeamTopY = cy - coreH / 2 - 12;
    const vBeamLen = Math.min(205, coreH + 85);

    const vBeam = this.add.graphics();
    vBeam.fillStyle(theme.bar, 1);
    vBeam.fillRoundedRect(vBeamX - 11, vBeamTopY, 22, vBeamLen, 4);
    vBeam.fillRect(vBeamX - 11, vBeamTopY, coreW + 46, 12);
    vBeam.lineStyle(1, 0x0f172a, 0.7);
    for (let y = vBeamTopY + 18; y < vBeamTopY + vBeamLen - 8; y += 8) {
      const tickW = (y - vBeamTopY) % 24 === 0 ? 10 : 5;
      vBeam.lineBetween(vBeamX + 11 - tickW, y, vBeamX + 11, y);
    }

    const vMaxTravel = 52;
    const vSlider = this.add.container(vBeamX, cy + coreH / 2 + vMaxTravel);
    const vSliderG = this.add.graphics();
    vSliderG.fillStyle(theme.slider, 1);
    vSliderG.fillRoundedRect(-16, -6, 32, 44, 6);
    vSliderG.lineStyle(2, theme.accent, 0.9);
    vSliderG.strokeRoundedRect(-16, -6, 32, 44, 6);
    vSliderG.fillStyle(theme.bar, 1);
    vSliderG.fillRect(11, 0, coreW + 24, 10);
    vSlider.add(vSliderG);
    vCaliperGroup.add([vBeam, vSlider]);

    const lcdBg = this.add.graphics();
    lcdBg.fillStyle(0x0f172a, 1);
    lcdBg.fillRoundedRect(cx - 165, 456, 330, 54, 10);
    lcdBg.lineStyle(2, theme.accent, 0.9);
    lcdBg.strokeRoundedRect(cx - 165, 456, 330, 54, 10);

    const lcdText = this.add.text(
      cx,
      483,
      `ВЫСОТА H: ${(spec.targetH + 25).toFixed(1)} мм (норма ${spec.targetH})`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '15px',
        fontWeight: '700',
        color: '#38bdf8'
      }
    ).setOrigin(0.5);

    const resultSummary = this.add.text(width / 2, 526, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#4ade80'
    }).setOrigin(0.5);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ЗАМЕР ВЫСОТЫ H (↔)');

    this.stageContainer.add([
      hint, core, hCaliperGroup, vCaliperGroup, lcdBg, lcdText, resultSummary, btn.container
    ]);

    let step = 'height_axis';
    let gap = 1.0;
    let holding = false;
    let measuredH = spec.targetH;
    let measuredD = spec.targetD;

    const jawSpeed = Math.max(0.42, 0.72 - (calLvl - 1) * 0.06);

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

      if (step === 'height_axis') {
        measuredH = (spec.targetH + gap * 25).toFixed(1);
        resultSummary.setText(`✓ Высота H: ${measuredH} мм (норма ${spec.targetH} мм)`);
        step = 'diameter_axis';
        gap = 1.0;
        hCaliperGroup.setVisible(false);
        vCaliperGroup.setVisible(true);
        lcdText.setText(`ДИАМЕТР D: ${(spec.targetD + 20).toFixed(1)} мм (норма ${spec.targetD})`);
        lcdText.setColor('#38bdf8');
        btn.setLabel('УДЕРЖИВАТЬ: ЗАМЕР ДИАМЕТРА D (↕)');
      } else if (step === 'diameter_axis') {
        measuredD = (spec.targetD + gap * 20).toFixed(1);
        step = 'done';
        resultSummary.setText(`✓ H = ${measuredH} мм  |  D = ${measuredD} мм — Готово!`);
        this.particles.emitParticleAt(cx, cy, 14);

        this.time.delayedCall(800, () => {
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
      if (gap < -0.22) {
        gap = -0.22;
        releaseJaw();
        return;
      }

      if (step === 'height_axis') {
        hSlider.x = cx + coreW / 2 + gap * hMaxTravel;
        const mm = (spec.targetH + gap * 25).toFixed(1);
        lcdText.setText(`ВЫСОТА H: ${mm} мм (норма ${spec.targetH})`);
        lcdText.setColor(Math.abs(gap) <= 0.08 ? '#4ade80' : '#38bdf8');
      } else {
        vSlider.y = cy + coreH / 2 + gap * vMaxTravel;
        const mm = (spec.targetD + gap * 20).toFixed(1);
        lcdText.setText(`ДИАМЕТР D: ${mm} мм (норма ${spec.targetD})`);
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
