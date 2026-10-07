/**
 * Application Coordinator for "Little Dino's Big Roar"
 * Connects Canvas rendering, timeline clock, camera, characters, environment,
 * audio engines, UI controls, and video recorder.
 */

import { Timeline, SCENES, TOTAL_DURATION } from "./engine/timeline.js";
import { Camera } from "./engine/camera.js";
import { ParticleSystem } from "./engine/particles.js";
import { JungleEnvironment } from "./render/environment.js";
import { DinoCharacter } from "./render/dino.js";
import { FriendsRigs } from "./render/friends.js";
import { CaptionsRenderer } from "./render/captions.js";
import { SoundtrackEngine } from "./audio/soundTrack.js";
import { VocalsEngine } from "./audio/vocals.js";
import { SFXEngine } from "./audio/sfx.js";
import { SongPlayer } from "./audio/songPlayer.js";
import { VideoRecorder } from "./export/recorder.js";

class App {
  constructor() {
    this.canvas = document.getElementById("video-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Internal 1080x1920 logical canvas
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    // Web Audio setup
    this.audioCtx = null;
    this.audioDestination = null;
    this.songPlayer = null;
    this.soundtrack = null;
    this.vocals = null;
    this.sfx = null;

    // Engines
    this.timeline = new Timeline(TOTAL_DURATION);
    this.camera = new Camera(1080, 1920);
    this.particles = new ParticleSystem();
    this.environment = new JungleEnvironment();
    this.dino = new DinoCharacter();
    this.friends = new FriendsRigs();
    this.captions = new CaptionsRenderer();
    this.recorder = null;

    this.showSafeArea = false;
    this.isAudioInitialized = false;

    this.initAudio();
    this.initUI();
    this.bindEvents();

    // Start render loop
    requestAnimationFrame((now) => this.render(now));
  }

  initAudio() {
    // Lazily created or on first user click
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
      if (typeof this.audioCtx.createMediaStreamDestination === "function") {
        this.audioDestination = this.audioCtx.createMediaStreamDestination();
      }

      this.songPlayer = new SongPlayer(this.audioCtx, this.audioDestination);
      this.soundtrack = new SoundtrackEngine(this.audioCtx, this.audioDestination);
      this.vocals = new VocalsEngine(this.audioCtx, this.audioDestination);
      this.sfx = new SFXEngine(this.audioCtx, this.audioDestination);
      this.recorder = new VideoRecorder(this.canvas, this.audioDestination, this.timeline);
      this.isAudioInitialized = true;
    }
  }

  ensureAudioRunning() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  initUI() {
    this.playBtn = document.getElementById("btn-play");
    this.restartBtn = document.getElementById("btn-restart");
    this.exportBtn = document.getElementById("btn-export");
    this.timeDisplay = document.getElementById("time-display");
    this.seekBar = document.getElementById("seek-bar");
    this.scenePillsContainer = document.getElementById("scene-pills");
    this.lyricsDisplay = document.getElementById("active-lyrics-text");
    this.sceneNameDisplay = document.getElementById("active-scene-name");

    this.volumeSlider = document.getElementById("slider-volume");
    this.toggleMusicBtn = document.getElementById("btn-toggle-music");
    this.toggleSfxBtn = document.getElementById("btn-toggle-sfx");
    this.toggleVocalsBtn = document.getElementById("btn-toggle-vocals");
    this.toggleSafeAreaBtn = document.getElementById("btn-toggle-safe-area");

    this.exportModal = document.getElementById("export-modal");
    this.exportProgressBar = document.getElementById("export-progress-fill");
    this.exportProgressText = document.getElementById("export-progress-text");
    this.exportCancelBtn = document.getElementById("btn-export-cancel");

    // Populate Scene Pills
    this.scenePillsContainer.innerHTML = "";
    SCENES.forEach((sc, idx) => {
      const pill = document.createElement("button");
      pill.className = `scene-pill ${idx === 0 ? "active" : ""}`;
      pill.dataset.sceneIndex = idx;
      pill.innerHTML = `<span class="pill-num">0${sc.id}</span> <span class="pill-name">${sc.name}</span>`;
      pill.addEventListener("click", () => {
        this.ensureAudioRunning();
        this.timeline.jumpToScene(idx);
        if (!this.timeline.isPlaying) this.timeline.play();
      });
      this.scenePillsContainer.appendChild(pill);
    });
  }

