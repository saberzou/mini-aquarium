// Soft wave crests with a shaded trough: small wakes and larger touch ripples.
export class Ripple {
  constructor(x, y, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.age = 0;
    this.maxAge = scale >= 0.75 ? 114 : 55;
    this.maxRadius = (scale >= 0.75 ? 220 : 100) * scale;
  }
  get alive() { return this.age < this.maxAge; }
  update() { this.age++; }
  draw(ctx) {
    const t = this.age / this.maxAge;
    if (t <= 0 || t >= 1) return;
    const radius = t * this.maxRadius;
    const strength = Math.sin(Math.PI * t) * (1 - t * 0.55);
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const r = radius - i * (this.scale >= 0.75 ? 17 : 7);
      if (r < 2) continue;
      const amplitude = strength * (i ? 0.38 : 1) * (this.scale >= 0.75 ? 1 : 0.3);
      // Thin inner ridge sits inside a broad, transparent band of reflected light.
      for (const [width, alpha] of [[11,0.022],[5,0.038],[1.2,0.11]]) {
        ctx.beginPath();ctx.arc(this.x,this.y,r,0,Math.PI*2);
        ctx.strokeStyle = `rgba(244,253,226,${amplitude*alpha})`;ctx.lineWidth=width;ctx.stroke();
      }
      ctx.beginPath();ctx.arc(this.x+1,this.y+2,r+4,0,Math.PI*2);
      ctx.strokeStyle=`rgba(36,84,72,${amplitude*0.045})`;ctx.lineWidth=3;ctx.stroke();
    }
    ctx.restore();
  }
}
export class RippleManager {
  constructor() { this.ripples=[]; }
  add(x,y,scale=1) {
    this.ripples.push(new Ripple(x,y,scale));
    if(this.ripples.length>48)this.ripples.shift();
  }
  update() { this.ripples.forEach(r=>r.update());this.ripples=this.ripples.filter(r=>r.alive); }
  draw(ctx) { this.ripples.forEach(r=>r.draw(ctx)); }
}
