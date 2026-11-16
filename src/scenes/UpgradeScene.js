import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { TOOL_UPGRADES, LAB_UPGRADES, getToolCost } from '../data/upgrades.js';

export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);

    // Шапка
    const header = this.add.graphics();
    header.fillStyle(0x141210, 1);
    header.fillRect(0, 0, width, 62);

    const backBtn = this.add.text(18, 18, '← В ЛАБУ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#292524',
      padding: { x: 10, y: 6 }
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });

    this.balanceTxt = this.add.text(width - 18, 20, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '16px',
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

    // 1. Карточка апгрейда самой лаборатории (Ур. 1 -> 5)
    const nextLab = LAB_UPGRADES.find((l) => l.level === labLvl + 1);
    const labCard = this.add.graphics();
    labCard.fillStyle(0x292524, 1);
    labCard.fillRoundedRect(20, 76, width - 40, 118, 12);
    labCard.lineStyle(2, 0x38bdf8, 0.8);
    labCard.strokeRoundedRect(20, 76, width - 40, 118, 12);
    this.listContainer.add(labCard);

    if (nextLab) {
      const canBuyLab = money >= nextLab.cost && rep >= nextLab.reqRep;
      const t1 = this.add.text(34, 88, `РАСШИРЕНИЕ ЛАБОРАТОРИИ → Ур. ${nextLab.level}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#38bdf8'
      });
      const t2 = this.add.text(34, 110, `${nextLab.name}\nОткрывает крупные тендеры и обновляет интерьер`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        color: '#d6d3d1'
      });
      const buyLabBtn = this.add.text(
        width - 34,
        156,
        `УЛУЧШИТЬ: ${nextLab.cost} ₽ (нужно ★${nextLab.reqRep})`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          fontWeight: '700',
          color: canBuyLab ? '#0f172a' : '#a8a29e',
          backgroundColor: canBuyLab ? '#38bdf8' : '#44403c',
          padding: { x: 12, y: 7 }
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
      this.listContainer.add([t1, t2, buyLabBtn]);
    } else {
      const maxTxt = this.add.text(width / 2, 135, '🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ ЛАБОРАТОРИИ (Ур. 5)', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);
      this.listContainer.add(maxTxt);
    }

    // 2. Список апгрейдов оборудования
    TOOL_UPGRADES.forEach((tool, idx) => {
      const y = 212 + idx * 136;
      const lvl = Storage.getUpgradeLevel(tool.key);
      const isMax = lvl >= tool.maxLevel;
      const cost = getToolCost(tool, lvl);
      const canBuy = !isMax && money >= cost;

      const card = this.add.graphics();
      card.fillStyle(0x292524, 1);
      card.fillRoundedRect(20, y, width - 40, 122, 12);
      card.lineStyle(2, 0x57534e, 0.9);
      card.strokeRoundedRect(20, y, width - 40, 122, 12);

      const title = this.add.text(34, y + 14, `${tool.name}  [Ур. ${lvl}/${tool.maxLevel}]`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '15px',
        fontWeight: '700',
        color: '#fef3c7'
      });

      const desc = this.add.text(34, y + 38, tool.desc, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        color: '#a8a29e',
        wordWrap: { width: width - 70 }
      });

      const btnLabel = isMax ? 'МАКС. УРОВЕНЬ' : `ПРОКАЧАТЬ · ${cost} ₽`;
      const btn = this.add.text(width - 34, y + 92, btnLabel, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
        fontWeight: '700',
        color: canBuy ? '#ffffff' : '#a8a29e',
        backgroundColor: canBuy ? '#d97706' : '#44403c',
        padding: { x: 14, y: 8 }
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: canBuy });

      if (canBuy) {
        btn.on('pointerdown', () => {
          if (Storage.spendMoney(cost)) {
            Storage.upgradeTool(tool.key);
            AudioManager.playLatchSnap();
            this.refreshUI();
          }
        });
      }

      this.listContainer.add([card, title, desc, btn]);
    });
  }
}
