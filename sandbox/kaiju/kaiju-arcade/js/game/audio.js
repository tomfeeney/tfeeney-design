export class AudioSystem {
  constructor(settings,AudioClass=Audio){this.settings=settings;this.AudioClass=AudioClass;this.pool=new Map();this.times=new Map();this.ready=false;}
  unlock(){this.ready=true;}
  play(name,cooldown=.1){if(!this.ready||this.settings.muted||this.settings.volume<=0)return;const now=performance.now()/1000;if(now-(this.times.get(name)??-99)<cooldown)return;this.times.set(name,now);let clip=this.pool.get(name);if(!clip){clip=new this.AudioClass(name==='godzilla_roar'?'assets/godzilla_roar.mp3':name==='mecha_roar'?'assets/mecha_godzilla_roar.mp3':'sfx/'+name+'.mp3');this.pool.set(name,clip);}clip.volume=this.settings.volume;try{clip.currentTime=0;clip.play()?.catch(()=>{});}catch{}}
  handle(events){for(const e of events){if(e.type==='sound')this.play(e.name,e.name==='jet_explosion'?.12:.4);if(e.type==='beamSound')this.play(e.name,.8);if(e.type==='roar')this.play(e.monster==='mecha'?'mecha_roar':'godzilla_roar',1);}}
  stop(){for(const clip of this.pool.values())clip.pause();}
}
