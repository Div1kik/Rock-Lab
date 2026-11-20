import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { PlatformSDK } from '../utils/PlatformSDK.js';
import { AchievementManager } from '../utils/AchievementManager.js';
import { TutorialManager } from '../utils/TutorialManager.js';

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
    this.leavingScene = false;
    this.inputReadyAt = performance.now() + 250;
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
    this.sheetCenterY = sheetY + sheetH / 2;

    const isAudit = Boolean(this.contract.isAudit);
    const isMega = Boolean(this.contract.isMegaProject);
    const hasIsoCenter = Storage.hasRnd('rnd_iso_center');

    const sheet = this.add.graphics();
    sheet.fillStyle(isAudit ? 0xe0f2fe : isMega || hasIsoCenter ? 0xfef9c3 : 0xfef3c7, 1);
    sheet.fillRoundedRect(padX, sheetY, sheetW, sheetH, 10);
    sheet.lineStyle(3, isAudit ? 0x1d4ed8 : isMega ? 0x0284c9 : hasIsoCenter ? 0xd97706 : 0x78350f, 1);
    sheet.strokeRoundedRect(padX, sheetY, sheetW, sheetH, 10);

    const headerLabel = isAudit
      ? 'ПРОТОКОЛ КОНТРОЛЬНОГО АУДИТА'
      : isMega
        ? 'ГОСПРОТОКОЛ · СТРОЙКА ВЕКА'
        : hasIsoCenter
          ? 'ПРОТОКОЛ ISO/IEC 17025 · ЭТАЛОН'
          : 'ПРОТОКОЛ ИСПЫТАНИЙ ГРУНТА';

    this.add.text(width / 2, sheetY + 28, headerLabel, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#1c1917'
    }).setOrigin(0.5);

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
      fontSize: '12px',
      fontWeight: '600',
      color: '#292524',
      lineSpacing: 7,
      wordWrap: { width: sheetW - 40 }
    });

    sheet.fillStyle(isAudit ? 0xbae6fd : 0xfde68a, 1);
    sheet.fillRoundedRect(padX + 18, sheetY + 186, sheetW - 36, 126, 8);
    sheet.lineStyle(2, isAudit ? 0x0284c9 : 0xd97706, 0.8);
    sheet.strokeRoundedRect(padX + 18, sheetY + 186, sheetW - 36, 126, 8);

    const errColor = this.errorPct <= 9 ? '#15803d' : this.errorPct <= 18 ? '#b45309' : '#b91c1c';

    this.add.text(width / 2, sheetY + 206, 'ЗАФИКСИРОВАННАЯ ПРОЧНОСТЬ:', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#57534e'
    }).setOrigin(0.5);

    this.add.text(width / 2, sheetY + 240, `${this.measuredMpa} МПа  (±${this.errorPct}%)`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '26px',
      fontWeight: '700',
      color: '#1c1917'
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      sheetY + 280,
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
      () => this.playStampAnimationAndSubmit(true)
    );

    this.createStampButton(
      width / 2,
      height - 115,
      360,
      64,
      '⛔ ЗАБРАКОВАТЬ (НИЖЕ НОРМЫ)',
      0xb91c1c,
      () => this.playStampAnimationAndSubmit(false)
    );

    if (TutorialManager.isActive()) {
      TutorialManager.advanceTo(7);
      TutorialManager.showSpotlight(this, {
        hole: { x: width / 2, y: height - 155, w: 376, h: 156 },
        cardY: 365,
        badge: 'ШАГ 8/8 · ИТОГОВЫЙ ВЕРДИКТ',
        text: `Сравни показание прибора (${this.measuredMpa} МПа) с нормой (${this.contract.reqMpa} МПа).\nЕсли больше или равно — жми «ОДОБРИТЬ», если меньше — «ЗАБРАКОВАТЬ»!`
      });
    }
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
      if (this.verdictLocked || performance.now() < this.inputReadyAt) return;
      this.verdictLocked = true;
      onClick();
    });

    container.add([g, txt, zone]);
  }

  playStampAnimationAndSubmit(approvedByPlayer) {
    TutorialManager.clear(this);

    const { width } = this.scale;
    const stampX = width / 2 + 54;
    const stampY = this.sheetCenterY + 132;
    const stampColor = approvedByPlayer ? 0x15803d : 0xb91c1c;
    const stampHex = approvedByPlayer ? '#15803d' : '#b91c1c';
    const stampWord = approvedByPlayer ? 'ОДОБРЕНО' : 'ЗАБРАКОВАНО';

    const inkContainer = this.add.container(stampX, stampY).setAngle(-14).setAlpha(0).setScale(1.6).setDepth(14);
    const inkG = this.add.graphics();
    inkG.lineStyle(4, stampColor, 0.9);
    inkG.strokeRoundedRect(-96, -26, 192, 52, 8);
    inkG.lineStyle(1.5, stampColor, 0.7);
    inkG.strokeRoundedRect(-90, -20, 180, 40, 5);

    const inkTxt = this.add.text(0, -4, stampWord, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '20px',
      fontWeight: '700',
      color: stampHex
    }).setOrigin(0.5);

    const inkSub = this.add.text(0, 13, 'ОТК ROCK LAB · ГОСТ', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '8px',
      fontWeight: '700',
      color: stampHex
    }).setOrigin(0.5);

    inkContainer.add([inkG, inkTxt, inkSub]);

    const stamper = this.add.container(stampX, stampY - 120).setDepth(16);
    const stG = this.add.graphics();
    stG.fillStyle(0x78350f, 1);
    stG.fillCircle(0, -42, 22);
    stG.fillRect(-10, -28, 20, 22);
    stG.fillStyle(0x1e293b, 1);
    stG.fillRoundedRect(-58, -8, 116, 16, 4);
    stG.fillStyle(stampColor, 1);
    stG.fillRect(-54, 8, 108, 5);
    stamper.add(stG);

    this.tweens.add({
      targets: stamper,
      y: stampY - 8,
      duration: 160,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        AudioManager.playStamp();
        this.cameras.main.shake(110, 0.006);
        inkContainer.setAlpha(0.92).setScale(1.0);

        this.tweens.add({
          targets: stamper,
          y: stampY - 140,
          alpha: 0,
          duration: 240,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            stamper.destroy();
            this.time.delayedCall(260, () => {
              this.submitVerdict(approvedByPlayer);
            });
          }
        });
      }
    });
  }

  submitVerdict(approvedByPlayer) {
    const actuallySafe = this.contract.isActuallySafe;
    const isCorrectDecision = approvedByPlayer === actuallySafe;
    const isAudit = Boolean(this.contract.isAudit);
    const isMega = Boolean(this.contract.isMegaProject);

    // Передаём полный объект контракта для расчёта износа от сложности породы/заказа
    Storage.applyContractWear(this.contract);

    const loaderLvl = Storage.getUpgradeLevel('loader');
    const repInfo = Storage.getReputationTierInfo();
    const bonusMult = (1 + (loaderLvl - 1) * 0.1) * repInfo.multiplier;

    const perkCashBonus =
      Storage.getPerkLevel('coffee') * 15 +
      Storage.getPerkLevel('showcase') * 35;
    const perkRepBonus = Storage.getPerkLevel('decor');

    const passiveBranchBonus = Storage.getPassiveBranchIncome();
    const isoRepBonus = Storage.hasRnd('rnd_iso_center') ? 15 : 0;

    let moneyDelta = 0;
    let repDelta = 0;
    let globalScoreDelta = 0;
    let outcomeType = 'success';

    const isPerfectProtocol = isCorrectDecision && this.errorPct <= 4;
    const streak = Storage.recordContractStreak(isCorrectDecision, isPerfectProtocol);

    if (isAudit) {
      Storage.resetAuditCounter();
      const withinErrorLimit = this.errorPct <= (this.contract.maxAllowedErrorPct || 9);
      if (isCorrectDecision && withinErrorLimit) {
        outcomeType = 'audit_pass';
        moneyDelta = Math.round(this.contract.reward * repInfo.multiplier) + passiveBranchBonus;
        repDelta = this.contract.repReward + isoRepBonus;
        globalScoreDelta = 65 + (isPerfectProtocol ? 25 : 0);
        Storage.setAuditBonus(3);
        AchievementManager.unlock(this, 'clean_audit');
      } else {
        outcomeType = 'audit_fail';
        moneyDelta = passiveBranchBonus;
        repDelta = -4;
      }
    } else {
      Storage.consumeAuditBonus();
      if (isCorrectDecision && approvedByPlayer) {
        outcomeType = 'success';
        moneyDelta = Math.round(this.contract.reward * bonusMult) + perkCashBonus + passiveBranchBonus;
        repDelta = this.contract.repReward + perkRepBonus + isoRepBonus;
        globalScoreDelta = (isMega ? 110 : 18 + (this.contract.tier || 1) * 6) +
          (isPerfectProtocol ? 15 : 0) +
          Math.min(30, streak * 3);
      } else if (isCorrectDecision && !approvedByPlayer) {
        outcomeType = 'saved_lives';
        moneyDelta = Math.round(this.contract.reward * 0.85 * bonusMult) + perkCashBonus + passiveBranchBonus;
        repDelta = this.contract.repReward + 1 + perkRepBonus + isoRepBonus;
        globalScoreDelta = (isMega ? 110 : 22 + (this.contract.tier || 1) * 6) +
          (isPerfectProtocol ? 15 : 0) +
          Math.min(30, streak * 3);
      } else if (!isCorrectDecision && approvedByPlayer) {
        outcomeType = 'collapse';
        moneyDelta = passiveBranchBonus;
        repDelta = -Math.max(2, this.contract.tier * 2);
        this.cameras.main.shake(320, 0.018);
        AudioManager.playRockCrack();
      } else {
        outcomeType = 'false_alarm';
        moneyDelta = Math.round(this.contract.reward * 0.35) + passiveBranchBonus;
        repDelta = -1;
      }
    }

    if (isMega && isCorrectDecision) {
      Storage.advanceMegaProject(this.contract.megaProjectId, this.contract.megaTotalStages);
    }

    if (moneyDelta > 0) Storage.addMoney(moneyDelta);
    if (globalScoreDelta > 0) Storage.addGlobalScore(globalScoreDelta);
    Storage.addReputation(repDelta);
    Storage.setActiveContract(null);
    if (!isAudit && isCorrectDecision) Storage.incrementCompleted();

    if (isCorrectDecision && this.errorPct <= 2) {
      AchievementManager.unlock(this, 'metrology_standard');
    }

    AchievementManager.evaluateAll(this);

    Storage.addSiteRecord({
      title: this.contract.title,
      rockName: this.contract.rock.name,
      outcome: outcomeType
    });

    PlatformSDK.onContractFinished();
    this.showAnimatedCutsceneModal(outcomeType, moneyDelta, repDelta, globalScoreDelta, isCorrectDecision);
  }

  getSiteType() {
    if (this.contract.siteType) return this.contract.siteType;
    const t = (this.contract.title || '').toLowerCase();
    if (t.includes('мост') || t.includes('виадук')) return 'bridge';
    if (t.includes('тоннел') || t.includes('метро')) return 'tunnel';
    if (t.includes('лэп') || t.includes('опора')) return 'powerline';
    if (t.includes('гэс') || t.includes('плотин')) return 'dam';
    if (t.includes('карьер')) return 'quarry';
    if (t.includes('коттедж')) return 'cottage';
    return 'highrise';
  }

  showAnimatedCutsceneModal(outcomeType, moneyDelta, repDelta, globalScoreDelta = 0, isCorrectDecision = true) {
    const { width, height } = this.scale;
    const modalReadyAt = performance.now() + 300;
    const isMega = Boolean(this.contract.isMegaProject);

    this.add.zone(width / 2, height / 2, width, height)
      .setInteractive()
      .setDepth(20);

    const overlay = this.add.graphics().setDepth(21);
    overlay.fillStyle(0x0b101b, 0.94);
    overlay.fillRect(0, 0, width, height);

    const boxW = 396;
    const boxH = 568;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    const isBad = outcomeType === 'collapse' || outcomeType === 'audit_fail';
    overlay.fillStyle(0x1e293b, 1);
    overlay.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    overlay.lineStyle(3, isBad ? 0xef4444 : 0xfacc15, 1);
    overlay.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const sceneX = boxX + 20;
    const sceneY = boxY + 20;
    const sceneW = boxW - 40;
    const sceneH = 212;
    const groundY = sceneY + 158;

    this.renderCutsceneArtwork(outcomeType, sceneX, sceneY, sceneW, sceneH, groundY);

    const siteTitles = {
      bridge: 'МОСТОВОЙ ПЕРЕХОД УСПЕШНО СДАН!',
      tunnel: 'ПРОХОДКА ТОННЕЛЯ ЗАВЕРШЕНА!',
      powerline: 'ОПОРА ЛЭП СМОНТИРОВАНА В СРОК!',
      dam: 'ПЛОТИНА ГЭС ВЫДЕРЖАЛА НАПОР!',
      quarry: 'БОРТ КАРЬЕРА УКРЕПЛЁН И ЗАПУЩЕН!',
      cottage: 'ФУНДАМЕНТЫ ПОСЁЛКА ЗАЛОЖЕНЫ!',
      highrise: 'ВЫСОТНЫЙ КАРКАС ЗАПУЩЕН В РАБОТУ!'
    };

    let mainTitle = siteTitles[this.getSiteType()] || 'СТРОЙКА ЗАПУЩЕНА УСПЕШНО!';
    if (isMega && isCorrectDecision) {
      mainTitle = this.contract.isLastMegaStage
        ? '🏆 СТРОЙКА ВЕКА ПОЛНОСТЬЮ ЗАВЕРШЕНА!'
        : `🏗️ ЭТАП ${this.contract.megaStageIndex + 1}/${this.contract.megaTotalStages} СДАН!`;
    }

    const titles = {
      success: mainTitle,
      saved_lives: isMega && isCorrectDecision
        ? `🏗️ ЭТАП ${this.contract.megaStageIndex + 1}/${this.contract.megaTotalStages}: БРАК ОТКЛОНЁН!`
        : 'ОБЪЕКТ СПАСЁН ОТ ОБВАЛА!',
      collapse: 'ПРОИЗОШЁЛ ОБВАЛ ГРУНТА!',
      false_alarm: 'ЛОЖНАЯ ТРЕВОГА ЗАКАЗЧИКА',
      audit_pass: '🛡️ АККРЕДИТАЦИЯ ПОДТВЕРЖДЕНА!',
      audit_fail: '⚠️ ЗАМЕЧАНИЕ РОСТЕХНАДЗОРА'
    };

    const descriptions = {
      success: `Основание объекта «${this.contract.title}» выдержало нагрузку.\nРеальная прочность породы: ${this.contract.trueStrengthMpa} МПа.`,
      saved_lives: `Ты вовремя выявил слабый грунт (${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа). Смонтирована анкерная крепь!`,
      collapse: `Приборы ошиблись из-за погрешности! Реальная прочность была всего ${this.contract.trueStrengthMpa} МПа при норме ${this.contract.reqMpa} МПа.`,
      false_alarm: `Грунт на самом деле выдержал бы (${this.contract.trueStrengthMpa} МПа). Независимая экспертиза оспорила отказ.`,
      audit_pass: `Эталонный образец измерен с точностью ±${this.errorPct}%! Выдан сертификат: следующие 3 заказа оплачиваются на 15% выше.`,
      audit_fail: `Либо вердикт неверен, либо погрешность (±${this.errorPct}%) превысила допуск ≤ ${this.contract.maxAllowedErrorPct}%. Сделай поверку приборов!`
    };

    this.add.text(width / 2, boxY + 256, titles[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: isBad ? '#f87171' : '#4ade80',
      align: 'center'
    }).setOrigin(0.5).setDepth(25);

    this.add.text(width / 2, boxY + 310, descriptions[outcomeType], {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#e2e8f0',
      align: 'center',
      wordWrap: { width: boxW - 44 },
      lineSpacing: 4
    }).setOrigin(0.5).setDepth(25);

    const repSign = repDelta >= 0 ? `+${repDelta}` : `${repDelta}`;
    const idxPart = globalScoreDelta > 0 ? `  |  ТОП: +${globalScoreDelta} 🏆` : '';
    this.add.text(width / 2, boxY + 378, `Доход: +${moneyDelta} ₽  |  Реп: ${repSign} ★${idxPart}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5).setDepth(25);

    let nextBtnY = boxY + 494;
    if (moneyDelta > 0) {
      const adBtn = this.add.text(width / 2, boxY + 434, `🎬 УДВОИТЬ ДОХОД (+${moneyDelta} ₽)`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#0f172a',
        backgroundColor: '#facc15',
        padding: { x: 16, y: 10 }
      }).setOrigin(0.5).setDepth(25).setInteractive({ useHandCursor: true });

      let adClaimed = false;
      adBtn.on('pointerdown', () => {
        if (adClaimed || this.leavingScene || performance.now() < modalReadyAt) return;
        adClaimed = true;
        adBtn.disableInteractive();
        PlatformSDK.showRewarded(() => {
          Storage.addMoney(moneyDelta);
          AudioManager.playLatchSnap();
          adBtn.setText(`✅ ПОЛУЧЕНО ЕЩЁ +${moneyDelta} ₽!`);
          AchievementManager.evaluateAll(this);
        });
      });
    } else {
      nextBtnY = boxY + 468;
    }

    const continueLabel = isMega ? 'К СТРОЙКАМ ВЕКА →' : 'ВЕРНУТЬСЯ В ЛАБОРАТОРИЮ →';
    const continueBtn = this.add.text(width / 2, nextBtnY, continueLabel, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#d97706',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(25).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      if (this.leavingScene || performance.now() < modalReadyAt) return;
      this.leavingScene = true;
      continueBtn.disableInteractive();
      AudioManager.playClick();
      this.time.delayedCall(140, () => {
        if (isMega) {
          this.scene.start('ContractsScene', { mode: 'mega' });
        } else {
          this.scene.start('MenuScene');
        }
      });
    });
  }

  renderCutsceneArtwork(outcomeType, sx, sy, sw, sh, groundY) {
    const { width } = this.scale;
    const isBad = outcomeType === 'collapse' || outcomeType === 'audit_fail';
    const isAudit = outcomeType === 'audit_pass' || outcomeType === 'audit_fail';
    const siteType = this.getSiteType();

    const bg = this.add.graphics().setDepth(22);

    if (isAudit) {
      bg.fillStyle(0x172554, 1);
      bg.fillRoundedRect(sx, sy, sw, sh, 10);
      bg.fillStyle(0x1e3a8a, 1);
      bg.fillRect(sx, sy + 72, sw, groundY - (sy + 72));
      bg.lineStyle(1, 0x38bdf8, 0.18);
      for (let gx = sx + 20; gx < sx + sw; gx += 28) bg.lineBetween(gx, sy + 12, gx, groundY);
      for (let gy = sy + 20; gy < groundY; gy += 28) bg.lineBetween(sx + 10, gy, sx + sw - 10, gy);
    } else if (isBad) {
      bg.fillStyle(0x2c0b0e, 1);
      bg.fillRoundedRect(sx, sy, sw, sh, 10);
      bg.fillStyle(0x5c191e, 1);
      bg.fillRect(sx, sy + 82, sw, groundY - (sy + 82));
      bg.fillStyle(0xef4444, 0.35);
      bg.fillCircle(sx + 56, sy + 44, 24);
    } else {
      bg.fillStyle(0x0369a1, 1);
      bg.fillRoundedRect(sx, sy, sw, sh, 10);
      bg.fillStyle(0x0ea5e9, 0.65);
      bg.fillRect(sx, sy + 76, sw, groundY - (sy + 76));
      bg.fillStyle(0xfef08a, 0.9);
      bg.fillCircle(sx + 48, sy + 38, 16);
      bg.fillStyle(0xf8fafc, 0.75);
      bg.fillRoundedRect(sx + 84, sy + 26, 56, 14, 7);
      bg.fillRoundedRect(sx + 210, sy + 36, 68, 14, 7);
    }

    if (!isAudit) {
      const mDark = isBad ? 0x3f1d24 : 0x334155;
      const mLight = isBad ? 0x6b2c35 : 0x64748b;
      bg.fillStyle(mDark, 1);
      bg.fillTriangle(sx + 8, groundY, sx + 88, sy + 64, sx + 168, groundY);
      bg.fillStyle(mLight, 1);
      bg.fillTriangle(sx + 88, sy + 64, sx + 124, groundY, sx + 168, groundY);

      bg.fillStyle(mDark, 1);
      bg.fillTriangle(sx + 148, groundY, sx + 242, sy + 52, sx + sw - 8, groundY);
      bg.fillStyle(mLight, 1);
      bg.fillTriangle(sx + 242, sy + 52, sx + 286, groundY, sx + sw - 8, groundY);
    }

    const rockH = sy + sh - groundY;
    this.add.tileSprite(width / 2, groundY + rockH / 2, sw, rockH, 'rock_tex')
      .setTint(this.contract.rock.color)
      .setDepth(22);

    const crust = this.add.graphics().setDepth(23);
    crust.fillStyle(isBad ? 0x78350f : 0x15803d, 1);
    crust.fillRect(sx, groundY, sw, 6);
    crust.lineStyle(2, 0x0f172a, 0.8);
    crust.lineBetween(sx, groundY, sx + sw, groundY);

    const dustParticles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 45, max: 165 },
      scale: { start: 1.3, end: 0 },
      lifespan: 520,
      emitting: false
    }).setDepth(35);

    if (outcomeType === 'success') {
      if (siteType === 'bridge') {
        const riverG = this.add.graphics().setDepth(23);
        riverG.fillStyle(0x0284c9, 0.9);
        riverG.fillRect(sx + 56, groundY - 2, sw - 112, 18);
        riverG.fillStyle(0x94a3b8, 1);
        riverG.fillRect(sx + 88, groundY - 46, 20, 48);
        riverG.fillRect(sx + sw - 108, groundY - 46, 20, 48);
        riverG.fillStyle(0xfacc15, 1);
        riverG.fillRect(sx + 94, groundY - 88, 8, 42);
        riverG.fillRect(sx + sw - 102, groundY - 88, 8, 42);

        const span = this.add.container(width / 2, sy + 36).setDepth(24);
        const sG = this.add.graphics();
        sG.fillStyle(0xe2e8f0, 1);
        sG.fillRoundedRect(-124, -8, 248, 14, 3);
        sG.fillStyle(0x334155, 1);
        sG.fillRect(-124, -12, 248, 4);
        span.add(sG);

        this.tweens.add({
          targets: span,
          y: groundY - 48,
          duration: 620,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            dustParticles.emitParticleAt(sx + 98, groundY - 46, 10);
            dustParticles.emitParticleAt(sx + sw - 98, groundY - 46, 10);
          }
        });
      } else if (siteType === 'tunnel') {
        const tunG = this.add.graphics().setDepth(23);
        const tunY = groundY + 26;
        tunG.fillStyle(0x0f172a, 1);
        tunG.fillRoundedRect(sx + 24, tunY - 18, sw - 110, 36, 16);
        tunG.lineStyle(3, 0x94a3b8, 1);
        tunG.strokeRoundedRect(sx + 24, tunY - 18, sw - 110, 36, 16);

        const shield = this.add.container(sx + 76, tunY).setDepth(24);
        const shG = this.add.graphics();
        shG.fillStyle(0xfacc15, 1);
        shG.fillRoundedRect(-24, -15, 44, 30, 5);
        shG.fillStyle(0xef4444, 1);
        shG.fillRect(18, -14, 7, 28);
        shield.add(shG);

        this.tweens.add({
          targets: shield,
          x: sx + sw - 96,
          duration: 950,
          ease: 'Cubic.easeOut',
          onUpdate: () => {
            if (Math.random() < 0.25) dustParticles.emitParticleAt(shield.x + 22, tunY, 3);
          }
        });
      } else if (siteType === 'powerline') {
        const mast = this.add.container(width / 2, sy + 28).setDepth(24);
        const mG = this.add.graphics();
        mG.lineStyle(3, 0xe2e8f0, 1);
        mG.lineBetween(-22, 46, -8, -46);
        mG.lineBetween(22, 46, 8, -46);
        mG.lineBetween(-34, -28, 34, -28);
        mG.lineBetween(-28, -8, 28, -8);
        mG.lineBetween(-16, 18, 16, 18);
        mG.fillStyle(0x38bdf8, 1);
        mG.fillCircle(-34, -24, 4);
        mG.fillCircle(34, -24, 4);
        mast.add(mG);

        this.tweens.add({
          targets: mast,
          y: groundY - 46,
          duration: 560,
          ease: 'Back.easeOut',
          onComplete: () => dustParticles.emitParticleAt(width / 2, groundY, 14)
        });
      } else if (siteType === 'dam') {
        const damG = this.add.graphics().setDepth(23);
        damG.fillStyle(0xcbd5e1, 1);
        damG.beginPath();
        damG.moveTo(width / 2 - 42, groundY);
        damG.lineTo(width / 2 - 22, groundY - 94);
        damG.lineTo(width / 2 + 12, groundY - 94);
        damG.lineTo(width / 2 + 54, groundY);
        damG.closePath();
        damG.fillPath();

        damG.fillStyle(0x0284c9, 0.85);
        damG.fillRect(sx + 10, groundY - 82, width / 2 - sx - 32, 82);

        const waterFlow = this.add.rectangle(width / 2 + 34, groundY - 42, 18, 78, 0x7dd3fc, 0.8).setDepth(24);
        this.tweens.add({
          targets: waterFlow,
          alpha: 0.35,
          duration: 380,
          yoyo: true,
          repeat: -1
        });
      } else if (siteType === 'quarry') {
        const qG = this.add.graphics().setDepth(23);
        qG.fillStyle(0x64748b, 1);
        qG.fillRect(sx + 20, groundY - 72, 95, 24);
        qG.fillRect(sx + 20, groundY - 48, 145, 24);
        qG.fillRect(sx + 20, groundY - 24, 195, 24);

        const truck = this.add.container(sx + sw - 60, groundY - 16).setDepth(24);
        const tG = this.add.graphics();
        tG.fillStyle(0xfacc15, 1);
        tG.fillRoundedRect(-24, -14, 48, 22, 4);
        tG.fillStyle(0x0f172a, 1);
        tG.fillCircle(-14, 10, 7);
        tG.fillCircle(14, 10, 7);
        truck.add(tG);

        this.tweens.add({
          targets: truck,
          x: width / 2 + 56,
          duration: 720,
          ease: 'Cubic.easeOut'
        });
      } else if (siteType === 'cottage') {
        const house = this.add.container(width / 2, sy + 40).setDepth(24);
        const hG = this.add.graphics();
        hG.fillStyle(0xfef3c7, 1);
        hG.fillRoundedRect(-54, -22, 108, 44, 4);
        hG.fillStyle(0xb91c1c, 1);
        hG.fillTriangle(-64, -22, 0, -56, 64, -22);
        hG.fillStyle(0x0284c9, 1);
        hG.fillRect(-34, -10, 22, 18);
        hG.fillRect(12, -10, 22, 18);
        house.add(hG);

        this.tweens.add({
          targets: house,
          y: groundY - 22,
          duration: 540,
          ease: 'Bounce.easeOut',
          onComplete: () => dustParticles.emitParticleAt(width / 2, groundY, 14)
        });
      } else {
        const craneG = this.add.graphics().setDepth(23);
        const mastX = sx + sw - 46;
        craneG.fillStyle(0x475569, 1);
        craneG.fillRect(mastX - 14, groundY - 8, 28, 8);
        craneG.lineStyle(3, 0xfacc15, 1);
        craneG.strokeRect(mastX - 6, sy + 20, 12, groundY - (sy + 28));
        craneG.fillStyle(0xfacc15, 1);
        craneG.fillRect(sx + 34, sy + 26, sw - 58, 6);
        craneG.lineStyle(1.5, 0xfef08a, 0.9);
        craneG.lineBetween(mastX, sy + 14, sx + 48, sy + 26);

        for (let floor = 0; floor < 3; floor++) {
          const fy = groundY - 22 - floor * 28;
          const unit = this.add.container(width / 2 - 22, sy + 42).setDepth(24);
          const uG = this.add.graphics();
          uG.fillStyle(0xf8fafc, 1);
          uG.fillRoundedRect(-64, -13, 128, 26, 3);
          uG.lineStyle(2, 0x334155, 1);
          uG.strokeRoundedRect(-64, -13, 128, 26, 3);
          uG.fillStyle(0x0284c9, 1);
          for (let wx = -50; wx <= 34; wx += 28) {
            uG.fillRect(wx, -6, 16, 12);
          }
          unit.add(uG);

          this.tweens.add({
            targets: unit,
            y: fy,
            delay: floor * 220,
            duration: 420,
            ease: 'Back.easeOut',
            onComplete: () => dustParticles.emitParticleAt(width / 2 - 22, fy + 12, 10)
          });
        }
      }
    } else if (outcomeType === 'saved_lives') {
      const slopeG = this.add.graphics().setDepth(23);
      slopeG.fillStyle(0x475569, 1);
      slopeG.fillTriangle(width / 2 - 10, groundY, width / 2 + 125, sy + 56, width / 2 + 145, groundY);
      slopeG.fillStyle(0x0284c9, 1);
      slopeG.fillRoundedRect(width / 2 - 26, groundY - 76, 22, 76, 4);
      slopeG.lineStyle(2, 0x38bdf8, 1);
      slopeG.strokeRoundedRect(width / 2 - 26, groundY - 76, 22, 76, 4);

      const anchors = this.add.container(0, 0).setDepth(24).setAlpha(0);
      const aG = this.add.graphics();
      aG.lineStyle(3, 0xfacc15, 1);
      [-58, -38, -18].forEach((ay, idx) => {
        aG.lineBetween(width / 2 - 28, groundY + ay, width / 2 + 45 + idx * 14, groundY + ay + 12);
        aG.fillStyle(0xfacc15, 1);
        aG.fillCircle(width / 2 - 28, groundY + ay, 4);
      });
      anchors.add(aG);

      const rig = this.add.container(sx + 54, groundY - 18).setDepth(24);
      const rG = this.add.graphics();
      rG.fillStyle(0xf59e0b, 1);
      rG.fillRoundedRect(-24, -14, 48, 24, 5);
      rG.fillStyle(0x1e293b, 1);
      rG.fillRoundedRect(-26, 8, 52, 10, 4);
      rG.fillStyle(0xe2e8f0, 1);
      rG.fillRect(10, -34, 6, 26);
      rig.add(rG);

      this.tweens.add({
        targets: rig,
        x: width / 2 - 66,
        duration: 620,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: anchors, alpha: 1, duration: 280 });
          dustParticles.emitParticleAt(width / 2 - 22, groundY - 40, 14);
        }
      });
    } else if (outcomeType === 'collapse') {
      const b1 = this.add.polygon(width / 2 - 42, groundY - 42, [0, -24, 28, -10, 22, 22, -24, 18], 0x64748b)
        .setStrokeStyle(2, 0x1e293b)
        .setDepth(24);
      const b2 = this.add.polygon(width / 2 + 38, groundY - 48, [-20, -22, 26, -16, 30, 20, -26, 24], 0x475569)
        .setStrokeStyle(2, 0x1e293b)
        .setDepth(24);

      const tower = this.add.container(width / 2 + 4, groundY - 38).setDepth(25);
      const tG = this.add.graphics();
      tG.lineStyle(3, 0xef4444, 1);
      tG.strokeRect(-8, -36, 16, 72);
      tG.lineBetween(-8, -36, 8, 0);
      tG.lineBetween(8, -36, -8, 0);
      tower.add(tG);

      this.tweens.add({
        targets: b1,
        x: width / 2 - 72,
        y: groundY - 12,
        angle: -34,
        duration: 460,
        ease: 'Bounce.easeOut',
        onStart: () => dustParticles.emitParticleAt(width / 2, groundY - 16, 34)
      });
      this.tweens.add({
        targets: b2,
        x: width / 2 + 76,
        y: groundY - 10,
        angle: 38,
        duration: 520,
        ease: 'Bounce.easeOut'
      });
      this.tweens.add({
        targets: tower,
        x: width / 2 + 24,
        y: groundY - 14,
        angle: 68,
        duration: 560,
        ease: 'Cubic.easeIn'
      });
    } else if (outcomeType === 'false_alarm') {
      const van = this.add.container(sx + 54, groundY - 22).setDepth(24);
      const vG = this.add.graphics();
      vG.fillStyle(0xf8fafc, 1);
      vG.fillRoundedRect(-42, -18, 84, 32, 6);
      vG.fillStyle(0x0284c9, 1);
      vG.fillRect(-42, -4, 84, 8);
      vG.fillStyle(0x38bdf8, 1);
      vG.fillRect(16, -14, 20, 12);
      vG.fillStyle(0xf59e0b, 1);
      vG.fillCircle(-10, -22, 5);
      vG.fillStyle(0x0f172a, 1);
      vG.fillCircle(-24, 16, 8);
      vG.fillCircle(24, 16, 8);
      van.add(vG);

      this.tweens.add({
        targets: van,
        x: width / 2 + 12,
        duration: 760,
        ease: 'Cubic.easeOut'
      });
    } else if (outcomeType === 'audit_pass') {
      const standG = this.add.graphics().setDepth(23);
      standG.fillStyle(0x334155, 1);
      standG.fillRoundedRect(width / 2 - 58, groundY - 96, 116, 96, 8);
      standG.lineStyle(2, 0x38bdf8, 1);
      standG.strokeRoundedRect(width / 2 - 58, groundY - 96, 116, 96, 8);
      standG.fillStyle(0xfacc15, 1);
      standG.fillRect(width / 2 - 22, groundY - 58, 44, 42);

      const scanBeam = this.add.rectangle(width / 2, groundY - 76, 96, 3, 0x4ade80, 0.95).setDepth(24);
      this.tweens.add({
        targets: scanBeam,
        y: groundY - 18,
        duration: 750,
        yoyo: true,
        repeat: -1
      });
    } else {
      const standG = this.add.graphics().setDepth(23);
      standG.fillStyle(0x334155, 1);
      standG.fillRoundedRect(width / 2 - 58, groundY - 96, 116, 96, 8);
      standG.lineStyle(3, 0xef4444, 1);
      standG.strokeRoundedRect(width / 2 - 58, groundY - 96, 116, 96, 8);
      standG.lineStyle(5, 0xef4444, 0.95);
      standG.lineBetween(width / 2 - 44, groundY - 82, width / 2 + 44, groundY - 14);
      standG.lineBetween(width / 2 + 44, groundY - 82, width / 2 - 44, groundY - 14);
    }
  }
}
