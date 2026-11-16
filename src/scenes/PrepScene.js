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
      // Цилиндр лежит горизонтально: ширина на экране = Высота H (100 мм), высота на экране = Диаметр D (50 мм)
      specs.push({
        mode: 'cylinder',
        label: 'Цилиндр (H=100 × D=50 мм)',
        targetH: 100.0,
        targetD: 50.0,
        sawKeepW: 165,
        sawCoreH: 62,
        calCoreW: 150,
        calCoreH: 75
      });
    }

    if (needsTwoDiscs) {
      // Шайба сдвига: толщина H = 35 мм (узкая по горизонтали), диаметр D = 70 мм (широкая по вертикали)
      specs.push({
        mode: 'two_discs',
        label: 'Две шайбы (H=35 × D=70 мм)',
        targetH: 35.0,
        targetD: 70.0,
        sawKeepW: 68,
        sawCoreH: 88,
        calCoreW: 54,
        calCoreH: 108
      });
    }

    if (needsSplit) {
      specs.push({
        mode: 'split_core',
        label: 'Раскол керна (H=70 × D=70 мм)',
        targetH: 70.0,
        targetD: 70.0,
        calCoreW: 105,
        calCoreH: 105
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
        calCoreW: 150,
        calCoreH: 75
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

            this.time.delayedCall(700, () => {
              this.startMeasurePhase(spec);
            });
          }
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 1Б: ГИДРОКЛИН-КОЛУН
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
    const cy = 335;

    const anvil = this.add.rectangle(cx, cy + 56, 220, 26, 0x3f3f46);
    const leftHalf = this.add.rectangle(cx - 46, cy + 8, 92, 70, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);
    const rightHalf = this.add.rectangle(cx + 46, cy + 8, 92, 70, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    const wedge = this.add.triangle(cx, cy - 82, 0, 44, -22, 0, 22, 0, 0xfacc15);
    const ram = this.add.rectangle(cx, cy - 115, 24, 50, 0x94a3b8);

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
        wedge.y = cy - 82 + pressure * 42;
        ram.y = wedge.y - 33;

        if (pressure >= 1) {
          
