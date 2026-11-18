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
  decorOwned: [],
  decorDisabled: [],
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

      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        upgrades: mergedUpgrades,
        caliperAutoMode: parsed.caliperAutoMode !== false,
        perks: {
          ...DEFAULT_STATE.perks,
          ...(parsed.perks || {})
        },
        decorOwned: Array.isArray(parsed.decorOwned) ? parsed.decorOwned : [],
        decorDisabled: Array.isArray(parsed.decorDisabled) ? parsed.decorDisabled : [],
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
