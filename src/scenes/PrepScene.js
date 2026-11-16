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

    // Фон камнерезного и измерительного участка
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

    this.titleTxt = this.add.text(width / 2, 54, 'КАМНЕРЕЗНЫЙ СТАНОК', {
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
  // ФАЗА 1: РАСПИЛ ДЛИННОГО КЕРНА АЛМАЗНЫМ ДИСКОМ
  // =========================================================================
  startSawPhase() {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    this.titleTxt.setText('КАМНЕРЕЗНЫЙ СТАНОК');

    const hint = this.add.text(
      width / 2,
      128,
      'Зажми подачу пилы, чтобы отрезать лишний торец\nпо пунктирной линии разметки (100 мм)',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 320;

    // Станина станка
    const bed = this.add.graphics();
    bed.fillStyle(0x3f3f46, 1);
    bed.fillRoundedRect(cx - 175, cy + 36, 350, 32, 8);
    bed.fillStyle(0x52525b, 1);
    bed.fillRect(cx - 155, cy - 28, 22, 64); // упор слева

    // Длинный необработанный керн (левая рабочая часть + правый отрезаемый кусок)
    const keepW = 160;
    const scrapW = 110;
    const coreH = 64;
    const leftX = cx - 130;
    const cutX = leftX + keepW;

    const mainCore = this.add.rectangle(leftX + keepW / 2, cy + 4, keepW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    const scrapCore = this.add.rectangle(cutX + scrapW / 2, cy + 4, scrapW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // Пунктирная линия реза
    const cutLine = this.add.graphics();
    cutLine.lineStyle(3, 0x22c55e, 0.95);
    for (let y = cy - 46; y < cy + 54; y += 12) {
      cutLine.lineBetween(cutX, y, cutX, y + 6);
    }

    // Вращающийся алмазный диск сверху
    const sawStartY = cy - 115;
    const sawEndY = cy + 42;
    const sawContainer = this.add.container(cutX, sawStartY);

    const blade = this.add.circle(0, 0, 44, 0x94a3b8).setStrokeStyle(4, 0xe2e8f0);
    const teeth = this.add.graphics();
    teeth.lineStyle(2, 0x334155, 1);
    teeth.lineBetween(-36, 0, 36, 0);
    teeth.lineBetween(0, -36, 0, 36);
    teeth.lineBetween(-25, -25, 25, 25);
    teeth.lineBetween(-25, 25, 25, -25);
    const hub = this.add.circle(0, 0, 12, 0xd97706);
    sawContainer.add([blade, teeth, hub]);

    // Прогресс-бар пропила
    const barW = 280;
    const barX = width / 2 - barW / 2;
    const barY = 445;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x141210, 1);
    barBg.fillRoundedRect(barX, barY, barW, 22, 6);
    const barFill = this.add.rectangle(barX + 3, barY + 3, 2, 16, 0xd97706).setOrigin(0, 0);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: ОТРЕЗАТЬ КЕРН');

    this.stageContainer.add([
      hint, bed, mainCore, scrapCore, cutLine, sawContainer, barBg, barFill, btn.container
    ]);

    let cutProgress = 0; // 0..1
    let cutting = false;
    let finished = false;
    const drillLvl = Storage.getUpgradeLevel('drill');
    const cutSpeed = 0.52 + (drillLvl - 1) * 0.08;

    btn.zone.on('pointerdown', () => { if (!finished) cutting = true; });
    btn.zone.on('pointerup', () => { cutting = false; });
    btn.zone.on('pointerout', () => { cutting = false; });

    this.currentUpdate = (dt) => {
      if (finished) return;
      teeth.angle += cutting ? 720 * dt : 140 * dt;

      if (cutting) {
        cutProgress = Math.min(1, cutProgress + cutSpeed * dt);
        sawContainer.y = sawStartY + (sawEndY - sawStartY) * cutProgress;
        barFill.width = Math.max(2, (barW - 6) * cutProgress);

        this.sawSoundTimer += dt * 1000;
        if (this.sawSoundTimer >= 65) {
          this.sawSoundTimer = 0;
          AudioManager.playSawCut();
          if (cutProgress > 0.25) {
            this.particles.emitParticleAt(cutX, cy - 10 + cutProgress * 30, 5);
          }
        }

        if (cutProgress >= 1) {
          finished = true;
          cutting = false;
          AudioManager.playRockCrack();
          this.particles.emitParticleAt(cutX, cy + 10, 20);
          this.prepScores.push(95);

          // Отпиленный кусок падает вниз
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
            y: sawStartY,
            duration: 300
          });

          this.time.delayedCall(750, () => {
            this.startMeasurePhase();
          });
        }
      }
    };
  }

  // =========================================================================
  // ФАЗА 2: ЗАМЕР ДЛИНЫ И ШИРИНЫ ШТАНГЕНЦИРКУЛЕМ
  // =========================================================================
  startMeasurePhase() {
    const { width, height } = this.scale;
    this.stageContainer.removeAll(true);
    this.titleTxt.setText('ЗАМЕР ГАБАРИТОВ (ШТАНГЕНЦИРКУЛЬ)');

    const hint = this.add.text(
      width / 2,
      128,
      'Зажми кнопку и отпусти, когда губки\nштангенциркуля плотно прижмутся к керну!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#e7e5e4',
        align: 'center'
      }
    ).setOrigin(0.5);

    const cx = width / 2;
    const cy = 305;

    // Готовый отпиленный керн в центре
    const coreW = 140; // соответствует 100.0 мм
    const coreH = 74;  // соответствует 50.0 мм
    const core = this.add.rectangle(cx, cy, coreW, coreH, this.contract.rock.color)
      .setStrokeStyle(2, 0x1c1917);

    // Цифровое табло штангенциркуля
    const lcdBg = this.add.graphics();
    lcdBg.fillStyle(0x0f172a, 1);
    lcdBg.fillRoundedRect(cx - 135, cy + 95, 270, 56, 10);
    lcdBg.lineStyle(2, 0x38bdf8, 0.8);
    lcdBg.strokeRoundedRect(cx - 135, cy + 95, 270, 56, 10);

    const lcdText = this.add.text(cx, cy + 123, 'ДЛИНА (H): 135.0 мм', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '19px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const resultSummary = this.add.text(width / 2, cy + 174, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#4ade80'
    }).setOrigin(0.5);

    // Губки штангенциркуля (для замера длины по горизонтали и ширины по вертикали)
    const leftJaw = this.add.rectangle(cx - coreW / 2 - 4, cy, 8, 108, 0xe2e8f0);
    const rightJaw = this.add.rectangle(cx + 125, cy, 8, 108, 0xfacc15);

    const topJaw = this.add.rectangle(cx, cy - coreH / 2 - 4, 108, 8, 0xe2e8f0).setVisible(false);
    const bottomJaw = this.add.rectangle(cx, cy + 95, 108, 8, 0xfacc15).setVisible(false);

    const btn = this.createActionBtn(width / 2, height - 110, 310, 74, 'УДЕРЖИВАТЬ: СВЕСТИ ГУБКИ (ДЛИНА)');

    this.stageContainer.add([
      hint, core, lcdBg, lcdText, resultSummary,
      leftJaw, rightJaw, topJaw, bottomJaw, btn.container
    ]);

    let step = 'length'; // 'length' -> 'width' -> 'done'
    let gap = 1.0; // 1.0 (широко) -> 0.0 (идеальный прижим) -> -0.25 (пережим)
    let holding = false;
    let measuredH = 100;
    let measuredD = 50;

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
        leftJaw.setVisible(false);
        rightJaw.setVisible(false);
        topJaw.setVisible(true);
        bottomJaw.setVisible(true);
        btn.setLabel('УДЕРЖИВАТЬ: ЗАМЕР ШИРИНЫ');
      } else if (step === 'width') {
        measuredD = (50 + gap * 20).toFixed(1);
        step = 'done';
        resultSummary.setText(`✓ H = ${measuredH} мм  |  D = ${measuredD} мм — Готово к прессу!`);
        this.particles.emitParticleAt(cx, cy, 14);

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

      gap -= 0.72 * dt;
      if (gap < -0.25) {
        gap = -0.25;
        releaseJaw();
        return;
      }

      if (step === 'length') {
        const currentSpan = coreW + gap * 110;
        rightJaw.x = cx - coreW / 2 + currentSpan;
        const mm = (100 + gap * 35).toFixed(1);
        lcdText.setText(`ДЛИНА (H): ${mm} мм`);
        lcdText.setColor(Math.abs(gap) <= 0.08 ? '#4ade80' : '#38bdf8');
      } else {
        const currentSpan = coreH + gap * 95;
        bottomJaw.y = cy - coreH / 2 + currentSpan;
        const mm = (50 + gap * 20).toFixed(1);
        lcdText.setText(`ШИРИНА (D): ${mm} мм`);
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
    if (this.currentUpdate) {
      this.currentUpdate(delta / 1000);
    }
  }
}
