import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { PlatformSDK } from '../utils/PlatformSDK.js';

export class ReportScene extends Phaser.Scene {
  constructor() {
    super('ReportScene');
  }

  init(data) {
    this.contract = data.contract;
    this.avgAccuracy = data.avgAccuracy;
    this.errorPct = data.errorPct;
    this.measuredMpa = data.measuredMpa;
    this.verdictLocked = false;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x181e29, 1);
    bg.fillRect(0, 0, width, height);

    const padX = 24;
    const sheetW = width - padX * 2;
    const sheetH = 470;
    const sheetY = 36;

    const sheet = this.add.graphics();
    sheet.fillStyle(0xfef3c7, 1);
    sheet.fillRoundedRect(padX, sheetY, sheetW, sheetH, 10);
    sheet.lineStyle(3, 0x78350f, 1);
    sheet.strokeRoundedRect(padX, sheetY, sheetW, sheetH, 10);

    this.add.text(width / 2, sheetY + 28, 'ПРОТОКОЛ ИСПЫТАНИЙ ГРУНТА', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#1c1917'
    }).setOrigin(0.5);

    this.add.text(width / 2, sheetY + 52, `Лаборатория ROCK LAB · Заказчик: ${this.contract.company}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '600',
      color: '#57534e'
    }).setOrigin(0.5);

    sheet.lineStyle(2, 0xb45309, 0.5);
    sheet.lineBetween(padX + 16, sheetY + 70, padX + sheetW - 16, sheetY + 70);

    const infoLines = [
      `Объект: ${this.contract.title}`,
      `Исследованная порода: ${this.contract.rock.name}`,
      `Требуемая норма объекта: ≥ ${this.contract.reqMpa} МПа`
    ];

    this.add.text(padX + 20, sheetY + 86, infoLines.join('\n'), {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#292524',
      lineSpacing: 8
    });

    sheet.fillStyle(0xfde68a, 1);
    sheet.fillRoundedRect(padX + 18, sheetY + 182, sheetW - 36, 130, 8);
    sheet.lineStyle(2, 0xd97706, 0.8);
    sheet.strokeRoundedRect(padX + 18, sheetY + 182, sheetW - 36, 130, 8);

    const errColor = this.errorPct <= 8 ? '#15803d' : this.errorPct <= 18 ? '#b45309' : '#b91c1c';

    this.add.text(width / 2, sheetY + 204, 'ЗАФИКСИРОВАННАЯ ПРОЧНОСТЬ:', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#57534e'
    }).setOrigin(0.5);

    this.add.text(width / 2, sheetY + 238, `${this.measuredMpa} МПа  (±${this.errorPct}%)`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '26px',
      fontWeight: '700',
      color: '#1c1917'
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      sheetY + 278,
      `Точность работы: ${this.avgAccuracy}% (${this.errorPct > 15 ? 'ВНИМАНИЕ: ВЫСОКАЯ ПОГРЕШНОСТЬ!' : 'Датчики в норме'})`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: errColor
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      sheetY + 365,
      'Сопоставь показание прибора с нормой объекта\nи поставь итоговую печать лаборатории:',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#44403c',
        align: 'center',
        lineSpacing: 4
      }
    ).setOrigin(0.5);

    this.createStampButton(
      width / 2,
      height - 195,
      360,
      64,
      '✅ ОДОБРИТЬ СТРОЙКУ (ГРУНТ ГОДЕН)',
      0x15803d,
      () => this.submitVerdict(true)
    );

    this.createStampButton(
      width / 2,
      height - 115,
      360,
      64,
      '⛔ ЗАБРАКОВАТЬ (ВЫСОКИЙ РИСК ОБВАЛА)',
      0xb91c1c,
      () => this.submitVerdict(false)
    );
  }

  createStampButton(x, y, w, h, label, bgColor, onClick) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 12);
    g.fillStyle(bgColor, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.lineStyle(2, 0xffffff, 0.25);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    const zone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.verdictLocked) return;
      this.verdictLocked = true;
      AudioManager.playStamp();
      onClick();
    });

    container.add([g, txt, zone]);
  }

  submitVerdict(approvedByPlayer) {
    const actuallySafe = this.contract.isActuallySafe;
    const isCorrectDecision = approvedByPlayer === actuallySafe;

    const loaderLvl = Storage.getUpgradeLevel('loader');
    const bonusMult = 1 + (loaderLvl - 1) * 0.1;

    const perkCashBonus =
      Storage.getPerkLevel('coffee') * 15 +
      Storage.getPerkLevel('showcase') * 30;
    const perkRepBonus = Storage.getPerkLevel('decor');

    let moneyDelta = 0;
    let repDelta = 0;
    let outcomeType = 'success';

    if (isCorrectDecision && approvedByPlayer) {
      outcomeType = 'success';
      moneyDelta = Math.round(this.contract.reward * bonusMult) + perkCashBonus;
      repDelta = this.contract.repReward + perkRepBonus;
    } else if (isCorrectDecision && !approvedByPlayer) {
      outcomeType = 'saved_lives';
      moneyDelta = Math.round(this.contract.reward * 0.85 * bonusMult) + perkCashBonus;
      repDelta = this.contract.repReward + 1 + perkRepBonus;
    } else if (!isCorrectDecision && approvedByPlayer) {
      outcomeType = 'collapse';
      moneyDelta = 0;
      repDelta = -Math.max(2, this.contract.tier * 2);
      this.cameras.main.shake(320, 0.018);
      AudioManager.playRockCrack();
    } else {
      outcomeType = 'false_alarm';
      moneyDelta = Math.round(this.contract.reward * 0.35);
      repDelta = -1;
    }

    if (moneyDelta > 0) Storage.addMoney(moneyDelta);
    Storage.addReputation(repDelta);
    Storage.setActiveContract(null);
    if (isCorrectDecision) Storage.incrementCompleted();

    Storage.addSiteRecord({
      title: this.contract.title,
      rockName: this.contract.rock.name,
      outcome: outcomeType
    });

    PlatformSDK.onContractFinished();
    this.showAnimatedCutsceneModal(outcomeType, moneyDelta, repDelta);
  }

  // Живая анимированная мини-сценка в зависимости от объекта и исхода!
  showAnimatedCutsceneModal(outcomeType, moneyDelta, repDelta) {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0b101b, 0.94);
    overlay.fillRect(0, 0, width, height);

    const boxW = 396;
    const boxH = 550;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    overlay.fillStyle(0x1e293b, 1);
    overlay.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    overlay.lineStyle(3, outcomeType === 'collapse' ? 0xef4444 : 0xfacc15, 1);
    overlay.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const sceneX = boxX + 22;
    const sceneY = boxY + 24;
    const sceneW = boxW - 44;
    const sceneH = 200;

    // Небо и грунтовый массив мини-сценки
    const sky = this.add.graphics();
    sky.fillStyle(outcomeType === 'collapse' ? 0x450a0a : 0x0c4a6e, 1);
    sky.fillRoundedRect(sceneX, sceneY, sceneW, sceneH, 10);

    const groundY = sceneY + 142;
    const groundBlock = this.add.rectangle(
      width / 2,
      groundY + 29,
      sceneW,
      58,
      this.contract.rock.color
    );

    const dustParticles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 140 },
      scale: { start: 1.2, end: 0 },
      lifespan: 480,
      emitting: false
    }).setDepth(30);

    const titleLower = (this.contract.title || '').toLowerCase();
    const isBridge = titleLower.includes('мост');
    const isDam = titleLower.includes('гэс') || titleLower.includes('плотин');
    const isTunnel = titleLower.includes('тоннел') || titleLower.includes('карьер');

    // =====================================================================
    // АНИМАЦИЯ 1: СТРОЙКА ЗАПУЩЕНА (Кран монтирует этажи / пролёты моста)
    // =====================================================================
    if (outcomeType === 'success') {
      // Башенный кран справа
      const crane = this.add.graphics();
      crane.fillStyle(0xfacc15, 1);
      crane.fillRect(sceneX + sceneW - 48, sceneY + 24, 10, 118);
      crane.fillRect(sceneX + 40, sceneY + 30, sceneW - 76, 8);

      // Крюк крана катается и опускает конструкции
      const hookCable = this.add.rectangle(width / 2, sceneY + 55, 2, 34, 0xe2e8f0);
      this.tweens.add({
        targets: hookCable,
        x: width / 2 + 24,
        duration: 900,
        yoyo: true,
        repeat: -1
      });

      if (isBridge) {
        // Опоры моста + опускающийся центральный пролёт
        this.add.rectangle(width / 2 - 70, groundY - 26, 22, 52, 0x94a3b8);
        this.add.rectangle(width / 2 + 70, groundY - 26, 22, 52, 0x94a3b8);
        const span = this.add.rectangle(width / 2, sceneY + 45, 185, 16, 0x38bdf8);
        this.tweens.add({
          targets: span,
          y: groundY - 56,
          duration: 850,
          ease: 'Bounce.easeOut',
          onComplete: () => dustParticles.emitParticleAt(width / 2, groundY - 50, 14)
        });
      } else if (isDam) {
        // Тело плотины ГЭС + поток воды
        const damWall = this.add.rectangle(width / 2, groundY - 10, 150, 10, 0xcbd5e1).setOrigin(0.5, 1);
        this.tweens.add({
          targets: damWall,
          height: 82,
          duration: 900,
          ease: 'Cubic.easeOut'
        });
        const waterfall = this.add.rectangle(width / 2 + 30, groundY - 35, 28, 70, 0x38bdf8, 0.75);
        this.tweens.add({
          targets: waterfall,
          alpha: 0.35,
          duration: 300,
          yoyo: true,
          repeat: -1
        });
      } else {
        // Поэтажное возведение здания / опоры с зажигающимися окнами
        for (let floor = 0; floor < 3; floor++) {
          const fy = groundY - 14 - floor * 28;
          const block = this.add.rectangle(width / 2 - 12, sceneY + 35, 114, 26, 0xe2e8f0)
            .setStrokeStyle(2, 0x64748b);

          this.tweens.add({
            targets: block,
            y: fy,
            delay: floor * 280,
            duration: 460,
            ease: 'Back.easeOut',
            onComplete: () => {
              dustParticles.emitParticleAt(width / 2 - 12, fy + 10, 8);
              for (let c = -1; c <= 1; c++) {
                this.add.rectangle(width / 2 - 12 + c * 30, fy, 14, 12, 0x38bdf8);
              }
            }
          });
        }
      }
    }

    // =====================================================================
    // АНИМАЦИЯ 2: ОБВАЛ ГРУНТА И РАЗРУШЕНИЕ КОНСТРУКЦИИ
    // =====================================================================
    if (outcomeType === 'collapse') {
      const leftBlock = this.add.rectangle(width / 2 - 34, groundY - 26, 62, 52, 0x94a3b8);
      const rightBlock = this.add.rectangle(width / 2 + 34, groundY - 26, 62, 52, 0x94a3b8);

      // Трещина разлома в грунте
      const crack = this.add.graphics();
      crack.lineStyle(4, 0xef4444, 1);
      crack.beginPath();
      crack.moveTo(width / 2 - 8, groundY);
      crack.lineTo(width / 2 + 12, groundY + 28);
      crack.lineTo(width / 2 - 6, groundY + 56);
      crack.strokePath();

      // Анимация проседания и завала блоков в облаке пыли
      this.tweens.add({
        targets: leftBlock,
        y: groundY + 4,
        angle: -24,
        duration: 620,
        ease: 'Bounce.easeOut',
        onStart: () => dustParticles.emitParticleAt(width / 2, groundY - 10, 26)
      });
      this.tweens.add({
        targets: rightBlock,
        y: groundY + 8,
        angle: 28,
        duration: 680,
        ease: 'Bounce.easeOut'
      });
    }

    // =====================================================================
    // АНИМАЦИЯ 3: ОБЪЕКТ СПАСЁН (Геологоразведка переносит площадку)
    // =====================================================================
    if (outcomeType === 'saved_lives') {
      // Предупреждающий барьер слева + буровая вышка переносится на крепкую скалу справа
      const beacon = this.add.circle(sceneX + 68, groundY - 16, 10, 0xfacc15);
      this.tweens.add({
        targets: beacon,
        alpha: 0.2,
        duration: 280,
        yoyo: true,
        repeat: -1
      });

      const rig = this.add.triangle(sceneX + 75, groundY - 36, 0, -48, -22, 24, 22, 24, 0x38bdf8);
      this.tweens.add({
        targets: rig,
        x: width / 2 + 68,
        duration: 950,
        ease: 'Cubic.easeInOut',
        onComplete: () => dustParticles.emitParticleAt(width / 2 + 68, groundY - 10, 12)
      });
    }

    // =====================================================================
    // АНИМАЦИЯ 4: ЛОЖНАЯ ТРЕВОГА (Приезд контрольной комиссии)
    // =====================================================================
    if (outcomeType === 'false_alarm') {
      const car = this.add.rectangle(sceneX + 45, groundY - 14, 68, 24, 0xfacc15);
      this.tweens.add({
        targets: car,
        x: width / 2,
        duration: 750,
        ease: 'Cubic.easeOut'
      });
    }

    const titles = {
      success: 'СТРОЙКА ЗАПУЩЕНА УСПЕШНО!',
      saved_lives: 'ОБЪЕКТ СПАСЁН ОТ ОБВАЛА!',
      collapse: 'ПРОИЗОШЁЛ ОБВАЛ ГРУНТА!',
      false_alarm: 'ЛОЖНАЯ ТРЕВОГА ЗАКАЗЧИКА'
    };

    const descriptions = {
      success: `Основание выдержало нагрузку.\nРеальная прочность породы: ${this.contract.trueStrengthMpa} МПа.`,
      saved_lives: `Ты вовремя выявил слабый грунт (${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа). Площадка перенесена!`,
      collapse: `Приборы ошиблись из-за погрешности! Реальная прочность была всего ${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа.`,
      false_alarm: `Грунт на самом деле выдержал бы (${this.contract.trueStrengthMpa} МПа). Независимая экспертиза оспорила отказ.`
    };

    this.add.text(width / 2, boxY + 252, titles[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: outcomeType === 'collapse' ? '#f87171' : '#4ade80',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, boxY + 308, descriptions[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      color: '#e2e8f0',
      align: 'center',
      wordWrap: { width: boxW - 44 },
      lineSpacing: 5
    }).setOrigin(0.5);

    const repSign = repDelta >= 0 ? `+${repDelta}` : `${repDelta}`;
    this.add.text(width / 2, boxY + 374, `Гонорар: +${moneyDelta} ₽   |   Репутация: ${repSign} ★`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    let nextBtnY = boxY + 480;
    if (moneyDelta > 0) {
      const adBtn = this.add.text(width / 2, boxY + 425, `🎬 УДВОИТЬ ГОНОРАР (+${moneyDelta} ₽)`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#0f172a',
        backgroundColor: '#facc15',
        padding: { x: 16, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      adBtn.once('pointerdown', () => {
        PlatformSDK.showRewarded(() => {
          Storage.addMoney(moneyDelta);
          AudioManager.playLatchSnap();
          adBtn.setText(`✅ ПОЛУЧЕНО ЕЩЁ +${moneyDelta} ₽!`);
          adBtn.disableInteractive();
        });
      });
    } else {
      nextBtnY = boxY + 458;
    }

    const continueBtn = this.add.text(width / 2, nextBtnY, 'ВЕРНУТЬСЯ В ЛАБОРАТОРИЮ →', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#d97706',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });
  }
}
