export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hashSeed(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function seededRandom(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function createState(config,{monster='godzilla',difficulty='normal',mode='campaign',seed=Date.now(),dailyDate=''}={}){
  const profile=config.profiles[monster]||config.profiles.godzilla;
  return {status:'briefing',monster,difficulty,mode,seed,dailyDate,random:seededRandom(hashSeed(seed)),time:0,width:1280,height:800,water:608,
    player:{x:220,y:548,hp:profile.health,maxHp:profile.health,energy:100,shield:3,rage:100,oxygen:config.combat.oxygenSeconds,diveRecovery:0,dive:0,invulnerable:0,power:1,bob:0,aim:0},
    district:0,round:1,kills:0,totalKills:0,combo:0,comboTimer:0,score:0,ledger:[],events:[],enemies:[],projectiles:[],particles:[],rings:[],beam:null,roar:0,roarHit:false,boss:null,spawnTimer:1.6,spawning:0,
    notice:{title:'',text:'',until:0},shake:0,flash:0,won:false,result:null,stats:{damage:0,blocks:0,nearMisses:0,shots:0,beamHits:0,dives:0},step:0,saved:false};
}
export function award(s,kind,base){if(!Number.isFinite(base)||base<0)return;const points=Math.round(base);s.ledger.push({kind,points,step:s.step});s.score+=points;}
export function announce(s,title,text,seconds=4){s.notice={title,text,until:s.time+seconds};s.events.push({type:'notice',title,text});}
export function burst(s,x,y,color,n=20,speed=180){for(let i=0;i<n;i++){const angle=s.random()*Math.PI*2,v=speed*(.25+s.random()*.75);s.particles.push({x,y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,life:.4+s.random()*.6,maxLife:1,color,size:2+s.random()*5});}s.shake=Math.max(s.shake,8);}
export function waterline(s){return s.height*.76;}
export function emitter(s){return {x:s.player.x+(s.monster==='mecha'?82.8:96.3),y:s.player.y-(s.monster==='mecha'?124.5:54.2)};}
export function resizeState(s,width,height=800){s.width=width;s.height=height;s.water=waterline(s);s.player.x=clamp(s.player.x,150,width*.52);s.player.y=clamp(s.player.y,s.water-110,s.water+110);}
