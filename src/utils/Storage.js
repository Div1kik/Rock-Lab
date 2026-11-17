const SAVE_KEY = 'rocklab_save_v1';

const DEFAULT_STATE = {
  money: 150,
  reputation: 10,
  completedContracts: 0,
  contractsSinceAudit: 0,
  labLevel: 1,
  upgrades: {
    drill: 1,
    saw: 1,
    grinder: 1,
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
  wear: {
    saw: 100,
    grinder: 100,
    calibration: 100
  },
  auditBonusContracts: 0,
  unlockedTests: ['uniaxial', 'shear_cut'],
  unlockedMusicPacks: [],
  musicPlayMode: 'playlist',
  foundGems: [],
  siteHistory: [],
  soundEnabled: true,
  musicTrack: 0,
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
      const mergedUpgrades = {
        ...DEFAULT_STATE.upgrades,
        ...(parsed.upgrades || {})
      };
      if (!mergedUpgrades.grinder || mergedUpgrades.grinder < 1) {
        mergedUpgrades.grinder = 1;
      }
      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        upgrades: mergedUpgrades,
        perks: {
          ...DEFAULT_STATE.perks,
          ...(parsed.perks || {})
        },
        wear: {
          ...DEFAULT_STATE.wear,
          ...(parsed.wear || {})
        },
        unlockedTests: Array.isArray(parsed.unlockedTests) && parsed.unlockedTests.length
          ? parsed.unlockedTests
          : [...DEFAULT_STATE.unlockedTests],
        unlockedMusicPacks: Array.isArray(parsed.unlockedMusicPacks) ? parsed.unlockedMusicPacks : [],
        musicPlayMode: parsed.musicPlayMode === 'loop' ? 'loop' : 'playlist',
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

  getState() { return this.state; }
  getMoney() { return this.state.money; }

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
    return Math.max(1, this.state.upgrades?.[key] || 1);
  }

  upgradeTool(key) {
    if (!(key in this.state.upgrades)) return 1;
    this.state.upgrades[key] = this.getUpgradeLevel(key) + 1;
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

  getWear(key) {
    return Math.max(0, Math.min(100, this.state.wear?.[key] ?? 100));
  }

  applyContractWear(testsCount = 1) {
    if (!this.state.wear) this.state.wear = { saw: 100, grinder: 100, calibration: 100 };
    const factor = 1 + (testsCount - 1) * 0.2;
    this.state.wear.saw = Math.max(10, Math.round(this.state.wear.saw - 11 * factor));
    this.state.wear.grinder = Math.max(10, Math.round(this.state.wear.grinder - 12 * factor));
    this.state.wear.calibration = Math.max(10, Math.round(this.state.wear.calibration - 10 * factor));
    this.save();
  }

  restoreWear(key) {
    if (!this.state.wear) this.state.wear = { saw: 100, grinder: 100, calibration: 100 };
    this.state.wear[key] = 100;
    this.save();
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
    return this.state.unlockedMusicPacks || [];
  }

  isMusicPackUnlocked(packId) {
    return this.getUnlockedMusicPacks().includes(packId);
  }

  unlockMusicPack(packId) {
    if (!this.state.unlockedMusicPacks) this.state.unlockedMusicPacks = [];
    if (!this.state.unlockedMusicPacks.includes(packId)) {
      this.state.unlockedMusicPacks.push(packId);
      this.save();
    }
  }

  getMusicPlayMode() {
    return this.state.musicPlayMode || 'playlist';
  }

  setMusicPlayMode(mode) {
    this.state.musicPlayMode = mode === 'loop' ? 'loop' : 'playlist';
    this.save();
  }

  addGem(gem) {
    this.state.foundGems.unshift({ ...gem, foundAt: Date.now() });
    if (this.state.foundGems.length > 30) this.state.foundGems.length = 30;
    this.save();
  }

  getGems() { return this.state.foundGems || []; }

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
