// fish.js — Smooth Koi fish with spine-based animation
import { WANDER_SPEED, MAX_SPEED, TURN_RATE, TAIL_SPEED, FEAR_RADIUS, FEAR_FORCE, FEAR_DECAY, FISH_COLORS } from './config.js?v=2';

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

  // Create a fish from a REEF_FISH entry
  static fromVariety(x, y, size, variety) {
    return new Fish(x, y, size, variety);
  }

  draw(ctx) {
    const s=this.size, c=this.color;
    // The tall flanks of tangs and butterflyfish are narrow from overhead.
    const width=(c.shape==='disc' ? .24 : c.shape==='slender' ? .25 : .34)*s;
    const wag=Math.sin(this.tailPhase)*s*.15;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);
    const body=()=>{ctx.beginPath();ctx.moveTo(s*.83,0);
      ctx.bezierCurveTo(s*.79,-width*.65,s*.32,-width,-s*.05,-width);
      ctx.bezierCurveTo(-s*.48,-width,-s*.74,-width*.2,-s*.98,wag*.35);
      ctx.bezierCurveTo(-s*.73,width*.2,-s*.48,width,-s*.05,width);
      ctx.bezierCurveTo(s*.32,width,s*.79,width*.65,s*.83,0);ctx.closePath();};
    ctx.save();ctx.translate(4,7);ctx.fillStyle='rgba(12,56,76,.09)';body();ctx.fill();ctx.restore();
    // A vertically oriented tail is seen edge-on, with only a slight roll.
    ctx.fillStyle=c.fin;ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(-s*.85,wag*.25);
    ctx.quadraticCurveTo(-s*1.2,wag-s*.19,-s*1.45,wag-s*.22);
    ctx.lineTo(-s*1.31,wag);ctx.lineTo(-s*1.45,wag+s*.22);
    ctx.quadraticCurveTo(-s*1.2,wag+s*.19,-s*.85,wag*.25);ctx.fill();
    // Paired pectoral fins extend laterally beneath the shoulders.
    for(const side of [-1,1]){const swing=Math.sin(this.tailPhase*.65)*.07;
      ctx.beginPath();ctx.moveTo(s*.28,side*width*.7);
      ctx.bezierCurveTo(s*.17,side*s*(.52+swing),-s*.14,side*s*.66,-s*.3,side*s*.47);
      ctx.quadraticCurveTo(-s*.2,side*width,s*.12,side*width*.8);ctx.fill();}
    ctx.globalAlpha=1;body();ctx.fillStyle=c.body;ctx.fill();ctx.save();body();ctx.clip();
    const band=(x,w,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo((x-.05)*s,-s);ctx.lineTo((x+w)*s,-s);ctx.lineTo((x+w+.05)*s,s);ctx.lineTo(x*s,s);ctx.closePath();ctx.fill();};
    if(c.pattern==='clown')for(const x of [.43,-.2,-.73]){band(x,.2,'#725446');band(x+.03,.13,c.spots);}
    if(c.pattern==='tang'){ctx.strokeStyle=c.spots;ctx.lineWidth=s*.095;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(s*.48,side*width*.5);ctx.bezierCurveTo(0,side*width*.88,-s*.45,side*width*.7,-s*.76,side*width*.15);ctx.stroke();}}
    if(c.pattern==='half'){ctx.fillStyle=c.spots;ctx.fillRect(-s*1.1,-s,s,2*s);}
    if(c.pattern==='butterfly'){for(let x=-.7;x<.5;x+=.18)band(x,.025,'#CAAD76');band(.5,.13,c.spots);}
    if(c.pattern==='idol'){band(.38,.22,c.spots);band(-.38,.25,c.spots);band(-.72,.14,'#E1BB51');}
    if(c.pattern==='dots'){band(.04,.16,'#405967');ctx.fillStyle=c.spots;for(let x=-.7;x<-.2;x+=.18)for(const side of [-1,1]){ctx.beginPath();ctx.arc(x*s,side*width*.45,s*.033,0,Math.PI*2);ctx.fill();}}
    const light=ctx.createLinearGradient(0,-width,0,width);light.addColorStop(0,'rgba(14,56,72,.18)');light.addColorStop(.43,'rgba(255,248,219,.25)');light.addColorStop(.6,'rgba(255,248,219,.1)');light.addColorStop(1,'rgba(14,56,72,.2)');ctx.fillStyle=light;ctx.fillRect(-2*s,-s,3*s,2*s);ctx.restore();
    // Dorsal fin follows the centerline rather than a side-profile sail.
    ctx.strokeStyle=c.fin;ctx.lineWidth=s*.055;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s*.1,0);ctx.quadraticCurveTo(-s*.25,-s*.025,-s*.68,wag*.12);ctx.stroke();
    if(c.pattern==='idol'){ctx.strokeStyle='#F5EFDC';ctx.lineWidth=s*.035;ctx.beginPath();ctx.moveTo(s*.08,0);ctx.bezierCurveTo(-s*.3,-s*.09,-s*.9,wag*.3,-s*1.55,wag*.6);ctx.stroke();}
    for(const side of [-1,1]){const ey=side*width*.64;
      ctx.fillStyle='#193D4D';ctx.beginPath();ctx.ellipse(s*.57,ey,s*.045,s*.035,side*.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#FCF5DF';ctx.beginPath();ctx.arc(s*.58,ey-s*.01,s*.013,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
