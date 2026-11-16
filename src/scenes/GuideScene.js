import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { LAB_GUIDES } from '../data/guides.js';

export class GuideScene extends Phaser.Scene {
  constructor() {
    super('GuideScene');
  }

  init(data) {
    this.returnScene = data?.returnScene || 'MenuScene';
    this.selectedKey = data?.guideKey || LAB_GUIDES[0].key;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x1c1917, 1);
    bg.fillRect(0, 0, width, height);

    const header = this.add.graphics();
    header.fillStyle(0x141210, 1);
    header.fillRect(0, 0, width, 58);

    const backBtn = this.add.text(18, 16, '← НАЗАД', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#292524',
      padding: { x: 10, y: 6 }
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start(this.returnScene);
    });

    this.add.text(width - 18, 19, '📖 МЕТОДЫ И ГОСТЫ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0);

    this.contentContainer = this.add.container(0, 0);
    this.renderView();
  }

  renderView() {
    this.contentContainer.removeAll(true);
    const { width, height } = this.scale;

    // 1. Сетка кнопок выбора методики (3 колонки × 3 ряда)
    const cols = 3;
    const gap = 6;
    const btnW = (width - 36 - gap * (cols - 1)) / cols;
    const btnH = 34;

    LAB_GUIDES.forEach((gItem, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 18 + btnW / 2 + col * (btnW + gap);
      const y = 84 + row * (btnH + 6);

      const isSelected = gItem.key === this.selectedKey;
      const isUnlocked = !gItem.testKey || Storage.isTestUnlocked(gItem.testKey);

      const shortTitle = gItem.title.split('(')[0].trim();
      const label = shortTitle.length > 14 ? shortTitle.slice(0, 13) + '…' : shortTitle;

      const chip = this.add.text(x, y, isUnlocked ? label : `🔒 ${label}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '10px',
        fontWeight: '700',
        color: isSelected ? '#1c1917' : isUnlocked ? '#fef3c7' : '#a8a29e',
        backgroundColor: isSelected ? '#facc15' : '#292524',
        padding: { x: 4, y: 8 },
        fixedWidth: btnW,
        align: 'center'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      chip.on('pointerdown', () => {
        if (!isSelected) {
          AudioManager.playClick();
          this.selectedKey = gItem.key;
          this.renderView();
        }
      });

      this.contentContainer.add(chip);
    });

    // 2. Карточка выбранного ГОСТа (лабораторный бланк-инструкция)
    const guide = LAB_GUIDES.find((g) => g.key === this.selectedKey) || LAB_GUIDES[0];
    const isUnlocked = !guide.testKey || Storage.isTestUnlocked(guide.testKey);

    const cardY = 194;
    const cardH = height - cardY - 22;
    const cardW = width - 36;

    const sheet = this.add.graphics();
    sheet.fillStyle(0xfef3c7, 1);
    sheet.fillRoundedRect(18, cardY, cardW, cardH, 12);
    sheet.lineStyle(3, 0xb45309, 1);
    sheet.strokeRoundedRect(18, cardY, cardW, cardH, 12);

    // Плашка шифра ГОСТ
    sheet.fillStyle(0x78350f, 1);
    sheet.fillRoundedRect(32, cardY + 14, 210, 24, 6);

    const gostTxt = this.add.text(42, cardY + 19, guide.gost, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef3c7'
    });

    const statusBadge = this.add.text(
      width - 32,
      cardY + 26,
      isUnlocked ? '✅ СТЕНД В ЛАБЕ' : '🔒 НЕ КУПЛЕН',
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: '700',
        color: isUnlocked ? '#15803d' : '#b91c1c'
      }
    ).setOrigin(1, 0.5);

    const titleTxt = this.add.text(32, cardY + 48, guide.title, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#1c1917',
      wordWrap: { width: cardW - 28 }
    });

    // Разделы карточки
    let curY = cardY + 96;
    const addSection = (heading, body, accentColor = '#92400e') => {
      const hTxt = this.add.text(32, curY, heading, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: accentColor
      });
      const bTxt = this.add.text(32, curY + 18, body, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        color: '#292524',
        wordWrap: { width: cardW - 28 },
        lineSpacing: 4
      });
      this.contentContainer.add([hTxt, bTxt]);
      curY += bTxt.height + 30;
    };

    addSection('📐 ПОДГОТОВКА ОБРАЗЦА:', guide.prep);
    addSection('🎛️ ПОРЯДОК ПРОВЕДЕНИЯ НА СТЕНДЕ:', guide.howTo);
    addSection('🔬 ФИЗИЧЕСКИЙ СМЫСЛ И ПОГРЕШНОСТЬ:', guide.physics, '#0369a1');

    this.contentContainer.add([sheet, gostTxt, statusBadge, titleTxt]);
  }
}
