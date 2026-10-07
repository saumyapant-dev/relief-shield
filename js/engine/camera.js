/**
 * Camera Viewport Engine for 1080x1920 Vertical Frame
 * Handles smooth dolly zooms, pan targeting, and screen shakes.
 */

export class Camera {
  constructor(canvasWidth = 1080, canvasHeight = 1920) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.x = canvasWidth / 2;
    this.y = 1120; // Dino center baseline
    this.zoom = 1.0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.targetZoom = 1.0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTime = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  reset() {
    this.x = this.width / 2;
    this.y = 1120;
    this.zoom = 1.0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  snapToTarget() {
    this.zoom = this.targetZoom;
    this.x = this.targetX;
    this.y = this.targetY;
  }

  shake(intensity = 15, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
  }

  update(timeline) {
    const t = timeline.currentTime;
    const sceneInfo = timeline.getCurrentScene(t);
    const sceneId = sceneInfo.scene.id;
    const p = timeline.getSceneProgress(t);

    // Calculate camera target based on scene script
    switch (sceneId) {
      case 1:
        // Medium shot gently zooming in on Dino's face (0.0 - 6.0)
        this.targetZoom = 1.0 + 0.22 * Math.sin((p * Math.PI) / 2);
        this.targetX = 540;
        this.targetY = 1120 - 60 * p;
        break;

      case 2:
        // Dino plants feet, puffs cheeks, deflates (6.0 - 13.0)
        // Zoom settles at 1.15 with a slight push when puffing
        const puffFactor = p < 0.6 ? Math.sin(p * Math.PI / 0.6) * 0.1 : 0;
        this.targetZoom = 1.15 + puffFactor;
        this.targetX = 540;
        this.targetY = 1080;
        break;

      case 3:
        // Friends arrive (13.0 - 20.0) -> zoom out slightly to capture all 4 friends
        this.targetZoom = 1.0 - 0.05 * Math.sin(p * Math.PI);
        this.targetX = 540;
        this.targetY = 1120;
        break;

      case 4:
        // Musical practice (20.0 - 29.0) -> rhythmic bounce
        const beatBounce = Math.sin(t * Math.PI * 4) * 0.015;
        this.targetZoom = 1.05 + beatBounce;
        this.targetX = 540;
        this.targetY = 1110;
        break;

      case 5:
        // The funny sneeze (29.0 - 37.0)
        // Inhale/wiggle up to 34.0s (p ~ 0.6), then SNEEZE at ~34.0s
        if (p < 0.6) {
          const inhaleProgress = p / 0.6;
          this.targetZoom = 1.1 + 0.25 * inhaleProgress;
          this.targetX = 540;
          this.targetY = 1080 - 60 * inhaleProgress;
        } else {
          // Sneeze recoil!
          const sneezeP = (p - 0.6) / 0.4;
          this.targetZoom = 1.35 - 0.35 * Math.min(1, sneezeP * 2);
          this.targetX = 540;
          this.targetY = 1020 + 100 * Math.min(1, sneezeP * 2);
          if (p >= 0.6 && p <= 0.65 && this.shakeIntensity < 10) {
            this.shake(26, 0.6);
          }
        }
        break;

      case 6:
        // The Big Roar (37.0 - 46.0)
        // Dramatic breath (37-40s), then MIGHTY ROAR at 40s!
        if (p < 0.35) {
          const breathP = p / 0.35;
          this.targetZoom = 1.05 + 0.32 * breathP;
          this.targetX = 540;
          this.targetY = 1120 - 70 * breathP;
        } else {
          // Epic roar release
          this.targetZoom = 1.37;
          this.targetX = 540;
          this.targetY = 1050;
          // Sustained roar vibration
          if (p < 0.75) {
            this.shakeOffsetX = (Math.random() - 0.5) * 12;
            this.shakeOffsetY = (Math.random() - 0.5) * 12;
          }
        }
        break;

      case 7:
        // Dance Party (46.0 - 55.0) -> energetic rhythmic dance cam
        const danceHop = Math.abs(Math.sin(t * Math.PI * 3.8)) * 0.04;
        this.targetZoom = 1.08 + danceHop;
        this.targetX = 540 + Math.sin(t * Math.PI * 1.9) * 20;
        this.targetY = 1110;
        break;

      case 8:
        // Loop ending (55.0 - 60.0) -> transitions smoothly back to EXACT opening frame (zoom: 1.0, x: 540, y: 1120)
        const loopEase = (1 - p);
        this.targetZoom = 1.0 + 0.1 * loopEase;
        this.targetX = 540;
        this.targetY = 1120;
        break;

      default:
        this.targetZoom = 1.0;
        this.targetX = 540;
        this.targetY = 1120;
        break;
    }

    // Smooth camera interpolation
    this.zoom += (this.targetZoom - this.zoom) * 0.1;
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;

    // Decay screen shake
    if (this.shakeIntensity > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }

  apply(ctx) {
    ctx.save();
    // Center of vertical screen is (width / 2, height / 2)
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.translate(centerX + this.shakeOffsetX, centerY + this.shakeOffsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }
}
