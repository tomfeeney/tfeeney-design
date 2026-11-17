(() => {
const rules=KaijuArcadeRules;
const soundPool=new Map(),soundTimes=new Map();
function playSfx(name,cooldown=.15){if(!audioEnabled)return;if(elapsed-(soundTimes.get(name)??-999)<cooldown)return;soundTimes.set(name,elapsed);let clip=soundPool.get(name);if(!clip){clip=new Audio('sfx/'+name+'.mp3');clip.volume=.32;soundPool.set(name,clip);}try{clip.currentTime=0;const pending=clip.play();if(pending)pending.catch(()=>{});}catch(_){} }

let rage=100,attackBoost=1,diveLock=0,roarPulse=0,bossTier=1;
const missionModal=document.getElementById("missionModal");

const canvas=document.getElementById("game"),ctx=canvas.getContext("2d",{alpha:false,desynchronized:true});
const menu=document.getElementById("menu"),end=document.getElementById("end"),startBtn=document.getElementById("startBtn"),restartBtn=document.getElementById("restartBtn"),otherKaijūBtn=document.getElementById("otherKaijūBtn"),chooseGodzilla=document.getElementById("chooseGodzilla"),chooseMecha=document.getElementById("chooseMecha"),banner=document.getElementById("banner"),bannerTitle=document.getElementById("bannerTitle"),bannerText=document.getElementById("bannerText"),endTitle=document.getElementById("endTitle"),endText=document.getElementById("endText"),finalScoreBig=document.getElementById("finalScoreBig"),initials=document.getElementById("initials"),saveBtn=document.getElementById("saveBtn"),scoreList=document.getElementById("scoreList"),menuScoreList=document.getElementById("menuScoreList"),scoreForm=document.getElementById("scoreForm"),rankTitle=document.getElementById("rankTitle"),newHighNotice=document.getElementById("newHighNotice"),scoreBreakdown=document.getElementById("scoreBreakdown"),attractLine=document.getElementById("attractLine"),gameControlsHud=document.getElementById("gameControlsHud"),touchControls=document.getElementById("touchControls"),
chooseTrivia=document.getElementById("chooseTrivia"),
triviaModal=document.getElementById("triviaModal"),
triviaCloseBtn=document.getElementById("triviaCloseBtn"),
triviaExitBtn=document.getElementById("triviaExitBtn"),
triviaQuestion=document.getElementById("triviaQuestion"),
triviaAnswers=document.getElementById("triviaAnswers"),
triviaFeedback=document.getElementById("triviaFeedback"),
triviaTimerText=document.getElementById("triviaTimerText"),
triviaTimerFill=document.getElementById("triviaTimerFill"),
triviaScore=document.getElementById("triviaScore"),
triviaRemaining=document.getElementById("triviaRemaining"),
triviaCounter=document.getElementById("triviaCounter"),
triviaPotential=document.getElementById("triviaPotential"),
triviaType=document.getElementById("triviaType"),
triviaNextBtn=document.getElementById("triviaNextBtn"),
triviaInputWrap=document.getElementById("triviaInputWrap"),
triviaInput=document.getElementById("triviaInput"),
triviaSubmitBtn=document.getElementById("triviaSubmitBtn"),
triviaStartOverBtn=document.getElementById("triviaStartOverBtn");
const triviaPotentialStat=document.getElementById("triviaPotentialStat");
const loader=document.getElementById("loader"),loadingFill=document.getElementById("loadingFill"),loadingStatus=document.getElementById("loadingStatus");
/* Bomber project assets: assets/bomber-01.webp, assets/bomber-02.webp */
const paths={
bgGodSky:"assets/city-green-3840.png",
japanSky:"assets/japan-landmarks.png",fujiSky:"assets/fuji-coast.png",
bgMechaSky:"assets/city-redblue-3840.png",
bgGodWave:"assets/wave-green-3840.png",
bgMechaWave:"assets/wave-redblue-3840.png",
bomber:"assets/bomber-01.webp",
bomber2:"assets/bomber-02.webp",
godExact:"assets/godzilla-exact.webp",
godShieldExact:"assets/godzilla-shield-exact.webp",
mechaExact:"assets/mecha-exact.webp",
mechaShieldExact:"assets/mecha-shield-exact.webp",
ship:"assets/destroyer.webp",
j1:"assets/jet_001.webp",
j2:"assets/jet_002.webp",
j3:"assets/jet_003.webp",
wp:"assets/wave_plain.webp",
wpa:"assets/wave_paint.webp",
wb:"assets/wave_blue.webp",
wr:"assets/wave_red.webp",
laser:"assets/laser-weap.webp",
laserRed:"assets/laser-weap-red.webp",
bomb:"assets/bomb.webp",
atomicRoarFx:"assets/kaiju-roar.webp",
kaijuShieldIcon:"assets/kaiju-shield-icon.png",
kaijuRoarIcon:"assets/kaiju-roar-icon.png",
godRoar:"assets/godzilla_roar.mp3",
mechaRoar:"assets/mecha_godzilla_roar.mp3"
};

const screenTitleBackgrounds={
start:["assets/background_mecha.png","assets/background.png"],
gameover:["assets/bg-tokyo-grn.webp","assets/bg-tokyo-red.webp"]
};
const menuHero=menu?menu.querySelector(".hero"):null;
const endHero=end?end.querySelector(".hero"):null;
function randomFrom(list){return list[Math.floor(Math.random()*list.length)]}
function setHeroTitleBackground(hero,src){
if(!hero||!src)return;
hero.style.backgroundImage=`linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,5,16,.78)),url("${src}")`;
hero.style.backgroundSize="cover";
hero.style.backgroundPosition="center";
}
function prewarmScreenTitleBackgrounds(){
[...screenTitleBackgrounds.start,...screenTitleBackgrounds.gameover].forEach(src=>{const im=new Image();im.src=src});
}
function chooseStartTitleBackground(){setHeroTitleBackground(menuHero,randomFrom(screenTitleBackgrounds.start))}
function chooseGameOverTitleBackground(){setHeroTitleBackground(endHero,randomFrom(screenTitleBackgrounds.gameover))}

const img={},keys={};let state="menu",selected="godzilla",selectedMode="game",last=0,elapsed=0,score=0,pendingScore=0,shake=0,flash=0,difficulty=1,jetTimer=.8,phase="jets",bannerTimer=0,carrier=null,carrierSpawned=false,victory=false,multiplier=1,streak=0,jetsDestroyed=0,nearMissCd=0,audioEnabled=true,audioCtx=null,aiInfo="SCANNING",shieldHits=3,shieldMax=3,shieldCharge=3,shieldReady=true,escapeReady=false,shieldFx=[],aiStats={shots:0,aimTicks:0,godShots:0,mechaShots:0,hits:0,hitTicks:0,godHits:0,mechaHits:0,bombsDropped:0,missilesFired:0,damageTaken:0,damageDone:0,godDamage:0,mechaDamage:0,shieldBlocks:0,damageBlocked:0,specials:0,buildingsDestroyed:0,biggestHit:0,perfectBlocks:0,beamClashesWon:0,rageActivations:0,cityDamage:0,startTime:0,lastRoar:-999};let submergeeTimer=0,submergeeDamageCd=0,atomicRoarUsed=false,atomicRoarTimer=0,atomicRoarTick=0,roarReuseFeedbackAt=-999,bomber=null,bomberEventTimer=9,bomberSpawnCount=0;
const waveTargets=rules.missions.map(m=>m.target);let round=1,roundKills=0,roundTarget=waveTargets[0];
const player={x:150,y:0,w:455,h:414,hp:150,maxHp:150,energy:100,maxEnergy:100,fireCd:0,shieldCd:0,shieldTimer:0,invuln:0,bob:0};
let beam=null,bombs=[],jets=[],particles=[],rings=[],muzzleFx=[],factState={text:"",nextAt:0,startedAt:0,duration:10};
const TRIVIA_TIME_LIMIT=15;
const TRIVIA_ROUND_SIZE=12;
const TRIVIA_MAX_POINTS=100;
const TRIVIA_MIN_POINTS=10;
const TRIVIA_QUESTIONS=[
  {
    "id": "KJ001",
    "category": "Kaijū Identification",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū is known as the King of the Monsters?",
    "options": [
      "Godzilla",
      "Rodan",
      "Gigan",
      "Baragon"
    ],
    "answer": "Godzilla",
    "fact": "Kaijū Identification // EASY THREAT FILE"
  },
  {
    "id": "KJ002",
    "category": "Incident Timeline",
    "difficulty": "easy",
    "type": "choice",
    "question": "What year did the original Godzilla film release in Japan?",
    "options": [
      "1954",
      "1962",
      "1975",
      "1984"
    ],
    "answer": "1954",
    "fact": "Incident Timeline // EASY THREAT FILE"
  },
  {
    "id": "KJ003",
    "category": "Attack Profile",
    "difficulty": "easy",
    "type": "choice",
    "question": "What is Godzilla’s most famous signature attack?",
    "options": [
      "Atomic Breath",
      "Gravity Beams",
      "Lightning Horn",
      "Plasma Drill"
    ],
    "answer": "Atomic Breath",
    "fact": "Attack Profile // EASY THREAT FILE"
  },
  {
    "id": "KJ004",
    "category": "Kaijū Identification",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū is a giant moth often portrayed as a guardian?",
    "options": [
      "Mothra",
      "Hedorah",
      "Kumonga",
      "Megalon"
    ],
    "answer": "Mothra",
    "fact": "Kaijū Identification // EASY THREAT FILE"
  },
  {
    "id": "KJ005",
    "category": "Kaijū Identification",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū is a three-headed golden dragon?",
    "options": [
      "King Ghidorah",
      "Gigan",
      "Rodan",
      "Anguirus"
    ],
    "answer": "King Ghidorah",
    "fact": "Kaijū Identification // EASY THREAT FILE"
  },
  {
    "id": "KJ006",
    "category": "Defense Intel",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which monster is a mechanical version of Godzilla?",
    "options": [
      "Mechagodzilla",
      "Jet Jaguar",
      "M.O.G.U.E.R.A.",
      "Gigan"
    ],
    "answer": "Mechagodzilla",
    "fact": "Defense Intel // EASY THREAT FILE"
  },
  {
    "id": "KJ007",
    "category": "Kaijū Identification",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū is commonly associated with flight and volcanic origins?",
    "options": [
      "Rodan",
      "Baragon",
      "Ebirah",
      "Minilla"
    ],
    "answer": "Rodan",
    "fact": "Kaijū Identification // EASY THREAT FILE"
  },
  {
    "id": "KJ008",
    "category": "Origin Report",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū is strongly associated with pollution and toxic sludge?",
    "options": [
      "Hedorah",
      "Mothra",
      "Gorosaurus",
      "King Caesar"
    ],
    "answer": "Hedorah",
    "fact": "Origin Report // EASY THREAT FILE"
  },
  {
    "id": "KJ009",
    "category": "Battle History",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which monster battled Godzilla in King Kong vs. Godzilla?",
    "options": [
      "King Kong",
      "Gigan",
      "Destoroyah",
      "Megaguirus"
    ],
    "answer": "King Kong",
    "fact": "Battle History // EASY THREAT FILE"
  },
  {
    "id": "KJ010",
    "category": "Film Archive",
    "difficulty": "easy",
    "type": "choice",
    "question": "Complete the title: Godzilla vs. ______.",
    "options": [
      "Mechagodzilla",
      "The Kraken",
      "Dragon Prime",
      "Tokyo Rex"
    ],
    "answer": "Mechagodzilla",
    "fact": "Film Archive // EASY THREAT FILE"
  },
  {
    "id": "KJ011",
    "category": "Incident Timeline",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which film directly followed the original 1954 Godzilla?",
    "options": [
      "Godzilla Raids Again",
      "Mothra vs. Godzilla",
      "Destroy All Monsters",
      "Godzilla vs. Megalon"
    ],
    "answer": "Godzilla Raids Again",
    "fact": "Incident Timeline // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ012",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū first battled Godzilla in Godzilla Raids Again?",
    "options": [
      "Anguirus",
      "Rodan",
      "Mothra",
      "Gigan"
    ],
    "answer": "Anguirus",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ013",
    "category": "Threat Assessment",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is known for its hook-like arms and visor-like eye?",
    "options": [
      "Gigan",
      "Megalon",
      "Orga",
      "Varan"
    ],
    "answer": "Gigan",
    "fact": "Threat Assessment // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ014",
    "category": "Origin Report",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a plant-hybrid creature connected to genetic engineering?",
    "options": [
      "Biollante",
      "Megaguirus",
      "Battra",
      "Manda"
    ],
    "answer": "Biollante",
    "fact": "Origin Report // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ015",
    "category": "Defense Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which version of Mechagodzilla is also known as Kiryu?",
    "options": [
      "Godzilla Against Mechagodzilla",
      "Godzilla vs. Hedorah",
      "Godzilla vs. Megalon",
      "Godzilla Final Wars"
    ],
    "answer": "Godzilla Against Mechagodzilla",
    "fact": "Defense Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ016",
    "category": "Defense Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Kiryu was built using what remains?",
    "options": [
      "The bones of the original 1954 Godzilla",
      "King Ghidorah’s wings",
      "Mothra’s cocoon",
      "Rodan’s fossilized beak"
    ],
    "answer": "The bones of the original 1954 Godzilla",
    "fact": "Defense Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ017",
    "category": "Era Classification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which era includes The Return of Godzilla and Godzilla vs. Biollante?",
    "options": [
      "Heisei",
      "Showa",
      "Millennium",
      "Reiwa"
    ],
    "answer": "Heisei",
    "fact": "Era Classification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ018",
    "category": "Era Classification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which era includes the original 1954 Godzilla through Terror of Mechagodzilla?",
    "options": [
      "Showa",
      "Heisei",
      "Reiwa",
      "Monsterverse"
    ],
    "answer": "Showa",
    "fact": "Era Classification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ019",
    "category": "Era Classification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which era includes Godzilla 2000: Millennium and Godzilla Final Wars?",
    "options": [
      "Millennium",
      "Showa",
      "Heisei",
      "Reiwa"
    ],
    "answer": "Millennium",
    "fact": "Era Classification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ020",
    "category": "Era Classification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which era includes Shin Godzilla and Godzilla Minus One?",
    "options": [
      "Reiwa",
      "Showa",
      "Heisei",
      "Millennium"
    ],
    "answer": "Reiwa",
    "fact": "Era Classification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ021",
    "category": "Attack Profile",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which attack is most associated with King Ghidorah?",
    "options": [
      "Gravity Beams",
      "Atomic Breath",
      "Web Spray",
      "Antenna Shock"
    ],
    "answer": "Gravity Beams",
    "fact": "Attack Profile // EASY THREAT FILE"
  },
  {
    "id": "KJ022",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a giant lobster-like creature?",
    "options": [
      "Ebirah",
      "Kumonga",
      "Megalon",
      "Titanosaurus"
    ],
    "answer": "Ebirah",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ023",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a giant spider?",
    "options": [
      "Kumonga",
      "Ebirah",
      "Varan",
      "Manda"
    ],
    "answer": "Kumonga",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ024",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a giant praying mantis-like creature?",
    "options": [
      "Kamacuras",
      "Gorosaurus",
      "Megaguirus",
      "Baragon"
    ],
    "answer": "Kamacuras",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ025",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is often portrayed as Godzilla’s son?",
    "options": [
      "Minilla",
      "Jet Jaguar",
      "Baragon",
      "Gabara"
    ],
    "answer": "Minilla",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ026",
    "category": "Threat Assessment",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which monster is a dark counterpart to Mothra?",
    "options": [
      "Battra",
      "Megaguirus",
      "Hedorah",
      "Orga"
    ],
    "answer": "Battra",
    "fact": "Threat Assessment // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ027",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a robot hero rather than a monster villain?",
    "options": [
      "Jet Jaguar",
      "Gigan",
      "Megalon",
      "Mecha-King Ghidorah"
    ],
    "answer": "Jet Jaguar",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ028",
    "category": "Threat Assessment",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is heavily connected to crystals and space-based origins?",
    "options": [
      "SpaceGodzilla",
      "Orga",
      "Megalon",
      "Titanosaurus"
    ],
    "answer": "SpaceGodzilla",
    "fact": "Threat Assessment // HARD THREAT FILE"
  },
  {
    "id": "KJ029",
    "category": "Origin Report",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is linked to the Oxygen Destroyer’s legacy?",
    "options": [
      "Destoroyah",
      "Biollante",
      "Hedorah",
      "Megaguirus"
    ],
    "answer": "Destoroyah",
    "fact": "Origin Report // HARD THREAT FILE"
  },
  {
    "id": "KJ030",
    "category": "Defense Intel",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which weapon killed the original 1954 Godzilla?",
    "options": [
      "Oxygen Destroyer",
      "Maser Cannon",
      "Dimension Tide",
      "Super X"
    ],
    "answer": "Oxygen Destroyer",
    "fact": "Defense Intel // HARD THREAT FILE"
  },
  {
    "id": "KJ031",
    "category": "Incident Timeline",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which Godzilla movie was released in 2023?",
    "options": [
      "Godzilla Minus One",
      "Shin Godzilla",
      "Godzilla Final Wars",
      "Godzilla vs. Kong"
    ],
    "answer": "Godzilla Minus One",
    "fact": "Incident Timeline // EASY THREAT FILE"
  },
  {
    "id": "KJ032",
    "category": "Film Archive",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which film features Godzilla and Kong teaming up against a new threat?",
    "options": [
      "Godzilla x Kong: The New Empire",
      "Godzilla vs. Megalon",
      "Godzilla Against Mechagodzilla",
      "Godzilla Raids Again"
    ],
    "answer": "Godzilla x Kong: The New Empire",
    "fact": "Film Archive // EASY THREAT FILE"
  },
  {
    "id": "KJ033",
    "category": "Film Archive",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which 2014 Hollywood film reintroduced Godzilla to the Monsterverse?",
    "options": [
      "Godzilla",
      "Godzilla 2000",
      "Shin Godzilla",
      "Godzilla Final Wars"
    ],
    "answer": "Godzilla",
    "fact": "Film Archive // EASY THREAT FILE"
  },
  {
    "id": "KJ034",
    "category": "Battle History",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which 2021 film features a major battle between Godzilla and Kong?",
    "options": [
      "Godzilla vs. Kong",
      "King Kong vs. Godzilla",
      "Destroy All Monsters",
      "Godzilla vs. Gigan"
    ],
    "answer": "Godzilla vs. Kong",
    "fact": "Battle History // EASY THREAT FILE"
  },
  {
    "id": "KJ035",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which film introduced Orga as an alien creature trying to harvest Godzilla’s DNA?",
    "options": [
      "Godzilla 2000: Millennium",
      "Godzilla Final Wars",
      "Godzilla vs. Megaguirus",
      "Shin Godzilla"
    ],
    "answer": "Godzilla 2000: Millennium",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ036",
    "category": "Defense Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which film involves a black hole weapon and prehistoric insects?",
    "options": [
      "Godzilla vs. Megaguirus",
      "Godzilla vs. Hedorah",
      "Godzilla vs. Biollante",
      "Godzilla vs. Megalon"
    ],
    "answer": "Godzilla vs. Megaguirus",
    "fact": "Defense Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ037",
    "category": "Battle History",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie has Godzilla battle Mothra, King Ghidorah, and Baragon as Guardian Monsters?",
    "options": [
      "Godzilla, Mothra and King Ghidorah: Giant Monsters All-Out Attack",
      "Destroy All Monsters",
      "Godzilla vs. King Ghidorah",
      "Godzilla Final Wars"
    ],
    "answer": "Godzilla, Mothra and King Ghidorah: Giant Monsters All-Out Attack",
    "fact": "Battle History // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ038",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Godzilla film is known for a metamorphic version of Godzilla attacking Japan?",
    "options": [
      "Shin Godzilla",
      "Godzilla Minus One",
      "Godzilla vs. Destoroyah",
      "The Return of Godzilla"
    ],
    "answer": "Shin Godzilla",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ039",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Godzilla film is set in postwar Japan?",
    "options": [
      "Godzilla Minus One",
      "Godzilla vs. Biollante",
      "Godzilla 2000",
      "Godzilla vs. Kong"
    ],
    "answer": "Godzilla Minus One",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ040",
    "category": "Incident Timeline",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Godzilla film was released in 1984?",
    "options": [
      "The Return of Godzilla",
      "Godzilla vs. Biollante",
      "Godzilla vs. King Ghidorah",
      "Godzilla Final Wars"
    ],
    "answer": "The Return of Godzilla",
    "fact": "Incident Timeline // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ041",
    "category": "Battle History",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū joins Godzilla and Mothra against King Ghidorah in Ghidorah, the Three-Headed Monster?",
    "options": [
      "Rodan",
      "Gigan",
      "Hedorah",
      "Orga"
    ],
    "answer": "Rodan",
    "fact": "Battle History // EASY THREAT FILE"
  },
  {
    "id": "KJ042",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a giant beetle-like underground monster often associated with Seatopia?",
    "options": [
      "Megalon",
      "Baragon",
      "Varan",
      "Titanosaurus"
    ],
    "answer": "Megalon",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ043",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is a dinosaur-like monster with a burrowing ability and a glowing horn in some appearances?",
    "options": [
      "Baragon",
      "Gigan",
      "Manda",
      "Ebirah"
    ],
    "answer": "Baragon",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ044",
    "category": "Kaijū Identification",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is an ancient guardian lion-like monster?",
    "options": [
      "King Caesar",
      "Gorosaurus",
      "Titanosaurus",
      "Gabara"
    ],
    "answer": "King Caesar",
    "fact": "Kaijū Identification // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ045",
    "category": "Threat Assessment",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which monster is the final form after Monster X transforms in Godzilla Final Wars?",
    "options": [
      "Keizer Ghidorah",
      "Mecha-King Ghidorah",
      "SpaceGodzilla",
      "Destoroyah"
    ],
    "answer": "Keizer Ghidorah",
    "fact": "Threat Assessment // HARD THREAT FILE"
  },
  {
    "id": "KJ046",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which cyborg kaijū is a rebuilt version of King Ghidorah?",
    "options": [
      "Mecha-King Ghidorah",
      "Kiryu",
      "M.O.G.U.E.R.A.",
      "Monster X"
    ],
    "answer": "Mecha-King Ghidorah",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ047",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which machine appeared as a defense robot in the Heisei era?",
    "options": [
      "M.O.G.U.E.R.A.",
      "Jet Jaguar",
      "Kiryu",
      "Gigan"
    ],
    "answer": "M.O.G.U.E.R.A.",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ048",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is a giant sea serpent-like creature?",
    "options": [
      "Manda",
      "Ebirah",
      "Varan",
      "Kumonga"
    ],
    "answer": "Manda",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ049",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is a gliding reptilian monster?",
    "options": [
      "Varan",
      "Gabara",
      "Megalon",
      "Kamacuras"
    ],
    "answer": "Varan",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ050",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is a giant dinosaur that fought King Kong before appearing in Godzilla media?",
    "options": [
      "Gorosaurus",
      "Titanosaurus",
      "Godzillasaurus",
      "Baragon"
    ],
    "answer": "Gorosaurus",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ051",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie features Godzilla battling a series of fan-favorite monsters before a final confrontation?",
    "options": [
      "Godzilla Final Wars",
      "Destroy All Monsters",
      "Godzilla vs. Megalon",
      "Godzilla vs. Hedorah"
    ],
    "answer": "Godzilla Final Wars",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ052",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie features Mothra and Kiryu teaming up against Godzilla?",
    "options": [
      "Godzilla: Tokyo SOS",
      "Mothra vs. Godzilla",
      "Godzilla vs. Mechagodzilla II",
      "Godzilla vs. SpaceGodzilla"
    ],
    "answer": "Godzilla: Tokyo SOS",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ053",
    "category": "Incident Timeline",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Godzilla movie was released in 1999?",
    "options": [
      "Godzilla 2000: Millennium",
      "Godzilla vs. Megaguirus",
      "Godzilla Final Wars",
      "Godzilla Against Mechagodzilla"
    ],
    "answer": "Godzilla 2000: Millennium",
    "fact": "Incident Timeline // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ054",
    "category": "Incident Timeline",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Godzilla movie was released in 2004?",
    "options": [
      "Godzilla Final Wars",
      "Shin Godzilla",
      "Godzilla Against Mechagodzilla",
      "Godzilla vs. Megaguirus"
    ],
    "answer": "Godzilla Final Wars",
    "fact": "Incident Timeline // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ055",
    "category": "Incident Timeline",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie released first?",
    "options": [
      "Mothra vs. Godzilla",
      "Godzilla vs. Hedorah",
      "Godzilla vs. Megalon",
      "Godzilla Final Wars"
    ],
    "answer": "Mothra vs. Godzilla",
    "fact": "Incident Timeline // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ056",
    "category": "Incident Timeline",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie released first?",
    "options": [
      "Godzilla Raids Again",
      "King Kong vs. Godzilla",
      "Ghidorah, the Three-Headed Monster",
      "Godzilla vs. Gigan"
    ],
    "answer": "Godzilla Raids Again",
    "fact": "Incident Timeline // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ057",
    "category": "Incident Timeline",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which movie released later?",
    "options": [
      "Godzilla x Kong: The New Empire",
      "Godzilla vs. Kong",
      "Godzilla: King of the Monsters",
      "Godzilla 2014"
    ],
    "answer": "Godzilla x Kong: The New Empire",
    "fact": "Incident Timeline // HARD THREAT FILE"
  },
  {
    "id": "KJ058",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Hollywood Godzilla film was directed by Gareth Edwards?",
    "options": [
      "Godzilla 2014",
      "Godzilla 1998",
      "Godzilla vs. Kong",
      "Godzilla x Kong: The New Empire"
    ],
    "answer": "Godzilla 2014",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ059",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Hollywood Godzilla film was directed by Roland Emmerich?",
    "options": [
      "Godzilla 1998",
      "Godzilla 2014",
      "Godzilla vs. Kong",
      "Godzilla: King of the Monsters"
    ],
    "answer": "Godzilla 1998",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ060",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which Monsterverse organization studies Titans?",
    "options": [
      "Monarch",
      "G-Force",
      "Seatopia",
      "Red Bamboo"
    ],
    "answer": "Monarch",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ061",
    "category": "Attack Profile",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which kaijū is most associated with webbing, wings, and guardian symbolism?",
    "options": [
      "Mothra",
      "Megaguirus",
      "Kamacuras",
      "Battra"
    ],
    "answer": "Mothra",
    "fact": "Attack Profile // EASY THREAT FILE"
  },
  {
    "id": "KJ062",
    "category": "Attack Profile",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is associated with drill-like hands?",
    "options": [
      "Megalon",
      "Rodan",
      "Baragon",
      "Ebirah"
    ],
    "answer": "Megalon",
    "fact": "Attack Profile // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ063",
    "category": "Attack Profile",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which monster is known for cybernetic weapons and bladed arms?",
    "options": [
      "Gigan",
      "Manda",
      "Kumonga",
      "Minilla"
    ],
    "answer": "Gigan",
    "fact": "Attack Profile // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ064",
    "category": "Threat Assessment",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is usually one of Godzilla’s most dangerous alien enemies?",
    "options": [
      "King Ghidorah",
      "Anguirus",
      "King Caesar",
      "Minilla"
    ],
    "answer": "King Ghidorah",
    "fact": "Threat Assessment // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ065",
    "category": "Ally / Enemy Status",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū has often shifted between rival, ally, and threat depending on the story?",
    "options": [
      "Rodan",
      "Hedorah",
      "Ebirah",
      "Gabara"
    ],
    "answer": "Rodan",
    "fact": "Ally / Enemy Status // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ066",
    "category": "Ally / Enemy Status",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which kaijū is often portrayed as a loyal ally or battle companion to Godzilla?",
    "options": [
      "Anguirus",
      "Destoroyah",
      "Hedorah",
      "Orga"
    ],
    "answer": "Anguirus",
    "fact": "Ally / Enemy Status // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ067",
    "category": "Threat Assessment",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is a major final enemy in the Heisei Godzilla series?",
    "options": [
      "Destoroyah",
      "Gabara",
      "Ebirah",
      "Kamacuras"
    ],
    "answer": "Destoroyah",
    "fact": "Threat Assessment // HARD THREAT FILE"
  },
  {
    "id": "KJ068",
    "category": "Origin Report",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which creature represents Godzilla before mutation in some Heisei continuity?",
    "options": [
      "Godzillasaurus",
      "Gorosaurus",
      "Baragon",
      "Titanosaurus"
    ],
    "answer": "Godzillasaurus",
    "fact": "Origin Report // HARD THREAT FILE"
  },
  {
    "id": "KJ069",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is a giant aquatic dinosaur controlled by humans in Terror of Mechagodzilla?",
    "options": [
      "Titanosaurus",
      "Varan",
      "Manda",
      "Gorosaurus"
    ],
    "answer": "Titanosaurus",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ070",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which monster is a bully-like creature from All Monsters Attack?",
    "options": [
      "Gabara",
      "Megalon",
      "Orga",
      "Kumonga"
    ],
    "answer": "Gabara",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ071",
    "category": "Film Archive",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which movie title includes the phrase King of the Monsters?",
    "options": [
      "Godzilla: King of the Monsters",
      "Godzilla: City on the Edge of Battle",
      "Godzilla: Tokyo SOS",
      "Godzilla Against Mechagodzilla"
    ],
    "answer": "Godzilla: King of the Monsters",
    "fact": "Film Archive // EASY THREAT FILE"
  },
  {
    "id": "KJ072",
    "category": "Film Archive",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which movie title includes the word Minus?",
    "options": [
      "Godzilla Minus One",
      "Godzilla Final Wars",
      "Godzilla 2000",
      "Godzilla vs. Biollante"
    ],
    "answer": "Godzilla Minus One",
    "fact": "Film Archive // EASY THREAT FILE"
  },
  {
    "id": "KJ073",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie title includes the words Final Wars?",
    "options": [
      "Godzilla Final Wars",
      "Destroy All Monsters",
      "Godzilla vs. Destoroyah",
      "Godzilla vs. Megaguirus"
    ],
    "answer": "Godzilla Final Wars",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ074",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie title includes Tokyo SOS?",
    "options": [
      "Godzilla: Tokyo SOS",
      "Shin Godzilla",
      "Godzilla 2000",
      "Godzilla Raids Again"
    ],
    "answer": "Godzilla: Tokyo SOS",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ075",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie title includes Giant Monsters All-Out Attack?",
    "options": [
      "Godzilla, Mothra and King Ghidorah: Giant Monsters All-Out Attack",
      "Godzilla Against Mechagodzilla",
      "Godzilla vs. SpaceGodzilla",
      "Godzilla x Kong: The New Empire"
    ],
    "answer": "Godzilla, Mothra and King Ghidorah: Giant Monsters All-Out Attack",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ076",
    "category": "Incident Timeline",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which of these was released in the Heisei era?",
    "options": [
      "Godzilla vs. Biollante",
      "Godzilla Final Wars",
      "Shin Godzilla",
      "Godzilla vs. Megalon"
    ],
    "answer": "Godzilla vs. Biollante",
    "fact": "Incident Timeline // HARD THREAT FILE"
  },
  {
    "id": "KJ077",
    "category": "Incident Timeline",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which of these was released in the Millennium era?",
    "options": [
      "Godzilla Against Mechagodzilla",
      "The Return of Godzilla",
      "Godzilla Minus One",
      "Godzilla Raids Again"
    ],
    "answer": "Godzilla Against Mechagodzilla",
    "fact": "Incident Timeline // HARD THREAT FILE"
  },
  {
    "id": "KJ078",
    "category": "Incident Timeline",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which of these was released in the Showa era?",
    "options": [
      "Godzilla vs. Megalon",
      "Godzilla vs. SpaceGodzilla",
      "Shin Godzilla",
      "Godzilla 2000"
    ],
    "answer": "Godzilla vs. Megalon",
    "fact": "Incident Timeline // HARD THREAT FILE"
  },
  {
    "id": "KJ079",
    "category": "Incident Timeline",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which of these was released in the Reiwa era?",
    "options": [
      "Shin Godzilla",
      "Godzilla vs. Destoroyah",
      "Godzilla Against Mechagodzilla",
      "Godzilla vs. Gigan"
    ],
    "answer": "Shin Godzilla",
    "fact": "Incident Timeline // HARD THREAT FILE"
  },
  {
    "id": "KJ080",
    "category": "Threat Assessment",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which monster is a giant mutated ankylosaur-like kaijū?",
    "options": [
      "Anguirus",
      "Manda",
      "Ebirah",
      "Hedorah"
    ],
    "answer": "Anguirus",
    "fact": "Threat Assessment // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ081",
    "category": "Defense Intel",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which group name is commonly connected with anti-Godzilla military operations in some films?",
    "options": [
      "G-Force",
      "Monarch",
      "Seatopia",
      "Infant Island"
    ],
    "answer": "G-Force",
    "fact": "Defense Intel // EASY THREAT FILE"
  },
  {
    "id": "KJ082",
    "category": "Location Intel",
    "difficulty": "easy",
    "type": "choice",
    "question": "Which city is most famously associated with Godzilla attacks?",
    "options": [
      "Tokyo",
      "London",
      "Paris",
      "Rome"
    ],
    "answer": "Tokyo",
    "fact": "Location Intel // EASY THREAT FILE"
  },
  {
    "id": "KJ083",
    "category": "Location Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which island is strongly associated with Mothra?",
    "options": [
      "Infant Island",
      "Monster Island",
      "Letchi Island",
      "Skull Island"
    ],
    "answer": "Infant Island",
    "fact": "Location Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ084",
    "category": "Location Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which fictional undersea civilization is associated with Megalon?",
    "options": [
      "Seatopia",
      "Monarch",
      "Odo Island",
      "Planet X"
    ],
    "answer": "Seatopia",
    "fact": "Location Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ085",
    "category": "Location Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which alien location is associated with Monster Zero?",
    "options": [
      "Planet X",
      "Infant Island",
      "Letchi Island",
      "Monster Island"
    ],
    "answer": "Planet X",
    "fact": "Location Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ086",
    "category": "Threat Assessment",
    "difficulty": "medium",
    "type": "choice",
    "question": "Monster Zero is another name often associated with which kaijū?",
    "options": [
      "King Ghidorah",
      "Rodan",
      "Gigan",
      "Mechagodzilla"
    ],
    "answer": "King Ghidorah",
    "fact": "Threat Assessment // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ087",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie features astronauts discovering Monster Zero on Planet X?",
    "options": [
      "Invasion of Astro-Monster",
      "Godzilla vs. Megalon",
      "Destroy All Monsters",
      "Godzilla vs. Gigan"
    ],
    "answer": "Invasion of Astro-Monster",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ088",
    "category": "Battle History",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie first brought Mothra and Godzilla into a major cinematic clash?",
    "options": [
      "Mothra vs. Godzilla",
      "Ghidorah, the Three-Headed Monster",
      "Godzilla vs. Mothra",
      "Godzilla Final Wars"
    ],
    "answer": "Mothra vs. Godzilla",
    "fact": "Battle History // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ089",
    "category": "Battle History",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which movie has Godzilla, Rodan, and Mothra join forces against King Ghidorah?",
    "options": [
      "Ghidorah, the Three-Headed Monster",
      "Godzilla vs. Mechagodzilla",
      "Godzilla vs. Hedorah",
      "Godzilla vs. Destoroyah"
    ],
    "answer": "Ghidorah, the Three-Headed Monster",
    "fact": "Battle History // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ090",
    "category": "Threat Assessment",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which monster is a mutated alien creature that tries to absorb Godzilla’s DNA?",
    "options": [
      "Orga",
      "Gigan",
      "Megalon",
      "Battra"
    ],
    "answer": "Orga",
    "fact": "Threat Assessment // HARD THREAT FILE"
  },
  {
    "id": "KJ091",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which anime Godzilla film begins after humanity has fled Earth for thousands of years?",
    "options": [
      "GODZILLA: Planet of the Monsters",
      "GODZILLA: The Planet Eater",
      "GODZILLA: Singular Point",
      "Godzilla Minus One"
    ],
    "answer": "GODZILLA: Planet of the Monsters",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ092",
    "category": "Film Archive",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which anime film is the final installment of the Polygon Pictures Godzilla anime trilogy?",
    "options": [
      "GODZILLA: The Planet Eater",
      "GODZILLA: Planet of the Monsters",
      "GODZILLA: A City on the Edge of Battle",
      "Godzilla 2000"
    ],
    "answer": "GODZILLA: The Planet Eater",
    "fact": "Film Archive // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ093",
    "category": "Defense Intel",
    "difficulty": "medium",
    "type": "choice",
    "question": "Which anime trilogy entry features Mechagodzilla City?",
    "options": [
      "GODZILLA: A City on the Edge of Battle",
      "GODZILLA: The Planet Eater",
      "Shin Godzilla",
      "Godzilla Final Wars"
    ],
    "answer": "GODZILLA: A City on the Edge of Battle",
    "fact": "Defense Intel // MEDIUM THREAT FILE"
  },
  {
    "id": "KJ094",
    "category": "Kaijū Identification",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which name is associated with the 1998 American Godzilla creature in later Toho media?",
    "options": [
      "Zilla",
      "Orga",
      "Varan",
      "Gabara"
    ],
    "answer": "Zilla",
    "fact": "Kaijū Identification // HARD THREAT FILE"
  },
  {
    "id": "KJ095",
    "category": "Film Archive",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which Godzilla film features a crustacean kaijū and the Red Bamboo group?",
    "options": [
      "Ebirah, Horror of the Deep",
      "Godzilla vs. Hedorah",
      "Godzilla vs. Megalon",
      "Son of Godzilla"
    ],
    "answer": "Ebirah, Horror of the Deep",
    "fact": "Film Archive // HARD THREAT FILE"
  },
  {
    "id": "KJ096",
    "category": "Film Archive",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which movie features Minilla and giant insects on an island?",
    "options": [
      "Son of Godzilla",
      "Godzilla Raids Again",
      "Destroy All Monsters",
      "Godzilla vs. Gigan"
    ],
    "answer": "Son of Godzilla",
    "fact": "Film Archive // HARD THREAT FILE"
  },
  {
    "id": "KJ097",
    "category": "Battle History",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which kaijū is paired with Gigan as an enemy in Godzilla vs. Megalon?",
    "options": [
      "Megalon",
      "Manda",
      "Baragon",
      "Varan"
    ],
    "answer": "Megalon",
    "fact": "Battle History // HARD THREAT FILE"
  },
  {
    "id": "KJ098",
    "category": "Film Archive",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which film ends the original Showa-era Godzilla run?",
    "options": [
      "Terror of Mechagodzilla",
      "Godzilla vs. Megalon",
      "Destroy All Monsters",
      "Godzilla vs. Hedorah"
    ],
    "answer": "Terror of Mechagodzilla",
    "fact": "Film Archive // HARD THREAT FILE"
  },
  {
    "id": "KJ099",
    "category": "Film Archive",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which film ends the Heisei Godzilla run?",
    "options": [
      "Godzilla vs. Destoroyah",
      "Godzilla vs. SpaceGodzilla",
      "Godzilla vs. Mechagodzilla II",
      "Godzilla vs. King Ghidorah"
    ],
    "answer": "Godzilla vs. Destoroyah",
    "fact": "Film Archive // HARD THREAT FILE"
  },
  {
    "id": "KJ100",
    "category": "Film Archive",
    "difficulty": "hard",
    "type": "choice",
    "question": "Which film ends the Millennium Godzilla run?",
    "options": [
      "Godzilla Final Wars",
      "Godzilla: Tokyo SOS",
      "Godzilla Against Mechagodzilla",
      "Godzilla 2000: Millennium"
    ],
    "answer": "Godzilla Final Wars",
    "fact": "Film Archive // HARD THREAT FILE"
  }
];
let triviaState={active:false,questions:[],index:0,score:0,correct:0,wrong:0,streak:0,answered:false,secondsLeft:TRIVIA_TIME_LIMIT,startedAt:0,current:null,timer:null,transitionTimer:null,startDelayTimer:null,transitionDeadline:0,startDeadline:0,timerArmed:false};
const jetTypes=[{key:"j1",hp:1,w:150,h:108,speed:330,score:35,amp:60,rate:[1.1,1.8]},{key:"j2",hp:2,w:112,h:80,speed:285,score:55,amp:90,rate:[.9,1.5]},{key:"j3",hp:3,w:120,h:86,speed:245,score:75,amp:70,rate:[1.25,2.0]}];
const JET_STREAK_BONUS_START=5;
const JET_STREAK_DOUBLE=8;
const JET_STREAK_TRIPLE=12;
const BOMBER_SCORE=200;
const DESTROYER_SCORE=1000;
const SURVIVAL_SCORE_PER_SECOND=3;
const END_TIME_BONUS_WIN_MAX=20000;
const END_TIME_BONUS_LOSS_MAX=6000;
const END_TIME_BONUS_WIN_DECAY=180;
const END_TIME_BONUS_LOSS_DECAY=60;
const END_JET_DESTROYED_BONUS=500;
const END_VICTORY_BONUS=8000;

function jetTypeMultiplier(jet){
  if(!jet||!jet.type)return 1;
  return jet.type.key==="j3"?3:2;
}
function jetStreakTierMultiplier(count){
  if(count>=JET_STREAK_TRIPLE)return 3;
  if(count>=JET_STREAK_DOUBLE)return 2;
  if(count>=JET_STREAK_BONUS_START)return 1;
  return 0;
}
function updateJetMultiplier(){
  const tier=jetStreakTierMultiplier(streak);
  multiplier=tier>0?tier:1;
  return tier;
}
function awardJetScore(jet){
playSfx("jet_explosion");
rage=clamp(rage+16,0,100);
  streak++;
  const tier=updateJetMultiplier();
  const typeMult=jetTypeMultiplier(jet);
  const scoreMult=tier>0?typeMult*tier:1;
  score+=Math.floor((jet&&jet.type?jet.type.score:0)*scoreMult);
}
const renderCache={gradients:Object.create(null),tintedIcons:new Map(),passiveDrawAt:0};
const HUD_ICON_SIZES=Object.freeze({shieldW:44,shieldH:54,shieldStep:56,roarW:97,roarH:48});
function invalidateRenderCaches(){renderCache.gradients=Object.create(null);renderCache.tintedIcons.clear()}
function cachedGradient(name,build){const key=`${name}|${canvas.width}x${canvas.height}`;return renderCache.gradients[key]||(renderCache.gradients[key]=build())}

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rand(a,b){return Math.random()*(b-a)+a}
function smoothstep(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function jetLeftEdgeSpeedBoost(j){
  const easeStart=canvas.width*.48;
  const easeEnd=canvas.width*.06;
  const t=(easeStart-j.x)/(easeStart-easeEnd);
  return 1+smoothstep(t)*.55;
}
function waterLine(){return canvas.height*.78}
function isSubmergeed(){return player.y>waterLine()+42}
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;invalidateRenderCaches();player.x=clamp(player.x||canvas.width*.15,100,canvas.width*.50);player.y=clamp(player.y||canvas.height*.72,waterLine()-65,canvas.height*.94)}
addEventListener("resize",resize);resize();

function updateLoadingScreen(done,total,label=""){
  const pct=total?Math.round((done/total)*100):100;
  if(loadingFill)loadingFill.style.width=pct+"%";
  if(loadingStatus)loadingStatus.textContent=`Loading ${pct}%${label?` // ${label}`:""}`;
}
function finishLoadingScreen(){
  updateLoadingScreen(1,1,"Ready");
  if(loader)setTimeout(()=>loader.classList.add("hidden"),240);
}
function failLoadingScreen(err){
  console.error(err);
  if(loadingFill)loadingFill.style.width="100%";
  if(loadingStatus){
    loadingStatus.classList.add("error");
    loadingStatus.textContent="Kaiju's Failed To Awaken";
  }
}
function load(src){return new Promise((res,rej)=>{const i=new Image();i.decoding="async";i.onload=()=>{if(i.decode){i.decode().catch(()=>{}).finally(()=>res(i))}else{res(i)}};i.onerror=()=>rej(Error(src));i.src=src})}
async function loadAll(){
const optional=new Set(["kaijuShieldIcon","kaijuRoarIcon","atomicRoarFx","japanSky","fujiSky"]);
const entries=Object.entries(paths).filter(([k,v])=>!v.endsWith(".mp3"));
let done=0;
updateLoadingScreen(done,entries.length,"Starting");
await Promise.all(entries.map(async([k,v])=>{
  try{img[k]=await load(v)}
  catch(err){
    if(optional.has(k)){console.warn("Optional asset missing:",v)}
    else{throw err}
  }
  done++;
  updateLoadingScreen(done,entries.length,k);
}));
}

function audio(){if(!audioEnabled)return;if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function blip(f=220,d=.06,t="sine",v=.02,s=0){if(!audioEnabled)return;audio();const n=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(s)o.frequency.linearRampToValueAtTime(f+s,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(audioCtx.destination);o.start(n);o.stop(n+d)}
function playRoar(reason="event"){
if(!audioEnabled)return;
if(aiStats && elapsed-aiStats.lastRoar<3)return;
aiStats.lastRoar=elapsed;
const src=selected==="mecha"?paths.mechaRoar:paths.godRoar;
try{
  const a=new Audio(src);
  a.volume=reason==="level-clear"?0.62:0.52;
  a.play().catch(()=>{});
}catch(e){}
}

let musicTimer=null,musicGain=null,musicStep=0;
function startMusic(){
if(!audioEnabled)return;
audio();
stopMusic();
musicGain=audioCtx.createGain();
musicGain.gain.value=.05;
musicGain.connect(audioCtx.destination);

const root=selected==="mecha"?46.25:41.2; // dark low chiptune roots
const bass=[0,0,3,5,0,-2,3,7,0,5,3,0,-2,0,3,-5];
const lead=[12,15,17,15,12,10,12,7,10,12,15,17,19,17,15,12];
const pulse=[0,.9,0,.5,0,.75,0,.4,0,.9,0,.6,0,.8,0,.45];

function step(){
if(!audioEnabled||state==="gameover"||state==="menu"){stopMusic();return;}
if(state==="paused"||state==="briefing")return;
const now=audioCtx.currentTime;
const b=root*Math.pow(2,bass[musicStep%bass.length]/12);
const l=root*Math.pow(2,lead[musicStep%lead.length]/12);
const pulseAmp=pulse[musicStep%pulse.length];

const o=audioCtx.createOscillator();
const g=audioCtx.createGain();
o.type="square";
o.frequency.setValueAtTime(b,now);
g.gain.setValueAtTime(.075,now);
g.gain.exponentialRampToValueAtTime(.0001,now+.16);
o.connect(g);g.connect(musicGain);
o.start(now);o.stop(now+.18);

const o2=audioCtx.createOscillator();
const g2=audioCtx.createGain();
o2.type="triangle";
o2.frequency.setValueAtTime(l,now);
g2.gain.setValueAtTime(.03,now);
g2.gain.exponentialRampToValueAtTime(.0001,now+.11);
o2.connect(g2);g2.connect(musicGain);
o2.start(now);o2.stop(now+.12);

if(pulseAmp>0){
  const o3=audioCtx.createOscillator();
  const g3=audioCtx.createGain();
  o3.type="sawtooth";
  o3.frequency.setValueAtTime(root*.5,now);
  o3.frequency.exponentialRampToValueAtTime(root*.22,now+.08);
  g3.gain.setValueAtTime(.02*pulseAmp,now);
  g3.gain.exponentialRampToValueAtTime(.0001,now+.09);
  o3.connect(g3);g3.connect(musicGain);
  o3.start(now);o3.stop(now+.1);
}

musicStep++;
}
step();
musicTimer=setInterval(step,220);
}
function stopMusic(){
if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
if(musicGain){try{musicGain.disconnect()}catch(e){} musicGain=null;}
}

const HIGH_SCORE_KEYS=[
  "kaijuArcadeScoresV1",
  "kaijuArcadeTop5V1",
  
  
  
  
  
  "kaijuArcadeLegacy"
];
const SEED_HIGH_SCORES_TO_IGNORE=[{initials:"TOM",score:125000},{initials:"AAA",score:98500},{initials:"MEK",score:72200}];
function isSeedHighScore(s){
  const initials=cleanInitials(s&&s.initials,"AAA");
  const score=Math.floor(Number(s&&s.score)||0);
  return SEED_HIGH_SCORES_TO_IGNORE.some(seed=>seed.initials===initials&&seed.score===score);
}
const ATTRACT_LINES=["RAVAGE THE CITY","UNLEASH ATOMIC POWER","LEAD THE MONSTER ASSAULT"];
let attractTimer=null,attractIndex=0,scoreBreakdownData=null,newHighAchieved=false;
// Arcade leaderboards are intentionally stored locally.
let remoteHighs=[];
let remoteScoresReady=false;
function formatArcadeScore(n,digits=4){const width=Math.min(4,Math.max(1,Math.floor(Number(digits)||4)));const value=Math.max(0,Math.floor(Number(n)||0));return String(value).padStart(width,"0")}

function cleanInitials(v,fallback="AAA"){
  const s=String(v||fallback).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,3);
  return s || fallback;
}
function cleanScoreRow(s){
  if(!s)return null;
  if(typeof s==="number")return {initials:"AAA",score:Math.floor(s)};
  if(typeof s==="string"){
    const n=Number(s);
    return Number.isFinite(n)?{initials:"AAA",score:Math.floor(n)}:null;
  }
  const n=Number(s.score ?? s.highScore ?? s.value ?? 0);
  if(!Number.isFinite(n)||n<=0)return null;
  return {initials:cleanInitials(s.initials ?? s.name ?? s.player ?? "AAA"),score:Math.floor(n)};
}
function readScoreKey(k){
  try{
    const raw=localStorage.getItem(k);
    if(!raw)return [];
    const parsed=JSON.parse(raw);
    const arr=Array.isArray(parsed)?parsed:[parsed];
    return arr.map(cleanScoreRow).filter(Boolean);
  }catch(e){
    try{
      const raw=localStorage.getItem(k);
      const row=cleanScoreRow(raw);
      return row?[row]:[];
    }catch(_){return []}
  }
}
function normalizeScoreRows(rows,limit=10){
  return (rows||[])
    .map(cleanScoreRow)
    .filter(s=>s&&Number.isFinite(Number(s.score))&&!isSeedHighScore(s))
    .sort((a,b)=>(b.score||0)-(a.score||0))
    .filter((s,i,a)=>a.findIndex(x=>x.score===s.score&&x.initials===s.initials)===i)
    .slice(0,limit);
}
function loadScores(){
  const rows=[];
  HIGH_SCORE_KEYS.forEach(k=>rows.push(...readScoreKey(k)));
  rows.push(...(remoteHighs||[]));
  return normalizeScoreRows(rows,5);
}
async function refreshServerScores(){}
async function submitServerScore(initials,scoreValue){return {ok:true,scores:highs};}

let highs=loadScores();
let autoSavedHighScore=0;
function loadAllTimeStats(){try{return JSON.parse(localStorage.getItem("kaijuArcadeStatsV1")||"{}")}catch{return{}}}
let allTimeStats=Object.assign({shots:0,hits:0,godShots:0,mechaShots:0,godHits:0,mechaHits:0,damageDone:0,shieldBlocks:0,damageBlocked:0,specials:0,buildingsDestroyed:0,biggestHit:0,wins:0,closestWinHp:999,cityDamage:0},loadAllTimeStats());
let allTimeStatsSaveTimer=null;
function flushAllTimeStats(){if(allTimeStatsSaveTimer){clearTimeout(allTimeStatsSaveTimer);allTimeStatsSaveTimer=null}try{localStorage.setItem("kaijuArcadeStatsV1",JSON.stringify(allTimeStats))}catch(e){}}
function saveAllTimeStats(){if(allTimeStatsSaveTimer)return;allTimeStatsSaveTimer=setTimeout(flushAllTimeStats,250)}
function bumpAllTime(k,v=1){allTimeStats[k]=(allTimeStats[k]||0)+v;saveAllTimeStats()}
function setAllTimeMax(k,v){allTimeStats[k]=Math.max(allTimeStats[k]||0,v);saveAllTimeStats()}
addEventListener("beforeunload",flushAllTimeStats);

function saveScores(){
highs=highs
  .map(cleanScoreRow)
  .filter(s=>s&&!isSeedHighScore(s))
  .sort((a,b)=>(b.score||0)-(a.score||0))
  .filter((s,i,a)=>a.findIndex(x=>x.score===s.score&&x.initials===s.initials)===i)
  .slice(0,5);
try{
  localStorage.setItem("kaijuArcadeScoresV1",JSON.stringify(highs));
  localStorage.setItem("kaijuArcadeTop5V1",JSON.stringify(highs));
}catch(e){}
}
function topScoreRecord(){
  highs=loadScores().concat(highs||[])
    .map(cleanScoreRow)
    .filter(s=>s&&!isSeedHighScore(s))
    .sort((a,b)=>(b.score||0)-(a.score||0))
    .filter((s,i,a)=>a.findIndex(x=>x.score===s.score&&x.initials===s.initials)===i)
    .slice(0,5);
  return highs[0]||{initials:"---",score:0};
}
function currentHighScore(){return topScoreRecord().score||0}
function syncHighScoreNow(){
  highs=loadScores().concat(highs||[])
    .map(cleanScoreRow)
    .filter(s=>s&&!isSeedHighScore(s))
    .sort((a,b)=>(b.score||0)-(a.score||0))
    .filter((s,i,a)=>a.findIndex(x=>x.score===s.score&&x.initials===s.initials)===i)
    .slice(0,5);
}
function renderScores(){
syncHighScoreNow();
const boardHtml=highs.length
  ? highs.map((s,i)=>`<div class="scoreRow"><span>${i+1}. ${(s.initials||"---").toUpperCase().slice(0,3)}</span><strong>${formatArcadeScore(s.score)}</strong></div>`).join("")
  : `<div class="scoreRow"><span>--</span><span>NO PLAYER SCORES YET</span><strong>${formatArcadeScore(0)}</strong></div>`;
if(scoreList)scoreList.innerHTML=boardHtml;
if(menuScoreList)menuScoreList.innerHTML=boardHtml;
}
function renderRunStats(){}
function startAttractMode(){
  if(!attractLine)return;
  stopAttractMode();
  attractIndex=0;
  attractLine.textContent=ATTRACT_LINES[attractIndex];
  attractTimer=setInterval(()=>{
    if(state!=="menu")return;
    attractIndex=(attractIndex+1)%ATTRACT_LINES.length;
    attractLine.textContent=ATTRACT_LINES[attractIndex];
  },1800);
}
function stopAttractMode(){if(attractTimer){clearInterval(attractTimer);attractTimer=null;}}
function buildScoreBreakdown(baseScore,runTime){
  const timeBonus=victory
    ? Math.max(0,END_TIME_BONUS_WIN_MAX-runTime*END_TIME_BONUS_WIN_DECAY)
    : Math.max(0,END_TIME_BONUS_LOSS_MAX-runTime*END_TIME_BONUS_LOSS_DECAY);
  const enemiesDestroyed=jetsDestroyed*END_JET_DESTROYED_BONUS;
  const victoryBonus=victory?END_VICTORY_BONUS:0;
  const cityDamageBonus=Math.round(aiStats.damageDone*12)+Math.round(aiStats.shieldBlocks*150);
  const finalScore=Math.max(0,Math.floor(baseScore+timeBonus+enemiesDestroyed+victoryBonus+cityDamageBonus));
  return {timeBonus,enemiesDestroyed,victoryBonus,cityDamageBonus,finalScore};
}
function renderScoreBreakdown(){
  if(!scoreBreakdown||!scoreBreakdownData)return;
  const rows=[
    ["Time Bonus",scoreBreakdownData.timeBonus],
    ["Enemies Destroyed",scoreBreakdownData.enemiesDestroyed],
    ["Victory Bonus",scoreBreakdownData.victoryBonus],
    ["Combat Mastery",scoreBreakdownData.cityDamageBonus],
    ["Final Score",scoreBreakdownData.finalScore,"final"]
  ];
  scoreBreakdown.innerHTML=rows.map(r=>`<div class="scoreBreakRow ${r[2]||""}"><span>${r[0]}</span><strong>${formatArcadeScore(r[1])}</strong></div>`).join("");
}
function getRankTitle(finalScore){
  if(selected==="mecha"&&finalScore>=100000)return "MECHANIZED MENACE";
  if(victory&&finalScore>=140000)return "KAIJŪ CHAMPION";
  if(victory&&Math.round(aiStats.cityDamage||0)>=60)return "CITY DESTROYER";
  if(!victory&&jetsDestroyed>=8)return "RAMPAGING THREAT";
  return victory?"CITY WRECKER":"RAMPAGING THREAT";
}
function updateHighScoreEntry(beatHigh){
  newHighAchieved=!!beatHigh;
  if(newHighNotice)newHighNotice.classList.toggle("hidden",!beatHigh);
  if(scoreForm)scoreForm.classList.remove("hidden");
  if(saveBtn){saveBtn.disabled=false;saveBtn.textContent=beatHigh?"Save High Score":"Save Score";}
}
function addScore(){
let name=cleanInitials((initials.value||"AAA").trim(),"AAA");
if(name.length<3) name=name.padEnd(3,"_");
const savedScore=Math.floor(Number(pendingScore||score||0));
if(savedScore>0){
  highs=(highs||[]).filter(s=>!(Number(s.score||0)===savedScore && cleanInitials(s.initials,"AAA")==="YOU"));
  highs.push({initials:name,score:savedScore});
  saveScores();
}
renderScores();
renderRunStats();
pendingScore=savedScore;
autoSavedHighScore=Math.max(autoSavedHighScore,savedScore);
if(finalScoreBig)finalScoreBig.textContent=`Final Score ${formatArcadeScore(savedScore)}`;
if(saveBtn){saveBtn.textContent="Saving...";saveBtn.disabled=true;}
if(newHighNotice)newHighNotice.classList.add("hidden");
submitServerScore(name,savedScore)
  .then(()=>{if(saveBtn)saveBtn.textContent="Saved Locally";})
  .catch(err=>{console.warn("Online score save failed; score kept locally.",err);if(saveBtn)saveBtn.textContent="Saved Local";});
}
function isMobileTriviaOnly(){return false;}
function applyMobileTriviaOnly(){
  if(isMobileTriviaOnly()){
    setChoice("trivia");
  }
}
function setChoice(w){
selectedMode=w==="trivia"?"trivia":"game";
if(w==="godzilla"||w==="mecha")selected=w;
chooseGodzilla.classList.toggle("selected",w==="godzilla");
chooseMecha.classList.toggle("selected",w==="mecha");
if(chooseTrivia)chooseTrivia.classList.toggle("selected",w==="trivia");
if(startBtn)startBtn.textContent="Ready Player One";
}
chooseGodzilla.onclick=()=>setChoice("godzilla");chooseMecha.onclick=()=>setChoice("mecha");if(chooseTrivia)chooseTrivia.onclick=()=>setChoice("trivia");applyMobileTriviaOnly();window.addEventListener("resize",applyMobileTriviaOnly,{passive:true});prewarmScreenTitleBackgrounds();chooseStartTitleBackground();renderScores();refreshServerScores();startAttractMode();
function story(t,m,sec=3){
  bannerTitle.textContent=t;
  bannerText.textContent=m;
  bannerTimer=sec;

  // During gameplay, keep alerts inside the canvas HUD instead of using the floating dialog box.
  // Menus/end screens can still use the dialog if needed.
  if(state==="playing" || state==="paused"){
    banner.classList.add("hidden");
  }else{
    banner.classList.remove("hidden");
  }
}

function reset(){
rage=100;attackBoost=1;diveLock=0;roarPulse=0;bossTier=1;
const profile=rules.profiles[selected];player.maxHp=profile.hp;player.maxEnergy=100;
fire.lastTick=null;fire.soundAt=-1;fire.lastSpecial=-1;soundTimes.clear();

elapsed=0;score=0;shake=0;flash=0;difficulty=1;jetTimer=.8;phase="jets";bannerTimer=0;carrier=null;carrierSpawned=false;victory=false;multiplier=1;streak=0;jetsDestroyed=0;nearMissCd=0;round=1;roundKills=0;roundTarget=waveTargets[0];aiInfo="SCANNING";shieldHits=3;shieldCharge=3;shieldReady=true;escapeReady=false;shieldFx=[];aiStats={shots:0,aimTicks:0,godShots:0,mechaShots:0,hits:0,hitTicks:0,godHits:0,mechaHits:0,bombsDropped:0,missilesFired:0,damageTaken:0,damageDone:0,godDamage:0,mechaDamage:0,shieldBlocks:0,damageBlocked:0,specials:0,buildingsDestroyed:0,biggestHit:0,perfectBlocks:0,beamClashesWon:0,rageActivations:0,cityDamage:0,startTime:0,lastRoar:-999};submergeeTimer=0;submergeeDamageCd=0;atomicRoarUsed=false;atomicRoarTimer=0;atomicRoarTick=0;roarReuseFeedbackAt=-999;bomber=null;bomberEventTimer=rand(2.2,3.8);bomberSpawnCount=0;
player.x=canvas.width*.15;player.y=canvas.height*.72+30;player.hp=player.maxHp;player.energy=player.maxEnergy;player.fireCd=0;player.shieldCd=0;player.shieldTimer=0;player.invuln=0;
beam=null;bombs=[];jets=[];particles=[];rings=[];muzzleFx=[];scoreBreakdownData=null;newHighAchieved=false;
}

function shuffleList(list){
  const arr=[...list];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function prepareTriviaQuestion(q){
  if(!q)return q;
  return {
    ...q,
    options:Array.isArray(q.options)?shuffleList(q.options):q.options
  };
}
function normalizeTriviaAnswer(value){
  return String(value||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g,"")
    .replace(/\b(dr|doctor|the)\b/g,"")
    .replace(/\s+/g," ")
    .trim();
}
function triviaTypeLabel(q){
  if(!q)return "Kaiju Intel";
  if(q.type==="boolean")return "True / False";
  return "Multiple Choice";
}
function triviaFormatScore(v){return formatArcadeScore(Math.max(0,Math.floor(v||0)))}
function triviaScoreForTimeLeft(secondsLeft){
  const pct=clamp(secondsLeft/TRIVIA_TIME_LIMIT,0,1);
  return Math.max(TRIVIA_MIN_POINTS,Math.ceil(TRIVIA_MIN_POINTS+((TRIVIA_MAX_POINTS-TRIVIA_MIN_POINTS)*pct)));
}
function triviaCurrentPotential(){
  const q=triviaState.current;
  if(!q||triviaState.answered)return 0;
  return triviaScoreForTimeLeft(triviaState.secondsLeft);
}
function updateTriviaStats(){
  if(!triviaModal)return;
  const total=triviaState.questions.length||TRIVIA_ROUND_SIZE;
  const current=Math.min(total,Math.max(1,triviaState.index+1));
  const remaining=Math.max(0,total-current+(triviaState.answered?0:1));
  const pct=clamp(triviaState.secondsLeft/TRIVIA_TIME_LIMIT,0,1);
  if(triviaScore)triviaScore.textContent=triviaFormatScore(triviaState.score);
  if(triviaCounter)triviaCounter.textContent=`${current}/${total}`;
  if(triviaRemaining)triviaRemaining.textContent=String(remaining);
  if(triviaPotential)triviaPotential.textContent=triviaFormatScore(triviaCurrentPotential());
  if(triviaTimerText)triviaTimerText.textContent=`${triviaState.secondsLeft.toFixed(1)}s`;
  if(triviaTimerFill){
    const hue=Math.round(pct*120);
    triviaTimerFill.style.width=(pct*100).toFixed(1)+"%";
    triviaTimerFill.style.background=`linear-gradient(90deg,hsl(${hue} 95% 42%),hsl(${Math.max(0,hue-16)} 95% 52%))`;
    triviaTimerFill.style.boxShadow=`0 0 18px hsla(${hue},95%,48%,.34)`;
  }
  if(triviaType)triviaType.textContent=triviaTypeLabel(triviaState.current);
}
function stopTriviaTimer(){
  if(triviaState.timer){clearInterval(triviaState.timer);triviaState.timer=null;}
  triviaState.timerArmed=false;
}
function clearTriviaDelays(){
  if(triviaState.transitionTimer){clearTimeout(triviaState.transitionTimer);triviaState.transitionTimer=null;}
  if(triviaState.startDelayTimer){clearTimeout(triviaState.startDelayTimer);triviaState.startDelayTimer=null;}
  triviaState.transitionDeadline=0;
  triviaState.startDeadline=0;
}
function beginTriviaCountdown(){
  if(triviaState.timer){return;}
  if(triviaState.startDelayTimer){clearTimeout(triviaState.startDelayTimer);triviaState.startDelayTimer=null;}
  triviaState.startDeadline=0;
  if(!triviaState.active||triviaState.answered||!triviaState.current)return;
  triviaState.startedAt=performance.now();
  triviaState.timerArmed=true;
  updateTriviaStats();
  triviaState.timer=setInterval(()=>{
    if(!triviaState.active||triviaState.answered)return;
    triviaState.secondsLeft=Math.max(0,TRIVIA_TIME_LIMIT-((performance.now()-triviaState.startedAt)/1000));
    updateTriviaStats();
    if(triviaState.secondsLeft<=0){
      resolveTriviaAnswer(null,true);
    }
  },100);
}
function startTriviaTimer(delay=1000){
  stopTriviaTimer();
  if(triviaState.startDelayTimer){clearTimeout(triviaState.startDelayTimer);triviaState.startDelayTimer=null;}
  triviaState.secondsLeft=TRIVIA_TIME_LIMIT;
  triviaState.startDeadline=performance.now()+delay;
  updateTriviaStats();
  triviaState.startDelayTimer=setTimeout(beginTriviaCountdown,delay);
}
function scheduleTriviaAdvance(){
  if(triviaState.transitionTimer){clearTimeout(triviaState.transitionTimer);triviaState.transitionTimer=null;}
  triviaState.transitionDeadline=performance.now()+3000;
  triviaState.transitionTimer=setTimeout(()=>{
    if(!triviaState.transitionDeadline)return;
    triviaState.transitionTimer=null;
    triviaState.transitionDeadline=0;
    nextTriviaQuestion();
  },3000);
}
function tickTriviaScheduler(){
  if(state!=="trivia"||!triviaState.active)return;
  const now=performance.now();
  if(triviaState.startDeadline&&now>=triviaState.startDeadline){
    beginTriviaCountdown();
  }
  if(triviaState.transitionDeadline&&now>=triviaState.transitionDeadline){
    if(triviaState.transitionTimer){clearTimeout(triviaState.transitionTimer);triviaState.transitionTimer=null;}
    triviaState.transitionDeadline=0;
    nextTriviaQuestion();
  }
}
function correctTriviaAnswerText(q){
  if(!q)return "";
  if(Array.isArray(q.answer))return q.answer[0]||"";
  return q.answer;
}
function escapeTriviaHTML(value){
  return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
}
function isTriviaCorrect(value,q){
  if(!q)return false;
  const answer=q.answer;
  if(Array.isArray(answer)){
    const normalized=normalizeTriviaAnswer(value);
    return answer.some(a=>normalizeTriviaAnswer(a)===normalized);
  }
  return normalizeTriviaAnswer(value)===normalizeTriviaAnswer(answer);
}
function clearTriviaAnswerStates(){
  if(!triviaAnswers)return;
  triviaAnswers.querySelectorAll("button").forEach(btn=>{
    btn.disabled=true;
    const answer=btn.getAttribute("data-answer")||"";
    if(isTriviaCorrect(answer,triviaState.current))btn.classList.add("correct");
  });
}
function renderTriviaQuestion(){
  if(triviaPotentialStat)triviaPotentialStat.classList.remove("hidden");
  const q=triviaState.current;
  if(!q)return;
  if(triviaQuestion)triviaQuestion.textContent=q.question;
  if(triviaFeedback){
    triviaFeedback.className="triviaFeedback";
    triviaFeedback.innerHTML='<span aria-hidden="true">&nbsp;</span><br><span aria-hidden="true">&nbsp;</span>';
  }
  if(triviaNextBtn)triviaNextBtn.classList.add("hidden");
  if(triviaStartOverBtn)triviaStartOverBtn.classList.add("hidden");
  if(triviaInputWrap)triviaInputWrap.classList.add("hidden");
  if(triviaInput){triviaInput.value="";triviaInput.disabled=true;}
  if(triviaSubmitBtn){triviaSubmitBtn.disabled=true;}
  if(triviaAnswers)triviaAnswers.innerHTML="";
  const opts=q.type==="boolean"?["True","False"]:q.options;
  if(triviaAnswers&&Array.isArray(opts)){
    opts.forEach((option,i)=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="triviaAnswer";
      btn.setAttribute("data-answer",option);
      btn.innerHTML=`<strong>${String.fromCharCode(65+i)}</strong>${option}`;
      btn.onclick=()=>resolveTriviaAnswer(option,false,btn);
      triviaAnswers.appendChild(btn);
    });
  }
  updateTriviaStats();
  startTriviaTimer();
}
function nextTriviaQuestion(){
  clearTriviaDelays();
  stopTriviaTimer();
  triviaState.index++;
  if(triviaState.index>=triviaState.questions.length){
    finishTriviaGame();
    return;
  }
  triviaState.current=triviaState.questions[triviaState.index];
  triviaState.answered=false;
  triviaState.secondsLeft=TRIVIA_TIME_LIMIT;
  renderTriviaQuestion();
}
function resolveTriviaAnswer(value,timedOut=false,button=null){
  const q=triviaState.current;
  if(!q||triviaState.answered)return;
  const correct=!timedOut&&isTriviaCorrect(value,q);
  const points=correct?triviaScoreForTimeLeft(triviaState.secondsLeft):0;
  triviaState.answered=true;
  stopTriviaTimer();
  if(correct){
    triviaState.score+=points;
    triviaState.correct++;
    triviaState.streak++;
  }else{
    triviaState.wrong++;
    triviaState.streak=0;
  }
  if(button){
    button.classList.add(correct?"correct":"wrong");
  }
  clearTriviaAnswerStates();
  if(triviaInput)triviaInput.disabled=true;
  if(triviaSubmitBtn)triviaSubmitBtn.disabled=true;
  if(triviaFeedback){
    triviaFeedback.className=`triviaFeedback ${correct?"good":"bad"}`;
    const result=timedOut?"TIME EXPIRED // 0 PTS":(correct?`CORRECT +${triviaFormatScore(points)} PTS`:"WRONG // 0 PTS");
    const answerText=escapeTriviaHTML(correctTriviaAnswerText(q));
    triviaFeedback.innerHTML=`<strong>${result}</strong><br><span>Correct Answer: ${answerText}</span>`;
  }
  if(triviaNextBtn)triviaNextBtn.classList.add("hidden");
  updateTriviaStats();
  scheduleTriviaAdvance();
}
function finishTriviaGame(){
  clearTriviaDelays();
  stopTriviaTimer();
  const total=triviaState.questions.length||TRIVIA_ROUND_SIZE;
  const accuracy=total?Math.round((triviaState.correct/total)*100):0;
  const rank=accuracy>=90?"KAIJŪ DEFENSE COMMANDER":accuracy>=80?"KAIJŪ DEFENSE LEAD":accuracy>=70?"TITAN RESPONSE CAPTAIN":accuracy>=60?"KAIJŪ TACTICAL SPECIALIST":accuracy>=50?"MONSTER RECON OFFICER":"KAIJŪ RECRUIT";
  triviaState.current=null;
  triviaState.answered=true;
  if(triviaQuestion)triviaQuestion.textContent="Trivia Complete";
  if(triviaAnswers)triviaAnswers.innerHTML="";
  if(triviaInputWrap)triviaInputWrap.classList.add("hidden");
  if(triviaPotentialStat)triviaPotentialStat.classList.add("hidden");
  if(triviaFeedback){
    triviaFeedback.className="triviaFeedback done";
    triviaFeedback.innerHTML=`<strong>${rank}</strong><br>Final Score ${triviaFormatScore(triviaState.score)} // Correct ${triviaState.correct}/${total} // Accuracy ${accuracy}%`;
  }
  if(triviaNextBtn)triviaNextBtn.classList.add("hidden");
  if(triviaStartOverBtn)triviaStartOverBtn.classList.remove("hidden");
  triviaState.secondsLeft=0;
  updateTriviaStats();
}
function openTriviaGame(){
  audio();
  stopAttractMode();
  stopMusic();
  releaseTouchKeys();
  setTouchControlsVisible(false);
  state="trivia";
  if(triviaModal)triviaModal.classList.remove("hidden");
  triviaState.active=true;
  triviaState.questions=shuffleList(TRIVIA_QUESTIONS.filter(q=>q.type!=="fill")).slice(0,TRIVIA_ROUND_SIZE).map(prepareTriviaQuestion);
  triviaState.index=-1;
  triviaState.score=0;
  triviaState.correct=0;
  triviaState.wrong=0;
  triviaState.streak=0;
  nextTriviaQuestion();
  blip(520,.12,"square",.035,220);
}
function closeTriviaGame(){
  clearTriviaDelays();
  stopTriviaTimer();
  triviaState.active=false;
  triviaState.current=null;
  state="menu";
  if(triviaModal)triviaModal.classList.add("hidden");
  chooseStartTitleBackground();
  startAttractMode();
}
function handleTriviaKey(k){
  if(k==="escape"){closeTriviaGame();return true;}
  if(k==="enter")return true;
  if(!triviaState.answered&&triviaState.current){
    const opts=triviaState.current.type==="boolean"?["True","False"]:triviaState.current.options;
    const indexMap={a:0,b:1,c:2,d:3,"1":0,"2":1,"3":2,"4":3};
    if(Array.isArray(opts)&&Object.prototype.hasOwnProperty.call(indexMap,k)&&opts[indexMap[k]]){
      const btn=triviaAnswers?triviaAnswers.querySelectorAll("button")[indexMap[k]]:null;
      resolveTriviaAnswer(opts[indexMap[k]],false,btn);
      return true;
    }
  }
  return false;
}

function start(){
if(selectedMode==="trivia"){openTriviaGame();return;}
audio();
finish.savedWin=false;
stopAttractMode();
stopMusic();
reset();
state="playing";
menu.classList.add("hidden");
end.classList.add("hidden");
releaseTouchKeys();
setTouchControlsVisible(true);
openMissionBrief(false);
musicStep=0;
startMusic();
blip(200,.18,"sawtooth",.04,120);
}
function finish(){
if(state==="gameover")return;
if(victory&&!finish.savedWin){
  bumpAllTime("wins");
  allTimeStats.closestWinHp=Math.min(allTimeStats.closestWinHp||999,player.hp);
  flushAllTimeStats();
  finish.savedWin=true;
}
playSfx(victory?"high_score":"game_over",.2);state="gameover";
shake=0;
flash=0;
releaseTouchKeys();
setTouchControlsVisible(false);
stopMusic();
const previousHigh=currentHighScore();
const hitPct=aiStats.aimTicks>0?Math.min(100,Math.round((aiStats.hitTicks/aiStats.aimTicks)*100)):0;
const runTime=Math.max(0,Math.floor(elapsed-(aiStats.startTime||0)));
scoreBreakdownData=buildScoreBreakdown(Math.floor(score),runTime);
score=scoreBreakdownData.finalScore;
pendingScore=score;
const beatHigh=score>previousHigh;
updateHighScoreEntry(beatHigh);
chooseGameOverTitleBackground();
end.classList.remove("hidden");end.classList.add("endTokyoBg");end.classList.toggle("godzilla",selected!=="mecha");end.classList.toggle("mecha",selected==="mecha");
endTitle.textContent=victory?"The Bay Is Yours":"Kaijū Down";
if(rankTitle)rankTitle.textContent=getRankTitle(score);
if(finalScoreBig)finalScoreBig.textContent=`Final Score ${formatArcadeScore(score)}`;
renderScoreBreakdown();
endText.textContent=victory
  ? `The Kirin sinks beneath the waves. Tokyo falls silent as you return to the open sea. Accuracy: ${hitPct}%. Time: ${runTime}s.`
  : `Jets destroyed: ${jetsDestroyed}. Accuracy: ${hitPct}%.`;
initials.value="";
renderScores();
renderRunStats();
if(otherKaijūBtn)otherKaijūBtn.textContent=selected==="mecha"?"Try Godzilla":"Try Mechagodzilla";
if(beatHigh)setTimeout(()=>initials.focus(),50);
}
function tryOtherKaijū(){
setChoice(selected==="mecha"?"godzilla":"mecha");
start();
}
function toggleAudio(){
audioEnabled=!audioEnabled;
if(!audioEnabled)stopMusic();
else if(state==="playing")startMusic();
if(!audioEnabled)for(const clip of soundPool.values())clip.pause();
}
function setTouchControlsVisible(show){
const active=!!show && (state==="playing"||state==="paused");
if(touchControls){
  touchControls.classList.toggle("visible",active);
  touchControls.setAttribute("aria-hidden",active?"false":"true");
}
if(gameControlsHud){
  gameControlsHud.classList.toggle("hidden",!active);
  gameControlsHud.setAttribute("aria-hidden",active?"false":"true");
}
}
function setVirtualKey(k,on){
if(!k)return;
keys[k]=!!on;
if(k===" ")keys.space=!!on;
}
function releaseTouchKeys(){
Object.keys(keys).forEach(k=>keys[k]=false);
if(touchControls)touchControls.querySelectorAll(".pressed").forEach(btn=>btn.classList.remove("pressed"));
}
function togglePause(){
releaseTouchKeys();shake=0;if(state==="playing") state="paused";
else if(state==="paused") state="playing";
setTouchControlsVisible(true);
}
startBtn.onclick=start;restartBtn.onclick=start;if(otherKaijūBtn)otherKaijūBtn.onclick=tryOtherKaijū;
if(triviaNextBtn)triviaNextBtn.onclick=nextTriviaQuestion;
if(triviaStartOverBtn)triviaStartOverBtn.onclick=openTriviaGame;
if(triviaExitBtn)triviaExitBtn.onclick=closeTriviaGame;
if(triviaCloseBtn)triviaCloseBtn.onclick=closeTriviaGame;
if(triviaSubmitBtn)triviaSubmitBtn.onclick=()=>{};
saveBtn.onclick=addScore;initials.addEventListener("keydown",e=>{
if(e.key==="Enter"){e.preventDefault();addScore()}
e.stopPropagation();
});
addEventListener("keydown",e=>{
const k=e.key.toLowerCase();
if(state==="trivia"){
  if(handleTriviaKey(k))e.preventDefault();
  return;
}
keys[k]=true;
if(["arrowup","arrowdown","arrowleft","arrowright"," ","x","shift"].includes(k))e.preventDefault();
if(k==="enter"&&state==="menu")start();
else if(k==="enter"&&state==="gameover"){e.preventDefault();if(saveBtn&&!saveBtn.disabled)addScore();else start();}
if(k==="p")togglePause();
if(k==="m")toggleAudio();
if(k==="r")triggerAtomicRoar();
});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

if(touchControls){
touchControls.querySelectorAll("[data-touch-key]").forEach(btn=>{
  const raw=btn.getAttribute("data-touch-key");
  const keyName=raw==="space"?" ":raw;
  const press=e=>{
    e.preventDefault();
    if(state!=="playing"&&state!=="paused")return;
    setVirtualKey(keyName,true);
    btn.classList.add("pressed");
    if(e.pointerId!==undefined&&btn.setPointerCapture){
      try{btn.setPointerCapture(e.pointerId)}catch(_){}
    }
  };
  const release=e=>{
    if(e)e.preventDefault();
    setVirtualKey(keyName,false);
    btn.classList.remove("pressed");
  };
  btn.addEventListener("pointerdown",press);
  btn.addEventListener("pointerup",release);
  btn.addEventListener("pointercancel",release);
  btn.addEventListener("lostpointercapture",release);
  btn.addEventListener("contextmenu",e=>e.preventDefault());
});
touchControls.querySelectorAll("[data-touch-action]").forEach(btn=>{
  btn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    if(state!=="playing"&&state!=="paused")return;
    btn.classList.add("pressed");
    const action=btn.getAttribute("data-touch-action");
    if(action==="roar")triggerAtomicRoar();
    if(action==="pause")togglePause();
    if(action==="mute")toggleAudio();
  });
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>btn.addEventListener(type,()=>btn.classList.remove("pressed")));
  btn.addEventListener("contextmenu",e=>e.preventDefault());
});
}
canvas.addEventListener("pointerdown",e=>{if(state==="menu"){e.preventDefault();start()}});
addEventListener("blur",()=>{releaseTouchKeys();if(state==="playing")togglePause();});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="playing"){releaseTouchKeys();togglePause();}});
addEventListener("orientationchange",()=>setTimeout(()=>{resize();releaseTouchKeys()},120));

