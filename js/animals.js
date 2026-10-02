import { readPreference, savePreference } from './storage.js?v=2';
export const ANIMALS = [
 {id:'turtle',name:'海龟',nameEn:'Sea turtle',desc:'悠然划动鳍肢',descEn:'Slow, sweeping flippers'},
 {id:'ray',name:'蓝点鳐',nameEn:'Blue-spotted ray',desc:'轻轻掠过海底',descEn:'Glides above the sand'},
 {id:'jelly',name:'月亮水母',nameEn:'Moon jelly',desc:'半透明的海中舞者',descEn:'A translucent little drifter'},
 {id:'octopus',name:'小章鱼',nameEn:'Octopus',desc:'好奇的珊瑚礁邻居',descEn:'A curious reef explorer'},
 {id:'crab',name:'螃蟹',nameEn:'Crab',desc:'在沙地上横着走的小伙伴',descEn:'A little sideways sand explorer'},
 {id:'star',name:'海星',nameEn:'Sea star',desc:'沙地上的珊瑚色星星',descEn:'A coral-colored sand dweller'}
];
const oval=(ctx,x,y,rx,ry,color,angle=0)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);ctx.fill();};
export class SeaAnimal {
 constructor(id,x,y){this.id=id;this.x=x;this.y=y;this.angle=Math.random()*6.28;this.targetAngle=this.angle;this.phase=Math.random()*6.28;this.timer=0;this.size=id==='ray'?34:id==='turtle'?26:23;}
 resize(w,h){this.x=Math.max(30,Math.min(w-30,this.x));this.y=Math.max(90,Math.min(h-80,this.y));}
 poke(x,y){if(Math.hypot(x-this.x,y-this.y)<130){this.targetAngle=Math.atan2(this.y-y,this.x-x);this.timer=90;}}
 update(w,h,slow){this.phase+=.025*slow;if(--this.timer<=0){this.targetAngle+=(Math.random()-.5)*1.2;this.timer=140+Math.random()*120;}
 const margin=70;if(this.x<margin)this.targetAngle=0;if(this.x>w-margin)this.targetAngle=Math.PI;if(this.y<100)this.targetAngle=Math.PI/2;if(this.y>h-margin)this.targetAngle=-Math.PI/2;
 let delta=Math.atan2(Math.sin(this.targetAngle-this.angle),Math.cos(this.targetAngle-this.angle));this.angle+=delta*.018;
 const speed=({ray:.44,turtle:.3,jelly:.14,octopus:.16,crab:.22,star:.008})[this.id]*slow;
 this.x+=Math.cos(this.angle)*speed;this.y+=Math.sin(this.angle)*speed;}
 draw(ctx){const s=this.size,t=this.phase;ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.scale(s,s);
 if(this.id==='turtle'||this.id==='ray')oval(ctx,.12,.2,1,.65,'rgba(12,61,77,.08)');
 if(this.id==='turtle'){
  const stroke=Math.sin(t)*.15;
  for(const side of [-1,1]){oval(ctx,.4,side*.82,.58,.19,'#82AE9A',side*(.7+stroke));oval(ctx,-.68,side*.56,.37,.14,'#719C87',side*-.55);}
  oval(ctx,1.03,0,.32,.25,'#AFC8A0');oval(ctx,-.99,0,.21,.09,'#85A888');
  oval(ctx,0,0,1,.72,'#B5CB9C');oval(ctx,-.02,-.03,.89,.63,'#547F79');
  ctx.strokeStyle='#A5BE95';ctx.lineWidth=.035;ctx.beginPath();
  for(let i=0;i<=6;i++){let a=i*Math.PI/3;let x=Math.cos(a)*.47,y=Math.sin(a)*.4;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  for(let i=0;i<6;i++){let a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*.47,Math.sin(a)*.4);ctx.lineTo(Math.cos(a)*.88,Math.sin(a)*.61);ctx.stroke();}
  oval(ctx,-.22,-.25,.37,.15,'rgba(211,228,188,.16)',-.35);
  for(const side of [-1,1])oval(ctx,1.17,side*.13,.035,.04,'#23474A');
 }
 if(this.id==='ray'){
  ctx.strokeStyle='#526F7C';ctx.lineWidth=.065;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-.6,0);ctx.bezierCurveTo(-1.3,.06,-1.8,Math.sin(t)*.3,-2.15,.12);ctx.stroke();
  const wing=1.15+Math.sin(t)*.12;ctx.fillStyle='#809FA6';ctx.beginPath();ctx.moveTo(.98,0);ctx.bezierCurveTo(.45,-.28,.15,-wing,-.25,-wing);ctx.quadraticCurveTo(-.65,-.75,-.88,0);ctx.quadraticCurveTo(-.65,.75,-.25,wing);ctx.bezierCurveTo(.15,wing,.45,.28,.98,0);ctx.fill();
  oval(ctx,.13,0,.65,.31,'rgba(192,212,201,.24)');
  for(let i=0;i<15;i++){const a=i*2.4,r=.23+(i%3)*.18;oval(ctx,-.12+Math.cos(a)*r,Math.sin(a)*r*1.2,.047,.042,'#8CDEE0');}
  for(const side of [-1,1])oval(ctx,.56,side*.14,.043,.033,'#294D59');
 }
 if(this.id==='jelly'){
  // Circular bell from above; short tentacles show through and around the rim.
  const pulse=1+Math.sin(t*1.8)*.08;
  ctx.strokeStyle='rgba(222,244,246,.35)';ctx.lineWidth=.025;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*.45,Math.sin(a)*.45);ctx.quadraticCurveTo(Math.cos(a+.15)*.78,Math.sin(a+.15)*.78,Math.cos(a+Math.sin(t+i)*.12)*.97,Math.sin(a+Math.sin(t+i)*.12)*.97);ctx.stroke();}
  oval(ctx,0,0,.77*pulse,.77*pulse,'rgba(209,235,241,.35)');
  ctx.strokeStyle='rgba(238,253,249,.6)';ctx.lineWidth=.025;ctx.beginPath();ctx.arc(0,0,.77*pulse,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<4;i++){let a=i*Math.PI/2;oval(ctx,Math.cos(a)*.21,Math.sin(a)*.21,.16,.12,'rgba(219,177,199,.55)',a);}
  oval(ctx,-.21,-.24,.22,.14,'rgba(248,255,251,.18)',-.4);
 }
 if(this.id==='octopus'){
  // Eight arms crawl across the substrate around the mantle.
  ctx.lineCap='round';
  for(let i=0;i<8;i++){const a=i*Math.PI/4, curl=Math.sin(t+i)*.13;
    ctx.strokeStyle=i%2?'#CE9182':'#DBA192';ctx.lineWidth=.17;ctx.beginPath();ctx.moveTo(Math.cos(a)*.25,Math.sin(a)*.25);
    ctx.bezierCurveTo(Math.cos(a)*.8,Math.sin(a)*.8,Math.cos(a+.35+curl)*1.2,Math.sin(a+.35+curl)*1.2,Math.cos(a+.5)*.99,Math.sin(a+.5)*.99);ctx.stroke();}
  oval(ctx,.14,0,.59,.47,'#D99A88');oval(ctx,.22,-.13,.25,.13,'rgba(255,223,195,.2)',-.3);
  for(const side of [-1,1])oval(ctx,-.25,side*.24,.05,.04,'#34545B');
 }
 if(this.id==='crab'){
  // Overhead carapace; heading is lateral to the forward-facing eyes/claws.
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const side of [-1,1]){
   for(let i=0;i<4;i++){
    const y=-.26+i*.22,step=Math.sin(t*4+i*Math.PI*.7+side)*.07;
    ctx.strokeStyle=i%2?'#C8775B':'#D78B6B';ctx.lineWidth=.075;
    ctx.beginPath();ctx.moveTo(side*.48,y);ctx.lineTo(side*(.86+step),y+.04);ctx.lineTo(side*(1.06+step),y+.27);ctx.stroke();
   }
   const lift=Math.sin(t*1.5+side)*.045;
   ctx.strokeStyle='#C8775B';ctx.lineWidth=.13;ctx.beginPath();ctx.moveTo(side*.45,-.3);ctx.lineTo(side*.79,-.62);ctx.lineTo(side*.76,-.93+lift);ctx.stroke();
   oval(ctx,side*.76,-.94+lift,.22,.27,'#DE9676',side*.2);
   // Two curved fingers leave an open pincer gap.
   ctx.strokeStyle='#E7AA88';ctx.lineWidth=.105;
   for(const finger of [-1,1]){ctx.beginPath();ctx.moveTo(side*.76+finger*.14,-1.05+lift);ctx.quadraticCurveTo(side*.76+finger*.19,-1.29+lift,side*.76+finger*.065,-1.36+lift);ctx.stroke();}
  }
  oval(ctx,0,.035,.7,.5,'rgba(51,82,78,.10)');
  oval(ctx,0,0,.68,.47,'#D68A6C');oval(ctx,0,-.045,.59,.38,'#E3A07C');
  oval(ctx,-.12,-.16,.31,.14,'rgba(255,228,189,.22)',-.15);
  ctx.strokeStyle='#C98064';ctx.lineWidth=.028;ctx.beginPath();ctx.moveTo(-.3,.08);ctx.quadraticCurveTo(0,.22,.3,.08);ctx.stroke();
  for(const side of [-1,1]){ctx.strokeStyle='#CB8265';ctx.lineWidth=.08;ctx.beginPath();ctx.moveTo(side*.23,-.33);ctx.lineTo(side*.28,-.53);ctx.stroke();oval(ctx,side*.28,-.54,.065,.07,'#294F55');oval(ctx,side*.265,-.56,.017,.019,'#FAEAD1');}
 }
 if(this.id==='star'){
  ctx.rotate(-.2);ctx.fillStyle='#D99276';ctx.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5,r=i%2?.4:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ECC0A0';ctx.lineWidth=.05;ctx.lineCap='round';for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*.76,Math.sin(a)*.76);ctx.stroke();for(let j=1;j<4;j++)oval(ctx,Math.cos(a)*j*.2,Math.sin(a)*j*.2,.034,.034,'#F4D5B1');}
 }
 ctx.restore();}
}
export class AnimalManager {
 constructor(w,h){this.w=w;this.h=h;this.residents=new Map();const saved=readPreference('animals',['turtle','ray','star']);(Array.isArray(saved)?saved:['turtle','ray','star']).forEach(id=>this.setEnabled(id,true,false));}
 has(id){return this.residents.has(id);}
 setEnabled(id,enabled,persist=true){if(!ANIMALS.some(a=>a.id===id))return false;if(!enabled)this.residents.delete(id);else if(!this.has(id)){const a=new SeaAnimal(id,this.w*(.25+Math.random()*.5),this.h*(id==='star'?.8:.3+Math.random()*.4));this.residents.set(id,[a]);}if(persist)savePreference('animals',[...this.residents.keys()]);return true;}
 resize(w,h){this.w=w;this.h=h;for(const group of this.residents.values())group.forEach(a=>a.resize(w,h));}
 poke(x,y){for(const group of this.residents.values())group.forEach(a=>a.poke(x,y));}
 update(ripples,fish,reef,weather,breathing){for(const group of this.residents.values())group.forEach(a=>a.update(this.w,this.h,breathing?.3:1));}
 drawLayer(ctx, layer) {
  const ids={seabed:['star','octopus','crab'],low:['ray'],upper:['turtle'],surface:['jelly']}[layer] || [];
  for(const id of ids)this.residents.get(id)?.forEach(a=>a.draw(ctx));
 }
 draw(ctx){for(const layer of ['seabed','low','upper','surface'])this.drawLayer(ctx,layer);}
}
export function drawAnimalPreview(canvas,id){const ctx=canvas.getContext('2d');const animal=new SeaAnimal(id,canvas.width*.56,canvas.height*.5);animal.angle=-.15;animal.phase=1;animal.size=id==='ray'?29:29;animal.draw(ctx);}
