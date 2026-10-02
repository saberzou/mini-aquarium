// fish.js — Smooth Koi fish with spine-based animation
import { WANDER_SPEED, MAX_SPEED, TURN_RATE, TAIL_SPEED, FEAR_RADIUS, FEAR_FORCE, FEAR_DECAY, FISH_COLORS } from './config.js?v=20261002';

const SPINE_SEGMENTS = 20;

export class Fish {
  constructor(x, y, size, colorIndexOrObject) {
    this.x = x;
    this.y = y;
    this.size = size;
    // Accept either a colorIndex (number) or a direct color object
    if (typeof colorIndexOrObject === 'object' && colorIndexOrObject !== null) {
      this.color = colorIndexOrObject;
    } else {
      this.color = FISH_COLORS[(colorIndexOrObject || 0) % FISH_COLORS.length];
    }
    this.varietyId = this.color.nameEn || null;
    this.patternSeed = Math.random() * Math.PI * 2;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = WANDER_SPEED * (0.6 + Math.random() * 0.8);
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.targetAngle = this.angle;
    this.wanderTimer = 0;
    this.tailPhase = Math.random() * Math.PI * 2;
    this.fleeing = false;

    // Individual variation
    this.bodyWidth = 0.35 + Math.random() * 0.035; // width ratio — stocky like reference
    this.tailWidth = 0.85 + Math.random() * 0.12; // forked tail span
    this.finSize = 0.5 + Math.random() * 0.3; // dorsal fin height
    this.waveAmp = 0.075 + Math.random() * 0.025; // spine wave amplitude — gentler waggle
    this.waveFreq = 1.8 + Math.random() * 0.4;

    // Spots - random placement along body
    this.spots = [];
    const spotCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < spotCount; i++) {
      this.spots.push({
        t: 0.15 + Math.random() * 0.55, // position along body (0=head, 1=tail)
        side: Math.random() > 0.5 ? 1 : -1,
        size: 0.15 + Math.random() * 0.2,
        offset: (Math.random() - 0.5) * 0.6,
      });
    }
  }

  flee(fx, fy) {
    const dx = this.x - fx;
    const dy = this.y - fy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FEAR_RADIUS && dist > 0) {
      const strength = (1 - dist / FEAR_RADIUS) * FEAR_FORCE;
      this.vx += (dx / dist) * strength;
      this.vy += (dy / dist) * strength;
      this.fleeing = true;
    }
  }

  update(w, h, allFish) {
    this.wanderTimer -= 1;
    if (this.wanderTimer <= 0) {
      this.targetAngle += (Math.random() - 0.5) * 1.2;
      this.wanderTimer = 60 + Math.random() * 120;
    }

    if (!this.fleeing) {
      const ta = this.targetAngle;
      const ax = Math.cos(ta) * this.baseSpeed;
      const ay = Math.sin(ta) * this.baseSpeed;
      this.vx += (ax - this.vx) * TURN_RATE;
      this.vy += (ay - this.vy) * TURN_RATE;
    }

    // Fish swim on different depth layers — no collision avoidance,
    // they can overlap and pass through each other naturally.

    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > MAX_SPEED) {
      this.vx = (this.vx / spd) * MAX_SPEED;
      this.vy = (this.vy / spd) * MAX_SPEED;
    }

    if (this.fleeing) {
      this.vx *= FEAR_DECAY;
      this.vy *= FEAR_DECAY;
      if (spd < this.baseSpeed * 1.2) this.fleeing = false;
    }

    this.x += this.vx;
    this.y += this.vy;
    // Only update angle when moving fast enough to avoid jitter
    if (spd > 0.15) {
      const target = Math.atan2(this.vy, this.vx);
      // Smooth angle interpolation (never snap)
      let diff = target - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * 0.08;
    }
    this.tailPhase += TAIL_SPEED * (1 + spd * 0.5);

    // Edge steering
    const margin = 200;
    const softEdge = 0.02;
    const outLeft = this.x < -margin, outRight = this.x > w + margin;
    const outTop = this.y < -margin, outBot = this.y > h + margin;
    const nearLeft = this.x < 60, nearRight = this.x > w - 60;
    const nearTop = this.y < 60, nearBot = this.y > h - 60;

    if ((outLeft || nearLeft) && (outTop || nearTop)) {
      this.targetAngle = Math.PI * 0.25;
    } else if ((outRight || nearRight) && (outTop || nearTop)) {
      this.targetAngle = Math.PI * 0.75;
    } else if ((outLeft || nearLeft) && (outBot || nearBot)) {
      this.targetAngle = -Math.PI * 0.25;
    } else if ((outRight || nearRight) && (outBot || nearBot)) {
      this.targetAngle = -Math.PI * 0.75;
    } else {
      if (outLeft) this.targetAngle = 0;
      else if (outRight) this.targetAngle = Math.PI;
      else if (nearLeft) this.vx += softEdge;
      else if (nearRight) this.vx -= softEdge;

      if (outTop) this.targetAngle = Math.PI / 2;
      else if (outBot) this.targetAngle = -Math.PI / 2;
      else if (nearTop) this.vy += softEdge;
      else if (nearBot) this.vy -= softEdge;
    }
  }

  // Build spine points with sinusoidal wave and turn arc
  _buildSpine() {
    const len = this.size * 2.2;
    const pts = [];

    // During a turn the heading lags behind the velocity direction.
    // That lag angle is the natural arc of the body: nose leads, tail follows.
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    let turnBend = 0;
    if (spd > 0.15) {
      let diff = Math.atan2(this.vy, this.vx) - this.angle;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      turnBend = Math.max(-0.45, Math.min(0.45, diff)) * 0.4 * this.size;
    }

    for (let i = 0; i <= SPINE_SEGMENTS; i++) {
      const t = i / SPINE_SEGMENTS;
      // Tail wave grows quadratically toward the tail
      const wave = Math.sin(this.tailPhase - t * Math.PI * this.waveFreq) * t * t * this.waveAmp * this.size;
      // Turn arc: nose displaced toward new heading, fades linearly to zero at tail
      pts.push({ x: -t * len + len * 0.3, y: wave + turnBend * (1 - t) });
    }
    return pts;
  }

  // Width profile: blunt rounded snout → fat body peak at 30% → dramatic pinch at 80% → tail
  // Based on reference silhouette: teardrop body with thin caudal peduncle
  _bodyHalfWidth(t) {
    const s = this.size;
    const bw = this.bodyWidth * s;
    if (t < 0.05) {
      // Blunt rounded snout — opens wide quickly (not pointed)
      return bw * Math.sin((t / 0.05) * Math.PI * 0.5) * 0.65;
    }
    if (t < 0.30) {
      // Swells to maximum — peak at ~30%
      const k = (t - 0.05) / 0.25;
      return bw * (0.65 + 0.35 * Math.sin(k * Math.PI * 0.5));
    }
    if (t < 0.65) {
      // Gradual taper through midsection
      const k = (t - 0.30) / 0.35;
      return bw * (1.0 - k * k * 0.45);
    }
    if (t < 0.80) {
      // Accelerating taper into peduncle
      const k = (t - 0.65) / 0.15;
      const ease = k * k * (3 - 2 * k);
      return bw * (0.55 - ease * 0.42);
    }
    if (t < 0.92) {
      // Thin caudal peduncle — dramatic pinch (like reference)
      const k = (t - 0.80) / 0.12;
      return bw * (0.13 - k * 0.04);
    }
    // Tail root — slight flare into forked fin
    const k = (t - 0.92) / 0.08;
    return bw * (0.09 + k * 0.06);
  }

  seekFood(pellets) {
    if (this.fleeing) return;
    const EAT_RADIUS = 14;
    const ATTRACT_RADIUS = 200;
    let closestDist = ATTRACT_RADIUS;
    let target = null;

    for (const p of pellets) {
      if (p.eaten) continue;
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < EAT_RADIUS) {
        p.eaten = true;
      } else if (dist < closestDist) {
        closestDist = dist;
        target = { dx, dy, dist };
      }
    }

    if (target) {
      const strength = (1 - target.dist / ATTRACT_RADIUS) * 0.02;
      this.vx += (target.dx / target.dist) * strength;
      this.vy += (target.dy / target.dist) * strength;
      this.targetAngle = Math.atan2(target.dy, target.dx);
    }
  }

  // Create a fish from a KOI_VARIETIES entry
  static fromVariety(x, y, size, variety) {
    return new Fish(x, y, size, variety);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const spine = this._buildSpine();
    const s = this.size;

    // Build body outline (top + bottom)
    const topPts = [];
    const botPts = [];
    for (let i = 0; i <= SPINE_SEGMENTS; i++) {
      const t = i / SPINE_SEGMENTS;
      const hw = this._bodyHalfWidth(t);
      const sp = spine[i];
      // Normal perpendicular to spine
      let nx = 0, ny = -1;
      if (i < SPINE_SEGMENTS) {
        const dx = spine[i + 1].x - sp.x;
        const dy = spine[i + 1].y - sp.y;
        const nl = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / nl;
        ny = dx / nl;
      }
      topPts.push({ x: sp.x + nx * hw, y: sp.y + ny * hw });
      botPts.push({ x: sp.x - nx * hw, y: sp.y - ny * hw });
    }

    // Fins sit beneath the body, with a translucent edge and quiet fin rays.
    const tail = spine[SPINE_SEGMENTS];
    const finColor = this.color.nameEn?.includes('Ogon') ? '#E4C788' : '#E9EFE1';
    ctx.fillStyle = finColor;
    ctx.globalAlpha = 0.65;
    const tw = s * 0.43 * this.tailWidth;
    ctx.beginPath();
    ctx.moveTo(tail.x + s * 0.08, tail.y);
    ctx.bezierCurveTo(tail.x - s * 0.12, tail.y - tw * 0.6, tail.x - s * 0.42, tail.y - tw * 1.2, tail.x - s * 0.62, tail.y - tw);
    ctx.quadraticCurveTo(tail.x - s * 0.5, tail.y - tw * 0.3, tail.x - s * 0.27, tail.y);
    ctx.quadraticCurveTo(tail.x - s * 0.5, tail.y + tw * 0.3, tail.x - s * 0.62, tail.y + tw);
    ctx.bezierCurveTo(tail.x - s * 0.42, tail.y + tw * 1.2, tail.x - s * 0.12, tail.y + tw * 0.6, tail.x + s * 0.08, tail.y);
    ctx.fill();
    const shoulder = spine[6];
    const finSwing = Math.sin(this.tailPhase * 0.55) * 0.055;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(shoulder.x + s * 0.12, shoulder.y + side * s * 0.22);
      ctx.bezierCurveTo(shoulder.x + s * 0.08, shoulder.y + side * s * 0.55,
        shoulder.x - s * 0.35, shoulder.y + side * s * (0.75 + finSwing),
        shoulder.x - s * 0.48, shoulder.y + side * s * 0.52);
      ctx.quadraticCurveTo(shoulder.x - s * 0.4, shoulder.y + side * s * 0.3, shoulder.x, shoulder.y + side * s * 0.2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(250,253,242,0.25)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(shoulder.x, shoulder.y + side * s * 0.23);
      ctx.lineTo(shoulder.x - s * 0.3, shoulder.y + side * s * 0.55);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(2, 4);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#214D43';
    this._drawBodyPath(ctx, topPts, botPts);
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 1;
    this._drawBodyPath(ctx, topPts, botPts);
    ctx.fillStyle = this.color.body;
    ctx.fill();
    ctx.save();
    this._drawBodyPath(ctx, topPts, botPts);
    ctx.clip();
    this._drawPattern(ctx, spine);
    // A soft dorsal highlight gives volume without bleaching variety markings.
    const light = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
    light.addColorStop(0, 'rgba(17,48,40,0.10)');
    light.addColorStop(0.38, 'rgba(255,255,249,0.19)');
    light.addColorStop(0.65, 'rgba(255,255,249,0.02)');
    light.addColorStop(1, 'rgba(17,48,40,0.16)');
    ctx.fillStyle = light;
    ctx.fillRect(-s * 3, -s, s * 4, s * 2);
    ctx.restore();

    // Dorsal ridge follows the spine rather than protruding sideways.
    ctx.beginPath();
    ctx.moveTo(spine[6].x, spine[6].y);
    ctx.quadraticCurveTo(spine[9].x, spine[9].y - s * 0.06, spine[13].x, spine[13].y);
    ctx.strokeStyle = 'rgba(255,255,246,0.22)';
    ctx.lineWidth = s * 0.04;
    ctx.stroke();

    const eye = spine[2];
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(eye.x, eye.y + side * this._bodyHalfWidth(0.1) * 0.8, s * 0.037, 0, Math.PI * 2);
      ctx.fillStyle = '#233833';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eye.x + s * 0.008, eye.y + side * this._bodyHalfWidth(0.1) * 0.8 - s * 0.009, s * 0.012, 0, Math.PI * 2);
      ctx.fillStyle = '#F9F9EF';
      ctx.fill();
    }
    ctx.restore();
  }

  _drawPattern(ctx, spine) {
    const name = this.varietyId || '';
    const s = this.size;
    const patch = (t, side, length, width, color, phase = 0) => {
      const p = spine[Math.min(SPINE_SEGMENTS, Math.round(t * SPINE_SEGMENTS))];
      const y = p.y + side * this._bodyHalfWidth(t);
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = i / 36 * Math.PI * 2;
        const wobble = 1 + 0.13 * Math.sin(a * 3 + phase + this.patternSeed) + 0.06 * Math.cos(a * 5);
        const x = p.x + Math.cos(a) * s * length * wobble;
        const py = y + Math.sin(a) * s * width * wobble;
        if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    if (this.color.tancho) {
      const crown = spine[3];
      ctx.fillStyle = this.color.spots;
      ctx.beginPath(); ctx.ellipse(crown.x, crown.y, s * 0.15, s * 0.17, 0, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const solid = ['Benigoi', 'Karashigoi', 'Chagoi', 'Karasugoi', 'Yamabuki Ogon', 'Gin Matsuba'].includes(name);
    if (!solid && name !== 'Asagi') {
      const bekko = name.includes('Bekko');
      const placements = bekko ? [0.23, 0.4, 0.56, 0.7] : [0.2, 0.44, 0.68];
      placements.forEach((t, i) => patch(t, (i % 2 ? -1 : 1) * 0.28, bekko ? 0.11 : 0.29, bekko ? 0.13 : 0.33, this.color.spots, i));
      if (this.color.accent) {
        [0.3, 0.53, 0.75].forEach((t, i) => patch(t, (i % 2 ? 1 : -1) * 0.45, 0.13, 0.18, this.color.accent, i + 2));
      }
    }
    if (name === 'Asagi') {
      patch(0.37, 0.9, 0.55, 0.12, this.color.belly);
      patch(0.37, -0.9, 0.55, 0.12, this.color.belly);
    }
    if (['Asagi', 'Goshiki', 'Gin Matsuba'].includes(name)) {
      ctx.strokeStyle = 'rgba(30,56,57,0.22)'; ctx.lineWidth = 0.6;
      for (let row = -1; row <= 1; row++) {
        for (let i = 4; i < 16; i += 2) {
          const p = spine[i];
          ctx.beginPath(); ctx.arc(p.x + (row % 2) * s * 0.08, p.y + row * s * 0.14, s * 0.1, -1.2, 1.2); ctx.stroke();
        }
      }
    }
  }

  _drawBodyPath(ctx, topPts, botPts) {
    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    for (let i = 1; i < topPts.length; i++) {
      const prev = topPts[i - 1];
      const curr = topPts[i];
      ctx.quadraticCurveTo(
        (prev.x + curr.x) / 2, (prev.y + curr.y) / 2,
        curr.x, curr.y
      );
    }
    // Connect to bottom in reverse
    const last = botPts[botPts.length - 1];
    ctx.lineTo(last.x, last.y);
    for (let i = botPts.length - 2; i >= 0; i--) {
      const prev = botPts[i + 1];
      const curr = botPts[i];
      ctx.quadraticCurveTo(
        (prev.x + curr.x) / 2, (prev.y + curr.y) / 2,
        curr.x, curr.y
      );
    }
    ctx.closePath();
  }
}
