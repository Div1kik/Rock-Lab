import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { generateContractBoard, TEST_CATALOG } from '../data/contracts.js';

export class ContractsScene extends Phaser.Scene {
  constructor() {
    super('ContractsScene');
    this.contracts = [];
  }

  create() {
    const { width, height } = this.scale;
    const labLvl = Storage.getLabLevel();
    const completed = Storage.getState().completedContracts;

    const bg = this.add.graphics();
    bg.fillStyle(0x181e29, 1);
    bg.fillRect(0, 0, width, height);

    const header = this.add.graphics();
    header.fillStyle(0x14161b, 1);
    header.fillRect(0, 0, width, 64);

    const backBtn = this.add.text(20, 18, '← В ЛАБУ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#27272a',
      padding: { x: 12, y: 7 }
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });

    this.add.text(width - 20, 22, `Ур. ${labLvl} · ★ ${Storage.getReputation()}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(1, 0);

    this.add.text(width / 2, 86, 'ДОСКА ТЕХНИЧЕСКИХ ЗАДАНИЙ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0.5);

    this.cardsContainer = this.add.container(0, 0);
    this.contracts = generateContractBoard(labLvl, completed, 3);
    this.renderCards();

    const refreshBtn = this.add.text(width / 2, height - 42, '🔄 ОБНОВИТЬ ЗАКАЗЫ (БЕСПЛАТНО)', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#e2e8f0',
      backgroundColor: '#334155',
      padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    refreshBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.contracts = generateContractBoard(labLvl, completed, 3);
      this.renderCards();
    });
  }

  renderCards() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;

    this.contracts.forEach((cnt, idx) => {
      const y = 114 + idx * 204;
      const cardW = width - 36;
      const cardH = 190;
      const x = 18;

      const cardBg = this.add.graphics();
      const isAudit = Boolean(cnt.isAudit);
      const paperColor = isAudit ? 0xdbeafe : cnt.isVip ? 0xfde68a : 0xfef3c7;
      const borderColor = isAudit ? 0x1d4ed8 : cnt.isVip ? 0xd97706 : 0x78350f;

      cardBg.fillStyle(paperColor, 1);
      cardBg.fillRoundedRect(x, y, cardW, cardH, 10);
      cardBg.lineStyle(isAudit || cnt.isVip ? 3 : 2, borderColor, 1);
      cardBg.strokeRoundedRect(x, y, cardW, cardH, 10);

      cardBg.fillStyle(borderColor, 1);
      cardBg.fillRect(x, y + 14, cardW, 28);

      const compText = this.add.text(x + 14, y + 20, `${cnt.company} · Ур.${cnt.tier}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#ffffff'
      });

      const rewardText = this.add.text(x + cardW - 14, y + 20, `+${cnt.reward} ₽  ★+${cnt.repReward}`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(1, 0);

      const titleText = this.add.text(x + 14, y + 50, cnt.title, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '16px',
        fontWeight: '700',
        color: isAudit ? '#1e3a8a' : '#1c1917'
      });

      const rockLine = isAudit
        ? `Контрольный керн: ${cnt.rock.name} · Допуск погрешности ≤ ${cnt.maxAllowedErrorPct}%`
        : `Порода: ${cnt.rock.name} (${cnt.rock.traitLabel})`;

      const rockText = this.add.text(x + 14, y + 73, rockLine, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: '600',
        color: isAudit ? '#1d4ed8' : '#44403c'
      });

      const normText = this.add.text(
        x + 14,
        y + 92,
        `Норма объекта: ≥ ${cnt.reqMpa} МПа  |  Ящиков: ${cnt.boxesCount} шт.`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px',
          fontWeight: '700',
          color: '#b45309'
        }
      );

      const testNames = cnt.tests.map((k) => TEST_CATALOG[k]?.short || k).join(' + ');
      const testsText = this.add.text(x + 14, y + 112, `Испытания: ${testNames}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: '600',
        color: '#1e293b',
        wordWrap: { width: cardW - 28 }
      });

      const btnW = 190;
      const btnH = 36;
      const btnX = x + cardW - btnW - 12;
      const btnY = y + cardH - btnH - 10;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(isAudit ? 0x1d4ed8 : 0x15803d, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);

      const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, isAudit ? 'ПРОЙТИ АУДИТ →' : 'ВЗЯТЬ В РАБОТУ →', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        AudioManager.playStamp();
        Storage.setActiveContract(cnt);
        this.scene.start('UnpackScene', { contract: cnt });
      });

      this.cardsContainer.add([
        cardBg, compText, rewardText, titleText, rockText, normText, testsText, btnBg, btnLabel, hitZone
      ]);
    });
  }
}
