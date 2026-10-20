/**
 * Web Audio API Procedural Sound Synthesizer for Neu-Anspach Battle Royale
 * 100% procedural - zero external audio assets needed!
 * Enhanced with weapon-specific acoustic profiles, critical headshot dinks,
 * tactical ability SFX, combo stingers, and UI micro-feedback.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Subtle tactical click for UI buttons & tabs
  public playUiClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Real Gunshot Audio: Weapon-specific acoustic profiles
  public playShoot(weaponId: string = 'bembel') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (weaponId === 'handkaes') {
      // M79 Launcher: Hollow "Thump!" tube launch + rising whistle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.22);
      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
      return;
    }

    const isShotgun = weaponId === 'spritzer';
    const isSmg = weaponId === 'zwille';

    // Layer 1: High-frequency explosive crack / noise burst
    const duration = isShotgun ? 0.11 : isSmg ? 0.045 : 0.065;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isShotgun ? 1100 : isSmg ? 2400 : 1800, now);
    noiseFilter.Q.setValueAtTime(1.1, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isShotgun ? 0.48 : 0.34, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(now);

    // Layer 2: Punchy low-end firearm thump (pitch dropped kick)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isShotgun ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(isShotgun ? 240 : isSmg ? 410 : 320, now);
    osc.frequency.exponentialRampToValueAtTime(isShotgun ? 32 : 48, now + (isShotgun ? 0.15 : 0.095));

    const kickFilter = this.ctx.createBiquadFilter();
    kickFilter.type = 'lowpass';
    kickFilter.frequency.setValueAtTime(isShotgun ? 650 : 850, now);

    oscGain.gain.setValueAtTime(isShotgun ? 0.45 : 0.38, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isShotgun ? 0.15 : 0.095));

    osc.connect(kickFilter);
    kickFilter.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isShotgun ? 0.15 : 0.095));
  }

  // Hit impact: Apple squish / Stoneware crack
  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.11);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Iconic Critical Hit / Headshot metallic "DINK!"
  public playCritHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(1760, now); // High A6 metallic bell
    osc1.frequency.exponentialRampToValueAtTime(2093, now + 0.06);
    osc2.frequency.setValueAtTime(3520, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }

  // Shield break shatter sound
  public playShieldBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [1480, 1120, 740, 480].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + idx * 0.035;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, start + 0.12);
      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  // Tactical Dash [E] whoosh
  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Bembel-Nova Shockwave [Q]
  public playShockwave() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const shimmer = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.55);

    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(520, now);
    shimmer.frequency.exponentialRampToValueAtTime(1040, now + 0.35);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    sub.connect(gain);
    shimmer.connect(gain);
    gain.connect(this.ctx.destination);

    sub.start(now);
    shimmer.start(now);
    sub.stop(now + 0.55);
    shimmer.stop(now + 0.55);
  }

  // Orbital Strike / Drone Scan [F]
  public playOrbitalStrike() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Two tactical radar lock-on beeps followed by orbital drop
    [0, 0.1].forEach((offset, idx) => {
      const beep = this.ctx!.createOscillator();
      const bGain = this.ctx!.createGain();
      beep.type = 'square';
      beep.frequency.setValueAtTime(idx === 0 ? 1320 : 1760, now + offset);
      bGain.gain.setValueAtTime(0.18, now + offset);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);
      beep.connect(bGain);
      bGain.connect(this.ctx!.destination);
      beep.start(now + offset);
      beep.stop(now + offset + 0.07);
    });

    const drop = this.ctx.createOscillator();
    const dGain = this.ctx.createGain();
    drop.type = 'sawtooth';
    drop.frequency.setValueAtTime(880, now + 0.2);
    drop.frequency.exponentialRampToValueAtTime(55, now + 0.75);
    dGain.gain.setValueAtTime(0.35, now + 0.2);
    dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    drop.connect(dGain);
    dGain.connect(this.ctx.destination);
    drop.start(now + 0.2);
    drop.stop(now + 0.75);
  }

  // Combo Milestone Stinger
  public playComboMilestone(multiplier: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = Math.min(1200, 440 + multiplier * 90);
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + idx * 0.045;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // Perk Selected Chime
  public playPerkSelect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + idx * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  // Handkäs Mine Explosion
  public playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Tycoon Coin / Taler Ding
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, now); // B5
    osc.frequency.setValueAtTime(1318, now + 0.08); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Taunus Fog Zone Warning Siren
  public playZoneWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(550, now + 0.2);
    osc.frequency.linearRampToValueAtTime(330, now + 0.4);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Level Up / District Unlocked
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  // Wave Start Horn (Taunus War Horn)
  public playWaveStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [330, 440, 554.37, 659.25]; // E4, A4, C#5, E5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  // Wave Victory Chime
  public playWaveVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;

    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  // Boss Spawn Horn (Traktor-Horst arrival)
  public playBossSpawn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    subOsc.type = 'square';

    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.8);

    subOsc.frequency.setValueAtTime(47, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.8);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.85);
    subOsc.stop(now + 0.85);
  }

  // Satisfying Kill Hit
  public playKill() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.06); // D6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Daily Mission Completed fanfare (Heroic 4-chord ascending chime)
  public playMissionComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Reward claimed chime (Double coin glissando)
  public playRewardClaim() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [987.77, 1318.51, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  // Weapon Reload: Realistic mechanical magazine latch & slide chamber sound
  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Stage 1: Magazine eject click (t = 0)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(580, now);
    osc1.frequency.exponentialRampToValueAtTime(160, now + 0.08);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Stage 2: Magazine insert click (t = 0.45s)
    const tInsert = now + 0.45;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(320, tInsert);
    osc2.frequency.exponentialRampToValueAtTime(680, tInsert + 0.09);
    gain2.gain.setValueAtTime(0.32, tInsert);
    gain2.gain.exponentialRampToValueAtTime(0.001, tInsert + 0.09);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(tInsert);
    osc2.stop(tInsert + 0.09);

    // Stage 3: Bolt slide lock / chamber sound (t = 0.95s)
    const tSlide = now + 0.95;
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'square';
    osc3.frequency.setValueAtTime(840, tSlide);
    osc3.frequency.exponentialRampToValueAtTime(280, tSlide + 0.12);
    gain3.gain.setValueAtTime(0.24, tSlide);
    gain3.gain.exponentialRampToValueAtTime(0.001, tSlide + 0.12);
    osc3.connect(gain3);
    gain3.connect(this.ctx.destination);
    osc3.start(tSlide);
    osc3.stop(tSlide + 0.12);
  }

  // Brawl Stars Style Victory Fanfare
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [
      { f: 523.25, t: 0, d: 0.18 }, // C5
      { f: 659.25, t: 0.12, d: 0.18 }, // E5
      { f: 783.99, t: 0.24, d: 0.22 }, // G5
      { f: 1046.5, t: 0.42, d: 0.65 }, // C6
      { f: 1318.5, t: 0.54, d: 0.8 }, // E6
    ];
    const now = this.ctx.currentTime;

    chords.forEach((chord) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + chord.t;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(chord.f, start);
      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + chord.d);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + chord.d);
    });
  }

  // Brawl Stars Style Defeat Tone
  public playDefeat() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 392.0, t: 0, d: 0.3 }, // G4
      { f: 369.99, t: 0.28, d: 0.35 }, // F#4
      { f: 349.23, t: 0.6, d: 0.4 }, // F4
      { f: 311.13, t: 0.95, d: 0.75 }, // D#4
    ];
    const now = this.ctx.currentTime;

    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + note.t;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, start);
      gain.gain.setValueAtTime(0.24, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + note.d);
    });
  }
}

export const soundFx = new SoundEffectsManager();
