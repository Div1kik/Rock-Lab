const SAVE_KEY = 'rocklab_save_v1';

const DEFAULT_STATE = {
  money: 150,
  reputation: 10,
  completedContracts: 0,
  labLevel: 1, // 1..5 визуальный уровень лаборатории
  upgrades: {
    drill: 1,   // скорость и визуал шуруповёрта
    saw: 1,     // скорость и визуал отрезной пилы на рельсе
    caliper: 1, // плавность и визуал штангенциркуля
    press: 1,   // плавность гидропресса
    sensors: 1, // снижение погрешности датчиков
    loader: 1   // бонус к гонорару за контракт
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
