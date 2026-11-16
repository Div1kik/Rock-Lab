import { Storage } from './Storage.js';

class AudioController {
  constructor() {
    this.ctx = null;
    this.adSuspended = false;
    this.pressOsc = null;
    this.pressGain = null;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) {
          this.stopPressHum();
          this.ctx.suspend().catch(() => {});
        } else if (!this.adSuspended && Storage.isSoundEnabled()) {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  ensureContext() {
    if (!Storage.isSoundEnabled() || this.adSuspended) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  suspendForAd() {
    this.adSuspended = true;
    this.stopPressHum();
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  resumeAfterAd() {
    this.adSuspended = false;
    if (this.ctx && Storage.isSoundEnabled() && !document.hidden) {
      this.ctx.resume().catch(() => {});
    }
  }

  playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.045);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playDrillTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160 + Math.random() * 45, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Звук алмазного отрезного диска (короткий импульс реза камня)
  playSawCut() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(680 + Math.random() * 140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.055);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playLatchSnap() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.07);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playRockCrack() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(1.4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  updatePressHum(loadRatio) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.pressOsc) {
      this.pressOsc = ctx.createOscillator();
      this.pressGain = ctx.createGain();
      this.pressOsc.type = 'triangle';
      this.pressOsc.frequency.setValueAtTime(65, ctx.currentTime);
      this.pressGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.pressOsc.connect(this.pressGain);
      this.pressGain.connect(ctx.destination);
      this.pressOsc.start();
    }
    const now = ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, loadRatio));
    this.pressOsc.frequency.setTargetAtTime(60 + clamped * 110, now, 0.04);
    this.pressGain.gain.setTargetAtTime(0.04 + clamped * 0.08, now, 0.04);
  }

  stopPressHum() {
    if (this.pressOsc && this.ctx) {
      try {
        this.pressGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
        this.pressOsc.stop(this.ctx.currentTime + 0.05);
      } catch {}
    }
    this.pressOsc = null;
    this.pressGain = null;
  }

  playStamp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }
}

export const AudioManager = new AudioController();
