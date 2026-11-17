import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { RARE_INCLUSIONS } from '../data/contracts.js';

export class UnpackScene extends Phaser.Scene {
  constructor() {
    super('UnpackScene');
  }

  init(data) {
    this.contract = data?.contract || Storage.getActiveContract();
    this.boxesLeft = this.contract?.boxesCount || 1;
    this.totalBoxes = this.boxesLeft;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x181e29, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 34, `ВСКРЫТИЕ КЕРНОВ (${this.totalBoxes - this.boxesLeft + 1}/${this.totalBoxes})`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.titleTxt = this.add.text(width / 2, 64, 'МОНТАЖКА И ГРУБОЕ ЗУБИЛО', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#f8fafc'
    }).setOrigin(0.5);

    this.subTxt = this.add.text(width / 2, 90, `Объект: ${this.contract?.title || 'Заказ'}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    this.cx = width / 2;
    this.cy = height * 0.44;

    this.crateContainer = this.add.container(this.cx, this.cy);
    this.drawCrate(0);

    const hint = this.add.text(
      width / 2,
      height * 0.72,
      'Тапай по деревянному ящику монтажкой,\nчтобы сорвать крышку и извлечь керн!',
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 4
      }
    ).setOrigin(0.5);

    this.progressBg = this.add.graphics();
    this.progressFill = this.add.graphics();
    this.drawProgressBar(0);

    this.crateContainer.setInteractive(
      new Phaser.Geom.Rectangle(-110, -110, 220, 220),
      Phaser.Geom.Rectangle.Contains
    );

    this.hits = 0;
    this.requiredHits = 5;

    this.crateContainer.on('pointerdown', () => {
      this.hits += 1;
      AudioManager.playCrowbarPry();
      this.cameras.main.shake(120, 0.008);

      const ratio = this.hits / this.requiredHits;
      this.drawCrate(ratio);
      this.drawProgressBar(ratio);

      this.tweens.add({
        targets: this.crateContainer,
        scaleX: 1.05,
        scaleY: 0.95,
        duration: 50,
        yoyo: true
      });

      if (this.hits >= this.requiredHits) {
        this.crateContainer.disableInteractive();
        this.openBoxSuccess();
      }
    });
  }

  drawCrate(damageRatio) {
    this.crateContainer.removeAll(true);
    const g = this.add.graphics();

    // Деревянный ящик
    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(-96, -96, 192, 192, 10);
    g.lineStyle(4, 0x451a03, 1);
    g.strokeRoundedRect(-96, -96, 192, 192, 10);

    // Доски
    g.lineStyle(3, 0x291203, 0.8);
    g.lineBetween(-96, -32, 96, -32);
    g.lineBetween(-96, 32, 96, 32);

    // Трещины при ударах
    if (damageRatio > 0.2) {
      g.lineStyle(2, 0x180b01, 1);
      g.beginPath();
      g.moveTo(-20, -96);
      g.lineTo(10, -10);
      g.lineTo(-10, 40);
      g.strokePath();
    }
    if (damageRatio > 0.6) {
      g.beginPath();
      g.moveTo(40, -96);
      g.lineTo(20, 20);
      g.lineTo(60, 96);
      g.strokePath();
    }

    // Гвозди по углам
    g.fillStyle(0x94a3b8, 1);
    g.fillCircle(-75, -75, 5);
    g.fillCircle(75, -75, 5);
    g.fillCircle(-75, 75, 5);
    g.fillCircle(75, 75, 5);

    // Керн внутри (проглядывает при разрушении)
    if (damageRatio > 0.5) {
      g.fillStyle(this.contract.rock.color, 1);
      g.fillRoundedRect(-45, -70, 90, 140, 8);
    }

    this.crateContainer.add(g);
  }

  drawProgressBar(ratio) {
    const { width } = this.scale;
    const bw = 260;
    const bh = 18;
    const bx = width / 2 - bw / 2;
    const by = this.cy + 128;

    this.progressBg.clear();
    this.progressBg.fillStyle(0x0f172a, 1);
    this.progressBg.fillRoundedRect(bx, by, bw, bh, 6);

    this.progressFill.clear();
    this.progressFill.fillStyle(0xd97706, 1);
    this.progressFill.fillRoundedRect(bx + 2, by + 2, (bw - 4) * Math.min(1, ratio), bh - 4, 4);
  }

  openBoxSuccess() {
    AudioManager.playRockCrack();

    // Шанс 35% найти редкий минерал при вскрытии ящика
    let foundRare = null;
    if (Math.random() < 0.35) {
      const existingGems = Storage.getGems().map(g => g.id);
      const available = RARE_INCLUSIONS.filter(g => !existingGems.includes(g.id));
      const pool = available.length > 0 ? available : RARE_INCLUSIONS;
      foundRare = pool[Math.floor(Math.random() * pool.length)];
      Storage.addGem(foundRare);
    }

    this.tweens.add({
      targets: this.crateContainer,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      onComplete: () => {
        if (foundRare) {
          this.showRareGemModal(foundRare);
        } else {
          this.proceedNext();
        }
      }
    });
  }

  showRareGemModal(gem) {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0b101b, 0.92);
    overlay.fillRect(0, 0, width, height);

    const mBox = this.add.graphics();
    mBox.fillStyle(0x1e293b, 1);
    mBox.fillRoundedRect(width / 2 - 170, height / 2 - 140, 340, 280, 16);
    mBox.lineStyle(3, gem.color, 1);
    mBox.strokeRoundedRect(width / 2 - 170, height / 2 - 140, 340, 280, 16);

    this.add.text(width / 2, height / 2 - 100, '✨ НАЙДЕН РЕДКИЙ МИНЕРАЛ!', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, `${gem.icon} ${gem.name}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, 'Добавлено на витрину в лабораторию!\nБонус к престижу активирован.', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, height / 2 + 90, 'КРУТО, ПРОДОЛЖИТЬ →', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#facc15',
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      AudioManager.playClick();
      this.proceedNext();
    });
  }

  proceedNext() {
    this.boxesLeft -= 1;
    if (this.boxesLeft > 0) {
      this.scene.restart({ contract: this.contract });
    } else {
      this.scene.start('PrepScene', { contract: this.contract });
    }
  }
}
