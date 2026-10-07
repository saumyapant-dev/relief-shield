/**
 * Master Timeline Engine for "Little Dino's Big Roar"
 * Handles precise 60.00-second timing, scene phase management, easing, and playback synchronization.
 */

export const SCENES = [
  {
    id: 1,
    name: "The Hook",
    start: 0.0,
    end: 6.0,
    lyrics: "Little Dino wants to roar,\nBut what comes out? A squeak once more!",
    highlightWords: ["Dino", "roar", "squeak"],
    description: "Dino takes a deep breath, prepares to roar, but a tiny squeak comes out! Butterflies pause in surprise."
  },
  {
    id: 2,
    name: "Dino Tries Again",
    start: 6.0,
    end: 13.0,
    lyrics: "Roar, roar, Dino, give it a try!\nMake your biggest roar reach the sky!",
    highlightWords: ["Roar", "Dino", "try", "sky"],
    description: "Dino plants tiny feet, puffs up cheeks, and tries again. Squeaks again and deflates comically."
  },
  {
    id: 3,
    name: "Friends Arrive",
    start: 13.0,
    end: 20.0,
    lyrics: "Little bunny, monkey too,\nCome and cheer our Dino blue!",
    highlightWords: ["bunny", "monkey", "cheer", "Dino"],
    description: "Bunny hops in, Monkey swings down, Birdie lands on Dino's head. Bunny cheers: 'Don't give up, Dino!'"
  },
  {
    id: 4,
    name: "Musical Practice",
    start: 20.0,
    end: 29.0,
    lyrics: "Clap your hands, one, two, three!\nRoar along with you and me!",
    highlightWords: ["Clap", "one", "two", "three", "Roar"],
    description: "Friends clap in rhythm and bounce. Dino practices tiny roars with encouragement and musical notes."
  },
  {
    id: 5,
    name: "The Funny Sneeze",
    start: 29.0,
    end: 37.0,
    lyrics: "Big breath in, now count to four!\nAchoo! That wasn't quite a roar!",
    highlightWords: ["breath", "four", "Achoo!", "roar"],
    description: "Dino inhales big, nose wiggles, and ACHOO! Flower petals and leaves blast everywhere; friends giggle."
  },
  {
    id: 6,
    name: "The Big Roar",
    start: 37.0,
    end: 46.0,
    lyrics: "ROAR, ROAR, hear him say!\nLittle Dino's found his way!",
    highlightWords: ["ROAR", "ROAR", "Dino's", "way"],
    description: "Dino stands tall, camera zooms in, and he unleashes a mighty adorable ROAR! Sparkles and soundwaves erupt!"
  },
  {
    id: 7,
    name: "Jungle Dance Party",
    start: 46.0,
    end: 55.0,
    lyrics: "Roar and wiggle, stomp your feet!\nDino's dancing to the beat!",
    highlightWords: ["Roar", "wiggle", "stomp", "dancing", "beat"],
    description: "Dino wiggles and stomps; Bunny hops; Monkey spins; Birdie flaps; flowers bounce to the energetic rhythm."
  },
  {
    id: 8,
    name: "Loop Ending",
    start: 55.0,
    end: 60.0,
    lyrics: "Can you roar? Let's try once more!\nLittle Dino wants to roar!",
    highlightWords: ["roar", "once", "more", "Dino"],
    description: "Dino waves goodbye with a sweet smile, then inhales preparing to roar again. Perfectly loops to Scene 1!"
  }
];

export const TOTAL_DURATION = 60.0; // Exactly 60 seconds

export const Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutBack: (t, s = 1.70158) => {
    t = t - 1;
    return t * t * ((s + 1) * t + s) + 1;
  },
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  elasticOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  }
};

export class Timeline {
  constructor(duration = TOTAL_DURATION) {
    this.duration = duration;
    this.currentTime = 0.0;
    this.isPlaying = false;
    this.isLooping = true;
    this.playbackRate = 1.0;
    this.lastFrameTime = 0;
    this.listeners = {
      update: [],
      sceneChange: [],
      play: [],
      pause: [],
      seek: [],
      loop: []
    };
    this.currentSceneIndex = 0;
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  getCurrentScene(time = this.currentTime) {
    const clamped = Math.max(0, Math.min(this.duration, time));
    for (let i = 0; i < SCENES.length; i++) {
      const scene = SCENES[i];
      if (clamped >= scene.start && (clamped < scene.end || (i === SCENES.length - 1 && clamped <= scene.end))) {
        return { index: i, scene };
      }
    }
    return { index: 0, scene: SCENES[0] };
  }

  getSceneProgress(time = this.currentTime) {
    const { scene } = this.getCurrentScene(time);
    const sceneDuration = scene.end - scene.start;
    const progress = (time - scene.start) / sceneDuration;
    return Math.max(0, Math.min(1, progress));
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.emit("play", { time: this.currentTime });
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.emit("pause", { time: this.currentTime });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  restart() {
    this.seek(0.0);
    this.play();
  }

  seek(targetTime) {
    const prevTime = this.currentTime;
    this.currentTime = Math.max(0, Math.min(this.duration, targetTime));
    const oldSceneIdx = this.currentSceneIndex;
    const { index: newSceneIdx, scene } = this.getCurrentScene(this.currentTime);

    this.emit("seek", { time: this.currentTime, prevTime });
    if (oldSceneIdx !== newSceneIdx) {
      this.currentSceneIndex = newSceneIdx;
      this.emit("sceneChange", { scene, index: newSceneIdx });
    }
    this.emit("update", { time: this.currentTime, progress: this.currentTime / this.duration });
  }

  jumpToScene(sceneIndex) {
    if (sceneIndex >= 0 && sceneIndex < SCENES.length) {
      this.seek(SCENES[sceneIndex].start);
    }
  }

  tick(now = performance.now()) {
    if (!this.isPlaying) {
      this.lastFrameTime = now;
      return;
    }

    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Safety clamp on delta to avoid huge jumps if tab was backgrounded
    const safeDelta = Math.min(delta, 0.1) * this.playbackRate;
    let nextTime = this.currentTime + safeDelta;

    if (nextTime >= this.duration) {
      if (this.isLooping) {
        nextTime = nextTime % this.duration;
        this.emit("loop", { time: nextTime });
      } else {
        nextTime = this.duration;
        this.currentTime = nextTime;
        this.pause();
        this.emit("update", { time: this.currentTime, progress: 1.0 });
        return;
      }
    }

    const oldSceneIdx = this.currentSceneIndex;
    this.currentTime = nextTime;
    const { index: newSceneIdx, scene } = this.getCurrentScene(this.currentTime);

    if (oldSceneIdx !== newSceneIdx) {
      this.currentSceneIndex = newSceneIdx;
      this.emit("sceneChange", { scene, index: newSceneIdx });
    }

    this.emit("update", { time: this.currentTime, progress: this.currentTime / this.duration });
  }
}
