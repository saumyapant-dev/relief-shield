/**
 * Supporting Characters Rig: Bunny, Monkey, and Birdie
 * All characters feature 3D-shaded rounded shapes, expressive faces, and dynamic motion.
 */

export class FriendsRigs {
  constructor() {
    this.speechBubbleAlpha = 0;
  }

  draw(ctx, timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;
    const p = timeline.getSceneProgress(t);

    // Friends arrive in Scene 3 (t >= 13.0s) and stay active until Scene 8
    if (t < 12.0) {
      return; // Not on screen yet
    }

    // 1. Draw Bunny on the Left
    this.drawBunny(ctx, t, sceneId, p);

    // 2. Draw Monkey on the Right
    this.drawMonkey(ctx, t, sceneId, p);

    // 3. Draw Birdie (flies in and perches on Dino's head)
    this.drawBirdie(ctx, t, sceneId, p);

    // 4. Draw Speech Bubble for Bunny in Scene 3 ("Don't give up, Dino!")
    if (sceneId === 3 && p >= 0.5) {
      this.drawSpeechBubble(ctx, 330, 1080, "Don't give up, Dino!", (p - 0.5) / 0.5);
    }
  }

  drawBunny(ctx, t, sceneId, p) {
    let bx = 320;
    let by = 1310;
    let hopY = 0;
    let earWiggle = Math.sin(t * 8) * 0.15;
    let clapArms = 0;
    let bunnyAlpha = 1.0;

    if (sceneId === 3) {
      // Hopping in from offscreen left (-100 to 320)
      const enterP = Math.min(1, p * 2.0);
      bx = -100 + 420 * enterP;
      hopY = -Math.abs(Math.sin(enterP * Math.PI * 5)) * 45;
    } else if (sceneId === 4) {
      // Clapping rhythmically
      hopY = -Math.abs(Math.sin(t * Math.PI * 3.5)) * 20;
      clapArms = Math.sin(t * Math.PI * 7) > 0 ? 0.8 : 0.2;
    } else if (sceneId === 5) {
      // Sneeze giggle
      hopY = -Math.abs(Math.sin(t * 8)) * 15;
    } else if (sceneId === 6) {
      // Big Roar excitement jumping!
      hopY = -Math.abs(Math.sin(t * 12)) * 50;
      earWiggle = Math.sin(t * 18) * 0.3;
    } else if (sceneId === 7) {
      // Dance party bouncing
      hopY = -Math.abs(Math.sin(t * Math.PI * 3.8)) * 35;
    } else if (sceneId === 8) {
      // Stepping back into soft focus
      bunnyAlpha = Math.max(0, 1 - p * 1.5);
      bx = 320 - p * 80;
    }

    if (bunnyAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = bunnyAlpha;
    ctx.translate(bx, by + hopY);

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 10 - hopY * 0.2, 50, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy White Tail
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-42, -35, 16, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(-10, -50, 10, 0, -45, 60);
    bodyGrad.addColorStop(0, "#FFFFFF");
    bodyGrad.addColorStop(0.7, "#F0F4F8");
    bodyGrad.addColorStop(1, "#D7E0EA");
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, -45, 46, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Paws / Feet
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(-26, -5, 20, 12, -0.2, 0, Math.PI * 2);
    ctx.ellipse(26, -5, 20, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Bunny Head
    ctx.save();
    ctx.translate(0, -115);

    // Ears
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(side * 20, -30);
      ctx.rotate(side * 0.15 + earWiggle * side);

      // Outer Ear
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(0, -42, 14, 46, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Ear (Soft Pink)
      const innerEarGrad = ctx.createLinearGradient(0, -80, 0, 0);
      innerEarGrad.addColorStop(0, "#FFAAA6");
      innerEarGrad.addColorStop(1, "#FF758F");
      ctx.fillStyle = innerEarGrad;
      ctx.beginPath();
      ctx.ellipse(0, -42, 8, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Head Ball
    const headGrad = ctx.createRadialGradient(-12, -12, 10, 0, 0, 52);
    headGrad.addColorStop(0, "#FFFFFF");
    headGrad.addColorStop(0.7, "#F3F7FA");
    headGrad.addColorStop(1, "#DCE3EB");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Cheeks
    ctx.fillStyle = "rgba(255, 117, 143, 0.55)";
    ctx.beginPath();
    ctx.arc(-26, 12, 12, 0, Math.PI * 2);
    ctx.arc(26, 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cute Black Beaded Eyes
    ctx.fillStyle = "#222222";
    ctx.beginPath();
    ctx.arc(-16, -4, 7, 0, Math.PI * 2);
    ctx.arc(16, -4, 7, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-18, -6, 2.5, 0, Math.PI * 2);
    ctx.arc(14, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Pink Triangle Nose
    ctx.fillStyle = "#FF758F";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-6, 2);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();

    // Cute mouth
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-5, 12, 5, 0.2, Math.PI - 0.2);
    ctx.arc(5, 12, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore(); // end head

    // Bunny Arms / Clapping
    ctx.save();
    ctx.translate(0, -60);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(-26 + clapArms * 16, 0, 11, 20, 0.4 + clapArms, 0, Math.PI * 2);
    ctx.ellipse(26 - clapArms * 16, 0, 11, 20, -0.4 - clapArms, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawMonkey(ctx, t, sceneId, p) {
    let mx = 760;
    let my = 1290;
    let swingAngle = 0;
    let tailCurl = Math.sin(t * 4) * 0.4;
    let monkeyAlpha = 1.0;

    if (sceneId === 3) {
      // Swings down from tree branch on right
      const swingP = Math.min(1, p * 1.8);
      mx = 980 - 220 * swingP;
      my = 680 + 610 * swingP;
      swingAngle = Math.sin(swingP * Math.PI * 3) * 0.4 * (1 - swingP);
    } else if (sceneId === 4) {
      // Clapping and grooving
      swingAngle = Math.sin(t * Math.PI * 3.5) * 0.12;
    } else if (sceneId === 6) {
      // Cheering arms high
      swingAngle = Math.sin(t * 8) * 0.15;
    } else if (sceneId === 7) {
      // Monkey spin / dance!
      swingAngle = Math.sin(t * 10) * 0.25;
      mx = 760 + Math.sin(t * 5) * 40;
    } else if (sceneId === 8) {
      // Stepping back into soft focus
      monkeyAlpha = Math.max(0, 1 - p * 1.5);
      mx = 760 + p * 80;
    }

    if (monkeyAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = monkeyAlpha;
    ctx.translate(mx, my);
    ctx.rotate(swingAngle);

    // Ground Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curly Tail
    ctx.strokeStyle = "#6F4E37";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(35, -40);
    ctx.bezierCurveTo(70, -50 + tailCurl * 20, 85, -110, 60, -125);
    ctx.bezierCurveTo(45, -135, 45, -95, 65, -90);
    ctx.stroke();

    // Monkey Body (Warm brown)
    const bodyGrad = ctx.createRadialGradient(-10, -50, 10, 0, -45, 55);
    bodyGrad.addColorStop(0, "#A67C52");
    bodyGrad.addColorStop(0.7, "#6F4E37");
    bodyGrad.addColorStop(1, "#43281C");
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, -45, 42, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cream Belly Patch
    ctx.fillStyle = "#FFE8D6";
    ctx.beginPath();
    ctx.ellipse(0, -40, 24, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = "#6F4E37";
    ctx.beginPath();
    ctx.ellipse(-24, 0, 18, 11, -0.2, 0, Math.PI * 2);
    ctx.ellipse(24, 0, 18, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Monkey Head
    ctx.save();
    ctx.translate(0, -110);

    // Round Outer Ears
    [-1, 1].forEach((side) => {
      ctx.fillStyle = "#6F4E37";
      ctx.beginPath();
      ctx.arc(side * 42, -5, 18, 0, Math.PI * 2);
      ctx.fill();
      // Inner Ear
      ctx.fillStyle = "#FFE8D6";
      ctx.beginPath();
      ctx.arc(side * 42, -5, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Head Base
    ctx.fillStyle = "#6F4E37";
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    // Cream Peach Face Mask (Heart-shaped monkey muzzle)
    ctx.fillStyle = "#FFE8D6";
    ctx.beginPath();
    ctx.arc(-14, -8, 20, 0, Math.PI * 2);
    ctx.arc(14, -8, 20, 0, Math.PI * 2);
    ctx.ellipse(0, 10, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eyes
    ctx.fillStyle = "#331800";
    ctx.beginPath();
    ctx.arc(-14, -8, 6.5, 0, Math.PI * 2);
    ctx.arc(14, -8, 6.5, 0, Math.PI * 2);
    ctx.fill();
    // Catchlight
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-16, -10, 2.5, 0, Math.PI * 2);
    ctx.arc(12, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Little Nose Dots
    ctx.fillStyle = "#5E3023";
    ctx.beginPath();
    ctx.arc(-4, 6, 2, 0, Math.PI * 2);
    ctx.arc(4, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cute Cheerful Smile
    ctx.strokeStyle = "#5E3023";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 10, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore(); // end head

    // Monkey Arms
    const armRaise = sceneId === 6 ? -1.2 : Math.sin(t * 6) * 0.4;
    ctx.save();
    ctx.translate(0, -65);
    ctx.strokeStyle = "#6F4E37";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";

    // Left Arm
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-55, -25 + armRaise * 30);
    ctx.stroke();

    // Right Arm
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(55, -25 - armRaise * 30);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  drawBirdie(ctx, t, sceneId, p) {
    let bx = 540;
    let by = 990; // Exactly on Dino's head!
    let flapAngle = Math.sin(t * 18) * 0.7;
    let birdieAlpha = 1.0;

    if (sceneId === 3) {
      // Birdie flies in from upper left sky and lands on Dino's head
      const flyP = Math.min(1, p * 1.5);
      bx = 100 + 440 * flyP;
      by = 400 + 590 * flyP + Math.sin(flyP * Math.PI * 4) * 35;
      if (flyP >= 1.0) flapAngle = 0.1; // fold wings after landing
    } else if (sceneId === 7) {
      // Hovers happily above Dino fluttering wings
      bx = 540 + Math.sin(t * 4) * 50;
      by = 940 + Math.sin(t * 8) * 20;
    } else if (sceneId === 8) {
      birdieAlpha = Math.max(0, 1 - p * 1.5);
      by = 990 - p * 120;
      bx = 540 + p * 140;
    }

    if (birdieAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = birdieAlpha;
    ctx.translate(bx, by);

    // Little Orange Feet
    ctx.strokeStyle = "#FF9F1C";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(-7, 26);
    ctx.moveTo(7, 18);
    ctx.lineTo(7, 26);
    ctx.stroke();

    // Yellow Body (Bright sunny canary yellow)
    const birdGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, 28);
    birdGrad.addColorStop(0, "#FFF3B0");
    birdGrad.addColorStop(0.5, "#FFD166");
    birdGrad.addColorStop(1, "#F4A261");
    ctx.fillStyle = birdGrad;

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Head Feather Crest
    ctx.fillStyle = "#FFD166";
    ctx.beginPath();
    ctx.arc(2, -26, 6, 0, Math.PI * 2);
    ctx.arc(8, -23, 5, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.save();
    ctx.translate(-10, 2);
    ctx.rotate(flapAngle);
    ctx.fillStyle = "#FFB703";
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Shiny Eye
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(8, -5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(6.5, -6.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = "#E76F51";
    ctx.beginPath();
    ctx.moveTo(22, -8);
    ctx.lineTo(34, -2);
    ctx.lineTo(22, 4);
    ctx.closePath();
    ctx.fill();

    // Rosy Birdie Cheek
    ctx.fillStyle = "rgba(255, 112, 166, 0.6)";
    ctx.beginPath();
    ctx.arc(4, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSpeechBubble(ctx, x, y, text, progress) {
    ctx.save();
    const scale = Math.min(1.0, progress * 1.5);
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Bubble Body
    const w = 310;
    const h = 76;
    const r = 24;

    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;

    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    // Bubble arrow pointing to Bunny
    ctx.lineTo(20, h / 2);
    ctx.lineTo(0, h / 2 + 22);
    ctx.lineTo(-15, h / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#4CC9F0";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Text
    ctx.font = "bold 26px 'Fredoka', 'Nunito', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#2B2D42";
    ctx.fillText(text, 0, -2);

    ctx.restore();
  }
}
