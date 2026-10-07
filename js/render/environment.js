/**
 * Prehistoric Jungle Environment Renderer
 * Features layered 3D-inspired cartoon hills, rounded trees, swaying oversized flowers,
 * drifting clouds, sunbeams, and lush foreground framing.
 */

export class JungleEnvironment {
  constructor() {
    this.cloudList = [
      { x: 120, y: 220, scale: 1.1, speed: 12 },
      { x: 620, y: 150, scale: 0.85, speed: 8 },
      { x: 940, y: 310, scale: 1.25, speed: 15 },
      { x: -180, y: 260, scale: 0.95, speed: 10 }
    ];

    this.flowers = [
      // Left flower cluster
      { x: 140, y: 1460, height: 380, color: "#FF6584", centerColor: "#FFE66D", petals: 6, swaySpeed: 2.1, swayPhase: 0 },
      { x: 250, y: 1520, height: 260, color: "#7209B7", centerColor: "#4CC9F0", petals: 5, swaySpeed: 2.6, swayPhase: 1.2 },
      // Right flower cluster
      { x: 920, y: 1450, height: 390, color: "#FF9F1C", centerColor: "#FFBF69", petals: 7, swaySpeed: 2.3, swayPhase: 2.5 },
      { x: 810, y: 1530, height: 250, color: "#FF70A6", centerColor: "#FFF3B0", petals: 5, swaySpeed: 2.7, swayPhase: 3.8 }
    ];
  }

  draw(ctx, timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;

    // Musical beat pulse factor for flowers and foliage
    const beatPulse = (sceneId === 7) ? Math.sin(t * Math.PI * 3.8) * 0.08 : Math.sin(t * Math.PI * 1.9) * 0.04;

    // 1. SKY GRADIENT (Bright preschool morning prehistoric sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1400);
    skyGrad.addColorStop(0.0, "#74D7FA"); // Sky blue
    skyGrad.addColorStop(0.45, "#A8EDEA"); // Mint aqua
    skyGrad.addColorStop(0.8, "#FED6E3"); // Soft pastel peach
    skyGrad.addColorStop(1.0, "#FEE3D8"); // Warm morning glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. SUN AND GENTLE SUNRAYS
    this.drawSunAndRays(ctx, t);

    // 3. DRIFTING CLOUDS
    this.drawClouds(ctx, t);

    // 4. DISTANT PURPLE/MINT PREHISTORIC HILLS
    this.drawDistantHills(ctx, t);

    // 5. MIDGROUND TREES & ROLLING GREEN HILLS
    this.drawMidground(ctx, t, beatPulse);

    // 6. MAIN GROUND (Dino's Grassy Meadow)
    this.drawGround(ctx, t);

    // 7. SWAYING OVERSIZED FLOWERS
    this.drawFlowers(ctx, t, beatPulse);

    // 8. VINES & TREE BRANCH (Right side for Monkey in Scene 3, 4, 7)
    this.drawTreeBranch(ctx, t);
  }

  drawSunAndRays(ctx, t) {
    const sunX = 220;
    const sunY = 220;

    // Glowing Sunbeams
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(t * 0.03);

    const rayGrad = ctx.createRadialGradient(0, 0, 80, 0, 0, 950);
    rayGrad.addColorStop(0, "rgba(255, 248, 220, 0.45)");
    rayGrad.addColorStop(0.5, "rgba(255, 235, 175, 0.15)");
    rayGrad.addColorStop(1, "rgba(255, 235, 175, 0.0)");

    ctx.fillStyle = rayGrad;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const angle1 = (i * Math.PI) / 6 - 0.12;
      const angle2 = (i * Math.PI) / 6 + 0.12;
      ctx.lineTo(Math.cos(angle1) * 1100, Math.sin(angle1) * 1100);
      ctx.lineTo(Math.cos(angle2) * 1100, Math.sin(angle2) * 1100);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Sun Core with soft 3D glow
    const sunCoreGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 110);
    sunCoreGrad.addColorStop(0, "#FFFFFF");
    sunCoreGrad.addColorStop(0.3, "#FFF07C");
    sunCoreGrad.addColorStop(0.7, "#FFD000");
    sunCoreGrad.addColorStop(1, "rgba(255, 208, 0, 0)");
    ctx.fillStyle = sunCoreGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClouds(ctx, t) {
    ctx.save();
    this.cloudList.forEach((c, idx) => {
      const currentX = ((c.x + t * c.speed) % 1360) - 200;
      ctx.save();
      ctx.translate(currentX, c.y);
      ctx.scale(c.scale, c.scale);

      // Cloud shadow
      ctx.fillStyle = "rgba(165, 215, 232, 0.35)";
      this.drawCloudPuffs(ctx, 0, 10);

      // Main cloud body
      const cloudGrad = ctx.createLinearGradient(0, -60, 0, 60);
      cloudGrad.addColorStop(0, "#FFFFFF");
      cloudGrad.addColorStop(0.7, "#F0F8FF");
      cloudGrad.addColorStop(1, "#E1F0FA");
      ctx.fillStyle = cloudGrad;
      this.drawCloudPuffs(ctx, 0, 0);

      ctx.restore();
    });
    ctx.restore();
  }

