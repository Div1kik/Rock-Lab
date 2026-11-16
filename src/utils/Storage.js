const SAVE_KEY = 'rocklab_save_v1';

const DEFAULT_STATE = {
  money: 150,
  reputation: 10,
  completedContracts: 0,
  labLevel: 1, // 1..5
  upgrades: {
    drill: 1,
    saw: 1,
    caliper: 1,
    press: 1,
    sensors: 1,
    loader: 1
  },
  perks: {
    coffee: 0,    // 0..3 Кофемашина на верстаке
    showcase: 0,  // 0..4 Витрина минералов (+доход)
    assistant: 0, // 0..3 Лаборант-помощник (авто-болты)
    decor: 0      // 0..3 Освещение и вытяжка (+репутация)
  },
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
        }
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
