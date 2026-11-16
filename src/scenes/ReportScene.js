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

  // Многоплановая сюжетная катсцена с техникой, геологическим разрезом и эффектами
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

    const sceneX = boxX + 20;
    const sceneY = boxY + 22;
    const sceneW = boxW - 40;
    const sceneH = 206;

    // 1. Фон неба, солнца/луны, дальних гор и облаков
    const backdrop = this.add.graphics();
    backdrop.fillStyle(outcomeType === 'collapse' ? 0x3b0d11 : 0x0c4a6e, 1);
    backdrop.fillRoundedRect(sceneX, sceneY, sceneW, sceneH, 10);

    // Горизонт и дальние сопки
    backdrop.fillStyle(outcomeType === 'collapse' ? 0x57181d : 0x1e3a8a, 0.75);
    backdrop.fillTriangle(sceneX + 10, sceneY + 145, sceneX + 95, sceneY + 78, sceneX + 185, sceneY + 145);
    backdrop.fillTriangle(sceneX + 140, sceneY + 145, sceneX + 245, sceneY + 68, sceneX + 345, sceneY + 145);

    // Плывущие облака
    const cloud1 = this.add.ellipse(sceneX + 80, sceneY + 34, 62, 18, 0xf8fafc, 0.25);
    const cloud2 = this.add.ellipse(sceneX + 240, sceneY + 46, 78, 20, 0xf8fafc, 0.2);
    this.tweens.add({ targets: cloud1, x: sceneX + 130, duration: 4200, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: cloud2, x: sceneX + 190, duration: 5000, yoyo: true, repeat: -1 });

    // 2. Геологический разрез основания (породный слой + травяной/щебёночный покров)
    const groundY = sceneY + 144;
    const rockLayer = this.add.tileSprite(width / 2, groundY + 31, sceneW, 62, 'rock_tex')
      .setTint(this.contract.rock.color);

    const topCrust = this.add.graphics();
    topCrust.fillStyle(outcomeType === 'collapse' ? 0x78350f : 0x15803d, 1);
    topCrust.fillRect(sceneX, groundY, sceneW, 7);

    const dustParticles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 45, max: 165 },
      scale: { start: 1.3, end: 0 },
      lifespan: 520,
      emitting: false
    }).setDepth(35);

    const titleLower = (this.contract.title || '').toLowerCase();
    const isBridge = titleLower.includes('мост');
    const isDam = titleLower.includes('гэс') || titleLower.includes('плотин');

    // =====================================================================
    // СЮЖЕТ 1: УСПЕШНАЯ СТРОЙКА (Детализированный кран, монтаж и салют)
    // =====================================================================
    if (outcomeType === 'success') {
      // Решётчатый башенный кран справа
      const craneG = this.add.graphics();
      const mastX = sceneX + sceneW - 52;
      craneG.lineStyle(3, 0xfacc15, 1);
      craneG.strokeRect(mastX - 7, sceneY + 24, 14, 120);
      for (let my = sceneY + 30; my < sceneY + 140; my += 16) {
        craneG.lineBetween(mastX - 7, my, mastX + 7, my + 14);
      }
      // Стрела крана и противовес
      craneG.fillStyle(0xfacc15, 1);
      craneG.fillRect(sceneX + 36, sceneY + 26, sceneW - 60, 7);
      craneG.fillStyle(0x475569, 1);
      craneG.fillRect(mastX + 10, sceneY + 20, 18, 16);

      // Тележка с тросом и крюком
      const trolley = this.add.container(width / 2, sceneY + 33);
      const tWheel = this.add.rectangle(0, 0, 16, 8, 0x38bdf8);
      const tCable = this.add.rectangle(0, 18, 2, 32, 0xe2e8f0);
      const tHook = this.add.arc(0, 36, 6, 0, 180, false, 0xfacc15);
      trolley.add([tWheel, tCable, tHook]);

      this.tweens.add({
        targets: trolley,
        x: width / 2 + 28,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      if (isBridge) {
        // Река под мостом и железобетонные быки-опоры
        const river = this.add.rectangle(width / 2, groundY + 12, sceneW - 20, 22, 0x0284c9, 0.85);
        const pierL = this.add.rectangle(width / 2 - 74, groundY - 24, 24, 56, 0xcbd5e1).setStrokeStyle(2, 0x475569);
        const pierR = this.add.rectangle(width / 2 + 74, groundY - 24, 24, 56, 0xcbd5e1).setStrokeStyle(2, 0x475569);

        // Пролёт моста с фермой и фонарями
        const deck = this.add.container(width / 2, sceneY + 52);
        const girder = this.add.rectangle(0, 0, 210, 16, 0x38bdf8).setStrokeStyle(2, 0x0f172a);
        const road = this.add.rectangle(0, -10, 214, 5, 0x334155);
        deck.add([girder, road]);

        this.tweens.add({
          targets: deck,
          y: groundY - 56,
          duration: 850,
          ease: 'Bounce.easeOut',
          onComplete: () => dustParticles.emitParticleAt(width / 2, groundY - 48, 16)
        });
      } else if (isDam) {
        // Арочная бетонная плотина ГЭС и бурлящий водосброс
        const damG = this.add.graphics();
        damG.fillStyle(0xe2e8f0, 1);
        damG.fillRect(width / 2 - 75, groundY - 84, 150, 84);
        damG.lineStyle(2, 0x64748b, 1);
        for (let dy = groundY - 68; dy < groundY; dy += 16) {
          damG.lineBetween(width / 2 - 75, dy, width / 2 + 75, dy);
        }
        // Водосброс с брызгами
        const stream = this.add.rectangle(width / 2 + 24, groundY - 36, 34, 72, 0x38bdf8, 0.8);
        this.tweens.add({
          targets: stream,
          scaleX: 1.15,
          alpha: 0.45,
          duration: 260,
          yoyo: true,
          repeat: -1
        });
      } else {
        // Многосекционный дом / промышленный комплекс с цоколем, окнами и крышей
        const plinth = this.add.rectangle(width / 2 - 16, groundY - 5, 134, 10, 0x64748b);
        for (let floor = 0; floor < 3; floor++) {
          const fy = groundY - 22 - floor * 26;
          const unit = this.add.container(width / 2 - 16, sceneY + 46);
          const wall = this.add.rectangle(0, 0, 124, 24, 0xf1f5f9).setStrokeStyle(2, 0x475569);
          unit.add(wall);

          for (let c = -1; c <= 1; c++) {
            const win = this.add.rectangle(c * 34, 0, 18, 13, 0x0284c9);
            unit.add(win);
          }

          this.tweens.add({
            targets: unit,
            y: fy,
            delay: floor * 240,
            duration: 440,
            ease: 'Back.easeOut',
            onComplete: () => {
              dustParticles.emitParticleAt(width / 2 - 16, fy + 10, 10);
              if (floor === 2) {
                // Монтаж крыши и праздничный салют
                this.add.triangle(width / 2 - 16, fy - 20, 0, -14, -68, 8, 68, 8, 0xd97706);
                dustParticles.emitParticleAt(sceneX + 64, sceneY + 44, 18);
              }
            }
          });
        }
      }
    }

    // =====================================================================
    // СЮЖЕТ 2: ОБВАЛ ГРУНТА (Разлом пласта, разрушение пополам и оползень)
    // =====================================================================
    if (outcomeType === 'collapse') {
      // Зигзагообразный тектонический разлом в грунте
      const faultG = this.add.graphics();
      faultG.lineStyle(5, 0xef4444, 1);
      faultG.beginPath();
      faultG.moveTo(width / 2 - 12, groundY - 2);
      faultG.lineTo(width / 2 + 16, groundY + 24);
      faultG.lineTo(width / 2 - 8, groundY + 46);
      faultG.lineTo(width / 2 + 14, groundY + 62);
      faultG.strokePath();

      // Две половины надломленного здания с окнами и арматурой
      const leftHalf = this.add.container(width / 2 - 36, groundY - 30);
      const lWall = this.add.rectangle(0, 0, 66, 58, 0xcbd5e1).setStrokeStyle(2, 0x475569);
      const lWin = this.add.rectangle(-12, -8, 18, 14, 0x1e293b);
      leftHalf.add([lWall, lWin]);

      const rightHalf = this.add.container(width / 2 + 36, groundY - 30);
      const rWall = this.add.rectangle(0, 0, 66, 58, 0xcbd5e1).setStrokeStyle(2, 0x475569);
      const rWin = this.add.rectangle(12, -8, 18, 14, 0x1e293b);
      rightHalf.add([rWall, rWin]);

      // Анимация обрушения с клубами пыли
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

      // Аварийный маячок
      const alarm = this.add.circle(sceneX + 34, sceneY + 32, 10, 0xef4444);
      this.tweens.add({
        targets: alarm,
        alpha: 0.15,
        duration: 220,
        yoyo: true,
        repeat: -1
      });
    }

    // =====================================================================
    // СЮЖЕТ 3: ОБЪЕКТ СПАСЁН (Ограждение опасной зоны + перенос буровой вышки)
    // =====================================================================
    if (outcomeType === 'saved_lives') {
      // Опасная зона слева со стробоскопом
      const hazard = this.add.graphics();
      hazard.fillStyle(0xfacc15, 1);
      hazard.fillRect(sceneX + 26, groundY - 14, 74, 8);
      hazard.fillStyle(0x0f172a, 1);
      hazard.fillRect(sceneX + 38, groundY - 14, 12, 8);
      hazard.fillRect(sceneX + 64, groundY - 14, 12, 8);

      const strobe = this.add.circle(sceneX + 63, groundY - 22, 6, 0xef4444);
      this.tweens.add({ targets: strobe, alpha: 0.2, duration: 240, yoyo: true, repeat: -1 });

      // Самоходная буровая установка переезжает на скальный уступ справа
      const rig = this.add.container(sceneX + 95, groundY - 28);
      const chassis = this.add.rectangle(0, 18, 56, 16, 0xf59e0b).setStrokeStyle(2, 0x0f172a);
      const mast = this.add.triangle(8, -14, 0, -34, -12, 24, 12, 24, 0x38bdf8);
      const drillPipe = this.add.rectangle(8, 12, 4, 44, 0xe2e8f0);
      rig.add([drillPipe, mast, chassis]);

      this.tweens.add({
        targets: rig,
        x: width / 2 + 78,
        duration: 950,
        ease: 'Cubic.easeInOut',
        onComplete: () => dustParticles.emitParticleAt(width / 2 + 86, groundY - 4, 14)
      });
    }

    // =====================================================================
    // СЮЖЕТ 4: ЛОЖНАЯ ТРЕВОГА (Прибытие машины инспекции)
    // =====================================================================
    if (outcomeType === 'false_alarm') {
      const van = this.add.container(sceneX + 50, groundY - 18);
      const body = this.add.rectangle(0, 0, 74, 26, 0xf8fafc).setStrokeStyle(2, 0x0284c9);
      const stripe = this.add.rectangle(0, 2, 72, 6, 0x0284c9);
      const wheel1 = this.add.circle(-22, 14, 7, 0x0f172a);
      const wheel2 = this.add.circle(22, 14, 7, 0x0f172a);
      van.add([body, stripe, wheel1, wheel2]);

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
