/**
 * Particle and FX Engine for "Little Dino's Big Roar"
 * Manages butterflies, musical notes, confetti leaves & petals, roar sparkles, and soundwaves.
 */

export class ParticleSystem {
  constructor() {
    this.notes = [];
    this.leaves = [];
    this.sparkles = [];
    this.soundwaves = [];
    this.butterflies = [
      { x: 200, y: 700, targetX: 350, targetY: 650, color: "#FF9CEE", wingAngle: 0, size: 28, paused: false },
      { x: 880, y: 620, targetX: 720, targetY: 680, color: "#70D6FF", wingAngle: 0, size: 24, paused: false }
    ];
    this.ambientPollen = [];
    this.initPollen();
    this.lastSneezeTriggered = -1;
    this.lastRoarTriggered = -1;
  }

  initPollen() {
    this.ambientPollen = [];
    for (let i = 0; i < 35; i++) {
      this.ambientPollen.push({
        x: Math.random() * 1080,
        y: Math.random() * 1920,
        radius: 2 + Math.random() * 4,
        alpha: 0.2 + Math.random() * 0.4,
        speedY: 0.3 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        swayOffset: Math.random() * Math.PI * 2
      });
    }
  }

  reset() {
    this.notes = [];
    this.leaves = [];
    this.sparkles = [];
    this.soundwaves = [];
    this.lastSneezeTriggered = -1;
    this.lastRoarTriggered = -1;
    this.initPollen();
  }

  spawnNote(x, y, color = "#FFD166") {
    const symbols = ["♪", "♫", "♬", "♩"];
    this.notes.push({
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 40,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      color: color,
      size: 34 + Math.random() * 20,
      speedY: 1.8 + Math.random() * 1.5,
      wobbleSpeed: 2 + Math.random() * 2,
      wobbleOffset: Math.random() * Math.PI * 2,
      alpha: 1.0,
      scale: 0.1,
      maxScale: 1.0 + Math.random() * 0.4,
      rotation: (Math.random() - 0.5) * 0.5
    });
  }

