import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../audio_engine.js';

// Mock Web Audio API & Web Speech API for node test environment
globalThis.AudioContext = class {
  constructor() { this.state = 'suspended'; this.currentTime = 0; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createOscillator() {
    return {
      connect: () => {},
      type: 'sine',
      frequency: { value: 440 },
      start: () => {},
      stop: () => {}
    };
  }
  createGain() {
    return {
      connect: () => {},
      destination: {},
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
    };
  }
};

globalThis.speechSynthesis = {
  cancel: () => {},
  speak: (utterance) => { globalThis._lastSpokenUtterance = utterance; },
  getVoices: () => [{ lang: 'id-ID', name: 'Indonesian' }]
};

globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.lang = 'id-ID';
    this.rate = 1;
    this.pitch = 1;
  }
};

test('AudioEngine initializes with default settings', () => {
  const audio = new AudioEngine();
  assert.equal(audio.isMuted(), false);
  assert.equal(audio.isSpeechEnabled(), true);
});

test('AudioEngine setMuted updates state and blocks SFX', () => {
  const audio = new AudioEngine();
  audio.setMuted(true);
  assert.equal(audio.isMuted(), true);
  assert.equal(audio.playSfx('pop'), false); // Returns false when muted
});

test('AudioEngine speak strips emojis and triggers speech synthesis', () => {
  const audio = new AudioEngine();
  audio.speak('Bebek sudah disabun! 🧼🐥');
  assert.equal(globalThis._lastSpokenUtterance.text.trim(), 'Bebek sudah disabun!');
});

test('AudioEngine speak does not speak when muted or speech disabled', () => {
  const audio = new AudioEngine();
  globalThis._lastSpokenUtterance = null;
  audio.setSpeechEnabled(false);
  audio.speak('Halo BIMO!');
  assert.equal(globalThis._lastSpokenUtterance, null);
});
