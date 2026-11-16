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

    // Фон доски заказов
    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);

    // Пробковая доска
    bg.fillStyle(0x451a03, 0.55);
    bg.fillRoundedRect(14, 74, width - 28, height - 154, 14);
    bg.lineStyle(3, 0x92400e, 0.9);
    bg.strokeRoundedRect(14, 74, width - 28, height - 154, 14);

    // Верхняя панель
    this.createHeader(width);

    if (!this.contracts.length) {
      this.contracts = generateContractBoard(state.labLevel, state.completedContracts, 3);
    }

    this.cardsContainer = this.add.container(0, 0);
    this.renderCards();

    // Нижняя кнопка обновления списка заказов
    this.createBottomBar(width, height);
  }

  createHeader(width) {
    const g = this.add.graphics();
    g.fillStyle(0x141210, 1);
    g.fillRect(0, 0, width, 62);

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

    this.add.text(width - 18, 20, `💰 ${Storage.getMoney()} ₽`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '17px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0);
  }

  renderCards() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;
    const startY = 92;
    const cardH = 172;
    const gap = 14;

    this.contracts.forEach((cnt, idx) => {
      const y = startY + idx * (cardH + gap);
      const card = this.createContractCard(26, y, width - 52, cardH, cnt);
      this.cardsContainer.add(card);
    });
  }

  createContractCard(x, y, w, h, cnt) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    // Бумажный бланк заказа
    g.fillStyle(0xfef3c7, 1);
    g.fillRoundedRect(0, 0, w, h, 10);
    g.lineStyle(2, 0xb45309, 0.8);
    g.strokeRoundedRect(0, 0, w, h, 10);

    // Плашка сложности
    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(12, 10, 92, 22, 6);

    const tierTxt = this.add.text(58, 21, `РАНГ ${cnt.tier} · 📦×${cnt.boxesCount}`, {
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

    const titleTxt = this.add.text(14, 38, cnt.title, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '17px',
      fontWeight: '700',
      color: '#1c1917'
    });

    const subTxt = this.add.text(14, 62, `${cnt.company} · Порода: ${cnt.rock.name}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '600',
      color: '#57534e'
    });

    const normTxt = this.add.text(14, 83, `Норма прочности объекта: ≥ ${cnt.reqMpa} МПа`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontWeight: '700',
      color: '#b45309'
    });

    const testsNames = cnt.tests.map((t) => TEST_CATALOG[t]?.short || t).join(' • ');
    const testsTxt = this.add.text(14, 104, `Испытания: ${testsNames}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '600',
      color: '#292524'
    });

    // Кнопка "ВЗЯТЬ В РАБОТУ"
    const btnW = w - 28;
    const btnH = 36;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xd97706, 1);
    btnBg.fillRoundedRect(14, h - btnH - 10, btnW, btnH, 8);

    const btnTxt = this.add.text(w / 2, h - btnH / 2 - 10, 'ПРИНЯТЬ КЕРНЫ В РАБОТУ →', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([g, tierTxt, rewardTxt, titleTxt, subTxt, normTxt, testsTxt, btnBg, btnTxt]);

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
    const btn = this.add.text(width / 2, height - 38, '🔄 ОБНОВИТЬ ТЕНДЕРЫ (БЕСПЛАТНО)', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fef3c7',
      backgroundColor: '#292524',
      padding: { x: 18, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      AudioManager.playClick();
      const state = Storage.getState();
      this.contracts = generateContractBoard(state.labLevel, state.completedContracts, 3);
      this.renderCards();
    });
  }
}
