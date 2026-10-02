// A small freshwater turtle with a sage shell and unhurried alternating paddles.
export class Turtle {
  constructor(x, y) {
    this.x = x; this.y = y; this.size = 34;
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle; this.phase = 0; this.timer = 0;
  }
  update(w, h, ripples, lotus, slow = 1) {
    if (--this.timer <= 0) {
      this.targetAngle += (Math.random() - 0.5) * 1.3;
      this.timer = 180 + Math.random() * 240;
    }
    const margin = 55;
    if (this.x < margin || this.x > w - margin || this.y < margin || this.y > h - margin) {
      this.targetAngle = Math.atan2(h / 2 - this.y, w / 2 - this.x);
    }
    for (const pad of lotus.pads) {
      const dx = this.x - pad.x, dy = this.y - pad.y;
      if (Math.hypot(dx, dy) < pad.size + this.size * 0.7) this.targetAngle = Math.atan2(dy, dx);
    }
    let turn = this.targetAngle - this.angle;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    this.angle += turn * 0.018;
    this.phase += 0.032 * slow;
    const speed = (0.24 + Math.sin(this.phase) * 0.06) * slow;
    this.x += Math.cos(this.angle) * speed;
    this.y += Math.sin(this.angle) * speed;
  }
  poke(x, y) {
    if (Math.hypot(x - this.x, y - this.y) < 90) this.targetAngle = Math.atan2(this.y - y, this.x - x);
  }
  resize(w, h) { this.x = Math.max(40, Math.min(w - 40, this.x)); this.y = Math.max(40, Math.min(h - 40, this.y)); }
  draw(ctx) {
    const s = this.size;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
    ctx.fillStyle = 'rgba(31,65,49,0.12)';
    ctx.beginPath(); ctx.ellipse(2, 4, s * 0.66, s * 0.48, 0, 0, Math.PI * 2); ctx.fill();
    // Rounded feet move in diagonal pairs.
    ctx.fillStyle = '#A5B58A';
    for (const front of [-1, 1]) for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(front * s * 0.35, side * s * 0.38);
      ctx.rotate(side * (front * 0.48 + Math.sin(this.phase + (front === side ? 0 : Math.PI)) * 0.18));
      ctx.beginPath(); ctx.ellipse(0, side * s * 0.12, s * 0.16, s * 0.27, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.09); ctx.quadraticCurveTo(-s * 0.92, 0, -s * 0.55, s * 0.09); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.68, 0, s * 0.27, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    const shell = ctx.createRadialGradient(-s * 0.15, -s * 0.18, 0, 0, 0, s * 0.75);
    shell.addColorStop(0, '#A4B591'); shell.addColorStop(1, '#5F826B');
    ctx.fillStyle = shell; ctx.strokeStyle = '#B6C5A0'; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.47, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(47,83,61,0.34)'; ctx.lineWidth = 1;
    const points = [[-.35,0],[-.18,-.24],[.18,-.24],[.35,0],[.18,.24],[-.18,.24]];
    ctx.beginPath(); points.forEach(([x,y],i)=>i ? ctx.lineTo(x*s,y*s) : ctx.moveTo(x*s,y*s)); ctx.closePath(); ctx.stroke();
    points.forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x*s,y*s);ctx.lineTo(x*s*2,y*s*2);ctx.stroke();});
    ctx.restore();
    for (const side of [-1,1]) {
      ctx.fillStyle = '#2E4938'; ctx.beginPath(); ctx.arc(s * 0.79, side * s * 0.12, s * 0.027, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
