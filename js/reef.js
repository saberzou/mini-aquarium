// Small, deterministic coral gardens frame an open swimming area.
export class ReefManager {
 constructor(w,h){this.time=0;this.generate(w,h);}
 generate(w,h){this.w=w;this.h=h;this.scale=Math.min(1.3,Math.max(.7,w/650));this.gardens=[{x:w*.04,y:h*.81,s:1.2},{x:w*.94,y:h*.72,s:1},{x:w*.13,y:h*.2,s:.58},{x:w*.78,y:h*.96,s:.85}];}
 nudge(){/* Coral is anchored to the seabed. */}
 update(){this.time+=1/60;}
 draw(ctx){const t=this.time;ctx.save();
 // Pale sand shelves fade into the lagoon, with quiet grain and shell fragments.
 for(const [idx,p] of this.gardens.entries()){
 const s=this.scale*p.s;ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
 const sand=ctx.createRadialGradient(0,0,15,0,0,170);sand.addColorStop(0,'rgba(219,221,187,.5)');sand.addColorStop(.6,'rgba(191,216,188,.22)');sand.addColorStop(1,'rgba(183,211,186,0)');ctx.fillStyle=sand;ctx.fillRect(-175,-175,350,350);
 for(let i=0;i<42;i++){let a=i*2.399,r=25+Math.sqrt(i)*19;ctx.fillStyle=i%2?'rgba(232,237,210,.28)':'rgba(49,125,139,.12)';ctx.beginPath();ctx.ellipse(Math.cos(a)*r,Math.sin(a)*r*.75,1.6,1,0,0,Math.PI*2);ctx.fill();}
 // Rounded limestone under the coral colonies.
 for(let i=0;i<5;i++){let x=Math.cos(i*2)*49,y=Math.sin(i*2)*32;ctx.fillStyle=['#749F9E','#86ABA1','#8EB5A5'][i%3];ctx.beginPath();ctx.ellipse(x,y,36+i*2,24+i*2,i,0,Math.PI*2);ctx.fill();}
 // Branching coral fans: rounded, tapered branches with illuminated tips.
 const branch=(x,y,len,a,depth,color)=>{const xx=x+Math.cos(a)*len,yy=y+Math.sin(a)*len;ctx.strokeStyle=color;ctx.lineWidth=depth*2.2+1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+xx)/2+3,(y+yy)/2,xx,yy);ctx.stroke();if(depth>0){branch(xx,yy,len*.68,a-.5,depth-1,color);branch(xx,yy,len*.65,a+.46,depth-1,color);}else{ctx.fillStyle='#F3D0AB';ctx.beginPath();ctx.arc(xx,yy,2.1,0,Math.PI*2);ctx.fill();}};
 // Branching colonies spread radially when viewed from above.
 for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;
   branch(-27,-8,17,angle,2,'#D99482');}
 for(let i=0;i<6;i++)branch(38,22,13,i*Math.PI/3+.3,2,'#D2B886');
 // Sea-grass crowns: leaves radiate from rooted centers, not an upright fringe.
 for(const [gx,gy] of [[-49,35],[20,-39]])for(let i=0;i<8;i++){
   const a=i*Math.PI/4+.3, length=23+(i%3)*8, sway=Math.sin(t*.6+i)*.12;
   ctx.strokeStyle=i%2?'#5D9E91':'#76B4A0';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(gx,gy);
   ctx.quadraticCurveTo(gx+Math.cos(a+sway)*length*.5,gy+Math.sin(a+sway)*length*.5,gx+Math.cos(a+.25+sway)*length,gy+Math.sin(a+.25+sway)*length);ctx.stroke();}
 // Anemone rosette and small clustered polyps.
 for(let i=0;i<20;i++){const a=i*Math.PI*2/20,r=21+Math.sin(t*.5+i)*2;ctx.strokeStyle=i%2?'#DDA394':'#EAB9A0';ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(-15,-5);ctx.quadraticCurveTo(-15+Math.cos(a)*r*.65,-5+Math.sin(a)*r*.65,-15+Math.cos(a)*r,-5+Math.sin(a)*r);ctx.stroke();}
 for(let i=0;i<13;i++){const a=i*2.4,r=Math.sqrt(i)*6;ctx.fillStyle=i%2?'#B0CBA7':'#9AB8A0';ctx.beginPath();ctx.arc(40+Math.cos(a)*r,-12+Math.sin(a)*r,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#D3DAB5';ctx.beginPath();ctx.arc(39+Math.cos(a)*r,-14+Math.sin(a)*r,2,0,Math.PI*2);ctx.fill();}
 ctx.restore();}
 ctx.restore();}
}
