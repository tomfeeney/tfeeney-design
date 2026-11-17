/* Pure encounter and combat rules; shared by the browser and verification tests. */
(function(root){
  'use strict';
  const missions=[
    {title:'01 · AWAKENING',name:'Tokyo Bay',target:6,story:'A seismic pulse rises from Tokyo Bay. The first interceptors approach. Break the perimeter and follow the shoreline.',objective:'Destroy 6 interceptors. Hold Space to aim and fire; dive beneath incoming missiles.'},
    {title:'02 · SHADOW OF FUJI',name:'Coastal defense',target:8,story:'The harbor alarm reaches the foothills of Fuji. Heavy fighters and bombers join the pursuit. The fleet is closing the bay.',objective:'Destroy 8 aircraft. Watch for amber launch signals and protect your energy reserves.'},
    {title:'03 · TOKYO AFTERSHOCK',name:'Tokyo skyline',target:10,story:'Tokyo Tower glows above the smoke. The final air-defense line stands between you and the open sea.',objective:'Destroy 10 aircraft, then confront the missile destroyer.'}
  ];
  const profiles={godzilla:{hp:190,speed:265,regen:9,drain:28,damage:1,roarDamage:14},mecha:{hp:150,speed:325,regen:7,drain:24,damage:1.18,roarDamage:12}};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function beamDamage(over,dt,kind='jet',profile='godzilla',boost=1){const rate=kind==='boss'?(over?45:30):kind==='bomber'?(over?49.8:34.8):(over?58.8:37.8);return rate*dt*profiles[profile].damage*boost;}
  function bossTier(hp,maxHp){return hp/maxHp<=.3?3:hp/maxHp<=.65?2:1;}
  function oxygen(seconds){return clamp(1-seconds/8,0,1);}
  function rageGain(kills,damage){return clamp(kills*16+damage*.025,0,100);}
  const api={missions,profiles,clamp,beamDamage,bossTier,oxygen,rageGain};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.KaijuArcadeRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
