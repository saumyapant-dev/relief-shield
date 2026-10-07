/**
 * Video Exporter Engine for "Little Dino's Big Roar"
 * Captures 1080x1920 30FPS canvas stream + combined Web Audio stream (music + SFX + vocals)
 * via MediaRecorder and exports a high-quality vertical video.
 */

export class VideoRecorder {
  constructor(canvas, audioDestinationNode, timeline) {
    this.canvas = canvas;
    this.audioDestination = audioDestinationNode;
    this.timeline = timeline;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  isSupported() {
    return typeof MediaRecorder !== "undefined" && typeof this.canvas.captureStream === "function";
  }

  getBestMimeType() {
    const candidateTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=avc1,mp4a",
      "video/mp4"
    ];

    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }

  startFullRecording(onProgress, onComplete, onError) {
    if (this.isRecording) return;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;

    if (!this.isSupported()) {
      if (this.onError) {
        this.onError(new Error("MediaRecorder or Canvas captureStream is not supported in this browser."));
      }
      return;
    }

    try {
      // 1. Get 30 FPS video stream from 1080x1920 canvas
      const videoStream = this.canvas.captureStream(30);

      // 2. Get combined audio stream from Web Audio destination node
      const audioStream = this.audioDestination.stream;

      // 3. Combine video & audio tracks
      const combinedTracks = [
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = this.getBestMimeType();
      const options = mimeType ? { mimeType, videoBitsPerSecond: 8000000 } : {};

      this.mediaRecorder = new MediaRecorder(combinedStream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const finalMime = mimeType || "video/webm";
        const blob = new Blob(this.recordedChunks, { type: finalMime });
        const ext = finalMime.includes("mp4") ? "mp4" : "webm";
        const filename = `Little_Dinos_Big_Roar_1080x1920.${ext}`;

        this.downloadBlob(blob, filename);
        this.isRecording = false;

        if (this.onComplete) {
          this.onComplete({ blob, filename, url: URL.createObjectURL(blob) });
        }
      };

      this.mediaRecorder.onerror = (err) => {
        this.isRecording = false;
        if (this.onError) this.onError(err);
      };

      // Reset timeline to 0 and start recording
      this.timeline.seek(0.0);
      this.timeline.isLooping = false; // Do not loop during recording
      this.isRecording = true;

      this.mediaRecorder.start(200); // 200ms slice chunks
      this.timeline.play();

      // Monitor recording progress
      const checkProgress = () => {
        if (!this.isRecording) return;

        const current = this.timeline.currentTime;
        const total = this.timeline.duration;
        const progress = Math.min(1.0, current / total);

        if (this.onProgress) {
          this.onProgress({
            currentTime: current,
            totalDuration: total,
            progress: progress,
            percent: Math.floor(progress * 100)
          });
        }

        if (current >= total || !this.timeline.isPlaying) {
          this.stop();
        } else {
          requestAnimationFrame(checkProgress);
        }
      };

      requestAnimationFrame(checkProgress);
    } catch (err) {
      this.isRecording = false;
      if (this.onError) this.onError(err);
    }
  }

  stop() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.timeline.pause();
    this.timeline.isLooping = true; // Restore looping

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  }
}