function part(x,y,n,c,s=180){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,p=rand(s*.25,s);particles.push({x,y,vx:Math.cos(a)*p,vy:Math.sin(a)*p,life:rand(.25,.75),size:rand(2,6),color:c})}}
function ring(x,y,r,c){rings.push({x,y,r,life:.42,color:c})}function splash(x,y,r){
ring(x,y,r,"rgba(120,230,255,.85)");
ring(x,y,r*.55,"rgba(255,255,255,.75)");
part(x,y-8,16,"rgba(190,245,255,.78)",260);
part(x,y+18,10,"rgba(40,120,180,.50)",150);

// depth-charge plume: vertical water column + underwater bloom
particles.push({x:x,y:y-18,vx:0,vy:-260,life:.45,size:18,color:"rgba(220,250,255,.75)"});
particles.push({x:x-18,y:y+8,vx:-80,vy:-140,life:.38,size:12,color:"rgba(120,220,255,.55)"});
particles.push({x:x+18,y:y+8,vx:80,vy:-140,life:.38,size:12,color:"rgba(120,220,255,.55)"});

shake=Math.max(shake,7);
}

function beamOrigin(){
const mecha=selected==="mecha";

if(mecha){
  const w=414,h=414;
  const baseLeft=player.x-w*.50;
  const baseBottom=player.y+h*.50;
  return {
    x:baseLeft+w*.70,
    y:baseBottom-h*.68-50
  };
}

const w=415,h=362;
const baseLeft=player.x-w*.50;
const baseBottom=player.y+h*.50;
return {
  x:baseLeft+w*.72+5,
  y:baseBottom-h*.60-18
};
}
function getBeamTarget(origin){
if(carrier && carrier.x > origin.x){
  return {x:carrier.x-carrier.w*.35,y:carrier.y-carrier.h*.38};
}
let best=null,bestDist=Infinity;
if(bomber && bomber.x > origin.x){
  const dx=bomber.x-origin.x, dy=bomber.y-origin.y;
  const d=Math.hypot(dx,dy);
  if(d<bestDist){best={x:bomber.x,y:bomber.y};bestDist=d;}
}
for(const b of bombs){
  if(!b.destructible || b.x <= origin.x) continue;
  const dx=b.x-origin.x, dy=b.y-origin.y;
  const d=Math.hypot(dx,dy);
  if(d<bestDist){best={x:b.x,y:b.y};bestDist=d;}
}
for(const j of jets){
  if(j.x <= origin.x) continue;
  const dx=j.x-origin.x, dy=j.y-origin.y;
  const d=Math.hypot(dx,dy);
  if(d<bestDist){best=j;bestDist=d;}
}
return best;
}
function fire(dt=0){
if(atomicRoarTimer>0){ beam=null; return; }
if(isSubmergeed()) { beam=null; return; }
if(!(keys[" "]||keys.space)) { beam=null; return; }
if(player.energy<=0){ beam=null; return; }

const over=player.energy>82;if(over && (!fire.lastSpecial||elapsed-fire.lastSpecial>.8)){aiStats.specials++;bumpAllTime("specials");fire.lastSpecial=elapsed;}
const drain=rules.profiles[selected].drain*(over?1.12:1)*dt;
player.energy=clamp(player.energy-drain,0,player.maxEnergy);

const o=beamOrigin();
const target=getBeamTarget(o);
let angle=0;

// Aim assistance tracks aircraft across the visible sky while retaining a forward arc.
if(target){
  const desired=Math.atan2(target.y-o.y,target.x-o.x);
  angle=clamp(desired,-Math.PI*.24,Math.PI*.18);
}

const color=selected==="mecha"?"#ff4d64":"#33ff42";
beam={
  x:o.x,
  y:o.y,
  angle,
  w:over?canvas.width*.88:canvas.width*.74,
  h:over?38:28,
  color,
  over,
  phase: elapsed,
  tick: Math.floor(elapsed*4)
};
if(!fire.lastTick||fire.lastTick!==beam.tick){aiStats.shots++;aiStats.aimTicks++;selected==="mecha"?aiStats.mechaShots++:aiStats.godShots++;bumpAllTime("shots");selected==="mecha"?bumpAllTime("mechaShots"):bumpAllTime("godShots");fire.lastTick=beam.tick;}
playSfx(selected==="mecha"?"mecha_laser_fire":"atomic_breath_fire",.75);
if(!fire.soundAt||elapsed-fire.soundAt>.12){
  blip(selected==="mecha"?145:118,.085,"sawtooth",.022,selected==="mecha"?-18:16);
  fire.soundAt=elapsed;
}

if(Math.random()>.35){
  muzzleFx.push({
    x:o.x,
    y:o.y,
    angle,
    life:.14,
    maxLife:.14,
    color:selected==="mecha"?"rgba(255,80,100,.50)":"rgba(80,255,80,.50)"
  });
}
if(player.energy<=0) beam=null;
}
function shield(){/* passive shield system handles blocking */}

