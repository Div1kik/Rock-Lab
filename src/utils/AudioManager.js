import { Storage } from './Storage.js';

export const MUSIC_PACK_CATALOG = [
  { id: 'base', name: 'Пак: Классика ROCK LAB (База)', desc: '5 оригинальных композиций лаборатории', isBase: true, icon: '📻' },
  { id: 'industrial', name: 'Пак: Арктический Индастриал', desc: '5 тяжёлых механических и буровых треков', price: 6500, icon: '🏭' },
  { id: 'retro', name: 'Пак: Ретро-Грунт 80-х', desc: '5 неоновых синтвейв и Outrun-композиций', reqAds: 3, icon: '🌆' },
  { id: 'stoner', name: 'Пак: Стоунер-Карьер', desc: '5 густых качающих риффов для тяжёлых пород', price: 14000, icon: '🏜️' },
  { id: 'cyber', name: 'Пак: Кибер-Керн', desc: '5 быстрых техно-секвенций и синтезаторов', reqAds: 5, icon: '💠' },
  { id: 'blues', name: 'Пак: Ночной Блюз Буровиков', desc: '5 ламповых вечерних мелодий после смены', price: 25000, icon: '🎸' }
];

const PACK_TRACKS = {
  base: [
    { name: '01. Warm Lab Rhodes', mode: 'rhodes', stepSec: 0.36, lead: [329.63, 0, 392.00, 493.88, 392.00, 0, 329.63, 0, 293.66, 0, 349.23, 440.00, 329.63, 0, 261.63, 0], bass: [87.31, 0, 0, 0, 82.41, 0, 0, 0, 73.42, 0, 0, 0, 65.41, 0, 0, 0] },
    { name: '02. Original SEGA Rock', mode: 'rock', stepSec: 0.145, riff: [82.41, 0, 82.41, 98.00, 110.00, 0, 82.41, 0, 116.54, 110.00, 98.00, 0, 82.41, 0, 73.42, 82.41] },
    { name: '03. Quarry Heavy Riff', mode: 'rock', stepSec: 0.148, riff: [73.42, 0, 73.42, 87.31, 98.00, 0, 73.42, 0, 103.83, 98.00, 87.31, 0, 73.42, 65.41, 73.42, 0] },
    { name: '04. Vice Stadium Rock', mode: 'rock', stepSec: 0.138, riff: [110.00, 0, 110.00, 130.81, 146.83, 0, 164.81, 146.83, 130.81, 0, 110.00, 98.00, 110.00, 0, 146.83, 130.81] },
    { name: '05. Core Drill Blues-Rock', mode: 'rock', stepSec: 0.152, riff: [98.00, 0, 116.54, 130.81, 146.83, 0, 130.81, 116.54, 98.00, 0, 87.31, 98.00, 116.54, 0, 98.00, 0] }
  ],
  industrial: [
    { name: '🏭 01. Deep Shaft Pulse', mode: 'rock', stepSec: 0.130, riff: [65.41, 0, 73.42, 65.41, 98.00, 0, 87.31, 0, 65.41, 0, 110.00, 98.00, 73.42, 0, 65.41, 0] },
    { name: '🏭 02. Permafrost Heavy Gear', mode: 'rock', stepSec: 0.135, riff: [73.42, 73.42, 0, 87.31, 98.00, 0, 103.83, 0, 73.42, 0, 87.31, 0, 65.41, 73.42, 0, 0] },
    { name: '🏭 03. Subzero Cybernetic', mode: 'rock', stepSec: 0.128, riff: [82.41, 0, 98.00, 110.00, 0, 123.47, 110.00, 0, 82.41, 0, 73.42, 0, 92.50, 0, 82.41, 0] },
    { name: '🏭 04. Drill Bit Overload', mode: 'rock', stepSec: 0.125, riff: [92.50, 92.50, 110.00, 0, 123.47, 0, 110.00, 92.50, 82.41, 0, 73.42, 0, 92.50, 0, 110.00, 0] },
    { name: '🏭 05. Titan Foundation', mode: 'rock', stepSec: 0.140, riff: [55.00, 0, 73.42, 0, 82.41, 0, 73.42, 65.41, 55.00, 0, 98.00, 87.31, 73.42, 0, 55.00, 0] }
  ],
  retro: [
    { name: '🌆 01. Neon Core Synth', mode: 'rhodes', stepSec: 0.32, lead: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 0, 220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 220.00, 0], bass: [110.00, 0, 110.00, 0, 98.00, 0, 98.00, 0, 87.31, 0, 87.31, 0, 92.50, 0, 92.50, 0] },
    { name: '🌆 02. Quarry Highway 1984', mode: 'rock', stepSec: 0.140, riff: [110.00, 0, 130.81, 146.83, 164.81, 0, 146.83, 130.81, 110.00, 0, 98.00, 110.00, 130.81, 0, 110.00, 0] },
    { name: '🌆 03. Seismic Night Drive', mode: 'rock', stepSec: 0.142, riff: [98.00, 0, 116.54, 130.81, 0, 146.83, 130.81, 116.54, 98.00, 0, 87.31, 0, 98.00, 116.54, 130.81, 0] },
    { name: '🌆 04. Stratum Sunset', mode: 'rhodes', stepSec: 0.34, lead: [293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 293.66, 0, 261.63, 293.66, 349.23, 392.00, 349.23, 293.66, 261.63, 0], bass: [73.42, 0, 73.42, 0, 82.41, 0, 82.41, 0, 65.41, 0, 65.41, 0, 73.42, 0, 73.42, 0] },
    { name: '🌆 05. Digital Drillbeat', mode: 'rock', stepSec: 0.136, riff: [123.47, 0, 146.83, 164.81, 0, 185.00, 164.81, 146.83, 123.47, 0, 110.00, 0, 123.47, 146.83, 164.81, 0] }
  ],
  stoner: [
    { name: '🏜️ 01. Basalt Fuzz Groove', mode: 'rock', stepSec: 0.165, riff: [65.41, 0, 65.41, 77.78, 87.31, 0, 98.00, 87.31, 77.78, 0, 65.41, 58.27, 65.41, 0, 87.31, 0] },
    { name: '🏜️ 02. Red Canyon Rig', mode: 'rock', stepSec: 0.160, riff: [73.42, 0, 87.31, 0, 98.00, 110.00, 98.00, 0, 87.31, 0, 73.42, 65.41, 73.42, 0, 65.41, 0] },
    { name: '🏜️ 03. Magma Chamber', mode: 'rock', stepSec: 0.170, riff: [58.27, 0, 58.27, 69.30, 77.78, 0, 87.31, 0, 77.78, 69.30, 58.27, 0, 51.91, 0, 58.27, 0] },
    { name: '🏜️ 04. Dust & Granite', mode: 'rock', stepSec: 0.158, riff: [82.41, 0, 98.00, 110.00, 123.47, 0, 110.00, 98.00, 82.41, 0, 73.42, 82.41, 98.00, 0, 82.41, 0] },
    { name: '🏜️ 05. Deep Earth Crawler', mode: 'rock', stepSec: 0.168, riff: [61.74, 0, 73.42, 0, 82.41, 92.50, 82.41, 0, 73.42, 0, 61.74, 55.00, 61.74, 0, 73.42, 0] }
  ],
  cyber: [
    { name: '💠 01. Ultrasonic Matrix', mode: 'rock', stepSec: 0.122, riff: [110.00, 130.81, 146.83, 164.81, 146.83, 130.81, 110.00, 0, 123.47, 146.83, 164.81, 196.00, 164.81, 146.83, 123.47, 0] },
    { name: '💠 02. Laser Caliper Grid', mode: 'rhodes', stepSec: 0.28, lead: [440.00, 523.25, 659.25, 523.25, 440.00, 392.00, 440.00, 0, 349.23, 440.00, 523.25, 440.00, 349.23, 329.63, 349.23, 0], bass: [110.00, 110.00, 0, 110.00, 98.00, 98.00, 0, 98.00, 87.31, 87.31, 0, 87.31, 82.41, 82.41, 0, 82.41] },
    { name: '💠 03. Core Scanner 2099', mode: 'rock', stepSec: 0.126, riff: [98.00, 0, 116.54, 146.83, 130.81, 0, 116.54, 98.00, 110.00, 0, 130.81, 164.81, 146.83, 0, 130.81, 0] },
    { name: '💠 04. Triaxial Telemetry', mode: 'rock', stepSec: 0.124, riff: [130.81, 146.83, 164.81, 0, 196.00, 164.81, 146.83, 0, 110.00, 130.81, 146.83, 0, 164.81, 146.83, 130.81, 0] },
    { name: '💠 05. Quantum Stratum', mode: 'rhodes', stepSec: 0.30, lead: [392.00, 493.88, 587.33, 493.88, 392.00, 329.63, 392.00, 0, 349.23, 440.00, 523.25, 440.00, 349.23, 293.66, 349.23, 0], bass: [98.00, 0, 98.00, 0, 82.41, 0, 82.41, 0, 87.31, 0, 87.31, 0, 73.42, 0, 73.42, 0] }
  ],
  blues: [
    { name: '🎸 01. Midnight Shift Blues', mode: 'rhodes', stepSec: 0.38, lead: [293.66, 0, 349.23, 392.00, 440.00, 0, 392.00, 349.23, 261.63, 0, 329.63, 392.00, 349.23, 0, 293.66, 0], bass: [73.42, 0, 87.31, 0, 98.00, 0, 87.31, 0, 65.41, 0, 82.41, 0, 73.42, 0, 65.41, 0] },
    { name: '🎸 02. Coffee & Core Samples', mode: 'rhodes', stepSec: 0.37, lead: [329.63, 392.00, 440.00, 0, 392.00, 329.63, 293.66, 0, 261.63, 329.63, 392.00, 0, 329.63, 293.66, 261.63, 0], bass: [82.41, 0, 98.00, 0, 110.00, 0, 98.00, 0, 65.41, 0, 82.41, 0, 73.42, 0, 65.41, 0] },
    { name: '🎸 03. Rusty Wrench Shuffle', mode: 'rock', stepSec: 0.162, riff: [82.41, 0, 98.00, 110.00, 123.47, 0, 110.00, 98.00, 82.41, 0, 98.00, 110.00, 98.00, 0, 82.41, 0] },
    { name: '🎸 04. Northern Lights Acoustic', mode: 'rhodes', stepSec: 0.39, lead: [349.23, 0, 440.00, 523.25, 493.88, 0, 440.00, 392.00, 329.63, 0, 392.00, 440.00, 392.00, 0, 349.23, 0], bass: [87.31, 0, 0, 0, 82.41, 0, 0, 0, 73.42, 0, 0, 0, 65.41, 0, 0, 0] },
    { name: '🎸 05. Last Core of the Day', mode: 'rhodes', stepSec: 0.38, lead: [261.63, 0, 329.63, 392.00, 440.00, 0, 392.00, 329.63, 293.66, 0, 349.23, 392.00, 329.63, 0, 261.63, 0], bass: [65.41, 0, 82.41, 0, 73.42, 0, 87.31, 0, 65.41, 0, 82.41, 0, 65.41, 0, 0, 0] }
  ]
};

