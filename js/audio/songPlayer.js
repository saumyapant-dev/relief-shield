/**
 * Studio Master Song Player
 * Preloads and plays the master 60-second nursery rhyme song track,
 * with exact timeline synchronization, seamless looping, volume control,
 * and routing to both speakers and MediaStreamDestinationNode for 1080x1920 video export.
 */

export class SongPlayer {
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.destination = destinationNode;
    this.audioBuffer = null;
    this.sourceNode = null;
    this.isPlaying = false;
    this.startTime = 0; // audioCtx timestamp when playback began
    this.offsetTime = 0; // position in song (0 to 60s)
    this.volume = 0.95;
    this.enabled = true;
    this.isLoaded = false;
    this.loadPromise = null;

    // Gain bus
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
    if (this.destination) {
      this.gainNode.connect(this.destination);
    }

    this.preloadSong();
  }

  async preloadSong() {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const audioUrls = [
          "assets/audio/little_dino_song.wav",
          "assets/audio/little_dino_song.m4a"
        ];

        let response = null;
        for (const url of audioUrls) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              response = res;
              break;
            }
          } catch (e) {
            // try next
          }
        }

        if (response) {
          const arrayBuffer = await response.arrayBuffer();
          this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.isLoaded = true;
          console.log(`Master studio song loaded: ${this.audioBuffer.duration.toFixed(2)}s`);
        }
      } catch (err) {
        console.warn("Could not preload studio song file, using procedural Web Audio:", err);
      }
    })();

    return this.loadPromise;
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.enabled ? vol : 0, this.ctx.currentTime);
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  play(time = 0) {
    if (!this.isLoaded || !this.audioBuffer) return;
    this.stop();

    const clampedTime = Math.max(0, Math.min(this.audioBuffer.duration, time));
    this.offsetTime = clampedTime;
    this.startTime = this.ctx.currentTime - clampedTime;

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.start(0, clampedTime);
    this.isPlaying = true;
  }

  pause() {
    this.stop();
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  seek(targetTime) {
    if (this.isPlaying) {
      this.play(targetTime);
    } else {
      this.offsetTime = targetTime;
    }
  }

  update(timeline) {
    if (!this.isLoaded) return;

    if (timeline.isPlaying && !this.isPlaying) {
      this.play(timeline.currentTime);
    } else if (!timeline.isPlaying && this.isPlaying) {
      this.pause();
    } else if (this.isPlaying) {
      // Check for drift > 0.15s between timeline and audio
      const audioElapsed = this.ctx.currentTime - this.startTime;
      const drift = Math.abs(audioElapsed - timeline.currentTime);
      if (drift > 0.25) {
        this.play(timeline.currentTime);
      }
    }
  }
}