function updatePassiveShield(){
shieldCharge=clamp(shieldCharge,0,shieldMax);
shieldHits=Math.floor(shieldCharge);
shieldReady=shieldCharge>=1;
}
function addShieldCharge(v){
shieldCharge=clamp(shieldCharge+v,0,shieldMax);
updatePassiveShield();
}
function bound(){const maxX=phase==="escape"?canvas.width+player.w:canvas.width*.50;player.x=clamp(player.x,100,maxX);player.y=clamp(player.y,waterLine()-65,canvas.height*.94)}
function spawnJet(){
const type=jetTypes[(Math.random()*jetTypes.length)|0],y=rand(canvas.height*.22,canvas.height*.58);
const hpScale=1+(round-1)*.25;
const objScale=1+(round-1)*.25;
const waveOneSpeedBoost=round===1?1.25:1;
const missileRoll=Math.random();
const jetMissiles=missileRoll<.34?0:(missileRoll<.76?1:2);
jets.push({
  type,
  img:img[type.key],
  x:canvas.width+rand(120,320),
  y,
  baseY:y,
  targetY:y,
  scale:rand(1.2,1.3),
  w:type.w*rand(1.2,1.3),
  h:type.h*rand(1.2,1.3),
  hp:Math.ceil((type.hp+3)*hpScale*2.4),
  maxHp:Math.ceil((type.hp+3)*hpScale*2.4),
  t:rand(0,20),
  speed:type.speed*rand(.88,1.02)*difficulty*objScale*waveOneSpeedBoost,
  missileCd:rand(.85,2.2),
  missilesLeft:jetMissiles,
  pathCd:rand(1.8,3.4),
  wavePhase:rand(0,Math.PI*2)
});
}
function spawnBomber(){
if(bomberSpawnCount>=2 || bomber)return;
const hpScale=1+(round-1)*.25;
const heavyJetHp=Math.ceil((jetTypes[2].hp+3)*hpScale*2.4);
const bomberHp=heavyJetHp*3;
const scale=Math.min(1.22,1.08+.04*round+(phase==="carrier"?.04:0));
const baseW=236, baseH=154;
const topY=rand(canvas.height*.065,canvas.height*.20);
const bombsToDrop=(rand(6,9)|0);
const spriteKey=(bomberSpawnCount%2===0)?"bomber":"bomber2";
bomber={
  x:canvas.width+baseW*scale+rand(80,180),
  y:topY,
  baseY:topY,
  targetY:topY,
  w:baseW*scale,
  h:baseH*scale,
  hp:bomberHp,
  maxHp:bomberHp,
  speed:(220+round*14+(phase==="carrier"?18:0))*difficulty*.5,
  bombsLeft:bombsToDrop,
  fireCd:rand(.45,.78),
  pathCd:rand(4.5,7.0),
  wavePhase:rand(0,Math.PI*2),
  t:rand(0,20),
  entering:true,
  spriteKey:spriteKey
};
bomberSpawnCount++;
story("BOMBER ALERT",`Carpet bombing incoming. ${2-bomberSpawnCount} alerts remain.`,2.2);
blip(128,.12,"sawtooth",.03,-18);
}