  triggerSneezeConfetti(centerX = 540, centerY = 1000) {
    const colors = ["#FF758F", "#FFB703", "#80ED99", "#57CC99", "#C77DFF", "#FFAAA6"];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 7 + Math.random() * 18;
      this.leaves.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: 14 + Math.random() * 22,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1.0,
        type: Math.random() > 0.5 ? "petal" : "leaf",
        gravity: 0.32 + Math.random() * 0.2
      });
    }
  }

  triggerRoarBurst(centerX = 540, centerY = 980) {
    // Soundwave pulses
    for (let i = 0; i < 4; i++) {
      this.soundwaves.push({
        x: centerX,
        y: centerY,
        radius: 30 + i * 40,
        maxRadius: 650,
        alpha: 0.9,
        lineWidth: 18 - i * 2,
        color: i % 2 === 0 ? "rgba(255, 230, 109, " : "rgba(255, 107, 107, "
      });
    }

    // Golden sparkles and stars
    const colors = ["#FFD166", "#FFE66D", "#FF9F1C", "#FFFFFF", "#70D6FF", "#FF70A6"];
    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 16;
      this.sparkles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 16 + Math.random() * 26,
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        decay: 0.015 + Math.random() * 0.02
      });
    }
  }

  update(timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;
    const p = timeline.getSceneProgress(t);

    // Update ambient pollen
    this.ambientPollen.forEach((pollen) => {
      pollen.y -= pollen.speedY;
      pollen.x += Math.sin(t * 1.5 + pollen.swayOffset) * 0.6;
      if (pollen.y < -20) {
        pollen.y = 1940;
        pollen.x = Math.random() * 1080;
      }
    });

    // Update butterflies
    this.butterflies.forEach((b, i) => {
      b.wingAngle = Math.sin(t * 16 + i * 2) * 0.9;
      // In Scene 1 around squeak (t between 3.5 and 6.0), butterflies freeze or look in surprise
      if (sceneId === 1 && t >= 3.2 && t <= 5.8) {
        b.paused = true;
        b.wingAngle = Math.sin(t * 4 + i) * 0.3; // gentle hover
      } else {
        b.paused = false;
        const flightTime = t * 0.8 + i * 3.5;
        b.x = 540 + Math.cos(flightTime * 0.9) * (340 + i * 60) + Math.sin(t * 2) * 20;
        b.y = 650 + Math.sin(flightTime * 1.3) * 120 + Math.cos(t * 3) * 30;
      }
    });

    // Scene-specific note spawning
    if (sceneId === 4 && Math.floor(t * 3.5) !== Math.floor((t - 0.033) * 3.5)) {
      // Clapping rhythm notes
      this.spawnNote(340 + Math.random() * 400, 1050, ["#FFD166", "#06D6A0", "#FF6B8B"][Math.floor(Math.random() * 3)]);
    } else if (sceneId === 6 && t >= 40.0 && Math.floor(t * 6) !== Math.floor((t - 0.033) * 6)) {
      // Big Roar notes
      this.spawnNote(540 + (Math.random() - 0.5) * 280, 950, "#FFD166");
    } else if (sceneId === 7 && Math.floor(t * 4.5) !== Math.floor((t - 0.033) * 4.5)) {
      // Dance party notes
      this.spawnNote(200 + Math.random() * 680, 1100, ["#FF70A6", "#70D6FF", "#FFD166", "#06D6A0"][Math.floor(Math.random() * 4)]);
    }

    // Trigger sneeze burst once in Scene 5 at ~33.8s
    if (sceneId === 5 && t >= 33.6 && this.lastSneezeTriggered !== 5) {
      this.triggerSneezeConfetti(540, 1040);
      this.lastSneezeTriggered = 5;
    }
    if (sceneId !== 5) {
      this.lastSneezeTriggered = -1;
    }

    // Trigger roar burst in Scene 6 at 40.0s
    if (sceneId === 6 && t >= 40.0 && this.lastRoarTriggered !== 6) {
      this.triggerRoarBurst(540, 980);
      this.lastRoarTriggered = 6;
    }
    if (sceneId !== 6) {
      this.lastRoarTriggered = -1;
    }

    // Update notes
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      n.y -= n.speedY;
      n.x += Math.sin(t * n.wobbleSpeed + n.wobbleOffset) * 1.8;
      n.scale = Math.min(n.maxScale, n.scale + 0.06);
      n.alpha -= 0.008;
      if (n.alpha <= 0 || n.y < -50) {
        this.notes.splice(i, 1);
      }
    }

    // Update sneeze confetti leaves
    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const l = this.leaves[i];
      l.x += l.vx;
      l.y += l.vy;
      l.vy += l.gravity;
      l.vx *= 0.98;
      l.rotation += l.rotSpeed;
      l.alpha -= 0.006;
      if (l.alpha <= 0 || l.y > 1950) {
        this.leaves.splice(i, 1);
      }
    }

    // Update sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.rotation += s.rotSpeed;
      s.alpha -= s.decay;
      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
      }
    }

    // Update soundwaves
    for (let i = this.soundwaves.length - 1; i >= 0; i--) {
      const sw = this.soundwaves[i];
      sw.radius += 14;
      sw.alpha = Math.max(0, 0.9 * (1 - sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.soundwaves.splice(i, 1);
      }
    }
  }

  draw(ctx, timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;

    // Draw ambient pollen
    ctx.save();
    this.ambientPollen.forEach((p) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw soundwaves
    this.soundwaves.forEach((sw) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color + sw.alpha + ")";
      ctx.lineWidth = sw.lineWidth;
      ctx.stroke();
      ctx.restore();
    });

    // Draw butterflies
    this.butterflies.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.beginPath();
      ctx.ellipse(0, 80, b.size * 0.8, b.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Antennae
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, -10);
      ctx.quadraticCurveTo(-8, -20, -12, -22);
      ctx.moveTo(2, -10);
      ctx.quadraticCurveTo(8, -20, 12, -22);
      ctx.stroke();

      // Antenna tips
      ctx.fillStyle = "#FF70A6";
      ctx.beginPath();
      ctx.arc(-12, -22, 2.5, 0, Math.PI * 2);
      ctx.arc(12, -22, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Wings with 3D gradient
      const wingScaleX = Math.cos(b.wingAngle);
      // Left Wing
      ctx.save();
      ctx.scale(wingScaleX, 1);
      const wingGrad = ctx.createRadialGradient(-15, -6, 2, -15, -6, b.size);
      wingGrad.addColorStop(0, "#FFFFFF");
      wingGrad.addColorStop(0.5, b.color);
      wingGrad.addColorStop(1, "#8338EC");
      ctx.fillStyle = wingGrad;

      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.bezierCurveTo(-b.size * 1.1, -b.size * 1.2, -b.size * 1.4, -4, -b.size * 0.6, 6);
      ctx.bezierCurveTo(-b.size * 1.1, 16, -b.size * 0.4, b.size * 0.9, 0, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Right Wing
      ctx.save();
      ctx.scale(-wingScaleX, 1);
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.bezierCurveTo(-b.size * 1.1, -b.size * 1.2, -b.size * 1.4, -4, -b.size * 0.6, 6);
      ctx.bezierCurveTo(-b.size * 1.1, 16, -b.size * 0.4, b.size * 0.9, 0, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // If paused in Scene 1 (curious / surprised reaction)
      if (b.paused && sceneId === 1) {
        ctx.fillStyle = "#FF477E";
        ctx.font = "bold 26px 'Nunito', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", 0, -32);
      }

      ctx.restore();
    });

    // Draw confetti leaves and petals (Scene 5 sneeze)
    this.leaves.forEach((l) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      ctx.globalAlpha = Math.max(0, l.alpha);
      ctx.fillStyle = l.color;

      ctx.beginPath();
      if (l.type === "leaf") {
        ctx.moveTo(0, -l.size);
        ctx.quadraticCurveTo(l.size * 0.7, 0, 0, l.size);
        ctx.quadraticCurveTo(-l.size * 0.7, 0, 0, -l.size);
      } else {
        // Petal shape
        ctx.arc(0, 0, l.size * 0.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    });

    // Draw sparkles / stars (Scene 6 roar)
    this.sparkles.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;

      // 4-pointed star
      ctx.beginPath();
      const rOuter = s.size;
      const rInner = s.size * 0.28;
      for (let i = 0; i < 8; i++) {
        const rad = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? rOuter : rInner;
        const px = Math.cos(rad) * r;
        const py = Math.sin(rad) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Center bright glow
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, s.size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Draw musical notes
    this.notes.forEach((n) => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rotation);
      ctx.scale(n.scale, n.scale);
      ctx.globalAlpha = Math.max(0, n.alpha);

      // Text glow outline
      ctx.font = `900 ${n.size}px 'Fredoka', 'Nunito', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 6;
      ctx.strokeText(n.symbol, 0, 0);

      ctx.fillStyle = n.color;
      ctx.fillText(n.symbol, 0, 0);

      ctx.restore();
    });
  }
}