  drawCloudPuffs(ctx, ox, oy) {
    ctx.beginPath();
    ctx.arc(ox - 70, oy + 20, 50, 0, Math.PI * 2);
    ctx.arc(ox - 20, oy - 20, 65, 0, Math.PI * 2);
    ctx.arc(ox + 45, oy - 10, 55, 0, Math.PI * 2);
    ctx.arc(ox + 85, oy + 25, 45, 0, Math.PI * 2);
    ctx.rect(ox - 70, oy + 20, 155, 50);
    ctx.fill();
  }

  drawDistantHills(ctx, t) {
    ctx.save();
    // Far layer - gentle pastel lavender hills
    const farGrad = ctx.createLinearGradient(0, 700, 0, 1200);
    farGrad.addColorStop(0, "#9BD7D5");
    farGrad.addColorStop(0.5, "#B8E1DD");
    farGrad.addColorStop(1, "#A0C4E2");
    ctx.fillStyle = farGrad;

    ctx.beginPath();
    ctx.moveTo(0, 920);
    ctx.bezierCurveTo(240, 800, 420, 860, 600, 810);
    ctx.bezierCurveTo(780, 760, 940, 830, 1080, 790);
    ctx.lineTo(1080, 1400);
    ctx.lineTo(0, 1400);
    ctx.closePath();
    ctx.fill();

    // Mid distant hill
    const midGrad = ctx.createLinearGradient(0, 850, 0, 1300);
    midGrad.addColorStop(0, "#7ED994");
    midGrad.addColorStop(1, "#52B788");
    ctx.fillStyle = midGrad;

    ctx.beginPath();
    ctx.moveTo(0, 1020);
    ctx.bezierCurveTo(200, 930, 360, 980, 550, 940);
    ctx.bezierCurveTo(760, 900, 900, 990, 1080, 920);
    ctx.lineTo(1080, 1500);
    ctx.lineTo(0, 1500);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawMidground(ctx, t, beatPulse) {
    // Rounded prehistoric trees on the ridge
    this.drawRoundedTree(ctx, 160, 920, 1.15, beatPulse, "#38B000", "#70E000");
    this.drawRoundedTree(ctx, 340, 960, 0.9, -beatPulse, "#2D6A4F", "#52B788");
    this.drawRoundedTree(ctx, 760, 950, 0.95, beatPulse, "#1E6091", "#52B788");
    this.drawRoundedTree(ctx, 920, 900, 1.25, -beatPulse, "#38B000", "#9EF01A");
  }

  drawRoundedTree(ctx, x, y, scale, pulse, darkGreen, brightGreen) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * (1 + pulse * 0.5), scale * (1 - pulse * 0.5));

    // Trunk
    const trunkGrad = ctx.createLinearGradient(-18, 0, 18, 0);
    trunkGrad.addColorStop(0, "#5E3023");
    trunkGrad.addColorStop(0.4, "#895737");
    trunkGrad.addColorStop(1, "#43281C");
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(-18, 140);
    ctx.quadraticCurveTo(-14, 40, -10, 0);
    ctx.lineTo(10, 0);
    ctx.quadraticCurveTo(14, 40, 18, 140);
    ctx.closePath();
    ctx.fill();

    // Big 3D-shaded rounded foliage cloud
    const foliageGrad = ctx.createRadialGradient(-30, -80, 15, 0, -60, 130);
    foliageGrad.addColorStop(0, "#C7F9CC");
    foliageGrad.addColorStop(0.3, brightGreen);
    foliageGrad.addColorStop(0.85, darkGreen);
    foliageGrad.addColorStop(1, "#1B4332");
    ctx.fillStyle = foliageGrad;

