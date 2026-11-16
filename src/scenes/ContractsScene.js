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
    const state = Storage.getState();

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);

    bg.fillStyle(0x451a03, 0.55);
    bg.fillRoundedRect(14, 70, width - 28, height - 144, 14);
    bg.lineStyle(3, 0x92400e, 0.9);
    bg.strokeRoundedRect(14, 70, width - 28, height - 144, 14);

    this.createHeader(width);

    if (!this.contracts.length) {
      this.contracts = generateContractBoard(state.labLevel, state.completedContracts, 3);
    }

    this.cardsContainer = this.add.container(0, 0);
    this.renderCards();

    this.createBottomBar(width, height);
  }

  createHeader(width) {
    const g = this.add.graphics();
    g.fillStyle(0x141210, 1);
    g.fillRect(0, 0, width, 60);

    const backBtn = this.add.text(18, 16, '← В ЛАБУ', {
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

    this.add.text(width - 18, 19, `💰 ${Storage.getMoney()} ₽`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '17px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0);
  }

  renderCards() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;
    const startY = 84;
    const cardH = 182;
    const gap = 12;

    this.contracts.forEach((cnt, idx) => {
      const y = startY + idx * (cardH + gap);
      const card = this.createContractCard(24, y, width - 48, cardH, cnt);
      this.cardsContainer.add(card);
    });
  }

  createContractCard(x, y, w, h, cnt) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    g.fillStyle(cnt.isVip ? 0xfffbeb : 0xfef3c7, 1);
    g.fillRoundedRect(0, 0, w, h, 10);
    g.lineStyle(cnt.isVip ? 3 : 2, cnt.isVip ? 0xdc2626 : 0xb45309, 0.95);
    g.strokeRoundedRect(0, 0, w, h, 10);

    g.fillStyle(cnt.isVip ? 0xb91c1c : 0x78350f, 1);
    g.fillRoundedRect(12, 10, 106, 22, 6);

    const tierTxt = this.add.text(65, 21, `РАНГ ${cnt.tier} · 📦×${cnt.boxesCount}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0.5);

    const rewardTxt = this.add.text(w - 14, 12, `+${cnt.reward} ₽  ★+${cnt.repReward}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      fontWeight: '700',
      color: '#15803d'
    }).setOrigin(1, 0);

    const titleTxt = this.add.text(14, 36, cnt.title, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: cnt.isVip ? '#991b1b' : '#1c1917'
    });

    const traitColor = cnt.rock.trait === 'frozen' ? '#0284c9' : cnt.rock.trait === 'brittle' ? '#b91c1c' : '#57534e';
    const traitTxt = this.add.text(14, 58, `${cnt.rock.name} · ${cnt.rock.traitLabel}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: traitColor
    });

    const normTxt = this.add.text(14, 78, `Норма объекта: ≥ ${cnt.reqMpa} МПа`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontWeight: '700',
      color: '#b45309'
    });

    const testsNames = cnt.tests.map((t) => TEST_CATALOG[t]?.short || t).join(' • ');
    const testsTxt = this.add.text(14, 98, `Испытания: ${testsNames}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '600',
      color: '#292524',
      wordWrap: { width: w - 28 }
    });

    const btnW = w - 28;
    const btnH = 34;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(cnt.isVip ? 0xdc2626 : 0xd97706, 1);
    btnBg.fillRoundedRect(14, h - btnH - 10, btnW, btnH, 8);

    const btnTxt = this.add.text(w / 2, h - btnH / 2 - 10, 'ПРИНЯТЬ КЕРНЫ В РАБОТУ →', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([g, tierTxt, rewardTxt, titleTxt, traitTxt, normTxt, testsTxt, btnBg, btnTxt]);

    const hitZone = this.add.zone(w / 2, h - btnH / 2 - 10, btnW, btnH).setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerdown', () => {
      AudioManager.playStamp();
      Storage.setActiveContract(cnt);
      this.contracts = this.contracts.filter((item) => item.id !== cnt.id);
      this.scene.start('UnpackScene', { contract: cnt });
    });

    return container;
  }

  createBottomBar(width, height) {
    const btn = this.add.text(width / 2, height - 34, '🔄 ОБНОВИТЬ ТЕНДЕРЫ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fef3c7',
      backgroundColor: '#292524',
      padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      AudioManager.playClick();
      const state = Storage.getState();
      this.contracts = generateContractBoard(state.labLevel, state.completedContracts, 3);
      this.renderCards();
    });
  }
}
