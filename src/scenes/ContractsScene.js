import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { PlatformSDK } from '../utils/PlatformSDK.js';
import { AchievementManager } from '../utils/AchievementManager.js';
import { TutorialManager } from '../utils/TutorialManager.js';
import {
  generateContractBoard,
  TEST_CATALOG,
  MEGA_PROJECTS,
  generateMegaStageContract,
  EXPEDITIONS_CATALOG,
  generateExpeditionContract
} from '../data/contracts.js';

export class ContractsScene extends Phaser.Scene {
  constructor() {
    super('ContractsScene');
    this.contracts = [];
    this.mode = 'regular';
  }

  init(data) {
    if (data?.mode === 'mega') this.mode = 'mega';
    else if (data?.mode === 'expeditions') this.mode = 'expeditions';
    else this.mode = 'regular';
  }

  create() {
    const { width, height } = this.scale;
    const safeTop = window.__SAFE_TOP__ || 0;
    const labLvl = Storage.getLabLevel();
    const completed = Storage.getState().completedContracts;

    const bg = this.add.graphics();
    bg.fillStyle(0x181e29, 1);
    bg.fillRect(0, 0, width, height);

    const barH = 64 + safeTop;
    const header = this.add.graphics();
    header.fillStyle(0x14161b, 1);
    header.fillRect(0, 0, width, barH);

    const contentY = safeTop + 32;
    const backBtn = this.add.text(16, contentY, '← В ЛАБУ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fde68a',
      backgroundColor: '#27272a',
      padding: { x: 11, y: 7 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this.scene.start('MenuScene');
    });

    this.energyBadge = this.add.text(width - 150, contentY, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#38bdf8',
      padding: { x: 9, y: 6 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    this.energyBadge.on('pointerdown', () => {
      AudioManager.playClick();
      this.openEnergyRefillModal();
    });

    this.balTxt = this.add.text(width - 16, contentY, '', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0.5);

    const tabY = barH + 28;
    const gap = 5;
    const tabW = (width - 36 - gap * 2) / 3;

    this.regTabBtn = this.add.text(18 + tabW / 2, tabY, '📋 ЗАКАЗЫ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      fixedWidth: tabW,
      align: 'center',
      padding: { x: 2, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.megaTabBtn = this.add.text(18 + tabW * 1.5 + gap, tabY, '🏗️ СТРОЙКИ ВЕКА', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      fixedWidth: tabW,
      align: 'center',
      padding: { x: 2, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.expTabBtn = this.add.text(18 + tabW * 2.5 + gap * 2, tabY, '🚁 ЭКСПЕДИЦИИ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      fixedWidth: tabW,
      align: 'center',
      padding: { x: 2, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.regTabBtn.on('pointerdown', () => {
      if (this.mode !== 'regular') {
        AudioManager.playClick();
        this.mode = 'regular';
        this.refreshBoard();
      }
    });

    this.megaTabBtn.on('pointerdown', () => {
      if (this.mode !== 'mega') {
        AudioManager.playClick();
        this.mode = 'mega';
        this.refreshBoard();
      }
    });

    this.expTabBtn.on('pointerdown', () => {
      if (this.mode !== 'expeditions') {
        AudioManager.playClick();
        this.mode = 'expeditions';
        this.refreshBoard();
      }
    });

    this.cardsContainer = this.add.container(0, 0);
    this.contracts = generateContractBoard(labLvl, completed, 3);

    const pendingTender = Storage.getPendingTender();
    if (pendingTender) {
      this.contracts[0] = pendingTender;
    }

    this.refreshBtn = this.add.text(width / 2, height - 38, '🔄 ОБНОВИТЬ ЗАКАЗЫ (БЕСПЛАТНО)', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#e2e8f0',
      backgroundColor: '#334155',
      padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.refreshBtn.on('pointerdown', () => {
      AudioManager.playClick();
      Storage.clearPendingTender();
      this.contracts = generateContractBoard(labLvl, completed, 3);
      this.refreshBoard();
    });

    this.refreshBoard();

    if (TutorialManager.isActive()) {
      const firstCnt = this.contracts[0];
      if (firstCnt) {
        firstCnt.tests = ['uniaxial'];
        firstCnt.boxesCount = 1;
        this.refreshBoard();
      }
      TutorialManager.advanceTo(1);
      TutorialManager.showSpotlight(this, {
        hole: { x: width / 2, y: barH + 151, w: width - 28, h: 194 },
        cardY: barH + 366,
        badge: 'ШАГ 2/8 · ДОСКА ЗАКАЗОВ',
        text: `Обрати внимание на «Норму объекта: ≥ ${firstCnt?.reqMpa || 25} МПа».\nНажми «ВЗЯТЬ В РАБОТУ →», чтобы принять пробы в цех!`
      });
    }
  }

  updateTopBadges() {
    const curE = Storage.getEnergy();
    const maxE = Storage.getMaxEnergy();
    this.energyBadge.setText(`⚡ ${curE}/${maxE}`);
    this.energyBadge.setBackgroundColor(curE < 15 ? '#f87171' : '#38bdf8');
    this.balTxt.setText(`💰 ${Storage.getMoney()} ₽`);
  }

  trySpendEnergyAndLaunch(energyCost, onSuccess) {
    const actualCost = TutorialManager.isActive() ? 0 : energyCost;
    if (Storage.spendEnergy(actualCost)) {
      this.updateTopBadges();
      onSuccess();
    } else {
      AudioManager.playClick();
      this.openEnergyRefillModal(energyCost);
    }
  }

  openEnergyRefillModal(neededEnergy = 0) {
    if (this._energyModalOpen) return;
    this._energyModalOpen = true;
    const { width, height } = this.scale;
    const modal = this.add.container(0, 0).setDepth(90);

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    const dim = this.add.graphics();
    dim.fillStyle(0x090d16, 0.92);
    dim.fillRect(0, 0, width, height);

    const cardW = 364;
    const cardH = 310;
    const cx = width / 2;
    const cy = height / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    panel.lineStyle(2.5, 0x38bdf8, 1);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);

    const curE = Storage.getEnergy();
    const maxE = Storage.getMaxEnergy();
    const refillCost = Storage.getEnergyRefillCost();
    const canPay = Storage.getMoney() >= refillCost && curE < maxE;

    const title = this.add.text(cx, cy - 122, `⚡ ЭНЕРГИЯ СМЕНЫ: ${curE}/${maxE}`, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '17px',
      fontWeight: '700',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const infoText = neededEnergy > 0
      ? `Для этого задания нужно ${neededEnergy} ⚡ (сейчас ${curE} ⚡).\nВосстанавливается сама: +1 ⚡ каждые 2 минуты.`
      : 'Энергия тратится на приём заказов и экспедиций.\nВосстанавливается сама: +1 ⚡ каждые 2 минуты.';

    const desc = this.add.text(cx, cy - 72, infoText, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      color: '#e2e8f0',
      align: 'center',
      lineSpacing: 4,
      wordWrap: { width: cardW - 36 }
    }).setOrigin(0.5);

    const adBtn = this.add.text(cx, cy - 10, '🎬 КОФЕ-БРЕЙК ЗА РЕКЛАМУ (+45 ⚡)', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#0f172a',
      backgroundColor: '#4ade80',
      padding: { x: 16, y: 11 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    adBtn.on('pointerdown', () => {
      adBtn.disableInteractive();
      PlatformSDK.showRewarded(() => {
        Storage.addEnergy(45);
        AudioManager.playStamp();
        this.updateTopBadges();
        this._energyModalOpen = false;
        modal.destroy();
      });
    });

    const coinBtn = this.add.text(
      cx,
      cy + 46,
      curE >= maxE ? '✅ ЗАПАС ЭНЕРГИИ ПОЛОН' : `☕ ЭСПРЕССО-СЕТ: ПОЛНЫЙ БАК (${refillCost} ₽)`,
      {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: canPay ? '#0f172a' : '#94a3b8',
        backgroundColor: canPay ? '#facc15' : '#334155',
        padding: { x: 16, y: 10 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: canPay });

    if (canPay) {
      coinBtn.on('pointerdown', () => {
        if (Storage.spendMoney(refillCost)) {
          Storage.addEnergy(maxE);
          AudioManager.playLatchSnap();
          this.updateTopBadges();
          this._energyModalOpen = false;
          modal.destroy();
        }
      });
    }

    const closeBtn = this.add.text(cx, cy + 114, 'ЗАКРЫТЬ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      color: '#ffffff',
      backgroundColor: '#475569',
      padding: { x: 24, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      AudioManager.playClick();
      this._energyModalOpen = false;
      modal.destroy();
    });

    modal.add([blocker, dim, panel, title, desc, adBtn, coinBtn, closeBtn]);
  }

  refreshBoard() {
    this.updateTopBadges();

    this.regTabBtn.setColor(this.mode === 'regular' ? '#1c1917' : '#e2e8f0');
    this.regTabBtn.setBackgroundColor(this.mode === 'regular' ? '#facc15' : '#292524');

    this.megaTabBtn.setColor(this.mode === 'mega' ? '#0f172a' : '#fef08a');
    this.megaTabBtn.setBackgroundColor(this.mode === 'mega' ? '#38bdf8' : '#1e293b');

    this.expTabBtn.setColor(this.mode === 'expeditions' ? '#0f172a' : '#7dd3fc');
    this.expTabBtn.setBackgroundColor(this.mode === 'expeditions' ? '#34d399' : '#1e293b');

    this.refreshBtn.setVisible(this.mode === 'regular');

    if (this.mode === 'mega') {
      this.renderMegaProjects();
    } else if (this.mode === 'expeditions') {
      this.renderExpeditions();
    } else {
      this.renderCards();
    }
  }

  renderExpeditions() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;
    const safeTop = window.__SAFE_TOP__ || 0;
    const startTop = 122 + safeTop;
    const money = Storage.getMoney();
    const hasCompletedMega = Storage.getCompletedMegasCount() >= 1;
    const expEnergyCost = 30;

    if (!hasCompletedMega) {
      const lockCard = this.add.graphics();
      lockCard.fillStyle(0x1e293b, 1);
      lockCard.fillRoundedRect(24, startTop + 58, width - 48, 250, 16);
      lockCard.lineStyle(2, 0xfacc15, 0.9);
      lockCard.strokeRoundedRect(24, startTop + 58, width - 48, 250, 16);

      const lockIcon = this.add.text(width / 2, startTop + 110, '🔒 🚁', {
        fontSize: '36px'
      }).setOrigin(0.5);

      const lockTitle = this.add.text(width / 2, startTop + 160, 'БУРОВЫЕ ЭКСПЕДИЦИИ ЗАКРЫТЫ', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '16px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);

      const lockDesc = this.add.text(
        width / 2,
        startTop + 223,
        'Чтобы финансировать собственные буровые партии в Арктику и Якутию,\nсначала завершите полностью хотя бы 1 «Стройку века»!',
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '12px',
          color: '#cbd5e1',
          align: 'center',
          lineSpacing: 5,
          wordWrap: { width: width - 84 }
        }
      ).setOrigin(0.5);

      this.cardsContainer.add([lockCard, lockIcon, lockTitle, lockDesc]);
      return;
    }

    EXPEDITIONS_CATALOG.forEach((exp, idx) => {
      const y = startTop + idx * 198;
      const cardW = width - 36;
      const cardH = 186;
      const x = 18;
      const daysLeft = Storage.getExpeditionCooldownLeft(exp.id, exp.cooldownDays);
      const isReady = daysLeft <= 0;
      const canAfford = isReady && money >= exp.cost;

      const card = this.add.graphics();
      card.fillStyle(0x0f172a, 1);
      card.fillRoundedRect(x, y, cardW, cardH, 12);
      card.lineStyle(2, canAfford ? 0x34d399 : isReady ? 0x64748b : 0x334155, 1);
      card.strokeRoundedRect(x, y, cardW, cardH, 12);

      const title = this.add.text(x + 14, y + 14, `${exp.icon} ${exp.title}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '15px',
        fontWeight: '700',
        color: '#fef3c7'
      });

      const cdBadge = this.add.text(
        x + cardW - 14,
        y + 15,
        isReady ? `⏱️ Раз в ${exp.cooldownDays} дн.` : `⏳ Через ${daysLeft} дн.`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          fontWeight: '700',
          color: isReady ? '#38bdf8' : '#f87171'
        }
      ).setOrigin(1, 0);

      const regionTxt = this.add.text(x + 14, y + 36, exp.region, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: '600',
        color: '#34d399'
      });

      const descTxt = this.add.text(x + 14, y + 58, exp.desc, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#cbd5e1',
        wordWrap: { width: cardW - 28 }
      });

      const lootTxt = this.add.text(
        x + 14,
        y + 102,
        `Награда: +${exp.payout} ₽  ★+${exp.rep}  |  💎 Редкий образец`,
        {
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          fontWeight: '700',
          color: '#facc15'
        }
      );

      const btnW = cardW - 28;
      const btnH = 38;
      const btnX = x + 14;
      const btnY = y + cardH - btnH - 12;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(canAfford ? 0x059669 : 0x334155, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);

      let btnText = `🚁 СНАРЯДИТЬ (-${exp.cost} ₽ · ⚡ ${expEnergyCost})`;
      if (!isReady) btnText = `⏳ БУРОВАЯ НА ТО (ЕЩЁ ${daysLeft} ЗАКАЗ.)`;
      else if (!canAfford) btnText = `НЕДОСТАТОЧНО СРЕДСТВ (${exp.cost} ₽)`;

      const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, btnText, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: canAfford ? '#ffffff' : '#94a3b8'
      }).setOrigin(0.5);

      this.cardsContainer.add([card, title, cdBadge, regionTxt, descTxt, lootTxt, btnBg, btnLabel]);

      if (canAfford) {
        const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
          .setInteractive({ useHandCursor: true });

        hitZone.on('pointerdown', () => {
          this.trySpendEnergyAndLaunch(expEnergyCost, () => {
            if (Storage.spendMoney(exp.cost)) {
              Storage.markExpeditionLaunched(exp.id);
              const contract = generateExpeditionContract(exp.id);
              AudioManager.playStamp();
              AchievementManager.unlock(this, 'polar_driller');
              Storage.setActiveContract(contract);
              this.scene.start('UnpackScene', { contract });
            }
          });
        });

        this.cardsContainer.add(hitZone);
      }
    });
  }

  renderMegaProjects() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;
    const safeTop = window.__SAFE_TOP__ || 0;
    const startTop = 122 + safeTop;
    const labLvl = Storage.getLabLevel();
    const staffLvl = Storage.getPerkLevel('assistant');
    const megaEnergyCost = 25;

    MEGA_PROJECTS.forEach((proj, idx) => {
      const y = startTop + idx * 158;
      const cardW = width - 36;
      const cardH = 148;
      const x = 18;

      const curStageIdx = Storage.getMegaStage(proj.id);
      const totalStages = proj.stages.length;
      const isDone = Storage.isMegaCompleted(proj.id) || curStageIdx >= totalStages;
      const labOk = labLvl >= proj.reqLab;
      const staffOk = staffLvl >= proj.reqStaff;
      const canStart = !isDone && labOk && staffOk;

      const card = this.add.graphics();
      card.fillStyle(isDone ? 0x14532d : 0x1e293b, 1);
      card.fillRoundedRect(x, y, cardW, cardH, 12);
      card.lineStyle(2, isDone ? 0x4ade80 : canStart ? 0x38bdf8 : 0x475569, 1);
      card.strokeRoundedRect(x, y, cardW, cardH, 12);

      const title = this.add.text(x + 14, y + 14, `${proj.icon} ${proj.title}`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#fef3c7'
      });

      const rewardTxt = this.add.text(x + cardW - 14, y + 14, `🏆 +${proj.finalBonus} ₽`, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(1, 0);

      const stageObj = proj.stages[Math.min(curStageIdx, totalStages - 1)];
      const subLine = isDone
        ? `✅ ОБЪЕКТ СДАН В ЭКСПЛУАТАЦИЮ (${totalStages}/${totalStages} этапов)`
        : `${stageObj.name} · Норма ≥ ${stageObj.reqMpa} МПа`;

      const subTxt = this.add.text(x + 14, y + 36, subLine, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: '600',
        color: isDone ? '#4ade80' : '#7dd3fc'
      });

      const segGap = 6;
      const segW = (cardW - 28 - segGap * (totalStages - 1)) / totalStages;
      for (let s = 0; s < totalStages; s++) {
        const sx = x + 14 + s * (segW + segGap);
        const completedSeg = s < curStageIdx || isDone;
        const activeSeg = s === curStageIdx && !isDone;
        card.fillStyle(completedSeg ? 0x22c55e : activeSeg ? 0xfacc15 : 0x334155, 1);
        card.fillRoundedRect(sx, y + 58, segW, 10, 4);
      }

      const testsStr = isDone
        ? proj.desc
        : `Стенды этапа: ${stageObj.tests.map((k) => TEST_CATALOG[k]?.short || k).join(' + ')}`;

      const infoTxt = this.add.text(x + 14, y + 76, testsStr, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        color: '#cbd5e1',
        wordWrap: { width: cardW - 28 }
      });

      let btnText = `ЭТАП ${curStageIdx + 1}/${totalStages} (+${proj.stageReward} ₽ · ⚡ ${megaEnergyCost})`;
      if (isDone) btnText = '🏆 МЕГА-ПРОЕКТ ЗАВЕРШЁН';
      else if (!labOk) btnText = `НУЖНА ЛАБА Ур. ${proj.reqLab}`;
      else if (!staffOk) btnText = `НУЖЕН ШТАТ Ур. ${proj.reqStaff}`;

      const btnW = cardW - 28;
      const btnH = 32;
      const btnX = x + 14;
      const btnY = y + cardH - btnH - 10;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(isDone ? 0x15803d : canStart ? 0xd97706 : 0x334155, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);

      const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, btnText, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: canStart || isDone ? '#ffffff' : '#94a3b8'
      }).setOrigin(0.5);

      this.cardsContainer.add([card, title, rewardTxt, subTxt, infoTxt, btnBg, btnLabel]);

      if (canStart) {
        const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
          .setInteractive({ useHandCursor: true });

        hitZone.on('pointerdown', () => {
          this.trySpendEnergyAndLaunch(megaEnergyCost, () => {
            const contract = generateMegaStageContract(proj.id, curStageIdx);
            if (!contract) return;
            AudioManager.playStamp();
            Storage.setActiveContract(contract);
            this.scene.start('UnpackScene', { contract });
          });
        });

        this.cardsContainer.add(hitZone);
      }
    });
  }

  renderCards() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;
    const safeTop = window.__SAFE_TOP__ || 0;
    const startTop = 122 + safeTop;
    const regEnergyCost = TutorialManager.isActive() ? 0 : 15;

    this.contracts.forEach((cnt, idx) => {
      const y = startTop + idx * 198;
      const cardW = width - 36;
      const cardH = 186;
      const x = 18;

      const cardBg = this.add.graphics();
      const isAudit = Boolean(cnt.isAudit);
      const isTender = Boolean(cnt.isTender);
      const paperColor = isAudit ? 0xdbeafe : isTender ? 0xfef08a : cnt.isVip ? 0xfde68a : 0xfef3c7;
      const borderColor = isAudit ? 0x1d4ed8 : isTender ? 0xb91c1c : cnt.isVip ? 0xd97706 : 0x78350f;

      cardBg.fillStyle(paperColor, 1);
      cardBg.fillRoundedRect(x, y, cardW, cardH, 10);
      cardBg.lineStyle(isAudit || cnt.isVip || isTender ? 3 : 2, borderColor, 1);
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
        fontFamily: '"Rubik", sans-serif',
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
          fontFamily: '"Rubik", sans-serif',
          fontSize: '12px',
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

      const btnW = 216;
      const btnH = 36;
      const btnX = x + cardW - btnW - 12;
      const btnY = y + cardH - btnH - 10;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(isAudit ? 0x1d4ed8 : 0x15803d, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);

      const btnText = isAudit
        ? `ПРОЙТИ АУДИТ (⚡ ${regEnergyCost}) →`
        : `ВЗЯТЬ В РАБОТУ (⚡ ${regEnergyCost}) →`;

      const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, btnText, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '12px',
        fontWeight: '700',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        this.trySpendEnergyAndLaunch(regEnergyCost, () => {
          AudioManager.playStamp();
          if (cnt.isTender) {
            Storage.clearPendingTender();
          }
          Storage.setActiveContract(cnt);
          this.scene.start('UnpackScene', { contract: cnt });
        });
      });

      this.cardsContainer.add([
        cardBg, compText, rewardText, titleText, rockText, normText, testsText, btnBg, btnLabel, hitZone
      ]);
    });
  }
}
