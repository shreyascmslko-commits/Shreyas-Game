import { WorldId, GemType, PowerUpType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.75;
  private musicVolume: number = 0.5;

  private musicInterval: number | null = null;
  private currentWorld: WorldId = 'crystal-valley';
  private step: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.sfxGain.gain.value = this.sfxVolume;
        this.musicGain.gain.value = this.musicVolume;
        this.masterGain.gain.value = this.isMuted ? 0 : 1;

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public ensureAudio() {
    this.initContext();
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  // --- SOUND EFFECTS ---

  public playGem(combo: number, type: GemType) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale base frequencies
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];
    const pitchIndex = Math.min(combo, scale.length - 1);
    let freq = scale[pitchIndex];

    if (type === 'ruby') freq *= 1.25;
    if (type === 'prismatic-star') freq *= 1.5;

    osc.type = type === 'prismatic-star' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);

    // If rare prismatic star, add a shimmering 2nd harmonic sparkle
    if (type === 'prismatic-star') {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(freq * 2.8, now + 0.28);

      gain2.gain.setValueAtTime(0.15, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.31);
    }
  }

  public playPowerUp(type: PowerUpType) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = type === 'speed-boost' ? [440, 554, 659, 880] : [392, 523, 659, 784];

    notes.forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, noteTime);
      osc.frequency.exponentialRampToValueAtTime(f * 1.15, noteTime + 0.18);

      gain.gain.setValueAtTime(0.16, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.23);
    });
  }

  public playShieldDeflect() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Sub thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // Filtered noise snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
  }

  public playLevelComplete() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [440, 415, 392, 330];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.16;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // --- PROCEDURAL BACKGROUND MUSIC ---
  // Beautiful, non-intrusive cosmic ambient arpeggio track running via Web Audio intervals

  public startMusic(worldId: WorldId) {
    this.currentWorld = worldId;
    if (this.musicInterval) return;

    this.step = 0;
    // Step clock every 240ms (125 BPM sixteenth/eighth notes)
    this.musicInterval = window.setInterval(() => {
      this.playMusicStep();
    }, 240);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public setMusicWorld(worldId: WorldId) {
    this.currentWorld = worldId;
  }

  private playMusicStep() {
    this.initContext();
    if (!this.ctx || !this.musicGain || this.isMuted || this.musicVolume <= 0) return;

    const now = this.ctx.currentTime;
    const s = this.step % 16;
    this.step++;

    // Different scale patterns for each world
    const scales: Record<WorldId, number[]> = {
      'crystal-valley': [261.63, 329.63, 392.0, 493.88, 523.25, 659.25], // C Lydian / Crystal serenity
      'neon-galaxy': [220.0, 261.63, 329.63, 392.0, 440.0, 523.25], // A Minor / Neon drive
      'rainbow-nebula': [293.66, 369.99, 440.0, 554.37, 587.33, 739.99], // D Major / Rainbow shimmer
      'golden-temple': [246.94, 311.13, 369.99, 466.16, 493.88, 622.25], // B Mixolydian / Radiant gold
      'cosmic-dimension': [196.0, 246.94, 293.66, 369.99, 392.0, 493.88], // G Dorian / Warp intensity
    };

    const notes = scales[this.currentWorld] || scales['crystal-valley'];

    // Bass note every 8 steps
    if (s === 0 || s === 8) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFreq = notes[0] / 2;

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.85);
    }

    // Melodic arpeggio patterns
    const noteIndex = [0, 2, 4, 1, 3, 5, 2, 4, 1, 3, 0, 4, 2, 5, 3, 1][s];
    const freq = notes[noteIndex % notes.length];

    const arpOsc = this.ctx.createOscillator();
    const arpGain = this.ctx.createGain();

    arpOsc.type = 'sine';
    arpOsc.frequency.setValueAtTime(freq, now);

    arpGain.gain.setValueAtTime(0.045, now);
    arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    arpOsc.connect(arpGain);
    arpGain.connect(this.musicGain);

    arpOsc.start(now);
    arpOsc.stop(now + 0.38);
  }
}

export const sound = new SoundEngine();
