// Run with: node --experimental-vm-modules tests/regression.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let now = 0;
let nextId = 0;
const frames = new Map();
const data = new Map();
const noop = () => {};
const context2d = new Proxy({}, {get: (_, name) => name === 'createImageData' ? (w,h) => ({data:new Uint8ClampedArray(w*h*4)}) : name.startsWith('create') ? () => ({addColorStop: noop}) : noop});
class Element {
  constructor() {
    this.listeners = {}; this.style = {}; this.dataset = {}; this.attributes = {};
    const classes = new Set();
    this.classList = {toggle: (name, on) => on ? classes.add(name) : classes.delete(name), add: name => classes.add(name), remove: name => classes.delete(name)};
  }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, value = {}) { this.listeners[name]?.forEach(fn => fn(value)); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getContext() { return context2d; }
  setPointerCapture() {}
  hasPointerCapture() { return true; }
  releasePointerCapture() {}
}
const elements = new Map();
const document = new Element();
document.hidden = false;
document.createElement = () => new Element();
document.getElementById = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
document.querySelectorAll = () => [];
const window = new Element();
Object.assign(window, {innerWidth: 390, innerHeight: 844, devicePixelRatio: 3, matchMedia: () => ({matches: true})});
const sandbox = vm.createContext({window, document, console, performance: {now: () => now},
  localStorage: {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key,value)},
  requestAnimationFrame: fn => { frames.set(++nextId, fn); return nextId; },
  cancelAnimationFrame: id => frames.delete(id), Math, setTimeout, clearTimeout});
