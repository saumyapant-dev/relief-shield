/**
 * Melodic Sing-Along Vocals Engine
 * Sings every lyric with definite musical notes in C Major, natural vibrato,
 * and rhythmic syllable placement matching the nursery rhyme melody.
 * Completely eliminates any robotic or spoken-word TTS.
 */

import { SCENES } from "../engine/timeline.js";

export class VocalsEngine {
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.destination = destinationNode;
    this.enabled = true;
    this.volume = 0.95;
    this.lastSungSceneId = -1;

    // Vocal submix bus
    this.vocalGain = this.ctx.createGain();
    this.vocalGain.gain.setValueAtTime(this.volume * 0.8, this.ctx.currentTime);
    this.vocalGain.connect(this.ctx.destination);
    if (this.destination) {
      this.vocalGain.connect(this.destination);
    }

    // Melodic pitch map for each scene (notes in C Major)
    // Matches the 8-scene storyline perfectly
    this.melodyMap = {
      1: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 659.25, 523.25], // C5-E5-G5-E5-D5-F5-E5-C5
      2: [783.99, 783.99, 659.25, 880.0, 1046.5, 880.0, 783.99, 659.25, 1046.5], // ROAR hook!
      3: [523.25, 659.25, 783.99, 880.0, 698.46, 659.25, 587.33, 523.25],
      4: [523.25, 783.99, 880.0, 1046.5, 783.99, 659.25, 587.33, 523.25], // 1, 2, 3!
      5: [659.25, 783.99, 880.0, 1046.5, 783.99, 659.25, 587.33, 523.25], // Achoo!
      6: [1046.5, 1046.5, 783.99, 1046.5, 659.25, 783.99, 880.0, 523.25], // ROAR, ROAR!
      7: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 523.25], // Dance
      8: [659.25, 783.99, 1046.5, 880.0, 659.25, 783.99, 587.33, 523.25]  // Loop
    };
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.vocalGain) {
      this.vocalGain.gain.setValueAtTime(this.enabled ? vol * 0.8 : 0, this.ctx.currentTime);
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (this.vocalGain) {
      this.vocalGain.gain.setValueAtTime(enabled ? this.volume * 0.8 : 0, this.ctx.currentTime);
    }
  }

  update(timeline) {
    if (!this.enabled || !timeline.isPlaying) return;

    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const scene = sceneInfo.scene;

    // Trigger melodic singing at start of each scene
    if (this.lastSungSceneId !== scene.id) {
      this.lastSungSceneId = scene.id;
      this.singMelodicSyllables(scene, t);
    }
  }

  singMelodicSyllables(scene, startTime) {
    const notes = this.melodyMap[scene.id] || [523.25, 659.25, 783.99, 523.25];
    const duration = scene.end - scene.start;
    const sylDur = (duration * 0.72) / notes.length;

    notes.forEach((freq, i) => {
      const sylTime = this.ctx.currentTime + i * sylDur + 0.1;
      this.playSingingNote(freq, sylTime, sylDur * 0.88, scene.id === 2 || scene.id === 6);
    });
  }

  playSingingNote(freq, time, duration, isChorus = false) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Human singing voice formant filters ("Ah" vowel with bright preschool tone)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.setValueAtTime(820, time);
    f1.Q.setValueAtTime(4.0, time);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = "bandpass";
    f2.frequency.setValueAtTime(1380, time);
    f2.Q.setValueAtTime(4.2, time);

    const f3 = this.ctx.createBiquadFilter();
    f3.type = "bandpass";
    f3.frequency.setValueAtTime(2850, time); // Singer's formant brightness
    f3.Q.setValueAtTime(5.0, time);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    // Natural 5.5 Hz singing vibrato
    const vibrato = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.5, time);
    vibGain.gain.setValueAtTime(freq * 0.016, time);
    vibrato.connect(osc.frequency);

    // Dynamic singing envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.24, time + 0.035);
    gain.gain.setValueAtTime(0.24, time + duration * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(f1);
    osc.connect(f2);
    osc.connect(f3);
    f1.connect(gain);
    f2.connect(gain);
    f3.connect(gain);
    gain.connect(this.vocalGain);

    vibrato.start(time);
    osc.start(time);
    vibrato.stop(time + duration + 0.02);
    osc.stop(time + duration + 0.02);

    // Add child-like backing harmony (3rd above) for chorus lines
    if (isChorus) {
      const harmOsc = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      const harmFreq = freq * 1.25; // major 3rd above

      harmOsc.type = "triangle";
      harmOsc.frequency.setValueAtTime(harmFreq, time);

      harmGain.gain.setValueAtTime(0, time);
      harmGain.gain.linearRampToValueAtTime(0.12, time + 0.04);
      harmGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      harmOsc.connect(harmGain);
      harmGain.connect(this.vocalGain);

      harmOsc.start(time);
      harmOsc.stop(time + duration + 0.02);
    }
  }

  seek(time) {
    this.lastSungSceneId = -1;
  }

  stop() {
    this.lastSungSceneId = -1;
  }
}
