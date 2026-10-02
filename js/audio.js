import { readPreference, savePreference } from './storage.js?v=2';
const normal = document.getElementById('bg-music');
const breathing = document.getElementById('breathing-music');
const button = document.getElementById('music-btn');
const tracks = [normal, breathing];
let muted = readPreference('muted', false) === true;
let unlocked = false;
let transition = 0;
const volume = 0.35;
tracks.forEach(track => { track.volume = 0; });
function updateButton() {
  const playing = tracks.some(track => !track.paused) && !muted;
  button.classList.toggle('playing', playing);
  button.classList.toggle('paused', !playing);
  button.setAttribute('aria-pressed', String(playing));
}
async function sync(fade = true) {
  const token = ++transition;
  if (muted || document.hidden || !unlocked) {
    tracks.forEach(track => track.pause());
    updateButton();
    return;
  }
  const target = window.isBreathingRequested?.() ? breathing : normal;
  try { await target.play(); } catch { updateButton(); return; }
  if (token !== transition) return;
  updateButton();
  const starts = tracks.map(track => track.volume);
  const start = performance.now();
  const tick = now => {
    if (token !== transition) return;
    const t = fade ? Math.min(1, (now - start) / 1200) : 1;
    const eased = t * t * (3 - 2 * t);
    tracks.forEach((track, i) => {
      const end = track === target ? volume : 0;
      track.volume = starts[i] + (end - starts[i]) * eased;
      if (t === 1 && track !== target) track.pause();
    });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
window._crossfadeToBreathing = () => sync();
window._crossfadeToNormal = () => sync();
button.addEventListener('click', () => {
  muted = unlocked ? !muted : false;
  unlocked = true;
  savePreference('muted', muted);
  sync(false);
});
function unlock(event) {
  if (event.target.closest?.('#music-btn')) return;
  if (!unlocked) { unlocked = true; sync(false); }
}
document.addEventListener('pointerdown', unlock, { capture: true });
document.addEventListener('keydown', unlock, { capture: true });
document.addEventListener('visibilitychange', () => sync(false));
tracks.forEach(track => ['play', 'pause', 'ended'].forEach(event => track.addEventListener(event, updateButton)));
updateButton();
