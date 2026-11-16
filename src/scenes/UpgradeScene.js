import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import {
  TOOL_UPGRADES,
  PERK_UPGRADES,
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
    labCard.fillRoundedRect(18, 64, width - 36, 84, 12);
    labCard.lineStyle(2, 0x38bdf8, 0.85);
    labCard.strokeRoundedRect(18, 64, width - 36, 84, 12);
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
        124,
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
      const maxTxt = this.add.text(width / 2, 106, '🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ ЛАБОРАТОРИИ (Ур. 5)', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);
      this.listContainer.add(maxTxt);
    }

    const tabY = 166;
    const gap = 8;
    const tabW = (width - 36 - gap * 2) / 3;

    const makeTab = (idx, label, tabKey) => {
      const x = 18 + tabW / 2 + idx * (tabW + gap);
      const isSelected = this.activeTab === tabKey;
      const btn = this.add.text(x, tabY, label, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: isSelected ? '#1c1917' : '#e7e5e4',
        backgroundColor: isSelected ? '#facc15' : '#292524',
        padding: { x: 6, y: 7 },
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
    makeTab(2, '🏢 ИНТЕРЬЕР', 'perks');

    if (this.activeTab === 'tests') {
      TEST_UPGRADES.forEach((item, idx) => {
        const y = 190 + idx * 96;
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
          btnText
        );
      });
    } else if (this.activeTab === 'tools') {
      TOOL_UPGRADES.forEach((tool, idx) => {
        const y = 190 + idx * 84;
        const lvl = Storage.getUpgradeLevel(tool.key);
        const isMax = lvl >= tool.maxLevel;
        const cost = getToolCost(tool, lvl);
        const canBuy = !isMax && money >= cost;

        const isNotBought = tool.isPurchaseFirst && lvl === 0;
        const titleStr = isNotBought
          ? `${tool.name} [НЕ КУПЛЕН]`
          : `${tool.name} [Ур. ${lvl}/${tool.maxLevel}]`;
        const btnLabel = isMax
          ? 'МАКС.'
          : isNotBought
            ? `КУПИТЬ · ${cost} ₽`
            : `УЛУЧШИТЬ · ${cost} ₽`;

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
    } else {
      PERK_UPGRADES.forEach((perk, idx) => {
        const y = 190 + idx * 112;
        const lvl = Storage.getPerkLevel(perk.key);
        const isMax = lvl >= perk.maxLevel;
        const cost = getPerkCost(perk, lvl);
        const canBuy = !isMax && money >= cost;

        this.renderItemCard(y, `${perk.name} [Ур. ${lvl}/${perk.maxLevel}]`, perk.desc, isMax, cost, canBuy, () => {
          if (Storage.spendMoney(cost)) {
            Storage.upgradePerk(perk.key);
            AudioManager.playStamp();
            this.refreshUI();
          }
        }, 102);
      });
    }
  }

  renderItemCard(y, titleStr, descStr, isMax, cost, canBuy, onBuy, cardH = 88, customBtnLabel = null) {
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