function updateBomber(dt){
if(!bomber)return;

bomber.t += dt;
bomber.x -= bomber.speed*dt;

// Heavy bomber flight: locked to the top 20% with slow, minimal vertical drift.
const bomberMinY=canvas.height*.065;
const bomberMaxY=canvas.height*.20;
bomber.pathCd -= dt;
if(bomber.pathCd<=0){
  bomber.targetY=rand(bomberMinY,bomberMaxY);
  bomber.pathCd=rand(4.8,7.4);
}
bomber.targetY=clamp(bomber.targetY,bomberMinY,bomberMaxY);
bomber.baseY += (bomber.targetY-bomber.baseY)*dt*.18;
bomber.y = clamp(bomber.baseY + Math.sin(bomber.t*.55+bomber.wavePhase)*2.5,bomberMinY,bomberMaxY);

if(bomber.x < canvas.width*.84) bomber.entering=false;
bomber.fireCd -= dt;

if(!bomber.entering && bomber.bombsLeft>0 && bomber.fireCd<=0){
  aiStats.bombsDropped++;
  const bombScale=rand(1.25,1.45);
  bombs.push({
    x:bomber.x-bomber.w*.32+40+rand(-34,34),
    y:bomber.y+bomber.h*.23-48+rand(-4,8),
    vx:(-112*difficulty)+rand(-26,18),
    vy:88+rand(28,94),
    r:15,
    dmg:Math.max(1,Math.round(16*(1+(round-1)*.25))),
    spin:rand(0,6),
    spinDir:-1,
    life:5.8,
    boss:false,
    bomberBomb:true,
    sizeScale:bombScale,
    launchAngle:Math.PI+rand(-.08,.08)
  });
  bomber.bombsLeft--;
  bomber.fireCd=rand(.42,.70);
  blip(108,.06,"sawtooth",.018,-20);
}

if(bomber.x < -bomber.w-80 || (bomber.bombsLeft<=0 && bomber.x < -60)) bomber=null;
}

