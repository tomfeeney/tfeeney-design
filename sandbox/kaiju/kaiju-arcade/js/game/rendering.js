import {clamp,emitter} from './state.js';
import {currentDistrict,targetKills} from './missions.js';
export class Renderer {
  constructor(canvas,assets,config,settings){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.assets=assets;this.config=config;this.settings=settings;this.audit=new Set();}
  image(key,x,y,w,h,alpha=1){const im=this.assets[key];if(!im)return;this.audit.add(key);this.ctx.save();this.ctx.globalAlpha=alpha;this.ctx.drawImage(im,x,y,w,h);this.ctx.restore();}
  cover(key,s,focus=0){const im=this.assets[key];if(!im)return;const scale=Math.max(s.width/im.width,s.height/im.height),w=im.width*scale,h=im.height*scale;this.image(key,-(w-s.width)*focus,(s.height-h)/2,w,h);}
  draw(s){const g=this.ctx,w=s.width,h=s.height;this.canvas.width!==w&&(this.canvas.width=w);this.canvas.height!==h&&(this.canvas.height=h);
    g.fillStyle='#020814';g.fillRect(0,0,w,h);const district=currentDistrict(s,this.config),red=s.monster==='mecha';
    this.cover(red?'originalWaveRed':'originalWave',s,clamp(s.time/900+s.player.x/s.width*.025,0,.5));
    if(district.scene!=='originalWave'){g.save();g.globalAlpha=.84;this.cover(district.scene,s,clamp(district.focus+s.time/600+s.player.x/s.width*.065,0,1));g.restore();}
    if(s.boss&&district.scene==='originalWave'){g.save();g.globalAlpha=.45;this.cover(red?'originalCityRed':'originalCity',s,.35);g.restore();}
    const shade=g.createLinearGradient(0,0,0,h);shade.addColorStop(0,'rgba(0,0,0,.2)');shade.addColorStop(1,'rgba(0,0,0,.65)');g.fillStyle=shade;g.fillRect(0,0,w,h);
    g.save();if(!this.settings.reducedMotion&&s.shake>0){const phase=s.time*80;g.translate(Math.sin(phase)*s.shake,Math.cos(phase*1.13)*s.shake*.6);}
    this.waves(s,false);for(const e of s.enemies)this.enemy(s,e);if(s.boss&&!s.boss.gone)this.boss(s);for(const p of s.projectiles)this.projectile(p);
    this.monster(s);if(s.beam)this.blast(s);if(s.roar>0)this.roar(s);this.waves(s,true);
    for(const p of s.particles){g.globalAlpha=clamp(p.life,0,1);g.fillStyle=p.color;g.fillRect(p.x,p.y,p.size,p.size);}g.globalAlpha=1;
    for(const r of s.rings){g.globalAlpha=clamp(r.life*2,0,1);g.strokeStyle=r.color;g.lineWidth=3;g.beginPath();g.arc(r.x,r.y,r.r+(1-r.life)*40,0,Math.PI*2);g.stroke();}g.globalAlpha=1;g.restore();
    if(s.flash&&!this.settings.reducedMotion){g.fillStyle='rgba(255,45,45,.18)';g.fillRect(0,0,w,h);}this.hud(s);
    if(s.status==='paused'){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,0,w,h);g.fillStyle='#eef7ff';g.textAlign='center';g.font='800 42px system-ui';g.fillText('Paused',w/2,h/2);g.font='16px system-ui';g.fillText('P / Start to resume',w/2,h/2+35);}
  }
  waves(s,front){const red=s.monster==='mecha',t=s.time,b=s.water;
    const layers=front?[['wavePlain',b-5,110,.5],[red?'waveRed':'waveBlue',b+45,145,.8],['wavePaint',b+115,185,1]]:[['wavePlain',b-110,85,.3],[red?'waveRed':'waveBlue',b-65,105,.4]];
    for(const [key,y,height,depth]of layers){const width=height*2.5,dx=Math.cos(t*.9)*16*depth,dy=Math.sin(t*.9)*8*depth;for(let x=-width;x<s.width+width;x+=width)this.image(key,x+dx,y-height+dy,width+1,height);}
    if(front){const g=this.ctx,fade=g.createLinearGradient(0,b+30,0,s.height);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=fade;g.fillRect(0,b+30,s.width,s.height-b);}
  }
  monster(s){const g=this.ctx,p=s.player,red=s.monster==='mecha',shield=p.invulnerable>0&&s.rings.some(r=>r.shield),normal=red?{w:414,h:414}:{w:415,h:362},size=shield?(red?{w:474,h:489}:{w:494,h:414}):normal;
    const key=red?(shield?'mechaShield':'mecha'):(shield?'godzillaShield':'godzilla'),bob=Math.sin(p.bob)*3,bottom=p.y+normal.h*.5+bob;
    g.save();g.beginPath();g.rect(0,0,s.width,s.water+14);g.clip();
    if(p.dive<.9){g.translate(p.x,bottom);g.rotate(Math.sin(p.bob*.7)*.008);this.image(key,-size.w*.5,-size.h,size.w,size.h,p.invulnerable>0&&!shield?.72:1);}g.restore();
    // An opaque ocean mask guarantees the unfinished lower edge cannot escape the waves.
    const mask=g.createLinearGradient(0,s.water+14,0,s.height);mask.addColorStop(0,'rgba(1,15,29,.5)');mask.addColorStop(.35,'rgba(1,15,29,.94)');mask.addColorStop(1,'#020814');g.fillStyle=mask;g.fillRect(0,s.water+14,s.width,s.height-s.water-14);
    if(p.dive>.2){g.strokeStyle='rgba(125,247,255,.6)';for(let i=0;i<5;i++){g.beginPath();g.arc(p.x+Math.sin(s.time+i)*25,s.water-((s.time*25+i*14)%40),3+i,0,Math.PI*2);g.stroke();}}
  }
  blast(s){const g=this.ctx,b=s.beam,red=s.monster==='mecha',height=b.over?64:48,wobble=this.settings.reducedMotion?0:Math.sin(s.time*18)*2;
    g.save();g.translate(b.x,b.y);g.rotate(b.angle);g.shadowColor=red?'#ff5e6c':'#39ff45';g.shadowBlur=this.settings.effects==='low'?0:(b.over?40:28);
    // These are the original atomic-blast textures, never a replacement line or procedural beam.
    this.image(red?'blastRed':'blastGreen',0,-height/2+wobble,b.length,height,b.over?1:.94);
    const core=g.createLinearGradient(0,0,b.length,0);core.addColorStop(0,'rgba(255,255,255,0)');core.addColorStop(.2,'rgba(255,255,255,.45)');core.addColorStop(.65,red?'rgba(255,190,190,.85)':'rgba(190,255,190,.85)');core.addColorStop(1,'rgba(255,255,255,0)');g.strokeStyle=core;g.lineWidth=b.over?6:4;g.beginPath();g.moveTo(16,wobble);g.lineTo(b.length-18,wobble);g.stroke();g.restore();
  }
  roar(s){const g=this.ctx,o=emitter(s),im=this.assets.roar,height=s.monster==='mecha'?240:252,width=height*im.width/im.height;g.save();g.translate(o.x+30,o.y);g.rotate(-.055);g.shadowColor=s.monster==='mecha'?'#ff4058':'#00cc00';g.shadowBlur=14;this.image('roar',0,-height/2,width,height,.94);g.restore();}
  enemy(s,e){const g=this.ctx;this.image(e.asset,e.x-e.width/2,e.y-e.height/2,e.width,e.height);if(e.warning>0){g.strokeStyle='#ffd166';g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,35+Math.sin(s.time*18)*5,0,Math.PI*2);g.stroke();g.fillStyle='#ffd166';g.textAlign='center';g.font='bold 11px system-ui';g.fillText(e.kind==='bomber'?'BOMB RUN':'MISSILE LOCK',e.x,e.y-e.height/2-12);}if(e.hp<e.maxHp){g.fillStyle='rgba(0,0,0,.7)';g.fillRect(e.x-35,e.y-e.height/2-8,70,4);g.fillStyle='#ffd166';g.fillRect(e.x-35,e.y-e.height/2-8,70*clamp(e.hp/e.maxHp,0,1),4);}}
  projectile(p){const g=this.ctx;g.save();g.translate(p.x,p.y);g.rotate(p.kind==='bomb'?p.age*2:Math.atan2(p.vy,p.vx)+Math.PI/2);this.image('bomb',-12,-18,24,36);g.restore();}
  boss(s){const g=this.ctx,b=s.boss,im=this.assets.destroyer;b.h=b.w*im.height/im.width;g.save();g.translate(b.x,b.y);if(b.sinking)g.rotate(clamp(b.sink/this.config.boss.sinkSeconds,0,1)*.65);this.image('destroyer',-b.w/2,-b.h*.7,b.w,b.h);g.restore();if(!b.sinking){const width=Math.min(350,s.width*.4),x=(s.width-width)/2,y=220;g.fillStyle='rgba(0,0,0,.7)';g.fillRect(x,y,width,10);g.fillStyle='#7fe7ff';g.fillRect(x,y,width*clamp(b.hp/b.maxHp,0,1),10);g.textAlign='center';g.fillStyle='#eef7ff';g.font='bold 12px system-ui';g.fillText(this.config.boss.name+' · PHASE '+(b.phase+1),s.width/2,y-12);if(!b.entering&&b.fireTimer<.8){g.strokeStyle='#ff4058';g.lineWidth=3;for(let i=0;i<this.config.boss.phases[b.phase].salvo;i++){g.beginPath();g.arc(b.x+b.w*(-.3+i*.22),b.y-50,15+Math.sin(s.time*18)*4,0,Math.PI*2);g.stroke();}}}}
  bar(x,y,width,value,color,label){const g=this.ctx;g.textAlign='left';g.font='700 12px system-ui';g.fillStyle='#eef7ff';g.fillText(label,x,y-7);g.fillStyle='rgba(0,0,0,.65)';g.fillRect(x,y,width,8);g.fillStyle=color;g.fillRect(x,y,width*clamp(value,0,1),8);}
  textFit(text,maxWidth){const g=this.ctx;let value=String(text);while(value.length>5&&g.measureText(value).width>maxWidth)value=value.slice(0,-2);return value.length<text.length?value+'…':value;}
  hud(s){const g=this.ctx,p=s.player,red=s.monster==='mecha',w=s.width,color=red?'#ff4058':'#00cc00',small=w<1000,left=24,meter=small?185:250;
    g.fillStyle='rgba(2,8,20,.6)';g.fillRect(10,10,meter+28,126);this.bar(left,38,meter,p.hp/p.maxHp,color,'Health '+Math.ceil(p.hp)+' / '+p.maxHp);this.bar(left,76,meter,p.energy/100,'#ffd700',p.exhausted?'Energy · Recharging':'Energy '+Math.floor(p.energy)+'%');this.bar(left,112,meter,p.oxygen/this.config.combat.oxygenSeconds,'#7fe7ff',p.diveRecovery>0?'Dive recharging':'Oxygen');
    g.fillStyle='#eef7ff';g.textAlign='center';g.font='900 30px system-ui';g.fillText(String(s.score).padStart(6,'0'),w/2,44);g.font='700 12px system-ui';g.fillText(s.mode==='survival'?'SURVIVAL · ROUND '+s.round:currentDistrict(s,this.config).title,w/2,70);g.fillText(s.boss?(s.boss.sinking?'ESCAPE · MOVE RIGHT':'SINK THE DESTROYER'):s.kills+' / '+targetKills(s,this.config)+' AIRCRAFT',w/2,94);
    const rx=w-120,sx=rx-170;g.textAlign='left';g.font='700 12px system-ui';g.fillText('Atomic Shield',sx,28);for(let i=0;i<3;i++)this.image('shieldIcon',sx+i*48,35,40,49,p.shield>=i+1?1:.2);g.fillText('Atomic Roar',rx,28);this.image('roarIcon',rx-5,38,98,48,p.rage>=100?1:.3);this.bar(rx,112,95,p.rage/100,color,'Rage '+Math.floor(p.rage)+'%');
    if(s.combo>1){g.textAlign='left';g.fillStyle=color;g.font='800 18px system-ui';g.fillText('CHAIN ×'+s.combo,24,170);}
    if(s.notice.until>s.time){g.textAlign='center';g.font='800 15px system-ui';g.fillStyle='#eef7ff';g.fillText(this.textFit(s.notice.title+' // '+s.notice.text,w-40),w/2,small?157:165);}
    if(s.boss?.gone){g.fillStyle='#7fe7ff';g.font='900 50px system-ui';g.textAlign='right';g.fillText('→',w-30,s.water-100);}
  }
}
