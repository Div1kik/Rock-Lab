const SAVE_KEY = 'rocklab_save_v1';

const DEFAULT_STATE = {
  playerId: null,
  playerName: null,
  tutorialCompleted: false,
  tutorialStep: 0,
  money: 150,
  reputation: 10,
  energy: 100,
  energyUpdatedAt: Date.now(),
  dailyStreakDay: 0,
  lastDailyClaimDate: '',
  globalScore: 0,
  perfectStreak: 0,
  bestStreak: 0,
  perfectProtocols: 0,
  completedContracts: 0,
  contractsSinceAudit: 0,
  labLevel: 1,
  upgrades: {
    drill: 1,
    saw: 1,
    grinder: 1,
    caliper: 1,
    caliper_auto: 0,
    press: 1,
    sensors: 1,
    loader: 1
  },
  caliperAutoMode: true,
  perks: {
    coffee: 0,
    showcase: 0,
    assistant: 0,
    decor: 0,
    cryobox: 0
  },
  rndOwned: [],
  decorOwned: [],
  decorDisabled: [],
  decorAds: {},
  activeSkin: 'default',
  activeLabTheme: 'default',
  wear: {
    saw: 100,
    grinder: 100,
    calibration: 100
  },
  auditBonusContracts: 0,
  unlockedTests: ['uniaxial', 'shear_cut'],
  unlockedMusicPacks: ['base'],
  enabledMusicPacks: ['base'],
  musicPackAds: {},
  musicPlayMode: 'playlist',
  foundGems: [],
  displayedGems: [],
  siteHistory: [],
  megaProgress: {},
  megaCompleted: [],
  expeditionLastDay: {},
  unlockedAchievements: [],
  guestLikesDate: '',
  guestLikedIds: [],
  soundEnabled: true,
  musicTrack: 0,
  activeContract: null,
  pendingTender: null
};

export const DAILY_REWARDS_CATALOG = [
  { day: 1, title: 'День 1 · Смена открыта', desc: '+250 ₽ на расходники', money: 250, rep: 0, score: 20 },
  { day: 2, title: 'День 2 · Утренний замер', desc: '+400 ₽ и ★ +2 репутации', money: 400, rep: 2, score: 30 },
  { day: 3, title: 'День 3 · Плановое ТО', desc: '+300 ₽ и полное ТО станков (100%)', money: 300, rep: 0, score: 40, fullRepair: true },
  { day: 4, title: 'День 4 · Премия НИИ', desc: '+650 ₽ и +60 к индексу ТОП', money: 650, rep: 0, score: 60 },
  { day: 5, title: 'День 5 · Признание ГОСТ', desc: '+800 ₽ и ★ +4 репутации', money: 800, rep: 4, score: 75 },
  { day: 6, title: 'День 6 · Грант коллегии', desc: '+1200 ₽ и +100 к индексу ТОП', money: 1200, rep: 2, score: 100 },
  { day: 7, title: 'День 7 · Главный трофей', desc: '+1500 ₽, ★ +5 и 💎 Редкий минерал!', money: 1500, rep: 5, score: 150, grantGem: true }
];

class StorageManager {
  constructor() {
    this.state = this.load();
    this.ensurePlayerIdentity();
    this.syncEnergy();
  }

