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

    const isAudit = Boolean(this.contract.isAudit);
    const sheet = this.add.graphics();
    sheet.fillStyle(isAudit ? 0xe0f2fe : 0xfef3c7, 1);
    sheet.fillRoundedRect(padX, sheetY, sheetW, sheetH, 10);
    sheet.lineStyle(3, isAudit ? 0x1d4ed8 : 0x78350f, 1);
    sheet.strokeRoundedRect(padX, sheetY, sheetW, sheetH, 10);

    this.add.text(
      width / 2,
      sheetY + 28,
      isAudit ? 'ПРОТОКОЛ КОНТРОЛЬНОГО АУДИТА' : 'ПРОТОКОЛ ИСПЫТАНИЙ ГРУНТА',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '17px',
        fontWeight: '700',
        color: '#1c1917'
      }
    ).setOrigin(0.5);

    this.add.text(width / 2, sheetY + 52, `Лаборатория ROCK LAB · Заказчик: ${this.contract.company}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '600',
      color: '#57534e'
    }).setOrigin(0.5);

    sheet.lineStyle(2, isAudit ? 0x2563eb : 0xb45309, 0.5);
    sheet.lineBetween(padX + 16, sheetY + 70, padX + sheetW - 16, sheetY + 70);

    const infoLines = [
      `Объект: ${this.contract.title}`,
      `Исследованная порода: ${this.contract.rock.name}`,
      isAudit
        ? `Контрольная норма: ≥ ${this.contract.reqMpa} МПа (допуск ≤ ${this.contract.maxAllowedErrorPct}%)`
        : `Требуемая норма объекта: ≥ ${this.contract.reqMpa} МПа`
    ];

    this.add.text(padX + 20, sheetY + 86, infoLines.join('\n'), {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#292524',
      lineSpacing: 8
    });

    sheet.fillStyle(isAudit ? 0xbae6fd : 0xfde68a, 1);
    sheet.fillRoundedRect(padX + 18, sheetY + 182, sheetW - 36, 130, 8);
    sheet.lineStyle(2, isAudit ? 0x0284c9 : 0xd97706, 0.8);
    sheet.strokeRoundedRect(padX + 18, sheetY + 182, sheetW - 36, 130, 8);

    const errColor = this.errorPct <= 9 ? '#15803d' : this.errorPct <= 18 ? '#b45309' : '#b91c1c';

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
      `Точность работы: ${this.avgAccuracy}% (${this.errorPct > 12 ? 'НУЖНА ПОВЕРКА ПРИБОРОВ!' : 'Поверка в норме'})`,
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
      '✅ ОДОБРИТЬ (ОБРАЗЕЦ СООТВЕТСТВУЕТ)',
      0x15803d,
      () => this.submitVerdict(true)
    );

    this.createStampButton(
      width / 2,
      height - 115,
      360,
      64,
      '⛔ ЗАБРАКОВАТЬ (НИЖЕ НОРМЫ)',
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
    const isAudit = Boolean(this.contract.isAudit);

    // Списываем износ расходников и поверки после завершённого испытания
    Storage.applyContractWear(this.contract.tests?.length || 1);

    const loaderLvl = Storage.getUpgradeLevel('loader');
    const bonusMult = 1 + (loaderLvl - 1) * 0.1;

    const perkCashBonus =
      Storage.getPerkLevel('coffee') * 15 +
      Storage.getPerkLevel('showcase') * 30;
    const perkRepBonus = Storage.getPerkLevel('decor');

    let moneyDelta = 0;
    let repDelta = 0;
    let outcomeType = 'success';

    if (isAudit) {
      Storage.resetAuditCounter();
      const withinErrorLimit = this.errorPct <= (this.contract.maxAllowedErrorPct || 9);
      if (isCorrectDecision && withinErrorLimit) {
        outcomeType = 'audit_pass';
        moneyDelta = this.contract.reward;
        repDelta = this.contract.repReward;
        Storage.setAuditBonus(3); // Повышенный тариф +15% на следующие 3 заказа!
      } else {
        outcomeType = 'audit_fail';
        moneyDelta = 0;
        repDelta = -4;
      }
    } else {
      Storage.consumeAuditBonus();
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
    }

    if (moneyDelta > 0) Storage.addMoney(moneyDelta);
    Storage.addReputation(repDelta);
    Storage.setActiveContract(null);
    if (!isAudit && isCorrectDecision) Storage.incrementCompleted();

    Storage.addSiteRecord({
      title: this.contract.title,
      rockName: this.contract.rock.name,
      outcome: outcomeType
    });

    PlatformSDK.onContractFinished();
    this.showAnimatedCutsceneModal(outcomeType, moneyDelta, repDelta);
  }

  showAnimatedCutsceneModal(outcomeType, moneyDelta, repDelta) {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0b101b, 0.94);
    overlay.fillRect(0, 0, width, height);

    const boxW = 396;
    const boxH = 550;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    const isBad = outcomeType === 'collapse' || outcomeType === 'audit_fail';
    overlay.fillStyle(0x1e293b, 1);
    overlay.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    overlay.lineStyle(3, isBad ? 0xef4444 : 0xfacc15, 1);
    overlay.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const sceneX = boxX + 20;
    const sceneY = boxY + 22;
    const sceneW = boxW - 40;
    const sceneH = 206;

    const backdrop = this.add.graphics();
    backdrop.fillStyle(isBad ? 0x3b0d11 : 0x0c4a6e, 1);
    backdrop.fillRoundedRect(sceneX, sceneY, sceneW, sceneH, 10);

    backdrop.fillStyle(isBad ? 0x57181d : 0x1e3a8a, 0.75);
    backdrop.fillTriangle(sceneX + 10, sceneY + 145, sceneX + 95, sceneY + 78, sceneX + 185, sceneY + 145);
    backdrop.fillTriangle(sceneX + 140, sceneY + 145, sceneX + 245, sceneY + 68, sceneX + 345, sceneY + 145);

    const groundY = sceneY + 144;
    this.add.tileSprite(width / 2, groundY + 31, sceneW, 62, 'rock_tex')
      .setTint(this.contract.rock.color);

    const topCrust = this.add.graphics();
    topCrust.fillStyle(isBad ? 0x78350f : 0x15803d, 1);
    topCrust.fillRect(sceneX, groundY, sceneW, 7);

    const dustParticles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 45, max: 165 },
      scale: { start: 1.3, end: 0 },
      lifespan: 520,
      emitting: false
    }).setDepth(35);

    if (outcomeType === 'success' || outcomeType === 'audit_pass') {
      const craneG = this.add.graphics();
      const mastX = sceneX + sceneW - 52;
      craneG.lineStyle(3, 0xfacc15, 1);
      craneG.strokeRect(mastX - 7, sceneY + 24, 14, 120);
      craneG.fillStyle(0xfacc15, 1);
      craneG.fillRect(sceneX + 36, sceneY + 26, sceneW - 60, 7);

      for (let floor = 0; floor < 3; floor++) {
        const fy = groundY - 22 - floor * 26;
        const unit = this.add.rectangle(width / 2 - 16, sceneY + 46, 124, 24, 0xf1f5f9)
          .setStrokeStyle(2, 0x475569);
        this.tweens.add({
          targets: unit,
          y: fy,
          delay: floor * 240,
          duration: 440,
          ease: 'Back.easeOut',
          onComplete: () => dustParticles.emitParticleAt(width / 2 - 16, fy + 10, 10)
        });
      }
    } else if (outcomeType === 'collapse') {
      const leftHalf = this.add.rectangle(width / 2 - 36, groundY - 30, 66, 58, 0xcbd5e1).setStrokeStyle(2, 0x475569);
      const rightHalf = this.add.rectangle(width / 2 + 36, groundY - 30, 66, 58, 0xcbd5e1).setStrokeStyle(2, 0x475569);

      this.tweens.add({
        targets: leftHalf,
        x: width / 2 - 48,
        y: groundY + 8,
        angle: -32,
        duration: 640,
        ease: 'Bounce.easeOut',
        onStart: () => dustParticles.emitParticleAt(width / 2, groundY - 12, 30)
      });
      this.tweens.add({
        targets: rightHalf,
        x: width / 2 + 52,
        y: groundY + 12,
        angle: 36,
        duration: 700,
        ease: 'Bounce.easeOut'
      });
    } else if (outcomeType === 'saved_lives') {
      const rig = this.add.triangle(sceneX + 95, groundY - 28, 0, -34, -18, 24, 18, 24, 0x38bdf8);
      this.tweens.add({
        targets: rig,
        x: width / 2 + 78,
        duration: 950,
        ease: 'Cubic.easeInOut'
      });
    } else {
      const van = this.add.rectangle(sceneX + 50, groundY - 18, 74, 26, 0xf8fafc).setStrokeStyle(2, 0x0284c9);
      this.tweens.add({
        targets: van,
        x: width / 2,
        duration: 780,
        ease: 'Cubic.easeOut'
      });
    }

    const titles = {
      success: 'СТРОЙКА ЗАПУЩЕНА УСПЕШНО!',
      saved_lives: 'ОБЪЕКТ СПАСЁН ОТ ОБВАЛА!',
      collapse: 'ПРОИЗОШЁЛ ОБВАЛ ГРУНТА!',
      false_alarm: 'ЛОЖНАЯ ТРЕВОГА ЗАКАЗЧИКА',
      audit_pass: '🛡️ АККРЕДИТАЦИЯ ПОДТВЕРЖДЕНА!',
      audit_fail: '⚠️ ЗАМЕЧАНИЕ РОСТЕХНАДЗОРА'
    };

    const descriptions = {
      success: `Основание выдержало нагрузку.\nРеальная прочность породы: ${this.contract.trueStrengthMpa} МПа.`,
      saved_lives: `Ты вовремя выявил слабый грунт (${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа). Площадка перенесена!`,
      collapse: `Приборы ошиблись из-за погрешности! Реальная прочность была всего ${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа.`,
      false_alarm: `Грунт на самом деле выдержал бы (${this.contract.trueStrengthMpa} МПа). Независимая экспертиза оспорила отказ.`,
      audit_pass: `Эталонный образец измерен с точностью ±${this.errorPct}%! Выдан сертификат: следующие 3 заказа оплачиваются на 15% выше.`,
      audit_fail: `Либо вердикт неверен, либо погрешность (±${this.errorPct}%) превысила допуск ≤ ${this.contract.maxAllowedErrorPct}%. Сделай поверку приборов!`
    };

    this.add.text(width / 2, boxY + 252, titles[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '17px',
      fontWeight: '700',
      color: isBad ? '#f87171' : '#4ade80',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, boxY + 308, descriptions[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#e2e8f0',
      align: 'center',
      wordWrap: { width: boxW - 44 },
      lineSpacing: 4
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
