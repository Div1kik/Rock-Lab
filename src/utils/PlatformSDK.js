import { AudioManager } from './AudioManager.js';

class PlatformSDKManager {
  constructor() {
    this.platform = 'web'; // 'vk' | 'yandex' | 'web'
    this.sdk = null;
    this.initialized = false;
    this.isAdShowing = false;
    this.lastInterstitialTime = 0;
    this.contractsSinceAd = 0;
  }

  async init() {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.vkBridge) {
      try {
        await window.vkBridge.send('VKWebAppInit');
        this.platform = 'vk';
        this.sdk = window.vkBridge;
        this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'reward' }).catch(() => {});
        this.sdk.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' }).catch(() => {});
        this.initialized = true;
        return;
      } catch {}
    }

    if (typeof window !== 'undefined' && window.YaGames) {
      try {
        this.sdk = await window.YaGames.init();
        this.platform = 'yandex';
        this.initialized = true;
        return;
      } catch {}
    }

    this.platform = 'web';
    this.initialized = true;
  }

  notifyLoadingReady() {
    if (this.platform === 'yandex' && this.sdk?.features?.LoadingAPI) {
      this.sdk.features.LoadingAPI.ready();
    }
  }

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
    }
  }
}

export const PlatformSDK = new PlatformSDKManager();
