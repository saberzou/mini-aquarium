// pond.js — Main orchestrator
import { Fish } from './fish.js?v=20261002';
import { RippleManager } from './ripple.js?v=20261002';
import { LotusManager } from './lotus.js?v=20261002b';
import { AnimalManager } from './animals.js?v=20261002c';
import { KOI_VARIETIES } from './config.js?v=20261002';
import { readPreference, savePreference } from './storage.js?v=20261002';
import { SimulationClock } from './clock.js?v=20261002';
import { BreathingMode } from './breathing.js?v=20261002';
import { RainManager } from './rain.js?v=20261002';
import { FoodManager } from './food.js?v=20261002';
import { CausticLayer } from './caustics.js?v=20261002';

let canvas, ctx, w, h;
let fish = [];
let ripples;
let lotus;
let animals;
let breathing;
let rainManager;
let foodManager;
let causticLayer;
let liquidApp = null;
let weather = readPreference('weather', 'sunny') === 'rainy' ? 'rainy' : 'sunny';
const clock = new SimulationClock();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let animationId = null;
let lastPaint = 0;
let darknessAlpha = 0;
let lastDragRippleTime = 0;

const HOLD_DELAY_MS = 380;
const HOLD_REPEAT_MS = 320;
let pressState = null;

function generatePondTexture() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const off = document.createElement('canvas');
  off.width = w * dpr;
  off.height = h * dpr;
  const c = off.getContext('2d');
  c.scale(dpr, dpr);

  // Base pond color — simple blue-green
  c.fillStyle = '#8CAFA0';
  c.fillRect(0, 0, w, h);

  // Soft light patches
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    const gr = w * (0.15 + Math.random() * 0.25);
    const g = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(175,205,185,${0.1 + Math.random() * 0.08})`);
    g.addColorStop(1, 'rgba(175,205,185,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  c.globalCompositeOperation = 'source-over';
  return off.toDataURL('image/png');
}

async function initLiquid() {
  // The CSS pond stays visible if WebGL or the optional CDN is unavailable.
  if (reducedMotion.matches) return;
  try {
    const { default: LiquidBackground } = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.30/build/backgrounds/liquid1.min.js');
    const app = LiquidBackground(document.getElementById('liquid-canvas'));
    app.loadImage(generatePondTexture());
    app.liquidPlane.material.metalness = 0.08;
    app.liquidPlane.material.roughness = 0.8;
    window.__liquidApp = app;
    window.setWeather(weather);
  } catch {
    document.getElementById('liquid-canvas').style.display = 'none';
  }
}

function createFish(variety) {
  const margin = Math.min(80, w * 0.2, h * 0.2);
  return Fish.fromVariety(margin + Math.random() * (w - margin * 2),
    margin + Math.random() * (h - margin * 2), 24 + Math.random() * 5, variety);
}
function saveFish() { savePreference('fish', fish.map(f => f.varietyId)); }
function initFish() {
  const defaults = ['Kohaku', 'Taisho Sanshoku', 'Showa', 'Yamabuki Ogon', 'Tancho', 'Asagi', 'Karashigoi'];
  const saved = readPreference('fish', defaults);
  const ids = Array.isArray(saved) ? saved : defaults;
  fish = [...new Set(ids)].map(id => KOI_VARIETIES.find(v => v.nameEn === id)).filter(Boolean).map(createFish);
}

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * (Math.min(window.devicePixelRatio || 1, 2));
  canvas.height = h * (Math.min(window.devicePixelRatio || 1, 2));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
  if (animals) animals.resize(w, h);
  if (lotus) lotus.generate(w, h);
  if (rainManager) rainManager.resize(w, h);
  if (causticLayer) causticLayer.resize(w, h);
}

function handleInteraction(px, py) {
  if (breathing.isActive()) return;
  ripples.add(px, py);
  for (const f of fish) {
    f.flee(px, py);
  }
  animals?.poke(px, py);
  lotus.nudge(px, py, 1.5);
}

function handleDrag(px, py) {
  if (breathing.isActive()) return;
  const now = performance.now();
  if (now - lastDragRippleTime > 50) {
    ripples.add(px, py);
    lastDragRippleTime = now;
  }
  lotus.nudge(px, py, 0.8);
  for (const f of fish) {
    f.flee(px, py);
  }
}

function update() {
  causticLayer.update();

  // Long-press feeding check
  if (pressState && !pressState.dragging && !breathing.isActive()) {
    const now = performance.now();
    const elapsed = now - pressState.startTime;
    if (elapsed >= HOLD_DELAY_MS) {
      if (!pressState.fed || now - pressState.lastDrop >= HOLD_REPEAT_MS) {
        foodManager.add(pressState.x, pressState.y);
        pressState.fed = true;
        pressState.lastDrop = now;
      }
    }
  }

  // Breathing mode overrides normal fish movement
  if (breathing.isActive()) {
    breathing.update(fish, w, h);
  } else {
    const pellets = foodManager.getPellets();
    fish.forEach(f => {
      f.update(w, h, fish);
      f.seekFood(pellets);
    });
  }

  // Food update
  foodManager.update();

  ripples.update();
  lotus.update();
  animals.update(ripples, fish, lotus, weather, breathing.isActive());
  rainManager.update();
  const targetAlpha = weather === 'rainy' ? 0.18 : 0;
  darknessAlpha += (targetAlpha - darknessAlpha) * 0.03;
}

function loop(now) {
  animationId = requestAnimationFrame(loop);
  clock.advance(now, update);
  // Reduced-motion mode keeps interaction but removes ambient shimmer and limits paints.
  if (reducedMotion.matches && now - lastPaint < 1000 / 30) return;
  lastPaint = now;
  ctx.clearRect(0, 0, w, h);
  if (!reducedMotion.matches) causticLayer.draw(ctx);
  breathing.drawRing(ctx, w, h);
  fish.forEach(f => f.draw(ctx));
  ripples.draw(ctx);
  lotus.draw(ctx);
  foodManager.draw(ctx);
  animals.draw(ctx, weather, breathing.isActive());
  if (weather === 'rainy') {
    rainManager.draw(ctx);
    if (!reducedMotion.matches) lotus.drawRainDrops(ctx);
  }

  // Darkness overlay for rainy weather
  if (darknessAlpha > 0.005) {
    ctx.fillStyle = `rgba(0,0,0,${darknessAlpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Vignette drawn last (top layer)
  breathing.drawVignette(ctx, w, h);

  // Hold-to-feed indicator (drawn on top of everything)
  if (pressState && !pressState.dragging && !breathing.isActive()) {
    const elapsed = performance.now() - pressState.startTime;
    const progress = Math.min(1, elapsed / HOLD_DELAY_MS);
    if (progress > 0.02) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pressState.x, pressState.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = pressState.fed ? 'rgba(255,210,80,0.9)' : 'rgba(255,210,80,0.75)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Expose current phase for HTML UI label
  if (breathing.isActive()) {
    window.__breathingPhase = breathing.getPhase();
  } else {
    window.__breathingPhase = null;
  }

  // Pulse liquid displacement with breath
  const app = window.__liquidApp;
  if (app) {
    const weatherDisp = weather === 'rainy' ? 1.5 : 0;
    if (breathing.isActive()) {
      const tp = breathing.getTransitionProgress();
      const bp = breathing.getBreathProgress();
      const breathDisp = 0.18 + bp * 0.22;
      app.liquidPlane.uniforms.displacementScale.value = weatherDisp + breathDisp * tp;
    } else {
      const cur = app.liquidPlane.uniforms.displacementScale.value;
      if (Math.abs(cur - weatherDisp) > 0.01) {
        app.liquidPlane.uniforms.displacementScale.value += (weatherDisp - cur) * 0.05;
      }
    }
  }

}

export function init() {
  canvas = document.getElementById('fish-canvas');
  ctx = canvas.getContext('2d');
  ripples = new RippleManager();
  w = window.innerWidth;
  h = window.innerHeight;
  lotus = new LotusManager(w, h);
  animals = new AnimalManager(w, h);
  breathing = new BreathingMode();
  rainManager = new RainManager(w, h);
  foodManager = new FoodManager();
  causticLayer = new CausticLayer(w, h);

  // Weather toggle — controls liquid displacement + rain ripples
  window.setWeather = (mode) => {
    weather = mode === 'rainy' ? 'rainy' : 'sunny';
    savePreference('weather', weather);
    document.querySelectorAll('.weather-tab').forEach(button => {
      const active = button.dataset.weather === weather;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (mode === 'rainy') {
      rainManager.start();
    } else {
      rainManager.stop();
    }
    const app = window.__liquidApp;
    if (app && !breathing.isActive()) {
      if (mode === 'rainy') {
        app.setRain(true);
        app.liquidPlane.uniforms.displacementScale.value = 1.5;
      } else {
        app.setRain(false);
        app.liquidPlane.uniforms.displacementScale.value = 0;
      }
    } else if (app && mode === 'rainy') {
      app.setRain(true);
    } else if (app) {
      app.setRain(false);
    }
  };

  // Breathing toggle — called from HTML button
  window.toggleBreathing = () => {
    pressState = null;
    if (breathing.isActive() && !breathing._deactivating) {
      breathing.deactivate(fish);
      return false;
    } else {
      breathing.activate();
      return true;
    }
  };

  window.isBreathingActive = () => breathing.isActive();
  window.isBreathingRequested = () => breathing.isActive() && !breathing._deactivating;

  window.hasAnimal = id => animals.has(id);
  window.setAnimalEnabled = (id, enabled) => animals.setEnabled(id, enabled);

  resize();
  initLiquid();
  initFish();
  window.setWeather(weather);

  window.addEventListener('resize', () => {
    resize();
  });

  // One gesture state for mouse, pen and touch. Jitter never startles feeding koi.
  canvas.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0 || breathing.isActive()) return;
    canvas.setPointerCapture(e.pointerId);
    pressState = { pointerId: e.pointerId, x: e.clientX, y: e.clientY,
      startX: e.clientX, startY: e.clientY, startTime: performance.now(),
      lastDrop: 0, fed: false, dragging: false };
  });
  canvas.addEventListener('pointermove', e => {
    if (!pressState || pressState.pointerId !== e.pointerId) return;
    pressState.x = e.clientX; pressState.y = e.clientY;
    if (Math.hypot(e.clientX - pressState.startX, e.clientY - pressState.startY) > 12) {
      pressState.dragging = true;
    }
    if (pressState.dragging && !pressState.fed) handleDrag(e.clientX, e.clientY);
    // Once feeding starts, dragging scatters food instead of frightening fish.
    if (pressState.fed) pressState.dragging = false;
  });
  canvas.addEventListener('pointerup', e => {
    if (!pressState || pressState.pointerId !== e.pointerId) return;
    if (!pressState.fed && !pressState.dragging) handleInteraction(pressState.x, pressState.y);
    pressState = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  });
  const cancelPress = () => { pressState = null; };
  canvas.addEventListener('pointercancel', cancelPress);
  canvas.addEventListener('lostpointercapture', cancelPress);
  window.addEventListener('blur', cancelPress);
  document.addEventListener('visibilitychange', () => {
    cancelPress();
    clock.reset();
    if (document.hidden) {
      cancelAnimationFrame(animationId);
      animationId = null;
    } else if (animationId === null) {
      breathing.resume();
      animationId = requestAnimationFrame(loop);
    }
  });
  animationId = requestAnimationFrame(loop);
}

export function addFish(variety) {
  // Only one of each variety allowed
  if (fish.some(f => f.varietyId === variety.nameEn)) return false;
  fish.push(createFish(variety));
  saveFish();
  return true;
}

export function removeFish(varietyNameEn) {
  const idx = fish.findIndex(f => f.varietyId === varietyNameEn);
  if (idx === -1) return false;
  fish.splice(idx, 1);
  saveFish();
  return true;
}

export function hasFish(varietyNameEn) {
  return fish.some(f => f.varietyId === varietyNameEn);
}

// Expose globally for HTML button use
if (typeof window !== 'undefined') {
  window.addFish = addFish;
  window.removeFish = removeFish;
  window.hasFish = hasFish;
}
