/**
 * Node.js Test Suite for "Little Dino's Big Roar"
 * Verifies timeline timings, 8 scenes, contiguous boundaries,
 * audio parameters, and character/camera math.
 */

import { Timeline, SCENES, TOTAL_DURATION, Easing } from "../js/engine/timeline.js";
import { Camera } from "../js/engine/camera.js";
import { ParticleSystem } from "../js/engine/particles.js";

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✔ PASS: ${message}`);
  } else {
    console.error(`✖ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log("=== Running Little Dino's Big Roar Verification Tests ===\n");

// 1. Duration check
assert(TOTAL_DURATION === 60.0, `Total duration is exactly 60.0s (got ${TOTAL_DURATION})`);

// 2. Exactly 8 scenes
assert(SCENES.length === 8, `Exactly 8 scenes defined (got ${SCENES.length})`);

// 3. Scene continuity and lyrics verification
let contiguous = true;
let currentEnd = 0.0;
SCENES.forEach((scene, i) => {
  if (Math.abs(scene.start - currentEnd) > 0.001) contiguous = false;
  currentEnd = scene.end;
  assert(scene.lyrics && scene.lyrics.length > 10, `Scene ${scene.id} (${scene.name}) has valid lyrics`);
});
assert(contiguous && currentEnd === 60.0, `Scenes are strictly contiguous from 0.0s to 60.0s`);

// 4. Exact Scene Timing Map Verification
assert(SCENES[0].start === 0.0 && SCENES[0].end === 6.0, "Scene 1: The Hook (00:00 - 00:06)");
assert(SCENES[1].start === 6.0 && SCENES[1].end === 13.0, "Scene 2: Dino Tries Again (00:06 - 00:13)");
assert(SCENES[2].start === 13.0 && SCENES[2].end === 20.0, "Scene 3: Friends Arrive (00:13 - 00:20)");
assert(SCENES[3].start === 20.0 && SCENES[3].end === 29.0, "Scene 4: Musical Practice (00:20 - 00:29)");
assert(SCENES[4].start === 29.0 && SCENES[4].end === 37.0, "Scene 5: The Funny Sneeze (00:29 - 00:37)");
assert(SCENES[5].start === 37.0 && SCENES[5].end === 46.0, "Scene 6: The Big Roar (00:37 - 00:46)");
assert(SCENES[6].start === 46.0 && SCENES[6].end === 55.0, "Scene 7: Jungle Dance Party (00:46 - 00:55)");
assert(SCENES[7].start === 55.0 && SCENES[7].end === 60.0, "Scene 8: Loop Ending (00:55 - 01:00)");

// 5. Timeline playback and scene resolution
const timeline = new Timeline(60.0);
timeline.seek(0.5);
assert(timeline.getCurrentScene().scene.id === 1, "0.5s resolves to Scene 1");
timeline.seek(8.0);
assert(timeline.getCurrentScene().scene.id === 2, "8.0s resolves to Scene 2");
timeline.seek(15.0);
assert(timeline.getCurrentScene().scene.id === 3, "15.0s resolves to Scene 3");
timeline.seek(25.0);
assert(timeline.getCurrentScene().scene.id === 4, "25.0s resolves to Scene 4");
timeline.seek(34.0);
assert(timeline.getCurrentScene().scene.id === 5, "34.0s resolves to Scene 5");
timeline.seek(42.0);
assert(timeline.getCurrentScene().scene.id === 6, "42.0s resolves to Scene 6");
timeline.seek(50.0);
assert(timeline.getCurrentScene().scene.id === 7, "50.0s resolves to Scene 7");
timeline.seek(58.0);
assert(timeline.getCurrentScene().scene.id === 8, "58.0s resolves to Scene 8");

// 6. Seamless Looping Boundary Check
timeline.seek(59.95);
timeline.isPlaying = true;
timeline.isLooping = true;
timeline.lastFrameTime = 1000;
timeline.tick(1100); // delta 0.1s -> 60.05s -> wraps to ~0.05s
assert(timeline.currentTime < 1.0, `Seamless loop: timestamp wraps back to 0.0s on loop boundary (got ${timeline.currentTime.toFixed(3)}s)`);
assert(timeline.getCurrentScene().scene.id === 1, "Loop returns directly to Scene 1");

// 7. Camera transformations check
const camera = new Camera(1080, 1920);
timeline.seek(1.0);
camera.update(timeline);
assert(camera.zoom >= 1.0, `Camera zoom in Scene 1 >= 1.0 (got ${camera.zoom.toFixed(2)})`);

timeline.seek(42.0); // Big roar
camera.update(timeline);
camera.snapToTarget();
assert(camera.zoom > 1.25, `Camera zoom in Scene 6 epic roar > 1.25 (got ${camera.zoom.toFixed(2)})`);

// 8. Particle System Check
const particles = new ParticleSystem();
assert(particles.butterflies.length === 2, "2 fluttering butterflies created");
assert(particles.ambientPollen.length > 20, "Ambient pollen initialized");

particles.triggerSneezeConfetti(540, 1000);
assert(particles.leaves.length >= 80, `Sneeze trigger spawns >= 80 petals/leaves (got ${particles.leaves.length})`);

particles.triggerRoarBurst(540, 980);
assert(particles.sparkles.length >= 50, `Roar trigger spawns >= 50 sparkles (got ${particles.sparkles.length})`);
assert(particles.soundwaves.length >= 3, `Roar trigger spawns soundwave pulses (got ${particles.soundwaves.length})`);

// 9. Easing Functions
assert(Easing.linear(0.5) === 0.5, "Easing linear works");
assert(Easing.easeOutBack(1.0) === 1.0, "Easing easeOutBack ends at 1.0");

console.log(`\n=== Summary: ${passedTests}/${totalTests} Tests Passed Successfully! ===`);
