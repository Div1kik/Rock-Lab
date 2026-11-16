import { Storage } from './Storage.js';

class AudioController {
  constructor() {
    this.ctx = null;
    this.adSuspended = false;
    this.pressOsc = null;
    this.pressSubOsc = null;
    this.pressGain = null;

    this.musicTimer = null;
    this.musicStep = 0;
    this.musicPlaying = false;
    this.noiseBuffer = null;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) {
          this.stopPressHum();
          this.stopMusic();
          this.ctx.suspend().catch(() => {});
        } else if (!this.adSuspended && Storage.isSoundEnabled()) {
          this.ctx.resume().catch(() => {});
          this.startMusic();
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
      this.buildNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.musicPlaying) {
      this.startMusic();
    }
    return this.ctx;
  }

  buildNoiseBuffer() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 1.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
  }

  suspendForAd() {
    this.adSuspended = true;
    this.stopPressHum();
    this.stopMusic();
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  resumeAfterAd() {
    this.adSuspended = false;
    if (this.ctx && Storage.isSoundEnabled() && !document.hidden) {
      this.ctx.resume().catch(() => {});
      this.startMusic();
    }
  }

  // =========================================================================
  // ФОНОВЫЙ РОК-РИФФ (SEGA-драйв 116 BPM)
  // =========================================================================
  startMusic() {
    if (this.musicPlaying || !Storage.isSoundEnabled() || this.adSuspended) return;
    if (!this.ctx) return;
    this.musicPlaying = true;
    this.musicStep = 0;

    const stepMs = 132;
    const riffNotes = [
      82.41, 0, 82.41, 98.00,
      110.00, 0, 82.41, 0,
      116.54, 110.00, 98.00, 0,
      82.41, 0, 73.42, 82.41
    ];

    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || !Storage.isSoundEnabled() || this.adSuspended) {
        return;
      }

      const step = this.musicStep % 16;
      const now = this.ctx.currentTime;

      if (step === 0 || step === 6 || step === 8 || step === 14) {
        this.triggerKick(now);
      }
      if (step === 4 || step === 12) {
        this.triggerSnare(now);
      }
      if (step % 2 === 0) {
        this.triggerHiHat(now, step % 4 === 2 ? 0.024 : 0.012);
      }

      const freq = riffNotes[step];
      if (freq > 0) {
        this.triggerRockGuitar(now, freq, step === 8 ? 0.24 : 0.14);
      }

      this.musicStep += 1;
    }, stepMs);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  triggerKick(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  triggerSnare(now) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1350, now);
    filter.Q.setValueAtTime(0.9, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  triggerHiHat(now, vol) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);
  }

  triggerRockGuitar(now, freq, duration) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.498, now);

    const shaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = Math.tanh(x * 2.4);
    }
    shaper.curve = curve;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(780, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.042, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(shaper);
    osc2.connect(shaper);
    shaper.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.01);
    osc2.stop(now + duration + 0.01);
  }

  // =========================================================================
  // ОБНОВЛЁННЫЕ ЗВУКИ ИНСТРУМЕНТОВ
  // =========================================================================

  playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Мотор шуруповёрта
  playDrillTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const motor = ctx.createOscillator();
    motor.type = 'triangle';
    motor.frequency.setValueAtTime(215 + Math.random() * 25, now);
    motor.frequency.linearRampToValueAtTime(245, now + 0.055);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.002, now + 0.06);

    motor.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    motor.start(now);
    motor.stop(now + 0.065);
  }

  // Трение и скрип ломика по дереву ящика
  playCrowbarPry() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const creak = ctx.createOscillator();
    creak.type = 'triangle';
    creak.frequency.setValueAtTime(150 + Math.random() * 40, now);
    creak.frequency.exponentialRampToValueAtTime(260, now + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    creak.connect(gain);
    gain.connect(ctx.destination);
    creak.start(now);
    creak.stop(now + 0.11);
  }

  // Мягкий, приятный звук доставания каменного керна из поролонового лотка
  playCorePickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Тёплый деревянно-каменный стук (низкий резонанс без писка)
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(260, now);
    body.frequency.exponentialRampToValueAtTime(145, now + 0.075);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    body.connect(gain);
    gain.connect(ctx.destination);
    body.start(now);
    body.stop(now + 0.09);

    // 2. Лёгкий шорох поролона
    if (this.noiseBuffer) {
      const rustle = ctx.createBufferSource();
      rustle.buffer = this.noiseBuffer;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(900, now);

      const rGain = ctx.createGain();
      rGain.gain.setValueAtTime(0.045, now);
      rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      rustle.connect(lp);
      lp.connect(rGain);
      rGain.connect(ctx.destination);
      rustle.start(now);
      rustle.stop(now + 0.075);
    }
  }

  // Доработанный звук камнерезной пилы (низкий рокот станка + влажное шлифование без визга)
  playSawCut() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Плотный гул электродвигателя станка (145..175 Гц)
    const motor = ctx.createOscillator();
    motor.type = 'triangle';
    motor.frequency.setValueAtTime(148 + Math.random() * 18, now);
    motor.frequency.linearRampToValueAtTime(165, now + 0.065);

    const motorGain = ctx.createGain();
    motorGain.gain.setValueAtTime(0.075, now);
    motorGain.gain.exponentialRampToValueAtTime(0.002, now + 0.07);

    motor.connect(motorGain);
    motorGain.connect(ctx.destination);
    motor.start(now);
    motor.stop(now + 0.075);

    // 2. Мягкое водяное шипение алмазного диска о породу (среднечастотный фильтр без высоких писков)
    if (this.noiseBuffer) {
      const grit = this.ctx.createBufferSource();
      grit.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(950 + Math.random() * 180, now);
      bp.Q.setValueAtTime(1.6, now);

      const gritGain = ctx.createGain();
      gritGain.gain.setValueAtTime(0.065, now);
      gritGain.gain.exponentialRampToValueAtTime(0.002, now + 0.07);

      grit.connect(bp);
      bp.connect(gritGain);
      gritGain.connect(ctx.destination);
      grit.start(now);
      grit.stop(now + 0.075);
    }
  }

  // Металлический щелчок фиксатора / губок штангенциркуля
  playLatchSnap() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const click = ctx.createOscillator();
    click.type = 'triangle';
    click.frequency.setValueAtTime(860, now);
    click.frequency.exponentialRampToValueAtTime(340, now + 0.045);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    click.connect(gain);
    gain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.055);
  }

  // Тяжёлый раскол и осыпание каменного керна
  playRockCrack() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(110, now);
    thud.frequency.exponentialRampToValueAtTime(34, now + 0.16);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.28, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.18);

    if (this.noiseBuffer) {
      const debris = ctx.createBufferSource();
      debris.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680, now);
      filter.Q.setValueAtTime(1.1, now);

      const dGain = ctx.createGain();
      dGain.gain.setValueAtTime(0.24, now);
      dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      debris.connect(filter);
      filter.connect(dGain);
      dGain.connect(ctx.destination);
      debris.start(now);
      debris.stop(now + 0.25);
    }
  }

  updatePressHum(loadRatio) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.pressOsc) {
      this.pressOsc = ctx.createOscillator();
      this.pressSubOsc = ctx.createOscillator();
      this.pressGain = ctx.createGain();

      this.pressOsc.type = 'sine';
      this.pressSubOsc.type = 'triangle';

      this.pressOsc.frequency.setValueAtTime(52, ctx.currentTime);
      this.pressSubOsc.frequency.setValueAtTime(104, ctx.currentTime);
      this.pressGain.gain.setValueAtTime(0.001, ctx.currentTime);

      this.pressOsc.connect(this.pressGain);
      this.pressSubOsc.connect(this.pressGain);
      this.pressGain.connect(ctx.destination);

      this.pressOsc.start();
      this.pressSubOsc.start();
    }
    const now = ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, loadRatio));
    this.pressOsc.frequency.setTargetAtTime(50 + clamped * 45, now, 0.05);
    this.pressSubOsc.frequency.setTargetAtTime(100 + clamped * 90, now, 0.05);
    this.pressGain.gain.setTargetAtTime(0.05 + clamped * 0.09, now, 0.05);
  }

  stopPressHum() {
    if (this.pressOsc && this.ctx) {
      try {
        this.pressGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
        this.pressOsc.stop(this.ctx.currentTime + 0.05);
        if (this.pressSubOsc) this.pressSubOsc.stop(this.ctx.currentTime + 0.05);
      } catch {}
    }
    this.pressOsc = null;
    this.pressSubOsc = null;
    this.pressGain = null;
  }

  playStamp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.13);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const AudioManager = new AudioController();
