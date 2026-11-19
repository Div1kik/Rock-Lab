import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { rollWeightedInclusion } from '../data/contracts.js';
import { MineralRenderer } from '../utils/MineralRenderer.js';

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
    this.boxMode = 'screws';
    this.pryProgress = 0;
    this.isPrying = false;
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

    this.hintTxt = this.add.text(width / 2, 102, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      color: '#38bdf8',
      align: 'center'
    }).setOrigin(0.5);

    this.particles = this.add.particles(0, 0, 'dust_px', {
      speed: { min: 40, max: 130 },
      scale: { start: 1.1, end: 0 },
      lifespan: 350,
      emitting: false
    }).setDepth(30);

    this.crateContainer = this.add.container(width / 2, height * 0.54);
    this.buildDrillSprite();
    this.buildCrowbarSprite();
    this.buildCrate();
  }

  buildDrillSprite() {
    const drillLvl = Storage.getUpgradeLevel('drill');
    const bodyColors = [0xd97706, 0xeab308, 0x22c55e, 0x0ea5e9, 0x8b5cf6, 0xf43f5e];
    const bodyColor = bodyColors[Math.min(bodyColors.length - 1, drillLvl - 1)];

    this.drillSprite = this.add.container(0, 0).setDepth(45).setVisible(false);

    const g = this.add.graphics();
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(-3, -24, 6, 24);
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(-10, -44, 20, 22, 4);
    if (drillLvl >= 3) {
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(-10, -26, 20, 3);
    }

    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(-17, -88, 38, 46, 8);
    g.fillStyle(0x1c1917, 0.85);
    g.fillRect(-12, -76, 24, 6);
    g.fillRect(-12, -64, 24, 6);

    g.fillStyle(0x27272a, 1);
    g.fillRoundedRect(12, -78, 46, 18, 6);
    g.fillStyle(bodyColor, 1);
    const batW = drillLvl >= 4 ? 28 : 22;
    g.fillRoundedRect(46, -84, batW, 32, 5);

    this.drillSprite.add(g);
    this.drillSprite.setAngle(-22);
  }

  buildCrowbarSprite() {
    const drillLvl = Storage.getUpgradeLevel('drill');
    const barColor = drillLvl >= 4 ? 0x38bdf8 : drillLvl >= 2 ? 0xdc2626 : 0x64748b;

    this.crowbarSprite = this.add.container(0, 0).setDepth(45).setVisible(false);
    const g = this.add.graphics();

    g.fillStyle(0x94a3b8, 1);
    g.fillRoundedRect(-6, -12, 16, 24, 4);
    g.fillStyle(barColor, 1);
    g.fillRoundedRect(4, -8, 130, 14, 6);
    g.fillStyle(0x1c1917, 1);
    g.fillRoundedRect(85, -10, 48, 18, 6);

    this.crowbarSprite.add(g);
    this.crowbarSprite.setAngle(-28);
  }

  buildCrate() {
    this.crateContainer.removeAll(true);
    this.bolts = [];
    this.unscrewedCount = 0;
    this.lidOpened = false;
    this.coresCollected = 0;
    this.pryProgress = 0;
    this.isPrying = false;
    this.drillSprite.setVisible(false);
    this.crowbarSprite.setVisible(false);

    this.boxMode = Math.random() < 0.45 ? 'crowbar' : 'screws';
    this.subTxt.setText(`${this.contract.title} · Ящик ${this.currentBox} из ${this.totalBoxes}`);

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
        AudioManager.playCorePickup();
        this.particles.emitParticleAt(
          this.crateContainer.x + core.x,
          this.crateContainer.y + core.y,
          10
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
    lid.fillStyle(this.boxMode === 'crowbar' ? 0x78350f : 0x92400e, 1);
    lid.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
    lid.lineStyle(3, 0x451a03, 1);
    lid.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);

    for (let y = -boxH / 2 + 76; y < boxH / 2; y += 76) {
      lid.lineBetween(-boxW / 2 + 6, y, boxW / 2 - 6, y);
    }

    const modeTag = this.boxMode === 'crowbar' ? 'ЗАКОЛОЧЕНО ГВОЗДЯМИ' : 'НА САМОРЕЗАХ';
    const stamp = this.add.text(0, 0, `ПРОБА: ${this.contract.rock.name.toUpperCase()}\n${modeTag}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#fef3c7',
      align: 'center',
      backgroundColor: '#451a03bb',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5);

    this.lidContainer.add([lid, stamp]);
    this.crateContainer.add(this.lidContainer);

    if (this.boxMode === 'screws') {
      const assistantLvl = Storage.getPerkLevel('assistant');
      const autoBolts = Math.min(3, Math.ceil(assistantLvl / 2));

      this.hintTxt.setText(
        autoBolts > 0
          ? `👷 Бригада стажёров скрутила ${autoBolts} болт(а)! Докрути остальные`
          : 'Зажми по очереди 4 болта шуруповёртом'
      );

      const offsetX = boxW / 2 - 28;
      const offsetY = boxH / 2 - 28;
      const corners = [
        { x: -offsetX, y: -offsetY },
        { x: offsetX, y: -offsetY },
        { x: -offsetX, y: offsetY },
        { x: offsetX, y: offsetY }
      ];

      corners.forEach((pt, idx) => {
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

        if (idx < autoBolts) {
          bolt.done = true;
          this.unscrewedCount += 1;
          this.time.delayedCall(220 + idx * 180, () => {
            if (!bolt.active) return;
            AudioManager.playLatchSnap();
            this.particles.emitParticleAt(
              this.crateContainer.x + bolt.x,
              this.crateContainer.y + bolt.y,
              6
            );
            this.tweens.add({
              targets: bolt,
              x: bolt.x + (bolt.x < 0 ? -70 : 70),
              y: bolt.y - 40,
              alpha: 0,
              angle: 240,
              duration: 300
            });
          });
        }
      });
    } else {
      const assistantLvl = Storage.getPerkLevel('assistant');
      if (assistantLvl > 0) {
        this.pryProgress = Math.min(0.65, 0.25 + assistantLvl * 0.08);
        this.lidContainer.x = -this.pryProgress * 18;
        this.lidContainer.angle = -this.pryProgress * 4;
      }

      this.hintTxt.setText(
        assistantLvl > 0
          ? '👷 Стажёр уже подцепил крышку! Дожми скобу ломиком!'
          : 'Зажми или быстро тапай по скобе сбоку,\nчтобы поддеть и сорвать крышку ломиком!'
      );

      const pryX = boxW / 2 - 14;
      const pryY = 0;

      const notch = this.add.graphics();
      notch.fillStyle(0x1c1917, 1);
      notch.fillRoundedRect(pryX - 18, pryY - 34, 24, 68, 6);
      notch.lineStyle(2, 0xfacc15, 0.9);
      notch.strokeRoundedRect(pryX - 18, pryY - 34, 24, 68, 6);

      const pryLabel = this.add.text(pryX - 42, pryY, 'ПОДДЕТЬ →', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        fontWeight: '700',
        color: '#facc15',
        backgroundColor: '#1c1917cc',
        padding: { x: 6, y: 4 }
      }).setOrigin(1, 0.5);

      const pryZone = this.add.zone(pryX - 20, pryY, 90, 110).setInteractive({ useHandCursor: true });

      pryZone.on('pointerdown', () => {
        if (this.lidOpened) return;
        this.isPrying = true;
        const drillLvl = Storage.getUpgradeLevel('drill');
        this.pryProgress = Math.min(1, this.pryProgress + 0.16 + (drillLvl - 1) * 0.03);
        AudioManager.playCrowbarPry();
        this.particles.emitParticleAt(this.crateContainer.x + pryX, this.crateContainer.y, 6);
        this.checkCrowbarBreak();
      });

      pryZone.on('pointerup', () => { this.isPrying = false; });
      pryZone.on('pointerout', () => { this.isPrying = false; });

      this.lidContainer.add([notch, pryLabel, pryZone]);
    }
  }

  checkCrowbarBreak() {
    if (this.pryProgress >= 1 && !this.lidOpened) {
      this.lidOpened = true;
      this.isPrying = false;
      this.crowbarSprite.setVisible(false);
      AudioManager.playRockCrack();
      this.cameras.main.shake(140, 0.008);
      this.hintTxt.setText('Крышка сорвана! Кликни по каждому керну');

      this.tweens.add({
        targets: this.lidContainer,
        x: -360,
        y: -240,
        alpha: 0,
        angle: -24,
        duration: 380,
        ease: 'Back.easeIn'
      });
    }
  }

  update(time, delta) {
    if (this.lidOpened) return;

    const drillLvl = Storage.getUpgradeLevel('drill');

    if (this.boxMode === 'crowbar') {
      const pryWorldX = this.crateContainer.x + 140;
      const pryWorldY = this.crateContainer.y;

      if (this.isPrying) {
        this.pryProgress = Math.min(1, this.pryProgress + (0.55 + (drillLvl - 1) * 0.12) * (delta / 1000));
        this.crowbarSprite.setVisible(true);
        this.crowbarSprite.setPosition(pryWorldX, pryWorldY);
        this.crowbarSprite.setAngle(-28 + this.pryProgress * 34);
        this.lidContainer.x = -this.pryProgress * 18;
        this.lidContainer.angle = -this.pryProgress * 4;

        this.drillTickTimer += delta;
        if (this.drillTickTimer >= 95) {
          this.drillTickTimer = 0;
          AudioManager.playCrowbarPry();
        }

        this.checkCrowbarBreak();
      } else {
        this.crowbarSprite.setVisible(false);
      }
      return;
    }

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

    if (this.contract?.isExpedition) {
      const foundGem = rollWeightedInclusion(this.contract.guaranteedMinGemIdx || 3);
      Storage.addGem(foundGem);
      this.showRareGemModal(foundGem);
      return;
    }

    const gemChance = Storage.hasRnd('rnd_tomography') ? 0.25 : 0.09;
    if (Math.random() < gemChance) {
      const foundGem = rollWeightedInclusion(0);
      Storage.addGem(foundGem);
      this.showRareGemModal(foundGem);
      return;
    }

    this.hintTxt.setText('Керны отправлены на отрезной станок!');
    this.time.delayedCall(450, () => {
      this.scene.start('PrepScene', { contract: this.contract });
    });
  }

  showRareGemModal(gem) {
    const { width, height } = this.scale;
    AudioManager.playStamp();

    this.add.zone(width / 2, height / 2, width, height)
      .setInteractive()
      .setDepth(59);

    const modalGroup = this.add.container(0, 0).setDepth(60).setAlpha(0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0b101b, 0.94);
    overlay.fillRect(0, 0, width, height);

    const cardW = 362;
    const cardH = 420;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2;

    const card = this.add.graphics();
    card.fillStyle(0x1e293b, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 16);
    card.lineStyle(3, gem.color, 1);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    const tHeader = this.add.text(width / 2, cardY + 28, '✨ НАХОДКА В КЕРНЕ!', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0.5);

    const tRarity = this.add.text(width / 2, cardY + 56, `Редкость: ${gem.rarity.toUpperCase()}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      fontWeight: '700',
      color: '#38bdf8',
      backgroundColor: '#0f172a',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5);

    // Пьедестал и вращающийся 3D-образец минерала
    const glow = this.add.circle(width / 2, cardY + 136, 56, gem.color, 0.16);
    const mineralObj = MineralRenderer.createMineralDisplay(this, width / 2, cardY + 136, gem.id, 1.55, true);

    const spinHint = this.add.text(width / 2, cardY + 198, '🔄 Покрути образец пальцем!', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const tName = this.add.text(width / 2, cardY + 228, gem.name, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: cardW - 36 }
    }).setOrigin(0.5);

    const hasShowcase = Storage.getPerkLevel('showcase') > 0;
    const storageHint = hasShowcase
      ? 'Образец отправлен на склад.\nНажми на него в витрине, чтобы осмотреть в 3D или выставить на полку!'
      : 'Образец сохранён на складе лаборатории.\nКупи витрину в Магазине (со 2-го ур. лабы), чтобы выставить его!';

    const tDesc = this.add.text(width / 2, cardY + 286, storageHint, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      color: '#cbd5e1',
      align: 'center',
      lineSpacing: 4,
      wordWrap: { width: cardW - 36 }
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, cardY + cardH - 34, 'ПОДОЖДИТЕ...', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#94a3b8',
      backgroundColor: '#334155',
      padding: { x: 18, y: 11 }
    }).setOrigin(0.5);

    modalGroup.add([overlay, card, tHeader, tRarity, glow, mineralObj, spinHint, tName, tDesc, btn]);

    this.tweens.add({
      targets: modalGroup,
      alpha: 1,
      duration: 220
    });

    this.time.delayedCall(850, () => {
      if (!btn.active) return;
      btn.setText('ПРОДОЛЖИТЬ ПОДГОТОВКУ →');
      btn.setColor('#0f172a');
      btn.setBackgroundColor('#facc15');
      btn.setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        AudioManager.playClick();
        this.scene.start('PrepScene', { contract: this.contract });
      });
    });
  }
}
