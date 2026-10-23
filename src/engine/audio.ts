/**
 * Procedural Web Audio synthesizer for VoxelCraft.
 * Zero external audio files, 100% procedurally synthesized in real time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Generate noise buffer
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playFootstep(category: 'grass' | 'wood' | 'stone' | 'sand' | 'glass' | 'water') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (category === 'grass' || category === 'sand') {
      const noise = this.ctx.createBufferSource();
      const nBuffer = this.createNoiseBuffer(0.08);
      if (!nBuffer) return;
      noise.buffer = nBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = category === 'grass' ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(category === 'grass' ? 800 : 500, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.08);
    } else if (category === 'stone') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 40, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } else if (category === 'wood') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.07);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } else if (category === 'water') {
      this.playSplash(0.3);
    }
  }

  public playBlockBreak(category: 'grass' | 'wood' | 'stone' | 'sand' | 'glass' | 'water') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const nBuffer = this.createNoiseBuffer(0.18);
    if (!nBuffer) return;
    noise.buffer = nBuffer;

    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (category === 'glass') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.frequency.linearRampToValueAtTime(4000, t + 0.18);
      gain.gain.setValueAtTime(0.2, t);
    } else if (category === 'stone') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, t);
      gain.gain.setValueAtTime(0.25, t);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);
      gain.gain.setValueAtTime(0.22, t);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.18);
  }

  public playBlockPlace(category: 'grass' | 'wood' | 'stone' | 'sand' | 'glass' | 'water') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = category === 'stone' ? 'triangle' : 'sine';
    const baseFreq = category === 'stone' ? 140 : category === 'wood' ? 190 : 120;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.12);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playSplash(volume = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const nBuffer = this.createNoiseBuffer(0.25);
    if (!nBuffer) return;
    noise.buffer = nBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.25);
  }

  public playDamage() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Sub-bass punch
    const osc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(subGain);
    subGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);

    // Filtered noise boom
    const noise = this.ctx.createBufferSource();
    const nBuffer = this.createNoiseBuffer(0.8);
    if (!nBuffer) return;
    noise.buffer = nBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.8);
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playMobSound(pitch = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 * pitch, t);
    osc.frequency.linearRampToValueAtTime(220 * pitch, t + 0.1);
    osc.frequency.linearRampToValueAtTime(280 * pitch, t + 0.25);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  public startPeacefulMusic() {
    if (this.musicInterval) return;
    // Play subtle piano-like chords every 25 seconds
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];
    let chordIdx = 0;

    const playChime = () => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.15);

        gain.gain.setValueAtTime(0.0001, t + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.035, t + idx * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.15 + 2.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.15);
        osc.stop(t + idx * 0.15 + 2.5);
      });
    };

    // First chime after short delay
    setTimeout(() => playChime(), 2000);
    this.musicInterval = window.setInterval(playChime, 24000);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundEngine();
