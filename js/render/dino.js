/**
 * Rigged Dino Character Model & Animator
 * Main character: Mint-green baby dinosaur, cream belly, brown shiny eyes,
 * 3 rounded dorsal spikes, chubby cheeks, tiny arms, stubby legs.
 * Consistent appearance across all scenes with rich procedural facial expressions & body deformation.
 */

export class DinoCharacter {
  constructor() {
    this.baseX = 540;
    this.baseY = 1260; // Foot placement ground line
    this.blinkTimer = 0;
    this.isBlinking = false;
  }

  draw(ctx, timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;
    const p = timeline.getSceneProgress(t);

    // Natural blinking logic
    if (Math.sin(t * 1.8) > 0.96) {
      this.isBlinking = true;
    } else {
      this.isBlinking = false;
    }

    // Evaluate pose and expression parameters based on timeline
    const pose = this.getDinoPose(t, sceneId, p);

    ctx.save();
    // Dino Root Transform
    ctx.translate(this.baseX + pose.rootOffsetX, this.baseY + pose.rootOffsetY);
    ctx.scale(pose.squashX, pose.squashY);

    // Ground Shadow
    this.drawShadow(ctx, pose);

    // Tail (behind body)
    this.drawTail(ctx, pose, t);

    // 3 Rounded Dorsal Spikes (back edge)
    this.drawSpikes(ctx, pose);

    // Feet / Short Legs
    this.drawFeet(ctx, pose);

    // Main Torso / Body (Mint-green with 3D gradient)
    this.drawBody(ctx, pose);

    // Cream-colored Belly
    this.drawBelly(ctx, pose);

    // Head
    this.drawHead(ctx, pose, t);

    // Tiny Rounded Arms
    this.drawArms(ctx, pose, t);

    ctx.restore();
  }

