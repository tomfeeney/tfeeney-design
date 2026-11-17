import {loadAssets,loadConfig} from './assets.js';
import {createState,resizeState,hashSeed} from './state.js';
import {beginEncounter} from './missions.js';
import {step} from './simulation.js';
import {Renderer} from './rendering.js';
import {Input} from './input.js';
import {AudioSystem} from './audio.js';
import {Leaderboard} from './leaderboard.js';
import {loadSettings,saveSettings} from './settings.js';
import {UI} from './ui.js';
import {Trivia} from './trivia.js';
const canvas=document.getElementById('game');let config,assets,renderer,ui,input,trivia,state=null,last=0,accumulator=0,frameTimes=[],drawCount=0;
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
const settings=loadSettings(storage),audio=new AudioSystem(settings),board=new Leaderboard(storage);
function layout(){if(!state||!renderer)return;const ratio=canvas.clientWidth/canvas.clientHeight,width=Math.round(Math.max(800,Math.min(1800,800*ratio)));resizeState(state,width,800);renderer.draw(state);}
function start(options){audio.unlock();audio.stop();input.clear();const seed=options.mode==='daily'?hashSeed('daily-'+options.dailyDate+'-v2'):Math.floor(Date.now()+Math.random()*10000);state=createState(config,{...options,seed});layout();ui.showBriefing(state);accumulator=0;}
function begin(upgrade){beginEncounter(state,config,upgrade);input.clear();ui.playing(state);accumulator=0;}
function pause(){if(trivia?.active){trivia.close();return;}if(!state||!['playing','paused'].includes(state.status))return;state.status=state.status==='playing'?'paused':'playing';input.clear();state.shake=0;audio.stop();ui.paused(state);accumulator=0;}
function mute(){settings.muted=!settings.muted;document.getElementById('muteSetting').checked=settings.muted;document.getElementById('muteBtn').textContent=settings.muted?'Unmute':'Mute';saveSettings(settings,storage);if(settings.muted)audio.stop();}
function menu(){input.clear();audio.stop();state=null;ui.showMenu();accumulator=0;}
function flushEvents(){const events=state.events.splice(0);audio.handle(events);for(const e of events){if(e.type==='briefing'){input.clear();ui.showBriefing(state);}if(e.type==='results'){input.clear();ui.results(state);}if(e.type==='notice')ui.say(e.title+'. '+e.text);}}
async function boot(){try{
  config=await loadConfig();ui=new UI(config,settings,board,{start,begin,pause,mute,menu,trivia:()=>{audio.unlock();trivia.open();},settingsChanged:()=>{saveSettings(settings,storage);if(settings.muted)audio.stop();}});
  input=new Input({pause,mute,confirm:()=>ui.confirm(),navigate:(d,axis)=>ui.navigate(d,axis),blur:()=>{if(state?.status==='playing')pause();}});trivia=new Trivia(ui,audio);
  assets=await loadAssets((done,total,file)=>ui.loading(done,total,file));renderer=new Renderer(canvas,assets,config,settings);ui.loaded();
  const menuState=createState(config);menuState.status='menu';resizeState(menuState,Math.round(Math.max(800,Math.min(1800,800*canvas.clientWidth/canvas.clientHeight))),800);renderer.draw(menuState);
  window.addEventListener('resize',layout);window.addEventListener('gamepadconnected',()=>ui.say('Controller connected. A fires, B roars, Start pauses.'));document.getElementById('performanceReadout').textContent='Ready · '+Object.keys(assets).length+' artwork files loaded';requestAnimationFrame(loop);
}catch(error){if(ui)ui.loadingError(error);else{document.getElementById('loadingStatus').textContent=error.message;document.getElementById('retryLoad').classList.remove('hidden');document.getElementById('retryLoad').onclick=()=>location.reload();}}}
function loop(now){const wallDelta=Math.min(.1,(now-last)/1000||0);last=now;const controls=input.read();
  if(state){if(state.status==='playing'){accumulator+=wallDelta;let count=0;while(accumulator>=1/60&&count<6){step(state,config,{...controls,roar:count===0&&controls.roar},1/60);accumulator-=1/60;count++;if(state.status!=='playing'){accumulator=0;break;}}flushEvents();}else accumulator=0;
    const before=performance.now();renderer.draw(state);frameTimes.push(performance.now()-before);if(frameTimes.length>180)frameTimes.shift();if(++drawCount%120===0){const avg=frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length;document.getElementById('performanceReadout').textContent='Draw '+avg.toFixed(1)+'ms · '+state.projectiles.length+' projectiles · '+state.particles.length+' particles';}
  }requestAnimationFrame(loop);
}
boot();
