export class SynthEngine {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isRunning: boolean = false;

  constructor() {}

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.error("Web Audio API not supported in this frame:", e);
    }
  }

  public start(type: string) {
    this.init();
    if (!this.ctx) return;
    
    // Stop any running sound first
    this.stop();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      
      // Low pass filter for a lush, deeply calming drone tone
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      let freqs = [110, 220, 330]; // Default soft low A drone
      const normType = type.toLowerCase();
      
      if (normType.includes('zen') || normType.includes('breathing') || normType.includes('rhythm')) {
        freqs = [196.00, 246.94, 293.66, 392.00]; // G major 7th chord soft pad
      } else if (normType.includes('celestial') || normType.includes('sleep') || normType.includes('dream')) {
        freqs = [174.00, 220.00, 261.63, 349.23]; // Deep sleep delta chord (174Hz and 261Hz)
      } else if (normType.includes('wellness') || normType.includes('focus') || normType.includes('gamma') || normType.includes('resonance') || normType.includes('oscillator')) {
        freqs = [220.00, 277.18, 329.63, 440.00]; // Focus spatial A major pad
      } else if (normType.includes('serene') || normType.includes('view') || normType.includes('mind')) {
        freqs = [220.00, 261.63, 329.63, 392.00]; // Am7 serene chord scale
      }

      this.oscillators = freqs.map((f, i) => {
        const osc = this.ctx!.createOscillator();
        // Alternating triangle and sine waves for a dreamy acoustic environment
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
        // Micro detune for dense spatial chorusing
        osc.detune.setValueAtTime((i - 1) * 7, this.ctx!.currentTime);
        return osc;
      });

      // Ambient breathing swell LFO
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8.3 seconds breathing cycle swell
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.lfo.connect(lfoGain);
      lfoGain.connect(this.gainNode.gain);

      this.oscillators.forEach(osc => {
        osc.connect(this.filter!);
      });

      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.oscillators.forEach(osc => osc.start());
      this.lfo.start();

      // Slow fading curve
      this.gainNode.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 3.0);
      this.isRunning = true;
      console.log(`[BioSynth Engine] Live custom synthesized ${type} sound generator initiated.`);
    } catch (err) {
      console.error("[BioSynth Engine] Failed to synthesize custom waves:", err);
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(Math.min(vol, 0.35), this.ctx.currentTime + 0.5);
    }
  }

  public stop() {
    try {
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      }
      
      setTimeout(() => {
        this.oscillators.forEach(o => {
          try { o.stop(); } catch(e) {}
        });
        try { this.lfo?.stop(); } catch(e) {}
        this.oscillators = [];
        this.lfo = null;
        this.isRunning = false;
      }, 500);
    } catch (e) {
      // Silent pass
    }
  }
}

export const synther = new SynthEngine();
