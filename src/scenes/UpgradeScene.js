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

    // 1. Карточка апгрейда лаборатории (Ур. 1 -> 5)
    const nextLab = LAB_UPGRADES.find((l) => l.level === labLvl + 1);
    const labCard = this.add.graphics();
    labCard.fillStyle(0x292524, 1);
    labCard.fillRoundedRect(18, 68, width - 36, 98, 12);
    labCard.lineStyle(2, 0x38bdf8, 0.85);
    labCard.strokeRoundedRect(18, 68, width - 36, 98, 12);
    this.listContainer.add(labCard);

    if (nextLab) {
      const canBuyLab = money >= nextLab.cost && rep >= nextLab.reqRep;
      const t1 = this.add.text(30, 77, `ЛАБОРАТОРИЯ → Ур. ${nextLab.level}: ${nextLab.name}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#38bdf8'
      });
      const t2 = this.add.text(30, 97, 'Открывает крупные тендеры и обновляет интерьер', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#d6d3d1'
      });
      const buyLabBtn = this.add.text(
        width - 30,
        142,
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
      this.listContainer.add([t1, t2, buyLabBtn]);
    } else {
      const maxTxt = this.add.text(width / 2, 117, '🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ ЛАБОРАТОРИИ (Ур. 5)', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);
      this.listContainer.add(maxTxt);
    }

    // 2. Список из 6 апгрейдов оборудования
    TOOL_UPGRADES.forEach((tool, idx) => {
      const y = 178 + idx * 100;
      const lvl = Storage.getUpgradeLevel(tool.key);
      const isMax = lvl >= tool.maxLevel;
      const cost = getToolCost(tool, lvl);
      const canBuy = !isMax && money >= cost;

      const card = this.add.graphics();
      card.fillStyle(0x292524, 1);
      card.fillRoundedRect(18, y, width - 36, 90, 10);
      card.lineStyle(2, 0x57534e, 0.9);
      card.strokeRoundedRect(18, y, width - 36, 90, 10);

      const title = this.add.text(30, y + 10, `${tool.name} [Ур. ${lvl}/${tool.maxLevel}]`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#fef3c7'
      });

      const desc = this.add.text(30, y + 30, tool.desc, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#a8a29e',
        wordWrap: { width: width - 64 }
      });

      const btnLabel = isMax ? 'МАКС.' : `УЛУЧШИТЬ · ${cost} ₽`;
      const btn = this.add.text(width - 30, y + 68, btnLabel, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        fontWeight: '700',
        color: canBuy ? '#ffffff' : '#a8a29e',
        backgroundColor: canBuy ? '#d97706' : '#44403c',
        padding: { x: 12, y: 5 }
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
