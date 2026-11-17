import { Storage } from '../utils/Storage.js';
import { AudioManager, MUSIC_PACK_CATALOG } from '../utils/AudioManager.js';
import { PlatformSDK } from '../utils/PlatformSDK.js';
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
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);

    const header = this.add.graphics();
    header.fillStyle(0x141210, 1);
    header.fillRect(0, 0, width, 58);

    const backBtn = this.add.text(18, 16, '← В ЛАБУ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#292524',
      padding: { x: 10, y: 6 }
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });

    this.balanceTxt = this.add.text(width - 18, 19, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0);

    this.listContainer = this.add.container(0, 0);
    this.refreshUI();
  }

  refreshUI() {
    this.listContainer.removeAll(true);
    const { width } = this.scale;
    const money = Storage.getMoney();
    const rep = Storage.getReputation();
    const labLvl = Storage.getLabLevel();

    this.balanceTxt.setText(`💰 ${money} ₽  ★ ${rep}`);

    const nextLab = LAB_UPGRADES.find((l) => l.level === labLvl + 1);
    const labCard = this.add.graphics();
    labCard.fillStyle(0x292524, 1);
    labCard.fillRoundedRect(18, 64, width - 36, 80, 12);
    labCard.lineStyle(2, 0x38bdf8, 0.85);
    labCard.strokeRoundedRect(18, 64, width - 36, 80, 12);
    this.listContainer.add(labCard);

    if (nextLab) {
      const canBuyLab = money >= nextLab.cost && rep >= nextLab.reqRep;
      const t1 = this.add.text(30, 72, `ЛАБОРАТОРИЯ → Ур. ${nextLab.level}: ${nextLab.name}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#38bdf8'
      });
      const buyLabBtn = this.add.text(
        width - 30,
        120,
        `РАСШИРИТЬ: ${nextLab.cost} ₽ (нужно ★${nextLab.reqRep})`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px',
          fontWeight: '700',
          color: canBuyLab ? '#0f172a' : '#a8a29e',
          backgroundColor: canBuyLab ? '#38bdf8' : '#44403c',
          padding: { x: 10, y: 6 }
        }
      ).setOrigin(1, 0.5).setInteractive({ useHandCursor: canBuyLab });

      if (canBuyLab) {
        buyLabBtn.on('pointerdown', () => {
          if (Storage.spendMoney(nextLab.cost)) {
            Storage.setLabLevel(nextLab.level);
            AudioManager.playStamp();
            this.refreshUI();
          }
        });
      }
      this.listContainer.add([t1, buyLabBtn]);
    } else {
      const maxTxt = this.add.text(width / 2, 104, '🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ ЛАБОРАТОРИИ (Ур. 5)', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);
      this.listContainer.add(maxTxt);
    }

    const tabY = 162;
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

      btn.on('pointerdown', () => {
        if (!isSelected) {
          AudioManager.playClick();
          this.activeTab = tabKey;
          this.refreshUI();
        }
      });
      this.listContainer.add(btn);
    };

    makeTab(0, '🧪 СТЕНДЫ', 'tests');
    makeTab(1, '⚙️ СТАНКИ', 'tools');
    makeTab(2, '🏢 ЦЕХ', 'perks');
    makeTab(3, '🎨 ДЕКОР', 'decor');
    makeTab(4, '📻 МУЗЫКА', 'music');

    if (this.activeTab === 'tests') {
      TEST_UPGRADES.forEach((item, idx) => {
        const y = 186 + idx * 96;
        const unlocked = Storage.isTestUnlocked(item.key);
        const labOk = labLvl >= item.reqLab;
        const canBuy = !unlocked && labOk && money >= item.cost;

        let btnText = `КУПИТЬ · ${item.cost} ₽`;
        if (unlocked) btnText = '✅ АКТИВЕН';
        else if (!labOk) btnText = `НУЖНА ЛАБА Ур. ${item.reqLab}`;

        this.renderItemCard(
          y,
          item.name,
          item.desc,
          unlocked,
          item.cost,
          canBuy,
          () => {
            if (Storage.spendMoney(item.cost)) {
              Storage.unlockTest(item.key);
              AudioManager.playStamp();
              this.refreshUI();
            }
          },
          88,
          btnText,
          item.key
        );
      });
    } else if (this.activeTab === 'tools') {
      TOOL_UPGRADES.forEach((tool, idx) => {
        const y = 186 + idx * 84;
        const lvl = Storage.getUpgradeLevel(tool.key);
        const isMax = lvl >= tool.maxLevel;
        const cost = getToolCost(tool, lvl);
        const canBuy = !isMax && money >= cost;

        const titleStr = `${tool.name} [Ур. ${lvl}/${tool.maxLevel}]`;
        const btnLabel = isMax ? 'МАКС.' : `УЛУЧШИТЬ · ${cost} ₽`;

        this.renderItemCard(
          y,
          titleStr,
          tool.desc,
          isMax,
          cost,
          canBuy,
          () => {
            if (Storage.spendMoney(cost)) {
              Storage.upgradeTool(tool.key);
              AudioManager.playLatchSnap();
              this.refreshUI();
            }
          },
          77,
          btnLabel
        );
      });
    } else if (this.activeTab === 'perks') {
      PERK_UPGRADES.forEach((perk, idx) => {
        const y = 186 + idx * 112;
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
          if (Storage.spendMoney(cost)) {
            Storage.upgradePerk(perk.key);
            AudioManager.playStamp();
            this.refreshUI();
          }
        }, 102, customBtn);
      });
    } else if (this.activeTab === 'decor') {
      DECOR_ITEMS.forEach((item, idx) => {
        const y = 186 + idx * 84;
        const owned = Storage.hasDecor(item.key);
        const isEquippedSkin = item.isSkin && Storage.getActiveSkin() === item.skinId;
        const canBuy = !owned && money >= item.cost;

        let btnLabel = `КУПИТЬ · ${item.cost} ₽`;
        if (owned) {
          if (item.isSkin) {
            btnLabel = isEquippedSkin ? '👕 НАДЕТО' : 'ОДЕТЬ';
          } else {
            btnLabel = '✅ УСТАНОВЛЕНО';
          }
        }

        this.renderItemCard(
          y,
          `${item.icon} ${item.name}`,
          item.desc,
          owned,
          item.cost,
          canBuy || (owned && item.isSkin && !isEquippedSkin),
          () => {
            if (!owned) {
              if (Storage.spendMoney(item.cost)) {
                Storage.buyDecor(item.key);
                if (item.isSkin) Storage.setActiveSkin(item.skinId);
                AudioManager.playStamp();
                this.refreshUI();
              }
            } else if (item.isSkin) {
              Storage.setActiveSkin(item.skinId);
              AudioManager.playLatchSnap();
              this.refreshUI();
            }
          },
          77,
          btnLabel
        );
      });
    } else if (this.activeTab === 'music') {
      MUSIC_PACK_CATALOG.forEach((pack, idx) => {
        const y = 186 + idx * 98;
        const unlocked = Storage.isMusicPackUnlocked(pack.id);
        this.renderMusicPackCard(y, pack, unlocked, money);
      });
    }
  }

  renderMusicPackCard(y, pack, unlocked, money) {
    const { width } = this.scale;
    const cardH = 90;
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
        isEnabled ? '🟢 ИГРАЕТ В ПЛЕЙЛИСТЕ' : '⚪ ОТКЛЮЧЕН ИЗ РОТАЦИИ',
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
        isEnabled ? 'ВКЛ 🟢' : 'ВЫКЛ ⚫',
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px',
          fontWeight: '700',
          color: isEnabled ? '#0f172a' : '#e2e8f0',
          backgroundColor: isEnabled ? '#4ade80' : '#44403c',
          padding: { x: 12, y: 5 }
        }
      ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

      toggleBtn.on('pointerdown', () => {
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

      adBtn.on('pointerdown', () => {
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
        coinBtn.on('pointerdown', () => {
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

      infoBtn.on('pointerdown', () => {
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
      btn.on('pointerdown', onBuy);
    }

    this.listContainer.add([card, title, desc, btn]);
  }
}
