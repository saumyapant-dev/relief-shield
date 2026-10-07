/**
 * Verification Test for Studio Song Audio and Synchronization
 */

import { SCENES, TOTAL_DURATION } from "../js/engine/timeline.js";
import fs from "fs";

let pass = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    pass++;
    console.log(`✔ PASS: ${msg}`);
  } else {
    console.error(`✖ FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

console.log("=== Testing Studio Song Track Synchronization ===\n");

// 1. Verify audio file existence
assert(fs.existsSync("assets/audio/little_dino_song.wav"), "assets/audio/little_dino_song.wav exists");
assert(fs.existsSync("assets/audio/little_dino_song.m4a"), "assets/audio/little_dino_song.m4a exists");

// 2. Verify file size is substantial (not truncated)
const wavStats = fs.statSync("assets/audio/little_dino_song.wav");
assert(wavStats.size > 10000000, `WAV file size is > 10MB (${(wavStats.size / 1024 / 1024).toFixed(2)} MB)`);

// 3. Verify WAV header parameters
const fd = fs.openSync("assets/audio/little_dino_song.wav", "r");
const header = Buffer.alloc(44);
fs.readSync(fd, header, 0, 44, 0);
fs.closeSync(fd);

const riff = header.toString("ascii", 0, 4);
const wave = header.toString("ascii", 8, 12);
const channels = header.readUInt16LE(22);
const sampleRate = header.readUInt32LE(24);
const bitsPerSample = header.readUInt16LE(34);
const dataSize = header.readUInt32LE(40);
const durationSeconds = dataSize / (sampleRate * channels * (bitsPerSample / 8));

assert(riff === "RIFF" && wave === "WAVE", "Valid WAV container header");
assert(channels === 2, `Stereo channels: 2 (got ${channels})`);
assert(sampleRate === 44100, `Sample rate: 44,100 Hz (got ${sampleRate})`);
assert(bitsPerSample === 16, `Bit depth: 16-bit PCM (got ${bitsPerSample})`);
assert(Math.abs(durationSeconds - 60.0) < 0.01, `Exact duration: 60.00s (got ${durationSeconds.toFixed(2)}s)`);

console.log(`\n=== Studio Song Sync Test: ${pass}/${total} Passed! ===`);
