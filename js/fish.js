// fish.js — Smooth Koi fish with spine-based animation
import { WANDER_SPEED, MAX_SPEED, TURN_RATE, TAIL_SPEED, FEAR_RADIUS, FEAR_FORCE, FEAR_DECAY, FISH_COLORS } from './config.js?v=1';

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
    const s=this.size, c=this.color, disc=c.shape==='disc';
    const height=disc ? .66 : c.shape==='slender' ? .32 : .46;
    const wag=Math.sin(this.tailPhase)*s*.13;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);
    // Soft seabed shadow separates the swimming layer from the reef.
    ctx.save();ctx.translate(5,9);ctx.fillStyle='rgba(10,57,76,.12)';
    ctx.beginPath();ctx.ellipse(-s*.2,0,s*.95,s*height,0,0,Math.PI*2);ctx.fill();ctx.restore();
    // A caudal fan with fine rays and flexible peduncle.
    ctx.fillStyle=c.fin;ctx.strokeStyle='rgba(252,246,211,.4)';ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(-s*.84,0);ctx.quadraticCurveTo(-s*1.16,wag-s*.15,-s*1.55,wag-s*.42);
    ctx.quadraticCurveTo(-s*1.42,wag,-s*1.55,wag+s*.42);ctx.quadraticCurveTo(-s*1.14,wag+s*.15,-s*.84,0);ctx.fill();
    for(let n=-2;n<=2;n++){ctx.beginPath();ctx.moveTo(-s*.9,0);ctx.lineTo(-s*1.45,wag+n*s*.16);ctx.stroke();}
    // Distinct dorsal and anal fins give reef fish their broader silhouettes.
    for(const side of [-1,1]){
      ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(s*.32,side*s*height*.65);
      ctx.quadraticCurveTo(-s*.2,side*s*(height+.42),-s*.82,side*s*(height*.7));
      ctx.lineTo(-s*.65,side*s*.12);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;
    const body=()=>{ctx.beginPath();ctx.moveTo(s*.86,0);ctx.bezierCurveTo(s*.65,-s*height*.28,s*.35,-s*height,-s*.14,-s*height);ctx.bezierCurveTo(-s*.7,-s*height,-s*.75,-s*.15,-s*.98,0);ctx.bezierCurveTo(-s*.75,s*.15,-s*.7,s*height,-s*.14,s*height);ctx.bezierCurveTo(s*.35,s*height,s*.65,s*height*.28,s*.86,0);ctx.closePath();};
    body();ctx.fillStyle=c.body;ctx.fill();ctx.save();body();ctx.clip();
    const band=(x,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=s*width;ctx.beginPath();ctx.moveTo(s*(x-.12),-s);ctx.bezierCurveTo(s*(x+.12),-s*.25,s*(x-.12),s*.25,s*(x+.1),s);ctx.stroke();};
    if(c.pattern==='clown'){for(const x of [.44,-.2,-.73]){band(x,.22,'#6C5142');band(x,.15,c.spots);}}
    if(c.pattern==='tang'){
      ctx.fillStyle=c.spots;ctx.beginPath();ctx.ellipse(-s*.17,-s*.13,s*.59,s*.27,-.15,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=c.body;ctx.beginPath();ctx.ellipse(-s*.09,-s*.08,s*.36,s*.13,-.15,0,Math.PI*2);ctx.fill();
    }
    if(c.pattern==='half'){ctx.fillStyle=c.spots;ctx.fillRect(-s*1.1,-s,s,2*s);}
    if(c.pattern==='butterfly'){for(let x=-.7;x<.5;x+=.18)band(x,.025,'#CAAD76');band(.48,.19,c.spots);band(-.73,.11,c.spots);}
    if(c.pattern==='idol'){band(.38,.27,c.spots);band(-.45,.29,c.spots);band(-.75,.16,'#E1BB51');}
    if(c.pattern==='dots'){
      band(.04,.22,'#405967');ctx.fillStyle=c.spots;
      for(let x=-.75;x<-.2;x+=.19)for(let y=-.4;y<=.4;y+=.21){ctx.beginPath();ctx.arc(x*s,y*s,s*.035,0,Math.PI*2);ctx.fill();}
    }
    const g=ctx.createLinearGradient(0,-s*height,0,s*height);g.addColorStop(0,'rgba(255,253,225,.28)');g.addColorStop(.4,'rgba(255,255,255,.02)');g.addColorStop(1,'rgba(21,55,69,.22)');ctx.fillStyle=g;ctx.fillRect(-2*s,-s,3*s,2*s);ctx.restore();
    // Pectoral fin moves independently of the tail.
    ctx.fillStyle=c.fin;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(s*.1,s*.05);ctx.quadraticCurveTo(-s*.05,s*(.4+Math.sin(this.tailPhase*.7)*.08),-s*.34,s*.21);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    if(c.pattern==='idol'){ctx.strokeStyle='#F5EFDC';ctx.lineWidth=s*.055;ctx.beginPath();ctx.moveTo(0,-s*.54);ctx.bezierCurveTo(-s*.15,-s*1.28,-s*.8,-s*1.07,-s*1.35,-s*.94);ctx.stroke();}
    ctx.strokeStyle='rgba(29,59,65,.22)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(s*.34,0,s*.13,s*height*.56,0,-1,1);ctx.stroke();
    ctx.fillStyle='#F9EAD1';ctx.beginPath();ctx.arc(s*.54,-s*.1,s*.094,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#193D4D';ctx.beginPath();ctx.arc(s*.55,-s*.1,s*.057,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(s*.565,-s*.12,s*.019,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}
