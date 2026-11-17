import {clamp,award,announce} from './state.js';
export function currentDistrict(s,c){return c.districts[(s.mode==='harbor'||s.mode==='daily')?0:s.mode==='survival'?(s.round-1)%c.districts.length:s.district];}
export function targetKills(s,c){return (s.mode==='harbor'||s.mode==='daily')?12:s.mode==='survival'?6+s.round*2:currentDistrict(s,c).target;}
export function beginEncounter(s,c,upgrade='begin'){
  if(s.status!=='briefing')return;
  if(upgrade==='repair'){s.player.hp=clamp(s.player.hp+65,0,s.player.maxHp);s.player.energy=100;}
  else if(upgrade==='power')s.player.power*=1.2;
  else if(upgrade==='shield'){s.player.energy=100;s.player.shield=c.combat.shieldCharges;s.player.rage=100;}
  s.spawning=0;s.player.exhausted=false;s.status='playing';s.player.invulnerable=2;s.player.y=s.water-65;s.player.oxygen=c.combat.oxygenSeconds;s.player.dive=0;s.spawnTimer=1.5;s.beam=null;s.roar=0;
  const d=currentDistrict(s,c);announce(s,d.title,d.objective,5);s.events.push({type:'sound',name:upgrade==='begin'?'game_start':'powerup'});
}
export function nextEncounter(s,c){
  if(s.status!=='playing'||s.kills<targetKills(s,c)||s.boss)return;
  if(s.mode!=='survival'&&(s.mode==='harbor'||s.mode==='daily'||s.district===c.districts.length-1)){spawnBoss(s,c);return;}
  s.district++;s.round++;s.kills=0;s.status='briefing';s.enemies=[];s.projectiles=[];s.beam=null;s.roar=0;s.combo=0;
  s.events.push({type:'briefing',upgrade:true});
}
export function spawnBoss(s,c){s.enemies=[];s.projectiles=[];s.boss={x:s.width+320,y:s.water-35,hp:c.boss.health,maxHp:c.boss.health,w:Math.min(650,s.width*.5),h:180,t:0,fireTimer:3,phase:0,sink:0,entering:true};announce(s,'FINAL DEFENSE',c.boss.name+' closes the channel. Watch its turrets before each salvo.',5);s.events.push({type:'sound',name:'warning_alert'});}
export function finishRun(s,c,win){
  if(s.status==='results')return;
  s.won=win;s.status='results';s.beam=null;s.roar=0;
  const subtotal=s.ledger.reduce((n,e)=>n+e.points,0);
  const victory=win?5000:0,health=win?Math.round(Math.max(0,s.player.hp)*12):0,speed=win?Math.max(0,6000-Math.floor(s.time)*15):0;
  if(victory)award(s,'victory',victory);if(health)award(s,'health',health);if(speed)award(s,'speed',speed);
  const multiplier=c.difficulties[s.difficulty].scoreMultiplier,total=Math.round(s.score*multiplier);
  s.result={subtotal,victory,health,speed,multiplier,total,seconds:Math.round(s.time),kills:s.totalKills,won:win,monster:s.monster,difficulty:s.difficulty,mode:s.mode,seed:s.seed,dailyDate:s.dailyDate,rank:win?(total>18000?'KING OF THE BAY':'HARBOR BREAKER'):s.totalKills>=8?'RAMPAGING THREAT':'AWAKENING TITAN'};
  s.events.push({type:'results'},{type:'sound',name:win?'high_score':'game_over'});
}
