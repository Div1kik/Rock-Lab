import { Storage } from './Storage.js';
import { AudioManager } from './AudioManager.js';
import { RARE_INCLUSIONS, MEGA_PROJECTS } from '../data/contracts.js';
import { TEST_UPGRADES, RND_UPGRADES } from '../data/upgrades.js';

export const ACHIEVEMENTS_CATALOG = [
  {
    id: 'first_core',
    icon: '🎓',
    title: 'Первый керн',
    desc: 'Успешно сдать первый лабораторный контракт',
    rewardMoney: 250,
    rewardRep: 5
  },
  {
    id: 'edge_of_rupture',
    icon: '💥',
    title: 'На грани разрыва!',
    desc: 'Отпустить гидропресс на 94–99% от предела разрушения, поймав супермощность!',
    rewardMoney: 1200,
    rewardRep: 15
  },
  {
    id: 'ice_nerves',
    icon: '🧊',
    title: 'Ледяная выдержка',
    desc: 'Завершить испытание мёрзлого суглинка при температуре ниже -9.5°C',
    rewardMoney: 900,
    rewardRep: 12
  },
  {
    id: 'metrology_standard',
    icon: '🎯',
    title: 'Эталон метрологии',
    desc: 'Сдать протокол испытаний с минимальной погрешностью ±2%',
    rewardMoney: 1500,
    rewardRep: 20
  },
  {
    id: 'clean_audit',
    icon: '🛡️',
    title: 'Безупречный аудит',
    desc: 'Успешно пройти контрольную проверку РосТехНадзора',
    rewardMoney: 1000,
    rewardRep: 15
  },
  {
    id: 'lab_max',
    icon: '🏛️',
    title: 'Геотех-империя',
    desc: 'Расширить лабораторию до максимального 5-го уровня',
    rewardMoney: 3000,
    rewardRep: 25
  },
  {
    id: 'full_staff',
    icon: '👷',
    title: 'Полный штат',
    desc: 'Нанять максимальную бригаду лаборантов (Ур. 6)',
    rewardMoney: 4000,
    rewardRep: 30
  },
  {
    id: 'full_arsenal',
    icon: '⚙️',
    title: 'Арсенал ГОСТ',
    desc: 'Открыть все испытательные стенды в магазине',
    rewardMoney: 2500,
    rewardRep: 20
  },
  {
    id: 'gem_hunter',
    icon: '💎',
    title: 'Охотник за редкостями',
    desc: 'Собрать все 9 редких минералов в коллекцию склада',
    rewardMoney: 5000,
    rewardRep: 40
  },
  {
    id: 'robo_squad',
    icon: '🤖',
    title: 'Кибер-лаборатория',
    desc: 'Приобрести всех 4 роботов для автоматизации цеха',
    rewardMoney: 8000,
    rewardRep: 50
  },
  {
    id: 'mega_builder',
    icon: '🏗️',
    title: 'Покоритель строек века',
    desc: 'Завершить все 4 мега-проекта государственного масштаба',
    rewardMoney: 15000,
    rewardRep: 100
  },
  {
    id: 'polar_driller',
    icon: '🚁',
    title: 'Полярный буровик',
    desc: 'Профинансировать и выполнить буровую экспедицию',
    rewardMoney: 6000,
    rewardRep: 35
  },
  {
    id: 'network_director',
    icon: '🌐',
    title: 'Федеральная сеть',
    desc: 'Открыть все 3 региональных филиала лаборатории',
    rewardMoney: 25000,
    rewardRep: 90
  },
  {
    id: 'academic_rnd',
    icon: '🔬',
    title: 'Академик геомеханики',
    desc: 'Выкупить все исследования и лицензии в разделе НИОКР',
    rewardMoney: 40000,
    rewardRep: 150
  },
  {
    id: 'tycoon_50k',
    icon: '💰',
    title: 'Магнат недр',
    desc: 'Накопить 50 000 ₽ на счёте лаборатории',
    rewardMoney: 5000,
    rewardRep: 35
  }
];