function spawnCarrier(){
carrierSpawned=true;
carrier={x:canvas.width+420,y:waterLine(),w:Math.min(720,canvas.width*.52),h:0,hp:260,maxHp:260,fireCd:2.8,t:0,entering:true,targetY:canvas.height*.50};
carrier.h=carrier.w*(img.ship.height/img.ship.width);
phase="carrier";
bossTier=1;story("FINAL DEFENSE / KIRIN","The flagship seals the bay. Watch its glowing turrets before each salvo.",5);
}

function beamYAt(x){
if(!beam) return 0;
return beam.y + Math.tan(beam.angle||0) * (x - beam.x);
}
function beamHitsRect(rx,ry,rw,rh){
if(!beam) return false;
const cx=rx+rw/2;
const y=beamYAt(cx);
return rect(beam.x,y-beam.h/2,beam.w,beam.h,rx,ry,rw,rh);
}

function triggerAtomicRoar(){
if(state!=="playing")return;
if(rage<100||atomicRoarTimer>0){
  if(elapsed-roarReuseFeedbackAt>1.2){
    roarReuseFeedbackAt=elapsed;
    story("ZERO CHARGE","Roar charges through aircraft kills. Keep fighting.",1.8);
    blip(92,.10,"sawtooth",.035,-18);
    shake=Math.max(shake,4);
  }
  return;
}
atomicRoarUsed=true;rage=0;
player.energy=Math.max(0,player.energy-25);
atomicRoarTimer=2.4;roarPulse=2.4;
atomicRoarTick=0;
playRoar("atomic-roar");
story("ATOMIC ROAR ACTIVATED","Shockwave clears missiles and damages nearby defenses.",2.4);
shake=Math.max(shake,12);
}
function updateAtomicRoar(dt){
if(atomicRoarTimer<=0)return;
atomicRoarTimer-=dt;
atomicRoarTick+=dt;
if(atomicRoarTick<1)return;
atomicRoarTick-=1;

const dmg=rules.profiles[selected].roarDamage*attackBoost;
const cx=player.x+20;
const cy=player.y-20;

// Roar breaks the air assault and weakens the flagship without skipping its sinking sequence.
// It damages jets and wipes bombs / missiles.
for(let i=jets.length-1;i>=0;i--){
  const j=jets[i];
  if(j.x>-160 && j.x<canvas.width+180){
    j.hp-=dmg;
    aiStats.damageDone+=dmg;
    aiStats.biggestHit=Math.max(aiStats.biggestHit,dmg);
    setAllTimeMax("biggestHit",dmg);
    bumpAllTime("damageDone",dmg);
    part(j.x,j.y,8,selected==="mecha"?"rgba(255,80,100,.85)":"#00cc00",190);

    if(j.hp<=0){
      jetsDestroyed++;
      roundKills++;
      awardJetScore(j);
      player.energy=clamp(player.energy+5,0,player.maxEnergy);
      part(j.x,j.y,12,"rgba(255,209,102,.95)",240);
      ring(j.x,j.y,62,"rgba(255,209,102,.9)");
      jets.splice(i,1);
    }
  }
}

// Atomic Roar only clips the bomber: 25% of normal roar damage.
if(bomber && bomber.x>-180 && bomber.x<canvas.width+220){
  const bomberRoarDmg=dmg*.25;
  bomber.hp-=bomberRoarDmg;
  aiStats.damageDone+=bomberRoarDmg;
  aiStats.biggestHit=Math.max(aiStats.biggestHit,bomberRoarDmg);
  setAllTimeMax("biggestHit",bomberRoarDmg);
  bumpAllTime("damageDone",bomberRoarDmg);
  part(bomber.x,bomber.y,6,selected==="mecha"?"rgba(255,80,100,.75)":"rgba(0,204,0,.75)",140);
  if(bomber.hp<=0){
    score+=BOMBER_SCORE;
    part(bomber.x,bomber.y,18,"rgba(255,209,102,.95)",260);
    ring(bomber.x,bomber.y,72,"rgba(255,209,102,.9)");
    bomber=null;
  }
}

// Clear visible bombs and missiles.
for(let i=bombs.length-1;i>=0;i--){
  const b=bombs[i];
  if(b.x>-120 && b.x<canvas.width+120 && b.y>-120 && b.y<canvas.height+160){
    part(b.x,b.y,10,b.boss?"rgba(90,220,255,.85)":"rgba(255,209,102,.9)",180);
    ring(b.x,b.y,b.boss?58:42,b.boss?"rgba(90,220,255,.75)":"rgba(255,209,102,.75)");
    score+=b.boss?18:8;
    bombs.splice(i,1);
  }
}

if(carrier&&!carrier.sinking){carrier.hp=Math.max(1,carrier.hp-dmg*.6);part(carrier.x,carrier.y,12,"rgba(125,247,255,.9)",180);}


shake=Math.max(shake,5);
}
function update(dt){
if(state!=="playing")return;
elapsed+=dt;diveLock=Math.max(0,diveLock-dt);roarPulse=Math.max(0,roarPulse-dt);bannerTimer-=dt;if(bannerTimer<=0)banner.classList.add("hidden");
if(roundKills>=roundTarget && phase==="jets"){
  if(round<3){round++;roundKills=0;roundTarget=waveTargets[round-1];openMissionBrief(true);return;}
  else if(!carrierSpawned){spawnCarrier();}
}
const hp=player.hp/player.maxHp,pressure=bombs.length+jets.length*1.25+(carrier?2:0)+(bomber?1.2:0);let target=1+Math.min(.8,elapsed/90);if(phase==="carrier")target+=.12;if(hp<.35)target-=.28;if(pressure>8)target-=.16;difficulty+=(clamp(target,.72,2)-difficulty)*dt*.85;aiInfo=carrier?"BOSS PRIORITY":(hp<.35?"MERCY MODE":(round>1?"ESCALATING":"SCANNING"));nearMissCd-=dt;
const bomberEligible=((round>=2 && phase==="jets") || phase==="carrier");
if(bomberEligible && bomberSpawnCount<2){
  bomberEventTimer-=dt;
  if(!bomber && bomberEventTimer<=0){
    spawnBomber();
    bomberEventTimer=phase==="carrier"?rand(3.5,5.5):rand(3.2,5.2);
  }
}else if(!bomberEligible){
  bomber=null;
}
const sp=isSubmergeed()?170:rules.profiles[selected].speed;
const movingLeft=keys.a||keys.arrowleft;
const movingRight=keys.d||keys.arrowright;
const movingHorizontal=movingLeft||movingRight;
if(keys.w||keys.arrowup)player.y-=sp*dt;if((keys.s||keys.arrowdown)&&diveLock<=0)player.y+=sp*dt;if(movingLeft)player.x-=sp*dt;if(movingRight)player.x+=sp*dt;bound();
player.fireCd-=dt;player.shieldCd-=dt;player.invuln-=dt;player.shieldTimer=Math.max(0,player.shieldTimer-dt);
if(movingHorizontal && !isSubmergeed()){
  player.bob+=dt*8.5;
}else{
  player.bob+=dt*2.5;
}

// Eight seconds of oxygen; depletion forces surfacing and a short dive recovery.
if(isSubmergeed()){
  submergeeTimer+=dt;
  submergeeDamageCd-=dt;
  if(submergeeTimer>=8){player.y=waterLine()-20;diveLock=3;submergeeTimer=0;player.invuln=1;splash(player.x,waterLine(),90);story("SURFACING","Oxygen depleted. Dive recovers in 3 seconds.",2.2);}
}else{
  submergeeTimer=Math.max(0,submergeeTimer-dt*2.5);
  submergeeDamageCd=0;
}
if(atomicRoarTimer<=0){
  if(isSubmergeed()){
    // Submerged recovery: energy and shield regenerate 25% slower than normal.
    player.energy=clamp(player.energy+rules.profiles[selected].regen*.55*dt,0,player.maxEnergy);
    addShieldCharge(.15*dt);
  }else{
    // Surface recovery.
    player.energy=clamp(player.energy+rules.profiles[selected].regen*dt,0,player.maxEnergy);
    addShieldCharge(.20*dt);
  }
}
updatePassiveShield();
fire(dt);updateAtomicRoar(dt);

jetTimer-=dt;
const maxJets=round===1?3:Math.min(3+round,7);
if(jetTimer<=0 && jets.length<maxJets && phase==="jets"){
  spawnJet();
  jetTimer=rand(round===1?1.55:.95,round===1?2.25:1.45)/difficulty/(1+(round-1)*.18);
}

if(beam){
let hitSomething=false;

for(let j=jets.length-1;j>=0;j--){
  const z=jets[j];
  if(beamHitsRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h)){
    const dmg=rules.beamDamage(beam.over,dt,"jet",selected,attackBoost);
    z.hp -= dmg;
    aiStats.damageDone+=dmg; selected==="mecha"?aiStats.mechaDamage+=dmg:aiStats.godDamage+=dmg; aiStats.biggestHit=Math.max(aiStats.biggestHit,dmg); setAllTimeMax("biggestHit",dmg); bumpAllTime("damageDone",dmg); aiStats.hits++; selected==="mecha"?aiStats.mechaHits++:aiStats.godHits++; bumpAllTime("hits"); selected==="mecha"?bumpAllTime("mechaHits"):bumpAllTime("godHits");
    hitSomething=true;
    part(z.x,z.y,2,"rgba(255,209,102,.92)",110);

    if(z.hp<=0){
      jetsDestroyed++;
      roundKills++;
      awardJetScore(z);
      player.energy=clamp(player.energy+5,0,player.maxEnergy);addShieldCharge(shieldMax*.05);
      part(z.x,z.y,12,"rgba(255,209,102,.95)",240);
      ring(z.x,z.y,62,"rgba(255,209,102,.9)");
      jets.splice(j,1);
    }
  }
}

if(carrier && beamHitsRect(carrier.x-carrier.w/2,carrier.y-carrier.h*.82,carrier.w,carrier.h*.72)){
  const bossDmg=rules.beamDamage(beam.over,dt,"boss",selected,attackBoost);
  carrier.hp -= bossDmg;
  aiStats.damageDone+=bossDmg; selected==="mecha"?aiStats.mechaDamage+=bossDmg:aiStats.godDamage+=bossDmg; aiStats.biggestHit=Math.max(aiStats.biggestHit,bossDmg); setAllTimeMax("biggestHit",bossDmg); bumpAllTime("damageDone",bossDmg); aiStats.hits++; selected==="mecha"?aiStats.mechaHits++:aiStats.godHits++; bumpAllTime("hits"); selected==="mecha"?bumpAllTime("mechaHits"):bumpAllTime("godHits");
  hitSomething=true;
  part(carrier.x-carrier.w*.36,beamYAt(carrier.x-carrier.w*.36),3,"rgba(125,247,255,.95)",130);

  if(carrier.hp<=0 && !carrier.sinking){
    score+=DESTROYER_SCORE;
    carrier.hp=0;
    carrier.sinking=true;
    carrier.sinkTimer=0;
    carrier.sinkStartY=carrier.y;
    carrier.sinkStartX=carrier.x;
    carrier.sinkSplashCd=0;
    carrier.sinkBubbleCd=0;
    carrier.burnTimer=1.45;
    carrier.fireCd=999;
    bombs=bombs.filter(b=>!b.boss);
    phase="escape";
    shake=Math.max(shake,14);
    splash(carrier.x,waterLine()+28,210);
    splash(carrier.x-carrier.w*.18,waterLine()+26,124);
    splash(carrier.x+carrier.w*.12,waterLine()+34,116);
    ring(carrier.x,carrier.y-carrier.h*.30,138,"rgba(255,144,72,.52)");
    part(carrier.x-carrier.w*.08,carrier.y-carrier.h*.36,34,"rgba(255,170,90,.92)",240);
    part(carrier.x+carrier.w*.06,carrier.y-carrier.h*.28,22,"rgba(72,72,72,.36)",150);
    playRoar("boss-kill");
    story("DESTROYER SUNK","Move right to finish the run.",2.4);
  }
}

if(bomber && beamHitsRect(bomber.x-bomber.w/2,bomber.y-bomber.h/2,bomber.w,bomber.h)){
  const bomberDmg=rules.beamDamage(beam.over,dt,"bomber",selected,attackBoost);
  bomber.hp -= bomberDmg;
  aiStats.damageDone+=bomberDmg; selected==="mecha"?aiStats.mechaDamage+=bomberDmg:aiStats.godDamage+=bomberDmg; aiStats.biggestHit=Math.max(aiStats.biggestHit,bomberDmg); setAllTimeMax("biggestHit",bomberDmg); bumpAllTime("damageDone",bomberDmg); aiStats.hits++; selected==="mecha"?aiStats.mechaHits++:aiStats.godHits++; bumpAllTime("hits"); selected==="mecha"?bumpAllTime("mechaHits"):bumpAllTime("godHits");
  hitSomething=true;
  part(bomber.x,bomber.y,2,"rgba(255,209,102,.92)",105);
  if(bomber.hp<=0){
    score+=BOMBER_SCORE;
    player.energy=clamp(player.energy+6,0,player.maxEnergy);addShieldCharge(shieldMax*.08);
    part(bomber.x,bomber.y,16,"rgba(255,209,102,.95)",250);
    ring(bomber.x,bomber.y,68,"rgba(255,209,102,.92)");
    bomber=null;
  }
}

for(let i=bombs.length-1;i>=0;i--){
  const b=bombs[i];
  if(!b.destructible) continue;
  if(beamHitsRect(b.x-36,b.y-22,72,44)){
    const mdmg=rules.beamDamage(beam.over,dt,"jet",selected,attackBoost);
    b.hp -= mdmg;
    aiStats.damageDone+=mdmg; selected==="mecha"?aiStats.mechaDamage+=mdmg:aiStats.godDamage+=mdmg; aiStats.biggestHit=Math.max(aiStats.biggestHit,mdmg); setAllTimeMax("biggestHit",mdmg); bumpAllTime("damageDone",mdmg); aiStats.hits++; selected==="mecha"?aiStats.mechaHits++:aiStats.godHits++; bumpAllTime("hits"); selected==="mecha"?bumpAllTime("mechaHits"):bumpAllTime("godHits");
    hitSomething=true;
    part(b.x,b.y,1,"rgba(125,247,255,.92)",80);
    if(b.hp<=0){
      score += b.bonus||40;
      player.energy=clamp(player.energy+2,0,player.maxEnergy);
      part(b.x,b.y,10,"rgba(125,247,255,.95)",180);
      ring(b.x,b.y,34,"rgba(125,247,255,.92)");
      bombs.splice(i,1);
    }
  }
}

if(hitSomething){if(!beam.hitTicked){aiStats.hitTicks++;beam.hitTicked=true;}shake=Math.max(shake,beam.over?4:2);}
}

