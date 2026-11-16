const SAVE_KEY = 'rocklab_save_v1';

const DEFAULT_STATE = {
  money: 150,
  reputation: 10,
  completedContracts: 0,
  labLevel: 1,
  upgrades: {
    drill: 1,
    saw: 1,
    grinder: 0, // 0 = не куплен (ручная зачистка), 1..5 = уровни шлифовального станка
    caliper: 1,
    press: 1,
    sensors: 1,
    loader: 1
  },
  perks: {
    coffee: 0,
    showcase: 0,
    assistant: 0,
    decor: 0,
    cryobox: 0
  },
  unlockedTests: ['uniaxial', 'shear_cut'],
  foundGems: [],
  siteHistory: [],
  soundEnabled: true,
  activeContract: null
};

class StorageManager {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        upgrades: {
          ...DEFAULT_STATE.upgrades,
          ...(parsed.upgrades || {})
        },
        perks: {
          ...DEFAULT_STATE.perks,
          ...(parsed.perks || {})
        },
        unlockedTests: Array.isArray(parsed.unlockedTests) && parsed.unlockedTests.length
          ? parsed.unlockedTests
          : [...DEFAULT_STATE.unlockedTests],
        foundGems: Array.isArray(parsed.foundGems) ? parsed.foundGems : [],
        siteHistory: Array.isArray(parsed.siteHistory) ? parsed.siteHistory : []
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

  getState() {
    return this.state;
  }

  getMoney() {
    return this.state.money;
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

  getReputation() {
    return this.state.reputation;
  }

  addReputation(delta) {
    this.state.reputation = Math.max(0, this.state.reputation + delta);
    this.save();
    return this.state.reputation;
  }

  getLabLevel() {
    return this.state.labLevel;
  }

  setLabLevel(lvl) {
    this.state.labLevel = Math.min(5, Math.max(1, lvl));
    this.save();
  }

  getUpgradeLevel(key) {
    if (key === 'grinder') return this.state.upgrades?.grinder ?? 0;
    return this.state.upgrades[key] || 1;
  }

  upgradeTool(key) {
    if (!(key in this.state.upgrades)) return 1;
    this.state.upgrades[key] += 1;
    this.save();
    return this.state.upgrades[key];
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

  getUnlockedTests() {
    return this.state.unlockedTests || ['uniaxial', 'shear_cut'];
  }

  isTestUnlocked(testKey) {
    return this.getUnlockedTests().includes(testKey);
  }

  unlockTest(testKey) {
    if (!this.isTestUnlocked(testKey)) {
      this.state.unlockedTests.push(testKey);
      this.save();
    }
  }

  addGem(gem) {
    this.state.foundGems.unshift({ ...gem, foundAt: Date.now() });
    if (this.state.foundGems.length > 30) this.state.foundGems.length = 30;
    this.save();
  }

  getGems() {
    return this.state.foundGems || [];
  }

  addSiteRecord(record) {
    this.state.siteHistory.unshift({ ...record, date: Date.now() });
    if (this.state.siteHistory.length > 25) this.state.siteHistory.length = 25;
    this.save();
  }

  getSiteHistory() {
    return this.state.siteHistory || [];
  }

  isSoundEnabled() {
    return this.state.soundEnabled !== false;
  }

  toggleSound() {
    this.state.soundEnabled = !this.isSoundEnabled();
    this.save();
    return this.state.soundEnabled;
  }

  setActiveContract(contract) {
    this.state.activeContract = contract;
    this.save();
  }

  getActiveContract() {
    return this.state.activeContract;
  }

  incrementCompleted() {
    this.state.completedContracts += 1;
    this.save();
  }
}

export const Storage = new StorageManager();
