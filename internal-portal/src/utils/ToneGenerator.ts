// ToneGenerator.ts
export class ToneGenerator {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playIncomingRing() {
    this.stop();
    this.init();
    if (!this.audioCtx) return;

    const playBeep = () => {
      this.oscillator = this.audioCtx!.createOscillator();
      this.gainNode = this.audioCtx!.createGain();
      
      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(600, this.audioCtx!.currentTime); // 600 Hz
      this.oscillator.frequency.setValueAtTime(800, this.audioCtx!.currentTime + 0.1); // 800 Hz
      
      this.gainNode.gain.setValueAtTime(0, this.audioCtx!.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx!.currentTime + 0.05);
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx!.currentTime + 0.8);
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx!.destination);
      
      this.oscillator.start(this.audioCtx!.currentTime);
      this.oscillator.stop(this.audioCtx!.currentTime + 0.8);
    };

    playBeep();
    this.intervalId = setInterval(playBeep, 1500);
  }

  playOutgoingRing() {
    this.stop();
    this.init();
    if (!this.audioCtx) return;

    const playRing = () => {
      this.oscillator = this.audioCtx!.createOscillator();
      this.gainNode = this.audioCtx!.createGain();
      
      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(440, this.audioCtx!.currentTime);
      this.oscillator.frequency.setValueAtTime(480, this.audioCtx!.currentTime + 0.1);
      
      this.gainNode.gain.setValueAtTime(0, this.audioCtx!.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx!.currentTime + 0.1);
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx!.currentTime + 2.0);
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx!.destination);
      
      this.oscillator.start(this.audioCtx!.currentTime);
      this.oscillator.stop(this.audioCtx!.currentTime + 2.0);
    };

    playRing();
    this.intervalId = setInterval(playRing, 3500);
  }

  playMessageTone() {
    this.init();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + 0.3);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.oscillator) {
      try { this.oscillator.stop(); } catch(e){}
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    this.oscillator = null;
    this.gainNode = null;
  }
}

export const toneGenerator = new ToneGenerator();
