/* ============================================================
   AUDIO ENGINE MODULE
   Deep module wrapping Web Audio API SFX & Web Speech API TTS
   ============================================================ */

export class AudioEngine {
  constructor(options = {}) {
    this.muted = options.muted || false;
    this.speechEnabled = options.speechEnabled !== false;
    this.audioCtx = null;
    this.idVoice = null;
    this.initSpeech();
  }

  getAudioCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
    } else if (!this.audioCtx && typeof globalThis !== 'undefined' && globalThis.AudioContext) {
      this.audioCtx = new globalThis.AudioContext();
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  initSpeech() {
    if (typeof globalThis !== 'undefined' && globalThis.speechSynthesis) {
      const updateVoices = () => {
        try {
          const voices = globalThis.speechSynthesis.getVoices() || [];
          this.idVoice = voices.find(v => v.lang && (v.lang.startsWith('id') || v.lang.startsWith('ind'))) || voices[0] || null;
        } catch(e) {}
      };
      updateVoices();
      if (globalThis.speechSynthesis.onvoiceschanged !== undefined) {
        globalThis.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.muted && typeof globalThis !== 'undefined' && globalThis.speechSynthesis) {
      try { globalThis.speechSynthesis.cancel(); } catch(e) {}
    }
  }

  isSpeechEnabled() {
    return this.speechEnabled;
  }

  setSpeechEnabled(enabled) {
    this.speechEnabled = !!enabled;
    if (!this.speechEnabled && typeof globalThis !== 'undefined' && globalThis.speechSynthesis) {
      try { globalThis.speechSynthesis.cancel(); } catch(e) {}
    }
  }

  speak(text) {
    if (this.muted || !this.speechEnabled || typeof globalThis === 'undefined' || !globalThis.speechSynthesis) {
      return false;
    }
    try {
      globalThis.speechSynthesis.cancel();
      const cleanText = String(text || '').replace(/\p{Extended_Pictographic}/gu, '');
      if (!cleanText.trim()) return false;

      const UtteranceClass = globalThis.SpeechSynthesisUtterance || window.SpeechSynthesisUtterance;
      if (!UtteranceClass) return false;

      const utterance = new UtteranceClass(cleanText);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      if (this.idVoice) utterance.voice = this.idVoice;
      globalThis.speechSynthesis.speak(utterance);
      return true;
    } catch(e) {
      return false;
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.2) {
    if (this.muted) return false;
    try {
      const ctx = this.getAudioCtx();
      if (!ctx) return false;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination || {});
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime || 0);
      gain.gain.exponentialRampToValueAtTime(0.001, (ctx.currentTime || 0) + duration);
      osc.start();
      osc.stop((ctx.currentTime || 0) + duration);
      return true;
    } catch(e) {
      return false;
    }
  }

  playSfx(type) {
    if (this.muted) return false;
    switch (type) {
      case 'click':
        return this.playTone(600, 'sine', 0.08, 0.15);
      case 'pop':
        return this.playTone(440, 'sine', 0.1, 0.2);
      case 'success':
        [523, 659, 784, 1047].forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sine', 0.2, 0.25), i * 100);
        });
        return true;
      case 'star':
        [880, 1108, 1319].forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sine', 0.15, 0.3), i * 80);
        });
        return true;
      case 'error':
        [250, 200].forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sawtooth', 0.1, 0.15), i * 100);
        });
        return true;
      default:
        return false;
    }
  }
}