const cache = new Map();
function getModule(file) {
  const full = path.resolve(root, file.split('?')[0]);
  if (!cache.has(full)) cache.set(full, new vm.SourceTextModule(fs.readFileSync(full,'utf8'), {context:sandbox, identifier:full}));
  return cache.get(full);
}
async function load(file) {
  const mod = getModule(file);
  if(mod.status === 'unlinked') await mod.link((specifier, parent) => getModule(path.resolve(path.dirname(parent.identifier), specifier)));
  if(mod.status === 'linked') await mod.evaluate();
  return mod.namespace;
}
function tick(ms) { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); }
(async () => {
  for (const file of fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js'))) getModule(`js/${file}`);
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(!body.trim()) continue;
    if(attrs.includes('module')) new vm.SourceTextModule(body); else new vm.Script(body);
  }
  console.log('PASS all modules and inline scripts parse');
  const { SimulationClock } = await load('js/clock.js');
  const { FoodManager } = await load('js/food.js');
  for(const fps of [30,60,120,144]) {
    const clock = new SimulationClock(); const food = new FoodManager(); food.add(100,100);
    let steps=0;
    for(let frame=0;frame<=fps*9;frame++) clock.advance(frame*1000/fps,()=>{steps++;food.update();});
    assert.equal(steps,540); assert.equal(food.pellets.length,0);
  }
  console.log('PASS identical 9-second pellet lifetime at 30/60/120/144fps');
  const pond = await load('js/pond.js'); pond.init();
  const config = await load('js/config.js');
  assert.equal(config.KOI_VARIETIES.filter(v=>pond.hasFish(v.nameEn)).length,7);
  assert.equal(pond.addFish(config.KOI_VARIETIES[0]),false);
  assert.equal(pond.removeFish('Kohaku'),true);
  assert.equal(pond.hasFish('Kohaku'),false);
  assert.equal(JSON.parse(data.get('koi-fish')).includes('Kohaku'),false);
  assert.equal(pond.addFish(config.KOI_VARIETIES[0]),true);
  console.log('PASS initial fish identity, duplicate prevention, add/remove persistence');
  window.setWeather('rainy'); assert.equal(JSON.parse(data.get('koi-weather')),'rainy');
  const { FoodManager: Food } = await load('js/food.js');
  let drops=0; const original=Food.prototype.add;
  Food.prototype.add=function(...args) {drops++;return original.apply(this,args);};
  const { Fish } = await load('js/fish.js');
  let flees=0; Fish.prototype.flee=()=>flees++;
  const canvas = document.getElementById('fish-canvas');
  const pointer={pointerId:1,isPrimary:true,button:0,clientX:180,clientY:320};
  tick(17); canvas.emit('pointerdown',pointer);
  canvas.emit('pointermove',{...pointer,clientX:182});
  for(let i=0;i<30;i++)tick(1000/60);
  assert.ok(drops>0); assert.equal(flees,0);
  canvas.emit('pointercancel',pointer);
  const stopped=drops;
  for(let i=0;i<30;i++)tick(1000/60);
  assert.equal(drops,stopped);
  canvas.emit('pointerdown',pointer); canvas.emit('pointerup',pointer); assert.ok(flees>0);
  console.log('PASS jitter-tolerant feeding, pointer cancellation, tap ripples/flee');
  assert.equal(window.toggleBreathing(),true);tick(100);
  assert.equal(window.toggleBreathing(),false);tick(16);
  assert.equal(window.toggleBreathing(),true);
  assert.equal(window.isBreathingRequested(),true);
  document.hidden=true;document.emit('visibilitychange');assert.equal(frames.size,0);
  document.hidden=false;document.emit('visibilitychange');assert.equal(frames.size,1);tick(16);
  console.log('PASS rapid breathing reversal and background pause/resume');
  for (const id of ['bg-music','breathing-music']) {
    const audio=document.getElementById(id);
    audio.paused=true;audio.volume=0;
    audio.play=async()=>{audio.paused=false;audio.emit('play');};
    audio.pause=()=>{audio.paused=true;audio.emit('pause');};
  }
  let wantsBreathing=false;
  window.isBreathingRequested=()=>wantsBreathing;
  await load('js/audio.js');
  document.getElementById('music-btn').emit('click');await new Promise(resolve => setImmediate(resolve));tick(16);
  assert.equal(document.getElementById('bg-music').paused,false);
  wantsBreathing=true;window._crossfadeToBreathing();await new Promise(resolve => setImmediate(resolve));tick(100);
  wantsBreathing=false;window._crossfadeToNormal();await new Promise(resolve => setImmediate(resolve));tick(100);
  wantsBreathing=true;window._crossfadeToBreathing();await new Promise(resolve => setImmediate(resolve));
  for(let i=0;i<80;i++)tick(1000/60);
  assert.equal(document.getElementById('bg-music').paused,true);
  assert.equal(document.getElementById('breathing-music').paused,false);
  assert.ok(Math.abs(document.getElementById('breathing-music').volume-.35)<.001);
  document.getElementById('music-btn').emit('click');await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.getElementById('breathing-music').paused,true);
  assert.equal(JSON.parse(data.get('koi-muted')),true);
  console.log('PASS first music click, competing crossfades, mute persistence');
  const {AnimalManager}=await load('js/animals.js');
  const residents=new AnimalManager(390,844);
  assert.equal(residents.has('duck'),true);assert.equal(residents.has('dragonfly'),true);
  residents.setEnabled('ducklings',true);residents.setEnabled('ducklings',true);
  residents.setEnabled('turtle',true);residents.setEnabled('duck',false);
  assert.equal(residents.residents.get('ducklings').length,2);
  assert.equal(residents.setEnabled('unknown',true),false);
  const restored=new AnimalManager(390,844);
  assert.equal(restored.has('duck'),false);assert.equal(restored.has('ducklings'),true);assert.equal(restored.has('turtle'),true);
  const fly=restored.residents.get('dragonfly')[0];const timer=fly.timer;
  restored.update({add:noop},[],{pads:[]},'rainy',false);assert.equal(fly.timer,timer);
  restored.update({add:noop},[],{pads:[]},'sunny',true);assert.equal(fly.timer,timer);
  for(let i=0;i<600;i++)restored.update({add:noop},[],{pads:[]},'sunny',false);
  restored.resize(320,568);restored.draw(context2d,'sunny',false);
  for(const group of restored.residents.values())for(const animal of group)assert.ok(Number.isFinite(animal.x)&&Number.isFinite(animal.y));
  restored.setEnabled('dragonfly',false);restored.setEnabled('turtle',false);restored.setEnabled('ducklings',false);
  assert.equal(restored.residents.size,0);
  console.log('PASS animal toggles, persistence, duckling pair, weather/breathing and resize');
  const {readPreference,savePreference}=await load('js/storage.js');
  sandbox.localStorage.getItem=()=>{throw Error('blocked');};sandbox.localStorage.setItem=()=>{throw Error('blocked');};
  assert.equal(readPreference('test','fallback'),'fallback');savePreference('test',1);
  console.log('PASS unavailable storage fallback');
})().catch(error=>{console.error(error);process.exitCode=1;});
