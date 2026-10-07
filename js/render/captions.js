/**
 * Synchronized Nursery Rhyme Captions Renderer
 * Features child-friendly bouncy bubble typography, YouTube Shorts safe margin protection,
 * karaoke word-by-word highlighting, and special keyword effects for ROAR, DINO, ACHOO.
 */

export class CaptionsRenderer {
  constructor() {
    this.safeAreaY = 1680; // Safe zone above Shorts bottom controls, well below Dino's face
  }

  draw(ctx, timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const scene = sceneInfo.scene;
    const p = timeline.getSceneProgress(t);

    const lines = scene.lyrics.split("\n");
    // Show line 1 during first half of scene, line 2 during second half
    const lineIndex = p < 0.5 ? 0 : 1;
    const activeLine = lines[lineIndex] || lines[0];
    const lineProgress = (p % 0.5) / 0.5;

    // Split words
    const words = activeLine.split(" ");
    const wordCount = words.length;
    const activeWordIndex = Math.min(wordCount - 1, Math.floor(lineProgress * wordCount));

    ctx.save();

    // 1. Semi-transparent Frosted Pill Backdrop for perfect readability
    ctx.font = "900 48px 'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif";
    const totalTextWidth = ctx.measureText(activeLine).width;
    const pillWidth = Math.min(980, totalTextWidth + 80);
    const pillHeight = 110;
    const pillX = 540 - pillWidth / 2;
    const pillY = this.safeAreaY - pillHeight / 2;

    // Soft drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    // Pill background
    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillHeight);
    pillGrad.addColorStop(0, "rgba(24, 28, 36, 0.88)");
    pillGrad.addColorStop(1, "rgba(12, 16, 22, 0.95)");
    ctx.fillStyle = pillGrad;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 55);
    ctx.fill();

    // Neon accent outline
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(110, 214, 143, 0.75)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 2. Render Words with Karaoke Timing & Bouncy Highlight
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Measure each word width and total spacing
    const wordMetrics = words.map((w) => ctx.measureText(w + " ").width);
    const lineRenderWidth = wordMetrics.reduce((sum, w) => sum + w, 0);
    let startX = 540 - lineRenderWidth / 2;

    words.forEach((word, idx) => {
      const wWidth = wordMetrics[idx];
      const wordCenterX = startX + wWidth / 2;
      const isCurrent = idx === activeWordIndex;
      const isCleanWord = word.toUpperCase().replace(/[^A-Z]/g, "");
      const isSpecialKeyWord = ["ROAR", "DINO", "DINOS", "ACHOO", "SQUEAK"].includes(isCleanWord);

      ctx.save();
      ctx.translate(wordCenterX, this.safeAreaY);

      if (isCurrent) {
        // Karaoke active bounce
        const bounceScale = 1.18 + Math.sin(t * 16) * 0.05;
        const bounceY = -8;
        ctx.translate(0, bounceY);
        ctx.scale(bounceScale, bounceScale);

        // Highlight Glow
        ctx.shadowColor = isSpecialKeyWord ? "#FFD166" : "#6ED68F";
        ctx.shadowBlur = 22;

        // Special word color
        if (isSpecialKeyWord) {
          ctx.fillStyle = isCleanWord === "ROAR" ? "#FF5964" : isCleanWord === "ACHOO" ? "#FF9F1C" : "#FFE66D";
        } else {
          ctx.fillStyle = "#FFFA65"; // Vivid sunny karaoke yellow
        }
      } else {
        // Inactive words: clean crisp white
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 6;
      }

      // Soft text outline for preschool cartoon clarity
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = 8;
      ctx.lineJoin = "round";
      ctx.strokeText(word, 0, 0);

      // Main Text Fill
      ctx.fillText(word, 0, 0);

      ctx.restore();
      startX += wWidth;
    });

    ctx.restore();
  }
}