    ctx.beginPath();
    ctx.arc(0, -60, 80, 0, Math.PI * 2);
    ctx.arc(-55, -45, 60, 0, Math.PI * 2);
    ctx.arc(55, -45, 60, 0, Math.PI * 2);
    ctx.arc(-35, -105, 55, 0, Math.PI * 2);
    ctx.arc(35, -105, 55, 0, Math.PI * 2);
    ctx.fill();

    // Cute glossy highlight dots
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(-30, -100, 14, 0, Math.PI * 2);
    ctx.arc(20, -110, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawGround(ctx, t) {
    ctx.save();

    // Grassy Main Mound with vibrant lush gradient
    const groundGrad = ctx.createLinearGradient(0, 1150, 0, 1920);
    groundGrad.addColorStop(0.0, "#70E000"); // Sunlit lime grass
    groundGrad.addColorStop(0.2, "#38B000"); // Rich green
    groundGrad.addColorStop(0.5, "#007200"); // Deep tropical green
    groundGrad.addColorStop(1.0, "#004B23"); // Earthy bottom
    ctx.fillStyle = groundGrad;

    ctx.beginPath();
    ctx.moveTo(0, 1260);
    ctx.bezierCurveTo(280, 1210, 780, 1210, 1080, 1270);
    ctx.lineTo(1080, 1920);
    ctx.lineTo(0, 1920);
    ctx.closePath();
    ctx.fill();

    // Subtle grassy highlights on top edge
    ctx.strokeStyle = "#CCFF33";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 1260);
    ctx.bezierCurveTo(280, 1210, 780, 1210, 1080, 1270);
    ctx.stroke();

    // Little tufts of grass across the lawn
    this.drawGrassTufts(ctx);

    ctx.restore();
  }

