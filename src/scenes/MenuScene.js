import { Storage } from './Storage.js';

export const MUSIC_TRACKS = [
  {
    name: '01. Warm Lab Rhodes',
    mode: 'rhodes',
    stepSec: 0.36,
    lead: [
      329.63, 0, 392.00, 493.88,
      392.00, 0, 329.63, 0,
      293.66, 0, 349.23, 440.00,
      329.63, 0, 261.63, 0
    ],
    bass: [
      87.31, 0, 0, 0,
      82.41, 0, 0, 0,
      73.42, 0, 0, 0,
      65.41, 0, 0, 0
    ]
  },
  {
    name: '02. Original SEGA Rock',
    mode: 'rock',
    stepSec: 0.145,
    riff: [
      82.41, 0, 82.41, 98.00,
      110.00, 0, 82.41, 0,
      116.54, 110.00, 98.00, 0,
      82.41, 0, 73.42, 82.41
    ]
  },
  {
    name: '03. Quarry Heavy Riff',
    mode: 'rock',
    stepSec: 0.148,
    riff: [
      73.42, 0, 73.42, 87.31,
      98.00, 0, 73.42, 0,
      103.83, 98.00, 87.31, 0,
      73.42, 65.41, 73.42, 0
    ]
  },
  {
    name: '04. Vice Stadium Rock',
    mode: 'rock',
    stepSec: 0.138,
    riff: [
      110.00, 0, 110.00, 130.81,
      146.83, 0, 164.81, 146.83,
      130.81, 0, 110.00, 98.00,
      110.00, 0, 146.83, 130.81
    ]
  },
  {
    name: '05. Core Drill Blues-Rock',
    mode: 'rock',
    stepSec: 0.152,
    riff: [
      98.00, 0, 116.54, 130.81,
      146.83, 0, 130.81, 116.54,
      98.00, 0, 87.31, 98.00,
      116.54, 0, 98.00, 0
    ]
  },
  {
    name: '06. Highway Rig Overdrive',
    mode: 'rock',
    stepSec: 0.140,
    riff: [
      92.50, 0, 92.50, 110.00,
      123.47, 0, 138.59, 123.47,
      110.00, 0, 92.50, 82.41,
      92.50, 110.00, 123.47, 0
    ]
  }
];

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

  getOut() {
    return this.compressor || this.ctx?.destination;
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

  getCurrentTrack() {
    const rawIdx = Number(Storage.getMusicTrack()) || 0;
    const idx = ((rawIdx % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    return MUSIC_TRACKS[idx] || MUSIC_TRACKS[0];
  }

  nextTrack() {
    const rawIdx = Number(Storage.getMusicTrack()) || 0;
    const nextIdx = (rawIdx + 1) % MUSIC_TRACKS.length;
    Storage.setMusicTrack(nextIdx);
    this.musicStep = 0;
    const ctx = this.ensureContext();
    if (ctx) {
      this.nextNoteTime = ctx.currentTime + 0.05;
      if (!this.musicPlaying) this.startMusic();
    }
    this.playLatchSnap();
    return MUSIC_TRACKS[nextIdx];
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

  startMusic() {
    if (!Storage.isSoundEnabled() || this.adSuspended || !this.ctx) return;
    if (this.musicPlaying && this.musicRafId) return;

    this.musicPlaying = true;
    this.musicStep = 0;
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
                if (step === 0 || step === 8) this.triggerSoftPulse(t);
                const bassFreq = track.bass[step];
                if (bassFreq > 0) this.triggerSmoothBass(t, bassFreq, track.stepSec * 3.6);
                const leadFreq = track.lead[step];
                if (leadFreq > 0) this.triggerSmoothPad(t, leadFreq, track.stepSec * 2.4);
              } else {
                if (step === 0 || step === 6 || step === 8 || step === 14) {
                  this.triggerRockKick(t);
                }
                if (step === 4 || step === 12) {
                  this.triggerRockSnare(t);
                }
                const riffFreq = track.riff[step];
                if (riffFreq > 0) {
                  const dur = step === 8 ? track.stepSec * 1.8 : track.stepSec * 1.15;
                  this.triggerPowerChordGuitar(t, riffFreq, dur);
                }
              }

              this.nextNoteTime += track.stepSec;
              this.musicStep += 1;
            }
          }
        }
      } catch (err) {
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

  triggerSoftPulse(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(82, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);

    osc.connect(gain);
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + 0.24);
  }

  triggerSmoothBass(now, freq, duration) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0008, now);
    gain.gain.linearRampToValueAtTime(0.042, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  triggerSmoothPad(now, freq, duration) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 0.5, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.linearRampToValueAtTime(340, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.getOut());

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.03);
    osc2.stop(now + duration + 0.03);
  }

  triggerRockKick(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(122, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);

    gain.gain.setValueAtTime(0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + 0.13);
  }

  triggerRockSnare(now) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1180, now);
    filter.Q.setValueAtTime(0.95, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.048, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getOut());
    noise.start(now);
    noise.stop(now + 0.13);
  }

  triggerPowerChordGuitar(now, freq, duration) {
    const rootOsc = this.ctx.createOscillator();
    const fifthOsc = this.ctx.createOscillator();
    rootOsc.type = 'triangle';
    fifthOsc.type = 'sawtooth';

    rootOsc.frequency.setValueAtTime(freq, now);
    fifthOsc.frequency.setValueAtTime(freq * 1.498, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(640, now);
    filter.frequency.exponentialRampToValueAtTime(290, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    rootOsc.connect(filter);
    fifthOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getOut());

    rootOsc.start(now);
    fifthOsc.start(now);
    rootOsc.stop(now + duration + 0.015);
    fifthOsc.stop(now + duration + 0.015);
  }

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
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + 0.045);
  }

  playDrillTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

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
    gain.connect(this.getOut());
    motor.start(now);
    motor.stop(now + 0.065);
  }

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
    gain.connect(this.getOut());
    creak.start(now);
    creak.stop(now + 0.11);
  }

  playCorePickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(260, now);
    body.frequency.exponentialRampToValueAtTime(145, now + 0.075);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    body.connect(gain);
    gain.connect(this.getOut());
    body.start(now);
    body.stop(now + 0.09);

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
      rGain.connect(this.getOut());
      rustle.start(now);
      rustle.stop(now + 0.075);
    }
  }

  playSawCut() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const motor = ctx.createOscillator();
    motor.type = 'triangle';
    motor.frequency.setValueAtTime(148 + Math.random() * 18, now);
    motor.frequency.linearRampToValueAtTime(165, now + 0.065);

    const motorGain = ctx.createGain();
    motorGain.gain.setValueAtTime(0.07, now);
    motorGain.gain.exponentialRampToValueAtTime(0.002, now + 0.07);

    motor.connect(motorGain);
    motorGain.connect(this.getOut());
    motor.start(now);
    motor.stop(now + 0.075);

    if (this.noiseBuffer) {
      const grit = this.ctx.createBufferSource();
      grit.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(950 + Math.random() * 180, now);
      bp.Q.setValueAtTime(1.6, now);

      const gritGain = ctx.createGain();
      gritGain.gain.setValueAtTime(0.06, now);
      gritGain.gain.exponentialRampToValueAtTime(0.002, now + 0.07);

      grit.connect(bp);
      bp.connect(gritGain);
      gritGain.connect(this.getOut());
      grit.start(now);
      grit.stop(now + 0.075);
    }
  }

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
    gain.connect(this.getOut());
    click.start(now);
    click.stop(now + 0.055);
  }

  playRockCrack() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(110, now);
    thud.frequency.exponentialRampToValueAtTime(34, now + 0.16);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.26, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    thud.connect(thudGain);
    thudGain.connect(this.getOut());
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
      dGain.gain.setValueAtTime(0.22, now);
      dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      debris.connect(filter);
      filter.connect(dGain);
      dGain.connect(this.getOut());
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
      this.pressGain.connect(this.getOut());

      this.pressOsc.start();
      this.pressSubOsc.start();
    }
    const now = ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, loadRatio));
    this.pressOsc.frequency.setTargetAtTime(50 + clamped * 45, now, 0.05);
    this.pressSubOsc.frequency.setTargetAtTime(100 + clamped * 90, now, 0.05);
    this.pressGain.gain.setTargetAtTime(0.05 + clamped * 0.08, now, 0.05);
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

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.getOut());
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const AudioManager = new AudioController();