let activeJetMissiles=bombs.reduce((n,b)=>n+(b.jetMissile?1:0),0);
for(let i=jets.length-1;i>=0;i--){
const j=jets[i];
j.t += dt;
j.x -= j.speed * jetLeftEdgeSpeedBoost(j) * dt;

// Level, smooth flight path: no rotation, no twitch.
j.pathCd -= dt;
if(j.pathCd <= 0){
  j.targetY = rand(canvas.height*.14, canvas.height*.50);
  j.pathCd = rand(1.8,3.4);
}
j.baseY += (j.targetY-j.baseY)*dt*.55;
const flightBob=Math.sin(j.t*1.18+j.wavePhase)*j.type.amp*.12;
const microBob=Math.sin(j.t*2.2+j.wavePhase*.7)*j.type.amp*.025;
j.y=j.baseY+flightBob+microBob;
j.missileCd -= dt;
if(j.missilesLeft>0 && j.missileCd<=0 && activeJetMissiles<5 && j.x<canvas.width*.90 && j.x>canvas.width*.10){
  const tx=player.x+20+rand(-42,42), ty=player.y-20+rand(-30,30);
  const angle=Math.atan2(ty-j.y,tx-j.x);
  const speed=(250+round*16)*.7;
  aiStats.missilesFired++;
  bombs.push({
    x:j.x-j.w*.34,
    y:j.y+j.h*.16,
    vx:Math.cos(angle)*speed,
    vy:Math.sin(angle)*speed-14,
    r:22,
    dmg:Math.max(1,Math.round(22*(1+(round-1)*.25))),
    spin:0,
    spinDir:1,
    life:6.4,
    boss:false,
    jetMissile:true,
    guided:true,
    guide:.24,
    launchAge:0,
    boostDelay:.5,
    boostDuration:.85,
    boostAmount:.65,
    seekX:0,
    seekY:0,
    seekCd:0,
    mortar:false,
    hp:16,
    maxHp:16,
    destructible:true,
    bonus:45,
    sizeScale:1
  });
  activeJetMissiles++;
  j.missilesLeft--;
  j.missileCd=rand(.75,1.45);
  blip(126,.08,"sawtooth",.018,-16);
}
if(!isSubmergeed()&&rect(j.x-j.w/2,j.y-j.h/2,j.w,j.h,player.x-player.w*.18,player.y-player.h*.5,player.w*.52,player.h*.82)&&player.invuln<=0){damage(16,j.x,j.y);jets.splice(i,1)}
if(j.x<-160)jets.splice(i,1);
}

if(carrier){
carrier.t+=dt;
carrier.w=Math.min(720,canvas.width*.52);
carrier.h=carrier.w*(img.ship.height/img.ship.width);

if(carrier.sinking){
  carrier.sinkTimer+=dt;
  const prep=clamp(carrier.sinkTimer/1.15,0,1);
  const submerge=clamp((carrier.sinkTimer-.9)/2.8,0,1);
  const prepEase=prep*prep*(3-2*prep);
  const sinkEase=submerge*submerge*(3-2*submerge);
  carrier.burnTimer=Math.max(0,(carrier.burnTimer||0)-dt);
  carrier.sinkSplashCd=(carrier.sinkSplashCd||0)-dt;
  carrier.sinkBubbleCd=(carrier.sinkBubbleCd||0)-dt;
  carrier.x=carrier.sinkStartX+Math.sin(carrier.sinkTimer*4.2)*(1-prepEase)*12+prepEase*18+sinkEase*36;
  carrier.y=carrier.sinkStartY+prepEase*24+sinkEase*(carrier.h*1.08+170);
  carrier.sinkAngle=.08+prepEase*.24+sinkEase*.44+Math.sin(carrier.sinkTimer*3.6)*.03*(1-sinkEase);
  if(carrier.burnTimer>0){
    if(Math.random()<dt*24){
      part(carrier.x+rand(-carrier.w*.18,carrier.w*.08),carrier.y-carrier.h*.44+rand(-20,36),3,"rgba(255,174,82,.92)",rand(140,220));
    }
    if(Math.random()<dt*18){
      part(carrier.x+rand(-carrier.w*.20,carrier.w*.05),carrier.y-carrier.h*.48+rand(-24,14),2,"rgba(72,72,72,.34)",rand(90,150));
    }
  }
  if(carrier.sinkTimer>.25 && carrier.sinkSplashCd<=0){
    carrier.sinkSplashCd=submerge<.5?.22:.14;
    splash(carrier.x+rand(-carrier.w*.28,carrier.w*.18),waterLine()+rand(14,38),rand(submerge<.45?48:68,submerge<.45?88:124));
    if(submerge>.4){
      splash(carrier.x+rand(-carrier.w*.12,carrier.w*.10),waterLine()+rand(18,44),rand(56,98));
    }
  }
  if(carrier.sinkBubbleCd<=0){
    carrier.sinkBubbleCd=.12;
    part(carrier.x+rand(-carrier.w*.20,carrier.w*.16),waterLine()+rand(22,60),rand(3,5),"rgba(188,236,255,.68)",110);
  }
  if(carrier.sinkTimer>=4.2){
    carrier=null;
  }
}else{
  // Keep boss staged near the right side with subtle left/right movement only.
  const bossTargetX=canvas.width*.76 + Math.sin(carrier.t*.55)*canvas.width*.045;
  if(carrier.entering){
    carrier.x -= 90*dt;
    if(carrier.x < bossTargetX) carrier.entering=false;
  }else{
    carrier.x += (bossTargetX-carrier.x)*dt*.7;
  }

  // Restore previous vertical placement. No up/down roaming.
  carrier.y=waterLine()-55+Math.sin(carrier.t*1.15)*5;
  const tier=rules.bossTier(carrier.hp,carrier.maxHp);if(tier!==bossTier){bossTier=tier;story(tier===3?"KIRIN / LAST STAND":"KIRIN / FULL BROADSIDE",tier===3?"Triple salvos incoming. Dive, recover, counterattack.":"The fleet intensifies its barrage.",3);}
carrier.fireCd-=dt;if(carrier.fireCd<=0){
  const activeBossMissiles=bombs.filter(b=>b.boss).length;
  const canFire=Math.max(0,(bossTier===3?5:3)-activeBossMissiles);
  const burst=Math.min(canFire,bossTier);
  const turrets=[{x:-.30,y:-.33},{x:-.05,y:-.38},{x:.23,y:-.30}];

  for(let bi=0;bi<burst;bi++){
    const p=turrets[(Math.random()*turrets.length)|0];
    const arc=rand(-470,-330);
    const lateral=rand(-380,-285);
    const startX=carrier.x+carrier.w*p.x+rand(-18,18);
    const farFactor=clamp(startX/canvas.width,.55,1.25);

    aiStats.missilesFired++;bombs.push({
      x:startX,
      y:carrier.y+carrier.h*p.y+rand(-10,10),
      vx:(lateral*farFactor)*difficulty,
      vy:arc+rand(-40,40),
      r:34,
      dmg:32,
      spin:rand(0,6),
      spinDir:1,
      life:9.5,
      boss:true,destructible:true,hp:18,maxHp:18,bonus:60,
      mortar:true,
      guided:true,
      guide:.15,
      seekX:0,
      seekY:0,
      seekCd:0
    });
  }

  carrier.fireCd=bossTier===3?1.6:bossTier===2?2.1:2.8;
  blip(86,.16,"sawtooth",.035,-30)
  }
  if(carrier&&carrier.x<-carrier.w)carrier.x=canvas.width+carrier.w;
}
}

updateBomber(dt);

for(let i=bombs.length-1;i>=0;i--){
const b=bombs[i];if(b.guided && !isSubmergeed()){
  let tx=player.x+20, ty=player.y-20;
  let clampX=24, clampY=18, guideScale=.7;
  if(b.boss||b.jetMissile){
    b.seekCd=(b.seekCd||0)-dt;
    if(b.seekCd<=0){
      b.seekCd=rand(.18,.32);
      b.seekX=tx+rand(-78,78);
      b.seekY=ty+rand(-56,56);
    }
    tx=b.seekX;
    ty=b.seekY;
    clampX=22;
    clampY=16;
    guideScale=.68;
  }
  b.vx += clamp((tx-b.x)*b.guide*dt*guideScale,-clampX,clampX);
  b.vy += clamp((ty-b.y)*b.guide*dt*guideScale,-clampY,clampY);
}
let missileMoveScale=1;
if(b.jetMissile){
  b.launchAge=(b.launchAge||0)+dt;
  const boostT=clamp((b.launchAge-(b.boostDelay||.5))/(b.boostDuration||.85),0,1);
  const boostEase=boostT*boostT*(3-2*boostT);
  missileMoveScale=1+boostEase*(b.boostAmount||.65);
}
b.x+=b.vx*dt*missileMoveScale;b.y+=b.vy*dt*missileMoveScale;b.vy+=(b.mortar?470:(b.boss?80:90))*dt;b.spin+=(b.spinDir||1)*dt*2.2;b.life-=dt;const d=Math.hypot(b.x-(player.x+20),b.y-(player.y-18));
const splashY=waterLine()+38;
if(b.y>=splashY){
  splash(b.x,splashY,100);const cityHit=b.boss?3:(b.bomber||b.bomberBomb?2:1);const buildHit=b.boss?2:(b.bomber||b.bomberBomb?2:1);aiStats.cityDamage=clamp(aiStats.cityDamage+cityHit,0,100);aiStats.buildingsDestroyed+=buildHit;bumpAllTime("cityDamage",cityHit);bumpAllTime("buildingsDestroyed",buildHit);
  if(!isSubmergeed()){
    const sd=Math.hypot(b.x-(player.x+20),splashY-(player.y-18));
    if(sd<100) damage(Math.round(b.dmg*.75),b.x,splashY);
  }
  bombs.splice(i,1);
  continue;
}
if(!isSubmergeed()&&d<96&&d>68&&nearMissCd<=0){nearMissCd=.35;score+=(b.bomber||b.jetMissile?16:12);player.energy=clamp(player.energy+(b.bomber?4:3),0,player.maxEnergy)}
if(!isSubmergeed()&&d<b.r+56&&player.invuln<=0){damage(b.dmg,b.x,b.y);splash(b.x,b.y,100);const cityHit=b.boss?3:(b.bomber||b.bomberBomb?2:1);const buildHit=b.boss?2:(b.bomber||b.bomberBomb?2:1);aiStats.cityDamage=clamp(aiStats.cityDamage+cityHit,0,100);aiStats.buildingsDestroyed+=buildHit;bumpAllTime("cityDamage",cityHit);bumpAllTime("buildingsDestroyed",buildHit);bombs.splice(i,1);continue}
if(b.life<=0||b.y>canvas.height+120||b.x<-180)bombs.splice(i,1);
}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.985,dt*60);p.vy*=Math.pow(.985,dt*60);p.life-=dt;if(p.life<=0)particles.splice(i,1)}
for(let i=rings.length-1;i>=0;i--){rings[i].life-=dt;if(rings[i].life<=0)rings.splice(i,1)}
if(particles.length>90)particles.splice(0,particles.length-90);if(rings.length>18)rings.splice(0,rings.length-18);if(muzzleFx.length>18)muzzleFx.splice(0,muzzleFx.length-18);
score+=dt*SURVIVAL_SCORE_PER_SECOND;shake*=Math.pow(.88,dt*60);flash-=dt;if(phase==="escape"&&!carrier&&player.x>canvas.width+player.w*.45){victory=true;score+=1000;playRoar("level-clear");finish();return}
if(player.hp<=0)finish();
}
function damage(n,x,y){
if(player.invuln>0)return;updatePassiveShield();

if(shieldCharge>=1){
  playSfx("shield_hit");player.invuln=.4;shieldCharge=Math.max(0,shieldCharge-1);aiStats.shieldBlocks++;aiStats.damageBlocked+=n;bumpAllTime("shieldBlocks");bumpAllTime("damageBlocked",n);
  updatePassiveShield();
  if(shieldCharge<=0){
    story("SHIELD EMPTY","Atomic Shield depleted.",1.5);
    blip(82,.10,"sawtooth",.035,-22);
  }

  const px=player.x+20;
  const py=player.y-20;
  const angle=Math.atan2(y-py,x-px);

  shieldFx.push({
    x:px,
    y:py,
    angle,
    life:.50,
    maxLife:.50,
    scale:1,
    color:selected==="mecha"?"rgba(255,60,80,.9)":"#00cc00"
  });

  shake=Math.max(shake,7);
  flash=.5;
  part(px+Math.cos(angle)*70,py+Math.sin(angle)*70,16,selected==="mecha"?"rgba(255,80,100,.9)":"#00cc00",220);
  blip(210,.07,"triangle",.04,40);
  return;
}

playSfx("bomb_impact");player.hp-=n;aiStats.damageTaken+=n;
player.invuln=.45;
shake=Math.max(shake,12);
flash=.5;
streak=0;
multiplier=1;
part(x,y,10,"rgba(255,100,100,.92)",210);
ring(x,y,76,"rgba(255,100,100,.88)")
}

function rect(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by}