  drawGrassTufts(ctx) {
    const tufts = [
      { x: 190, y: 1360 },
      { x: 380, y: 1420 },
      { x: 720, y: 1400 },
      { x: 890, y: 1370 },
      { x: 520, y: 1480 }
    ];

    ctx.fillStyle = "#A7F432";
    tufts.forEach((tuft) => {
      ctx.save();
      ctx.translate(tuft.x, tuft.y);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, 0);
        ctx.quadraticCurveTo(i * 18, -25, i * 26, -30);
        ctx.quadraticCurveTo(i * 14, -15, i * 4, 0);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  drawFlowers(ctx, t, beatPulse) {
    this.flowers.forEach((f) => {
      ctx.save();
      ctx.translate(f.x, f.y);

      // Sinusoidal stem sway + beat rhythm
      const swayAngle = Math.sin(t * f.swaySpeed + f.swayPhase) * 0.12 + beatPulse * 0.5;

      // Stem (green thick organic curve)
      ctx.strokeStyle = "#40916C";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const ctrlX = Math.sin(swayAngle) * (f.height * 0.6);
      const topX = Math.sin(swayAngle) * f.height;
      const topY = -f.height;
      ctx.quadraticCurveTo(ctrlX, -f.height * 0.5, topX, topY);
      ctx.stroke();

      // Flower Leaf on stem
      ctx.save();
      ctx.translate(ctrlX, -f.height * 0.45);
      ctx.rotate(swayAngle * 0.8 + (f.x < 540 ? -0.5 : 0.5));
      ctx.fillStyle = "#52B788";
      ctx.beginPath();
      ctx.ellipse(f.x < 540 ? -35 : 35, 0, 40, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Flower Blossom at top
      ctx.save();
      ctx.translate(topX, topY);
      ctx.rotate(swayAngle);

      // Petals
      const petalDist = 38;
      const petalRadius = 26;
      for (let i = 0; i < f.petals; i++) {
        const angle = (i * Math.PI * 2) / f.petals;
        const px = Math.cos(angle) * petalDist;
        const py = Math.sin(angle) * petalDist;

        const petalGrad = ctx.createRadialGradient(px * 0.5, py * 0.5, 5, px, py, petalRadius * 1.3);
        petalGrad.addColorStop(0, "#FFFFFF");
        petalGrad.addColorStop(0.4, f.color);
        petalGrad.addColorStop(1, "#B5179E");
        ctx.fillStyle = petalGrad;

        ctx.beginPath();
        ctx.arc(px, py, petalRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flower Center (Bright yellow/gold with specular shine)
      const centerGrad = ctx.createRadialGradient(-8, -8, 6, 0, 0, 32);
      centerGrad.addColorStop(0, "#FFFFFF");
      centerGrad.addColorStop(0.4, f.centerColor);
      centerGrad.addColorStop(1, "#E76F51");
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      // Cute smiley face on oversized flowers
      ctx.fillStyle = "#4A2800";
      ctx.beginPath();
      ctx.arc(-10, -5, 4, 0, Math.PI * 2);
      ctx.arc(10, -5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#4A2800";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 4, 8, 0, Math.PI);
      ctx.stroke();

      // Rosy cheeks
      ctx.fillStyle = "rgba(255, 99, 132, 0.4)";
      ctx.beginPath();
      ctx.arc(-16, 2, 6, 0, Math.PI * 2);
      ctx.arc(16, 2, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();
    });
  }

  drawTreeBranch(ctx, t) {
    // Upper-right tree branch & hanging vine for Monkey
    ctx.save();
    ctx.translate(1080, 360);

    // Thick prehistoric branch reaching in from top right
    const branchGrad = ctx.createLinearGradient(0, 0, -420, 80);
    branchGrad.addColorStop(0, "#43281C");
    branchGrad.addColorStop(0.5, "#6F4E37");
    branchGrad.addColorStop(1, "#361D15");
    ctx.fillStyle = branchGrad;

    ctx.beginPath();
    ctx.moveTo(20, -60);
    ctx.bezierCurveTo(-200, -20, -320, 20, -440, 100);
    ctx.bezierCurveTo(-380, 140, -180, 60, 20, 40);
    ctx.closePath();
    ctx.fill();

    // Jungle Foliage along branch
    const foliageGrad = ctx.createRadialGradient(-360, 60, 20, -360, 60, 130);
    foliageGrad.addColorStop(0, "#9EF01A");
    foliageGrad.addColorStop(0.7, "#38B000");
    foliageGrad.addColorStop(1, "#1B4332");
    ctx.fillStyle = foliageGrad;

    ctx.beginPath();
    ctx.arc(-340, 40, 75, 0, Math.PI * 2);
    ctx.arc(-240, -10, 65, 0, Math.PI * 2);
    ctx.arc(-420, 80, 60, 0, Math.PI * 2);
    ctx.fill();

    // Vine hanging down from branch (around x = -300)
    const vineSway = Math.sin(t * 2.2) * 25;
    ctx.strokeStyle = "#52B788";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-310, 70);
    ctx.bezierCurveTo(-300 + vineSway * 0.5, 240, -310 + vineSway, 420, -310 + vineSway * 1.2, 580);
    ctx.stroke();

    // Little leaves on the vine
    ctx.fillStyle = "#70E000";
    ctx.beginPath();
    ctx.ellipse(-300 + vineSway * 0.3, 200, 16, 7, 0.4, 0, Math.PI * 2);
    ctx.ellipse(-315 + vineSway * 0.7, 360, 18, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawForeground(ctx) {
    // Lush tropical foreground leaves framing bottom corners for depth
    ctx.save();

    // Bottom-Left large leaf
    ctx.fillStyle = "#1B4332";
    ctx.beginPath();
    ctx.moveTo(-40, 1940);
    ctx.bezierCurveTo(80, 1780, 160, 1720, 240, 1750);
    ctx.bezierCurveTo(170, 1840, 80, 1920, -40, 1940);
    ctx.fill();

    ctx.fillStyle = "#2D6A4F";
    ctx.beginPath();
    ctx.moveTo(-60, 1950);
    ctx.bezierCurveTo(60, 1850, 140, 1800, 200, 1840);
    ctx.bezierCurveTo(130, 1900, 50, 1940, -60, 1950);
    ctx.fill();

    // Bottom-Right large leaf
    ctx.fillStyle = "#1B4332";
    ctx.beginPath();
    ctx.moveTo(1120, 1940);
    ctx.bezierCurveTo(1000, 1780, 920, 1720, 840, 1750);
    ctx.bezierCurveTo(910, 1840, 1000, 1920, 1120, 1940);
    ctx.fill();

    ctx.fillStyle = "#2D6A4F";
    ctx.beginPath();
    ctx.moveTo(1140, 1950);
    ctx.bezierCurveTo(1020, 1850, 940, 1800, 880, 1840);
    ctx.bezierCurveTo(950, 1900, 1030, 1940, 1140, 1950);
    ctx.fill();

    ctx.restore();
  }
}