  ensurePlayerIdentity() {
    let dirty = false;
    if (!this.state.playerId) {
      this.state.playerId = `gl_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;
      dirty = true;
    }
    if (!this.state.playerName) {
      const code = Math.floor(1000 + Math.random() * 9000);
      this.state.playerName = `Геолог #${code}`;
      dirty = true;
    }
    if (dirty) this.save();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      const mergedUpgrades = {
        ...DEFAULT_STATE.upgrades,
        ...(parsed.upgrades || {})
      };
      if (!mergedUpgrades.grinder || mergedUpgrades.grinder < 1) {
        mergedUpgrades.grinder = 1;
      }
      if (typeof parsed.upgrades?.caliper_auto !== 'number') {
        mergedUpgrades.caliper_auto = 0;
      }

      const foundGems = Array.isArray(parsed.foundGems) ? parsed.foundGems : [];
      const displayedGems = Array.isArray(parsed.displayedGems)
        ? parsed.displayedGems.filter((id) => foundGems.some((g) => g.id === id)).slice(0, 4)
        : foundGems.slice(0, 4).map((g) => g.id);

      const unlockedPacks = Array.isArray(parsed.unlockedMusicPacks) ? [...parsed.unlockedMusicPacks] : [];
      if (!unlockedPacks.includes('base')) unlockedPacks.unshift('base');

      const enabledPacks = Array.isArray(parsed.enabledMusicPacks) && parsed.enabledMusicPacks.length
        ? parsed.enabledMusicPacks.filter((id) => unlockedPacks.includes(id))
        : [...unlockedPacks];
      if (!enabledPacks.length) enabledPacks.push('base');

      const alreadyExperienced = (parsed.completedContracts || 0) > 0;
      const migratedGlobalScore = typeof parsed.globalScore === 'number'
        ? parsed.globalScore
        : Math.max(0, (parsed.completedContracts || 0) * 15 + (parsed.reputation || 0) * 10);

      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        energy: typeof parsed.energy === 'number' ? parsed.energy : 100,
        energyUpdatedAt: typeof parsed.energyUpdatedAt === 'number' ? parsed.energyUpdatedAt : Date.now(),
        dailyStreakDay: typeof parsed.dailyStreakDay === 'number' ? parsed.dailyStreakDay : 0,
        lastDailyClaimDate: parsed.lastDailyClaimDate || '',
        globalScore: migratedGlobalScore,
        perfectStreak: parsed.perfectStreak || 0,
        bestStreak: parsed.bestStreak || 0,
        perfectProtocols: parsed.perfectProtocols || 0,
        tutorialCompleted: typeof parsed.tutorialCompleted === 'boolean' ? parsed.tutorialCompleted : alreadyExperienced,
        tutorialStep: typeof parsed.tutorialStep === 'number' ? parsed.tutorialStep : 0,
        upgrades: mergedUpgrades,
        caliperAutoMode: parsed.caliperAutoMode !== false,
        perks: {
          ...DEFAULT_STATE.perks,
          ...(parsed.perks || {})
        },
        rndOwned: Array.isArray(parsed.rndOwned) ? parsed.rndOwned : [],
        decorOwned: Array.isArray(parsed.decorOwned) ? parsed.decorOwned : [],
        decorDisabled: Array.isArray(parsed.decorDisabled) ? parsed.decorDisabled : [],
        decorAds: parsed.decorAds && typeof parsed.decorAds === 'object' ? parsed.decorAds : {},
        activeSkin: parsed.activeSkin || 'default',
        activeLabTheme: parsed.activeLabTheme || 'default',
        wear: {
          ...DEFAULT_STATE.wear,
          ...(parsed.wear || {})
        },
        unlockedTests: Array.isArray(parsed.unlockedTests) && parsed.unlockedTests.length
          ? parsed.unlockedTests
          : [...DEFAULT_STATE.unlockedTests],
        unlockedMusicPacks: unlockedPacks,
        enabledMusicPacks: enabledPacks,
        musicPackAds: parsed.musicPackAds && typeof parsed.musicPackAds === 'object' ? parsed.musicPackAds : {},
        musicPlayMode: parsed.musicPlayMode === 'loop' ? 'loop' : 'playlist',
        foundGems,
        displayedGems,
        siteHistory: Array.isArray(parsed.siteHistory) ? parsed.siteHistory : [],
        megaProgress: parsed.megaProgress && typeof parsed.megaProgress === 'object' ? parsed.megaProgress : {},
        megaCompleted: Array.isArray(parsed.megaCompleted) ? parsed.megaCompleted : [],
        expeditionLastDay: parsed.expeditionLastDay && typeof parsed.expeditionLastDay === 'object' ? parsed.expeditionLastDay : {},
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
        guestLikesDate: parsed.guestLikesDate || '',
        guestLikedIds: Array.isArray(parsed.guestLikedIds) ? parsed.guestLikedIds : [],
        pendingTender: parsed.pendingTender || null
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  // ==================== ЭНЕРГИЯ ЛАБОРАТОРИИ ====================
  getMaxEnergy() {
    return 100 + this.getPerkLevel('coffee') * 10;
  }

  syncEnergy() {
    const maxE = this.getMaxEnergy();
    const now = Date.now();
    const regIntervalMs = 2 * 60 * 1000; // +1 энергия каждые 2 минуты

    if (typeof this.state.energy !== 'number') {
      this.state.energy = maxE;
      this.state.energyUpdatedAt = now;
      this.save();
      return this.state.energy;
    }

    if (this.state.energy >= maxE) {
      this.state.energyUpdatedAt = now;
      return this.state.energy;
    }

    const elapsed = Math.max(0, now - (this.state.energyUpdatedAt || now));
    const gained = Math.floor(elapsed / regIntervalMs);
    if (gained > 0) {
      this.state.energy = Math.min(maxE, this.state.energy + gained);
      this.state.energyUpdatedAt = (this.state.energyUpdatedAt || now) + gained * regIntervalMs;
      if (this.state.energy >= maxE) {
        this.state.energyUpdatedAt = now;
      }
      this.save();
    }
    return this.state.energy;
  }

  getEnergy() {
    return this.syncEnergy();
  }

  getSecondsToNextEnergy() {
    const maxE = this.getMaxEnergy();
    if (this.getEnergy() >= maxE) return 0;
    const regIntervalMs = 2 * 60 * 1000;
    const elapsed = Math.max(0, Date.now() - (this.state.energyUpdatedAt || Date.now()));
    return Math.max(1, Math.ceil((regIntervalMs - (elapsed % regIntervalMs)) / 1000));
  }

  spendEnergy(amount) {
    if (amount <= 0) return true;
    const cur = this.syncEnergy();
    if (cur < amount) return false;
    const maxE = this.getMaxEnergy();
    if (cur >= maxE) {
      this.state.energyUpdatedAt = Date.now();
    }
    this.state.energy = Math.max(0, cur - amount);
    this.save();
    return true;
  }

  addEnergy(amount) {
    const cur = this.syncEnergy();
    const maxE = this.getMaxEnergy();
    this.state.energy = Math.min(maxE, cur + Math.max(0, Math.round(amount)));
    if (this.state.energy >= maxE) {
      this.state.energyUpdatedAt = Date.now();
    }
    this.save();
    return this.state.energy;
  }

  getEnergyRefillCost() {
    const labLvl = this.getLabLevel();
    return Math.round((45 * (1 + (labLvl - 1) * 0.4)) / 5) * 5;
  }

  // ==================== ЕЖЕДНЕВНЫЕ НАГРАДЫ ЗА ВХОД ====================
  getDailyRewardStatus() {
    const today = this.getTodayKey();
    const claimedToday = this.state.lastDailyClaimDate === today;
    let streak = this.state.dailyStreakDay || 0;

    if (!claimedToday && this.state.lastDailyClaimDate) {
      const lastDate = new Date(this.state.lastDailyClaimDate + 'T00:00:00Z');
      const curDate = new Date(today + 'T00:00:00Z');
      const diffDays = Math.round((curDate - lastDate) / (24 * 60 * 60 * 1000));
      if (diffDays > 1) {
        streak = 0; // Пропущен день — цикл начинается заново с Дня 1
      }
    }

    const activeDayIdx = claimedToday
      ? Math.max(0, (streak - 1) % 7)
      : streak % 7;

    return {
      canClaim: !claimedToday,
      activeDayNumber: activeDayIdx + 1,
      rewardObj: DAILY_REWARDS_CATALOG[activeDayIdx]
    };
  }

  claimDailyReward(multiplier = 1) {
    const status = this.getDailyRewardStatus();
    if (!status.canClaim) return null;

    const today = this.getTodayKey();
    const r = status.rewardObj;
    const mult = multiplier >= 2 ? 2 : 1;

    this.state.lastDailyClaimDate = today;
    this.state.dailyStreakDay = status.activeDayNumber;

    const cash = r.money * mult;
    const rep = r.rep * mult;
    const pts = r.score * mult;

    if (cash > 0) this.addMoney(cash);
    if (rep > 0) this.addReputation(rep);
    if (pts > 0) this.addGlobalScore(pts);
    if (r.fullRepair) {
      this.restoreWear('saw');
      this.restoreWear('grinder');
      this.restoreWear('calibration');
    }

    this.save();
    return {
      ...r,
      multiplier: mult,
      totalMoney: cash,
      totalRep: rep,
      totalScore: pts
    };
  }

  // ==================== ТУТОРИАЛ И ПРОФИЛЬ ====================
  isTutorialCompleted() {
    return Boolean(this.state.tutorialCompleted);
  }

  getTutorialStep() {
    return this.state.tutorialStep || 0;
  }

  setTutorialStep(step) {
    this.state.tutorialStep = step;
    this.save();
  }

  completeTutorial() {
    this.state.tutorialCompleted = true;
    this.state.tutorialStep = 99;
    this.save();
  }

  resetTutorial() {
    this.state.tutorialCompleted = false;
    this.state.tutorialStep = 0;
    this.save();
  }

  getState() { return this.state; }
  getMoney() { return this.state.money; }

  getPlayerId() {
    this.ensurePlayerIdentity();
    return this.state.playerId;
  }

  getPlayerName() {
    this.ensurePlayerIdentity();
    return this.state.playerName;
  }

  setPlayerName(newName) {
    const clean = String(newName || '').trim().slice(0, 20);
    if (!clean) return this.state.playerName;
    this.state.playerName = clean;
    this.save();
    return this.state.playerName;
  }

  getReputationTierInfo() {
    const rep = this.getReputation();
    if (rep < 5) {
      return {
        tierName: 'Сомнительная репутация',
        shortTag: '−15% оплата',
        multiplier: 0.85,
        colorHex: '#f87171',
        desc: 'Низкий рейтинг доверия: заказчики урезают гонорар на 15%. Сдавай заказы без брака, чтобы вернуть доверие!'
      };
    }
    if (rep < 25) {
      return {
        tierName: 'Надёжная лаборатория',
        shortTag: 'База 100%',
        multiplier: 1.0,
        colorHex: '#38bdf8',
        desc: 'Стабильный статус: стандартные ставки по контрактам. Накопи 25 ★ для перехода в высшую лигу!'
      };
    }
    if (rep < 50) {
      return {
        tierName: 'Эталонный центр',
        shortTag: '+15% оплата',
        multiplier: 1.15,
        colorHex: '#4ade80',
        desc: 'Высокая репутация: заказчики доплачивают +15% за безупречную точность протоколов!'
      };
    }
    return {
      tierName: 'Академия геомеханики',
      shortTag: '+25% оплата',
      multiplier: 1.25,
      colorHex: '#facc15',
      desc: 'Элитный статус отрасли: максимальная надбавка +25% ко всем контрактам!'
    };
  }

  addGlobalScore(points) {
    const add = Math.max(0, Math.round(points));
    this.state.globalScore = (this.state.globalScore || 0) + add;
    this.save();
    return this.state.globalScore;
  }

  recordContractStreak(isSuccess, isPerfectProtocol = false) {
    if (isSuccess) {
      this.state.perfectStreak = (this.state.perfectStreak || 0) + 1;
      if (this.state.perfectStreak > (this.state.bestStreak || 0)) {
        this.state.bestStreak = this.state.perfectStreak;
      }
      if (isPerfectProtocol) {
        this.state.perfectProtocols = (this.state.perfectProtocols || 0) + 1;
      }
    } else {
      this.state.perfectStreak = 0;
    }
    this.save();
    return this.state.perfectStreak;
  }

  getPerfectStreak() {
    return this.state.perfectStreak || 0;
  }

  getLabIndexScore() {
    const baseAccumulated = this.state.globalScore || 0;
    const megas = this.getCompletedMegasCount();
    const lvl = this.getLabLevel();
    const achs = this.getUnlockedAchievements().length;
    const branches = this.getBranchesCount();
    const gems = this.getGems().length;
    return Math.round(baseAccumulated + megas * 450 + (lvl - 1) * 250 + achs * 60 + branches * 300 + gems * 40);
  }

  buildPublicProfile(sdkName = null) {
    const displayName = sdkName || this.getPlayerName();
    const activeDecor = (this.state.decorOwned || []).filter(
      (k) => !(this.state.decorDisabled || []).includes(k)
    );
    const assistantLvl = this.getPerkLevel('assistant');
    const staffCount = assistantLvl > 0 ? Math.min(3, Math.floor((assistantLvl + 1) / 2)) : 0;

    return {
      playerId: this.getPlayerId(),
      name: displayName,
      score: this.getLabIndexScore(),
      reputation: this.getReputation(),
      labLevel: this.getLabLevel(),
      completedMegas: this.getCompletedMegasCount(),
      snapshot: {
        labLevel: this.getLabLevel(),
        theme: this.getActiveLabTheme(),
        skin: this.getActiveSkin(),
        decor: activeDecor,
        rnd: [...(this.state.rndOwned || [])],
        displayedGems: [...(this.state.displayedGems || [])],
        completedMegas: [...(this.state.megaCompleted || [])],
        staffCount
      }
    };
  }

  getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  getRemainingGuestLikes() {
    const today = this.getTodayKey();
    if (this.state.guestLikesDate !== today) {
      this.state.guestLikesDate = today;
      this.state.guestLikedIds = [];
      this.save();
    }
    return Math.max(0, 3 - this.state.guestLikedIds.length);
  }

  hasLikedGuestToday(targetPlayerId) {
    this.getRemainingGuestLikes();
    return this.state.guestLikedIds.includes(targetPlayerId);
  }

  recordGuestLike(targetPlayerId) {
    if (this.getRemainingGuestLikes() <= 0) return false;
    if (this.state.guestLikedIds.includes(targetPlayerId)) return false;
    this.state.guestLikedIds.push(targetPlayerId);
    this.save();
    return true;
  }

  addMoney(amount) {
    this.state.money = Math.max(0, Math.round(this.state.money + amount));
    this.save();
    return this.state.money;
  }

  spendMoney(amount) {
    if (this.state.money < amount) return false;
    this.state.money -= amount;
    this.save();
    return true;
  }

  getReputation() { return this.state.reputation; }

  addReputation(delta) {
    this.state.reputation = Math.max(0, this.state.reputation + delta);
    this.save();
    return this.state.reputation;
  }

  getLabLevel() { return this.state.labLevel; }

  setLabLevel(lvl) {
    this.state.labLevel = Math.min(5, Math.max(1, lvl));
    this.save();
  }

  getUpgradeLevel(key) {
    if (key === 'caliper_auto') {
      return this.state.upgrades?.caliper_auto || 0;
    }
    return Math.max(1, this.state.upgrades?.[key] || 1);
  }

  upgradeTool(key) {
    if (!(key in this.state.upgrades)) return 1;
    this.state.upgrades[key] = this.getUpgradeLevel(key) + 1;
    if (key === 'caliper_auto') {
      this.state.caliperAutoMode = true;
    }
    this.save();
    return this.state.upgrades[key];
  }

  hasCaliperAuto() {
    return this.getUpgradeLevel('caliper_auto') >= 1;
  }

  isCaliperAutoMode() {
    return this.hasCaliperAuto() && this.state.caliperAutoMode !== false;
  }

  toggleCaliperAutoMode() {
    this.state.caliperAutoMode = !this.isCaliperAutoMode();
    this.save();
    return this.state.caliperAutoMode;
  }

  getPerkLevel(key) {
    return this.state.perks?.[key] || 0;
  }

  upgradePerk(key) {
    if (!this.state.perks) this.state.perks = {};
    this.state.perks[key] = (this.state.perks[key] || 0) + 1;
    this.save();
    return this.state.perks[key];
  }

  hasRnd(key) {
    return Array.isArray(this.state.rndOwned) && this.state.rndOwned.includes(key);
  }

  buyRnd(key) {
    if (!Array.isArray(this.state.rndOwned)) this.state.rndOwned = [];
    if (!this.state.rndOwned.includes(key)) {
      this.state.rndOwned.push(key);
      this.save();
    }
  }

  getBranchesCount() {
    return ['branch_norilsk', 'branch_ural', 'branch_shelf'].filter((k) => this.hasRnd(k)).length;
  }

  getPassiveBranchIncome() {
    let sum = 0;
    if (this.hasRnd('branch_norilsk')) sum += 800;
    if (this.hasRnd('branch_ural')) sum += 1800;
    if (this.hasRnd('branch_shelf')) sum += 3500;
    if (this.hasRnd('rnd_iso_center')) sum += 1500;
    return sum;
  }

  hasDecor(key) {
    return Array.isArray(this.state.decorOwned) && this.state.decorOwned.includes(key);
  }

  isDecorActive(key) {
    if (!this.hasDecor(key)) return false;
    return !Array.isArray(this.state.decorDisabled) || !this.state.decorDisabled.includes(key);
  }

  toggleDecorActive(key) {
    if (!this.hasDecor(key)) return false;
    if (!Array.isArray(this.state.decorDisabled)) this.state.decorDisabled = [];
    const idx = this.state.decorDisabled.indexOf(key);
    if (idx >= 0) {
      this.state.decorDisabled.splice(idx, 1);
      this.save();
      return true;
    } else {
      this.state.decorDisabled.push(key);
      this.save();
      return false;
    }
  }

  buyDecor(key) {
    if (!Array.isArray(this.state.decorOwned)) this.state.decorOwned = [];
    if (!this.state.decorOwned.includes(key)) {
      this.state.decorOwned.push(key);
    }
    if (Array.isArray(this.state.decorDisabled)) {
      this.state.decorDisabled = this.state.decorDisabled.filter((k) => k !== key);
    }
    this.save();
  }

  getDecorAds(key) {
    return this.state.decorAds?.[key] || 0;
  }

  incrementDecorAds(key) {
    if (!this.state.decorAds) this.state.decorAds = {};
    this.state.decorAds[key] = (this.state.decorAds[key] || 0) + 1;
    this.save();
    return this.state.decorAds[key];
  }

  getActiveSkin() {
    return this.state.activeSkin || 'default';
  }

  setActiveSkin(skinId) {
    this.state.activeSkin = skinId || 'default';
    this.save();
  }

  getActiveLabTheme() {
    return this.state.activeLabTheme || 'default';
  }

  setActiveLabTheme(themeId) {
    this.state.activeLabTheme = themeId || 'default';
    this.save();
  }

  getMegaStage(projectId) {
    return this.state.megaProgress?.[projectId] || 0;
  }

  isMegaCompleted(projectId) {
    return Array.isArray(this.state.megaCompleted) && this.state.megaCompleted.includes(projectId);
  }

  getCompletedMegasCount() {
    return Array.isArray(this.state.megaCompleted) ? this.state.megaCompleted.length : 0;
  }

  advanceMegaProject(projectId, totalStages) {
    if (!this.state.megaProgress) this.state.megaProgress = {};
    if (!Array.isArray(this.state.megaCompleted)) this.state.megaCompleted = [];

    const nextStage = (this.state.megaProgress[projectId] || 0) + 1;
    if (nextStage >= totalStages) {
      this.state.megaProgress[projectId] = totalStages;
      if (!this.state.megaCompleted.includes(projectId)) {
        this.state.megaCompleted.push(projectId);
      }
    } else {
      this.state.megaProgress[projectId] = nextStage;
    }
    this.save();
    return this.state.megaProgress[projectId];
  }

  getExpeditionCooldownLeft(expId, cooldownDays) {
    const lastDay = this.state.expeditionLastDay?.[expId];
    if (typeof lastDay !== 'number') return 0;
    const currentDay = this.state.completedContracts || 0;
    const passed = currentDay - lastDay;
    return Math.max(0, cooldownDays - passed);
  }

  markExpeditionLaunched(expId) {
    if (!this.state.expeditionLastDay) this.state.expeditionLastDay = {};
    this.state.expeditionLastDay[expId] = this.state.completedContracts || 0;
    this.save();
  }

  getUnlockedAchievements() {
    return Array.isArray(this.state.unlockedAchievements) ? this.state.unlockedAchievements : [];
  }

  isAchievementUnlocked(id) {
    return this.getUnlockedAchievements().includes(id);
  }

  unlockAchievement(id) {
    if (!Array.isArray(this.state.unlockedAchievements)) this.state.unlockedAchievements = [];
    if (!this.state.unlockedAchievements.includes(id)) {
      this.state.unlockedAchievements.push(id);
      this.save();
      return true;
    }
    return false;
  }

  getWear(key) {
    return Math.max(0, Math.min(100, this.state.wear?.[key] ?? 100));
  }

  getMaintenanceCost(key) {
    const basePrices = { saw: 35, grinder: 35, calibration: 45 };
    const base = basePrices[key] || 35;
    const labLvl = this.getLabLevel();
    const scale = 1 + (labLvl - 1) * 0.45;
    return Math.round((base * scale) / 5) * 5;
  }

  applyContractWear(contractOrTestsCount = 1) {
    if (!this.state.wear) this.state.wear = { saw: 100, grinder: 100, calibration: 100 };

    let testsCount = 1;
    let heavyFactor = 1.0;

    if (typeof contractOrTestsCount === 'object' && contractOrTestsCount !== null) {
      const c = contractOrTestsCount;
      testsCount = c.tests?.length || 1;
      const tier = c.tier || 1;
      const isMega = Boolean(c.isMegaProject);
      const isHardRock = (c.trueStrengthMpa || 40) >= 85 || ['brittle', 'frozen'].includes(c.rock?.trait);

      if (isMega) heavyFactor += 0.65;
      if (tier >= 3) heavyFactor += (tier - 2) * 0.28;
      if (isHardRock) heavyFactor += 0.35;
    } else {
      testsCount = Number(contractOrTestsCount) || 1;
    }

    const factor = (1 + (testsCount - 1) * 0.18) * heavyFactor;
    this.state.wear.saw = Math.max(5, Math.round(this.state.wear.saw - 5.5 * factor));
    this.state.wear.grinder = Math.max(5, Math.round(this.state.wear.grinder - 6.0 * factor));
    this.state.wear.calibration = Math.max(5, Math.round(this.state.wear.calibration - 5.0 * factor));
    this.save();
  }

  restoreWear(key) {
    if (!this.state.wear) this.state.wear = { saw: 100, grinder: 100, calibration: 100 };
    this.state.wear[key] = 100;
    this.save();
  }

  restoreWearPartial(key, bonusPct = 55) {
    if (!this.state.wear) this.state.wear = { saw: 100, grinder: 100, calibration: 100 };
    this.state.wear[key] = Math.min(100, (this.state.wear[key] ?? 100) + bonusPct);
    this.save();
    return this.state.wear[key];
  }

  shouldTriggerAudit() {
    const total = this.state.completedContracts || 0;
    const since = this.state.contractsSinceAudit || 0;
    if (total === 5 && since >= 5) return true;
    if (total > 5 && since >= 9) return true;
    return false;
  }

  resetAuditCounter() {
    this.state.contractsSinceAudit = 0;
    this.save();
  }

  getAuditBonus() { return this.state.auditBonusContracts || 0; }

  setAuditBonus(count) {
    this.state.auditBonusContracts = Math.max(0, count);
    this.save();
  }

  consumeAuditBonus() {
    if (this.state.auditBonusContracts > 0) {
      this.state.auditBonusContracts -= 1;
      this.save();
    }
  }

  getUnlockedTests() { return this.state.unlockedTests || ['uniaxial', 'shear_cut']; }
  isTestUnlocked(testKey) { return this.getUnlockedTests().includes(testKey); }

  unlockTest(testKey) {
    if (!this.isTestUnlocked(testKey)) {
      this.state.unlockedTests.push(testKey);
      this.save();
    }
  }

  getUnlockedMusicPacks() {
    const list = this.state.unlockedMusicPacks || ['base'];
    return list.includes('base') ? list : ['base', ...list];
  }

  isMusicPackUnlocked(packId) {
    if (packId === 'base') return true;
    return this.getUnlockedMusicPacks().includes(packId);
  }

  unlockMusicPack(packId) {
    if (!this.state.unlockedMusicPacks) this.state.unlockedMusicPacks = ['base'];
    if (!this.state.unlockedMusicPacks.includes(packId)) {
      this.state.unlockedMusicPacks.push(packId);
    }
    if (!this.state.enabledMusicPacks) this.state.enabledMusicPacks = ['base'];
    if (!this.state.enabledMusicPacks.includes(packId)) {
      this.state.enabledMusicPacks.push(packId);
    }
    this.save();
  }

  getEnabledMusicPacks() {
    const enabled = this.state.enabledMusicPacks || ['base'];
    return enabled.length ? enabled : ['base'];
  }

  isMusicPackEnabled(packId) {
    return this.getEnabledMusicPacks().includes(packId);
  }

  toggleMusicPackEnabled(packId) {
    if (!this.isMusicPackUnlocked(packId)) return false;
    if (!Array.isArray(this.state.enabledMusicPacks)) this.state.enabledMusicPacks = ['base'];
    const idx = this.state.enabledMusicPacks.indexOf(packId);
    if (idx >= 0) {
      if (this.state.enabledMusicPacks.length <= 1) return true;
      this.state.enabledMusicPacks.splice(idx, 1);
      this.save();
      return false;
    } else {
      this.state.enabledMusicPacks.push(packId);
      this.save();
      return true;
    }
  }

  getMusicPackAds(packId) {
    return this.state.musicPackAds?.[packId] || 0;
  }

  incrementMusicPackAds(packId) {
    if (!this.state.musicPackAds) this.state.musicPackAds = {};
    this.state.musicPackAds[packId] = (this.state.musicPackAds[packId] || 0) + 1;
    this.save();
    return this.state.musicPackAds[packId];
  }

  getMusicPlayMode() {
    return this.state.musicPlayMode || 'playlist';
  }

  setMusicPlayMode(mode) {
    this.state.musicPlayMode = mode === 'loop' ? 'loop' : 'playlist';
    this.save();
  }

  addGem(gem) {
    const existingIdx = this.state.foundGems.findIndex((g) => g.id === gem.id);
    if (existingIdx >= 0) {
      this.state.foundGems[existingIdx].count = (this.state.foundGems[existingIdx].count || 1) + 1;
      this.state.foundGems[existingIdx].foundAt = Date.now();
    } else {
      this.state.foundGems.unshift({ ...gem, count: 1, foundAt: Date.now() });
      if (!this.state.displayedGems) this.state.displayedGems = [];
      if (this.state.displayedGems.length < 4) {
        this.state.displayedGems.push(gem.id);
      }
    }
    this.save();
  }

  getGems() { return this.state.foundGems || []; }

  getDisplayedGems() {
    if (!Array.isArray(this.state.displayedGems)) return [];
    return this.state.displayedGems
      .map((id) => this.state.foundGems.find((g) => g.id === id))
      .filter(Boolean);
  }

  isGemDisplayed(gemId) {
    return Array.isArray(this.state.displayedGems) && this.state.displayedGems.includes(gemId);
  }

  toggleGemDisplay(gemId) {
    if (!Array.isArray(this.state.displayedGems)) this.state.displayedGems = [];
    const idx = this.state.displayedGems.indexOf(gemId);
    if (idx >= 0) {
      this.state.displayedGems.splice(idx, 1);
    } else {
      if (this.state.displayedGems.length >= 4) {
        this.state.displayedGems.shift();
      }
      this.state.displayedGems.push(gemId);
    }
    this.save();
    return this.state.displayedGems.includes(gemId);
  }

  addSiteRecord(record) {
    this.state.siteHistory.unshift({ ...record, date: Date.now() });
    if (this.state.siteHistory.length > 25) this.state.siteHistory.length = 25;
    this.save();
  }

  getSiteHistory() { return this.state.siteHistory || []; }

  isSoundEnabled() { return this.state.soundEnabled !== false; }

  toggleSound() {
    this.state.soundEnabled = !this.isSoundEnabled();
    this.save();
    return this.state.soundEnabled;
  }

  getMusicTrack() { return this.state.musicTrack || 0; }

  setMusicTrack(idx) {
    this.state.musicTrack = idx;
    this.save();
  }

  setPendingTender(tender) {
    this.state.pendingTender = tender;
    this.save();
  }

  getPendingTender() {
    return this.state.pendingTender || null;
  }

  clearPendingTender() {
    this.state.pendingTender = null;
    this.save();
  }

  setActiveContract(contract) {
    this.state.activeContract = contract;
    this.save();
  }

  getActiveContract() { return this.state.activeContract; }

  incrementCompleted() {
    this.state.completedContracts += 1;
    this.state.contractsSinceAudit = (this.state.contractsSinceAudit || 0) + 1;
    this.save();
  }
}

export const Storage = new StorageManager();