function draw(dt){
if(state==="paused"||state==="briefing")dt=0;
ctx.clearRect(0,0,canvas.width,canvas.height);drawBg();const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const ox=reduced?0:rand(-shake,shake),oy=reduced?0:rand(-shake,shake);
ctx.save();ctx.translate(ox,oy);
drawBackWaves();drawLaunchSignals();jets.forEach(drawJet);if(bomber)drawBomber();if(carrier)drawCarrier();bombs.forEach(drawBomb);drawPlayer();drawMuzzleFx(dt);drawAtomicRoarFx();if(beam)drawBeam(beam);drawShieldFx(dt);drawFrontWaves();drawArcadeEffects();rings.forEach(drawRing);particles.forEach(drawParticle);
ctx.restore();drawVignette();drawLaserTint();drawHud();drawArcadeMeters();
if(flash>0&&!reduced){
  ctx.fillStyle=`rgba(255,30,30,${Math.min(.38,flash*.76)})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}
if(state==="paused"){ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign="center";ctx.fillStyle="#eef4ff";ctx.font="800 36px Inter,sans-serif";ctx.fillText("Paused",canvas.width/2,canvas.height/2)}
}
function levelProgress(){
  if(phase==="escape") return 1;
  if(phase==="carrier") return clamp(.82 + (carrier?1-carrier.hp/carrier.maxHp:0)*.18,0,1);
  const base=clamp((round-1)*.26,0,.72);
  const roundP=roundTarget>0?clamp(roundKills/roundTarget,0,1):0;
  return clamp(base+roundP*.24,0,1);
}
function drawBg(){
  const waveBg=selected==="mecha"?img.bgMechaWave:img.bgGodWave;
  const cityBg=selected==="mecha"?img.bgMechaSky:img.bgGodSky;

  // 3840px wide artwork: start with the left edge flush to the canvas,
  // then slowly pan right-to-left for a steady sense of movement.
  const slowPan=elapsed*18;
  cover3840LeftPan(waveBg,slowPan,.5);

  if(round>=2&&img.japanSky){ctx.save();ctx.globalAlpha=round===2?.88:.96;coverPan(round===2&&img.fujiSky?img.fujiSky:img.japanSky,round===2?.5:.82);ctx.restore();}
  const cityBlend=(phase==="carrier"||phase==="escape")&&round<2
    ? clamp(.30 + (phase==="carrier" && carrier ? (1-carrier.hp/carrier.maxHp)*.42 : .55),0,.84)
    : 0;
  if(cityBlend>0){
    ctx.save();
    ctx.globalAlpha=cityBlend;
    cover3840LeftPan(cityBg,slowPan*.86,.5);
    ctx.restore();
  }

  ctx.fillStyle=cachedGradient("bgOverlay",()=>{const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,"rgba(0,0,0,.30)");g.addColorStop(.55,"rgba(0,0,0,.14)");g.addColorStop(1,"rgba(0,0,0,.72)");return g});
  ctx.fillRect(0,0,canvas.width,canvas.height);
}
function cover3840LeftPan(im,offset,yFocus=.5){
  if(!im || !im.width || !im.height)return;
  const aspect=im.width/im.height;
  const drawW=Math.max(3840,canvas.width,canvas.height*aspect);
  const drawH=drawW/aspect;
  const extraX=Math.max(0,drawW-canvas.width);
  const x=-Math.min(Math.max(0,offset),extraX);
  const y=(canvas.height-drawH)*yFocus;
  ctx.drawImage(im,x,y,drawW,drawH);
}
function coverPan(im,pan){
  if(!im || !im.width || !im.height)return;
  const sc=Math.max(canvas.width/im.width,canvas.height/im.height),w=im.width*sc,h=im.height*sc;
  const extraX=Math.max(0,w-canvas.width);
  const x=-extraX*clamp(pan,0,1), y=(canvas.height-h)/2;
  ctx.drawImage(im,x,y,w,h);
}
function cover(im){coverPan(im,.5)}
function drawBackWaves(){const b=waterLine()+95,o=selected==="mecha"?img.wr:img.wb;wave(img.wp,b-225,82,6.4,.3);wave(o,b-195,109,5.6,.4);wave(img.wpa,b-125,136,6.2,.5)}
function drawFrontWaves(){const b=waterLine()+115,o=selected==="mecha"?img.wr:img.wb;wave(img.wp,b-75,110,5.2,.6);wave(o,b-20,150,5.2,.8);wave(img.wpa,b+30,190,5.2,1);drawWaveBottomFade()}
function wave(im,bottom,h,dur,depth){const tw=h*2.5,sx=-canvas.width,y=bottom-h,a=elapsed/dur*Math.PI*2,rx=Math.cos(a)*h*.1,ry=Math.sin(a)*h*.1;ctx.save();ctx.translate(rx*depth,ry*depth);for(let x=sx-tw;x<canvas.width*2+tw;x+=tw)ctx.drawImage(im,Math.round(x),Math.round(y),Math.ceil(tw)+1,h);ctx.restore()}
function drawWaterOcclusion(){
const y=waterLine()+18;
ctx.save();
ctx.fillStyle=cachedGradient("waterOcclusion",()=>{const g=ctx.createLinearGradient(0,y,0,canvas.height);g.addColorStop(0,"rgba(0,0,0,.18)");g.addColorStop(.18,"rgba(0,0,0,.68)");g.addColorStop(1,"rgba(0,0,0,.98)");return g});
ctx.fillRect(0,y,canvas.width,canvas.height-y);
ctx.restore();
}
function drawWaveBottomFade(){
const y=canvas.height-260;
ctx.save();
ctx.fillStyle=cachedGradient("waveBottomFade",()=>{const g=ctx.createLinearGradient(0,y,0,canvas.height);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.38,"rgba(0,0,0,.48)");g.addColorStop(.72,"rgba(0,0,0,.78)");g.addColorStop(1,"rgba(0,0,0,1)");return g});
ctx.fillRect(0,y,canvas.width,canvas.height-y);
ctx.fillStyle="#000";
ctx.fillRect(0,canvas.height-42,canvas.width,42);
ctx.restore();
}
function drawCarrier(){
const w=carrier.w,h=carrier.h;
const sinking=!!carrier.sinking;
const sinkP=sinking?clamp((carrier.sinkTimer||0)/4.8,0,1):0;
const drawX=-w/2;
const drawY=-h*.70;
ctx.save();
ctx.translate(carrier.x,carrier.y);
if(sinking)ctx.rotate((carrier.sinkAngle||0)+Math.sin((carrier.sinkTimer||0)*1.25)*.025);
if(sinking)ctx.globalAlpha=clamp(1-sinkP*.62,.24,1);
ctx.globalAlpha*=.30;
ctx.fillStyle="rgba(0,0,0,.95)";
ctx.beginPath();
ctx.ellipse(0,h*.10,w*.42,h*.08,0,0,Math.PI*2);
ctx.fill();
ctx.globalAlpha=sinking?clamp(1-sinkP*.62,.24,1):1;
ctx.shadowColor=sinking?"rgba(80,180,255,.22)":"rgba(255,90,90,.28)";
ctx.shadowBlur=sinking?8:18;
ctx.drawImage(img.ship,drawX,drawY,w,h);
if(sinking){
  ctx.shadowBlur=0;
  ctx.globalAlpha=clamp(1-sinkP,.08,.55);
  ctx.fillStyle="rgba(124,217,255,.9)";
  ctx.beginPath();
  ctx.ellipse(-w*.18,h*.04,w*.08,h*.018,0,0,Math.PI*2);
  ctx.ellipse(w*.16,h*.01,w*.06,h*.015,0,0,Math.PI*2);
  ctx.fill();
}
ctx.restore();
if(!sinking){
  const bw=320,bh=12,hx=canvas.width/2-bw/2,hy=240;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.55)";rr(hx,hy,bw,bh,bh/2);ctx.fill();
  ctx.shadowColor="rgba(0,195,255,.58)";
  ctx.shadowBlur=14;
  ctx.fillStyle="rgba(0,195,255,1)";rr(hx,hy,bw*(carrier.hp/carrier.maxHp),bh,bh/2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle="rgba(0,195,255,.42)";rr(hx,hy,bw,bh,bh/2);ctx.stroke();
  ctx.restore();
}
}
function drawPlayer(){
if(isSubmergeed())return;

const shieldActive=shieldFx && shieldFx.length>0;
const mecha=selected==="mecha";
const walkingNow=(keys.a||keys.arrowleft||keys.d||keys.arrowright) && !isSubmergeed();
const idleBob=Math.sin(player.bob*.55)*2;
const walkBob=walkingNow?Math.sin(player.bob)*10:idleBob;
const walkSway=walkingNow?Math.sin(player.bob*.5)*3.5:0;
const firingTilt=beam?beam.angle*.55:0;
/*
  EXACT SPRITE SIZES — DO NOT RESCALE THESE.
  Godzilla: 415 x 362
  Godzilla shield: 494 x 414
  Mechagodzilla: 414 x 414
  Mechagodzilla shield: 474 x 489
*/
const sprite=mecha
  ? (shieldActive?img.mechaShieldExact:img.mechaExact)
  : (shieldActive?img.godShieldExact:img.godExact);

const size=mecha
  ? (shieldActive?{w:474,h:489}:{w:414,h:414})
  : (shieldActive?{w:494,h:414}:{w:415,h:362});

const normalSize=mecha?{w:414,h:414}:{w:415,h:362};
const baseLeft=player.x-normalSize.w*.50+walkSway;
const baseBottom=player.y+walkBob+normalSize.h*.50;

const extraW=size.w-normalSize.w;
const drawX=shieldActive?baseLeft-extraW*.50:baseLeft;
const drawY=baseBottom-size.h;

ctx.save();
ctx.beginPath();ctx.rect(0,0,canvas.width,waterLine()+18);ctx.clip();
ctx.translate(drawX,drawY);
ctx.rotate(firingTilt);
ctx.globalAlpha=player.invuln>0&&Math.sin(elapsed*40)>0?.58:1;
ctx.shadowColor=mecha?"rgba(255,80,92,.25)":"rgba(103,255,138,.22)";
ctx.shadowBlur=16;
ctx.drawImage(sprite,0,0,size.w,size.h);
ctx.restore();
drawWaterOcclusion();
}

function drawShieldFx(dt){
for(let i=shieldFx.length-1;i>=0;i--){
  const f=shieldFx[i];
  f.life-=dt;
  const p=clamp(f.life/f.maxLife,0,1);
  ctx.save();
  ctx.globalAlpha=.06*p;
  ctx.strokeStyle=f.color;
  ctx.lineWidth=4;
  ctx.shadowColor=f.color;
  ctx.shadowBlur=6;
  ctx.beginPath();
  ctx.arc(player.x+player.w*.08,player.y-player.h*.08,player.h*.42+(1-p)*24,-Math.PI*.72,Math.PI*.72);
  ctx.stroke();
  ctx.restore();
  if(f.life<=0)shieldFx.splice(i,1);
}
}

function entity(im,x,y,w,h,flip,alpha,shadow,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;ctx.shadowColor=shadow;ctx.shadowBlur=16;ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore()}
function drawJet(j){
ctx.save();
ctx.translate(j.x,j.y);
ctx.shadowColor="rgba(255,220,130,.28)";
ctx.shadowBlur=8;
ctx.drawImage(j.img,-j.w/2,-j.h/2,j.w,j.h);
ctx.restore();
}
function drawBomber(){
if(!bomber)return;
const sprite=img[bomber.spriteKey]||img.bomber;
if(!sprite)return;
ctx.save();
ctx.translate(bomber.x,bomber.y);
ctx.rotate(.024+Math.sin(bomber.t*1.2)*.006);
ctx.shadowColor="rgba(90,180,255,.34)";
ctx.shadowBlur=16;
ctx.drawImage(sprite,-bomber.w/2,-bomber.h/2,bomber.w,bomber.h);
ctx.restore();

}
function drawMuzzleFx(dt){
for(let i=muzzleFx.length-1;i>=0;i--){
  const m=muzzleFx[i];
  m.life-=dt;
  const p=clamp(m.life/m.maxLife,0,1);
  const red=selected==="mecha";
  ctx.save();
  ctx.translate(m.x,m.y);
  ctx.rotate(m.angle||0);
  ctx.globalAlpha=.50*p;
  ctx.shadowColor=m.color;
  ctx.shadowBlur=12;
  const g=ctx.createLinearGradient(-10,0,70,0);
  g.addColorStop(0,red?"rgba(255,80,100,0)":"rgba(80,255,80,0)");
  g.addColorStop(.22,red?"rgba(255,80,100,.55)":"rgba(80,255,80,.55)");
  g.addColorStop(.55,"rgba(255,255,255,.55)");
  g.addColorStop(1,red?"rgba(255,80,100,0)":"rgba(80,255,80,0)");
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.ellipse(28,0,48,13,0,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha=.42*p;
  ctx.fillStyle="rgba(255,255,255,.85)";
  ctx.beginPath();
  ctx.ellipse(6,0,14,7,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
  if(m.life<=0)muzzleFx.splice(i,1);
}
}

function drawBeam(l){
ctx.save();
const red=selected==="mecha";
const sprite=red?img.laserRed:img.laser;
const h=l.over?64:48;
const w=l.w;
const wobble=Math.sin(elapsed*18)*2;

ctx.translate(l.x,l.y);
ctx.rotate(l.angle||0);
ctx.globalAlpha=l.over?1:.94;
ctx.shadowColor=red?"#ff5e6c":"#39ff45";
ctx.shadowBlur=l.over?40:28;

// Centered on mouth/eyes: draw beam with origin at player emitter.
ctx.drawImage(sprite,0,-h/2+wobble,w,h);

// bright core overlay
const g=ctx.createLinearGradient(0,0,w,0);
g.addColorStop(0,red?"rgba(255,60,60,0)":"rgba(50,255,60,0)");
g.addColorStop(.20,"rgba(255,255,255,.45)");
g.addColorStop(.65,red?"rgba(255,190,190,.85)":"rgba(190,255,190,.85)");
g.addColorStop(1,red?"rgba(255,60,60,0)":"rgba(50,255,60,0)");
ctx.strokeStyle=g;
ctx.lineCap="round";
ctx.lineWidth=l.over?6:4;
ctx.beginPath();
ctx.moveTo(16,wobble);
ctx.lineTo(w-18,wobble);
ctx.stroke();

ctx.restore();
}
function drawAtomicRoarFx(){
if(atomicRoarTimer<=0)return;
const fx=img.atomicRoarFx;
if(!fx||!fx.complete)return;
const red=selected==="mecha";
const color=red?"#ff4058":"#00cc00";
const o=beamOrigin();
const shakePhase=elapsed%3;
const microShake=shakePhase<1?Math.sin(elapsed*58)*4:0;
const microShakeY=shakePhase<1?Math.cos(elapsed*47)*2:0;
const aspect=(fx.naturalWidth||fx.width)/(fx.naturalHeight||fx.height);
const h=red?240:252;
const w=h*aspect;
const offsetX=red?15:50;
const offsetY=red?52:8;

ctx.save();
ctx.translate(o.x+offsetX+microShake,o.y+offsetY+microShakeY);
ctx.rotate((red?-.035:-.055)+Math.sin(elapsed*7)*.012);
ctx.globalAlpha=.94;
ctx.shadowColor=color;
ctx.shadowBlur=14;
drawTintedIcon(fx,0,-h/2,w,h,color);
ctx.restore();
}
function drawBomb(b){
ctx.save();
ctx.translate(b.x,b.y);

if(b.bomber||b.jetMissile){
  const angle=Math.atan2(b.vy,b.vx);
  ctx.rotate(angle);
  ctx.shadowColor="#7defff";
  ctx.shadowBlur=12;
  const aura=ctx.createRadialGradient(0,0,3,0,0,34);
  aura.addColorStop(0,"rgba(210,250,255,.65)");
  aura.addColorStop(.45,"rgba(88,225,255,.24)");
  aura.addColorStop(1,"rgba(88,225,255,0)");
  ctx.fillStyle=aura;
  ctx.beginPath();
  ctx.arc(0,0,34,0,Math.PI*2);
  ctx.fill();
  const flame=ctx.createRadialGradient(-20,0,2,-28,0,18);
  flame.addColorStop(0,"rgba(255,255,210,.95)");
  flame.addColorStop(.45,"rgba(255,150,60,.72)");
  flame.addColorStop(1,"rgba(255,60,0,0)");
  ctx.fillStyle=flame;
  ctx.beginPath();
  ctx.ellipse(-22,0,16,8,0,0,Math.PI*2);
  ctx.fill();
  const w=70,h=28;
  ctx.drawImage(img.bomb,-w/2,-h/2,w,h);
  ctx.restore();
  return;
}

if(b.boss){
  const angle=Math.atan2(b.vy,b.vx);
  ctx.rotate(angle+Math.PI);
  ctx.shadowColor="#4fdcff";
  ctx.shadowBlur=16;

  // blue glow around the mortar shell
  const aura=ctx.createRadialGradient(0,0,4,0,0,52);
  aura.addColorStop(0,"rgba(180,245,255,.65)");
  aura.addColorStop(.45,"rgba(66,210,255,.28)");
  aura.addColorStop(1,"rgba(66,210,255,0)");
  ctx.fillStyle=aura;
  ctx.beginPath();
  ctx.arc(0,0,52,0,Math.PI*2);
  ctx.fill();

  // small flame at the rear, no arrow/fins
  const flame=ctx.createRadialGradient(34,0,2,42,0,26);
  flame.addColorStop(0,"rgba(255,255,190,.95)");
  flame.addColorStop(.45,"rgba(255,120,40,.75)");
  flame.addColorStop(1,"rgba(255,60,0,0)");
  ctx.fillStyle=flame;
  ctx.beginPath();
  ctx.ellipse(38,0,24,10,0,0,Math.PI*2);
  ctx.fill();

  const w=96,h=48; // 2x boss missile size
  ctx.drawImage(img.bomb,-w/2,-h/2,w,h);
  ctx.restore();
  return;
}

ctx.rotate((b.launchAngle||0)+b.spin*.12);
ctx.shadowColor="#ffb357";
ctx.shadowBlur=6;
const s=b.sizeScale||1;const w=44*s,h=22*s;
ctx.drawImage(img.bomb,-w/2,-h/2,w,h);
ctx.restore();
}
function drawRing(r){const a=Math.max(0,r.life/.42);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=r.color;ctx.lineWidth=6;ctx.shadowColor=r.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(r.x,r.y,r.r*(1.25-a*.25),0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawParticle(p){
ctx.save();
ctx.globalAlpha=Math.max(0,p.life*1.6);
ctx.fillStyle=p.color;
ctx.beginPath();
if(p.size>10){
  ctx.ellipse(p.x,p.y,p.size*.55,p.size*1.45,0,0,Math.PI*2);
}else{
  ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
}
ctx.fill();
ctx.restore();
}
function drawLaserTint(){}

function pickKaijūFact(){
const facts=[
  "Godzilla first appeared in Japan in 1954, launching one of the most influential monster franchises in film history.",
  "Godzilla’s Japanese name is Gojira, a name often linked to the idea of combining gorilla-like strength with whale-like size.",
  "The original Godzilla was directed by Ishirō Honda, whose war experience helped shape the film’s serious disaster tone.",
  "Eiji Tsuburaya led the original film’s special effects and helped define the miniature-city destruction style of kaiju cinema.",
  "Akira Ifukube composed Godzilla’s original music, including the heavy, marching themes that made the monster feel unstoppable.",
  "Godzilla began as a symbol of nuclear fear and destruction, reflecting Japan’s postwar anxiety about atomic power.",
  "The original Godzilla was filmed in black and white, which gave the destruction scenes a documentary-like, disaster-news feeling.",
  "Godzilla’s first attack was presented like a national disaster, with emergency response, evacuation, and government debate built into the story.",
  "Godzilla’s roar became one of cinema’s most recognizable monster sounds and remains a key part of the character’s identity.",
  "Godzilla’s footsteps were designed to feel massive and terrifying, turning simple movement into a warning that destruction was coming.",
  "The 1954 Godzilla was created less than a decade after World War II, which gave the film’s nuclear themes extra emotional weight.",
  "Godzilla is often interpreted as a metaphor for atomic trauma, environmental danger, and humanity losing control of its own weapons.",
  "The Oxygen Destroyer is the weapon used against Godzilla in the 1954 film, making it one of the franchise’s most important fictional weapons.",
  "Dr. Serizawa destroys his Oxygen Destroyer research to keep it from becoming another weapon of mass destruction.",
  "The original film ends with a warning that another Godzilla could appear if nuclear testing continues.",
  "Haruo Nakajima was one of the original suit performers for Godzilla and helped create the monster’s heavy, animal-like movement.",
  "Godzilla helped popularize suitmation, a practical effects technique built around performers inside monster suits.",
  "Suitmation used performers in monster suits walking through detailed miniature cities, making destruction feel physical and handmade.",
  "Miniature city destruction became a signature of classic kaiju films, with buildings, tanks, bridges, and power lines built to be smashed.",
  "Godzilla helped define the kaiju genre worldwide and became the standard for giant monster storytelling.",
  "Godzilla Raids Again introduced Anguirus, one of the first kaiju to physically battle Godzilla on screen.",
  "Anguirus was one of Godzilla’s first monster rivals and later became a fan-favorite ally in several Showa-era stories.",
  "King Kong vs. Godzilla was released in 1962 and turned the franchise into a bigger international monster-event spectacle.",
  "Godzilla and King Kong first fought decades before the MonsterVerse, making their rivalry one of cinema’s oldest monster matchups.",
  "Mothra vs. Godzilla was released in 1964 and helped establish Mothra as one of Godzilla’s most important recurring monsters.",
  "Mothra became one of Toho’s most beloved kaiju because she often represents protection, rebirth, and sacrifice.",
  "Mothra is often portrayed as a guardian rather than a destroyer, making her a moral counterweight to Godzilla’s raw power.",
  "Mothra’s twin priestesses are one of the franchise’s most famous human elements, connecting the monster world to myth and ritual.",
  "King Ghidorah first appeared in Ghidorah, the Three-Headed Monster, instantly becoming a cosmic-level threat.",
  "King Ghidorah is one of Godzilla’s greatest enemies and is often treated as the ultimate rival to the King of the Monsters.",
  "King Ghidorah is usually shown as a three-headed dragon-like kaiju with massive wings, gravity beams, and world-ending power.",
  "Rodan is a giant flying kaiju inspired by prehistoric creatures, usually connected to volcanic destruction and supersonic flight.",
  "Godzilla, Rodan, and Mothra have teamed up against King Ghidorah, creating one of the franchise’s most famous monster alliances.",
  "Destroy All Monsters brought many Toho kaiju together, turning the series into a full-scale monster ensemble event.",
  "Monster Island became one of the franchise’s most famous locations, often used as a containment zone or home for Earth’s kaiju.",
  "All Monsters Attack focused more on childhood imagination than city destruction, making it one of the franchise’s most unusual entries.",
  "Godzilla vs. Hedorah turned pollution into a monster, using kaiju action to comment on environmental damage.",
  "Hedorah is also known as the Smog Monster, a toxic creature born from sludge, smoke, and industrial waste.",
  "Hedorah made environmental destruction part of kaiju storytelling, showing that monsters could represent modern pollution as much as war.",
  "Godzilla vs. Gigan introduced Gigan, a cybernetic alien kaiju with one of the franchise’s most brutal designs.",
  "Gigan is famous for his hooked arms and buzzsaw-like chest, giving him a more weaponized look than many organic kaiju.",
  "Gigan is one of Godzilla’s most visually aggressive enemies, built around blades, spikes, armor, and alien menace.",
  "Godzilla vs. Megalon introduced Jet Jaguar, a robot hero who became a cult favorite among kaiju fans.",
  "Jet Jaguar began as a robot hero who could grow to kaiju size, giving the franchise a superhero-style defender.",
  "Megalon is a beetle-like underground kaiju with drill-like arms, usually tied to the hidden kingdom of Seatopia.",
  "Godzilla vs. Mechagodzilla introduced Mechagodzilla in 1974, giving Godzilla a mechanical duplicate built for destruction.",
  "The original Mechagodzilla was disguised as Godzilla, making its reveal one of the franchise’s classic shock moments.",
  "Mechagodzilla quickly became one of Godzilla’s most iconic enemies because it mirrors Godzilla’s power through technology and weapons.",
  "Terror of Mechagodzilla brought Mechagodzilla back in 1975 and gave the Showa era a darker final chapter.",
  "Titanosaurus appeared in Terror of Mechagodzilla as a tragic aquatic dinosaur controlled by human and alien forces.",
  "The Showa era ran from the original 1954 film through Terror of Mechagodzilla, shifting from horror to adventure and monster-team spectacle.",
  "Godzilla changed from villain to antihero during the Showa era, eventually protecting Earth from alien and monster threats.",
  "The Heisei era rebooted Godzilla with The Return of Godzilla, ignoring most prior sequels and restoring a darker tone.",
  "The Return of Godzilla brought Godzilla back to a more serious disaster style after years of lighter Showa-era adventures.",
  "Godzilla 1985 was the American version of The Return of Godzilla, edited for U.S. audiences with added material.",
  "Godzilla vs. Biollante explored genetic engineering, grief, and bio-science through one of the franchise’s strangest monsters.",
  "Biollante is a plant-like kaiju connected to Godzilla’s cells, human DNA, and experimental science.",
  "Biollante is one of the franchise’s most unusual monster designs, blending rose, crocodile, vine, and Godzilla-like elements.",
  "Godzilla vs. King Ghidorah used time travel in Godzilla’s origin story, adding a science-fiction twist to the Heisei timeline.",
  "Mecha-King Ghidorah is a cybernetic version of King Ghidorah, rebuilt with futuristic technology after a battle with Godzilla.",
  "Godzilla vs. Mothra introduced Battra, a darker guardian kaiju created as a destructive counterpart to Mothra.",
  "Battra is often described as a darker counterpart to Mothra, representing Earth’s anger rather than gentle protection.",
  "Godzilla vs. Mechagodzilla II introduced Baby Godzilla, giving the Heisei era a more emotional monster-family storyline.",
  "Fire Rodan appeared in Godzilla vs. Mechagodzilla II, powering up after exposure to Godzilla’s radiation.",
  "SpaceGodzilla was created from Godzilla’s cells, turning Godzilla’s own biology into a cosmic enemy.",
  "SpaceGodzilla has crystal-like shoulder structures and psychic energy powers, making him one of Godzilla’s flashiest rivals.",
  "Godzilla vs. Destoroyah is one of the darkest Godzilla films, built around meltdown, sacrifice, and the legacy of the Oxygen Destroyer.",
  "Destoroyah is connected to the Oxygen Destroyer, making it a living consequence of the weapon that killed the original Godzilla.",
  "Burning Godzilla appears in Godzilla vs. Destoroyah, with glowing red cracks showing his body nearing nuclear meltdown.",
  "Burning Godzilla’s meltdown is one of the franchise’s most dramatic finales and marks the emotional end of the Heisei Godzilla.",
  "The Millennium era began with Godzilla 2000: Millennium, a new continuity that restarted Godzilla for a new generation.",
  "Orga tried to absorb Godzilla’s DNA in Godzilla 2000, showing how dangerous Godzilla’s genetic power could become.",
  "Godzilla vs. Megaguirus featured a giant dragonfly-like enemy created through experimental science and dimensional side effects.",
  "Megaguirus drains energy from other creatures, making her a fast, predatory enemy rather than a brute-force kaiju.",
  "Godzilla, Mothra and King Ghidorah: Giant Monsters All-Out Attack reimagined classic monsters as guardian spirits.",
  "Baragon appears as one of Japan’s guardian monsters in GMK, standing against a more terrifying version of Godzilla.",
  "Godzilla Against Mechagodzilla introduced Kiryu, one of the most emotional versions of Mechagodzilla.",
  "Kiryu is a Mechagodzilla built from the bones of the 1954 Godzilla, blending machinery with the remains of the original monster.",
  "Kiryu sometimes behaves like it remembers being Godzilla, giving this Mechagodzilla a haunted, tragic quality.",
  "Godzilla: Tokyo SOS brought Kiryu and Mothra together, connecting technology, nature, and the legacy of the first Godzilla.",
  "Godzilla Final Wars celebrated the franchise’s 50th anniversary with a fast, chaotic monster brawl across the globe.",
  "Godzilla Final Wars features many returning kaiju, making it one of the biggest monster showcases in the series.",
  "Monster X appears in Godzilla Final Wars as a mysterious alien kaiju designed to challenge Godzilla directly.",
  "Keizer Ghidorah is Monster X’s final form, transforming the fight into a brutal update of the Godzilla/Ghidorah rivalry.",
  "Zilla appears in Godzilla Final Wars as a nod to the 1998 American Godzilla and is defeated quickly by Godzilla.",
  "The 1998 American Godzilla was very different from Toho’s classic version, emphasizing speed, animal behavior, and mutation.",
  "Toho later renamed the 1998 creature Zilla in franchise appearances, separating it from the traditional Godzilla identity.",
  "Shin Godzilla reimagined Godzilla as an evolving biological disaster, focusing on bureaucracy, crisis response, and mutation.",
  "Shin Godzilla was directed by Hideaki Anno and Shinji Higuchi, bringing a sharp political and disaster-film style to the franchise.",
  "Shin Godzilla’s body changes forms throughout the film, making evolution itself part of the horror.",
  "Shin Godzilla’s atomic breath scene is one of the franchise’s most striking sequences, turning the attack into a terrifying city-wide catastrophe.",
  "Godzilla Minus One is set in postwar Japan, returning the monster to a period of national trauma and rebuilding.",
  "Godzilla Minus One was directed by Takashi Yamazaki, who also supervised the film’s visual effects work.",
  "Godzilla Minus One won the 2024 Oscar for Best Visual Effects, bringing the franchise its first Academy Award.",
  "Godzilla Minus One was the first Godzilla movie to win an Academy Award, a major milestone in the character’s 70-year history.",
  "Guinness World Records recognized Godzilla as the longest continuously running movie franchise, reflecting the character’s decades of global impact.",
  "Godzilla has been a villain, hero, antihero, and force of nature, changing roles depending on the era and story.",
  "Godzilla stories often reflect the fears of the era they were made in, from nuclear weapons to pollution, genetics, disasters, and military power.",
  "Godzilla has battled aliens, robots, mutants, pollution monsters, ancient guardians, military forces, and other kings of the monster world.",
  "Godzilla remains one of the most important movie monsters ever created, standing as both pop-culture icon and cinematic warning signal."
];
return facts[(Math.random()*facts.length)|0];
}
function updateKaijūFact(){
if(!factState.text || elapsed>=factState.nextAt){
  factState.text=pickKaijūFact();
  factState.duration=rand(8,12);
  factState.startedAt=elapsed;
  factState.nextAt=elapsed+factState.duration;
}
}
function drawKaijūFact(){
updateKaijūFact();
const age=elapsed-factState.startedAt;
const remaining=factState.nextAt-elapsed;
let alpha=1;
if(age<3) alpha=age/3;
else if(remaining<3) alpha=Math.max(0,remaining/3);

ctx.save();
ctx.textAlign="center";
ctx.shadowColor="rgba(0,0,0,.92)";
ctx.shadowBlur=8;
ctx.font="900 15px Inter,sans-serif";
ctx.globalAlpha=alpha;
ctx.fillStyle=selected==="mecha"?"#ff4058":"#00cc00";
ctx.fillText(fitHudText(factState.text,canvas.width-80),canvas.width/2,canvas.height-96);
ctx.restore();
}
function drawTintedIcon(icon,x,y,w,h,color){
const cw=Math.max(1,Math.round(w)),ch=Math.max(1,Math.round(h));
const dx=Math.round(x),dy=Math.round(y);
const src=icon.currentSrc||icon.src||"inline";
const sw=Math.max(1,Math.round(icon.naturalWidth||icon.width||cw));
const sh=Math.max(1,Math.round(icon.naturalHeight||icon.height||ch));
const key=`${src}|${sw}x${sh}|${cw}x${ch}|${color}`;
let off=renderCache.tintedIcons.get(key);
if(!off){
  off=document.createElement("canvas");
  off.width=cw;off.height=ch;
  const offCtx=off.getContext("2d",{alpha:true});
  offCtx.clearRect(0,0,cw,ch);
  offCtx.imageSmoothingEnabled=true;
  offCtx.globalCompositeOperation="source-over";
  try{
    // Chrome can be inconsistent with SVG intrinsic sizing in canvas.
    // The 9-argument drawImage call forces the SVG into the exact HUD slot.
    offCtx.drawImage(icon,0,0,sw,sh,0,0,cw,ch);
  }catch(e){
    offCtx.drawImage(icon,0,0,cw,ch);
  }
  offCtx.globalCompositeOperation="source-in";
  offCtx.fillStyle=color;
  offCtx.fillRect(0,0,cw,ch);
  offCtx.globalCompositeOperation="source-over";
  renderCache.tintedIcons.set(key,off);
}
ctx.drawImage(off,dx,dy,cw,ch);
}
function isMobileHud(){
return canvas.width<=1024 || (typeof matchMedia==="function" && matchMedia("(hover: none), (pointer: coarse)").matches);
}
function waveStatusText(){
  if(phase==="carrier" || phase==="escape"){
    const bossDone=(phase==="escape" || (carrier && carrier.sinking))?1:0;
    return `Boss Fight ${bossDone}/1`;
  }
  const waveDone=Math.min(roundKills,roundTarget);
  return `${rules.missions[round-1].title} · ${waveDone}/${roundTarget}`;
}
function fitHudText(text,maxWidth){
  let output=String(text||"");
  if(ctx.measureText(output).width<=maxWidth)return output;
  while(output.length>10 && ctx.measureText(output+"…").width>maxWidth){
    output=output.slice(0,-1);
  }
  return output+"…";
}
function drawHudAlert(cx,y,maxWidth,compact=false){
  if(bannerTimer<=0)return y;

  const title=(bannerTitle.textContent||"").trim();
  const text=(bannerText.textContent||"").trim();
  if(!title && !text)return y;

  const label=text?`${title} // ${text}`:title;
  const fontSize=compact?15:20;
  const lineH=compact?22:28;

  ctx.save();
  ctx.textAlign="center";
  ctx.textBaseline="alphabetic";
  ctx.font=`900 ${fontSize}px Inter,sans-serif`;
  const fitted=fitHudText(label,maxWidth);
  ctx.fillStyle="#ffffff";
  ctx.shadowColor="rgba(0,0,0,.9)";
  ctx.shadowBlur=12;
  ctx.lineWidth=compact?3:4;
  ctx.strokeStyle="rgba(0,0,0,.85)";
  ctx.strokeText(fitted,cx,y);
  ctx.fillText(fitted,cx,y);
  ctx.restore();
  return y+lineH;
}
function drawWaveStatus(cx,y,maxWidth,compact=false){
  ctx.save();
  ctx.textAlign="center";
  ctx.textBaseline="alphabetic";
  ctx.font=compact?"900 13px Inter,sans-serif":"900 16px Inter,sans-serif";
  ctx.fillStyle=(phase==="carrier"||phase==="escape"||roundKills>=roundTarget)?"#00cc00":"rgba(238,244,255,.78)";
  ctx.shadowColor="rgba(0,0,0,.76)";
  ctx.shadowBlur=8;
  ctx.fillText(fitHudText(waveStatusText(),maxWidth),cx,y);
  ctx.restore();
}
function drawMobileHud(){
const healthColor=selected==="mecha"?"#ff4058":"#00cc00";
const energyColor="#FFD700";
const margin=Math.max(12,Math.min(18,canvas.width*.025));
const y=12;
const w=Math.min(340,canvas.width-(margin*2));
const x=margin;
const titleH=10;
const gap=5;
const barH=7;
const meterStep=titleH+gap+barH+gap;
const panelH=96;
const roarP=atomicRoarTimer>0?clamp(atomicRoarTimer/8,0,1):(atomicRoarUsed?0:1);
const roarStatus=atomicRoarTimer>0?"ACTIVE":(atomicRoarUsed?"USED":"READY");

ctx.save();
ctx.shadowColor="rgba(0,0,0,.72)";
ctx.shadowBlur=10;
ctx.fillStyle="rgba(3,12,25,.72)";
rr(x-8,y-6,w+16,panelH,16);
ctx.fill();
ctx.strokeStyle="rgba(126,212,255,.14)";
ctx.stroke();

ctx.shadowBlur=0;
ctx.textAlign="center";
ctx.textBaseline="alphabetic";
ctx.font="900 18px Inter,sans-serif";
ctx.fillStyle="rgba(238,244,255,.98)";
ctx.fillText(`Score ${formatArcadeScore(score)}`,x+w/2,y+16);

function mobileMeter(label,p,c,value){
  const labelY=mobileMeter.nextY;
  const barY=labelY+titleH+gap;
  ctx.textBaseline="top";
  ctx.textAlign="left";
  ctx.font="800 10px Inter,sans-serif";
  ctx.fillStyle="rgba(238,244,255,.78)";
  ctx.fillText(label,x,labelY);
  ctx.textAlign="right";
  ctx.fillStyle="rgba(238,244,255,.58)";
  ctx.fillText(value||"",x+w,labelY);
  ctx.fillStyle="rgba(0,0,0,.58)";
  rr(x,barY,w,barH,barH/2);
  ctx.fill();
  if(label==="Health"){
    ctx.shadowColor=c==="#ff4058"?"rgba(255,64,88,.58)":"rgba(0,204,0,.58)";
    ctx.shadowBlur=10;
  }
  ctx.fillStyle=c;
  rr(x,barY,Math.max(0,w*clamp(p,0,1)),barH,barH/2);
  ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle="rgba(255,255,255,.18)";
  rr(x,barY,w,barH,barH/2);
  ctx.stroke();
  mobileMeter.nextY+=meterStep;
}
mobileMeter.nextY=y+42;
mobileMeter("Health",player.hp/player.maxHp,healthColor,`${Math.max(0,Math.round(player.hp))}/${player.maxHp}`);
mobileMeter("Energy",player.energy/player.maxEnergy,energyColor,`${Math.round(player.energy)}%`);

ctx.restore();

const abilityY=y+48;
drawShieldIcons(canvas.width-300,abilityY);
drawAtomicRoarIcon(canvas.width-112,abilityY);
const statusY=y+panelH+28;
drawWaveStatus(canvas.width/2,statusY,canvas.width-24,true);
drawHudAlert(canvas.width/2,statusY+22,canvas.width-24,true);
}
function drawHud(){
if(isMobileHud()){drawMobileHud();return;}
const hudW=Math.min(360,Math.max(250,canvas.width*.28));

// Health/Energy: 50px from left, title baseline at 32px from top.
// bar() draws the title at y - 10, so y=42 gives title baseline 32px.
const hudX=50;
const healthY=42;
const energyY=healthY+48;

const healthColor=selected==="mecha"?"#ff4058":"#00cc00";
const energyColor="#FFD700";

// Shield/Roar: aligned as one ability row.
// Titles draw at y - 12, so y=44 gives title baseline 32px.
const abilityY=44;
const roarX=canvas.width-112;
const shieldX=roarX-190;
bar(hudX,healthY,hudW,16,player.hp/player.maxHp,healthColor,"Health");
bar(hudX,energyY,hudW,10,player.energy/player.maxEnergy,energyColor,"Energy");
drawShieldIcons(shieldX,abilityY);drawAtomicRoarIcon(roarX,abilityY);

ctx.textAlign="center";
ctx.font="900 34px Inter,sans-serif";
ctx.fillStyle="rgba(238,244,255,.98)";
ctx.fillText(`Score ${formatArcadeScore(score)}`,canvas.width/2,52);

ctx.font="900 16px Inter,sans-serif";
syncHighScoreNow();
const hs=topScoreRecord();
ctx.textAlign="center";
ctx.fillStyle="rgba(255,255,255,.48)";
ctx.fillText(`High Score ${formatArcadeScore(hs.score)} ${(hs.initials||"---").toUpperCase().slice(0,3)}`,canvas.width/2,80);

drawWaveStatus(canvas.width/2,112,canvas.width-48,false);

ctx.textAlign="center";
let statusLineY=drawHudAlert(canvas.width/2,142,canvas.width-56,false);
ctx.font="800 12px Inter,sans-serif";
if(phase==="carrier"){
  ctx.fillStyle="rgba(255,84,108,.94)";
  ctx.fillText("Sink The Destroyer",canvas.width/2,statusLineY+48);
}else if(phase==="escape"){
  ctx.fillStyle="rgba(125,247,255,.96)";
  ctx.fillText("ESCAPE OPEN // MOVE RIGHT",canvas.width/2,statusLineY+12);
}else if(state==="paused"){
  // Pause message removed from HUD.
}
drawKaijūFact();
}
function drawShieldIcons(x,y){
ctx.save();
const color=selected==="mecha"?"#ff4058":"#00cc00";
ctx.font="700 12px Inter,sans-serif";
ctx.textAlign="left";
ctx.fillStyle=shieldHits<=1?(Math.sin(elapsed*9)>0?color:"rgba(255,209,102,.96)"):"rgba(238,244,255,.92)";
ctx.fillText(shieldHits<=0?"Atomic Shield // EMPTY":"Atomic Shield",x+2,y-12);

for(let i=0;i<shieldMax;i++){
  const on=i<shieldHits;
  const px=Math.round(x+i*HUD_ICON_SIZES.shieldStep);
  const icon=img.kaijuShieldIcon;
  ctx.save();
  ctx.globalAlpha=on?1:.22;
  ctx.shadowColor="rgba(0,0,0,0)";
  ctx.shadowBlur=0;

  if(icon && icon.complete){
    drawTintedIcon(icon,px,y+1,HUD_ICON_SIZES.shieldW,HUD_ICON_SIZES.shieldH,color);
  }else{
    ctx.strokeStyle=on?color:"rgba(238,244,255,.3)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(px+12,y+12);
    ctx.lineTo(px+24,y+18);
    ctx.lineTo(px+21,y+36);
    ctx.lineTo(px+12,y+43);
    ctx.lineTo(px+3,y+36);
    ctx.lineTo(px,y+18);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}
ctx.restore();
}
function drawAtomicRoarIcon(x,y){
ctx.save();
const active=atomicRoarTimer>0;
const available=rage>=100;
const color=selected==="mecha"?"#ff4058":"#00cc00";
const icon=img.kaijuRoarIcon;
const roarIconX=Math.round(x-6);
const roarIconY=Math.round(y+1);

ctx.font="700 12px Inter,sans-serif";
ctx.textAlign="left";
ctx.fillStyle="rgba(238,244,255,.92)";
ctx.fillText("Atomic Roar",x+2,y-12);

ctx.save();
ctx.globalAlpha=available?1:.28;
ctx.shadowColor="rgba(0,0,0,0)";
ctx.shadowBlur=0;

if(icon && icon.complete){
  drawTintedIcon(icon,roarIconX,roarIconY,HUD_ICON_SIZES.roarW,HUD_ICON_SIZES.roarH,color);
}else{
  ctx.strokeStyle=available?color:"rgba(238,244,255,.35)";
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.arc(x+26,y+30,26,0,Math.PI*2);
  ctx.stroke();
}
ctx.restore();

ctx.restore();
}
function bar(x,y,w,h,p,c,label){ctx.save();ctx.fillStyle="rgba(0,0,0,.55)";rr(x,y,w,h,h/2);ctx.fill();if(label==="Health"){ctx.shadowColor=c==="#ff4058"?"rgba(255,64,88,.58)":"rgba(0,204,0,.58)";ctx.shadowBlur=14}ctx.fillStyle=c;rr(x,y,Math.max(0,w*clamp(p,0,1)),h,h/2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,255,255,.2)";rr(x,y,w,h,h/2);ctx.stroke();if(label){ctx.fillStyle="rgba(238,244,255,.92)";ctx.font="700 12px Inter,sans-serif";ctx.textAlign="left";ctx.fillText(label,x+2,y-10)}ctx.restore()}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function drawVignette(){ctx.fillStyle=cachedGradient("vignette",()=>{const v=ctx.createRadialGradient(canvas.width/2,canvas.height/2,canvas.height*.22,canvas.width/2,canvas.height/2,canvas.width*.72);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.72)");return v});ctx.fillRect(0,0,canvas.width,canvas.height)}
function loop(ts){const dt=Math.min(.033,(ts-last)/1000||0);last=ts;if(state==="trivia")tickTriviaScheduler();update(dt);if(state==="playing"||state==="paused"||ts>=renderCache.passiveDrawAt){draw(dt);renderCache.passiveDrawAt=ts+250}requestAnimationFrame(loop)}

