/**
 * Spatial Audio & Haptic Feedback Engine for Throw
 * Synthesizes dynamic soundscapes (wind whoosh, grenade fuse & explosion, chimes)
 * using Web Audio API and triggers device haptic feedback.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public vibrate(pattern: number | number[] = 40) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore if blocked by browser policy
      }
    }
  }

  /**
   * Sound for carousel item snapping / switching
   */
  public playSnap() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate(12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * Sound when throwing letter / paper plane (aerodynamic whoosh)
   */
  public playWhoosh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([30, 20, 50]);

    const bufferSize = ctx.sampleRate * 0.7;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.3);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.7);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.7);
  }

  /**
   * Sound for grenade throw (pin pull, arming clink, fuse sizzle)
   */
  public playGrenadeArm() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([40, 30, 60]);

    // Metallic clink
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Sound for massive grenade explosion with sub-bass rumble and shockwave
   */
  public playExplosion() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([100, 50, 200, 50, 400]);

    // Sub bass punch
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.6);

    subGain.gain.setValueAtTime(0.8, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start();
    subOsc.stop(ctx.currentTime + 0.8);

    // Blast noise
    const bufferSize = ctx.sampleRate * 1.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.2);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 1.4);
  }

  /**
   * Sound for opening letter (soft paper rustle & chime)
   */
  public playLetterOpen() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate(25);

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.35);
    });
  }

  /**
   * Sound for heart / love arrival (warm harmonic bell)
   */
  public playHeartChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([30, 40, 30]);

    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
    });
  }

  /**
   * Sound for gift box opening: ribbon untie swoosh + celestial magical sparkle chime
   */
  public playGiftOpen() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([40, 30, 70, 30, 100]);

    // Ribbon whoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    // Sparkle harmonics (celestial pentatonic arpeggio)
    const sparkleNotes = [587.33, 739.99, 880, 1174.66, 1479.98, 1760]; // D5, F#5, A5, D6, F#6, A6
    sparkleNotes.forEach((freq, i) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(freq, ctx.currentTime + 0.15 + i * 0.07);

      sGain.gain.setValueAtTime(0.1, ctx.currentTime + 0.15 + i * 0.07);
      sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 + i * 0.07 + 0.6);

      sOsc.connect(sGain);
      sGain.connect(ctx.destination);
      sOsc.start(ctx.currentTime + 0.15 + i * 0.07);
      sOsc.stop(ctx.currentTime + 0.15 + i * 0.07 + 0.6);
    });
  }

  /**
   * Sound for party popper: sharp snappy cork pop followed by festive streamers whistle
   */
  public playPartyPopper() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([80, 40, 120]);

    // Fast cork POP
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(900, ctx.currentTime);
    popOsc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

    popGain.gain.setValueAtTime(0.8, ctx.currentTime);
    popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start();
    popOsc.stop(ctx.currentTime + 0.08);

    // Sizzling streamer burst noise
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.35);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.4);

    // Celebration brass flourish
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.45);
    });
  }

  /**
   * Sound for confetti bomb: ticking fuse countdown, booming blast + joyful celebration fanfare
   */
  public playConfettiBomb() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([60, 40, 60, 40, 250, 50, 150]);

    // Boom sub punch
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(220, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.45);

    subGain.gain.setValueAtTime(0.7, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start();
    subOsc.stop(ctx.currentTime + 0.5);

    // Whistling fireworks rocket burst
    const notes = [659.25, 830.61, 987.77, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.08 + idx * 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.08 + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08 + idx * 0.05 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.08 + idx * 0.05);
      osc.stop(ctx.currentTime + 0.08 + idx * 0.05 + 0.55);
    });
  }

  /**
   * Sound when tearing / ripping off the perforated boarding pass stub
   */
  public playPaperRip() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate([25, 20, 45, 15, 60]);

    // Synthesize realistic tearing fiber noise via bandpassed buffer
    const bufferSize = ctx.sampleRate * 0.35; // 350ms tear
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Crackle & tear grain modulation
      const grain = Math.random() > 0.6 ? (Math.random() * 2 - 1) : (Math.random() * 0.3 - 0.15);
      const envelope = 1 - (i / bufferSize);
      output[i] = grain * envelope;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to paper fiber resonant frequencies (800Hz - 3200Hz sweep)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.2);
    filter.Q.setValueAtTime(2.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
    whiteNoise.stop(ctx.currentTime + 0.35);

    // Add crisp micro tear snap
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1600, ctx.currentTime);
    snapOsc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.06);
    snapGain.gain.setValueAtTime(0.2, ctx.currentTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start();
    snapOsc.stop(ctx.currentTime + 0.06);
  }

  /**
   * Sound for rubber postal stamp imprint
   */
  public playStamp() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.vibrate(35);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }
}

export const sounds = new SoundController();
