export const ASSET_FILES = Object.freeze({
  godzilla:'godzilla-exact.webp',godzillaShield:'godzilla-shield-exact.webp',mecha:'mecha-exact.webp',mechaShield:'mecha-shield-exact.webp',
  blastGreen:'laser-weap.webp',blastRed:'laser-weap-red.webp',roar:'kaiju-roar.webp',shieldIcon:'kaiju-shield-icon.png',roarIcon:'kaiju-roar-icon.png',
  jet1:'jet_001.webp',jet2:'jet_002.webp',jet3:'jet_003.webp',bomber1:'bomber-01.webp',bomber2:'bomber-02.webp',bomb:'bomb.webp',destroyer:'destroyer.webp',
  wavePlain:'wave_plain.webp',wavePaint:'wave_paint.webp',waveBlue:'wave_blue.webp',waveRed:'wave_red.webp',
  originalWave:'wave-green-3840.png',originalWaveRed:'wave-redblue-3840.png',originalCity:'city-green-3840.png',originalCityRed:'city-redblue-3840.png',
  title:'background.png',titleRed:'background_mecha.png',end:'bg-tokyo-grn.webp',endRed:'bg-tokyo-red.webp',fuji:'city-green-3840.png',tokyo:'city-green-3840.png'
});
export async function loadAssets(progress, ImageClass=Image){
  const assets={};let done=0;const entries=Object.entries(ASSET_FILES);
  await Promise.all(entries.map(([key,file])=>new Promise((resolve,reject)=>{
    const image=new ImageClass();image.onload=()=>{assets[key]=image;progress(++done,entries.length,file);resolve();};image.onerror=()=>reject(new Error('Unable to load original game asset: '+file));image.src='assets/'+file;
  })));
  return assets;
}
export async function loadConfig(){
  const response=await fetch('data/game.json');if(!response.ok)throw new Error('Encounter data could not load.');
  const config=await response.json();
  if(!config.districts?.length||!config.profiles?.godzilla||!config.profiles?.mecha)throw new Error('Encounter data is incomplete.');
  return config;
}
