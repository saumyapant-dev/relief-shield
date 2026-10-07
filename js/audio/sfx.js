/**
 * Sound Effects Engine for "Little Dino's Big Roar"
 * Procedurally synthesizes all cartoon sound effects:
 * inhales, squeaks, boings, hops, swing whooshes, sneezes, mighty roars, sparkles, stomps.
 */

export class SFXEngine {
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.destination = destinationNode;
    this.enabled = true;
    this.volume = 0.95;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.sfxGain.connect(this.ctx.destination);
    if (this.destination) {
      this.sfxGain.connect(this.destination);
    }

    // Trigger state tracking to avoid multi-triggers within the same second
    this.triggeredEvents = new Set();
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  reset() {
    this.triggeredEvents.clear();
  }

  seek(time) {
    this.reset();
  }

  update(timeline) {
    if (!this.enabled || !timeline.isPlaying) return;

    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;

    // Helper for trigger once per scene event
    const checkTrigger = (eventKey, condition) => {
      if (condition && !this.triggeredEvents.has(eventKey)) {
        this.triggeredEvents.add(eventKey);
        return true;
      }
      return false;
    };

    // SCENE 1 (0.0 - 6.0)
    if (checkTrigger("s1_inhale", sceneId === 1 && t >= 0.8 && t < 2.5)) {
      this.playInhale(1.8);
    }
    if (checkTrigger("s1_squeak", sceneId === 1 && t >= 2.8 && t < 3.8)) {
      this.playSqueak();
    }
    if (checkTrigger("s1_boing", sceneId === 1 && t >= 4.2 && t < 5.2)) {
      this.playCartoonBoing();
    }

    // SCENE 2 (6.0 - 13.0)
    if (checkTrigger("s2_inhale", sceneId === 2 && t >= 7.8 && t < 9.8)) {
      this.playInhale(1.6);
    }
    if (checkTrigger("s2_squeak", sceneId === 2 && t >= 10.2 && t < 11.2)) {
      this.playSqueak();
    }
    if (checkTrigger("s2_deflate", sceneId === 2 && t >= 11.4 && t < 12.8)) {
      this.playDeflationWhistle();
    }

    // SCENE 3 (13.0 - 20.0)
    if (checkTrigger("s3_bunny", sceneId === 3 && t >= 13.5 && t < 15.0)) {
      this.playBunnyHop();
      setTimeout(() => this.playBunnyHop(), 400);
      setTimeout(() => this.playBunnyHop(), 800);
    }
    if (checkTrigger("s3_monkey", sceneId === 3 && t >= 15.2 && t < 16.5)) {
      this.playSwingWhoosh();
    }
    if (checkTrigger("s3_chimes", sceneId === 3 && t >= 16.8 && t < 18.5)) {
      this.playArrivalChimes();
    }

    // SCENE 4 (20.0 - 29.0)
    // Synchronized handclaps on the beats
    if (sceneId === 4) {
      const beatProgress = (t - 20.0) % 0.8;
      if (beatProgress < 0.05 && checkTrigger(`s4_clap_${Math.floor(t * 1.5)}`, true)) {
        this.playClapSfx();
      }
    }

    // SCENE 5 (29.0 - 37.0)
    if (checkTrigger("s5_sniffle", sceneId === 5 && t >= 31.5 && t < 33.0)) {
      this.playSniffle();
    }
    if (checkTrigger("s5_sneeze", sceneId === 5 && t >= 33.6 && t < 35.0)) {
      this.playFunnySneeze();
    }
    if (checkTrigger("s5_giggles", sceneId === 5 && t >= 35.5 && t < 36.8)) {
      this.playGiggles();
    }

    // SCENE 6 (37.0 - 46.0)
    if (checkTrigger("s6_breath", sceneId === 6 && t >= 37.5 && t < 39.5)) {
      this.playInhale(2.0);
    }
    if (checkTrigger("s6_roar", sceneId === 6 && t >= 39.8 && t < 44.0)) {
      this.playBigRoar();
      setTimeout(() => this.playSparkles(), 800);
    }

    // SCENE 7 (46.0 - 55.0)
    // Dino stomp beats
    if (sceneId === 7) {
      const stompProgress = (t - 46.0) % 0.52;
      if (stompProgress < 0.05 && checkTrigger(`s7_stomp_${Math.floor(t * 2)}`, true)) {
        this.playDinoStomp();
      }
    }

    // SCENE 8 (55.0 - 60.0)
    if (checkTrigger("s8_wave", sceneId === 8 && t >= 55.5 && t < 57.0)) {
      this.playArrivalChimes();
    }
    if (checkTrigger("s8_loop_inhale", sceneId === 8 && t >= 58.2 && t < 59.9)) {
      this.playInhale(1.7);
    }
  }

  // --- PROCEDURAL SFX SYNTHESIZERS ---

