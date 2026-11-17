import {clamp,emitter,burst,award,announce} from './state.js';
import {finishRun} from './missions.js';
export function beamHit(beam,target,radius=30){const dx=target.x-beam.x,dy=target.y-beam.y,t=dx*Math.cos(beam.angle)+dy*Math.sin(beam.angle);return t>=0&&t<=beam.length&&Math.abs(-dx*Math.sin(beam.angle)+dy*Math.cos(beam.angle))<radius+beam.thickness*.5;}
export function damagePlayer(s,c,amount,x,y){
  const p=s.player;if(p.invulnerable>0||p.dive>.85||s.status!=='playing')return false;
  p.invulnerable=.65;
  if(p.shield>=1){p.shield-=1;s.stats.blocks++;s.events.push({type:'sound',name:'shield_hit'});s.rings.push({x:p.x,y:p.y-35,r:100,life:.5,color:s.monster==='mecha'?'#ff4058':'#00cc00',shield:true});}
  else{p.hp=Math.max(0,p.hp-amount);s.combo=0;s.flash=.2;s.events.push({type:'sound',name:'bomb_impact'});if(p.hp===0)finishRun(s,c,false);}
  burst(s,x,y,'#7fe7ff',12);return true;
}
export function killEnemy(s,c,e){if(e.dead)return;e.dead=true;s.totalKills++;s.kills++;s.combo++;s.comboTimer=5;s.player.rage=clamp(s.player.rage+c.combat.ragePerKill,0,100);s.player.energy=clamp(s.player.energy+5,0,100);s.player.shield=clamp(s.player.shield+.15,0,3);award(s,'aircraft',e.score*(1+Math.min(10,s.combo-1)*.15));burst(s,e.x,e.y,'#ffd166',32);s.events.push({type:'sound',name:'jet_explosion'});}
export function fireBeam(s,c,dt,held){
  const p=s.player;
  if(!held||p.dive>.15||s.roar>0||p.energy<=0||p.exhausted){s.beam=null;return;}
  const profile=c.profiles[s.monster],origin=emitter(s);
  const targets=s.enemies.filter(e=>!e.dead&&e.x>origin.x&&e.x<s.width+30);
  if(s.boss&&!s.boss.sinking&&!s.boss.entering)targets.push({x:s.boss.x-s.boss.w*.28,y:s.boss.y-60,priority:100});
  let target=targets.sort((a,b)=>(Math.hypot(a.x-origin.x,a.y-origin.y)-(a.priority||0))-(Math.hypot(b.x-origin.x,b.y-origin.y)-(b.priority||0)))[0];
  const desired=target?Math.atan2(target.y-origin.y,target.x-origin.x):-.02;p.aim+=(clamp(desired,-.8,.4)-p.aim)*Math.min(1,dt*12);
  const energized=p.energy>70;s.beam={...origin,angle:p.aim,length:c.combat.beamRange,thickness:energized?38:28,over:energized};
  p.energy=clamp(p.energy-profile.energyDrain*dt,0,100);if(p.energy===0){p.exhausted=true;announce(s,'ENERGY DEPLETED','Recover energy before firing again.',2);}s.stats.shots+=dt;
  const damage=profile.damage*p.power*(energized?1.2:1)*dt;let hit=false;
  for(const e of s.enemies)if(!e.dead&&beamHit(s.beam,e,e.kind==='bomber'?55:35)){e.hp-=damage;s.stats.damage+=damage;hit=true;if(e.hp<=0)killEnemy(s,c,e);}
  for(const projectile of s.projectiles)if(projectile.kind!=='bomb'&&beamHit(s.beam,projectile,12)){projectile.hp-=damage;if(projectile.hp<=0&&!projectile.dead){projectile.dead=true;award(s,'missile',75);burst(s,projectile.x,projectile.y,'#7fe7ff',8);}}
  const boss=s.boss;
  if(boss&&!boss.sinking&&!boss.entering&&beamHit(s.beam,{x:boss.x-boss.w*.2,y:boss.y-50},65)){boss.hp-=damage;s.stats.damage+=damage;hit=true;if(boss.hp<=0)sinkBoss(s,c);}
  if(hit){s.stats.beamHits+=dt;s.shake=Math.max(s.shake,2);}
  s.events.push({type:'beamSound',name:s.monster==='mecha'?'mecha_laser_fire':'atomic_breath_fire'});
}
export function startRoar(s,c){
  const p=s.player;if(s.status!=='playing'||p.rage<100||p.energy<c.combat.roarCost||p.dive>.15||s.roar>0)return false;
  p.rage=0;p.energy-=c.combat.roarCost;s.roar=c.combat.roarDuration;s.roarHit=false;s.beam=null;announce(s,'ATOMIC ROAR','Shockwave breaks the formation.',2);s.events.push({type:'roar',monster:s.monster});return true;
}
export function updateRoar(s,c,dt){if(s.roar<=0)return;s.roar-=dt;if(s.roarHit)return;s.roarHit=true;const p=s.player;s.projectiles.forEach(b=>{if(!b.dead){b.dead=true;award(s,'roarInterception',20);burst(s,b.x,b.y,'#7fe7ff',5);}});for(const e of s.enemies){e.hp-=c.profiles[s.monster].roarDamage*p.power;if(e.hp<=0)killEnemy(s,c,e);}if(s.boss&&!s.boss.sinking&&!s.boss.entering){s.boss.hp-=45*p.power;if(s.boss.hp<=0)sinkBoss(s,c);}s.shake=15;burst(s,p.x,p.y-70,s.monster==='mecha'?'#ff4058':'#00cc00',55);}
export function sinkBoss(s,c){const boss=s.boss;if(!boss||boss.sinking)return;boss.hp=0;boss.sinking=true;boss.sink=0;boss.startY=boss.y;boss.startX=boss.x;s.projectiles=[];s.enemies=[];s.beam=null;award(s,'destroyer',c.boss.score);burst(s,boss.x,boss.y-50,'#ffa65f',100);announce(s,'DESTROYER SUNK','The channel is open. Move right after the ship disappears.',6);s.events.push({type:'sound',name:'city_crash'});}