class AudioController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.adSuspended = false;
    this.pressOsc = null;
    this.pressSubOsc = null;
    this.pressGain = null;
    this.musicPlaying = false;
    this.musicRafId = null;
    this.nextNoteTime = 0;
    this.musicStep = 0;
    this.noiseBuffer = null;
    this.trackStepCount = 0;

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

  getAllUnlockedTracks() {
    let tracks = [];
    const unlockedPacks = Storage.getUnlockedMusicPacks();
    const enabledPacks = Storage.getEnabledMusicPacks();

    for (const pack of MUSIC_PACK_CATALOG) {
      if (unlockedPacks.includes(pack.id) && enabledPacks.includes(pack.id) && PACK_TRACKS[pack.id]) {
        tracks = tracks.concat(PACK_TRACKS[pack.id]);
      }
    }
    return tracks.length > 0 ? tracks : [...PACK_TRACKS.base];
  }

  activatePackFirstTrack(packId) {
    const tracks = this.getAllUnlockedTracks();
    const packFirstTrackName = PACK_TRACKS[packId]?.[0]?.name;
    const targetIdx = tracks.findIndex((t) => t.name === packFirstTrackName);
    Storage.setMusicTrack(targetIdx >= 0 ? targetIdx : 0);
    this.musicStep = 0;
    this.trackStepCount = 0;
    const ctx = this.ensureContext();
    if (ctx) {
      this.nextNoteTime = ctx.currentTime + 0.05;
      if (!this.musicPlaying) this.startMusic();
    }
  }

  ensureContext() {
    if (!Storage.isSoundEnabled() || this.adSuspended) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      const len = this.ctx.sampleRate * 1.5;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!this.musicPlaying) this.startMusic();
    return this.ctx;
  }

  getOut() {
    return this.compressor || this.ctx?.destination;
  }

  getCurrentTrack() {
    const tracks = this.getAllUnlockedTracks();
    const raw = Number(Storage.getMusicTrack()) || 0;
    const idx = ((raw % tracks.length) + tracks.length) % tracks.length;
    return tracks[idx] || tracks[0];
  }

  nextTrack() {
    const tracks = this.getAllUnlockedTracks();
    const raw = Number(Storage.getMusicTrack()) || 0;
    const nextIdx = (raw + 1) % tracks.length;
    Storage.setMusicTrack(nextIdx);
    this.musicStep = 0;
    this.trackStepCount = 0;
    const ctx = this.ensureContext();
    if (ctx) {
      this.nextNoteTime = ctx.currentTime + 0.05;
      if (!this.musicPlaying) this.startMusic();
    }
    this.playLatchSnap();
    return tracks[nextIdx];
  }

  togglePlayMode() {
    const currentMode = Storage.getMusicPlayMode ? Storage.getMusicPlayMode() : 'playlist';
    const newMode = currentMode === 'playlist' ? 'loop' : 'playlist';
    if (Storage.setMusicPlayMode) Storage.setMusicPlayMode(newMode);
    this.ensureContext();
    this.playLatchSnap();
    return newMode;
  }

  getPlayMode() {
    return Storage.getMusicPlayMode ? Storage.getMusicPlayMode() : 'playlist';
  }

  suspendForAd() {
    this.adSuspended = true;
    this.stopPressHum();
    this.stopMusic();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resumeAfterAd() {
    this.adSuspended = false;
    if (this.ctx && Storage.isSoundEnabled() && !document.hidden) {
      this.ctx.resume().catch(() => {});
      this.startMusic();
    }
  }

  startMusic() {
    if (!Storage.isSoundEnabled() || this.adSuspended || !this.ctx) return;
    if (this.musicPlaying && this.musicRafId) return;
    this.musicPlaying = true;
    this.musicStep = 0;
    this.trackStepCount = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.06;

    const scheduler = () => {
      if (!this.musicPlaying) {
        this.musicRafId = null;
        return;
      }
      try {
        if (this.ctx && Storage.isSoundEnabled() && !this.adSuspended) {
          if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
            this.nextNoteTime = this.ctx.currentTime + 0.06;
          } else if (this.ctx.state === 'running') {
            if (this.nextNoteTime < this.ctx.currentTime - 0.5) {
              this.nextNoteTime = this.ctx.currentTime + 0.05;
            }
            while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
              const track = this.getCurrentTrack();
              const step = this.musicStep % 16;
              const t = this.nextNoteTime;

              if (track.mode === 'rhodes') {
                if (step === 0 || step === 8) this.triggerTone(t, 82, 38, 0.22, 'sine', 0.055);
                if (track.bass[step] > 0) this.triggerPad(t, track.bass[step], track.stepSec * 3.6, 0.042, 220);
                if (track.lead[step] > 0) this.triggerPad(t, track.lead[step], track.stepSec * 2.4, 0.024, 520);
              } else {
                if (step === 0 || step === 6 || step === 8 || step === 14) this.triggerTone(t, 122, 42, 0.12, 'sine', 0.095);
                if (step === 4 || step === 12) this.triggerNoise(t, 1180, 0.12, 0.048);
                if (track.riff[step] > 0) {
                  const dur = step === 8 ? track.stepSec * 1.8 : track.stepSec * 1.15;
                  this.triggerGuitar(t, track.riff[step], dur);
                }
              }
              this.nextNoteTime += track.stepSec;
              this.musicStep += 1;
              this.trackStepCount += 1;

              const stepsForTwoMinutes = Math.max(320, Math.round(120 / track.stepSec));
              if (this.trackStepCount >= stepsForTwoMinutes) {
                this.trackStepCount = 0;
                if (this.getPlayMode() === 'playlist') {
                  const tracks = this.getAllUnlockedTracks();
                  const raw = Number(Storage.getMusicTrack()) || 0;
                  Storage.setMusicTrack((raw + 1) % tracks.length);
                }
              }
            }
          }
        }
      } catch {
        if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.1;
      }
      this.musicRafId = requestAnimationFrame(scheduler);
    };
    this.musicRafId = requestAnimationFrame(scheduler);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicRafId) {
      cancelAnimationFrame(this.musicRafId);
      this.musicRafId = null;
    }
  }

  triggerTone(now, f1, f2, dur, type, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + dur * 0.9);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  triggerNoise(now, freq, dur, vol, q = 1.0) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(freq, now);
    flt.Q.setValueAtTime(q, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.getOut());
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  triggerPad(now, freq, dur, vol, cutoff) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(cutoff, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  triggerGuitar(now, freq, dur) {
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    o1.type = 'triangle';
    o2.type = 'sawtooth';
    o1.frequency.setValueAtTime(freq, now);
    o2.frequency.setValueAtTime(freq * 1.498, now);
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(640, now);
    flt.frequency.exponentialRampToValueAtTime(290, now + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    o1.connect(flt);
    o2.connect(flt);
    flt.connect(gain);
    gain.connect(this.getOut());
    o1.start(now);
    o2.start(now);
    o1.stop(now + dur + 0.02);
    o2.stop(now + dur + 0.02);
  }

  playClick() { if (this.ensureContext()) this.triggerTone(this.ctx.currentTime, 320, 140, 0.04, 'sine', 0.11); }
  playDrillTick() { if (this.ensureContext()) this.triggerTone(this.ctx.currentTime, 225, 250, 0.06, 'triangle', 0.09); }
  playCrowbarPry() { if (this.ensureContext()) this.triggerTone(this.ctx.currentTime, 160, 260, 0.1, 'triangle', 0.13); }
  playCorePickup() { if (!this.ensureContext()) return; this.triggerTone(this.ctx.currentTime, 260, 145, 0.085, 'sine', 0.16); this.triggerNoise(this.ctx.currentTime, 700, 0.07, 0.045); }

  playSawCut() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const pitchJitter = Math.random() * 45;
    this.triggerTone(now, 880 + pitchJitter, 940 + pitchJitter, 0.075, 'sine', 0.045);
    this.triggerNoise(now, 1480 + pitchJitter * 2, 0.075, 0.065, 2.4);
  }

  playGrindTick() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    this.triggerTone(now, 118, 126, 0.085, 'triangle', 0.075);
    this.triggerNoise(now, 460 + Math.random() * 50, 0.085, 0.055, 0.85);
  }

  playLatchSnap() { if (this.ensureContext()) this.triggerTone(this.ctx.currentTime, 860, 340, 0.05, 'triangle', 0.13); }
  playRockCrack() { if (!this.ensureContext()) return; this.triggerTone(this.ctx.currentTime, 110, 34, 0.17, 'sine', 0.26); this.triggerNoise(this.ctx.currentTime, 680, 0.24, 0.22); }
  playStamp() { if (this.ensureContext()) this.triggerTone(this.ctx.currentTime, 135, 38, 0.14, 'sine', 0.22); }

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
      this.pressGain.connect(this.getOut());
      this.pressOsc.start();
      this.pressSubOsc.start();
    }
    const now = ctx.currentTime;
    const c = Math.max(0, Math.min(1, loadRatio));
    this.pressOsc.frequency.setTargetAtTime(50 + c * 45, now, 0.05);
    this.pressSubOsc.frequency.setTargetAtTime(100 + c * 90, now, 0.05);
    this.pressGain.gain.setTargetAtTime(0.05 + c * 0.08, now, 0.05);
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
}

export const AudioManager = new AudioController();