  bindEvents() {
    // Play / Pause Toggle
    this.playBtn.addEventListener("click", () => {
      this.ensureAudioRunning();
      this.timeline.togglePlay();
    });

    // Canvas click toggles play
    this.canvas.addEventListener("click", () => {
      this.ensureAudioRunning();
      this.timeline.togglePlay();
    });

    // Restart
    this.restartBtn.addEventListener("click", () => {
      this.ensureAudioRunning();
      this.timeline.restart();
      if (this.songPlayer) this.songPlayer.seek(0);
      if (this.sfx) this.sfx.reset();
      if (this.vocals) this.vocals.seek(0);
      if (this.soundtrack) this.soundtrack.seek(0);
    });

    // Scrubber
    this.seekBar.addEventListener("input", (e) => {
      this.ensureAudioRunning();
      const val = parseFloat(e.target.value);
      const targetTime = (val / 100) * this.timeline.duration;
      this.timeline.seek(targetTime);
      this.camera.update(this.timeline);
      this.camera.snapToTarget();
      if (this.songPlayer) this.songPlayer.seek(targetTime);
      if (this.soundtrack) this.soundtrack.seek(targetTime);
      if (this.vocals) this.vocals.seek(targetTime);
      if (this.sfx) this.sfx.seek(targetTime);
    });

    // Timeline Events
    this.timeline.on("play", () => {
      this.playBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="2"/>
          <rect x="14" y="4" width="4" height="16" rx="2"/>
        </svg>
        <span>Pause</span>
      `;
      this.playBtn.classList.add("playing");
      if (this.songPlayer) this.songPlayer.play(this.timeline.currentTime);
    });

    this.timeline.on("pause", () => {
      this.playBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6,4 20,12 6,20"/>
        </svg>
        <span>Play</span>
      `;
      this.playBtn.classList.remove("playing");
      if (this.songPlayer) this.songPlayer.pause();
      if (this.vocals) this.vocals.stop();
    });

    this.timeline.on("update", (data) => {
      const time = data.time;
      const progress = data.progress;

      // Update seekbar
      this.seekBar.value = (progress * 100).toFixed(1);

      // Update formatted time (mm:ss / 01:00)
      const sec = Math.floor(time);
      const msec = Math.floor((time % 1) * 10);
      const formatted = `00:${sec < 10 ? "0" : ""}${sec}.${msec} / 01:00`;
      this.timeDisplay.textContent = formatted;
    });

    this.timeline.on("sceneChange", (data) => {
      this.updateActiveSceneUI(data.index, data.scene);
    });

    this.timeline.on("loop", () => {
      if (this.songPlayer) this.songPlayer.seek(0);
      if (this.sfx) this.sfx.reset();
      if (this.vocals) this.vocals.seek(0);
      if (this.soundtrack) this.soundtrack.seek(0);
      if (this.particles) this.particles.reset();
    });

    // Audio Mixer
    this.volumeSlider.addEventListener("input", (e) => {
      const vol = parseFloat(e.target.value);
      if (this.songPlayer) this.songPlayer.setVolume(vol);
      if (this.soundtrack) this.soundtrack.setVolume(vol);
      if (this.vocals) this.vocals.setVolume(vol);
      if (this.sfx) this.sfx.setVolume(vol);
    });

    this.toggleMusicBtn.addEventListener("click", () => {
      this.ensureAudioRunning();
      const isActive = this.toggleMusicBtn.classList.toggle("active");
      if (this.songPlayer) this.songPlayer.toggle(isActive);
      if (this.soundtrack) this.soundtrack.toggle(isActive);
    });

    this.toggleSfxBtn.addEventListener("click", () => {
      this.ensureAudioRunning();
      const isActive = this.toggleSfxBtn.classList.toggle("active");
      if (this.sfx) this.sfx.toggle(isActive);
    });

    this.toggleVocalsBtn.addEventListener("click", () => {
      this.ensureAudioRunning();
      const isActive = this.toggleVocalsBtn.classList.toggle("active");
      if (this.vocals) this.vocals.toggle(isActive);
    });

    this.toggleSafeAreaBtn.addEventListener("click", () => {
      this.showSafeArea = !this.showSafeArea;
      this.toggleSafeAreaBtn.classList.toggle("active", this.showSafeArea);
    });

    // Video Export Trigger
    this.exportBtn.addEventListener("click", () => {
      this.startExport();
    });

    this.exportCancelBtn.addEventListener("click", () => {
      if (this.recorder) {
        this.recorder.stop();
        this.exportModal.classList.remove("visible");
      }
    });

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.ensureAudioRunning();
        this.timeline.togglePlay();
      } else if (e.code === "ArrowRight") {
        this.timeline.seek(this.timeline.currentTime + 3.0);
      } else if (e.code === "ArrowLeft") {
        this.timeline.seek(this.timeline.currentTime - 3.0);
      } else if (e.code === "Home") {
        this.timeline.restart();
      }
    });
  }

  updateActiveSceneUI(index, scene) {
    // Highlight pill
    const pills = this.scenePillsContainer.querySelectorAll(".scene-pill");
    pills.forEach((p, idx) => {
      p.classList.toggle("active", idx === index);
    });

    // Update scene name & lyrics preview in UI footer
    if (this.sceneNameDisplay) {
      this.sceneNameDisplay.textContent = `Scene ${scene.id}: ${scene.name}`;
    }
    if (this.lyricsDisplay) {
      this.lyricsDisplay.textContent = scene.lyrics.replace("\n", " — ");
    }
  }

  startExport() {
    this.ensureAudioRunning();
    if (!this.recorder || !this.recorder.isSupported()) {
      alert("MediaRecorder is not supported in this browser. Please use Chrome, Edge, or Firefox.");
      return;
    }

    this.exportModal.classList.add("visible");
    this.exportProgressBar.style.width = "0%";
    this.exportProgressText.textContent = "Recording 1080x1920 video at 30 FPS... (0%)";

    this.recorder.startFullRecording(
      (progress) => {
        this.exportProgressBar.style.width = `${progress.percent}%`;
        this.exportProgressText.textContent = `Recording video... ${progress.percent}% (${progress.currentTime.toFixed(1)}s / 60.0s)`;
      },
      (result) => {
        this.exportProgressBar.style.width = "100%";
        this.exportProgressText.textContent = `Export complete! Downloaded ${result.filename}`;
        setTimeout(() => {
          this.exportModal.classList.remove("visible");
        }, 2200);
      },
      (err) => {
        console.error("Export error:", err);
        this.exportProgressText.textContent = `Export failed: ${err.message}`;
      }
    );
  }

  render(now) {
    // 1. Tick timeline clock
    this.timeline.tick(now);

    // 2. Update audio engines
    if (this.isAudioInitialized) {
      if (this.songPlayer && this.songPlayer.isLoaded) {
        this.songPlayer.update(this.timeline);
      } else {
        if (this.soundtrack) this.soundtrack.update(this.timeline);
        if (this.vocals) this.vocals.update(this.timeline);
      }
      if (this.sfx) this.sfx.update(this.timeline);
    }

    // 3. Update physics & visual engines
    this.camera.update(this.timeline);
    this.particles.update(this.timeline);

    // 4. Render to 1080x1920 canvas
    this.ctx.clearRect(0, 0, 1080, 1920);

    // Apply Camera Transform
    this.camera.apply(this.ctx);

    // Layer 1: Prehistoric Jungle Background
    this.environment.draw(this.ctx, this.timeline);

    // Layer 2: Dino Character Rig
    this.dino.draw(this.ctx, this.timeline);

    // Layer 3: Supporting Friends (Bunny, Monkey, Birdie)
    this.friends.draw(this.ctx, this.timeline);

    // Layer 4: Particle System (butterflies, musical notes, sneeze leaves, roar sparkles)
    this.particles.draw(this.ctx, this.timeline);

    // Layer 5: Foreground Jungle Foliage
    this.environment.drawForeground(this.ctx);

    // Restore Camera Transform for UI / Captions Overlay
    this.camera.restore(this.ctx);

    // Layer 6: Synchronized Nursery Rhyme Captions (with safe margins)
    this.captions.draw(this.ctx, this.timeline);

    // Layer 7: Optional YouTube Shorts Safe Margins Overlay
    if (this.showSafeArea) {
      this.drawSafeAreaOverlay(this.ctx);
    }

    // Request next frame
    requestAnimationFrame((time) => this.render(time));
  }

  drawSafeAreaOverlay(ctx) {
    ctx.save();
    // YouTube Shorts safe zone boundaries
    // Top header safe margin: 180px
    // Bottom description/sound margin: 380px
    // Right action button margin: 150px
    ctx.strokeStyle = "rgba(255, 77, 109, 0.85)";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 12]);

    // Safe rectangle
    ctx.strokeRect(60, 180, 1080 - 210, 1920 - 560);

    // Labels
    ctx.font = "bold 28px 'Nunito', sans-serif";
    ctx.fillStyle = "#FF4D6D";
    ctx.fillText("YouTube Shorts Safe Action Area", 80, 220);
    ctx.fillText("Right Action Buttons Zone (Like, Share, Remix) ->", 380, 1000);
    ctx.fillText("Bottom Audio & Caption Safe Boundary", 80, 1520);

    ctx.restore();
  }
}

// Start application when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
