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
    bg.fillStyle(0x1c1917, 1);
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

    // Бонусы от купленных интерьерных перков (кофемашина, витрина минералов, LED-свет)
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

    PlatformSDK.onContractFinished();
    this.showCutsceneModal(outcomeType, moneyDelta, repDelta);
  }

  showCutsceneModal(outcomeType, moneyDelta, repDelta) {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0c0a09, 0.92);
    overlay.fillRect(0, 0, width, height);

    const boxW = 390;
    const boxH = 540;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    overlay.fillStyle(0x292524, 1);
    overlay.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    overlay.lineStyle(3, outcomeType === 'collapse' ? 0xef4444 : 0xfacc15, 1);
    overlay.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const art = this.add.graphics();
    const sceneTop = boxY + 30;
    const sceneH = 190;
    art.fillStyle(outcomeType === 'collapse' ? 0x450a0a : 0x0c4a6e, 1);
    art.fillRoundedRect(boxX + 24, sceneTop, boxW - 48, sceneH, 10);

    art.fillStyle(0x78350f, 1);
    art.fillRect(boxX + 24, sceneTop + 135, boxW - 48, 55);

    if (outcomeType === 'success') {
      art.fillStyle(0xe2e8f0, 1);
      art.fillRect(width / 2 - 55, sceneTop + 45, 110, 90);
      art.fillStyle(0x38bdf8, 1);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          art.fillRect(width / 2 - 40 + c * 30, sceneTop + 58 + r * 24, 16, 14);
        }
      }
    } else if (outcomeType === 'collapse') {
      art.fillStyle(0x94a3b8, 1);
      art.fillRect(width / 2 - 60, sceneTop + 95, 55, 42);
      art.fillRect(width / 2 + 5, sceneTop + 105, 50, 34);
      art.lineStyle(4, 0xef4444, 1);
      art.lineBetween(width / 2 - 10, sceneTop + 135, width / 2 + 18, sceneTop + 185);
    } else {
      art.fillStyle(0xfacc15, 1);
      art.fillRect(width / 2 - 80, sceneTop + 112, 160, 16);
      art.fillStyle(0x1c1917, 1);
      art.fillRect(width / 2 - 50, sceneTop + 112, 20, 16);
      art.fillRect(width / 2 + 10, sceneTop + 112, 20, 16);
    }

    const titles = {
      success: 'СТРОЙКА ПРОШЛА УСПЕШНО!',
      saved_lives: 'ОБЪЕКТ СПАСЁН ОТ АВАРИИ!',
      collapse: 'ПРОИЗОШЁЛ ОБВАЛ ГРУНТА!',
      false_alarm: 'ЛОЖНАЯ ТРЕВОГА ЗАКАЗЧИКА'
    };

    const descriptions = {
      success: `Фундамент выдержал нагрузку.\nРеальная прочность породы: ${this.contract.trueStrengthMpa} МПа.`,
      saved_lives: `Ты вовремя выявил слабый грунт (${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа). Заказчик перенёс площадку!`,
      collapse: `Приборы ошиблись из-за погрешности! Реальная прочность была всего ${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа.`,
      false_alarm: `Грунт на самом деле выдержал бы (${this.contract.trueStrengthMpa} МПа). Независимая экспертиза оспорила отказ.`
    };

    this.add.text(width / 2, boxY + 248, titles[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: outcomeType === 'collapse' ? '#f87171' : '#4ade80',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, boxY + 305, descriptions[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      color: '#e7e5e4',
      align: 'center',
      wordWrap: { width: boxW - 44 },
      lineSpacing: 5
    }).setOrigin(0.5);

    const repSign = repDelta >= 0 ? `+${repDelta}` : `${repDelta}`;
    this.add.text(width / 2, boxY + 372, `Гонорар: +${moneyDelta} ₽   |   Репутация: ${repSign} ★`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    let nextBtnY = boxY + 475;
    if (moneyDelta > 0) {
      const adBtn = this.add.text(width / 2, boxY + 422, `🎬 УДВОИТЬ ГОНОРАР (+${moneyDelta} ₽)`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#1c1917',
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
      nextBtnY = boxY + 455;
    }

    const continueBtn = this.add.text(width / 2, nextBtnY, 'ВЕРНУТЬСЯ В ЛАБОРАТОРИЮ →', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fef3c7',
      backgroundColor: '#d97706',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });
  }
}
