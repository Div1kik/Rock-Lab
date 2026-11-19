import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { PlatformSDK } from '../utils/PlatformSDK.js';
import { RARE_INCLUSIONS, MEGA_PROJECTS } from '../data/contracts.js';
import { AchievementManager, ACHIEVEMENTS_CATALOG } from '../utils/AchievementManager.js';
import { MineralRenderer } from '../utils/MineralRenderer.js';
import { TutorialManager } from '../utils/TutorialManager.js';

const LAB_TIERS = {
  1: { name: 'Гаражная геолаборатория', wall: 0x292524, floor: 0x3f3a36, table: 0x57504a, accent: 0xeab308 },
  2: { name: 'Участковый пост контроля', wall: 0x242933, floor: 0x333a47, table: 0x4b5563, accent: 0xf59e0b },
  3: { name: 'Инженерный центр грунтов', wall: 0x1e293b, floor: 0x2c3a4f, table: 0x475569, accent: 0x38bdf8 },
  4: { name: 'Институт механики скал', wall: 0x172536, floor: 0x22354a, table: 0x3f4c5e, accent: 0x34d399 },
  5: { name: 'Геотех-комплекс «Атлант»', wall: 0x141d2e, floor: 0x1e2c42, table: 0x374151, accent: 0xfacc15 }
};

const LAB_THEMES = {
  loft: { wall: 0x3b1f16, floor: 0x291d18, table: 0x5c3424, accent: 0xf97316 },
  arctic: { wall: 0x0c2d48, floor: 0x164263, table: 0x1e6091, accent: 0x7dd3fc },
  cyber: { wall: 0x091e26, floor: 0x0f2f38, table: 0x134e4a, accent: 0x2dd4bf },
  gold: { wall: 0x1c1917, floor: 0x292524, table: 0x451a03, accent: 0xfacc15 }
};

const SKIN_PALETTES = {
  default: { coat: 0xf8fafc, pants: 0x334155, helmet: 0xfacc15, head: 0xfde68a },
  miner: { coat: 0xf97316, pants: 0x1e293b, helmet: 0xffffff, head: 0xfde68a },
  arctic: { coat: 0x0284c9, pants: 0x0f172a, helmet: 0x38bdf8, head: 0xfde68a },
  gold: { coat: 0xfacc15, pants: 0x78350f, helmet: 0xfef08a, head: 0xfde68a },
  robots: { coat: 0x94a3b8, pants: 0x1e293b, helmet: 0x38bdf8, head: 0xcbd5e1, style: 'robots' },
  minions: { coat: 0x2563eb, pants: 0x1d4ed8, helmet: 0xfacc15, head: 0xfacc15, style: 'minions' },
  mario: { coat: 0xdc2626, pants: 0x2563eb, helmet: 0xdc2626, head: 0xfde68a, style: 'mario' },
  astronaut: { coat: 0xf8fafc, pants: 0xe2e8f0, helmet: 0x38bdf8, head: 0x0f172a, style: 'astronaut' },
  ninja: { coat: 0x18181b, pants: 0x09090b, helmet: 0xef4444, head: 0xfde68a, style: 'ninja' }
};

const ENGINEER_LINES = [
  'Керн плотный, по ГОСТу пройдёт!',
  'Проверяю калибровку датчиков...',
  'Неплоскостность торцов в допуске!',
  'Готовим расчёты для Стройки века!',
  'Пора выпить чашечку кофе ☕'
];

const INTERN_LINES = [
  'Несу ящик на распил!',
  'Все саморезы выкручены, шеф!',
  'Подготовил шайбы для среза!',
  'Штангенциркуль обнулён!',
  'Учусь работать на стабилометре!'
];

const ROBOT_SKIN_LINES = [
  '01001011 · БИП-БОП-СКАН! ⚡',
  'АНАЛИЗ ПРОЧНОСТИ: 99.9% 🤖',
  'КЕРН ОДОБРЕН СИСТЕМОЙ · БЗ-З!',
  'КАЛИБРОВКА ДАТЧИКОВ: ОПТИМАЛЬНО'
];

