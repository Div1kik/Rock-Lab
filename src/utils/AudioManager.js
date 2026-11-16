import { Storage } from './Storage.js';

class AudioController {
  constructor() {
    this.ctx = null;
    this.adSuspended = false;
    this.pressOsc = null;
    this.pressSubOsc = null;
    this.pressGain = null;

    // Параметры фонового рок-грува
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
  // ФОНОВЫЙ РОК-РИФФ (Гаражный блюз-рок / стоунер грув 116 BPM)
  // =========================================================================
  startMusic() {
    if (this.musicPlaying || !Storage.isSoundEnabled() || this.adSuspended) return;
    if (!this.ctx) return;
    this.musicPlaying = true;
    this.musicStep = 0;

    // 16-шаговый паттерн (одна шестнадцатая ~ 130 мс)
    const stepMs = 132;
    // Ноты риффа в Ми-миноре (частоты в Гц): E2, G2, A2, Bb2, B2, D3
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

      // 1. Ударные: Бочка на 0, 6, 8, 14; Малый барабан на 4, 12; Хэт каждые 2 шага
      if (step === 0 || step === 6 || step === 8 || step === 14) {
        this.triggerKick(now);
      }
      if (step === 4 || step === 12) {
        this.triggerSnare(now);
      }
      if (step % 2 === 0) {
        this.triggerHiHat(now, step % 4 === 2 ? 0.024 : 0.012);
      }

      // 2. Перегруженная рок-гитара / бас
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
    osc2.frequency.setValueAtTime(freq * 1.498, now); // квинта (power chord!)

    // Мягкий овердрайв через волновой шейпер
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
  // РЕАЛИСТИЧНЫЕ ЗВУКИ ИНСТРУМЕНТОВ
  // =========================================================================

  // Мягкий тактильный клик кнопки/тумблера
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

  // Реалистичный электромотор шуруповёрта с редуктором
  playDrillTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Жужжание коллекторного мотора (фильтрованный треугольник + шум щёток)
    const motor = ctx.createOscillator();
    motor.type = 'triangle';
    motor.frequency.setValueAtTime(215 + Math.random() * 25, now);
    motor.frequency.linearRampToValueAtTime(245, now + 0.055);

    const filter = ctx.createBiquadFilter();
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

  // Реалистичный алмазный отрезной диск по камню
  playSawCut() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Высокий звон вращающегося стального диска
    const ring = ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(1480 + Math.random() * 90, now);
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.025, now);
    ringGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.065);
    ring.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring.start(now);
    ring.stop(now + 0.07);

    // 2. Абразивное трение алмазной кромки о породу (фильтрованный шум)
    if (this.noiseBuffer) {
      const grit = ctx.createBufferSource();
      grit.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2400 + Math.random() * 400, now);
      bp.Q.setValueAtTime(3.0, now);

      const gritGain = ctx.createGain();
      gritGain.gain.setValueAtTime(0.085, now);
      gritGain.gain.exponentialRampToValueAtTime(0.002, now + 0.065);

      grit.connect(bp);
      bp.connect(gritGain);
      gritGain.connect(ctx.destination);
      grit.start(now);
      grit.stop(now + 0.07);
    }
  }

  // Металлический щелчок фиксатора / губок штангенциркуля
  playLatchSnap() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const click = ctx.createOscillator();
    click.type = 'triangle';
    click.frequency.setValueAtTime(1100, now);
    click.frequency.exponentialRampToValueAtTime(420, now + 0.045);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    click.connect(gain);
    gain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.055);
  }

  // Тяжёлый многослойный раскол и осыпание каменного керна
  playRockCrack() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Глухой удар разрыва породы
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

    // 2. Хруст осколков и каменной крошки
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

  // Глубокий гидравлический гул насоса пресса
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

  // Тяжёлый удар резиновой печати по бумаге
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