  getDinoPose(t, sceneId, p) {
    // Default neutral cheerful pose
    let pose = {
      rootOffsetX: 0,
      rootOffsetY: 0,
      squashX: 1.0,
      squashY: 1.0,
      headTilt: 0,
      headOffsetY: 0,
      mouthState: "smile", // smile, openInhale, squeak, sad, sneezeWiggle, bigRoar, giggle
      mouthOpen: 0.1,
      eyeState: "open", // open, closed, surprised, squint, happy
      eyeScale: 1.0,
      cheekPuff: 1.0,
      armLeftAngle: 0.2,
      armRightAngle: -0.2,
      armLeftY: 0,
      armRightY: 0,
      footLeftY: 0,
      footRightY: 0,
      tailWag: Math.sin(t * 3.5) * 0.15,
      blushAlpha: 0.65
    };

    switch (sceneId) {
      case 1:
        // THE HOOK (0.0 - 6.0)
        // 0-2.5s: Inhale, close eyes, swell
        if (p < 0.42) {
          const breathP = p / 0.42;
          pose.squashY = 1.0 + 0.12 * breathP;
          pose.squashX = 1.0 - 0.06 * breathP;
          pose.rootOffsetY = -10 * breathP;
          pose.cheekPuff = 1.0 + 0.35 * breathP;
          pose.eyeState = "closed";
          pose.mouthState = "openInhale";
          pose.mouthOpen = 0.3 * breathP;
          pose.armLeftAngle = 0.5 * breathP;
          pose.armRightAngle = -0.5 * breathP;
        } else if (p < 0.65) {
          // 2.5-3.9s: SQUEAK!
          pose.squashY = 0.94;
          pose.squashX = 1.06;
          pose.cheekPuff = 0.85;
          pose.eyeState = "surprised";
          pose.mouthState = "squeak";
          pose.mouthOpen = 0.4;
          pose.armLeftAngle = 0.7;
          pose.armRightAngle = -0.7;
        } else {
          // 3.9-6.0s: Eyes wide in surprise, hands to cheeks
          const surpriseP = (p - 0.65) / 0.35;
          pose.eyeState = "surprised";
          pose.eyeScale = 1.25;
          pose.mouthState = "squeak";
          pose.mouthOpen = 0.15;
          pose.armLeftAngle = 1.2;
          pose.armRightAngle = -1.2;
          pose.armLeftY = -25;
          pose.armRightY = -25;
          pose.headTilt = Math.sin(t * 5) * 0.05;
        }
        break;

      case 2:
        // DINO TRIES AGAIN (6.0 - 13.0)
        if (p < 0.3) {
          // Determined stance, plants feet
          pose.eyeState = "determined";
          pose.mouthState = "smile";
          pose.armLeftAngle = 0.4;
          pose.armRightAngle = -0.4;
          pose.footLeftY = -5;
          pose.footRightY = 0;
        } else if (p < 0.7) {
          // Puffs cheeks HUGE, attempts roar
          const puffP = (p - 0.3) / 0.4;
          pose.cheekPuff = 1.0 + 0.75 * Math.sin(puffP * Math.PI);
          pose.squashX = 1.0 + 0.15 * Math.sin(puffP * Math.PI);
          pose.squashY = 1.0 - 0.08 * Math.sin(puffP * Math.PI);
          pose.eyeState = "closed";
          pose.mouthState = "openInhale";
          pose.mouthOpen = 0.5 * Math.sin(puffP * Math.PI);
          pose.armLeftAngle = 1.3 * Math.sin(puffP * Math.PI);
          pose.armRightAngle = -1.3 * Math.sin(puffP * Math.PI);
        } else {
          // Squeak and comically deflates!
          const defP = (p - 0.7) / 0.3;
          pose.squashY = 0.86 + 0.06 * Math.sin(defP * Math.PI * 4);
          pose.squashX = 1.12;
          pose.rootOffsetY = 15;
          pose.headTilt = 0.1;
          pose.eyeState = "sad";
          pose.mouthState = "sad";
          pose.cheekPuff = 0.75;
          pose.armLeftAngle = -0.3;
          pose.armRightAngle = 0.3;
          pose.blushAlpha = 0.25;
        }
        break;

      case 3:
        // FRIENDS ARRIVE (13.0 - 20.0)
        // Sad Dino cheers up as friends arrive, Birdie lands on head
        if (p < 0.4) {
          pose.eyeState = "sad";
          pose.mouthState = "sad";
          pose.headTilt = 0.08;
          pose.armLeftAngle = -0.2;
          pose.armRightAngle = 0.2;
        } else {
          const cheerP = (p - 0.4) / 0.6;
          pose.eyeState = "happy";
          pose.mouthState = "smile";
          pose.mouthOpen = 0.25 * cheerP;
          pose.headTilt = -0.05 * Math.sin(t * 3);
          pose.armLeftAngle = 0.4 * cheerP;
          pose.armRightAngle = -0.4 * cheerP;
          pose.squashY = 1.0 + 0.05 * Math.sin(t * 5);
        }
        break;

      case 4:
        // MUSICAL PRACTICE (20.0 - 29.0)
        // Clapping hands and bouncing on the beat
        const clapCycle = (t * 3.5) % 1.0;
        const isClap = clapCycle < 0.35;
        pose.squashY = 1.0 + Math.sin(t * Math.PI * 3.5) * 0.08;
        pose.squashX = 1.0 - Math.sin(t * Math.PI * 3.5) * 0.04;
        pose.rootOffsetY = -Math.abs(Math.sin(t * Math.PI * 3.5)) * 18;
        pose.eyeState = "happy";
        pose.mouthState = "smile";
        pose.mouthOpen = 0.2 + 0.15 * Math.sin(t * 3.5);
        pose.armLeftAngle = isClap ? 0.9 : 0.3;
        pose.armRightAngle = isClap ? -0.9 : -0.3;
        pose.armLeftY = isClap ? -20 : 0;
        pose.armRightY = isClap ? -20 : 0;
        break;

      case 5:
        // THE FUNNY SNEEZE (29.0 - 37.0)
        if (p < 0.6) {
          // Giant breath, nose wiggles comically (29-33.8s)
          const inhP = p / 0.6;
          pose.squashY = 1.0 + 0.22 * inhP;
          pose.squashX = 1.0 - 0.1 * inhP;
          pose.rootOffsetY = -20 * inhP;
          pose.cheekPuff = 1.0 + 0.5 * inhP;
          pose.eyeState = "squint";
          pose.mouthState = "sneezeWiggle";
          pose.headTilt = Math.sin(t * 18) * 0.08 * inhP;
          pose.armLeftAngle = 0.8 * inhP;
          pose.armRightAngle = -0.8 * inhP;
        } else if (p < 0.75) {
          // ACHOO! Explosive sneeze forward
          const sneezeRecoil = (p - 0.6) / 0.15;
          pose.squashY = 0.72 + 0.2 * sneezeRecoil;
          pose.squashX = 1.25 - 0.15 * sneezeRecoil;
          pose.rootOffsetY = 30 * (1 - sneezeRecoil);
          pose.headTilt = 0.35 * (1 - sneezeRecoil);
          pose.eyeState = "closed";
          pose.mouthState = "bigRoar"; // wide open sneeze mouth
          pose.mouthOpen = 0.9;
          pose.armLeftAngle = 1.4;
          pose.armRightAngle = -1.4;
        } else {
          // Giggles bashfully, rubs nose
          pose.squashY = 1.0 + Math.sin(t * 7) * 0.05;
          pose.eyeState = "happy";
          pose.mouthState = "giggle";
          pose.mouthOpen = 0.3;
          pose.armRightAngle = -1.1; // arm rubbing nose
          pose.armRightY = -35;
          pose.armLeftAngle = 0.3;
        }
        break;

      case 6:
        // THE BIG ROAR (37.0 - 46.0)
        if (p < 0.35) {
          // Final deep breath, stand tall, heroic stance
          const heroP = p / 0.35;
          pose.squashY = 1.0 + 0.15 * heroP;
          pose.rootOffsetY = -15 * heroP;
          pose.eyeState = "open";
          pose.eyeScale = 1.1;
          pose.mouthState = "openInhale";
          pose.mouthOpen = 0.35 * heroP;
          pose.armLeftAngle = 0.6 * heroP;
          pose.armRightAngle = -0.6 * heroP;
        } else {
          // THE MIGHTY ADORABLE ROAR! (40.0 - 46.0s)
          pose.squashY = 1.1 + Math.sin(t * 22) * 0.04; // throat vibration
          pose.squashX = 0.96;
          pose.rootOffsetY = -25;
          pose.headTilt = -0.15; // head tilted back heroically
          pose.headOffsetY = -15;
          pose.eyeState = "closedJoy";
          pose.mouthState = "bigRoar";
          pose.mouthOpen = 1.0;
          pose.armLeftAngle = 1.5;
          pose.armRightAngle = -1.5;
          pose.armLeftY = -30;
          pose.armRightY = -30;
          pose.tailWag = Math.sin(t * 8) * 0.35;
        }
        break;

      case 7:
        // JUNGLE DANCE PARTY (46.0 - 55.0)
        // Silly side-to-side stomp dance
        const danceStep = Math.sin(t * Math.PI * 3.8);
        pose.rootOffsetX = danceStep * 40;
        pose.rootOffsetY = -Math.abs(Math.sin(t * Math.PI * 3.8)) * 30;
        pose.squashY = 1.0 + Math.sin(t * Math.PI * 7.6) * 0.08;
        pose.headTilt = danceStep * 0.15;
        pose.eyeState = "happy";
        pose.mouthState = "smile";
        pose.mouthOpen = 0.35;
        pose.armLeftAngle = Math.sin(t * 6) * 0.9;
        pose.armRightAngle = -Math.sin(t * 6) * 0.9;
        pose.footLeftY = danceStep > 0 ? -22 : 0;
        pose.footRightY = danceStep < 0 ? -22 : 0;
        pose.tailWag = -danceStep * 0.4;
        break;

      case 8:
        // LOOP ENDING (55.0 - 60.0)
        if (p < 0.6) {
          // Waves goodbye to camera with right arm
          pose.eyeState = "happy";
          pose.mouthState = "smile";
          pose.mouthOpen = 0.25;
          pose.armLeftAngle = 0.2;
          pose.armRightAngle = -1.2 + Math.sin(t * 9) * 0.35; // Waving hand
          pose.armRightY = -30;
          pose.headTilt = 0.06 * Math.sin(t * 3);
        } else {
          // Transitions seamlessly back to 00:00: deep breath, closes eyes, prepares to roar!
          const loopTransP = (p - 0.6) / 0.4;
          pose.squashY = 1.0 + 0.1 * loopTransP;
          pose.squashX = 1.0 - 0.05 * loopTransP;
          pose.rootOffsetY = -8 * loopTransP;
          pose.cheekPuff = 1.0 + 0.3 * loopTransP;
          pose.eyeState = "closed";
          pose.mouthState = "openInhale";
          pose.mouthOpen = 0.25 * loopTransP;
          pose.armLeftAngle = 0.4 * loopTransP;
          pose.armRightAngle = -0.4 * loopTransP;
          pose.armRightY = 0;
        }
        break;
    }

    if (this.isBlinking && pose.eyeState === "open") {
      pose.eyeState = "closed";
    }

    return pose;
  }

