import { Duck } from './duck.js?v=20261002c';
import { Dragonfly } from './dragonfly.js?v=20261002c';
import { Turtle } from './turtle.js?v=20261002c';
import { readPreference, savePreference } from './storage.js?v=20261002';

export const ANIMALS = [
  { id: 'duck', name: '白鸭', nameEn: 'White duck', desc: '悠然游过水面', descEn: 'A gentle surface swimmer' },
  { id: 'ducklings', name: '小黄鸭', nameEn: 'Ducklings', desc: '结伴游泳的两只小鸭', descEn: 'Two little swimming companions' },
  { id: 'turtle', name: '乌龟', nameEn: 'Turtle', desc: '慢悠悠的池塘访客', descEn: 'An unhurried pond companion' },
  { id: 'dragonfly', name: '蜻蜓', nameEn: 'Dragonfly', desc: '晴天偶尔飞过 · 呼吸时休息', descEn: 'Sunny flybys · rests during breathing' },
];
export class AnimalManager {
  constructor(w, h) {
    this.w = w; this.h = h; this.residents = new Map();
    const saved = readPreference('animals', ['duck', 'dragonfly']);
    const enabled = Array.isArray(saved) ? saved : ['duck', 'dragonfly'];
    enabled.forEach(id => this.setEnabled(id, true, false));
  }
  has(id) { return this.residents.has(id); }
  setEnabled(id, enabled, persist = true) {
    if (!ANIMALS.some(animal => animal.id === id)) return false;
    if (!enabled) this.residents.delete(id);
    else if (!this.has(id)) {
      const x = this.w * (0.35 + Math.random() * 0.3), y = this.h * (0.35 + Math.random() * 0.3);
      if (id === 'duck') this.residents.set(id, [new Duck(x,y)]);
      if (id === 'ducklings') this.residents.set(id, [new Duck(x,y,true),new Duck(x-38,y+24,true)]);
      if (id === 'turtle') this.residents.set(id, [new Turtle(x,y)]);
      if (id === 'dragonfly') {
        const fly = new Dragonfly(this.w,this.h);
        // New selection gets a visible flyby immediately; saved visitors retain their natural cadence.
        if (persist) { fly.active = true; fly.x = x; fly.y = y; }
        this.residents.set(id, [fly]);
      }
    }
    if (persist) savePreference('animals', [...this.residents.keys()]);
    return true;
  }
  resize(w,h) { this.w=w;this.h=h;for(const group of this.residents.values()) group.forEach(a=>a.resize(w,h)); }
  poke(x,y) { for(const group of this.residents.values()) group.forEach(a=>a.poke?.(x,y)); }
  update(ripples,fish,lotus,weather,breathing) {
    const slow = breathing ? 0.3 : 1;
    const duck = this.residents.get('duck')?.[0];
    if (duck) { duck.setBreathingSlowdown(slow); duck.update(this.w,this.h,ripples,breathing ? [] : fish,lotus); }
    let leader = duck;
    for (const baby of this.residents.get('ducklings') || []) {
      baby.setBreathingSlowdown(slow); baby.update(this.w,this.h,ripples,breathing ? [] : fish,lotus,leader); leader = baby;
    }
    this.residents.get('turtle')?.[0].update(this.w,this.h,ripples,lotus,slow);
    if(weather !== 'rainy' && !breathing) this.residents.get('dragonfly')?.[0].update();
  }
  draw(ctx, weather, breathing) {
    for (const id of ['turtle','duck','ducklings']) this.residents.get(id)?.forEach(a=>a.draw(ctx));
    if(weather !== 'rainy' && !breathing) this.residents.get('dragonfly')?.[0].draw(ctx);
  }
}
export function drawAnimalPreview(canvas, id) {
  const ctx = canvas.getContext('2d');
  const x=canvas.width/2, y=canvas.height/2;
  let specimens=[];
  if(id==='duck') specimens=[new Duck(x,y)];
  if(id==='ducklings') specimens=[new Duck(x-22,y-8,true),new Duck(x+22,y+8,true)];
  if(id==='turtle') specimens=[new Turtle(x,y)];
  if(id==='dragonfly') { const fly=new Dragonfly(canvas.width,canvas.height);fly.active=true;fly.x=x;fly.y=y;fly.size=15;fly.shadowOffX=2;fly.shadowOffY=4;specimens=[fly]; }
  specimens.forEach(a=>{a.angle=-0.25;a.draw(ctx);});
}
