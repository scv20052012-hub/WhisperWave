/**
 * Web Audio API Sound Effects Synthesizer
 * Produces WhatsApp-authentic calling tones, incoming ringtones, and message notifications
 * completely client-side without external asset dependencies.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private callingInterval: number | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play outgoing calling tone ("Tuuu... Tuuu...")
  startCallingTone(): void {
    this.stopAllSounds();
    const ctx = this.getContext();

    const playBeep = () => {
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(425, ctx.currentTime);
        osc2.frequency.setValueAtTime(450, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 1.2);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.35);
        osc2.stop(ctx.currentTime + 1.35);
      } catch (e) {
        console.warn('Audio play failed:', e);
      }
    };

    playBeep();
    this.callingInterval = window.setInterval(playBeep, 3500);
  }

  // Play incoming ringtone (WhatsApp marimba-like melody)
  startIncomingRingtone(): void {
    this.stopAllSounds();
    const ctx = this.getContext();

    const notes = [
      { f: 523.25, time: 0 },    // C5
      { f: 659.25, time: 0.18 }, // E5
      { f: 783.99, time: 0.36 }, // G5
      { f: 1046.50, time: 0.54 },// C6
      { f: 783.99, time: 0.72 }, // G5
      { f: 659.25, time: 0.90 }, // E5
      { f: 523.25, time: 1.08 }, // C5
    ];

    const playRingtonePhrase = () => {
      try {
        const now = ctx.currentTime;
        notes.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, now + note.time);

          gain.gain.setValueAtTime(0, now + note.time);
          gain.gain.linearRampToValueAtTime(0.12, now + note.time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + note.time);
          osc.stop(now + note.time + 0.35);
        });
      } catch (e) {
        console.warn('Ringtone failed:', e);
      }
    };

    playRingtonePhrase();
    this.ringtoneInterval = window.setInterval(playRingtonePhrase, 2200);
  }

  // Stop calling or ringing tones
  stopAllSounds(): void {
    if (this.callingInterval) {
      clearInterval(this.callingInterval);
      this.callingInterval = null;
    }
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Message sent soft "pop"
  playMessageSent(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignored
    }
  }

  // Message received sweet ding
  playMessageReceived(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      [1046.50, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.09, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.22);
      });
    } catch {
      // Ignored
    }
  }

  // Call ended short beep
  playCallEnd(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // Ignored
    }
  }
}

export const sound = new SoundService();