class AchievementController {
  constructor() {
    this.toastQueue = [];
    this.isShowingToast = false;
  }

  unlock(scene, achievementId) {
    const meta = ACHIEVEMENTS_CATALOG.find((a) => a.id === achievementId);
    if (!meta) return false;
    if (Storage.isAchievementUnlocked(achievementId)) return false;

    Storage.unlockAchievement(achievementId);
    if (meta.rewardMoney > 0) Storage.addMoney(meta.rewardMoney);
    if (meta.rewardRep > 0) Storage.addReputation(meta.rewardRep);

    this.toastQueue.push(meta);
    if (scene) {
      this.processToastQueue(scene);
    }
    return true;
  }

  evaluateAll(scene) {
    const st = Storage.getState();

    if ((st.completedContracts || 0) >= 1) {
      this.unlock(scene, 'first_core');
    }
    if (Storage.getLabLevel() >= 5) {
      this.unlock(scene, 'lab_max');
    }
    if (Storage.getPerkLevel('assistant') >= 6) {
      this.unlock(scene, 'full_staff');
    }
    if (TEST_UPGRADES.every((t) => Storage.isTestUnlocked(t.key))) {
      this.unlock(scene, 'full_arsenal');
    }
    if (Storage.getGems().length >= RARE_INCLUSIONS.length) {
      this.unlock(scene, 'gem_hunter');
    }
    if (['robo_arm', 'robo_rover', 'robo_dog', 'robo_humanoid'].every((k) => Storage.hasDecor(k))) {
      this.unlock(scene, 'robo_squad');
    }
    if (Storage.getCompletedMegasCount() >= MEGA_PROJECTS.length) {
      this.unlock(scene, 'mega_builder');
    }
    if (Storage.getBranchesCount() >= 3) {
      this.unlock(scene, 'network_director');
    }
    if (RND_UPGRADES.every((r) => Storage.hasRnd(r.key))) {
      this.unlock(scene, 'academic_rnd');
    }
    if (Storage.getMoney() >= 50000) {
      this.unlock(scene, 'tycoon_50k');
    }
  }

  processToastQueue(scene) {
    if (this.isShowingToast || this.toastQueue.length === 0) return;
    if (!scene || !scene.sys || !scene.sys.isActive()) {
      this.toastQueue = [];
      return;
    }

    this.isShowingToast = true;
    const item = this.toastQueue.shift();
    const { width } = scene.scale;

    AudioManager.playStamp();

    const toastW = 368;
    const toastH = 74;
    const toast = scene.add.container(width / 2, -60).setDepth(120);

    const bg = scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.97);
    bg.fillRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 14);
    bg.lineStyle(2.5, 0xfacc15, 1);
    bg.strokeRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 14);

    const icon = scene.add.text(-toastW / 2 + 28, 0, item.icon, {
      fontSize: '28px'
    }).setOrigin(0.5);

    const badge = scene.add.text(-toastW / 2 + 56, -18, '🏆 ДОСТИЖЕНИЕ ОТКРЫТО!', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      fontWeight: '700',
      color: '#facc15'
    }).setOrigin(0, 0.5);

    const title = scene.add.text(-toastW / 2 + 56, 2, item.title, {
      fontFamily: '"Rubik", sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const reward = scene.add.text(
      -toastW / 2 + 56,
      20,
      `Награда: +${item.rewardMoney} ₽  +${item.rewardRep} ★`,
      {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        fontWeight: '700',
        color: '#4ade80'
      }
    ).setOrigin(0, 0.5);

    toast.add([bg, icon, badge, title, reward]);

    scene.tweens.add({
      targets: toast,
      y: 54,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(2500, () => {
          if (!toast.active) {
            this.isShowingToast = false;
            return;
          }
          scene.tweens.add({
            targets: toast,
            y: -70,
            alpha: 0,
            duration: 280,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              toast.destroy();
              this.isShowingToast = false;
              this.processToastQueue(scene);
            }
          });
        });
      }
    });
  }
}

export const AchievementManager = new AchievementController();