  drawShadow(ctx, pose) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 20, 160 * pose.squashX, 40 * (1 / pose.squashY), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawTail(ctx, pose, t) {
    ctx.save();
    ctx.translate(-70, -40);
    ctx.rotate(-0.2 + pose.tailWag);

    const tailGrad = ctx.createLinearGradient(-120, -30, 0, 0);
    tailGrad.addColorStop(0, "#9BF6B4");
    tailGrad.addColorStop(0.5, "#6ED68F");
    tailGrad.addColorStop(1, "#40916C");
    ctx.fillStyle = tailGrad;

    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(-60, -25, -120, 10, -150, 45);
    ctx.bezierCurveTo(-140, 75, -80, 50, 0, 30);
    ctx.closePath();
    ctx.fill();

    // Little round spike at tail tip
    ctx.fillStyle = "#FF7B90";
    ctx.beginPath();
    ctx.arc(-145, 45, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSpikes(ctx, pose) {
    // 3 Rounded Dorsal Spikes along back curve
    const spikes = [
      { x: -75, y: -220, r: 24, rot: -0.4 },
      { x: -95, y: -150, r: 28, rot: -0.25 },
      { x: -90, y: -80, r: 24, rot: -0.1 }
    ];

    spikes.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);

      const spikeGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, s.r);
      spikeGrad.addColorStop(0, "#FFAAA6");
      spikeGrad.addColorStop(0.5, "#FF7B90");
      spikeGrad.addColorStop(1, "#E63946");
      ctx.fillStyle = spikeGrad;

      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, Math.PI * 2);
      ctx.fill();

