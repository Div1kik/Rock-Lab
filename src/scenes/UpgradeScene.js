import { Storage } from '../utils/Storage.js';
import { AudioManager, MUSIC_PACK_CATALOG } from '../utils/AudioManager.js';
import { PlatformSDK } from '../utils/PlatformSDK.js';
import { generateContract } from '../data/contracts.js';
import {
  TOOL_UPGRADES,
  PERK_UPGRADES,
  DECOR_ITEMS,
  TEST_UPGRADES,
  LAB_UPGRADES,
  getToolCost,
  getPerkCost
} from '../data/upgrades.js';

export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
    this.activeTab = 'tests';
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.wasDragging = false;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);

    const header = this.add.graphics().setDepth(20);
    header.fillStyle(0x141210, 1);
    header.fillRect(0, 0, width, 58);

    const backBtn = this.add.text(18, 16, '← В ЛАБУ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#292524',
      padding: { x: 10, y: 6 }
    }).setDepth(21).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });

    this.balanceTxt = this.add.text(width - 18, 19, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0).setDepth(21);

    this.topFixedContainer = this.add.container(0, 0).setDepth(15);
    this.listContainer = this.add.container(0, 0).setDepth(5);

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 224, width, height - 224);
    this.listContainer.setMask(maskShape.createGeometryMask());

    this.setupScrollInput();
    this.refreshUI();
  }

  setupScrollInput() {
    let dragStartY = 0;
    let startOffset = 0;
    let isDragging = false;

    this.input.on('pointerdown', (ptr) => {
      this.wasDragging = false;
      if (ptr.y >= 224) {
        isDragging = true;
        dragStartY = ptr.y;
        startOffset = this.scrollOffset;
      }
    });

    this.input.on('pointermove', (ptr) => {
      if (!isDragging || this.maxScroll <= 0) return;
      const dy = ptr.y - dragStartY;
      if (Math.abs(dy) > 8) {
        this.wasDragging = true;
      }
      this.scrollOffset = Phaser.Math.Clamp(startOffset + dy, -this.maxScroll, 0);
      this.listContainer.y = this.scrollOffset;
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    this.input.on('wheel', (_ptr, _objs, _dx, dy) => {
      if (this.maxScroll <= 0) return;
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset - dy * 0.5, -this.maxScroll, 0);
      this.listContainer.y = this.scrollOffset;
    });
  }

  refreshUI() {
    this.topFixedContainer.removeAll(true);
    this.listContainer.removeAll(true);
    this.scrollOffset = 0;
    this.listContainer.y = 0;

    const { width, height } = this.scale;
    const money = Storage.getMoney();
    const rep = Storage.getReputation();
    const labLvl = Storage.getLabLevel();
    const staffLvl = Storage.getPerkLevel('assistant');

    this.balanceTxt.setText(`💰 ${money} ₽  ★ ${rep}`);

    const topBg = this.add.graphics();
    topBg.fillStyle(0x1c1917, 1);
    topBg.fillRect(0, 58, width, 166);
    this.topFixedContainer.add(topBg);

    const nextLab = LAB_UPGRADES.find((l) => l.level === labLvl + 1);
    const labCard = this.add.graphics();
    labCard.fillStyle(0x292524, 1);
    labCard.fillRoundedRect(18, 62, width - 36, 62, 10);
    labCard.lineStyle(2, 0x38bdf8, 0.85);
    labCard.strokeRoundedRect(18, 62, width - 36, 62, 10);
    this.topFixedContainer.add(labCard);

    if (nextLab) {
      const canBuyLab = money >= nextLab.cost && rep >= nextLab.reqRep;
      const t1 = this.add.text(28, 70, `ЛАБОРАТОРИЯ → Ур. ${nextLab.level}: ${nextLab.name}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#38bdf8'
      });
      const buyLabBtn = this.add.text(
        width - 28,
        104,
        `РАСШИРИТЬ: ${nextLab.cost} ₽ (★${nextLab.reqRep})`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          fontWeight: '700',
          color: canBuyLab ? '#0f172a' : '#a8a29e',
          backgroundColor: canBuyLab ? '#38bdf8' : '#44403c',
          padding: { x: 9, y: 5 }
        }
      ).setOrigin(1, 0.5).setInteractive({ useHandCursor: canBuyLab });

      if (canBuyLab) {
        buyLabBtn.on('pointerup', () => {
          if (Storage.spendMoney(nextLab.cost)) {
            Storage.setLabLevel(nextLab.level);
            AudioManager.playStamp();
            this.refreshUI();
          }
        });
      }
      this.topFixedContainer.add([t1, buyLabBtn]);
    } else {
      const maxTxt = this.add.text(width / 2, 93, '🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ ЛАБОРАТОРИИ (Ур. 5)', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);
      this.topFixedContainer.add(maxTxt);
    }

    const adBanner = this.add.graphics();
    adBanner.fillStyle(0x1e293b, 1);
    adBanner.fillRoundedRect(18, 130, width - 36, 46, 10);
    adBanner.lineStyle(1.5, 0xfacc15, 0.85);
    adBanner.strokeRoundedRect(18, 130, width - 36, 46, 10);

    const adTitle = this.add.text(28, 144, '🎬 СРОЧНЫЙ ТЕНДЕР (×2.5 ОПЛАТА)', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef08a'
    }).setOrigin(0, 0.5);

    const adSub = this.add.text(28, 162, 'Редкий шанс выбить декор или муз-пак!', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '9px',
      color: '#94a3b8'
    }).setOrigin(0, 0.5);

    const adActionBtn = this.add.text(width - 28, 153, 'СМОТРЕТЬ 🎬', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#facc15',
      padding: { x: 10, y: 6 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    adActionBtn.on('pointerup', () => {
      adActionBtn.disableInteractive();
      PlatformSDK.showRewarded(() => {
        this.handleTenderAdReward();
      });
    });

    this.topFixedContainer.add([adBanner, adTitle, adSub, adActionBtn]);

    const tabY = 198;
    const gap = 4;
    const tabW = (width - 36 - gap * 4) / 5;

    const makeTab = (idx, label, tabKey) => {
      const x = 18 + tabW / 2 + idx * (tabW + gap);
      const isSelected = this.activeTab === tabKey;
      const btn = this.add.text(x, tabY, label, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '10px',
        fontWeight: '700',
        color: isSelected ? '#1c1917' : '#e7e5e4',
        backgroundColor: isSelected ? '#facc15' : '#292524',
        padding: { x: 2, y: 7 },
        fixedWidth: tabW,
        align: 'center'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerup', () => {
        if (!isSelected) {
          AudioManager.playClick();
          this.activeTab = tabKey;
          this.refreshUI();
        }
      });
      this.topFixedContainer.add(btn);
    };

    makeTab(0, '🧪 СТЕНДЫ', 'tests');
    makeTab(1, '⚙️ СТАНКИ', 'tools');
    makeTab(2, '🏢 ЦЕХ', 'perks');
    makeTab(3, '🎨 ДЕКОР', 'decor');
    makeTab(4, '📻 МУЗЫКА', 'music');

    const startY = 230;
    let totalContentH = 0;

    if (this.activeTab === 'tests') {
      TEST_UPGRADES.forEach((item, idx) => {
        const y = startY + idx * 94;
        const unlocked = Storage.isTestUnlocked(item.key);
        const labOk = labLvl >= item.reqLab;
        const staffOk = !item.reqStaff || staffLvl >= item.reqStaff;
        const canBuy = !unlocked && labOk && staffOk && money >= item.cost;

        let btnText = `КУПИТЬ · ${item.cost} ₽`;
        if (unlocked) btnText = '✅ АКТИВЕН';
        else if (!labOk) btnText = `НУЖНА ЛАБА Ур. ${item.reqLab}`;
        else if (!staffOk) btnText = `НУЖЕН СТАЖЁР (Ур. ${item.reqStaff}+)`;

        this.renderItemCard(
          y,
          item.name,
          item.desc,
          unlocked,
          item.cost,
          canBuy,
          () => {
            if (this.wasDragging) return;
            if (Storage.spendMoney(item.cost)) {
              Storage.unlockTest(item.key);
              AudioManager.playStamp();
              this.refreshUI();
            }
          },
          86,
          btnText,
          item.key
        );
      });
      totalContentH = TEST_UPGRADES.length * 94 + 20;
    } else if (this.activeTab === 'tools') {
      TOOL_UPGRADES.forEach((tool, idx) => {
        const y = startY + idx * 82;
        const lvl = Storage.getUpgradeLevel(tool.key);
        const isMax = lvl >= tool.maxLevel;
        const cost = getToolCost(tool, lvl);
        const canBuy = !isMax && money >= cost;

        const titleStr = tool.isSingleModule
          ? `${tool.name} [${isMax ? 'УСТАНОВЛЕНО' : 'МОДУЛЬ'}]`
          : `${tool.name} [Ур. ${lvl}/${tool.maxLevel}]`;
        const btnLabel = isMax ? (tool.isSingleModule ? '✅ КУПЛЕНО' : 'МАКС.') : `КУПИТЬ · ${cost} ₽`;

        this.renderItemCard(
          y,
          titleStr,
          tool.desc,
          isMax,
          cost,
          canBuy,
          () => {
            if (this.wasDragging) return;
            if (Storage.spendMoney(cost)) {
              Storage.upgradeTool(tool.key);
              AudioManager.playLatchSnap();
              this.refreshUI();
            }
          },
          75,
          btnLabel
        );
      });
      totalContentH = TOOL_UPGRADES.length * 82 + 20;
    } else if (this.activeTab === 'perks') {
      PERK_UPGRADES.forEach((perk, idx) => {
        const y = startY + idx * 106;
        const lvl = Storage.getPerkLevel(perk.key);
        const isMax = lvl >= perk.maxLevel;
        const reqLab = perk.reqLab || 1;
        const labOk = labLvl >= reqLab;
        const cost = getPerkCost(perk, lvl);
        const canBuy = !isMax && labOk && money >= cost;

        let customBtn = null;
        if (!labOk && !isMax) {
          customBtn = `НУЖНА ЛАБА Ур. ${reqLab}`;
        }

        this.renderItemCard(y, `${perk.name} [Ур. ${lvl}/${perk.maxLevel}]`, perk.desc, isMax, cost, canBuy, () => {
          if (this.wasDragging) return;
          if (Storage.spendMoney(cost)) {
            Storage.upgradePerk(perk.key);
            AudioManager.playStamp();
            this.refreshUI();
          }
        }, 98, customBtn);
      });
      totalContentH = PERK_UPGRADES.length * 106 + 20;
    } else if (this.activeTab === 'decor') {
      DECOR_ITEMS.forEach((item, idx) => {
        const y = startY + idx * 56;
        const owned = Storage.hasDecor(item.key);
        const canBuy = !owned && money >= item.cost;

        let isToggleOn = false;
        let btnLabel = `${item.cost} ₽`;

        if (owned) {
          if (item.isSkin) {
            isToggleOn = Storage.getActiveSkin() === item.skinId;
          } else if (item.isLabTheme) {
            isToggleOn = Storage.getActiveLabTheme() === item.themeId;
          } else {
            isToggleOn = Storage.isDecorActive(item.key);
          }
          btnLabel = isToggleOn ? 'ВКЛ 🟢' : 'ВЫКЛ → ВКЛ';
        }

        this.renderCompactDecorCard(
          y,
          `${item.icon} ${item.name}`,
          item.desc,
          owned,
          isToggleOn,
          canBuy || owned,
          () => {
            if (this.wasDragging) return;
            if (!owned) {
              if (Storage.spendMoney(item.cost)) {
                Storage.buyDecor(item.key);
                if (item.isSkin) Storage.setActiveSkin(item.skinId);
                if (item.isLabTheme) Storage.setActiveLabTheme(item.themeId);
                AudioManager.playStamp();
                this.refreshUI();
              }
            } else if (item.isSkin) {
              Storage.setActiveSkin(isToggleOn ? 'default' : item.skinId);
              AudioManager.playLatchSnap();
              this.refreshUI();
            } else if (item.isLabTheme) {
              Storage.setActiveLabTheme(isToggleOn ? 'default' : item.themeId);
              AudioManager.playLatchSnap();
              this.refreshUI();
            } else {
              Storage.toggleDecorActive(item.key);
              AudioManager.playLatchSnap();
              this.refreshUI();
            }
          },
          btnLabel
        );
      });
      totalContentH = DECOR_ITEMS.length * 56 + 24;
    } else if (this.activeTab === 'music') {
      MUSIC_PACK_CATALOG.forEach((pack, idx) => {
        const y = startY + idx * 96;
        const unlocked = Storage.isMusicPackUnlocked(pack.id);
        this.renderMusicPackCard(y, pack, unlocked, money);
      });
      totalContentH = MUSIC_PACK_CATALOG.length * 96 + 24;
    }

    const visibleH = height - startY;
    this.maxScroll = Math.max(0, totalContentH - visibleH + 20);
  }

  handleTenderAdReward() {
    const roll = Math.random();
    const lockedPacks = MUSIC_PACK_CATALOG.filter((p) => !Storage.isMusicPackUnlocked(p.id));
    const lockedDecor = DECOR_ITEMS.filter((d) => !Storage.hasDecor(d.key));

    if (roll < 0.05 && lockedPacks.length > 0) {
      const wonPack = lockedPacks[Math.floor(Math.random() * lockedPacks.length)];
      Storage.unlockMusicPack(wonPack.id);
      AudioManager.activatePackFirstTrack(wonPack.id);
      AudioManager.playStamp();
      this.showAdPrizeModal('🎶 ДЖЕКПОТ! МУЗЫКАЛЬНЫЙ ПАК!', `${wonPack.icon} ${wonPack.name}\n\nСборник разблокирован и добавлен в плеер!`, false);
      return;
    }

    if (roll < 0.15 && lockedDecor.length > 0) {
      const wonDecor = lockedDecor[Math.floor(Math.random() * lockedDecor.length)];
      Storage.buyDecor(wonDecor.key);
      if (wonDecor.isSkin) Storage.setActiveSkin(wonDecor.skinId);
      if (wonDecor.isLabTheme) Storage.setActiveLabTheme(wonDecor.themeId);
      AudioManager.playStamp();
      this.showAdPrizeModal('🎁 РЕДКАЯ ПОСТАВКА ДЕКОРА!', `${wonDecor.icon} ${wonDecor.name}\n\nПредмет бесплатно установлен в вашу лабораторию!`, false);
      return;
    }

    const labLvl = Storage.getLabLevel();
    const completed = Storage.getState().completedContracts || 0;
    const tender = generateContract(labLvl, completed, true, 2.5);
    Storage.setPendingTender(tender);
    AudioManager.playStamp();
    this.showAdPrizeModal(
      '🔥 ПОЛУЧЕН СРОЧНЫЙ ГОСТЕНДЕР!',
      `${tender.title}\nГонорар: +${tender.reward} ₽ · ★+${tender.repReward}\n\nТендер ждёт вас первым на доске заказов (одноразовый)!`,
      true
    );
  }

  showAdPrizeModal(titleText, bodyText, goToBoard = false) {
    const { width, height } = this.scale;
    const modal = this.add.container(0, 0).setDepth(50);

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dim = this.add.graphics();
    dim.fillStyle(0x090d16, 0.92);
    dim.fillRect(0, 0, width, height);

    const cardW = 350;
    const cardH = 260;
    const cx = width / 2;
    const cy = height / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    panel.lineStyle(3, 0xfacc15, 1);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);

    const t1 = this.add.text(cx, cy - 88, titleText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15',
      align: 'center'
    }).setOrigin(0.5);

    const t2 = this.add.text(cx, cy - 12, bodyText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#f8fafc',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: cardW - 40 }
    }).setOrigin(0.5);

    const okBtn = this.add.text(cx, cy + 84, goToBoard ? 'ПЕРЕЙТИ К ТЕНДЕРУ →' : 'ОТЛИЧНО!', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#facc15',
      padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    okBtn.on('pointerup', () => {
      AudioManager.playClick();
      modal.destroy();
      if (goToBoard) {
        this.scene.start('ContractsScene');
      } else {
        this.refreshUI();
      }
    });

    modal.add([blocker, dim, panel, t1, t2, okBtn]);
  }

  renderCompactDecorCard(y, titleStr, descStr, owned, isToggleOn, canClick, onClick, btnLabel) {
    const { width } = this.scale;
    const cardH = 50;
    const card = this.add.graphics();
    card.fillStyle(0x292524, 1);
    card.fillRoundedRect(18, y, width - 36, cardH, 8);
    card.lineStyle(1.5, owned ? (isToggleOn ? 0x22c55e : 0x64748b) : 0x57534e, 0.9);
    card.strokeRoundedRect(18, y, width - 36, cardH, 8);

    const title = this.add.text(28, y + 15, titleStr, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0, 0.5);

    const desc = this.add.text(28, y + 34, descStr, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '9px',
      color: '#a8a29e'
    }).setOrigin(0, 0.5);

    const btnBg = owned ? (isToggleOn ? '#4ade80' : '#475569') : (canClick ? '#d97706' : '#44403c');
    const btnColor = owned ? (isToggleOn ? '#0f172a' : '#f8fafc') : (canClick ? '#ffffff' : '#a8a29e');

    const btn = this.add.text(width - 28, y + cardH / 2, btnLabel, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      fontWeight: '700',
      color: btnColor,
      backgroundColor: btnBg,
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: canClick });

    if (canClick) {
      btn.on('pointerup', onClick);
    }

    this.listContainer.add([card, title, desc, btn]);
  }

  renderMusicPackCard(y, pack, unlocked, money) {
    const { width } = this.scale;
    const cardH = 88;
    const isAdPack = Boolean(pack.reqAds);
    const isEnabled = Storage.isMusicPackEnabled(pack.id);

    const card = this.add.graphics();
    card.fillStyle(0x292524, 1);
    card.fillRoundedRect(18, y, width - 36, cardH, 10);
    card.lineStyle(2, unlocked ? (isEnabled ? 0x22c55e : 0x64748b) : isAdPack ? 0x38bdf8 : 0xf59e0b, 0.85);
    card.strokeRoundedRect(18, y, width - 36, cardH, 10);

    const title = this.add.text(30, y + 8, `${pack.icon} ${pack.name}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#fef3c7'
    });

    const desc = this.add.text(30, y + 25, pack.desc, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '10px',
      color: '#a8a29e',
      wordWrap: { width: width - 64 }
    });

    this.listContainer.add([card, title, desc]);

    if (unlocked) {
      const statusTxt = this.add.text(
        30,
        y + cardH - 16,
        isEnabled ? '🟢 ИГРАЕТ В ПЛЕЙЛИСТЕ' : '⚪ ВЫКЛЮЧЕН ИЗ РОТАЦИИ',
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          fontWeight: '700',
          color: isEnabled ? '#4ade80' : '#94a3b8'
        }
      ).setOrigin(0, 0.5);

      const toggleBtn = this.add.text(
        width - 30,
        y + cardH - 16,
        isEnabled ? 'ВКЛ 🟢' : 'ВЫКЛ → ВКЛ',
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px',
          fontWeight: '700',
          color: isEnabled ? '#0f172a' : '#f8fafc',
          backgroundColor: isEnabled ? '#4ade80' : '#475569',
          padding: { x: 11, y: 5 }
        }
      ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      toggleBtn.on('pointerup', () => {
        if (this.wasDragging) return;
        const nowOn = Storage.toggleMusicPackEnabled(pack.id);
        AudioManager.playLatchSnap();
        if (nowOn) {
          AudioManager.activatePackFirstTrack(pack.id);
        }
        this.refreshUI();
      });

      this.listContainer.add([statusTxt, toggleBtn]);
    } else if (isAdPack) {
      const watched = Storage.getMusicPackAds(pack.id);
      const tagTxt = this.add.text(30, y + cardH - 16, `📺 ПРОМО · ПРОГРЕСС ${watched}/${pack.reqAds}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#7dd3fc'
      }).setOrigin(0, 0.5);

      const adBtn = this.add.text(width - 30, y + cardH - 16, `🎬 СМОТРЕТЬ (${watched}/${pack.reqAds})`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: '700',
        color: '#0f172a',
        backgroundColor: '#facc15',
        padding: { x: 10, y: 5 }
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      adBtn.on('pointerup', () => {
        if (this.wasDragging) return;
        adBtn.disableInteractive();
        PlatformSDK.showRewarded(() => {
          const totalWatched = Storage.incrementMusicPackAds(pack.id);
          if (totalWatched >= pack.reqAds) {
            Storage.unlockMusicPack(pack.id);
            AudioManager.activatePackFirstTrack(pack.id);
          } else {
            AudioManager.playLatchSnap();
          }
          this.refreshUI();
        });
      });

      this.listContainer.add([tagTxt, adBtn]);
    } else {
      const canBuyCoins = money >= pack.price;
      const tagTxt = this.add.text(30, y + cardH - 16, '💿 ПРЕМИУМ · 5 ТРЕКОВ', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#fde68a'
      }).setOrigin(0, 0.5);

      const coinBtn = this.add.text(width - 30, y + cardH - 16, `КУПИТЬ · ${pack.price} ₽`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: '700',
        color: canBuyCoins ? '#ffffff' : '#a8a29e',
        backgroundColor: canBuyCoins ? '#d97706' : '#44403c',
        padding: { x: 12, y: 5 }
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: canBuyCoins });

      if (canBuyCoins) {
        coinBtn.on('pointerup', () => {
          if (this.wasDragging) return;
          if (Storage.spendMoney(pack.price)) {
            Storage.unlockMusicPack(pack.id);
            AudioManager.activatePackFirstTrack(pack.id);
            this.refreshUI();
          }
        });
      }

      this.listContainer.add([tagTxt, coinBtn]);
    }
  }

  renderItemCard(y, titleStr, descStr, isMax, cost, canBuy, onBuy, cardH = 88, customBtnLabel = null, guideKey = null) {
    const { width } = this.scale;
    const card = this.add.graphics();
    card.fillStyle(0x292524, 1);
    card.fillRoundedRect(18, y, width - 36, cardH, 10);
    card.lineStyle(2, isMax ? 0x22c55e : 0x57534e, 0.9);
    card.strokeRoundedRect(18, y, width - 36, cardH, 10);

    const title = this.add.text(30, y + 8, titleStr, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#fef3c7'
    });

    const desc = this.add.text(30, y + 25, descStr, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '10px',
      color: '#a8a29e',
      wordWrap: { width: width - 64 }
    });

    if (guideKey) {
      const infoBtn = this.add.text(30, y + cardH - 16, '? ГОСТ', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: '700',
        color: '#38bdf8',
        backgroundColor: '#0f172a',
        padding: { x: 8, y: 4 }
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

      infoBtn.on('pointerup', () => {
        if (this.wasDragging) return;
        AudioManager.playClick();
        this.scene.start('GuideScene', { returnScene: 'UpgradeScene', guideKey });
      });
      this.listContainer.add(infoBtn);
    }

    const btnLabel = customBtnLabel || (isMax ? 'МАКС.' : `КУПИТЬ · ${cost} ₽`);
    const btn = this.add.text(width - 30, y + cardH - 16, btnLabel, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: canBuy ? '#ffffff' : isMax ? '#4ade80' : '#a8a29e',
      backgroundColor: canBuy ? '#d97706' : '#44403c',
      padding: { x: 10, y: 4 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: canBuy });

    if (canBuy) {
      btn.on('pointerup', onBuy);
    }

    this.listContainer.add([card, title, desc, btn]);
  }
}
