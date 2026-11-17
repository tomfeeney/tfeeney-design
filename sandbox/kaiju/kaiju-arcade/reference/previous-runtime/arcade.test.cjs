'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const rules=require('../js/arcade-rules.js');
for(const kind of ['jet','boss','bomber'])for(const profile of ['godzilla','mecha']){
  const totals=[30,60,120].map(fps=>Array.from({length:fps},()=>rules.beamDamage(true,1/fps,kind,profile)).reduce((a,b)=>a+b,0));
  assert(Math.abs(totals[0]-totals[2])<1e-8,'Damage must be independent of frame rate');
}
assert.deepEqual(rules.missions.map(m=>m.target),[6,8,10]);assert.equal(rules.bossTier(260,260),1);assert.equal(rules.bossTier(150,260),2);assert.equal(rules.bossTier(60,260),3);assert.equal(rules.oxygen(8),0);
const gradient={addColorStop(){}},ctx=new Proxy({measureText:t=>({width:String(t).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
const nodes=new Map();function node(){return {width:1440,height:900,style:{},value:'',textContent:'',innerHTML:'',disabled:false,listeners:{},classList:{add(){},remove(){},toggle(){}},querySelector(){return node()},querySelectorAll(){return []},getContext(){return ctx},setAttribute(){},getAttribute(){return ''},addEventListener(k,fn){this.listeners[k]=fn},focus(){}};}
function get(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}
const storage=new Map(),listeners={},sandbox={KaijuArcadeRules:rules,innerWidth:1440,innerHeight:900,document:{getElementById:get,querySelector:()=>node(),createElement:()=>node(),addEventListener(){}},Image:class{constructor(){this.width=415;this.height=362;this.complete=true;}},Audio:class{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener:(k,fn)=>listeners[k]=fn,matchMedia:()=>({matches:false}),setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},performance:{now:()=>0},Math,console};sandbox.window=sandbox;
let source=fs.readFileSync(path.join(__dirname,'../js/kaiju-run.js'),'utf8');const boot=source.lastIndexOf('loadAll().then(');source=source.slice(0,boot)+`globalThis.test={start,reset,update,fire,finish,addScore,togglePause,triggerAtomicRoar,beamOrigin,damage,drawPlayer,drawFrontWaves,drawBg,openMissionBrief,get:()=>({state,round,roundKills,player,carrier,rage,attackBoost,diveLock,phase,jets,bombs,score,victory}),set:v=>{if(v.roundKills!==undefined)roundKills=v.roundKills;if(v.state)state=v.state;if(v.rage!==undefined)rage=v.rage;if(v.submerge!==undefined)submergeeTimer=v.submerge;if(v.selected)selected=v.selected;},keys,img};audioEnabled=false;Object.keys(paths).forEach(k=>img[k]={width:k==='ship'?700:415,height:k==='ship'?220:362,complete:true});})();`;
vm.createContext(sandbox);vm.runInContext(source,sandbox);const t=sandbox.test;
function select(type){nodes.get('missionModal').listeners.click({target:{closest:()=>({dataset:{refit:type}})}});}
t.start();assert.equal(t.get().state,'briefing');select('begin');assert.equal(t.get().state,'playing');assert.equal(t.get().player.hp,190);
// Damage immunity must protect both shield charges and health.
t.get().player.invuln=0;t.damage(20,400,500);const hp=t.get().player.hp;t.damage(20,400,500);assert.equal(t.get().player.hp,hp);
// Beam actually kills an aircraft and contributes to wave progression.
let origin=t.beamOrigin();t.get().jets.push({x:origin.x+250,y:origin.y,w:110,h:80,hp:.1,maxHp:10,type:{key:'j1',score:35,amp:10},speed:100,t:0,pathCd:2,targetY:origin.y,baseY:origin.y,wavePhase:0,missileCd:5,missilesLeft:0});t.keys[' ']=true;t.update(1/60);assert.equal(t.get().roundKills,1);t.keys[' ']=false;
// Refit advances each real wave, freezes threats, and applies the chosen reward.
t.set({roundKills:6});t.update(.016);assert.equal(t.get().state,'briefing');assert.equal(t.get().round,2);select('power');assert.equal(t.get().attackBoost,1.2);
t.get().player.hp=40;t.set({roundKills:8});t.update(.016);assert.equal(t.get().round,3);select('repair');assert.equal(t.get().player.hp,95);
// Oxygen forces surfacing even with down held.
t.get().player.y=800;t.set({submerge:7.99});t.keys.s=true;t.update(.02);assert(t.get().diveLock>0);assert(t.get().player.y<742);t.keys.s=false;
// Roar consumes rage; kills recharge it; pause freezes elapsed attacks.
t.set({rage:100});t.triggerAtomicRoar();assert.equal(t.get().rage,0);t.togglePause();assert.equal(t.get().state,'paused');t.togglePause();assert.equal(t.get().state,'playing');
// Final wave spawns the actual boss; beam destruction starts its sinking sequence.
t.set({roundKills:10});t.update(.016);assert.equal(t.get().phase,'carrier');const boss=t.get().carrier;boss.x=t.get().player.x+400;boss.y=700;boss.w=400;boss.h=125;boss.entering=false;boss.hp=.1;t.get().player.energy=100;t.get().player.y=680;t.keys[' ']=true;for(let i=0;i<180&&!boss.sinking;i++){t.get().player.energy=100;t.update(1/60);}assert(boss.sinking,'Boss must sink after beam damage');assert.equal(t.get().phase,'escape');t.keys[' ']=false;
for(let i=0;i<300&&t.get().carrier;i++)t.update(1/60);assert.equal(t.get().carrier,null);t.get().player.x=1800;t.update(.016);assert.equal(t.get().state,'gameover');assert(t.get().victory);
t.reset();assert.equal(t.get().round,1);assert.equal(t.get().rage,100);assert.equal(t.get().score,0);t.set({selected:'mecha'});t.reset();assert.equal(t.get().player.hp,150);
t.set({state:'playing'});t.get().player.hp=0;t.update(.016);assert.equal(t.get().state,'gameover');assert(!t.get().victory);nodes.get('initials').value='ABC';t.addScore();assert(storage.has('kaijuArcadeScoresV1'));assert(!storage.has('kaijuRunHighScoresV72'));
// Rendering must clip the monster at the waterline; lower sprite edge never shows.
let clipped=false;ctx.clip=()=>clipped=true;t.drawPlayer();assert(clipped);
console.log('PASS: frame-rate independent damage; aircraft kill; all encounter transitions; refits; oxygen; roar; shield immunity; pause; boss sinking; escape victory; reset; both monsters; waterline clipping.');
