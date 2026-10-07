/**
 * Cheerful Nursery Rhyme Soundtrack Engine (116 BPM)
 * Synthesizes ukulele/acoustic plucks, xylophone melody, walking bass,
 * handclaps, and percussion using Web Audio API.
 * All audio outputs to both speakers and MediaStreamDestinationNode for video recording.
 */

export class SoundtrackEngine {
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.destination = destinationNode;
    this.bpm = 116;
    this.beatInterval = 60 / this.bpm; // ~0.517 seconds per beat
    this.enabled = true;
    this.volume = 0.85;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    if (this.destination) {
      this.masterGain.connect(this.destination);
    }

    // Submix buses
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.scheduledNotes = [];
    this.lastScheduledBeat = -1;

    // Note frequencies (Hz)
    this.notes = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0
    };

    // Melody definition across 60 seconds (116 beats ~ 60s)
    // Harmonious cheerful preschool nursery rhyme melody
    this.melodyPattern = [
      // Verse 1 (Scene 1: The Hook: C - G - Am - F)
      { beat: 0, note: "C5", dur: 1 }, { beat: 1, note: "E5", dur: 1 }, { beat: 2, note: "G5", dur: 1.5 }, { beat: 3.5, note: "E5", dur: 0.5 },
      { beat: 4, note: "D5", dur: 1 }, { beat: 5, note: "E5", dur: 1 }, { beat: 6, note: "C5", dur: 2 },
      { beat: 8, note: "E5", dur: 1 }, { beat: 9, note: "G5", dur: 1 }, { beat: 10, note: "A5", dur: 1.5 }, { beat: 11.5, note: "G5", dur: 0.5 },

      // Verse 2 (Scene 2: Dino Tries Again)
      { beat: 12, note: "G5", dur: 1 }, { beat: 13, note: "E5", dur: 1 }, { beat: 14, note: "C5", dur: 2 },
      { beat: 16, note: "C5", dur: 1 }, { beat: 17, note: "D5", dur: 1 }, { beat: 18, note: "E5", dur: 1 }, { beat: 19, note: "F5", dur: 1 },
      { beat: 20, note: "G5", dur: 2 }, { beat: 22, note: "E5", dur: 2 },
      { beat: 24, note: "A5", dur: 1 }, { beat: 25, note: "G5", dur: 1 }, { beat: 26, note: "F5", dur: 1 }, { beat: 27, note: "E5", dur: 1 },

      // Verse 3 (Scene 3: Friends Arrive)
      { beat: 28, note: "D5", dur: 2 }, { beat: 30, note: "C5", dur: 2 },
      { beat: 32, note: "E5", dur: 1 }, { beat: 33, note: "F5", dur: 1 }, { beat: 34, note: "G5", dur: 2 },
      { beat: 36, note: "A5", dur: 1 }, { beat: 37, note: "G5", dur: 1 }, { beat: 38, note: "F5", dur: 2 },
      { beat: 40, note: "E5", dur: 1 }, { beat: 41, note: "D5", dur: 1 }, { beat: 42, note: "C5", dur: 2 },

      // Verse 4 (Scene 4: Musical Practice - Clapping & energetic bounce)
      { beat: 44, note: "C5", dur: 1 }, { beat: 45, note: "C5", dur: 1 }, { beat: 46, note: "G5", dur: 1 }, { beat: 47, note: "G5", dur: 1 },
      { beat: 48, note: "A5", dur: 1 }, { beat: 49, note: "A5", dur: 1 }, { beat: 50, note: "G5", dur: 2 },
      { beat: 52, note: "F5", dur: 1 }, { beat: 53, note: "F5", dur: 1 }, { beat: 54, note: "E5", dur: 1 }, { beat: 55, note: "E5", dur: 1 },
      { beat: 56, note: "D5", dur: 1 }, { beat: 57, note: "D5", dur: 1 }, { beat: 58, note: "C5", dur: 2 },

      // Verse 5 (Scene 5: The Funny Sneeze)
      { beat: 60, note: "E5", dur: 1 }, { beat: 61, note: "E5", dur: 1 }, { beat: 62, note: "F5", dur: 2 },
      { beat: 64, note: "G5", dur: 1.5 }, { beat: 65.5, note: "A5", dur: 0.5 }, { beat: 66, note: "G5", dur: 2 },
      { beat: 68, note: "F5", dur: 1 }, { beat: 69, note: "E5", dur: 1 }, { beat: 70, note: "D5", dur: 1 }, { beat: 71, note: "G4", dur: 1 },
      { beat: 72, note: "C5", dur: 2 },

      // Verse 6 (Scene 6: The Big Roar! Majestic & Joyful Fanfare)
      { beat: 74, note: "C5", dur: 1 }, { beat: 75, note: "E5", dur: 1 }, { beat: 76, note: "G5", dur: 1 }, { beat: 77, note: "C5", dur: 1 },
      { beat: 78, note: "C5", dur: 2 }, { beat: 80, note: "G5", dur: 2 },
      { beat: 82, note: "A5", dur: 1 }, { beat: 83, note: "B5", dur: 1 }, { beat: 84, note: "C5", dur: 2 },
      { beat: 86, note: "E5", dur: 1 }, { beat: 87, note: "D5", dur: 1 }, { beat: 88, note: "C5", dur: 2 },

      // Verse 7 (Scene 7: Jungle Dance Party! High energy)
      { beat: 90, note: "C5", dur: 0.5 }, { beat: 90.5, note: "E5", dur: 0.5 }, { beat: 91, note: "G5", dur: 1 },
      { beat: 92, note: "A5", dur: 0.5 }, { beat: 92.5, note: "G5", dur: 0.5 }, { beat: 93, note: "E5", dur: 1 },
      { beat: 94, note: "F5", dur: 0.5 }, { beat: 94.5, note: "E5", dur: 0.5 }, { beat: 95, note: "D5", dur: 1 },
      { beat: 96, note: "C5", dur: 1 }, { beat: 97, note: "E5", dur: 1 }, { beat: 98, note: "G5", dur: 2 },
      { beat: 100, note: "A5", dur: 1 }, { beat: 101, note: "F5", dur: 1 }, { beat: 102, note: "D5", dur: 1 }, { beat: 103, note: "G5", dur: 1 },
      { beat: 104, note: "C5", dur: 2 },

      // Verse 8 (Scene 8: Loop Ending)
      { beat: 106, note: "E5", dur: 1 }, { beat: 107, note: "F5", dur: 1 }, { beat: 108, note: "G5", dur: 2 },
      { beat: 110, note: "A5", dur: 1 }, { beat: 111, note: "G5", dur: 1 }, { beat: 112, note: "E5", dur: 2 },
      { beat: 114, note: "D5", dur: 1 }, { beat: 115, note: "E5", dur: 1 }, { beat: 116, note: "C5", dur: 2 }
    ];

    // Chords per measure (4 beats per measure)
    this.chordProgression = [
      ["C4", "E4", "G4"], // C
      ["G3", "B3", "D4"], // G
      ["A3", "C4", "E4"], // Am
      ["F3", "A3", "C4"], // F
      ["C4", "E4", "G4"], // C
      ["F3", "A3", "C4"], // F
      ["G3", "B3", "D4"], // G
      ["C4", "E4", "G4"]  // C
    ];

    // Bassline notes
    this.bassNotes = ["C3", "G2", "A2", "F2", "C3", "F2", "G2", "C3"];
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.8 : 0, this.ctx.currentTime);
    }
  }

  update(timeline) {
    if (!this.enabled || !timeline.isPlaying) return;

    const t = timeline.currentTime;
    const currentBeat = Math.floor(t / this.beatInterval);

    // Schedule 3 beats ahead for seamless jitter-free Web Audio timing
    const scheduleAheadBeats = 4;
    const endBeat = currentBeat + scheduleAheadBeats;

    for (let beat = Math.max(0, this.lastScheduledBeat + 1); beat <= endBeat; beat++) {
      if (beat * this.beatInterval < 60.0) {
        this.scheduleBeat(beat, timeline);
      }
    }

    this.lastScheduledBeat = Math.max(this.lastScheduledBeat, currentBeat);
  }

  scheduleBeat(beat, timeline) {
    const time = beat * this.beatInterval;
    const measure = Math.floor(beat / 4);
    const beatInMeasure = beat % 4;
    const chordIndex = measure % this.chordProgression.length;
    const chord = this.chordProgression[chordIndex];
    const bassNote = this.bassNotes[chordIndex];

    // 1. Playful Walking Bass on every beat
    this.playBassNote(bassNote, time, 0.45);

    // 2. Cheerful Ukulele / Acoustic Strum (on beats 1, 2, 3, 4)
    this.playUkuleleStrum(chord, time, beatInMeasure === 0 || beatInMeasure === 2 ? 0.35 : 0.25);

    // 3. Handclaps on Beats 2 and 4 (The preschool nursery rhyme staple!)
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      this.playHandclap(time + 0.01);
    }

    // 4. Soft Percussion (Gentle Kick on 1 and 3, Soft Shaker on every eighth note)
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      this.playSoftKick(time);
    }
    this.playShaker(time);
    this.playShaker(time + this.beatInterval * 0.5);

    // 5. Bright Xylophone Lead Melody
    const melodyEntry = this.melodyPattern.find((m) => Math.abs(m.beat - beat) < 0.1);
    if (melodyEntry) {
      this.playXylophone(melodyEntry.note, time, melodyEntry.dur * this.beatInterval);
    }
  }

  playUkuleleStrum(chord, time, gain = 0.3) {
    // Multi-string plucked arpeggiated strum
    chord.forEach((noteName, strIdx) => {
      const freq = this.notes[noteName] || 261.63;
      const strumDelay = strIdx * 0.018; // realistic finger strum ripple

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Warm acoustic triangle/sine blend
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time + strumDelay);

      // Lowpass pluck filter
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, time + strumDelay);
      filter.frequency.exponentialRampToValueAtTime(350, time + strumDelay + 0.35);

      gainNode.gain.setValueAtTime(0, time + strumDelay);
      gainNode.gain.linearRampToValueAtTime(gain * 0.4, time + strumDelay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + strumDelay + 0.4);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.musicGain);

      osc.start(time + strumDelay);
      osc.stop(time + strumDelay + 0.45);
    });
  }

  playXylophone(noteName, time, duration = 0.4) {
    const freq = this.notes[noteName] || 523.25;

    // Dual-oscillator mallet strike (fundamental + crystalline harmonic)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 3.01, time); // 3rd overtone for wooden bar chime

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.35, time + 0.005); // sharp mallet attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
  }

  playBassNote(noteName, time, duration = 0.4) {
    const freq = this.notes[noteName] || 130.81;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.32, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  playHandclap(time) {
    // Filtered noise burst with multi-rebound envelope
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(1.5, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.28, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.12);
  }

  playSoftKick(time) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

    gainNode.gain.setValueAtTime(0.35, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gainNode);
    gainNode.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  playShaker(time) {
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(5000, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  seek(targetTime) {
    this.lastScheduledBeat = Math.floor(targetTime / this.beatInterval) - 1;
  }
}
