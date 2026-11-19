import { Storage } from '../utils/Storage.js';
import { AudioManager } from '../utils/AudioManager.js';
import { AchievementManager } from '../utils/AchievementManager.js';
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

    this.balTxt = this.add.text(width - 20, 22, `💰 ${Storage.getMoney()} ₽ · ★ ${Storage.getReputation()}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(1, 0);

    const gap = 5;
    const tabW = (width - 36 - gap * 2) / 3;

    this.regTabBtn = this.add.text(18 + tabW / 2, 92, '📋 ЗАКАЗЫ', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      fixedWidth: tabW,
      align: 'center',
      padding: { x: 2, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.megaTabBtn = this.add.text(18 + tabW * 1.5 + gap, 92, '🏗️ СТРОЙКИ ВЕКА', {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '11px',
      fontWeight: '700',
      fixedWidth: tabW,
      align: 'center',
      padding: { x: 2, y: 9 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.expTabBtn = this.add.text(18 + tabW * 2.5 + gap * 2, 92, '🚁 ЭКСПЕДИЦИИ', {
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
  }

  refreshBoard() {
    this.balTxt.setText(`💰 ${Storage.getMoney()} ₽ · ★ ${Storage.getReputation()}`);

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
    const { width, height } = this.scale;
    const money = Storage.getMoney();
    const hasCompletedMega = Storage.getCompletedMegasCount() >= 1;

    if (!hasCompletedMega) {
      const lockCard = this.add.graphics();
      lockCard.fillStyle(0x1e293b, 1);
      lockCard.fillRoundedRect(24, 180, width - 48, 250, 16);
      lockCard.lineStyle(2, 0xfacc15, 0.9);
      lockCard.strokeRoundedRect(24, 180, width - 48, 250, 16);

      const lockIcon = this.add.text(width / 2, 232, '🔒 🚁', {
        fontSize: '36px'
      }).setOrigin(0.5);

      const lockTitle = this.add.text(width / 2, 282, 'БУРОВЫЕ ЭКСПЕДИЦИИ ЗАКРЫТЫ', {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '16px',
        fontWeight: '700',
        color: '#facc15'
      }).setOrigin(0.5);

      const lockDesc = this.add.text(
        width / 2,
        345,
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
      const y = 122 + idx * 198;
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
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
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
        `Награда за анализ: +${exp.payout} ₽  ★+${exp.rep}  |  💎 Гарант. редкий образец`,
        {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
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

      let btnText = `🚁 СНАРЯДИТЬ ПАРТИЮ (-${exp.cost} ₽)`;
      if (!isReady) btnText = `⏳ БУРОВАЯ НА ТЕХОБСЛУЖИВАНИИ (ЕЩЁ ${daysLeft} ЗАКАЗ.)`;
      else if (!canAfford) btnText = `НЕДОСТАТОЧНО СРЕДСТВ (${exp.cost} ₽)`;

      const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, btnText, {
        fontFamily: '"Rubik", sans-serif',
        fontSize: '11px',
        fontWeight: '700',
        color: canAfford ? '#ffffff' : '#94a3b8'
      }).setOrigin(0.5);

      this.cardsContainer.add([card, title, cdBadge, regionTxt, descTxt, lootTxt, btnBg, btnLabel]);

      if (canAfford) {
        const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
          .setInteractive({ useHandCursor: true });

        hitZone.on('pointerdown', () => {
          if (Storage.spendMoney(exp.cost)) {
            Storage.markExpeditionLaunched(exp.id);
            const contract = generateExpeditionContract(exp.id);
            AudioManager.playStamp();
            AchievementManager.unlock(this, 'polar_driller');
            Storage.setActiveContract(contract);
            this.scene.start('UnpackScene', { contract });
          }
        });

        this.cardsContainer.add(hitZone);
      }
    });
  }

  renderMegaProjects() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;
    const labLvl = Storage.getLabLevel();
    const staffLvl = Storage.getPerkLevel('assistant');

    MEGA_PROJECTS.forEach((proj, idx) => {
      const y = 122 + idx * 158;
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
        fontFamily: '"JetBrains Mono", monospace',
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
        fontSize: '10px',
        color: '#cbd5e1',
        wordWrap: { width: cardW - 28 }
      });

      let btnText = `НАЧАТЬ ЭТАП ${curStageIdx + 1}/${totalStages} (+${proj.stageReward} ₽)`;
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
          const contract = generateMegaStageContract(proj.id, curStageIdx);
          if (!contract) return;
          AudioManager.playStamp();
          Storage.setActiveContract(contract);
          this.scene.start('UnpackScene', { contract });
        });

        this.cardsContainer.add(hitZone);
      }
    });
  }

  renderCards() {
    this.cardsContainer.removeAll(true);
    const { width } = this.scale;

    this.contracts.forEach((cnt, idx) => {
      const y = 122 + idx * 198;
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
        if (cnt.isTender) {
          Storage.clearPendingTender();
        }
        Storage.setActiveContract(cnt);
        this.scene.start('UnpackScene', { contract: cnt });
      });

      this.cardsContainer.add([
        cardBg, compText, rewardText, titleText, rockText, normText, testsText, btnBg, btnLabel, hitZone
      ]);
    });
  }
}
