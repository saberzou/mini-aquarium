// A self-contained water surface: refracted light cells, rolling reflections and
// interactive wave fronts. The bounded low-resolution buffer avoids a WebGL/CDN
// dependency and is composited at full canvas size behind the pond inhabitants.
const { sin, cos, floor, sqrt, exp, abs, max, min, round, hypot } = Math;
const TILE = 192;
const PERIOD = 360;

export class CausticLayer {
  constructor(w, h) {
    this.time = 0;
    this.lastRender = -Infinity;
    this.rain = 0;
    this.texture = this._makeTexture();
    this.buffer = document.createElement('canvas');
    this.context = this.buffer.getContext('2d', { alpha: false });
    this.resize(w, h);
  }

  _makeTexture() {
    // Periodic, irregular Voronoi edges give a connected light network instead
    // of a checkerboard or a field of unrelated glowing circles.
    const cells = 5;
    const points = [];
    let seed = 219;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
      points.push({x: x + 0.2 + random() * 0.6, y: y + 0.2 + random() * 0.6});
    }
    const texture = new Float32Array(TILE * TILE);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const px = x / TILE * cells, py = y / TILE * cells;
      const gx = floor(px), gy = floor(py);
      let first = Infinity, second = Infinity;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const cx = gx + ox, cy = gy + oy;
        const ix = (cx + cells) % cells, iy = (cy + cells) % cells;
        const point = points[iy * cells + ix];
        const dx = point.x + cx - ix - px, dy = point.y + cy - iy - py;
        const distance = dx * dx + dy * dy;
        if (distance < first) { second = first; first = distance; }
        else if (distance < second) second = distance;
      }
      const edge = sqrt(second) - sqrt(first);
      texture[y * TILE + x] = exp(-edge * edge * 130);
    }
    return texture;
  }

  resize(w, h) {
    this.w = w; this.h = h;
    // Bounded sampling cost, independent of device pixel ratio.
    const ratio = min(0.45, 320 / max(w, h));
    this.buffer.width = max(1, round(w * ratio));
    this.buffer.height = max(1, round(h * ratio));
    this.pixels = this.context.createImageData(this.buffer.width, this.buffer.height);
    this.edge = new Float32Array(this.buffer.width * this.buffer.height);
    for (let j=0;j<this.buffer.height;j++) for (let i=0;i<this.buffer.width;i++) {
      this.edge[j*this.buffer.width+i] = min(1,hypot((i/this.buffer.width-.4)*.9,(j/this.buffer.height-.35)*.75));
    }
    this.lastRender = -Infinity;
  }

  update(rainy = false) {
    this.time += 1 / 60;
    this.rain += ((rainy ? 1 : 0) - this.rain) * 0.025;
  }

  _lookup(x, y) {
    const u = ((floor(x * TILE / PERIOD) % TILE) + TILE) % TILE;
    const v = ((floor(y * TILE / PERIOD) % TILE) + TILE) % TILE;
    return this.texture[v * TILE + u];
  }

  _waves(ripples) {
    // Tap/drag waves refract the surface; the smaller animal wakes remain subtle.
    return ripples.filter(r => r.scale >= 0.75 && r.alive).slice(-6).map(r => ({
      x: r.x, y: r.y, radius: r.age / r.maxAge * r.maxRadius,
      strength: sin(Math.PI * r.age / r.maxAge) * r.scale,
    }));
  }

  refraction(x, y, ripples, reduced = false) {
    if (reduced) return {x: 0, y: 0};
    let dx = sin(y * 0.014 + this.time * 0.38) * 0.55;
    let dy = cos(x * 0.012 - this.time * 0.3) * 0.45;
    for (const wave of this._waves(ripples)) {
      const vx = x - wave.x, vy = y - wave.y;
      const distance = hypot(vx, vy);
      const band = distance - wave.radius;
      if (abs(band) > 38 || distance < 1) continue;
      const bend = sin(band * 0.1) * exp(-band * band / 500) * wave.strength * 3;
      dx += vx / distance * bend; dy += vy / distance * bend;
    }
    return {x: dx, y: dy};
  }

  draw(ctx, ripples = [], reduced = false) {
    // Water is sampled at ~20–24fps; fish and input retain their independent 60Hz simulation.
    if (this.lastRender === -Infinity || this.lastReduced !== reduced ||
        (!reduced && this.time - this.lastRender >= 1 / 24) ||
        (reduced && abs(this.rain - this.lastRain) > 0.02)) {
      this._render(reduced ? 0 : this.time, reduced ? [] : this._waves(ripples));
      this.lastRender = this.time;
      this.lastReduced = reduced;
      this.lastRain = this.rain;
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, this.w, this.h);
    ctx.restore();
  }

  _render(time, waves) {
    const width = this.buffer.width, height = this.buffer.height;
    const data = this.pixels.data;
    const scaleX = this.w / width, scaleY = this.h / height;
    const lightStrength = 1 - this.rain * 0.65;
    const columns = [];
    for (let i = 0; i < width; i++) {
      const x = i * scaleX;
      columns.push({x, a: sin(x * 0.012 + time * 0.27), b: cos(x * 0.004 - time * 0.18)});
    }
    for (let j = 0; j < height; j++) {
      const y = j * scaleY;
      const sway = sin(y * 0.013 + time * 0.31);
      const swell = cos(y * 0.005 - time * 0.21);
      for (let i = 0; i < width; i++) {
        const {x, a, b} = columns[i];
        let rx = 0, ry = 0, glint = 0;
        for (const wave of waves) {
          const dx = x - wave.x, dy = y - wave.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > (wave.radius + 42) ** 2 || d2 < max(0, wave.radius - 42) ** 2) continue;
          const distance = sqrt(d2);
          if (distance < 1) continue;
          const band = distance - wave.radius;
          const envelope = exp(-band * band / 440) * wave.strength;
          const bend = sin(band * 0.095) * envelope;
          rx += dx / distance * bend * 19;
          ry += dy / distance * bend * 19;
          // Directional reflection, with a darker trough behind the light crest.
          glint += cos(band * 0.095) * envelope * (0.55 + abs(dx / distance * 0.6 - dy / distance * 0.8) * 0.45);
        }
        const u = x + sway * 25 + a * 10 + time * 2.3 + rx;
        const v = y + a * 24 + sway * 9 - time * 1.8 + ry;
        const caustic = this._lookup(u,v) * 0.7 + this._lookup(u * 0.73 + 83 + time * 3,v * 0.73 + 41) * 0.3;
        const depth = b * swell;
        const gleam = max(0, 1 - abs(a + sway * 0.8) * 0.8);
        const reflection = gleam ** 7 * 0.05;
        const highlight = (caustic * 0.19 + reflection) * lightStrength + max(0,glint) * 0.13;
        const trough = min(0,glint) * 8;
        const edge = this.edge[j * width + i];
        const red = 135 + depth * 9 - edge * 17 + trough;
        const green = 176 + depth * 8 - edge * 12 + trough;
        const blue = 157 + depth * 9 - edge * 8 + trough;
        const k = (j * width + i) * 4;
        data[k] = red + (236 - red) * highlight;
        data[k+1] = green + (247 - green) * highlight;
        data[k+2] = blue + (218 - blue) * highlight;
        data[k+3] = 255;
      }
    }
    this.context.putImageData(this.pixels,0,0);
  }
}