  playInhale(duration = 1.5) {
    const time = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(3.0, time);
    filter.frequency.setValueAtTime(250, time);
    filter.frequency.exponentialRampToValueAtTime(1400, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.35, time + duration * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  playSqueak() {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1600, time);
    osc.frequency.exponentialRampToValueAtTime(2400, time + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 0.18);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.45, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.24);
  }

  playCartoonBoing() {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(680, time + 0.15);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.35);

    // Modulation for bouncy spring
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.frequency.setValueAtTime(24, time);
    modGain.gain.setValueAtTime(60, time);
    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    mod.start(time);
    osc.start(time);
    mod.stop(time + 0.42);
    osc.stop(time + 0.42);
  }

  playDeflationWhistle() {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(160, time + 0.8);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.9);
  }

  playBunnyHop() {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.exponentialRampToValueAtTime(580, time + 0.08);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  playSwingWhoosh() {
    const time = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(1600, time + 0.2);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.42);
  }

  playArrivalChimes() {
    const time = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const nTime = time + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, nTime);

      gain.gain.setValueAtTime(0, nTime);
      gain.gain.linearRampToValueAtTime(0.25, nTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, nTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(nTime);
      osc.stop(nTime + 0.5);
    });
  }

  playClapSfx() {
    const time = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.09);
  }

  playSniffle() {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(950, time + 0.12);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  playFunnySneeze() {
    const time = this.ctx.currentTime;

    // 1. Sharp "AH" pitch burst
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(650, time);
    osc.frequency.exponentialRampToValueAtTime(220, time + 0.15);

    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    // 2. Explosive "CHOO!" noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, time + 0.04);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.32);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, time + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.2);
    noise.start(time + 0.04);
    noise.stop(time + 0.38);
  }

  playGiggles() {
    const time = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const gTime = time + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(700 + (i % 2) * 180, gTime);

      gain.gain.setValueAtTime(0.18, gTime);
      gain.gain.exponentialRampToValueAtTime(0.001, gTime + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(gTime);
      osc.stop(gTime + 0.09);
    }
  }

  playBigRoar() {
    const time = this.ctx.currentTime;
    const duration = 2.4;

    // Layer 1: Deep dinosaur chest rumble (45Hz - 85Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sawtooth";
    subOsc.frequency.setValueAtTime(65, time);
    subOsc.frequency.exponentialRampToValueAtTime(120, time + 0.4);
    subOsc.frequency.exponentialRampToValueAtTime(50, time + duration);

    subGain.gain.setValueAtTime(0, time);
    subGain.gain.linearRampToValueAtTime(0.5, time + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    // Layer 2: Resonant growl throat modulation (220Hz modulated by 18Hz)
    const growlOsc = this.ctx.createOscillator();
    const growlGain = this.ctx.createGain();
    growlOsc.type = "triangle";
    growlOsc.frequency.setValueAtTime(260, time);
    growlOsc.frequency.exponentialRampToValueAtTime(380, time + 0.6);
    growlOsc.frequency.exponentialRampToValueAtTime(180, time + duration);

    const tremolo = this.ctx.createOscillator();
    const tremGain = this.ctx.createGain();
    tremolo.frequency.setValueAtTime(18, time); // throat rumble vibration
    tremGain.gain.setValueAtTime(40, time);
    tremolo.connect(tremGain);
    tremGain.connect(growlOsc.frequency);

    growlGain.gain.setValueAtTime(0, time);
    growlGain.gain.linearRampToValueAtTime(0.65, time + 0.1);
    growlGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    growlOsc.connect(growlGain);
    growlGain.connect(this.sfxGain);

    // Layer 3: Brassy joyful lead trumpet overtone (C4 -> E4 -> G4 fanfare roar)
    const trumpetOsc = this.ctx.createOscillator();
    const trumpetGain = this.ctx.createGain();
    trumpetOsc.type = "sawtooth";
    trumpetOsc.frequency.setValueAtTime(392, time); // G4
    trumpetOsc.frequency.exponentialRampToValueAtTime(523.25, time + 0.5); // C5!

    trumpetGain.gain.setValueAtTime(0, time);
    trumpetGain.gain.linearRampToValueAtTime(0.35, time + 0.2);
    trumpetGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.9);

    trumpetOsc.connect(trumpetGain);
    trumpetGain.connect(this.sfxGain);

    subOsc.start(time);
    growlOsc.start(time);
    tremolo.start(time);
    trumpetOsc.start(time);

    subOsc.stop(time + duration);
    growlOsc.stop(time + duration);
    tremolo.stop(time + duration);
    trumpetOsc.stop(time + duration);
  }

  playSparkles() {
    const time = this.ctx.currentTime;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0]; // C6, E6, G6, C7, E7
    for (let i = 0; i < 8; i++) {
      const sTime = time + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freqs[i % freqs.length], sTime);

      gain.gain.setValueAtTime(0, sTime);
      gain.gain.linearRampToValueAtTime(0.22, sTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, sTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(sTime);
      osc.stop(sTime + 0.38);
    }
  }

  playDinoStomp() {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.14);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }
}
