import { AudioManager } from './AudioManager.js';

const withTimeout = (promise, ms = 600) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);

// Опционально: вставь URL и anon-key своего проекта Supabase для единого кросс-платформенного топа (VK + RuStore + Google Play)
const CLOUD_CONFIG = {
  url: '', // например: 'https://xyzcompany.supabase.co'
  anonKey: ''
};

// Стартовые профили коллег-геологов для гостевого режима и таблицы лидеров (дополняются реальными игроками)
const SEED_LABS = [
  {
    playerId: 'npc_norilsk_01',
    name: 'Инж. Арктик-Гео',
    score: 2850,
    reputation: 145,
    labLevel: 5,
    completedMegas: 4,
    snapshot: {
      labLevel: 5,
      theme: 'arctic',
      skin: 'arctic',
      decor: ['cooler', 'plants', 'geomap', 'neon', 'robo_arm', 'robo_rover', 'robo_dog', 'robo_humanoid'],
      rnd: ['rnd_gold_press', 'branch_norilsk', 'branch_ural', 'branch_shelf'],
      displayedGems: ['diamond_kimberlite', 'native_gold', 'malachite', 'amethyst'],
      completedMegas: ['mega_bridge', 'mega_metro', 'mega_tower', 'mega_dam'],
      staffCount: 3
    }
  },
  {
    playerId: 'npc_ural_02',
    name: 'УралНедра · Лаб №4',
    score: 1940,
    reputation: 98,
    labLevel: 4,
    completedMegas: 2,
    snapshot: {
      labLevel: 4,
      theme: 'loft',
      skin: 'miner',
      decor: ['cooler', 'lounge_sofa', 'archive_desk', 'robo_arm', 'robo_dog'],
      rnd: ['branch_norilsk', 'branch_ural'],
      displayedGems: ['malachite', 'amethyst', 'ammonite', 'quartz'],
      completedMegas: ['mega_bridge', 'mega_metro'],
      staffCount: 2
    }
  },
  {
    playerId: 'npc_atlant_03',
    name: 'Академик Кернов',
    score: 3420,
    reputation: 180,
    labLevel: 5,
    completedMegas: 4,
    snapshot: {
      labLevel: 5,
      theme: 'gold',
      skin: 'gold',
      decor: ['cooler', 'plants', 'lounge_sofa', 'archive_desk', 'geomap', 'neon', 'robo_arm', 'robo_rover', 'robo_dog', 'robo_humanoid'],
      rnd: ['rnd_gold_press', 'branch_norilsk', 'branch_ural', 'branch_shelf'],
      displayedGems: ['diamond_kimberlite', 'native_gold', 'pyrite', 'calcite'],
      completedMegas: ['mega_bridge', 'mega_metro', 'mega_tower', 'mega_dam'],
      staffCount: 3
    }
  },
  {
    playerId: 'npc_cyber_04',
    name: 'КиберНИИ-2099',
    score: 1480,
    reputation: 74,
    labLevel: 4,
    completedMegas: 1,
    snapshot: {
      labLevel: 4,
      theme: 'cyber',
      skin: 'robots',
      decor: ['neon', 'geomap', 'robo_arm', 'robo_rover', 'robo_humanoid'],
      rnd: ['branch_norilsk'],
      displayedGems: ['quartz', 'agate', 'pyrite', 'calcite'],
      completedMegas: ['mega_bridge'],
      staffCount: 2
    }
  },
  {
    playerId: 'npc_minion_05',
    name: 'Банана-Геотех',
    score: 960,
    reputation: 52,
    labLevel: 3,
    completedMegas: 1,
    snapshot: {
      labLevel: 3,
      theme: 'default',
      skin: 'minions',
      decor: ['cooler', 'plants', 'lounge_sofa'],
      rnd: [],
      displayedGems: ['agate', 'pyrite', 'calcite'],
      completedMegas: ['mega_bridge'],
      staffCount: 1
    }
  }
];

class PlatformSDKManager {
  constructor() {
    this.platform = 'web'; // 'vk' | 'yandex' | 'android' | 'web'
    this.sdk = null;
    this.yaLeaderboard = null;
    this.initialized = false;
    this.isAdShowing = false;
    this.lastInterstitialTime = 0;
    this.contractsSinceAd = 0;
    this.playerName = null;
  }

