import {clamp,burst,announce,award} from './state.js';
import {currentDistrict,nextEncounter,finishRun} from './missions.js';
import {damagePlayer,fireBeam,startRoar,updateRoar} from './combat.js';
export function spawnEnemy(s,c,kind){const d=currentDistrict(s,c),def=c.enemies[kind],difficulty=c.difficulties[s.difficulty];if(!def)throw Error('Unknown enemy role '+kind);const y=s.height*(kind==='bomber'?.23:.2+s.random()*.27);s.enemies.push({...def,kind,x:s.width+def.width,y,baseY:y,hp:def.health*d.healthScale*difficulty.enemyHealth*(s.mode==='survival'?1+(s.round-1)*.12:1),maxHp:def.health*d.healthScale*difficulty.enemyHealth,width:def.width,height:def.height,speed:def.speed*difficulty.enemySpeed,damage:def.damage*difficulty.enemyDamage,t:s.random()*5,warning:0,cooldown:1.5+s.random()*2,attacks:0,asset:kind==='bomber'?(s.round%2?'bomber1':'bomber2'):kind==='gunship'&&s.round>1?'jet3':def.asset});}
function chooseEnemy(s,c){const weights=currentDistrict(s,c).weights,sum=Object.values(weights).reduce((a,b)=>a+b,0);let value=s.random()*sum;for(const [role,weight]of Object.entries(weights)){value-=weight;if(value<0)return role;}return 'interceptor';}
function launch(s,c,e){
  const p=s.player;if(s.projectiles.length>=c.combat.maxProjectiles)return;
  if(e.kind==='bomber'){for(let i=-1;i<=1&&s.projectiles.length<c.combat.maxProjectiles;i++)s.projectiles.push({kind:'bomb',x:e.x+i*30,y:e.y+25,vx:-20+i*18,vy:70,damage:e.damage,hp:100,life:8,age:0});}
  else{const angle=Math.atan2(p.y-40-e.y,p.x-e.x),speed=e.kind==='gunship'?210:170;s.projectiles.push({kind:'missile',x:e.x-40,y:e.y+18,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage:e.damage,hp:12,life:7,age:0});}
  s.events.push({type:'sound',name:e.kind==='bomber'?'warning_alert':'enemy_hit_tick'});
}
function updateBoss(s,c,dt){const b=s.boss;if(!b)return;b.t+=dt;
  if(b.sinking){b.sink+=dt;b.x=b.startX+b.sink*10;b.y=b.startY+Math.pow(clamp(b.sink/c.boss.sinkSeconds,0,1),2)*270;if(s.random()<dt*15)burst(s,b.x+(s.random()-.5)*b.w*.5,s.water,'#7fe7ff',5,90);if(b.sink>=c.boss.sinkSeconds){b.gone=true;if(s.player.x>s.width+100)finishRun(s,c,true);}return;}
  const target=s.width*.78;if(b.entering){b.x-=150*dt;if(b.x<=target){b.x=target;b.entering=false;}}else b.x=target+Math.sin(b.t*.65)*30;
  b.y=s.water-35+Math.sin(b.t*1.2)*4;
  const ratio=b.hp/b.maxHp;const index=ratio<=.3?2:ratio<=.65?1:0;if(index!==b.phase){b.phase=index;announce(s,index===2?'KIRIN · LAST STAND':'KIRIN · FULL BROADSIDE','Watch the turrets. Dive, recover, counterattack.',3);}
  if(b.entering)return;b.fireTimer-=dt;const phase=c.boss.phases[b.phase];
  if(b.fireTimer<=0){b.fireTimer=phase.interval;for(let i=0;i<phase.salvo;i++){const x=b.x+b.w*(-.3+i*.22),y=b.y-50,angle=Math.atan2(s.player.y-35-y,s.player.x-x);s.projectiles.push({kind:'bossMissile',x,y,vx:Math.cos(angle)*220,vy:-230-i*35,hp:18,damage:c.boss.damage*c.difficulties[s.difficulty].enemyDamage,life:9,age:0});}s.events.push({type:'sound',name:'warning_alert'});}
}
export function step(s,c,input,dt){
  if(s.status!=='playing')return;if(s.mode==='daily'&&s.time>=180){finishRun(s,c,false);return;}dt=Math.min(dt,.05);s.time+=dt;s.step++;const p=s.player,profile=c.profiles[s.monster];
  p.invulnerable=Math.max(0,p.invulnerable-dt);p.diveRecovery=Math.max(0,p.diveRecovery-dt);s.comboTimer-=dt;if(s.comboTimer<=0)s.combo=0;
  if(input.roar)startRoar(s,c);
  const wantsDive=input.y>0.35&&p.diveRecovery<=0;const prevDive=p.dive;
  p.dive=clamp(p.dive+(wantsDive?dt*3:-dt*4),0,1);if(prevDive<.2&&p.dive>=.2)s.stats.dives++;
  if(p.dive>.85){p.oxygen=Math.max(0,p.oxygen-dt);if(p.oxygen<=0){p.diveRecovery=c.combat.diveRecoverySeconds;p.dive=0;p.invulnerable=.8;announce(s,'SURFACING','Oxygen depleted. Dive recovers in three seconds.',2);burst(s,p.x,s.water,'#7fe7ff',30);}}
  else p.oxygen=clamp(p.oxygen+dt*2.5,0,c.combat.oxygenSeconds);
  const speed=p.dive>.5?profile.speed*.65:profile.speed;p.x+=input.x*speed*dt;p.x=clamp(p.x,150,s.boss?.gone?s.width+150:s.width*.52);
  const surfaceY=s.water-65+(input.y<-.3?-35:0);p.y+=(surfaceY+p.dive*170-p.y)*Math.min(1,dt*10);p.bob+=dt*(Math.abs(input.x)>.2?7:2.5);
  p.energy=clamp(p.energy+profile.energyRegen*(p.dive>.5?.65:1)*dt,0,100);p.shield=clamp(p.shield+profile.shieldRegen*dt,0,c.combat.shieldCharges);if(p.exhausted&&p.energy>=25)p.exhausted=false;
  if(!s.boss){s.spawnTimer-=dt;if(s.spawnTimer<=0&&s.enemies.length<5){spawnEnemy(s,c,s.spawning<3?['interceptor','gunship','bomber'][s.spawning++]:chooseEnemy(s,c));s.spawnTimer=currentDistrict(s,c).spawnSeconds*c.difficulties[s.difficulty].spawnInterval;}}
  fireBeam(s,c,dt,input.fire);updateRoar(s,c,dt);
  for(const e of s.enemies){if(e.dead)continue;e.t+=dt;e.x-=e.speed*dt;e.y=e.baseY+Math.sin(e.t*1.4)*12;e.cooldown-=dt;if(e.x<s.width-80&&e.x>100){if(e.cooldown<.65&&e.warning<=0){e.warning=.65;e.cooldown=.65;}if(e.warning>0){e.warning-=dt;if(e.warning<=0){launch(s,c,e);e.cooldown=c.enemies[e.kind].cooldown;}}}if(e.x< -e.width)e.dead=true;}
  updateBoss(s,c,dt);
  for(const b of s.projectiles){if(b.dead)continue;b.age+=dt;b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.kind==='bomb')b.vy+=120*dt;else if(b.kind==='bossMissile')b.vy+=105*dt;
    const distance=Math.hypot(b.x-p.x,b.y-(p.y-35));if(distance<65&&p.dive<.85){damagePlayer(s,c,b.damage,b.x,b.y);b.dead=true;if(s.status==='results')return;}
    else if(distance<105&&!b.nearMiss&&p.dive<.85){b.nearMiss=true;s.stats.nearMisses++;award(s,'nearMiss',50);p.energy=clamp(p.energy+3,0,100);}
    if(b.y>s.water+15){burst(s,b.x,s.water,'#7fe7ff',8,130);b.dead=true;}if(b.life<=0||b.x< -100)b.dead=true;
  }
  s.enemies=s.enemies.filter(e=>!e.dead);s.projectiles=s.projectiles.filter(b=>!b.dead);
  for(const q of s.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=80*dt;q.life-=dt;}s.particles=s.particles.filter(q=>q.life>0).slice(-c.combat.maxParticles);
  for(const r of s.rings)r.life-=dt;s.rings=s.rings.filter(r=>r.life>0);s.shake*=Math.exp(-dt*9);s.flash=Math.max(0,s.flash-dt);
  nextEncounter(s,c);
}
