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
    bg.fillStyle(0x131926, 1);
    bg.fillRect(0, 0, width, height);

    const header = this.add.graphics();
    header.fillStyle(0x0b101b, 1);
    header.fillRect(0, 0, width, 58);
    header.lineStyle(2, 0x38bdf8, 0.35);
    header.lineBetween(0, 58, width, 58);

    const backBtn = this.add.text(18, 16, '← НАЗАД', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#1e293b',
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
        color: isSelected ? '#0f172a' : isUnlocked ? '#f8fafc' : '#94a3b8',
        backgroundColor: isSelected ? '#facc15' : '#1e293b',
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

    // 2. Лабораторный бланк-инструкция (рисуем ФОН ПЕРВЫМ, чтобы текст был поверх!)
    const guide = LAB_GUIDES.find((g) => g.key === this.selectedKey) || LAB_GUIDES[0];
    const isUnlocked = !guide.testKey || Storage.isTestUnlocked(guide.testKey);

    const cardY = 192;
    const cardH = height - cardY - 18;
    const cardW = width - 36;

    const sheet = this.add.graphics();
    sheet.fillStyle(0xfef9c3, 1);
    sheet.fillRoundedRect(18, cardY, cardW, cardH, 12);
    sheet.lineStyle(3, 0xd97706, 1);
    sheet.strokeRoundedRect(18, cardY, cardW, cardH, 12);

    // Плашка шифра ГОСТ
    sheet.fillStyle(0x78350f, 1);
    sheet.fillRoundedRect(30, cardY + 12, 224, 24, 6);

    const gostTxt = this.add.text(40, cardY + 17, guide.gost, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#fef3c7'
    });

    const statusBadge = this.add.text(
      width - 30,
      cardY + 24,
      isUnlocked ? '✅ В ЛАБЕ' : '🔒 НЕ КУПЛЕН',
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: '700',
        color: isUnlocked ? '#15803d' : '#b91c1c'
      }
    ).setOrigin(1, 0.5);

    const titleTxt = this.add.text(30, cardY + 42, guide.title, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '17px',
      fontWeight: '700',
      color: '#1e293b',
      wordWrap: { width: cardW - 24 }
    });

    // Добавляем сначала бланк и заголовок
    this.contentContainer.add([sheet, gostTxt, statusBadge, titleTxt]);

    // 3. Инженерная схема-картинка испытания прямо в карточке ГОСТа
    const diagramY = cardY + 72;
    const diagramH = 126;
    const diagramG = this.drawDiagram(guide.key, 30, diagramY, cardW - 24, diagramH);
    this.contentContainer.add(diagramG);

    // 4. Текстовые разделы строго ПОД картинкой
    let curY = diagramY + diagramH + 10;
    const addSection = (heading, body, accentColor = '#92400e') => {
      const hTxt = this.add.text(30, curY, heading, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: '700',
        color: accentColor
      });
      const bTxt = this.add.text(30, curY + 15, body, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#1e293b',
        wordWrap: { width: cardW - 24 },
        lineSpacing: 3
      });
      this.contentContainer.add([hTxt, bTxt]);
      curY += bTxt.height + 22;
    };

    addSection('📐 ПОДГОТОВКА ОБРАЗЦА:', guide.prep);
    addSection('🎛️ ПОРЯДОК РАБОТЫ НА СТЕНДЕ:', guide.howTo);
    addSection('🔬 ФИЗИЧЕСКИЙ СМЫСЛ:', guide.physics, '#0369a1');
  }

  // Процедурная инженерная иллюстрация для каждого ГОСТа
  drawDiagram(key, x, y, w, h) {
    const g = this.add.graphics();
    // Тёмно-синий чертёжный экран
    g.fillStyle(0x0f172a, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(2, 0x38bdf8, 0.7);
    g.strokeRoundedRect(x, y, w, h, 8);

    // Сетка чертежа
    g.lineStyle(1, 0x1e293b, 0.9);
    for (let gx = x + 20; gx < x + w; gx += 20) g.lineBetween(gx, y + 4, gx, y + h - 4);
    for (let gy = y + 20; gy < y + h; gy += 20) g.lineBetween(x + 4, gy, x + w - 4, gy);

    const cx = x + w / 2;
    const cy = y + h / 2;

    if (key === 'prep_basics') {
      // Пила + штангенциркуль со стрелками H и D
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(cx - 80, cy - 18, 84, 42);
      g.lineStyle(2, 0xef4444, 1);
      g.lineBetween(cx + 4, cy - 34, cx + 4, cy + 36); // линия реза
      // Стрелки H и D
      g.lineStyle(2, 0x38bdf8, 1);
      g.lineBetween(cx - 80, cy - 28, cx + 4, cy - 28); // H
      g.lineStyle(2, 0x4ade80, 1);
      g.lineBetween(cx - 94, cy - 18, cx - 94, cy + 24); // D
    } else if (key === 'uniaxial') {
      // Рама гидропресса + цилиндр + манометр со стрелкой в зелёной зоне
      g.fillStyle(0x64748b, 1);
      g.fillRect(cx - 66, cy - 46, 10, 92);
      g.fillRect(cx + 24, cy - 46, 10, 92);
      g.fillStyle(0x0284c9, 1);
      g.fillRect(cx - 72, cy - 52, 112, 12);
      g.fillRect(cx - 72, cy + 40, 112, 12);
      // Шток и керн
      g.fillStyle(0xd97706, 1);
      g.fillRect(cx - 34, cy - 28, 36, 10);
      g.fillStyle(0xd6d3d1, 1);
      g.fillRect(cx - 32, cy - 18, 32, 58);
      // Шкала справа
      g.fillStyle(0x1e293b, 1);
      g.fillRect(cx + 68, cy - 44, 16, 88);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(cx + 70, cy - 26, 12, 22);
      g.fillStyle(0xfacc15, 1);
      g.fillRect(cx + 64, cy - 16, 24, 4);
    } else if (key === 'shear_cut' || key === 'shear_crack' || key === 'shear_load') {
      // Сдвиговая обойма: верхняя и нижняя части со сдвигом
      g.fillStyle(0x64748b, 1);
      g.fillRect(cx - 56, cy + 4, 100, 26);
      g.fillStyle(key === 'shear_crack' ? 0xb45309 : 0x94a3b8, 1);
      g.fillRect(cx - 42, cy - 26, 100, 26);
      g.fillStyle(0xd97706, 1);
      g.fillRect(cx - 44, cy + 4, 76, 14);
      g.fillRect(cx - 30, cy - 12, 76, 14);
      // Линия контакта (зубчатая или ровная)
      g.lineStyle(2, key === 'shear_crack' ? 0xfacc15 : 0x38bdf8, 1);
      if (key === 'shear_crack') {
        g.beginPath();
        g.moveTo(cx - 46, cy + 2);
        for (let sx = -36; sx <= 46; sx += 12) g.lineTo(cx + sx, cy + (sx % 24 === 0 ? -2 : 4));
        g.strokePath();
      } else {
        g.lineBetween(cx - 48, cy + 2, cx + 48, cy + 2);
      }
      if (key === 'shear_load') {
        // Вертикальный прижим σ сверху
        g.fillStyle(0x38bdf8, 1);
        g.fillRect(cx - 24, cy - 44, 64, 10);
      }
    } else if (key === 'water_sat') {
      // Весы + ванночка с водой + образец
      g.fillStyle(0x475569, 1);
      g.fillRect(cx - 54, cy + 32, 108, 20);
      g.fillStyle(0x0284c9, 0.65);
      g.fillRect(cx - 38, cy - 22, 76, 52);
      g.lineStyle(2, 0x38bdf8, 1);
      g.strokeRect(cx - 39, cy - 36, 78, 66);
      g.fillStyle(0xd97706, 1);
      g.fillRect(cx - 16, cy - 8, 32, 36);
    } else if (key === 'ultrasonic') {
      // Два датчика УЗК + осциллограмма синусоиды
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(cx - 95, cy - 18, 14, 36);
      g.fillRect(cx - 15, cy - 18, 14, 36);
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(cx - 81, cy - 16, 66, 32);
      // Синусоида справа
      g.lineStyle(2, 0x4ade80, 1);
      g.beginPath();
      for (let wx = 0; wx <= 86; wx += 4) {
        const wy = cy + Math.sin(wx * 0.16) * 24;
        if (wx === 0) g.moveTo(cx + 18 + wx, wy);
        else g.lineTo(cx + 18 + wx, wy);
      }
      g.strokePath();
    } else if (key === 'frost_test') {
      // Криокамера со снежинками и ледяным керном
      g.fillStyle(0x0c4a6e, 1);
      g.fillRoundedRect(cx - 54, cy - 44, 108, 88, 8);
      g.lineStyle(3, 0x7dd3fc, 1);
      g.strokeRoundedRect(cx - 54, cy - 44, 108, 88, 8);
      g.fillStyle(0xe0f2fe, 0.9);
      g.fillRect(cx - 18, cy - 24, 36, 48);
    } else if (key === 'triaxial') {
      // Стабилометр в раме пресса + насос слева + шток сверху
      g.fillStyle(0x64748b, 1);
      g.fillRect(cx - 56, cy - 48, 8, 96);
      g.fillRect(cx + 48, cy - 48, 8, 96);
      g.fillStyle(0x0284c9, 0.45);
      g.fillRect(cx - 32, cy - 30, 64, 64);
      g.lineStyle(2, 0x94a3b8, 1);
      g.strokeRect(cx - 32, cy - 30, 64, 64);
      // Насос и шланг слева
      g.fillStyle(0x334155, 1);
      g.fillRect(cx - 102, cy + 6, 26, 36);
      g.lineStyle(3, 0x38bdf8, 1);
      g.lineBetween(cx - 76, cy + 22, cx - 32, cy + 22);
      // Шток сверху и керн
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(cx - 6, cy - 52, 12, 34);
      g.fillStyle(0xd97706, 1);
      g.fillRect(cx - 14, cy - 14, 28, 44);
    }

    return g;
  }
}