function openMissionBrief(upgrade){
  state="briefing";releaseTouchKeys();beam=null;bombs=[];jets=[];bomber=null;setTouchControlsVisible(false);
  const m=rules.missions[round-1];
  missionModal.innerHTML='<div class="panel"><div class="hero"><div><div class="eyebrow">'+m.title+'</div><h1>'+m.name+'</h1></div></div><div class="body"><p>'+m.story+'</p><p class="briefObjective">'+m.objective+'</p>'+(upgrade?'<div class="choices refitChoices"><button class="choice" data-refit="repair"><strong>Regeneration</strong><span>Restore 55 health and all energy.</span></button><button class="choice" data-refit="power"><strong>Atomic Overdrive</strong><span>Permanent +20% beam and roar damage.</span></button><button class="choice" data-refit="shield"><strong>Shield Surge</strong><span>Refill three shields, energy, and roar.</span></button></div>':'<p>Choose your fights. The ocean is your cover. Your shields absorb three hits and gradually regenerate.</p><div class="actions"><button data-refit="begin">Enter Tokyo Bay</button></div>')+'</div></div>';
  missionModal.classList.remove('hidden');missionModal.querySelector('.hero').style.backgroundImage='linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,5,16,.85)),url("assets/'+(round===2?'fuji-coast.png':round===3?'japan-landmarks.png':selected==='mecha'?'background_mecha.png':'background.png')+'")';
}
missionModal.addEventListener('click',e=>{const button=e.target.closest('[data-refit]');if(!button)return;const type=button.dataset.refit;if(type==='repair'){player.hp=clamp(player.hp+55,0,player.maxHp);player.energy=100;}if(type==='power')attackBoost*=1.2;if(type==='shield'){shieldCharge=3;player.energy=100;rage=100;}missionModal.classList.add('hidden');state='playing';playSfx(type==='begin'?'game_start':'powerup');setTouchControlsVisible(true);player.invuln=2;jetTimer=1.3;submergeeTimer=0;player.y=waterLine()-30;story(rules.missions[round-1].title,rules.missions[round-1].objective,5);});
function drawArcadeMeters(){
  if(!['playing','paused'].includes(state))return;
  const compact=isMobileHud(),x=compact?20:28,y=compact?canvas.height*.43:282,w=compact?140:180;
  ctx.save();ctx.fillStyle='rgba(2,8,20,.65)';ctx.fillRect(x-8,y-22,w+16,70);bar(x,y,w,7,rage/100,selected==='mecha'?'#ff4058':'#00cc00','Roar '+Math.floor(rage)+'%');bar(x,y+34,w,7,diveLock>0?1-diveLock/3:rules.oxygen(submergeeTimer),'#7fe7ff',diveLock>0?'Dive recharging':'Oxygen');ctx.restore();
}
function drawLaunchSignals(){
  if(state!=='playing')return;ctx.save();ctx.strokeStyle='rgba(255,209,102,.8)';ctx.lineWidth=2;
  for(const j of jets){if(j.missilesLeft>0&&j.missileCd<.65){ctx.beginPath();ctx.arc(j.x,j.y,30+Math.sin(elapsed*20)*8,0,Math.PI*2);ctx.stroke();}}
  if(carrier&&!carrier.sinking&&carrier.fireCd<.8){ctx.strokeStyle='rgba(255,80,100,.9)';for(const offset of [-.3,-.05,.23]){ctx.beginPath();ctx.arc(carrier.x+carrier.w*offset,carrier.y-carrier.h*.33,16+Math.sin(elapsed*18)*5,0,Math.PI*2);ctx.stroke();}}
  ctx.restore();
}
function drawArcadeEffects(){
  if(!['playing','paused'].includes(state))return;
  ctx.save();
  if(roarPulse>0){const progress=1-roarPulse/2.4;ctx.globalAlpha=(1-progress)*.7;ctx.strokeStyle=selected==='mecha'?'#ff4058':'#00cc00';ctx.lineWidth=6;ctx.beginPath();ctx.arc(player.x,waterLine(),progress*canvas.width,0,Math.PI*2);ctx.stroke();}
  if(isSubmergeed()){ctx.globalAlpha=.28;ctx.fillStyle='#7fe7ff';for(let i=0;i<5;i++){const by=waterLine()+55-((elapsed*30+i*20)%70);ctx.beginPath();ctx.arc(player.x+Math.sin(elapsed+i)*24,by,3+i*.7,0,Math.PI*2);ctx.fill();}}
  if(phase==='escape'){ctx.globalAlpha=.5+.5*Math.sin(elapsed*4);ctx.fillStyle='#7fe7ff';ctx.font='900 42px Inter,sans-serif';ctx.textAlign='right';ctx.fillText('→',canvas.width-24,waterLine()-90);}
  ctx.restore();
}

loadAll().then(()=>{finishLoadingScreen();requestAnimationFrame(loop)}).catch(e=>{failLoadingScreen(e);document.querySelector(".body p").textContent="Kaiju's Failed To Awaken"});
})();