  async init() {
    if (this.initialized) return;

    // 1. VK Игры
    if (typeof window !== 'undefined' && window.vkBridge) {
      try {
        await withTimeout(window.vkBridge.send('VKWebAppInit'), 500);
        this.platform = 'vk';
        this.sdk = window.vkBridge;
        this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'reward' }).catch(() => {});
        this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' }).catch(() => {});
        this.sdk.send('VKWebAppGetUserInfo').then((u) => {
          if (u?.first_name) this.playerName = `${u.first_name} ${u.last_name ? u.last_name[0] + '.' : ''}`.trim();
        }).catch(() => {});
        this.initialized = true;
        return;
      } catch {}
    }

    // 2. Яндекс Игры
    if (typeof window !== 'undefined' && window.YaGames) {
      try {
        this.sdk = await withTimeout(window.YaGames.init(), 900);
        this.platform = 'yandex';
        if (this.sdk.getLeaderboards) {
          this.sdk.getLeaderboards().then((lb) => { this.yaLeaderboard = lb; }).catch(() => {});
        }
        if (this.sdk.getPlayer) {
          this.sdk.getPlayer({ scopes: false }).then((p) => {
            const name = p.getName();
            if (name) this.playerName = name;
          }).catch(() => {});
        }
        this.initialized = true;
        return;
      } catch {}
    }

    // 3. Нативный Android (RuStore / Google Play через Capacitor или Android WebView Bridge)
    if (
      typeof window !== 'undefined' &&
      (window.Capacitor?.isNativePlatform?.() || window.AndroidBridge || /wv\)/i.test(navigator.userAgent))
    ) {
      this.platform = 'android';
      this.sdk = window.AndroidBridge || window.Capacitor || null;
      this.initialized = true;
      return;
    }

    // 4. Обычный браузер / GitHub Pages
    this.platform = 'web';
    this.initialized = true;
  }

  getPlatformName() {
    return this.platform;
  }

  notifyLoadingReady() {
    if (this.platform === 'yandex' && this.sdk?.features?.LoadingAPI) {
      this.sdk.features.LoadingAPI.ready();
    }
  }

  // =========================================================================
  // РЕКЛАМА (VK + Яндекс + Android/RuStore/Google Play + Защита от зависания)
  // =========================================================================
  showRewarded(onReward, onClose = null) {
    if (this.isAdShowing) return;

    if (this.platform === 'vk' && this.sdk) {
      this.isAdShowing = true;
      AudioManager.suspendForAd();
      this.sdk.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then((res) => {
          this.isAdShowing = false;
          AudioManager.resumeAfterAd();
          const ok = Boolean(res && res.result);
          if (ok && typeof onReward === 'function') onReward();
          if (typeof onClose === 'function') onClose(ok);
          this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'reward' }).catch(() => {});
        })
        .catch(() => {
          this.isAdShowing = false;
          AudioManager.resumeAfterAd();
          if (typeof onClose === 'function') onClose(false);
        });
      return;
    }

    if (this.platform === 'yandex' && this.sdk?.adv) {
      this.isAdShowing = true;
      AudioManager.suspendForAd();
      let rewarded = false;
      this.sdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => { rewarded = true; },
          onClose: () => {
            this.isAdShowing = false;
            AudioManager.resumeAfterAd();
            if (rewarded && typeof onReward === 'function') onReward();
            if (typeof onClose === 'function') onClose(rewarded);
          },
          onError: () => {
            this.isAdShowing = false;
            AudioManager.resumeAfterAd();
            if (typeof onClose === 'function') onClose(false);
          }
        }
      });
      return;
    }

    // Нативный мостик для RuStore / Google Play (Yandex Mobile Ads / AdMob)
    if (this.platform === 'android' && typeof window !== 'undefined') {
      if (typeof window.AndroidBridge?.showRewarded === 'function') {
        this.isAdShowing = true;
        AudioManager.suspendForAd();
        window.__onAndroidRewardedResult = (ok) => {
          this.isAdShowing = false;
          AudioManager.resumeAfterAd();
          if (ok && typeof onReward === 'function') onReward();
          if (typeof onClose === 'function') onClose(Boolean(ok));
        };
        window.AndroidBridge.showRewarded();
        return;
      }
    }

    // Fallback для веба и тестовых сборок без рекламного SDK
    if (typeof onReward === 'function') onReward();
    if (typeof onClose === 'function') onClose(true);
  }

  onContractFinished() {
    this.contractsSinceAd += 1;
    const now = Date.now();
    if (this.contractsSinceAd >= 2 && now - this.lastInterstitialTime > 150000) {
      this.showInterstitial();
    }
  }

  showInterstitial() {
    if (this.isAdShowing) return;

    if (this.platform === 'vk' && this.sdk) {
      this.isAdShowing = true;
      AudioManager.suspendForAd();
      this.sdk.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
        .then(() => {
          this.isAdShowing = false;
          this.lastInterstitialTime = Date.now();
          this.contractsSinceAd = 0;
          AudioManager.resumeAfterAd();
        })
        .catch(() => {
          this.isAdShowing = false;
          AudioManager.resumeAfterAd();
        });
      return;
    }

    if (this.platform === 'yandex' && this.sdk?.adv) {
      this.isAdShowing = true;
      AudioManager.suspendForAd();
      this.sdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: () => {
            this.isAdShowing = false;
            this.lastInterstitialTime = Date.now();
            this.contractsSinceAd = 0;
            AudioManager.resumeAfterAd();
          },
          onError: () => {
            this.isAdShowing = false;
            AudioManager.resumeAfterAd();
          }
        }
      });
      return;
    }

    if (this.platform === 'android' && typeof window?.AndroidBridge?.showInterstitial === 'function') {
      this.isAdShowing = true;
      AudioManager.suspendForAd();
      window.__onAndroidInterstitialClosed = () => {
        this.isAdShowing = false;
        this.lastInterstitialTime = Date.now();
        this.contractsSinceAd = 0;
        AudioManager.resumeAfterAd();
      };
      window.AndroidBridge.showInterstitial();
    }
  }

  // =========================================================================
  // ТАБЛИЦА ЛИДЕРОВ И СНИМКИ ЛАБОРАТОРИЙ ДЛЯ ГОСТЕВОГО РЕЖИМА
  // =========================================================================
  async submitLabProfile(profile) {
    // 1. Отправка в Яндекс Лидерборд (если запущено на Яндекс Играх)
    if (this.platform === 'yandex' && this.yaLeaderboard) {
      try {
        await this.yaLeaderboard.setLeaderboardScore('rocklab_rating', Math.round(profile.score));
      } catch {}
    }

    // 2. Отправка в общий облачный бэкенд (если задан CLOUD_CONFIG)
    if (CLOUD_CONFIG.url && CLOUD_CONFIG.anonKey) {
      try {
        await fetch(`${CLOUD_CONFIG.url}/rest/v1/rocklab_leaderboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: CLOUD_CONFIG.anonKey,
            Authorization: `Bearer ${CLOUD_CONFIG.anonKey}`,
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            player_id: profile.playerId,
            name: profile.name,
            score: Math.round(profile.score),
            reputation: profile.reputation,
            lab_level: profile.labLevel,
            completed_megas: profile.completedMegas,
            snapshot: profile.snapshot,
            updated_at: new Date().toISOString()
          })
        });
      } catch {}
    }
  }

  async fetchLeaderboard(localPlayerProfile) {
    let entries = [...SEED_LABS];

    // Подтягиваем реальные записи из облака (если настроено)
    if (CLOUD_CONFIG.url && CLOUD_CONFIG.anonKey) {
      try {
        const res = await withTimeout(
          fetch(
            `${CLOUD_CONFIG.url}/rest/v1/rocklab_leaderboard?select=*&order=score.desc&limit=25`,
            {
              headers: {
                apikey: CLOUD_CONFIG.anonKey,
                Authorization: `Bearer ${CLOUD_CONFIG.anonKey}`
              }
            }
          ),
          1800
        );
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            entries = rows.map((r) => ({
              playerId: r.player_id,
              name: r.name,
              score: r.score,
              reputation: r.reputation,
              labLevel: r.lab_level,
              completedMegas: r.completed_megas,
              snapshot: r.snapshot
            }));
          }
        }
      } catch {}
    }

    // Добавляем или обновляем самого игрока в общем списке
    if (localPlayerProfile) {
      const idx = entries.findIndex((e) => e.playerId === localPlayerProfile.playerId);
      if (idx >= 0) {
        entries[idx] = { ...localPlayerProfile, isSelf: true };
      } else {
        entries.push({ ...localPlayerProfile, isSelf: true });
      }
    }

    entries.sort((a, b) => b.score - a.score);
    return entries;
  }
}

export const PlatformSDK = new PlatformSDKManager();