      // Soft highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(-s.r * 0.35, -s.r * 0.35, s.r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  drawFeet(ctx, pose) {
    // Left & Right Foot
    const feet = [
      { x: -55, y: pose.footLeftY, rot: 0.1 },
      { x: 55, y: pose.footRightY, rot: -0.1 }
    ];

    feet.forEach((f) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);

      const footGrad = ctx.createRadialGradient(-10, -10, 6, 0, 0, 48);
      footGrad.addColorStop(0, "#9BF6B4");
      footGrad.addColorStop(0.6, "#6ED68F");
      footGrad.addColorStop(1, "#40916C");
      ctx.fillStyle = footGrad;

      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3 Cute Rounded White Claws/Toes
      ctx.fillStyle = "#FFF8DC";
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * 24, 18, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  drawBody(ctx, pose) {
    ctx.save();
    // 3D volumetric sphere/pear body with rich highlights
    const bodyGrad = ctx.createRadialGradient(-40, -140, 20, 0, -100, 160);
    bodyGrad.addColorStop(0, "#B7F4C8");
    bodyGrad.addColorStop(0.4, "#6ED68F");
    bodyGrad.addColorStop(0.85, "#48A366");
    bodyGrad.addColorStop(1, "#2D6A4F");
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, -90, 115 * pose.cheekPuff * 0.85, 125, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBelly(ctx, pose) {
    ctx.save();
    // Cream-colored belly patch
    const bellyGrad = ctx.createRadialGradient(0, -90, 10, 0, -85, 95);
    bellyGrad.addColorStop(0, "#FFFFFF");
    bellyGrad.addColorStop(0.4, "#FFF8DC");
    bellyGrad.addColorStop(0.85, "#FEE49A");
    bellyGrad.addColorStop(1, "#E9D8A6");
    ctx.fillStyle = bellyGrad;

    ctx.beginPath();
    ctx.ellipse(5, -80, 72 * pose.cheekPuff * 0.8, 85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly ring lines (cute baby dinosaur belly ridges)
    ctx.strokeStyle = "rgba(224, 180, 100, 0.45)";
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(5, -80 + i * 22, 45, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHead(ctx, pose, t) {
    ctx.save();
    ctx.translate(0, -200 + pose.headOffsetY);
    ctx.rotate(pose.headTilt);

    // Head Base Shape (Large, rounded baby proportion)
    const headGrad = ctx.createRadialGradient(-40, -40, 25, 0, 0, 135);
    headGrad.addColorStop(0, "#B7F4C8");
    headGrad.addColorStop(0.4, "#6ED68F");
    headGrad.addColorStop(0.85, "#48A366");
    headGrad.addColorStop(1, "#2D6A4F");
    ctx.fillStyle = headGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, 115 * pose.cheekPuff, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chubby Cheeks (Rosy blush)
    ctx.fillStyle = `rgba(255, 112, 166, ${pose.blushAlpha})`;
    const cheekDist = 72 * pose.cheekPuff;
    ctx.beginPath();
    ctx.ellipse(-cheekDist, 22, 28 * pose.cheekPuff, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(cheekDist, 22, 28 * pose.cheekPuff, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little Dinosaur Snout/Nose
    this.drawNose(ctx, pose, t);

    // Expressive Eyes
    this.drawEyes(ctx, pose);

    // Articulated Mouth
    this.drawMouth(ctx, pose);

    ctx.restore();
  }

  drawNose(ctx, pose, t) {
    ctx.save();
    // Two cute dark green nostrils
    const wiggle = pose.mouthState === "sneezeWiggle" ? Math.sin(t * 30) * 5 : 0;
    ctx.translate(wiggle, 2);

    ctx.fillStyle = "#387A50";
    ctx.beginPath();
    ctx.ellipse(-14, 0, 5, 8, -0.15, 0, Math.PI * 2);
    ctx.ellipse(14, 0, 5, 8, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawEyes(ctx, pose) {
    const eyeDist = 44;
    const eyeY = -28;

    // Both Left and Right Eye
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(side * eyeDist, eyeY);
      ctx.scale(pose.eyeScale, pose.eyeScale);

      if (pose.eyeState === "closed" || pose.eyeState === "closedJoy") {
        // Happy arch eyes
        ctx.strokeStyle = "#2D6A4F";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, 18, Math.PI + 0.3, -0.3);
        ctx.stroke();

        // Cute eyelashes
        ctx.beginPath();
        ctx.moveTo(side * 14, -8);
        ctx.lineTo(side * 22, -16);
        ctx.stroke();
      } else if (pose.eyeState === "squint") {
        // Tight squint lines
        ctx.strokeStyle = "#2D6A4F";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.stroke();
      } else {
        // Full shiny brown cartoon eye
        // White Sclera
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#40916C";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Large Warm Brown Iris
        const irisGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 19);
        irisGrad.addColorStop(0, "#8D5B4C");
        irisGrad.addColorStop(0.6, "#582F0E");
        irisGrad.addColorStop(1, "#331800");
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(side * 2, 2, 19, 0, Math.PI * 2);
        ctx.fill();

        // Deep Black Pupil
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(side * 2, 2, 11, 0, Math.PI * 2);
        ctx.fill();

        // Specular Catchlights (The secret to adorable Pixar/preschool sparkle!)
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(side * 2 - 5, -5, 6, 0, Math.PI * 2); // Big shiny dot
        ctx.arc(side * 2 + 5, 7, 3, 0, Math.PI * 2);  // Secondary reflection
        ctx.fill();

        // Eyelid or Eyebrows for expressions
        if (pose.eyeState === "surprised") {
          ctx.strokeStyle = "#1B4332";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, -38, 16, Math.PI + 0.4, -0.4);
          ctx.stroke();
        } else if (pose.eyeState === "sad") {
          ctx.strokeStyle = "#1B4332";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-14, -34 + side * 6);
          ctx.lineTo(14, -34 - side * 6);
          ctx.stroke();
        } else {
          // Cheerful friendly brows
          ctx.strokeStyle = "#1B4332";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, -36, 14, Math.PI + 0.6, -0.6);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }

  drawMouth(ctx, pose) {
    ctx.save();
    ctx.translate(0, 36);

    switch (pose.mouthState) {
      case "smile":
        ctx.strokeStyle = "#3A1A00";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -8, 26, 0.3, Math.PI - 0.3);
        ctx.stroke();

        // Open mouth smile showing tongue
        if (pose.mouthOpen > 0.15) {
          ctx.fillStyle = "#9B2226";
          ctx.beginPath();
          ctx.arc(0, -8, 24, 0.3, Math.PI - 0.3);
          ctx.closePath();
          ctx.fill();

          // Cute pink tongue
          ctx.fillStyle = "#FF758F";
          ctx.beginPath();
          ctx.arc(0, 8, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case "openInhale":
        // Inhale oval mouth
        ctx.fillStyle = "#5E1517";
        ctx.strokeStyle = "#3A1A00";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 22 * pose.mouthOpen * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case "squeak":
        // Tiny comical "o" mouth
        ctx.fillStyle = "#6B1D2F";
        ctx.strokeStyle = "#3A1A00";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case "sad":
        // Downward droop mouth
        ctx.strokeStyle = "#3A1A00";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 16, 22, Math.PI + 0.4, -0.4);
        ctx.stroke();
        break;

      case "sneezeWiggle":
        // Wobbly tense line
        ctx.strokeStyle = "#3A1A00";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.bezierCurveTo(-10, -8, 10, 8, 20, 0);
        ctx.stroke();
        break;

      case "bigRoar":
        // HUGE TOOTHY ROAR MOUTH
        const roarH = 65 * pose.mouthOpen;
        const roarW = 55;

        // Dark oral cavity
        ctx.fillStyle = "#640D14";
        ctx.strokeStyle = "#250902";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(0, 5, roarW, roarH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Big pink vibrant tongue
        ctx.fillStyle = "#FF4D6D";
        ctx.beginPath();
        ctx.ellipse(0, 5 + roarH * 0.45, roarW * 0.75, roarH * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 Cute rounded baby dinosaur teeth!
        ctx.fillStyle = "#FFFFFF";
        // Top 2 teeth
        ctx.beginPath();
        ctx.arc(-18, 5 - roarH + 8, 8, 0, Math.PI);
        ctx.arc(18, 5 - roarH + 8, 8, 0, Math.PI);
        ctx.fill();
        // Bottom 2 teeth
        ctx.beginPath();
        ctx.arc(-14, 5 + roarH - 8, 7, Math.PI, 0);
        ctx.arc(14, 5 + roarH - 8, 7, Math.PI, 0);
        ctx.fill();
        break;

      case "giggle":
        ctx.strokeStyle = "#3A1A00";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = "#FF758F";
        ctx.beginPath();
        ctx.arc(0, 6, 9, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  drawArms(ctx, pose, t) {
    // Tiny rounded baby arms
    const arms = [
      { side: -1, x: -75, y: -90 + pose.armLeftY, angle: pose.armLeftAngle },
      { side: 1, x: 75, y: -90 + pose.armRightY, angle: pose.armRightAngle }
    ];

    arms.forEach((arm) => {
      ctx.save();
      ctx.translate(arm.x, arm.y);
      ctx.rotate(arm.angle);

      const armGrad = ctx.createRadialGradient(0, 0, 5, 0, 20, 40);
      armGrad.addColorStop(0, "#9BF6B4");
      armGrad.addColorStop(0.5, "#6ED68F");
      armGrad.addColorStop(1, "#40916C");
      ctx.fillStyle = armGrad;

      ctx.beginPath();
      ctx.ellipse(0, 20, 18, 30, arm.side * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Cute rounded hand paw
      ctx.fillStyle = "#B7F4C8";
      ctx.beginPath();
      ctx.arc(0, 42, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }
}
