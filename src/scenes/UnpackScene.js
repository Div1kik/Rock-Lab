import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';

export class UnpackScene extends Phaser.Scene {
  constructor() {
    super('UnpackScene');
  }

  init(data) {
    this.contract = data?.contract || Storage.getActiveContract();
    this.currentBox = 1;
    this.totalBoxes = this.contract?.boxesCount || 1;
    this.bolts = [];
    this.unscrewedCount = 0;
    this.lidOpened = false;
    this.coresCollected = 0;
    this.drillTickTimer = 0;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x292524, 1);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x44403c, 1);
    bg.fillRect(0, 130, width, height - 130);

    this.headerTxt = this.add.text(width / 2, 34, 'ЭТАП 1: ВСКРЫТИЕ КЕРНОВОГО ЯЩИКА', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#fef3c7'
    }).setOrigin(0.5);

    this.subTxt = this.add.text(width / 2, 64, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#fde68a'
    }).setOrigin(0.5);

    this.hintTxt = this.add.text(width / 2, 102, 'Зажми каждый болт, чтобы выкрутить шуруповёртом', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 130 },
      scale: { start: 1.1, end: 0 },
      lifespan: 350,
      emitting: false
    }).setDepth(30);

    this.crateContainer = this.add.container(width / 2, height * 0.54);
    this.buildDrillSprite();
    this.buildCrate();
  }

  buildDrillSprite() {
    const drillLvl = Storage.getUpgradeLevel('drill');
    // Цвет корпуса шуруповёрта меняется с прокачкой
    const bodyColors = [0xd97706, 0xeab308, 0x22c55e, 0x0ea5e9, 0x8b5cf6, 0xf43f5e];
    const bodyColor = bodyColors[Math.min(bodyColors.length - 1, drillLvl - 1)];

    this.drillSprite = this.add.container(0, 0).setDepth(45).setVisible(false);

    const g = this.add.graphics();
    // Бита и патрон (упираются прямо в точку (0, 0) — центр болта)
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(-3, -24, 6, 24);
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(-9, -42, 18, 20, 4);

    // Моторный блок шуруповёрта (наклонён под удобным углом)
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(-16, -86, 36, 46, 8);
    g.fillStyle(0x1c1917, 0.8);
    g.fillRect(-12, -74, 24, 6);
    g.fillRect(-12, -62, 24, 6);

    // Рукоятка и аккумулятор в сторону
    g.fillStyle(0x27272a, 1);
    g.fillRoundedRect(12, -76, 44, 18, 6);
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(46, -82, 22, 30, 5);

    this.drillSprite.add(g);
    this.drillSprite.setAngle(-22);
  }

  buildCrate() {
    this.crateContainer.removeAll(true);
    this.bolts = [];
    this.unscrewedCount = 0;
    this.lidOpened = false;
    this.coresCollected = 0;
    this.drillSprite.setVisible(false);

    this.subTxt.setText(`${this.contract.title} · Ящик ${this.currentBox} из ${this.totalBoxes}`);
    this.hintTxt.setText('Зажми по очереди 4 болта шуруповёртом');

    const boxW = 310;
    const boxH = 380;

    const tray = this.add.graphics();
    tray.fillStyle(0x1c1917, 1);
    tray.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
    tray.lineStyle(4, 0x78350f, 1);
    tray.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);

    tray.fillStyle(0x27272a, 1);
    tray.fillRoundedRect(-boxW / 2 + 18, -boxH / 2 + 24, boxW - 36, 145, 8);
    tray.fillRoundedRect(-boxW / 2 + 18, 16, boxW - 36, 145, 8);
    this.crateContainer.add(tray);

    this.coreSprites = [];
    const corePositions = [
      { x: -65, y: -92 },
      { x: 65, y: -92 },
      { x: 0, y: 88 }
    ];

    corePositions.forEach((pos) => {
      const core = this.add.image(pos.x, pos.y, 'rock_core')
        .setScale(1.15)
        .setTint(this.contract.rock.color);

      core.collected = false;
      core.setInteractive({ useHandCursor: true });

      core.on('pointerdown', () => {
        if (!this.lidOpened || core.collected) return;
        core.collected = true;
        this.coresCollected += 1;
        AudioManager.playLatchSnap();
        this.particles.emitParticleAt(
          this.crateContainer.x + core.x,
          this.crateContainer.y + core.y,
          12
        );

        this.tweens.add({
          targets: core,
          y: core.y - 60,
          scale: 0.2,
          alpha: 0,
          duration: 260,
          onComplete: () => {
            if (this.coresCollected >= this.coreSprites.length) {
              this.onBoxCompleted();
            }
          }
        });
      });

      this.crateContainer.add(core);
      this.coreSprites.push(core);
    });

    this.lidContainer = this.add.container(0, 0);
    const lid = this.add.graphics();
    lid.fillStyle(0x92400e, 1);
    lid.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
    lid.lineStyle(3, 0x451a03, 1);
    lid.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);

    for (let y = -boxH / 2 + 76; y < boxH / 2; y += 76) {
      lid.lineBetween(-boxW / 2 + 6, y, boxW / 2 - 6, y);
    }

    const stamp = this.add.text(0, 0, `ПРОБА: ${this.contract.rock.name.toUpperCase()}\nНЕ КАНТОВАТЬ`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fef3c7',
      align: 'center',
      backgroundColor: '#451a03aa',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5);

    this.lidContainer.add([lid, stamp]);
    this.crateContainer.add(this.lidContainer);

    const offsetX = boxW / 2 - 28;
    const offsetY = boxH / 2 - 28;
    const corners = [
      { x: -offsetX, y: -offsetY },
      { x: offsetX, y: -offsetY },
      { x: -offsetX, y: offsetY },
      { x: offsetX, y: offsetY }
    ];

    corners.forEach((pt) => {
      const bolt = this.add.image(pt.x, pt.y, 'bolt_head').setScale(1.2);
      bolt.progress = 0;
      bolt.isHolding = false;
      bolt.done = false;
      bolt.setInteractive({ useHandCursor: true });

      bolt.on('pointerdown', () => {
        if (!bolt.done) bolt.isHolding = true;
      });
      bolt.on('pointerup', () => { bolt.isHolding = false; });
      bolt.on('pointerout', () => { bolt.isHolding = false; });

      this.lidContainer.add(bolt);
      this.bolts.push(bolt);
    });
  }

  update(time, delta) {
    if (this.lidOpened) return;

    const drillLvl = Storage.getUpgradeLevel('drill');
    const speed = (0.95 + (drillLvl - 1) * 0.35) * (delta / 1000);

    let activeBolt = null;

    for (const bolt of this.bolts) {
      if (bolt.isHolding && !bolt.done) {
        activeBolt = bolt;
        bolt.progress = Math.min(1, bolt.progress + speed);
        bolt.angle += 18;
        bolt.setScale(1.2 + bolt.progress * 0.35);

        if (bolt.progress >= 1) {
          bolt.done = true;
          bolt.isHolding = false;
          this.unscrewedCount += 1;
          AudioManager.playLatchSnap();

          this.tweens.add({
            targets: bolt,
            x: bolt.x + (bolt.x < 0 ? -70 : 70),
            y: bolt.y - 40,
            alpha: 0,
            angle: bolt.angle + 240,
            duration: 280
          });

          if (this.unscrewedCount >= this.bolts.length) {
            this.unlockLid();
          }
        }
      }
    }

    if (activeBolt && !activeBolt.done) {
      const worldX = this.crateContainer.x + activeBolt.x;
      const worldY = this.crateContainer.y + activeBolt.y - activeBolt.progress * 14;
      this.drillSprite.setVisible(true);
      this.drillSprite.setPosition(
        worldX + (Math.random() - 0.5) * 3,
        worldY + (Math.random() - 0.5) * 3
      );

      this.drillTickTimer += delta;
      if (this.drillTickTimer >= 55) {
        this.drillTickTimer = 0;
        AudioManager.playDrillTick();
        this.particles.emitParticleAt(worldX, worldY, 2);
      }
    } else {
      this.drillSprite.setVisible(false);
    }
  }

  unlockLid() {
    this.drillSprite.setVisible(false);
    this.hintTxt.setText('Нажми на крышку ящика, чтобы снять её!');
    this.lidContainer.setSize(310, 380);
    this.lidContainer.setInteractive({ useHandCursor: true });

    this.lidContainer.once('pointerdown', () => {
      this.lidOpened = true;
      AudioManager.playStamp();
      this.hintTxt.setText('Кликни по каждому керну, чтобы отправить на распил');

      this.tweens.add({
        targets: this.lidContainer,
        y: -480,
        alpha: 0,
        angle: -8,
        duration: 360,
        ease: 'Back.easeIn'
      });
    });
  }

  onBoxCompleted() {
    if (this.currentBox < this.totalBoxes) {
      this.currentBox += 1;
      this.buildCrate();
      return;
    }

    this.hintTxt.setText('Керны отправлены на отрезной станок!');
    this.time.delayedCall(450, () => {
      this.scene.start('PrepScene', { contract: this.contract });
    });
  }
}