const MINION_LINES = [
  'БАНАНА-КЕРН! БЕЛЛО! 🍌',
  'ПАПАЙЯ-ГОСТ! ТУЛИЛАЛУ! 😄',
  'ПОКАЙЯ! ПРЕСС БАМ-БАМ! 🔨',
  'БЕЛЛО, ШЕФ! КЕРН ГОТОВ!'
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.eqBars = [];
    this.eqTimer = 0;
    this.trackTxt = null;
    this.showcaseModalOpen = false;
    this.staffActors = [];
    this.navNodes = [];
    this.visitProfile = null;
  }

  init(data) {
    this.visitProfile = data?.visitProfile || null;
  }

  isVisiting() {
    return Boolean(this.visitProfile);
  }

  getLabConfig() {
    if (this.isVisiting()) {
      const snap = this.visitProfile.snapshot || {};
      const labLvl = snap.labLevel || this.visitProfile.labLevel || 1;
      const decorList = Array.isArray(snap.decor) ? snap.decor : [];
      const rndList = Array.isArray(snap.rnd) ? snap.rnd : [];
      const megaList = Array.isArray(snap.completedMegas) ? snap.completedMegas : [];
      const gemIds = Array.isArray(snap.displayedGems) ? snap.displayedGems : [];
      const displayedGems = gemIds
        .map((id) => RARE_INCLUSIONS.find((g) => g.id === id))
        .filter(Boolean);

      return {
        labLvl,
        themeId: snap.theme || 'default',
        skinId: snap.skin || 'default',
        decorLvl: labLvl >= 3 ? 2 : 1,
        showcaseLvl: displayedGems.length > 0 || labLvl >= 2 ? 1 : 0,
        hasDecor: (k) => decorList.includes(k),
        hasRnd: (k) => rndList.includes(k),
        isMegaCompleted: (id) => megaList.includes(id),
        branchesCount: ['branch_norilsk', 'branch_ural', 'branch_shelf'].filter((k) => rndList.includes(k)).length,
        displayedGems,
        totalGemsCount: displayedGems.length,
        staffCount: snap.staffCount ?? Math.min(3, Math.max(0, labLvl - 2)),
        hasCoffee: labLvl >= 2,
        hasCryoBox: labLvl >= 2,
        isTestUnlocked: (tKey) => {
          if (labLvl >= 4) return true;
          if (labLvl === 3) return ['shear_crack', 'water_sat', 'ultrasonic', 'frost_test', 'shear_load', 'triaxial'].includes(tKey);
          if (labLvl === 2) return ['shear_crack', 'water_sat', 'ultrasonic', 'frost_test'].includes(tKey);
          return false;
        },
        pressLvl: Math.min(6, labLvl + 1),
        sawLvl: Math.min(6, labLvl + 1),
        grinderLvl: Math.min(5, labLvl)
      };
    }

    return {
      labLvl: Storage.getLabLevel(),
      themeId: Storage.getActiveLabTheme(),
      skinId: Storage.getActiveSkin(),
      decorLvl: Storage.getPerkLevel('decor'),
      showcaseLvl: Storage.getPerkLevel('showcase'),
      hasDecor: (k) => Storage.isDecorActive(k),
      hasRnd: (k) => Storage.hasRnd(k),
      isMegaCompleted: (id) => Storage.isMegaCompleted(id),
      branchesCount: Storage.getBranchesCount(),
      displayedGems: Storage.getDisplayedGems(),
      totalGemsCount: Storage.getGems().length,
      staffCount: Storage.getPerkLevel('assistant') > 0
        ? Math.min(3, Math.floor((Storage.getPerkLevel('assistant') + 1) / 2))
        : 0,
      hasCoffee: Storage.getPerkLevel('coffee') > 0,
      hasCryoBox: Storage.getPerkLevel('cryobox') > 0,
      isTestUnlocked: (tKey) => Storage.isTestUnlocked(tKey),
      pressLvl: Storage.getUpgradeLevel('press'),
      sawLvl: Storage.getUpgradeLevel('saw'),
      grinderLvl: Storage.getUpgradeLevel('grinder')
    };
  }

  create() {
    const { width, height } = this.scale;
    const cfg = this.getLabConfig();
    const baseTier = LAB_TIERS[cfg.labLvl] || LAB_TIERS[1];
    const customTheme = LAB_THEMES[cfg.themeId];
    const tier = customTheme ? { ...baseTier, ...customTheme } : baseTier;

    this.showcaseModalOpen = false;
    this.staffActors = [];
    this.inputGuardUntil = performance.now() + 260;

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      emitting: false
    }).setDepth(30);

    this.drawLabRoom(width, height, tier, cfg);
    this.createTopBar(width, tier);

    if (this.isVisiting()) {
      this.add.text(width / 2, 86, `👁️ В ГОСТЯХ: ${this.visitProfile.name}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '20px',
        fontWeight: '700',
        color: '#38bdf8',
        stroke: '#0f172a',
        strokeThickness: 5
      }).setOrigin(0.5);

      this.add.text(
        width / 2,
        116,
        `Ур. ${cfg.labLvl} · ${tier.name} · Индекс: ${this.visitProfile.score} 🏆`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          fontWeight: '600',
          color: '#fde68a',
          backgroundColor: '#1c1917cc',
          padding: { x: 10, y: 4 }
        }
      ).setOrigin(0.5);

      this.createLiveMiniLab(width, height, tier, cfg);
      this.createGuestBottomPanel(width, height);
      return;
    }

    this.add.text(width / 2, 90, 'ROCK LAB', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '32px',
      fontWeight: '700',
      color: '#fef3c7',
      stroke: '#1c1917',
      strokeThickness: 6
    }).setOrigin(0.5);

    const auditLeft = Storage.getAuditBonus();
    const completedMegas = Storage.getCompletedMegasCount();
    const branchesCount = Storage.getBranchesCount();
    let subLabel = `Ур. ${cfg.labLvl} · ${tier.name}`;
    if (auditLeft > 0) {
      subLabel += ` · 🛡️ +15% (×${auditLeft})`;
    } else if (branchesCount > 0) {
      subLabel += ` · 🌐 Филиалов: ${branchesCount}/3`;
    } else if (completedMegas > 0) {
      subLabel += ` · 🏗️ Строек века: ${completedMegas}/${MEGA_PROJECTS.length}`;
    }

    this.add.text(width / 2, 122, subLabel, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '600',
      color: auditLeft > 0 ? '#4ade80' : '#fde68a',
      backgroundColor: '#1c1917cc',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5);

    this.createLiveMiniLab(width, height, tier, cfg);
    this.createMaintenancePanel(width, height);
    this.createMiniPlayer(width, height, tier);

    this.createActionButton(
      width / 2,
      height - 178,
      340,
      54,
      'ДОСКА ЗАКАЗОВ И СТРОЙКИ ВЕКА',
      0xd97706,
      0xffffff,
      () => {
        AudioManager.playClick();
        this.scene.start('ContractsScene');
      },
      15
    );

    const halfW = 165;
    this.createActionButton(
      width / 2 - halfW / 2 - 5,
      height - 110,
      halfW,
      48,
      '⚙️ МАГАЗИН',
      0x334155,
      0xf8fafc,
      () => {
        AudioManager.playClick();
        this.scene.start('UpgradeScene');
      },
      14
    );

    this.createActionButton(
      width / 2 + halfW / 2 + 5,
      height - 110,
      halfW,
      48,
      '📖 ГОСТы',
      0x0369a1,
      0xf0f9ff,
      () => {
        AudioManager.playClick();
        this.scene.start('GuideScene', { returnScene: 'MenuScene' });
      },
      14
    );

    this.add.text(width / 2, height - 18, 'EASY DOPAMINE GAMES', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: 2,
      color: '#a8a29e'
    }).setOrigin(0.5).setAlpha(0.85);

    AchievementManager.evaluateAll(this);

    const myProfile = Storage.buildPublicProfile(PlatformSDK.playerName);
    PlatformSDK.submitLabProfile(myProfile);

    this.runMenuTutorialStep(width, height);
  }

  runMenuTutorialStep(width, height) {
    if (!TutorialManager.isActive()) return;
    const step = TutorialManager.getStep();

    if (step < 7) {
      TutorialManager.advanceTo(0);
      TutorialManager.showSpotlight(this, {
        hole: { x: width / 2, y: height - 178, w: 350, h: 64 },
        cardY: 365,
        badge: 'ШАГ 1/8 · ДОБРО ПОЖАЛОВАТЬ В ROCK LAB',
        text: 'Ты — руководитель геотехнической лаборатории!\nЗдесь ты вскрываешь керны, готовишь образцы и давишь их под прессом.\nНажми «ДОСКА ЗАКАЗОВ», чтобы взять первый контракт!'
      });
    } else {
      TutorialManager.showSpotlight(this, {
        hole: { x: width / 2, y: height * 0.585 + 31, w: 348, h: 70 },
        cardY: 295,
        badge: 'ОБЗОР 1/4 · ТО ПРИБОРОВ И СОТРУДНИКИ',
        text: 'Следи за износом пилы, абразива и поверкой на панели ТО.\nНанимай сотрудников в цеху: часть сложных стендов (например, стабилометр)\nтребует допсотрудников в штате, а с ростом штата они помогают с тестами!',
        nextLabel: 'ДАЛЕЕ: МАГАЗИН, МУЗЫКА И ПЛЕЕР →',
        onNext: () => {
          TutorialManager.showSpotlight(this, {
            hole: { x: width / 2, y: height * 0.695, w: 348, h: 54 },
            cardY: 295,
            badge: 'ОБЗОР 2/4 · МАГАЗИН, МУЗЫКА И ПЛЕЕР',
            text: 'В «⚙️ МАГАЗИНЕ» открываются стенды, скины, роботы и музыкальные паки.\nВ плеере тап по треку листает песни, а правая кнопка переключает\nповтор одного трека или проигрывание всех треков по кругу!',
            nextLabel: 'ДАЛЕЕ: ВИТРИНА И ЭКСПЕДИЦИИ →',
            onNext: () => {
              TutorialManager.showSpotlight(this, {
                hole: { x: 43, y: 220, w: 66, h: 156 },
                cardY: 350,
                badge: 'ОБЗОР 3/4 · ВИТРИНА И ЭКСПЕДИЦИИ',
                text: 'Витрина минералов открывается со 2-го уровня лаборатории (купи её в магазине,\nчтобы ставить кристаллы на полку и крутить в 3D).\nБуровые экспедиции открываются после завершения 1-й «Стройки века»!',
                nextLabel: 'ДАЛЕЕ: ДОСТИЖЕНИЯ И ФИНАЛ →',
                onNext: () => {
                  TutorialManager.showSpotlight(this, {
                    hole: { x: width - 92, y: 32, w: 158, h: 42 },
                    cardY: 290,
                    badge: 'ОБЗОР 4/4 · ДОСТИЖЕНИЯ И ПОВТОР',
                    text: 'За достижения (🏆) и рейтинг (🌐 ТОП) начисляются бонусы.\nОбучение можно в любой момент пройти повторно через кнопку «ГИД» вверху!\nЗабирай премию +200 ₽ за прохождение инструктажа!',
                    nextLabel: '🎉 ЗАВЕРШИТЬ И ЗАБРАТЬ +200 ₽!',
                    onNext: () => {
                      TutorialManager.complete(this);
                      Storage.addMoney(200);
                      AudioManager.playStamp();
                      this.particles.emitParticleAt(width / 2, 260, 24);
                      if (this.moneyTxt) this.moneyTxt.setText(`💰 ${Storage.getMoney()} ₽`);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  }

  createGuestBottomPanel(w, h) {
    const panelY = h * 0.60;
    const panelW = 356;
    const panelH = 128;
    const cx = w / 2;

    const card = this.add.graphics().setDepth(18);
    card.fillStyle(0x0f172a, 0.95);
    card.fillRoundedRect(cx - panelW / 2, panelY, panelW, panelH, 14);
    card.lineStyle(2, 0x38bdf8, 0.9);
    card.strokeRoundedRect(cx - panelW / 2, panelY, panelW, panelH, 14);

    this.add.text(
      cx,
      panelY + 32,
      `Тапай по приборам, витрине и роботам коллеги!\n★ Репутация: ${this.visitProfile.reputation}  ·  Строек века: ${this.visitProfile.completedMegas}/4`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 5
      }
    ).setOrigin(0.5).setDepth(19);

    const targetId = this.visitProfile.playerId;
    const alreadyLiked = Storage.hasLikedGuestToday(targetId);
    const likesLeft = Storage.getRemainingGuestLikes();

    const likeLabel = alreadyLiked
      ? '✅ ВЫ УЖЕ ОЦЕНИЛИ ЭТОТ ЦЕХ СЕГОДНЯ'
      : likesLeft > 0
        ? `👍 ОЦЕНИТЬ ЦЕХ (+150 ₽ · ост. ${likesLeft}/3)`
        : '⏳ ЛИМИТ ОЦЕНОК НА СЕГОДНЯ ИСЧЕРПАН';

    const canLike = !alreadyLiked && likesLeft > 0;
    const likeBtn = this.add.text(cx, panelY + 88, likeLabel, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: canLike ? '#0f172a' : '#94a3b8',
      backgroundColor: canLike ? '#4ade80' : '#334155',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(19).setInteractive({ useHandCursor: canLike });

    if (canLike) {
      likeBtn.on('pointerdown', () => {
        if (Storage.recordGuestLike(targetId)) {
          Storage.addMoney(150);
          AudioManager.playStamp();
          this.particles.emitParticleAt(cx, panelY + 88, 18);
          if (this.moneyTxt) this.moneyTxt.setText(`💰 ${Storage.getMoney()} ₽`);
          likeBtn.setText('✅ ОЦЕНКА ОТПРАВЛЕНА (+150 ₽)!');
          likeBtn.setColor('#94a3b8');
          likeBtn.setBackgroundColor('#334155');
          likeBtn.disableInteractive();
        }
      });
    }

    this.createActionButton(
      w / 2,
      h - 110,
      340,
      54,
      '🏠 ВЕРНУТЬСЯ В СВОЮ ЛАБОРАТОРИЮ',
      0xd97706,
      0xffffff,
      () => {
        AudioManager.playClick();
        this.scene.start('MenuScene', { visitProfile: null });
      },
      14
    );
  }

  showSpeechBubble(targetContainer, text, accentColor = 0xfacc15) {
    if (targetContainer.activeBubble) {
      targetContainer.activeBubble.destroy();
      targetContainer.activeBubble = null;
    }

    const bubble = this.add.container(targetContainer.x, targetContainer.y - 74).setDepth(28);
    const label = this.add.text(0, 0, text, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '10px',
      fontWeight: '700',
      color: '#0f172a',
      align: 'center',
      wordWrap: { width: 150 }
    }).setOrigin(0.5);

    const padX = 10;
    const padY = 6;
    const bw = Math.max(76, label.width + padX * 2);
    const bh = label.height + padY * 2;

    const bg = this.add.graphics();
    bg.fillStyle(0xfef3c7, 0.98);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.lineStyle(2, accentColor, 1);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    bg.fillStyle(0xfef3c7, 0.98);
    bg.fillTriangle(-5, bh / 2, 5, bh / 2, 0, bh / 2 + 6);

    bubble.add([bg, label]);
    bubble.setScale(0.3);
    targetContainer.activeBubble = bubble;

    this.tweens.add({
      targets: bubble,
      scale: 1,
      duration: 160,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(2100, () => {
      if (!bubble.active) return;
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        y: bubble.y - 10,
        duration: 240,
        onComplete: () => {
          if (targetContainer.activeBubble === bubble) {
            targetContainer.activeBubble = null;
          }
          bubble.destroy();
        }
      });
    });
  }

  drawLabRoom(w, h, tier, cfg) {
    const g = this.add.graphics();
    const { labLvl, decorLvl, showcaseLvl, themeId, branchesCount, displayedGems, totalGemsCount } = cfg;
    const hasNeon = cfg.hasDecor('neon');
    const hasGeoMap = cfg.hasDecor('geomap');
    const hasCooler = cfg.hasDecor('cooler');
    const hasPlants = cfg.hasDecor('plants');

    const backWallY = 266;
    const frontBenchY = h * 0.545;

    g.fillStyle(tier.wall, 1);
    g.fillRect(0, 64, w, backWallY - 64);

    if (themeId === 'loft' || (themeId === 'default' && labLvl === 1)) {
      g.lineStyle(1, 0x000000, 0.22);
      for (let by = 80; by < backWallY; by += 18) {
        g.lineBetween(0, by, w, by);
        const shift = (by / 18) % 2 === 0 ? 0 : 20;
        for (let bx = shift; bx < w; bx += 40) {
          g.lineBetween(bx, by, bx, by + 18);
        }
      }
    } else {
      g.lineStyle(1.5, 0x000000, 0.16);
      for (let x = 0; x < w; x += 48) {
        g.lineBetween(x, 64, x, backWallY);
      }
      g.lineBetween(0, 165, w, 165);
    }

    g.fillStyle(tier.floor, 1);
    g.fillRect(0, backWallY, w, frontBenchY - backWallY);
    g.fillStyle(0x0f172a, 0.65);
    g.fillRect(0, backWallY, w, 6);

    g.lineStyle(1.5, 0x000000, 0.25);
    const center = w / 2;
    for (let i = -4; i <= 4; i++) {
      g.lineBetween(center + i * 44, backWallY, center + i * 64, frontBenchY);
    }
    g.lineBetween(0, (backWallY + frontBenchY) / 2, w, (backWallY + frontBenchY) / 2);

    g.fillStyle(hasNeon ? 0x38bdf8 : 0xfef3c7, 0.06 + decorLvl * 0.02);
    g.fillTriangle(w / 2, 66, 20, frontBenchY, w - 20, frontBenchY);

    g.fillStyle(0x27272a, 1);
    g.fillRect(0, 66, w, 9);
    g.fillStyle(hasNeon ? 0x38bdf8 : tier.accent, hasNeon ? 0.9 : 0.35 + decorLvl * 0.08);
    g.fillRect(0, 75, w, 4);

    const winX = w / 2 - 122;
    const winW = 216;
    if (branchesCount > 0 || hasGeoMap) {
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(winX, 138, winW, 78, 8);
      g.lineStyle(2.5, branchesCount > 0 ? 0x38bdf8 : 0x4b5563, 1);
      g.strokeRoundedRect(winX, 138, winW, 78, 8);

      g.fillStyle(0x15803d, 0.6);
      g.fillRoundedRect(winX + 18, 152, 68, 36, 8);
      g.fillRoundedRect(winX + 94, 148, 102, 46, 10);

      const bNorilsk = { x: winX + 128, y: 158, active: cfg.hasRnd('branch_norilsk') };
      const bUral = { x: winX + 104, y: 174, active: cfg.hasRnd('branch_ural') };
      const bShelf = { x: winX + 182, y: 182, active: cfg.hasRnd('branch_shelf') };

      g.lineStyle(1.5, 0x38bdf8, 0.8);
      [bNorilsk, bUral, bShelf].forEach((b) => {
        if (b.active) {
          g.lineBetween(winX + 54, 170, b.x, b.y);
        }
      });

      [bNorilsk, bUral, bShelf].forEach((b) => {
        g.fillStyle(b.active ? 0x4ade80 : 0x475569, 1);
        g.fillCircle(b.x, b.y, b.active ? 5 : 3.5);
        if (b.active) {
          const pulse = this.add.circle(b.x, b.y, 6, 0x4ade80, 0.5).setDepth(3);
          this.tweens.add({
            targets: pulse,
            scale: 2.1,
            alpha: 0,
            duration: 1200,
            repeat: -1
          });
        }
      });

      const mapZone = this.add.zone(winX + winW / 2, 177, winW, 78).setInteractive({ useHandCursor: true });
      mapZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        AudioManager.playClick();
        const passive = Storage.getPassiveBranchIncome();
        const mapAnchor = this.add.container(winX + winW / 2, 224).setDepth(28);
        this.showSpeechBubble(
          mapAnchor,
          branchesCount > 0
            ? `🌐 Филиалов в сети: ${branchesCount}/3${this.isVisiting() ? '' : ` · +${passive} ₽/заказ`}`
            : '🗺️ Геокарта месторождений активна!',
          0x38bdf8
        );
      });
    } else if (labLvl >= 5) {
      g.fillStyle(0x0284c9, 0.45);
      g.fillRoundedRect(winX, 138, winW, 78, 8);
      g.lineStyle(3, 0x94a3b8, 1);
      g.strokeRoundedRect(winX, 138, winW, 78, 8);
      g.fillStyle(0x334155, 0.92);
      g.fillTriangle(winX + 8, 214, winX + 64, 158, winX + 120, 214);
      g.fillTriangle(winX + 94, 214, winX + 158, 152, winX + winW - 8, 214);
    } else {
      g.fillStyle(0x14161b, 1);
      g.fillRoundedRect(winX + 12, 140, 192, 74, 8);
      g.lineStyle(2.5, 0x4b5563, 1);
      g.strokeRoundedRect(winX + 12, 140, 192, 74, 8);
      g.fillStyle(0x0ea5e9, 0.12);
      g.fillRect(winX + 18, 146, 180, 62);
      g.lineStyle(2, tier.accent, 0.9);
      g.beginPath();
      g.moveTo(winX + 28, 198);
      g.lineTo(winX + 70, 182);
      g.lineTo(winX + 112, 160);
      g.lineTo(winX + 148, 154);
      g.lineTo(winX + 180, 194);
      g.strokePath();
    }

    const trophyX = w - 134;
    const trophyY = 140;
    const trophyW = 62;
    const trophyH = 76;

    g.fillStyle(0x475569, 1);
    g.fillRect(trophyX + 8, trophyY - 4, 6, 4);
    g.fillRect(trophyX + trophyW - 14, trophyY - 4, 6, 4);

    g.fillStyle(0x0f172a, 0.94);
    g.fillRoundedRect(trophyX, trophyY, trophyW, trophyH, 6);
    g.lineStyle(2, 0xfacc15, 0.85);
    g.strokeRoundedRect(trophyX, trophyY, trophyW, trophyH, 6);
    g.fillStyle(0x334155, 1);
    g.fillRect(trophyX + 4, trophyY + 38, trophyW - 8, 3);

    const trophySlots = [
      { id: 'mega_bridge', x: trophyX + 18, y: trophyY + 22 },
      { id: 'mega_metro', x: trophyX + 44, y: trophyY + 22 },
      { id: 'mega_tower', x: trophyX + 18, y: trophyY + 58 },
      { id: 'mega_dam', x: trophyX + 44, y: trophyY + 58 }
    ];

    trophySlots.forEach((slot) => {
      const unlocked = cfg.isMegaCompleted(slot.id);
      if (!unlocked) {
        g.fillStyle(0x1e293b, 1);
        g.fillCircle(slot.x, slot.y, 6);
        return;
      }
      g.fillStyle(0xfacc15, 1);
      g.fillRect(slot.x - 6, slot.y + 8, 12, 3);
      if (slot.id === 'mega_bridge') {
        g.fillRect(slot.x - 5, slot.y - 6, 2, 14);
        g.fillRect(slot.x + 3, slot.y - 6, 2, 14);
        g.fillRect(slot.x - 8, slot.y + 1, 16, 2);
      } else if (slot.id === 'mega_metro') {
        g.fillCircle(slot.x, slot.y + 1, 7);
        g.fillStyle(0x0f172a, 1);
        g.fillCircle(slot.x, slot.y + 2, 4);
      } else if (slot.id === 'mega_tower') {
        g.fillRect(slot.x - 4, slot.y - 8, 8, 16);
        g.fillRect(slot.x - 1, slot.y - 13, 2, 5);
      } else {
        g.fillTriangle(slot.x - 7, slot.y + 8, slot.x - 2, slot.y - 6, slot.x + 7, slot.y + 8);
        g.fillStyle(0x38bdf8, 1);
        g.fillRect(slot.x + 1, slot.y - 2, 4, 10);
      }
    });

    g.fillStyle(0x38bdf8, 0.12);
    g.fillRoundedRect(trophyX + 2, trophyY + 2, trophyW - 4, trophyH - 4, 4);
    g.lineStyle(1.5, 0xffffff, 0.35);
    g.lineBetween(trophyX + 10, trophyY + 8, trophyX + 24, trophyY + 28);
    g.lineBetween(trophyX + 18, trophyY + 8, trophyX + 28, trophyY + 22);

    if (!this.isVisiting()) {
      const trophyHit = this.add.zone(trophyX + trophyW / 2, trophyY + trophyH / 2, trophyW + 8, trophyH + 8)
        .setInteractive({ useHandCursor: true });
      trophyHit.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        this.showcaseModalOpen = true;
        AudioManager.playClick();
        this.openAchievementsModal(tier);
      });
    }

    if (showcaseLvl > 0) {
      const shelfX = 14;
      const shelfY = 148;
      const shelfW = 58;
      const shelfH = 144;

      g.fillStyle(0x18181b, 0.96);
      g.fillRoundedRect(shelfX, shelfY, shelfW, shelfH, 6);
      g.lineStyle(2, tier.accent, 0.85);
      g.strokeRoundedRect(shelfX, shelfY, shelfW, shelfH, 6);

      for (let i = 0; i < 4; i++) {
        const sy = shelfY + 20 + i * 31;
        g.fillStyle(0x3f3f46, 1);
        g.fillRect(shelfX + 7, sy + 13, 44, 4);

        if (displayedGems[i]) {
          const gx = shelfX + 29;
          const gy = sy + 4;
          g.fillStyle(displayedGems[i].color, 1);
          g.beginPath();
          g.moveTo(gx, gy - 8);
          g.lineTo(gx + 7, gy);
          g.lineTo(gx, gy + 8);
          g.lineTo(gx - 7, gy);
          g.closePath();
          g.fillPath();
          g.lineStyle(1.5, 0xffffff, 0.9);
          g.strokePath();
        } else {
          g.fillStyle(0x27272a, 1);
          g.fillCircle(shelfX + 29, sy + 4, 3);
        }
      }

      this.leftDoor = this.add.rectangle(shelfX + 2, shelfY + 2, shelfW / 2 - 2, shelfH - 4, 0x38bdf8, 0.16)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x7dd3fc, 0.55);
      this.rightDoor = this.add.rectangle(shelfX + shelfW - 2, shelfY + 2, shelfW / 2 - 2, shelfH - 4, 0x38bdf8, 0.16)
        .setOrigin(1, 0)
        .setStrokeStyle(1, 0x7dd3fc, 0.55);

      this.add.text(shelfX + shelfW / 2, shelfY + shelfH + 10, `💎 ${totalGemsCount}/${RARE_INCLUSIONS.length}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: '#fef3c7',
        backgroundColor: '#14161bdd',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      const shelfZone = this.add.zone(shelfX + shelfW / 2, shelfY + shelfH / 2, shelfW + 14, shelfH + 24)
        .setInteractive({ useHandCursor: true });

      shelfZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        this.showcaseModalOpen = true;
        AudioManager.playLatchSnap();

        this.tweens.add({
          targets: [this.leftDoor, this.rightDoor],
          scaleX: 0.12,
          duration: 240,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.openShowcaseModal(tier, cfg);
          }
        });
      });
    } else if (!this.isVisiting() && totalGemsCount > 0) {
      const boxX = 14;
      const boxY = 246;
      g.fillStyle(0x292524, 0.95);
      g.fillRoundedRect(boxX, boxY, 58, 48, 6);
      g.lineStyle(1.5, 0x78716c, 0.8);
      g.strokeRoundedRect(boxX, boxY, 58, 48, 6);

      this.add.text(boxX + 29, boxY + 15, '📦 СКЛАД', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: '#fde68a'
      }).setOrigin(0.5);

      this.add.text(boxX + 29, boxY + 32, `💎 ${totalGemsCount} шт.`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#38bdf8'
      }).setOrigin(0.5);

      const boxZone = this.add.zone(boxX + 29, boxY + 24, 64, 54).setInteractive({ useHandCursor: true });
      boxZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        this.showcaseModalOpen = true;
        AudioManager.playClick();
        this.openShowcaseModal(tier, cfg);
      });
    }

    const floorLineY = backWallY + 28;
    if (hasCooler) {
      const cx = w - 34;
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(cx - 13, floorLineY - 40, 26, 40, 4);
      g.lineStyle(1.5, 0x64748b, 1);
      g.strokeRoundedRect(cx - 13, floorLineY - 40, 26, 40, 4);
      g.fillStyle(0x38bdf8, 0.85);
      g.fillRoundedRect(cx - 10, floorLineY - 64, 20, 24, 5);
      g.fillStyle(0x0284c9, 1);
      g.fillRect(cx - 5, floorLineY - 26, 4, 5);
      g.fillStyle(0xef4444, 1);
      g.fillRect(cx + 2, floorLineY - 26, 4, 5);

      const coolerZone = this.add.zone(cx, floorLineY - 32, 34, 66).setInteractive({ useHandCursor: true });
      coolerZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        AudioManager.playCorePickup();
        for (let b = 0; b < 6; b++) {
          const bub = this.add.circle(cx + (Math.random() - 0.5) * 12, floorLineY - 42, 2.5, 0xe0f2fe, 0.95).setDepth(6);
          this.tweens.add({
            targets: bub,
            y: floorLineY - 62,
            alpha: 0,
            delay: b * 80,
            duration: 450,
            onComplete: () => bub.destroy()
          });
        }
      });
    }

    if (hasPlants) {
      const px = hasCooler ? w - 68 : w - 36;
      g.fillStyle(0xb45309, 1);
      g.fillRect(px - 10, floorLineY - 16, 20, 16);
      g.lineStyle(1.5, 0x78350f, 1);
      g.strokeRect(px - 10, floorLineY - 16, 20, 16);
      g.fillStyle(0x22c55e, 1);
      g.fillCircle(px, floorLineY - 26, 11);
      g.fillCircle(px - 8, floorLineY - 22, 8);
      g.fillCircle(px + 8, floorLineY - 22, 8);
    }

    g.fillStyle(0xfef3c7, 0.92);
    g.fillRect(w - 62, 146, 44, 56);
    g.lineStyle(2, 0x78350f, 1);
    g.strokeRect(w - 62, 146, 44, 56);
    g.fillStyle(0x78350f, 0.75);
    g.fillRect(w - 55, 155, 30, 4);
    g.fillRect(w - 55, 164, 22, 4);
    g.fillRect(w - 55, 173, 26, 4);
    if (labLvl >= 3) {
      g.fillStyle(0xd97706, 1);
      g.fillCircle(w - 40, 189, 6);
    }

    g.fillStyle(tier.table, 1);
    g.fillRect(0, frontBenchY, w, h - frontBenchY);
    g.fillStyle(0x18181b, 1);
    g.fillRect(0, frontBenchY, w, 11);
    g.fillStyle(0x71717a, 1);
    g.fillRect(0, frontBenchY, w, 3);
  }

  async openLeaderboardModal(tier) {
    const { width, height } = this.scale;
    const modalContainer = this.add.container(0, 0).setDepth(68);

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x090d16, 0.95);
    dimBg.fillRect(0, 0, width, height);

    const boxW = 408;
    const boxH = 684;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x181c26, 1);
    panel.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    panel.lineStyle(3, 0x38bdf8, 1);
    panel.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const title = this.add.text(width / 2, boxY + 24, '🌐 РЕЙТИНГ КОЛЛЕГИИ ГЕОЛОГОВ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const myProfile = Storage.buildPublicProfile(PlatformSDK.playerName);
    const nameTxt = this.add.text(boxX + 18, boxY + 52, `Ваш позывной: ${myProfile.name}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#fef08a'
    }).setOrigin(0, 0.5);

    const renameBtn = this.add.text(boxX + boxW - 18, boxY + 52, '✏️ ИЗМЕНИТЬ НИК', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#facc15',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    renameBtn.on('pointerdown', () => {
      AudioManager.playClick();
      const entered = window.prompt('Введите название вашей лаборатории или никнейм (до 20 символов):', Storage.getPlayerName());
      if (entered && entered.trim()) {
        const updated = Storage.setPlayerName(entered);
        PlatformSDK.playerName = updated;
        const fresh = Storage.buildPublicProfile(updated);
        PlatformSDK.submitLabProfile(fresh);
        modalContainer.destroy();
        this.openLeaderboardModal(tier);
      }
    });

    const loadingTxt = this.add.text(width / 2, height / 2, '⏳ Загрузка рейтинга лабораторий...', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width / 2, boxY + boxH - 28, 'ЗАКРЫТЬ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#d97706',
      padding: { x: 26, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      AudioManager.playClick();
      modalContainer.destroy();
      this.showcaseModalOpen = false;
    });

    modalContainer.add([blocker, dimBg, panel, title, nameTxt, renameBtn, loadingTxt, closeBtn]);

    const entries = await PlatformSDK.fetchLeaderboard(myProfile);
    if (!modalContainer.active) return;
    loadingTxt.destroy();

    const listStartY = boxY + 76;
    const listViewH = boxH - 134;
    const scrollGroup = this.add.container(0, 0);
    modalContainer.add(scrollGroup);

    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(boxX + 8, listStartY, boxW - 16, listViewH);
    scrollGroup.setMask(maskG.createGeometryMask());

    const rowH = 64;
    const rowGap = 8;
    const visitHitTargets = [];

    entries.forEach((entry, idx) => {
      const ry = listStartY + idx * (rowH + rowGap);
      const isSelf = Boolean(entry.isSelf || entry.playerId === myProfile.playerId);
      const rank = idx + 1;

      const rowG = this.add.graphics();
      rowG.fillStyle(isSelf ? 0x1e3a8a : 0x1e293b, 1);
      rowG.fillRoundedRect(boxX + 14, ry, boxW - 28, rowH, 10);
      rowG.lineStyle(1.5, isSelf ? 0xfacc15 : rank <= 3 ? 0x38bdf8 : 0x334155, 0.9);
      rowG.strokeRoundedRect(boxX + 14, ry, boxW - 28, rowH, 10);

      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const rankTxt = this.add.text(boxX + 34, ry + rowH / 2, medal, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: rank <= 3 ? '18px' : '13px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);

      const pName = this.add.text(
        boxX + 58,
        ry + 18,
        `${entry.name}${isSelf ? ' (ВЫ)' : ''}`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '12px',
          fontWeight: '700',
          color: isSelf ? '#fef08a' : '#f8fafc'
        }
      ).setOrigin(0, 0.5);

      const pStats = this.add.text(
        boxX + 58,
        ry + 42,
        `Индекс: ${entry.score} · Ур.${entry.labLevel} · ★${entry.reputation}`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          color: '#7dd3fc'
        }
      ).setOrigin(0, 0.5);

      scrollGroup.add([rowG, rankTxt, pName, pStats]);

      if (!isSelf && entry.snapshot) {
        const btnX = boxX + boxW - 24;
        const btnY = ry + rowH / 2;
        const visitBtn = this.add.text(btnX, btnY, '👁️ В ГОСТИ', {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '10px',
          fontWeight: '700',
          color: '#0f172a',
          backgroundColor: '#4ade80',
          padding: { x: 9, y: 6 }
        }).setOrigin(1, 0.5);

        scrollGroup.add(visitBtn);
        visitHitTargets.push({
          left: btnX - visitBtn.width - 8,
          right: btnX + 8,
          top: ry,
          bottom: ry + rowH,
          entry
        });
      }
    });

    const totalH = entries.length * (rowH + rowGap);
    const maxScroll = Math.max(0, totalH - listViewH + 10);
    let scrollY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartScroll = 0;
    let dragging = false;

    const dragZone = this.add.zone(width / 2, listStartY + listViewH / 2, boxW, listViewH)
      .setInteractive({ useHandCursor: true });

    dragZone.on('pointerdown', (ptr) => {
      dragging = true;
      dragStartX = ptr.x;
      dragStartY = ptr.y;
      dragStartScroll = scrollY;
    });

    dragZone.on('pointermove', (ptr) => {
      if (!dragging || maxScroll <= 0) return;
      scrollY = Phaser.Math.Clamp(dragStartScroll + (ptr.y - dragStartY), -maxScroll, 0);
      scrollGroup.y = scrollY;
    });

    dragZone.on('pointerup', (ptr) => {
      if (!dragging) return;
      dragging = false;
      const moveDist = Math.hypot(ptr.x - dragStartX, ptr.y - dragStartY);
      if (moveDist < 12) {
        const contentY = ptr.y - scrollY;
        const hit = visitHitTargets.find(
          (t) => ptr.x >= t.left && ptr.x <= t.right && contentY >= t.top && contentY <= t.bottom
        );
        if (hit) {
          AudioManager.playStamp();
          maskG.destroy();
          modalContainer.destroy();
          this.showcaseModalOpen = false;
          this.scene.restart({ visitProfile: hit.entry });
        }
      }
    });

    modalContainer.add(dragZone);

    closeBtn.once('pointerdown', () => {
      maskG.destroy();
    });
  }

  openAchievementsModal(tier) {
    const { width, height } = this.scale;
    const modalContainer = this.add.container(0, 0).setDepth(65);

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x090d16, 0.95);
    dimBg.fillRect(0, 0, width, height);

    const boxW = 408;
    const boxH = 680;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x181c26, 1);
    panel.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    panel.lineStyle(3, tier.accent, 1);
    panel.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const unlockedList = Storage.getUnlockedAchievements();
    const title = this.add.text(
      width / 2,
      boxY + 24,
      `🏆 ДОСТИЖЕНИЯ (${unlockedList.length}/${ACHIEVEMENTS_CATALOG.length})`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '16px',
        fontWeight: '700',
        color: '#facc15'
      }
    ).setOrigin(0.5);

    const megasDone = Storage.getCompletedMegasCount();
    const sub = this.add.text(
      width / 2,
      boxY + 46,
      `Сдано строек века: ${megasDone}/${MEGA_PROJECTS.length} · Свайпай список вниз/вверх`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#94a3b8'
      }
    ).setOrigin(0.5);

    modalContainer.add([blocker, dimBg, panel, title, sub]);

    const listStartY = boxY + 66;
    const listViewH = boxH - 122;
    const scrollGroup = this.add.container(0, 0);
    modalContainer.add(scrollGroup);

    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(boxX + 8, listStartY, boxW - 16, listViewH);
    scrollGroup.setMask(maskG.createGeometryMask());

    const rowH = 66;
    const rowGap = 8;
    ACHIEVEMENTS_CATALOG.forEach((ach, idx) => {
      const isDone = unlockedList.includes(ach.id);
      const ry = listStartY + idx * (rowH + rowGap);

      const rowG = this.add.graphics();
      rowG.fillStyle(isDone ? 0x1e293b : 0x11151f, 1);
      rowG.fillRoundedRect(boxX + 14, ry, boxW - 28, rowH, 10);
      rowG.lineStyle(1.5, isDone ? 0xfacc15 : 0x334155, isDone ? 0.95 : 0.6);
      rowG.strokeRoundedRect(boxX + 14, ry, boxW - 28, rowH, 10);

      const iconTxt = this.add.text(boxX + 36, ry + rowH / 2, isDone ? ach.icon : '🔒', {
        fontSize: '20px',
        padding: { x: 6, y: 6 }
      }).setOrigin(0.5).setAlpha(isDone ? 1 : 0.55);

      const nameTxt = this.add.text(boxX + 60, ry + 16, ach.title, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: isDone ? '#fef08a' : '#94a3b8'
      }).setOrigin(0, 0.5);

      const rewardTxt = this.add.text(
        boxX + boxW - 24,
        ry + 16,
        isDone ? '✅ ПОЛУЧЕНО' : `+${ach.rewardMoney}₽ ★${ach.rewardRep}`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          fontWeight: '700',
          color: isDone ? '#4ade80' : '#38bdf8'
        }
      ).setOrigin(1, 0.5);

      const descTxt = this.add.text(boxX + 60, ry + 42, ach.desc, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '10px',
        color: isDone ? '#e2e8f0' : '#64748b',
        wordWrap: { width: boxW - 84 }
      }).setOrigin(0, 0.5);

      scrollGroup.add([rowG, iconTxt, nameTxt, rewardTxt, descTxt]);
    });

    const totalH = ACHIEVEMENTS_CATALOG.length * (rowH + rowGap);
    const maxScroll = Math.max(0, totalH - listViewH + 10);
    let scrollY = 0;
    let dragStart = 0;
    let dragStartScroll = 0;
    let dragging = false;

    const dragZone = this.add.zone(width / 2, listStartY + listViewH / 2, boxW, listViewH)
      .setInteractive();
    dragZone.on('pointerdown', (ptr) => {
      dragging = true;
      dragStart = ptr.y;
      dragStartScroll = scrollY;
    });
    dragZone.on('pointermove', (ptr) => {
      if (!dragging || maxScroll <= 0) return;
      scrollY = Phaser.Math.Clamp(dragStartScroll + (ptr.y - dragStart), -maxScroll, 0);
      scrollGroup.y = scrollY;
    });
    dragZone.on('pointerup', () => { dragging = false; });
    modalContainer.add(dragZone);

    const closeBtn = this.add.text(width / 2, boxY + boxH - 28, 'ЗАКРЫТЬ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#d97706',
      padding: { x: 26, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      AudioManager.playClick();
      maskG.destroy();
      modalContainer.destroy();
      this.showcaseModalOpen = false;
    });

    modalContainer.add(closeBtn);
  }

  openShowcaseModal(tier, cfg) {
    const { width, height } = this.scale;
    const modalContainer = this.add.container(0, 0).setDepth(60);
    const isGuest = this.isVisiting();
    const hasShowcase = cfg.showcaseLvl > 0;

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x090d16, 0.94);
    dimBg.fillRect(0, 0, width, height);

    const boxW = 396;
    const boxH = 656;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x181c26, 1);
    panel.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    panel.lineStyle(3, tier.accent, 1);
    panel.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const titleText = isGuest
      ? `💎 ВИТРИНА КОЛЛЕГИ: ${this.visitProfile.name}`
      : hasShowcase
        ? '💎 СКЛАД И ВИТРИНА МИНЕРАЛОВ'
        : '📦 СКЛАД НАЙДЕННЫХ МИНЕРАЛОВ';

    const title = this.add.text(width / 2, boxY + 24, titleText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0.5);

    const foundGems = isGuest ? cfg.displayedGems : Storage.getGems();
    const subText = `Образцов: ${foundGems.length}/${RARE_INCLUSIONS.length} · Тапни по образцу для 3D-осмотра`;

    const sub = this.add.text(width / 2, boxY + 46, subText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    modalContainer.add([blocker, dimBg, panel, title, sub]);

    RARE_INCLUSIONS.forEach((gem, idx) => {
      const owned = foundGems.find((g) => g.id === gem.id);
      const ry = boxY + 66 + idx * 57;
      const rowH = 51;

      const rowG = this.add.graphics();
      rowG.fillStyle(owned ? 0x222938 : 0x131720, 1);
      rowG.fillRoundedRect(boxX + 14, ry, boxW - 28, rowH, 8);
      rowG.lineStyle(1.5, owned ? gem.color : 0x334155, owned ? 0.9 : 0.6);
      rowG.strokeRoundedRect(boxX + 14, ry, boxW - 28, rowH, 8);

      modalContainer.add(rowG);

      if (owned) {
        const miniGem = MineralRenderer.createMineralDisplay(this, boxX + 36, ry + rowH / 2, gem.id, 0.56, false);
        modalContainer.add(miniGem);
      } else {
        const qBox = this.add.text(boxX + 36, ry + rowH / 2, '?', {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '15px',
          fontWeight: '700',
          color: '#94a3b8',
          backgroundColor: '#1e293b',
          fixedWidth: 26,
          fixedHeight: 26,
          align: 'center',
          padding: { x: 0, y: 4 }
        }).setOrigin(0.5);
        modalContainer.add(qBox);
      }

      const nameTxt = this.add.text(
        boxX + 62,
        ry + 15,
        owned ? `${gem.name}${!isGuest && owned.count > 1 ? ` (×${owned.count})` : ''}` : 'Неизвестный образец',
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          fontWeight: '700',
          color: owned ? '#f8fafc' : '#64748b'
        }
      ).setOrigin(0, 0.5);

      const descTxt = this.add.text(
        boxX + 62,
        ry + 35,
        owned ? `${gem.rarity} · 🔍 Осмотреть 3D` : `Редкость: ${gem.rarity}`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '10px',
          color: owned ? '#38bdf8' : '#475569'
        }
      ).setOrigin(0, 0.5);

      modalContainer.add([nameTxt, descTxt]);

      if (owned) {
        const inspectZone = this.add.zone(boxX + 145, ry + rowH / 2, 230, rowH)
          .setInteractive({ useHandCursor: true });

        inspectZone.on('pointerdown', () => {
          AudioManager.playClick();
          this.openMineralInspectorModal(gem, owned.count || 1);
        });
        modalContainer.add(inspectZone);

        if (!isGuest && hasShowcase) {
          const isShown = Storage.isGemDisplayed(gem.id);
          const toggleBtn = this.add.text(
            boxX + boxW - 22,
            ry + rowH / 2,
            isShown ? '✅ НА ПОЛКЕ' : '+ НА ПОЛКУ',
            {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '9px',
              fontWeight: '700',
              color: isShown ? '#0f172a' : '#fef3c7',
              backgroundColor: isShown ? '#4ade80' : '#334155',
              padding: { x: 7, y: 5 }
            }
          ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

          toggleBtn.on('pointerdown', () => {
            AudioManager.playLatchSnap();
            Storage.toggleGemDisplay(gem.id);
            modalContainer.destroy();
            this.openShowcaseModal(tier, cfg);
          });

          modalContainer.add(toggleBtn);
        }
      }
    });

    const closeBtn = this.add.text(
      width / 2,
      boxY + boxH - 28,
      isGuest ? 'ЗАКРЫТЬ ВИТРИНУ' : 'ЗАКРЫТЬ И ОБНОВИТЬ ПОЛКУ',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#ffffff',
        backgroundColor: '#d97706',
        padding: { x: 20, y: 9 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      AudioManager.playLatchSnap();
      modalContainer.destroy();
      this.scene.restart({ visitProfile: this.visitProfile });
    });

    modalContainer.add(closeBtn);
  }

  openMineralInspectorModal(gem, count = 1) {
    const { width, height } = this.scale;
    const inspContainer = this.add.container(0, 0).setDepth(75);

    const MINERAL_NOTES = {
      calcite: 'Формула: CaCO₃ · Твёрдость по Моосу: 3\nОбладает сильным двойным лучепреломлением и характерным стеклянным блеском.',
      pyrite: 'Формула: FeS₂ · Твёрдость по Моосу: 6–6.5\n«Золото дураков» — образует идеальные кубические кристаллы с металлической штриховкой.',
      agate: 'Формула: SiO₂ · Твёрдость по Моосу: 6.5–7\nСкрытокристаллический халцедон с тончайшими полосами природных пигментов.',
      quartz: 'Формула: SiO₂ · Твёрдость по Моосу: 7\nПьезоэлектрический кристалл чистейшего кремнезёма в шестигранной призме.',
      ammonite: 'Возраст: ~145 млн лет (Мезозой)\nОкаменелая раковина головоногого моллюска, замещённая кальцитом и пиритом.',
      amethyst: 'Формула: SiO₂ (примеси Fe⁴⁺) · Твёрдость: 7\nДрагоценная фиолетовая разновидность кварца из скальных жеод Урала.',
      malachite: 'Формула: Cu₂CO₃(OH)₂ · Твёрдость: 3.5–4\nЗнаменитый уральский карбонат меди с шелковистым ленточно-почковидным узором.',
      native_gold: 'Формула: Au · Плотность: 19.3 г/см³\nБлагородный самородный металл, вплавленный в жильный молочно-белый кварц.',
      diamond_kimberlite: 'Формула: C · Твёрдость по Моосу: 10\nСверхтвёрдый октаэдр природного алмаза в коренной кимберлитовой трубке.'
    };

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dim = this.add.graphics();
    dim.fillStyle(0x050811, 0.96);
    dim.fillRect(0, 0, width, height);

    const cardW = 376;
    const cardH = 490;
    const cx = width / 2;
    const cy = height / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x131926, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 18);
    panel.lineStyle(3, gem.color, 1);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 18);

    const header = this.add.text(cx, cy - cardH / 2 + 28, '🔬 3D-ОСМОТР ОБРАЗЦА', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontWeight: '700',
      color: '#7dd3fc'
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy - cardH / 2 + 56, `${gem.name}${count > 1 ? ` (×${count})` : ''}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#fef3c7',
      align: 'center',
      wordWrap: { width: cardW - 36 }
    }).setOrigin(0.5);

    const stageY = cy - 30;
    const stageBg = this.add.graphics();
    stageBg.fillStyle(0x090d16, 1);
    stageBg.fillRoundedRect(cx - 140, stageY - 96, 280, 192, 14);
    stageBg.lineStyle(1.5, gem.color, 0.55);
    stageBg.strokeRoundedRect(cx - 140, stageY - 96, 280, 192, 14);

    const glow = this.add.circle(cx, stageY, 68, gem.color, 0.14);
    const mineralObj = MineralRenderer.createMineralDisplay(this, cx, stageY, gem.id, 2.05, true);

    const dragHint = this.add.text(cx, stageY + 80, '↔ ПРОВЕДИ ПАЛЬЦЕМ, ЧТОБЫ ПОКРУТИТЬ ОБРАЗЕЦ', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    const statsBadge = this.add.text(
      cx,
      cy + 92,
      `Класс: ${gem.rarity}  ·  Оценочная стоимость: ${gem.value} ₽`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#4ade80',
        backgroundColor: '#0f172a',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5);

    const noteTxt = this.add.text(
      cx,
      cy + 146,
      MINERAL_NOTES[gem.id] || 'Редкий геологический образец из керновой скважины.',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#cbd5e1',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: cardW - 44 }
      }
    ).setOrigin(0.5);

    const backBtn = this.add.text(cx, cy + cardH / 2 - 32, '← НАЗАД К ВИТРИНЕ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#facc15',
      padding: { x: 20, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      inspContainer.destroy();
    });

    inspContainer.add([
      blocker, dim, panel, header, title, stageBg, glow, mineralObj, dragHint, statsBadge, noteTxt, backBtn
    ]);
  }

  createTopBar(w, tier) {
    const barH = 64;
    const g = this.add.graphics();
    g.fillStyle(0x14161b, 0.96);
    g.fillRect(0, 0, w, barH);
    g.lineStyle(2, tier.accent, 0.65);
    g.lineBetween(0, barH, w, barH);

    this.moneyTxt = this.add.text(14, 21, `💰 ${Storage.getMoney()} ₽`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      fontWeight: '700',
      color: '#facc15'
    });

    this.add.text(142, 21, `★ ${Storage.getReputation()}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      fontWeight: '700',
      color: '#38bdf8'
    });

    const makeTopPill = (cx, cy, pillW, pillH, label, fillCol, textCol, onClick) => {
      const c = this.add.container(cx, cy);
      const pillG = this.add.graphics();
      const drawPill = (pressed) => {
        pillG.clear();
        const oy = pressed ? 1.5 : 0;
        pillG.fillStyle(fillCol, 1);
        pillG.fillRoundedRect(-pillW / 2, -pillH / 2 + oy, pillW, pillH, 9);
        pillG.lineStyle(1.5, 0xffffff, 0.25);
        pillG.strokeRoundedRect(-pillW / 2, -pillH / 2 + oy, pillW, pillH, 9);
      };
      drawPill(false);

      const t = this.add.text(0, 0, label, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: Phaser.Display.Color.IntegerToColor(textCol).rgba
      }).setOrigin(0.5);

      const z = this.add.zone(0, 0, pillW, pillH).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        drawPill(true);
        t.y = 1.5;
      });
      z.on('pointerup', () => {
        drawPill(false);
        t.y = 0;
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        onClick();
      });
      z.on('pointerout', () => {
        drawPill(false);
        t.y = 0;
      });

      c.add([pillG, t, z]);
      return c;
    };

    const btnH = 30;
    const btnY = 32;

    if (!this.isVisiting()) {
      makeTopPill(w - 224, btnY, 54, btnH, 'ГИД', 0x334155, 0xfef3c7, () => {
        AudioManager.playClick();
        TutorialManager.restart(this);
      });
    }

    makeTopPill(w - 166, btnY, 54, btnH, '🌐 ТОП', 0x0284c7, 0xf0f9ff, () => {
      this.showcaseModalOpen = true;
      AudioManager.playClick();
      this.openLeaderboardModal(tier);
    });

    const achCount = Storage.getUnlockedAchievements().length;
    makeTopPill(
      w - 102,
      btnY,
      66,
      btnH,
      `🏆 ${achCount}/${ACHIEVEMENTS_CATALOG.length}`,
      0xd97706,
      0xffffff,
      () => {
        this.showcaseModalOpen = true;
        AudioManager.playClick();
        this.openAchievementsModal(tier);
      }
    );

    const soundBtn = this.add.text(w - 14, btnY, Storage.isSoundEnabled() ? '🔊' : '🔇', {
      fontSize: '20px'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    soundBtn.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      const enabled = Storage.toggleSound();
      soundBtn.setText(enabled ? '🔊' : '🔇');
      if (enabled) AudioManager.playClick();
    });
  }

  createLiveMiniLab(w, h, tier, cfg) {
    const backFloorY = 286;
    const midFloorY = 340;
    const frontBenchY = h * 0.545;

    const { labLvl, pressLvl, sawLvl, grinderLvl, staffCount } = cfg;
    const hasGoldPress = cfg.hasRnd('rnd_gold_press');

    const hasSplit = cfg.isTestUnlocked('shear_crack');
    const hasWater = cfg.isTestUnlocked('water_sat');
    const hasUltrasonic = cfg.isTestUnlocked('ultrasonic');
    const hasFrost = cfg.isTestUnlocked('frost_test');
    const hasShearLoad = cfg.isTestUnlocked('shear_load');
    const hasTriaxial = cfg.isTestUnlocked('triaxial');

    const hasLoungeSofa = cfg.hasDecor('lounge_sofa');
    const hasArchiveDesk = cfg.hasDecor('archive_desk');
    const hasRoboArm = cfg.hasDecor('robo_arm');
    const hasRoboRover = cfg.hasDecor('robo_rover');
    const hasRoboDog = cfg.hasDecor('robo_dog');
    const hasRoboHumanoid = cfg.hasDecor('robo_humanoid');

    const backG = this.add.graphics().setDepth(4);

    if (hasWater) {
      const wx = 112;
      backG.fillStyle(0x475569, 1);
      backG.fillRoundedRect(wx - 20, backFloorY - 46, 40, 46, 4);
      backG.lineStyle(1.5, 0x0f172a, 0.9);
      backG.strokeRoundedRect(wx - 20, backFloorY - 46, 40, 46, 4);
      backG.fillStyle(0xf97316, 0.85);
      backG.fillRect(wx - 13, backFloorY - 38, 26, 16);
      backG.fillStyle(0xe2e8f0, 1);
      backG.fillRect(wx - 12, backFloorY - 16, 24, 4);
      backG.fillStyle(0x38bdf8, 1);
      backG.fillCircle(wx + 12, backFloorY - 8, 2.5);
    }

    if (hasFrost) {
      const fx = 166;
      backG.fillStyle(0x1e3a8a, 1);
      backG.fillRoundedRect(fx - 20, backFloorY - 50, 40, 50, 5);
      backG.lineStyle(1.5, 0x38bdf8, 1);
      backG.strokeRoundedRect(fx - 20, backFloorY - 50, 40, 50, 5);
      backG.fillStyle(0xbae6fd, 0.85);
      backG.fillRect(fx - 12, backFloorY - 40, 24, 18);
      backG.lineStyle(1.5, 0x0284c9, 1);
      backG.lineBetween(fx - 6, backFloorY - 31, fx + 6, backFloorY - 31);
      backG.lineBetween(fx, backFloorY - 37, fx, backFloorY - 25);
    }

    if (labLvl >= 2) {
      const rx = w / 2 + 18;
      backG.fillStyle(0x3f3f46, 1);
      backG.fillRect(rx - 26, backFloorY - 48, 4, 48);
      backG.fillRect(rx + 22, backFloorY - 48, 4, 48);
      backG.fillRect(rx - 26, backFloorY - 34, 52, 3);
      backG.fillRect(rx - 26, backFloorY - 16, 52, 3);
      backG.fillStyle(0x92400e, 1);
      backG.fillRect(rx - 18, backFloorY - 44, 16, 10);
      backG.fillStyle(0xd6d3d1, 1);
      backG.fillRect(rx + 4, backFloorY - 26, 14, 10);
    }

    if (cfg.hasCryoBox) {
      const cbx = w - 122;
      backG.fillStyle(0x0284c9, 1);
      backG.fillRoundedRect(cbx - 16, backFloorY - 24, 32, 24, 4);
      backG.lineStyle(1.5, 0x0f172a, 0.9);
      backG.strokeRoundedRect(cbx - 16, backFloorY - 24, 32, 24, 4);
      backG.fillStyle(0xe0f2fe, 1);
      backG.fillRect(cbx - 16, backFloorY - 26, 32, 5);
    }

    const midG = this.add.graphics().setDepth(9);
    const midX = w / 2;

    if (labLvl === 1) {
      midG.fillStyle(0x78350f, 1);
      midG.fillRect(midX - 30, midFloorY - 18, 60, 5);
      midG.fillRect(midX - 26, midFloorY - 13, 5, 13);
      midG.fillRect(midX + 21, midFloorY - 13, 5, 13);
      midG.fillStyle(0xfef3c7, 0.9);
      midG.fillRect(midX - 18, midFloorY - 21, 24, 3);
    } else if (labLvl <= 3) {
      midG.fillStyle(0x334155, 1);
      midG.fillRoundedRect(midX - 42, midFloorY - 22, 84, 22, 4);
      midG.lineStyle(1.5, 0x0f172a, 0.9);
      midG.strokeRoundedRect(midX - 42, midFloorY - 22, 84, 22, 4);
      midG.fillStyle(0x0f172a, 1);
      midG.fillRect(midX - 16, midFloorY - 42, 32, 18);
      midG.fillStyle(0x38bdf8, 0.85);
      midG.fillRect(midX - 13, midFloorY - 39, 26, 12);
      midG.fillStyle(0x94a3b8, 1);
      midG.fillRect(midX - 4, midFloorY - 24, 8, 3);
    } else {
      midG.fillStyle(0x1e293b, 1);
      midG.fillRoundedRect(midX - 58, midFloorY - 24, 116, 24, 6);
      midG.lineStyle(2, tier.accent, 0.9);
      midG.strokeRoundedRect(midX - 58, midFloorY - 24, 116, 24, 6);
      midG.fillStyle(0x38bdf8, 0.9);
      midG.fillRect(midX - 46, midFloorY - 15, 18, 5);
      midG.fillStyle(0x4ade80, 0.9);
      midG.fillRect(midX - 22, midFloorY - 15, 18, 5);

      const projX = midX - 22;
      const projY = midFloorY - 24;
      midG.fillStyle(0x0f172a, 1);
      midG.fillRoundedRect(projX - 12, projY - 4, 24, 4, 2);
      midG.fillStyle(0x38bdf8, 0.22);
      midG.fillTriangle(projX - 10, projY - 4, projX + 10, projY - 4, projX, projY - 36);

      const holoGroup = this.add.container(projX, projY - 20).setDepth(10);
      const hG = this.add.graphics();
      hG.fillStyle(0x38bdf8, 0.35);
      hG.fillRoundedRect(-8, -11, 16, 22, 3);
      hG.lineStyle(1.5, 0x7dd3fc, 0.95);
      hG.strokeRoundedRect(-8, -11, 16, 22, 3);
      hG.lineStyle(1, 0xe0f2fe, 0.8);
      hG.lineBetween(-5, -4, 4, -2);
      hG.lineBetween(-3, 4, 6, 6);
      hG.lineStyle(1.5, 0x4ade80, 1);
      hG.lineBetween(-12, 0, 12, 0);
      holoGroup.add(hG);

      this.tweens.add({
        targets: holoGroup,
        y: projY - 25,
        duration: 1150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (hasLoungeSofa) {
      const sx = 98;
      midG.fillStyle(0x92400e, 1);
      midG.fillRoundedRect(sx - 24, midFloorY - 26, 48, 16, 4);
      midG.fillStyle(0xd97706, 1);
      midG.fillRoundedRect(sx - 20, midFloorY - 14, 40, 10, 3);
      midG.fillStyle(0x78350f, 1);
      midG.fillRoundedRect(sx - 26, midFloorY - 18, 5, 18, 2);
      midG.fillRoundedRect(sx + 21, midFloorY - 18, 5, 18, 2);
    }

    if (hasArchiveDesk) {
      const ax = w - 102;
      midG.fillStyle(0x334155, 1);
      midG.fillRoundedRect(ax - 20, midFloorY - 34, 40, 34, 4);
      midG.lineStyle(1.5, 0x0f172a, 0.9);
      midG.strokeRoundedRect(ax - 20, midFloorY - 34, 40, 34, 4);
      [-28, -18, -8].forEach((dy) => {
        midG.fillStyle(0x475569, 1);
        midG.fillRect(ax - 15, midFloorY + dy, 30, 7);
        midG.fillStyle(0xfacc15, 1);
        midG.fillRect(ax - 4, midFloorY + dy + 2, 8, 2);
      });
    }

    if (hasRoboArm) {
      const armX = midX + 26;
      const armY = midFloorY - 24;
      midG.fillStyle(0x64748b, 1);
      midG.fillRoundedRect(armX - 12, armY - 6, 24, 6, 2);

      const armPivot = this.add.container(armX, armY - 6).setDepth(10);
      const aG = this.add.graphics();
      aG.lineStyle(5, 0xdc2626, 1);
      aG.lineBetween(0, 0, -10, -24);
      aG.lineBetween(-10, -24, 14, -40);
      aG.fillStyle(0xfacc15, 1);
      aG.fillCircle(-10, -24, 4);
      aG.fillStyle(0x38bdf8, 1);
      aG.fillCircle(14, -40, 4);
      armPivot.add(aG);

      const armHit = this.add.zone(0, -20, 42, 48).setInteractive({ useHandCursor: true });
      armHit.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        AudioManager.playLatchSnap();
        this.particles.emitParticleAt(armX + 12, armY - 42, 12);
        this.showSpeechBubble(armPivot, 'МАНИПУЛЯТОР: ЛАЗЕРНЫЙ ЗАХВАТ ⚡', 0xef4444);
        this.tweens.add({
          targets: armPivot,
          angle: -26,
          duration: 180,
          yoyo: true
        });
      });
      armPivot.add(armHit);

      this.tweens.add({
        targets: armPivot,
        angle: 18,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const eqG = this.add.graphics().setDepth(14);

    const sawX = 50;
    eqG.fillStyle(0x334155, 1);
    eqG.fillRoundedRect(sawX - 20, frontBenchY - 20, 40, 20, 4);
    eqG.lineStyle(1.5, 0x0f172a, 0.9);
    eqG.strokeRoundedRect(sawX - 20, frontBenchY - 20, 40, 20, 4);
    eqG.fillStyle(sawLvl >= 3 ? 0x10b981 : 0xd97706, 1);
    eqG.fillRoundedRect(sawX - 15, frontBenchY - 36, 30, 16, 4);
    const sawBlade = this.add.circle(sawX, frontBenchY - 20, 9, 0xcbd5e1).setStrokeStyle(1.5, 0x0f172a).setDepth(15);

    const sawZone = this.add.zone(sawX, frontBenchY - 20, 44, 42).setInteractive({ useHandCursor: true }).setDepth(16);
    sawZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playSawCut();
      this.particles.emitParticleAt(sawX, frontBenchY - 24, 12);
      this.tweens.add({ targets: sawBlade, angle: 360, duration: 300 });
    });

    const grX = 100;
    eqG.fillStyle(0x1e293b, 1);
    eqG.fillRoundedRect(grX - 16, frontBenchY - 18, 32, 18, 3);
    eqG.lineStyle(1.5, 0x0f172a, 0.9);
    eqG.strokeRoundedRect(grX - 16, frontBenchY - 18, 32, 18, 3);
    eqG.fillStyle(grinderLvl >= 2 ? 0x38bdf8 : 0x94a3b8, 1);
    eqG.fillEllipse(grX, frontBenchY - 20, 28, 8);

    if (hasSplit) {
      const spX = 146;
      eqG.fillStyle(0x475569, 1);
      eqG.fillRect(spX - 12, frontBenchY - 38, 24, 38);
      eqG.lineStyle(1.5, 0x0f172a, 0.9);
      eqG.strokeRect(spX - 12, frontBenchY - 38, 24, 38);
      eqG.fillStyle(0xf59e0b, 1);
      eqG.fillTriangle(spX - 7, frontBenchY - 26, spX + 7, frontBenchY - 26, spX, frontBenchY - 12);
    }

    const pressX = w / 2;
    const pressColors = [0xd97706, 0xca8a04, 0x059669, 0x0284c9, 0x4f46e5, 0xfacc15];
    const pCol = hasGoldPress ? 0xfacc15 : pressColors[Math.min(pressColors.length - 1, pressLvl - 1)];

    eqG.fillStyle(hasGoldPress ? 0xb45309 : 0x3f3f46, 1);
    eqG.fillRect(pressX - 28, frontBenchY - 66, 8, 66);
    eqG.fillRect(pressX + 20, frontBenchY - 66, 8, 66);
    eqG.fillStyle(pCol, 1);
    eqG.fillRoundedRect(pressX - 34, frontBenchY - 78, 68, 15, 4);
    eqG.lineStyle(1.5, hasGoldPress ? 0xfef08a : 0x0f172a, 0.95);
    eqG.strokeRoundedRect(pressX - 34, frontBenchY - 78, 68, 15, 4);

    if (hasGoldPress) {
      eqG.fillStyle(0xfef08a, 1);
      eqG.fillRoundedRect(pressX - 20, frontBenchY - 86, 40, 8, 3);
      eqG.fillStyle(0x38bdf8, 1);
      eqG.fillCircle(pressX + 24, frontBenchY - 70, 4);
    }

    const pressPiston = this.add.rectangle(pressX, frontBenchY - 54, 22, 14, hasGoldPress ? 0xfef08a : pCol)
      .setStrokeStyle(1, 0x0f172a)
      .setDepth(15);
    const pressCore = this.add.rectangle(pressX, frontBenchY - 13, 20, 26, 0xd6d3d1)
      .setStrokeStyle(1, 0x1e293b)
      .setDepth(15);

    const pressZone = this.add.zone(pressX, frontBenchY - 40, 72, 82).setInteractive({ useHandCursor: true }).setDepth(16);
    pressZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playRockCrack();
      this.particles.emitParticleAt(pressX, frontBenchY - 22, 14);
      this.tweens.add({
        targets: pressPiston,
        y: frontBenchY - 34,
        duration: 160,
        yoyo: true
      });
      this.tweens.add({
        targets: pressCore,
        scaleY: 0.72,
        scaleX: 1.18,
        duration: 160,
        yoyo: true
      });
    });

    if (hasShearLoad) {
      const shX = pressX + 60;
      eqG.fillStyle(0x334155, 1);
      eqG.fillRoundedRect(shX - 18, frontBenchY - 28, 36, 28, 4);
      eqG.lineStyle(1.5, 0x0f172a, 0.9);
      eqG.strokeRoundedRect(shX - 18, frontBenchY - 28, 36, 28, 4);
      eqG.fillStyle(0x0284c9, 1);
      eqG.fillRect(shX - 12, frontBenchY - 36, 24, 8);
    }

    if (hasUltrasonic) {
      const ux = pressX + 106;
      eqG.fillStyle(0x0f172a, 1);
      eqG.fillRoundedRect(ux - 16, frontBenchY - 34, 32, 34, 4);
      eqG.lineStyle(1.5, 0x4ade80, 1);
      eqG.strokeRoundedRect(ux - 16, frontBenchY - 34, 32, 34, 4);
      eqG.lineBetween(ux - 11, frontBenchY - 18, ux - 4, frontBenchY - 26);
      eqG.lineBetween(ux - 4, frontBenchY - 26, ux + 4, frontBenchY - 10);
      eqG.lineBetween(ux + 4, frontBenchY - 10, ux + 11, frontBenchY - 20);
    }

    if (hasTriaxial) {
      const tx = w - 84;
      eqG.fillStyle(0x1e293b, 1);
      eqG.fillRoundedRect(tx - 15, frontBenchY - 54, 30, 54, 5);
      eqG.lineStyle(1.5, 0x0f172a, 0.9);
      eqG.strokeRoundedRect(tx - 15, frontBenchY - 54, 30, 54, 5);
      eqG.fillStyle(0x38bdf8, 0.55);
      eqG.fillRect(tx - 10, frontBenchY - 46, 20, 34);
    }

    if (cfg.hasCoffee) {
      const cmX = w - 34;
      eqG.fillStyle(0x292524, 1);
      eqG.fillRoundedRect(cmX - 18, frontBenchY - 16, 36, 16, 3);
      eqG.fillStyle(0xe2e8f0, 1);
      eqG.fillRoundedRect(cmX - 15, frontBenchY - 48, 30, 32, 5);
      eqG.lineStyle(1.5, 0x0f172a, 0.95);
      eqG.strokeRoundedRect(cmX - 15, frontBenchY - 48, 30, 32, 5);
      eqG.fillStyle(0xdc2626, 1);
      eqG.fillRect(cmX - 13, frontBenchY - 46, 26, 9);
      eqG.fillStyle(0x4ade80, 1);
      eqG.fillCircle(cmX + 8, frontBenchY - 41, 2);
      eqG.fillStyle(0x1e293b, 1);
      eqG.fillRect(cmX - 10, frontBenchY - 34, 20, 16);
      eqG.fillStyle(0xfef3c7, 1);
      eqG.fillRect(cmX - 4, frontBenchY - 26, 8, 8);

      const coffeeZone = this.add.zone(cmX, frontBenchY - 30, 40, 50).setInteractive({ useHandCursor: true }).setDepth(16);
      coffeeZone.on('pointerdown', () => {
        if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
        AudioManager.playLatchSnap();
        for (let s = 0; s < 4; s++) {
          const steam = this.add.circle(cmX + (Math.random() - 0.5) * 8, frontBenchY - 32, 3, 0xffffff, 0.75).setDepth(17);
          this.tweens.add({
            targets: steam,
            y: frontBenchY - 56,
            alpha: 0,
            delay: s * 90,
            duration: 520,
            onComplete: () => steam.destroy()
          });
        }
      });
    }

    const topLaneY = 304;
    const botLaneY = frontBenchY - 6;
    const leftCorridorX = 62;
    const midLeftCorridorX = 138;
    const midRightCorridorX = w - 138;
    const rightCorridorX = w - 64;

    this.navNodes = [
      { id: 0, x: leftCorridorX, y: topLaneY, neighbors: [1, 4] },
      { id: 1, x: midLeftCorridorX, y: topLaneY, neighbors: [0, 2, 5] },
      { id: 2, x: midRightCorridorX, y: topLaneY, neighbors: [1, 3, 6] },
      { id: 3, x: rightCorridorX, y: topLaneY, neighbors: [2, 7] },
      { id: 4, x: leftCorridorX, y: botLaneY, neighbors: [0, 5] },
      { id: 5, x: midLeftCorridorX, y: botLaneY, neighbors: [1, 4, 6] },
      { id: 6, x: midRightCorridorX, y: botLaneY, neighbors: [2, 5, 7] },
      { id: 7, x: rightCorridorX, y: botLaneY, neighbors: [3, 6] }
    ];

    const skin = SKIN_PALETTES[cfg.skinId] || SKIN_PALETTES.default;
    this.spawnLabWorker(4, skin, 'engineer', 0);

    const internPalettes = [
      { ...skin, coat: skin.style ? skin.coat : 0x38bdf8 },
      { ...skin, coat: skin.style ? skin.coat : 0x34d399 },
      { ...skin, coat: skin.style ? skin.coat : 0xa78bfa }
    ];

    const startNodes = [7, 1, 2];
    for (let i = 0; i < staffCount; i++) {
      this.spawnLabWorker(startNodes[i % startNodes.length], internPalettes[i % internPalettes.length], 'intern', i + 1);
    }

    if (hasRoboHumanoid) {
      const androidPalette = { coat: 0x94a3b8, pants: 0x0f172a, helmet: 0x38bdf8, head: 0xcbd5e1, style: 'robots' };
      this.spawnLabWorker(6, androidPalette, 'android', 9);
    }

    if (hasRoboRover) {
      this.spawnMobileRobot(0, 'rover');
    }

    if (hasRoboDog) {
      this.spawnMobileRobot(5, 'dog');
    }
  }

  pickNextNeighborNode(currentNodeId, prevNodeId) {
    const node = this.navNodes[currentNodeId] || this.navNodes[0];
    const choices = node.neighbors.filter((id) => id !== prevNodeId);
    const pool = choices.length > 0 ? choices : node.neighbors;
    const nextId = pool[Math.floor(Math.random() * pool.length)];
    return this.navNodes[nextId] || node;
  }

  spawnLabWorker(startNodeId, palette, role, seedIdx) {
    const startNode = this.navNodes[startNodeId] || this.navNodes[0];
    const worker = this.add.container(startNode.x, startNode.y).setDepth(6);
    const style = palette.style || 'human';

    const g = this.add.graphics();
    g.fillStyle(palette.pants, 1);
    g.fillRect(-7, -22, 5, 22);
    g.fillRect(2, -22, 5, 22);

    if (style === 'minions') {
      g.fillStyle(0xfacc15, 1);
      g.fillRoundedRect(-10, -56, 20, 36, 9);
      g.fillStyle(0x2563eb, 1);
      g.fillRoundedRect(-10, -38, 20, 18, 4);
      g.fillRect(-7, -45, 3, 8);
      g.fillRect(4, -45, 3, 8);
      g.fillStyle(0x334155, 1);
      g.fillRect(-10, -51, 20, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-3, -49, 4.5);
      g.fillCircle(4, -49, 4.5);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(-3, -49, 2);
      g.fillCircle(4, -49, 2);
    } else {
      g.fillStyle(palette.coat, 1);
      g.fillRoundedRect(-10, -48, 20, 28, 5);

      if (style === 'robots' || role === 'android') {
        g.fillStyle(0xcbd5e1, 1);
        g.fillRoundedRect(-8, -64, 16, 15, 4);
        g.fillStyle(0x38bdf8, 1);
        g.fillRect(-5, -59, 10, 4);
      } else if (style === 'astronaut') {
        g.fillStyle(0xf8fafc, 1);
        g.fillCircle(0, -56, 10);
        g.fillStyle(0x0284c9, 0.85);
        g.fillRoundedRect(-6, -60, 13, 8, 3);
      } else if (style === 'ninja') {
        g.fillStyle(0x18181b, 1);
        g.fillCircle(0, -56, 8);
        g.fillStyle(0xfde68a, 1);
        g.fillRect(-5, -58, 10, 4);
        g.fillStyle(0xef4444, 1);
        g.fillRect(-8, -61, 16, 3);
      } else {
        g.fillStyle(palette.head || 0xfde68a, 1);
        g.fillCircle(0, -56, 8);
        g.fillStyle(palette.helmet, 1);
        g.slice(0, -58, 9, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
        g.fillPath();
      }
    }

    const armColor = style === 'minions' ? 0xfacc15 : palette.coat;
    const handColor = style === 'minions' || style === 'robots' || role === 'android' || style === 'ninja'
      ? 0x1e293b
      : (palette.head || 0xfde68a);

    const leftArm = this.add.graphics();
    leftArm.fillStyle(armColor, 1);
    leftArm.fillRoundedRect(-14, -45, 4, 18, 2);
    leftArm.fillStyle(handColor, 1);
    leftArm.fillCircle(-12, -26, 2.5);

    const rightArm = this.add.graphics();
    rightArm.fillStyle(armColor, 1);
    rightArm.fillRoundedRect(10, -45, 4, 18, 2);
    rightArm.fillStyle(handColor, 1);
    rightArm.fillCircle(12, -26, 2.5);

    if (role === 'intern' && seedIdx % 2 === 1) {
      g.fillStyle(0x92400e, 1);
      g.fillRoundedRect(8, -36, 15, 12, 3);
    }

    worker.add([leftArm, g, rightArm]);

    const nextNode = this.pickNextNeighborNode(startNode.id, -1);
    const actor = {
      sprite: worker,
      leftArm,
      rightArm,
      armPhase: Math.random() * Math.PI * 2,
      role,
      style,
      currentNodeId: startNode.id,
      prevNodeId: -1,
      targetNodeId: nextNode.id,
      targetX: nextNode.x,
      targetY: nextNode.y,
      speed: role === 'intern' ? 32 : role === 'android' ? 28 : 24,
      pauseTimer: 0.4 + seedIdx * 0.35
    };

    const hitZone = this.add.zone(0, -34, 40, 74).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playClick();
      this.particles.emitParticleAt(worker.x, worker.y - 45, 8);

      if (style === 'mario') {
        this.showSpeechBubble(worker, 'ЙА-ХУУ! +1 МОНЕТА! 🍄🪙', 0xef4444);
        const coin = this.add.circle(worker.x, worker.y - 68, 6, 0xfacc15).setStrokeStyle(1.5, 0xb45309).setDepth(32);
        this.tweens.add({
          targets: coin,
          y: worker.y - 104,
          alpha: 0,
          duration: 460,
          onComplete: () => coin.destroy()
        });
        this.tweens.add({
          targets: worker,
          y: worker.y - 26,
          duration: 180,
          yoyo: true,
          ease: 'Quad.easeOut'
        });
      } else if (style === 'minions') {
        const line = MINION_LINES[Math.floor(Math.random() * MINION_LINES.length)];
        this.showSpeechBubble(worker, line, 0xfacc15);
        this.tweens.add({
          targets: worker,
          y: worker.y - 14,
          duration: 110,
          yoyo: true
        });
      } else if (style === 'robots' || role === 'android') {
        const line = ROBOT_SKIN_LINES[Math.floor(Math.random() * ROBOT_SKIN_LINES.length)];
        this.showSpeechBubble(worker, line, 0x38bdf8);
        this.tweens.add({
          targets: worker,
          angle: 12,
          duration: 90,
          yoyo: true,
          repeat: 1
        });
      } else if (style === 'ninja') {
        this.showSpeechBubble(worker, 'ТЕНЬ ГОСТа НЕ ЗНАЕТ ПРОМАХА! ⚔️', 0xef4444);
        this.particles.emitParticleAt(worker.x, worker.y - 30, 18);
        this.tweens.add({
          targets: worker,
          alpha: 0.25,
          duration: 140,
          yoyo: true
        });
      } else if (style === 'astronaut') {
        this.showSpeechBubble(worker, 'Хьюстон, прочность 120 МПа! 🚀', 0x38bdf8);
        this.tweens.add({
          targets: worker,
          y: worker.y - 22,
          duration: 420,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      } else if (role === 'intern') {
        const line = INTERN_LINES[Math.floor(Math.random() * INTERN_LINES.length)];
        this.showSpeechBubble(worker, line, 0x34d399);
        this.tweens.add({
          targets: worker,
          y: worker.y - 10,
          duration: 110,
          yoyo: true
        });
      } else {
        const line = ENGINEER_LINES[Math.floor(Math.random() * ENGINEER_LINES.length)];
        this.showSpeechBubble(worker, line, 0xfacc15);
        this.tweens.add({
          targets: worker,
          y: worker.y - 10,
          duration: 110,
          yoyo: true
        });
      }
    });
    worker.add(hitZone);

    this.staffActors.push(actor);
  }

  spawnMobileRobot(startNodeId, type) {
    const startNode = this.navNodes[startNodeId] || this.navNodes[0];
    const bot = this.add.container(startNode.x, startNode.y).setDepth(6);
    const g = this.add.graphics();

    if (type === 'rover') {
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(-16, -22, 32, 16, 5);
      g.lineStyle(1.5, 0x0f172a, 0.9);
      g.strokeRoundedRect(-16, -22, 32, 16, 5);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(0, -25, 4);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(-10, -4, 5);
      g.fillCircle(10, -4, 5);
    } else {
      g.fillStyle(0xfacc15, 1);
      g.fillRoundedRect(-14, -22, 28, 10, 4);
      g.lineStyle(1.5, 0x0f172a, 0.9);
      g.strokeRoundedRect(-14, -22, 28, 10, 4);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(-11, -12, 4, 12);
      g.fillRect(7, -12, 4, 12);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(10, -25, 7, 5);
    }

    bot.add(g);

    const nextNode = this.pickNextNeighborNode(startNode.id, -1);
    const actor = {
      sprite: bot,
      role: type,
      currentNodeId: startNode.id,
      prevNodeId: -1,
      targetNodeId: nextNode.id,
      targetX: nextNode.x,
      targetY: nextNode.y,
      speed: type === 'rover' ? 38 : 46,
      pauseTimer: 0.3
    };

    const hitZone = this.add.zone(0, -16, 40, 36).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      AudioManager.playLatchSnap();
      this.particles.emitParticleAt(bot.x, bot.y - 20, 10);

      if (type === 'dog') {
        this.showSpeechBubble(bot, 'ГАВ-СКАН! КЕРН ОБНАРУЖЕН 🐕📡', 0xfacc15);
        this.tweens.add({
          targets: bot,
          y: bot.y - 22,
          angle: 360,
          duration: 380,
          ease: 'Back.easeOut',
          onComplete: () => { bot.angle = 0; }
        });
      } else {
        this.showSpeechBubble(bot, 'РОБО-КУРЬЕР: ТУРБО-ДОСТАВКА ⚡', 0x38bdf8);
        actor.pauseTimer = 0;
        actor.speed = 95;
        this.time.delayedCall(1200, () => { actor.speed = 38; });
      }
    });
    bot.add(hitZone);

    this.staffActors.push(actor);
  }

  createMaintenancePanel(w, h) {
    const panelY = h * 0.585;
    const panelW = 340;
    const panelH = 62;
    const startX = w / 2 - panelW / 2;

    if (this.maintContainer) {
      this.maintContainer.destroy();
    }
    this.maintContainer = this.add.container(0, 0);

    const items = [
      { key: 'saw', label: '🪚 Диск пилы', cost: 25 },
      { key: 'grinder', label: '⚙️ Абразив', cost: 25 },
      { key: 'calibration', label: '📐 Поверка', cost: 35 }
    ];

    const colW = (panelW - 12) / 3;
    items.forEach((item, idx) => {
      const x = startX + idx * (colW + 6);
      const pct = Storage.getWear(item.key);
      const isLow = pct < 50;
      const needsService = pct < 100;

      const card = this.add.graphics();
      card.fillStyle(0x14161b, 0.94);
      card.fillRoundedRect(x, panelY, colW, panelH, 8);
      card.lineStyle(1.5, isLow ? 0xf59e0b : 0x475569, 0.9);
      card.strokeRoundedRect(x, panelY, colW, panelH, 8);

      const t1 = this.add.text(x + colW / 2, panelY + 12, item.label, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '10px',
        fontWeight: '700',
        color: '#e2e8f0'
      }).setOrigin(0.5);

      const pctColor = pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171';
      const t2 = this.add.text(x + colW / 2, panelY + 29, `${pct}%`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
        fontWeight: '700',
        color: pctColor
      }).setOrigin(0.5);

      const actionLabel = needsService ? `ТО · ${item.cost} ₽` : 'В НОРМЕ';
      const canPay = needsService && Storage.getMoney() >= item.cost;
      const t3 = this.add.text(x + colW / 2, panelY + 48, actionLabel, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '9px',
        fontWeight: '700',
        color: canPay ? '#0f172a' : '#94a3b8',
        backgroundColor: canPay ? '#facc15' : '#27272a',
        padding: { x: 6, y: 2 }
      }).setOrigin(0.5);

      this.maintContainer.add([card, t1, t2, t3]);

      if (canPay) {
        const zone = this.add.zone(x + colW / 2, panelY + panelH / 2, colW, panelH)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
          if (Storage.spendMoney(item.cost)) {
            Storage.restoreWear(item.key);
            AudioManager.playLatchSnap();
            if (this.moneyTxt) this.moneyTxt.setText(`💰 ${Storage.getMoney()} ₽`);
            this.createMaintenancePanel(w, h);
          }
        });
        this.maintContainer.add(zone);
      }
    });
  }

  createMiniPlayer(w, h, tier) {
    const px = w / 2;
    const py = h * 0.695;
    const pw = 340;
    const ph = 46;

    const container = this.add.container(px, py);
    const bg = this.add.graphics();
    bg.fillStyle(0x14161b, 0.96);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 10);
    bg.lineStyle(2, tier.accent, 0.75);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 10);

    const icon = this.add.text(-pw / 2 + 12, 0, '📻', {
      fontSize: '19px'
    }).setOrigin(0, 0.5);

    const curTrack = AudioManager.getCurrentTrack();
    this.trackTxt = this.add.text(-pw / 2 + 40, -7, curTrack.name, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0, 0.5);

    const defaultSub = 'ТАПНИ ЧТОБЫ СМЕНИТЬ ТРЕК ⏭';
    const subLabel = this.add.text(-pw / 2 + 40, 10, defaultSub, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '9px',
      fontWeight: '600',
      color: '#94a3b8'
    }).setOrigin(0, 0.5);

    this.eqBars = [];
    for (let i = 0; i < 4; i++) {
      const bar = this.add.rectangle(pw / 2 - 90 + i * 6, 12, 4, 16, tier.accent)
        .setOrigin(0.5, 1);
      this.eqBars.push(bar);
    }

    const nextZone = this.add.zone(-30, 0, pw - 74, ph).setInteractive({ useHandCursor: true });
    nextZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      const next = AudioManager.nextTrack();
      this.trackTxt.setText(next.name);
      this.tweens.add({
        targets: container,
        scaleX: 0.98,
        scaleY: 0.98,
        duration: 60,
        yoyo: true
      });
    });

    const modeW = 56;
    const modeH = 32;
    const modeX = pw / 2 - 34;
    const modeBtnContainer = this.add.container(modeX, 0);
    const modeBg = this.add.graphics();
    const modeLabel = this.add.text(0, 0, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px',
      fontWeight: '700',
      align: 'center'
    }).setOrigin(0.5);

    const drawModeBtn = (mode) => {
      const isLoop = mode === 'loop';
      modeBg.clear();
      modeBg.fillStyle(isLoop ? 0xfacc15 : 0x0284c9, 1);
      modeBg.fillRoundedRect(-modeW / 2, -modeH / 2, modeW, modeH, 7);
      modeBg.lineStyle(1.5, 0xffffff, 0.45);
      modeBg.strokeRoundedRect(-modeW / 2, -modeH / 2, modeW, modeH, 7);
      modeLabel.setText(isLoop ? '🔂\n1 ТРЕК' : '🔁\nВСЕ ↻');
      modeLabel.setColor(isLoop ? '#0f172a' : '#ffffff');
    };

    drawModeBtn(AudioManager.getPlayMode());
    modeBtnContainer.add([modeBg, modeLabel]);

    const modeZone = this.add.zone(modeX, 0, modeW + 6, ph).setInteractive({ useHandCursor: true });
    modeZone.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      const newMode = AudioManager.togglePlayMode();
      drawModeBtn(newMode);

      this.tweens.add({
        targets: modeBtnContainer,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 65,
        yoyo: true
      });

      subLabel.setText(newMode === 'loop' ? 'РЕЖИМ: ПОВТОР ОДНОГО ТРЕКА' : 'РЕЖИМ: ВСЕ ТРЕКИ ПО КРУГУ');
      subLabel.setColor(newMode === 'loop' ? '#facc15' : '#38bdf8');
      this.time.delayedCall(1400, () => {
        if (subLabel && subLabel.active) {
          subLabel.setText(defaultSub);
          subLabel.setColor('#94a3b8');
        }
      });
    });

    container.add([bg, icon, this.trackTxt, subLabel, ...this.eqBars, nextZone, modeBtnContainer, modeZone]);
  }

  update(time, delta) {
    const dt = delta / 1000;

    for (const actor of this.staffActors) {
      if (actor.sprite.activeBubble) {
        actor.sprite.activeBubble.setPosition(actor.sprite.x, actor.sprite.y - 74);
      }

      if (actor.pauseTimer > 0) {
        actor.pauseTimer -= dt;
        if (actor.leftArm && actor.rightArm) {
          actor.leftArm.y = 0;
          actor.rightArm.y = 0;
        }
        continue;
      }

      const dx = actor.targetX - actor.sprite.x;
      const dy = actor.targetY - actor.sprite.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        if (Math.random() < 0.35) {
          this.particles.emitParticleAt(actor.sprite.x, actor.sprite.y - 26, 3);
        }
        const prevId = actor.currentNodeId;
        actor.currentNodeId = actor.targetNodeId;
        const nextNode = this.pickNextNeighborNode(actor.currentNodeId, prevId);
        actor.targetNodeId = nextNode.id;
        actor.targetX = nextNode.x;
        actor.targetY = nextNode.y;
        actor.pauseTimer = 0.7 + Math.random() * 1.4;
        continue;
      }

      const step = Math.min(dist, actor.speed * dt);
      actor.sprite.x += (dx / dist) * step;
      actor.sprite.y += (dy / dist) * step;
      if (Math.abs(dx) > 1) {
        actor.sprite.scaleX = dx >= 0 ? 1 : -1;
      }
      if (actor.leftArm && actor.rightArm) {
        actor.armPhase += dt * 10;
        actor.leftArm.y = Math.sin(actor.armPhase) * 2.2;
        actor.rightArm.y = -Math.sin(actor.armPhase) * 2.2;
      }
      actor.sprite.setDepth(actor.sprite.y <= 318 ? 7 : 12);
    }

    if (!this.eqBars.length) return;
    this.eqTimer += delta;
    if (this.eqTimer >= 130) {
      this.eqTimer = 0;
      const active = Storage.isSoundEnabled();
      this.eqBars.forEach((bar) => {
        bar.height = active ? 4 + Math.random() * 14 : 3;
      });
      if (this.trackTxt) {
        const currentName = AudioManager.getCurrentTrack().name;
        if (this.trackTxt.text !== currentName) {
          this.trackTxt.setText(currentName);
        }
      }
    }
  }

  createActionButton(x, y, w, h, label, bgColor, textColor, onClick, fontSize = 17) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    let isPressed = false;

    const drawBtn = (pressed = false) => {
      bg.clear();
      const offsetY = pressed ? 3 : 0;
      bg.fillStyle(0x000000, 0.45);
      bg.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 12);
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2 + offsetY, w, h, 12);
      bg.lineStyle(2, 0xffffff, 0.25);
      bg.strokeRoundedRect(-w / 2, -h / 2 + offsetY, w, h, 12);
    };

    drawBtn(false);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: `${fontSize}px`,
      fontWeight: '700',
      color: Phaser.Display.Color.IntegerToColor(textColor).rgba
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      if (this.showcaseModalOpen || performance.now() < this.inputGuardUntil) return;
      isPressed = true;
      drawBtn(true);
      txt.y = 3;
    });
    container.on('pointerup', () => {
      if (!isPressed) return;
      isPressed = false;
      drawBtn(false);
      txt.y = 0;
      onClick();
    });
    container.on('pointerout', () => {
      isPressed = false;
      drawBtn(false);
      txt.y = 0;
    });

    return container;
  }
}
