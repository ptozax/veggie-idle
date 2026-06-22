/* ===================================================================
   🌱 ฟาร์มไม่มีวันหยุด — Idle Farm Wallpaper (V1)
   เซฟ localStorage · offline progress · weather · day/night · prestige
   -------------------------------------------------------------------
   ★ ปรับแต่งเกือบทุกอย่างได้ที่ CONFIG ด้านล่าง — แก้ตัวเลขแล้วรีโหลด
   =================================================================== */
'use strict';

// ===================================================================
//  ⚙️  CONFIG — ศูนย์รวมค่าปรับแต่งทั้งเกม (แก้ตรงนี้ที่เดียว)
// ===================================================================
const CONFIG = {
  saveKey: 'idleFarm_v1',          // ชื่อช่องเซฟใน localStorage

  // ----- เริ่มต้น -----
  startCoins: 30,
  startFert: 0,
  startSelected: 'carrot',
  startAuto: true,

  // ----- แปลงปลูก -----
  plotBase: 6,                     // จำนวนแปลงเริ่มต้น
  plotMax: 24,                     // จำนวนแปลงสูงสุด
  plotCostBase: 150,               // ราคาฐานของการซื้อแปลง
  plotCostMult: 3.2,               // ตัวคูณราคาแปลงต่อแปลง (ยิ่งมากยิ่งแพงไว)
  // จำนวนคอลัมน์ของกริดตามจำนวนแปลง (ใช้ค่าแรกที่ plotCount <= upTo)
  gridCols: [{upTo: 8, cols: 4}, {upTo: 15, cols: 5}, {upTo: Infinity, cols: 6}],

  // ----- เวลา/รอบเกม -----
  dayLength: 360,                  // วินาทีต่อ 1 วันในเกม (รอบกลางวัน-กลางคืน)
  tickMs: 100,                     // เดินเกมทุกกี่มิลลิวินาที (100 = 10 ครั้ง/วิ)
  saveInterval: 5000,              // auto-save ทุกกี่มิลลิวินาที

  // ----- Offline progress -----
  offlineMinSeconds: 30,           // หายไปอย่างน้อยกี่วิถึงคิด offline
  offlineCapHours: 8,              // คิด offline สูงสุดกี่ชั่วโมง

  // ----- ผักทองคำ -----
  goldenBaseChance: 0.04,          // โอกาสพื้นฐานได้ผักทอง
  goldenMult: 5,                   // ผักทองขายได้กี่เท่า

  // ----- Prestige / Spirit -----
  prestigeDivisor: 1e6,            // spirit = √(เหรียญสะสม ÷ ค่านี้)
  spiritBonusPer: 0.05,            // โบนัสมูลค่าขาย +x ต่อ 1 spirit
  spiritGrowPer: 0.02,             // โบนัสความเร็วโต +x ต่อ 1 spirit

  // ----- Mastery (ความเชี่ยวชาญผัก) -----
  masteryPerLevel: 50,             // เก็บกี่ต้นต่อ 1 เลเวล mastery
  masteryYieldPer: 0.10,           // ผลผลิต +x ต่อเลเวล mastery
  masteryGrowEvery: 100,           // เก็บกี่ต้นถึงได้โบนัสความเร็วโต
  masteryGrowPer: 0.05,            // ความเร็วโต +x ต่อขั้น
  masteryGrowMax: 0.50,            // โบนัสความเร็วโตจาก mastery สูงสุด

  // ----- ตลาด (ราคาผันผวน) -----
  marketMin: 0.7,                  // ตัวคูณราคาต่ำสุด
  marketRange: 0.9,                // ช่วงสุ่มเพิ่ม (สูงสุด = min + range)
  marketIntervalMin: 60,           // เปลี่ยนราคาทุกอย่างน้อยกี่วิ
  marketIntervalRange: 120,        // บวกสุ่มได้อีกกี่วิ

  // ----- สภาพอากาศ -----
  // pool = โอกาสออกของแต่ละแบบ (ใส่ซ้ำ = โอกาสมากขึ้น)
  weatherPool: ['sun', 'sun', 'sun', 'cloud', 'cloud', 'rain', 'rain', 'storm'],
  weatherFirstMin: 30,             // อากาศแรกอยู่กี่วิ (สุ่ม min..min+range)
  weatherFirstRange: 40,

  // ----- คนสวน -----
  gardenerSpeedBase: 32,           // ความเร็วเดินฐาน (% ต่อวินาที โดยประมาณ)
  gardenerWorkMs: 450,             // เวลายืนก้มทำงานที่แปลง (ms, หารด้วย speed)

  // ----- Easter eggs -----
  shootingStarReward: 100,         // ดาวตก คลิกได้กี่เหรียญ
  shootingStarChance: 0.5,         // โอกาสเกิดดาวตก (ตอนกลางคืน)
  catFertReward: 2,                // แมวจรให้ปุ๋ยกี่หน่วย
  catChance: 0.4,                  // โอกาสแมวเดินผ่าน

  // ----- เควส -----
  questNeedMin: 10,                // ต้องส่งอย่างน้อยกี่ต้น
  questNeedStep: 10,               // ขั้นการสุ่ม (10,20,30,40,50)
  questNeedSteps: 5,
  questRewardRate: 0.6,            // รางวัล = sell × need × rate + flat
  questRewardFlat: 50,

  // ----- ค่าตั้งค่าเริ่มต้นของ wallpaper -----
  defaultFieldPos: 'center',       // left | center | right
  defaultFieldScale: 1,            // 0.75 | 1 | 1.3
  defaultFieldBottom: 5,           // % ระยะห่างขอบล่าง
  defaultGroundH: 32,              // % ความสูงพื้นดิน
  defaultSeedPos: 'center',        // ตำแหน่งแถบเลือกผัก: left | center | right
  defaultSeedScale: 1,             // ขนาดแถบเลือกผัก: 0.75 | 1 | 1.3
  defaultSeedBottom: 0,            // % ความสูงแถบเลือกผัก (ดันขึ้นจากขอบล่าง)

  // ----- ฉาก/ภาพ (โหมดเบา) — ลดของที่กิน GPU ตลอดเวลา -----
  scene: {
    starCount: 28,         // จำนวนดาว (เดิม 70)
    starTwinkle: false,    // ดาวกะพริบไหม (false = นิ่ง ประหยัดสุด)
    treeCount: 6,          // ต้นไม้ประดับเนินเขา (เดิม 11)
    rainCount: 16,         // เม็ดฝนตอนฝนตก (เดิม 35)
    stormRainCount: 26,    // เม็ดฝนตอนพายุ (เดิม 50)
    cloudCount: 2,         // เมฆตอนมีเมฆ (เดิม 3)
    stormCloudCount: 3,    // เมฆตอนพายุ (เดิม 5)
    lightning: true,       // ฟ้าแลบตอนพายุ (เกิดเป็นครั้งคราว ไม่หนัก)
    glow: true,            // แสงเรืองรอบดวงอาทิตย์/จันทร์
    ambient: true,         // โทนแสงคลุมฉากตามเวลา
  },

  // ----- ข้อมูลผัก (tier) -----
  // cost=ค่าเมล็ด, grow=วินาทีที่โต, sell=ราคาขายฐาน, unlock=เหรียญสะสมที่ปลดล็อก
  crops: [
    {id: 'carrot', em: '🥕', nm: 'แครอท',     cost: 10,     grow: 8,    sell: 18,      unlock: 0},
    {id: 'tomato', em: '🍅', nm: 'มะเขือเทศ', cost: 60,     grow: 18,   sell: 95,      unlock: 200},
    {id: 'corn',   em: '🌽', nm: 'ข้าวโพด',   cost: 300,    grow: 40,   sell: 480,     unlock: 1500},
    {id: 'egg',    em: '🍆', nm: 'มะเขือ',     cost: 1500,   grow: 85,   sell: 2600,    unlock: 9000},
    {id: 'straw',  em: '🍓', nm: 'สตรอว์',     cost: 8000,   grow: 170,  sell: 14500,   unlock: 55000},
    {id: 'pine',   em: '🍍', nm: 'สับปะรด',   cost: 45000,  grow: 340,  sell: 86000,   unlock: 320000},
    {id: 'melon',  em: '🍈', nm: 'เมล่อน',     cost: 250000, grow: 600,  sell: 520000,  unlock: 1.8e6},
    {id: 'flower', em: '🌸', nm: 'ดอกไม้',     cost: 1.4e6,  grow: 1100, sell: 3.2e6,   unlock: 1.1e7},
    {id: 'starf',  em: '🌟', nm: 'ผลไม้ดารา', cost: 8e6,    grow: 2200, sell: 2e7,     unlock: 7e7},
  ],

  // ----- อัปเกรด (endless, exponential) -----
  // base=ราคาเริ่ม, mult=คูณราคาต่อเลเวล, eff=ผล ณ เลเวล l
  upgrades: [
    {id: 'speed',  nm: '💧 ระบบรดน้ำ',   desc: 'ผักโตเร็วขึ้น',          base: 80,   mult: 1.55, eff: l => 1 + l * 0.08},
    {id: 'value',  nm: '💰 ตลาดพรีเมียม', desc: 'ขายผักได้แพงขึ้น',       base: 120,  mult: 1.6,  eff: l => 1 + l * 0.10},
    {id: 'garden', nm: '🏃 คนสวนคล่อง',  desc: 'คนสวนทำงานเร็วขึ้น',     base: 200,  mult: 1.7,  eff: l => 1 + l * 0.15},
    {id: 'fert',   nm: '💩 บ่อปุ๋ย',      desc: 'มีโอกาสได้ปุ๋ยตอนเก็บ', base: 500,  mult: 1.8,  eff: l => l * 0.02},
    {id: 'gold',   nm: '🍀 เมล็ดนำโชค',  desc: 'เพิ่มโอกาสผักทองคำ',     base: 1000, mult: 2.0,  eff: l => l * 0.015},
  ],

  // ----- สภาพอากาศ: grow=ตัวคูณความเร็วโต, next=[min,max] วินาทีที่อยู่ -----
  weathers: {
    sun:   {em: '☀️', nm: 'แดด',  grow: 1.0,  next: [40, 80]},
    cloud: {em: '⛅', nm: 'เมฆ',  grow: 0.7,  next: [40, 70]},
    rain:  {em: '🌧️', nm: 'ฝน',   grow: 1.4,  next: [35, 70]},
    storm: {em: '⛈️', nm: 'พายุ', grow: 0.55, next: [30, 55]},
  },
};

// ----- ทางลัดอ้างถึง CONFIG (ของเดิมหลายจุดใช้ชื่อสั้น) -----
const CROPS = CONFIG.crops;
const UPGRADES = CONFIG.upgrades;
const WEATHERS = CONFIG.weathers;
const PLOT_BASE = CONFIG.plotBase;
const PLOT_MAX = CONFIG.plotMax;
const DAY_LEN = CONFIG.dayLength;
const plotCost = n => Math.floor(CONFIG.plotCostBase * Math.pow(CONFIG.plotCostMult, n - PLOT_BASE - 1));

// ---------- สถานะเกม ----------
let S = null;
function freshState(){
  return {
    coins: CONFIG.startCoins, fert: CONFIG.startFert, spirit: 0, totalEarned: 0,
    plotCount: PLOT_BASE,
    plots: [],                     // {crop, plantedAt, golden} | null
    selected: CONFIG.startSelected,
    auto: CONFIG.startAuto,
    upgrades: {},                  // id->level
    mastery: {},                   // cropId -> harvested count
    quest: null,
    fieldPos: CONFIG.defaultFieldPos,
    fieldScale: CONFIG.defaultFieldScale,
    fieldBottom: CONFIG.defaultFieldBottom,
    groundH: CONFIG.defaultGroundH,
    seedPos: CONFIG.defaultSeedPos,
    seedScale: CONFIG.defaultSeedScale,
    seedBottom: CONFIG.defaultSeedBottom,
    lastSave: Date.now(),
  };
}

// ---------- localStorage ----------
const KEY = CONFIG.saveKey;
function save(){
  S.lastSave = Date.now();
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return false;
    const d = JSON.parse(raw);
    S = Object.assign(freshState(), d);
    return true;
  }catch(e){ return false; }
}

// ---------- ตัวช่วย ----------
const $  = s => document.querySelector(s);
const crop = id => CROPS.find(c=>c.id===id);
const upLvl = id => S.upgrades[id]||0;
const upDef = id => UPGRADES.find(u=>u.id===id);
const upCost = u => Math.floor(u.base * Math.pow(u.mult, upLvl(u.id)));
const upEff = id => { const u = upDef(id); return u ? u.eff(upLvl(id)) : 1; };  // ผลของอัปเกรด ณ เลเวลปัจจุบัน

// ฟอร์แมตเลขย่อ 1.2K / 3.4M / 8.9B …
function fmt(n){
  n = Math.floor(n);
  if(n < 1000) return ''+n;
  const u = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
  let i = 0; let x = n;
  while(x >= 1000 && i < u.length-1){ x/=1000; i++; }
  return (x<10?x.toFixed(2):x<100?x.toFixed(1):Math.floor(x)) + u[i];
}

// ---------- โบนัสรวม ----------
const spiritBonus = () => 1 + S.spirit * CONFIG.spiritBonusPer;
function masteryMult(cropId){
  const h = S.mastery[cropId]||0;
  return 1 + Math.floor(h/CONFIG.masteryPerLevel)*CONFIG.masteryYieldPer;
}
function masteryGrow(cropId){
  const h = S.mastery[cropId]||0;
  return 1 + Math.min(CONFIG.masteryGrowMax, Math.floor(h/CONFIG.masteryGrowEvery)*CONFIG.masteryGrowPer);
}

// ---------- สภาพอากาศ ----------
let weather = 'sun';
function growMult(cropId){
  return WEATHERS[weather].grow
       * upEff('speed')
       * masteryGrow(cropId)
       * (1 + S.spirit*CONFIG.spiritGrowPer);
}

// ---------- เวลากลางวัน/กลางคืน ----------
let gameClock = 0;   // 0..DAY_LEN
function dayPhase(){
  const t = gameClock / DAY_LEN; // 0..1
  if(t < 0.25) return 'morning';
  if(t < 0.55) return 'day';
  if(t < 0.72) return 'evening';
  return 'night';
}

// =================================================================
//  เริ่มเกม
// =================================================================
let weatherEl, timeEl, sceneEl, fieldEl, gardenerEl, celestialEl, starsEl;

function init(){
  weatherEl = $('#weatherStat'); timeEl = $('#timeStat');
  sceneEl = $('#scene'); fieldEl = $('#field');
  gardenerEl = $('#gardener'); celestialEl = $('#celestial'); starsEl = $('#stars');

  if(!load()) S = freshState();
  ensureQuest();
  buildStars();
  buildSeedbar();
  layoutField();
  applyLayout();
  bindUI();

  computeOffline();
  renderWeather();
  weatherEl.textContent = WEATHERS[weather].em+' '+WEATHERS[weather].nm;

  // loops — เดินเกมด้วย setInterval (CPU น้อยกว่า rAF) · หน้าต่างถูกบัง → หยุด
  let last = performance.now(), gameTimer = null;
  function step(){
    const now = performance.now();
    const dt = Math.min(0.25, (now-last)/1000); last = now;
    tick(dt);
  }
  function startLoop(){ if(!gameTimer){ last = performance.now(); gameTimer = setInterval(step, CONFIG.tickMs); } }
  function stopLoop(){ if(gameTimer){ clearInterval(gameTimer); gameTimer = null; } }
  startLoop();
  document.addEventListener('visibilitychange', ()=>{ document.hidden ? stopLoop() : startLoop(); });

  setInterval(save, CONFIG.saveInterval);
  gardenerLoop();
  setInterval(maybeShootingStar, 8000);
  setInterval(maybeCat, 22000);
  window.addEventListener('beforeunload', save);
}

// =================================================================
//  OFFLINE PROGRESS
// =================================================================
function computeOffline(){
  const away = (Date.now() - (S.lastSave||Date.now()))/1000;
  if(away < CONFIG.offlineMinSeconds) return;

  let earned = 0, harvested = 0;
  const cap = CONFIG.offlineCapHours*3600;
  const dt = Math.min(away, cap);

  S.plots.forEach(p=>{
    if(!p) return;
    const c = crop(p.crop); if(!c) return;
    const gm = WEATHERS.sun.grow * upEff('speed') * masteryGrow(c.id) * (1+S.spirit*CONFIG.spiritGrowPer);
    const realGrow = c.grow / gm;
    let elapsed = (Date.now()-p.plantedAt)/1000;
    if(elapsed >= realGrow){
      if(S.auto){
        const cycles = Math.floor(Math.min(elapsed, dt+realGrow)/realGrow);
        for(let i=0;i<cycles;i++){
          earned += sellValue(c, p.golden && i===0);
          harvested++;
          S.mastery[c.id]=(S.mastery[c.id]||0)+1;
        }
        p.plantedAt = Date.now() - (elapsed % realGrow)*1000;
        p.golden = Math.random() < goldenChance();
      }
    }
  });

  if(earned>0 || harvested>0){
    S.coins += earned; S.totalEarned += earned;
    const m = Math.floor(away/60), h=Math.floor(m/60);
    const tstr = h>0 ? `${h} ชม. ${m%60} นาที` : `${m} นาที`;
    $('#welcomeBody').innerHTML =
      `คุณหายไป <b>${tstr}</b><br>คนสวนเก็บผักไป <b>${fmt(harvested)}</b> ต้น<br>
       ได้เหรียญ <b style="color:#ffd34d">🪙 +${fmt(earned)}</b>`;
    $('#welcomeModal').classList.add('show');
    updateHUD();
  }
}

// =================================================================
//  มูลค่าขาย / โอกาสผักทอง
// =================================================================
let market = {};  // cropId -> ตัวคูณราคา
function sellValue(c, golden){
  const m = market[c.id]||1;
  let v = c.sell * m * upEff('value') * masteryMult(c.id) * spiritBonus();
  if(golden) v *= CONFIG.goldenMult;
  return v;
}
function goldenChance(){ return CONFIG.goldenBaseChance + upEff('gold'); }

// =================================================================
//  FIELD / PLOTS
// =================================================================
function applyLayout(){
  const sc = S.fieldScale||1, b = S.fieldBottom||5;
  const gh = S.groundH||CONFIG.defaultGroundH;
  const ground = $('#ground');
  if(ground) ground.style.height = gh+'%';
  const hills = $('#hills');
  if(hills) hills.style.bottom = (gh-4)+'%';
  fieldEl.style.bottom = b+'%';
  if(S.fieldPos==='left'){
    fieldEl.style.left='2%'; fieldEl.style.right='auto';
    fieldEl.style.transformOrigin='bottom left';
    fieldEl.style.transform=`scale(${sc})`;
  }else if(S.fieldPos==='right'){
    fieldEl.style.left='auto'; fieldEl.style.right='2%';
    fieldEl.style.transformOrigin='bottom right';
    fieldEl.style.transform=`scale(${sc})`;
  }else{
    fieldEl.style.left='50%'; fieldEl.style.right='auto';
    fieldEl.style.transformOrigin='bottom center';
    fieldEl.style.transform=`translateX(-50%) scale(${sc})`;
  }
  gardenerEl.style.bottom = 'auto';

  // ----- แถบเลือกผัก (seedbar) — ปรับ ตำแหน่ง/ขนาด/ความสูง แยกจากฟาร์ม -----
  const sb = $('#seedbar');
  if(sb){
    const ss = S.seedScale||1, sbm = S.seedBottom||0;
    sb.style.bottom = sbm+'%';
    if(S.seedPos==='left'){
      sb.style.left='1%'; sb.style.right='auto';
      sb.style.transformOrigin='bottom left';
      sb.style.transform=`scale(${ss})`;
    }else if(S.seedPos==='right'){
      sb.style.left='auto'; sb.style.right='1%';
      sb.style.transformOrigin='bottom right';
      sb.style.transform=`scale(${ss})`;
    }else{
      sb.style.left='50%'; sb.style.right='auto';
      sb.style.transformOrigin='bottom center';
      sb.style.transform=`translateX(-50%) scale(${ss})`;
    }
  }
}

function gridColsFor(n){
  for(const g of CONFIG.gridCols){ if(n<=g.upTo) return g.cols; }
  return CONFIG.gridCols[CONFIG.gridCols.length-1].cols;
}

function layoutField(){
  const cols = gridColsFor(S.plotCount);
  fieldEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  fieldEl.innerHTML = '';
  while(S.plots.length < PLOT_MAX) S.plots.push(null);

  for(let i=0;i<PLOT_MAX;i++){
    const d = document.createElement('div');
    d.className='plot'; d.dataset.i=i;
    if(i>=S.plotCount){
      d.classList.add('locked');
      if(i===S.plotCount){
        d.innerHTML = `🔒<div class="lockcost">🪙${fmt(plotCost(S.plotCount+1))}</div>`;
        d.onclick = ()=>{ buyPlot(); };
      }else{
        d.innerHTML = '🔒';
      }
    }else{
      d.innerHTML = `<span class="crop"></span><div class="progbar"><i></i></div>`;
      d.onclick = ()=>clickPlot(i);
    }
    fieldEl.appendChild(d);
  }
  renderPlots();
}

function buyPlot(){
  if(S.plotCount>=PLOT_MAX){ toast('ขยายฟาร์มเต็มแล้ว!'); return; }
  const cost = plotCost(S.plotCount+1);
  if(S.coins < cost){ toast('เหรียญไม่พอซื้อแปลง'); return; }
  S.coins -= cost; S.plotCount++;
  layoutField(); updateHUD();
  toast('🌱 ขยายฟาร์ม! +1 แปลง');
}

function clickPlot(i){
  const p = S.plots[i];
  const el = fieldEl.children[i];
  if(p){ if(isReady(p)) harvest(i, el); }
  else { plant(i); }
}

function plant(i, cropId){
  const c = crop(cropId || S.selected);
  if(!c) return false;
  if(S.totalEarned < c.unlock) return false;
  if(S.coins < c.cost){ if(!cropId) toast('เหรียญไม่พอปลูก '+c.em); return false; }
  S.coins -= c.cost;
  S.plots[i] = {crop:c.id, plantedAt:Date.now(), golden: Math.random()<goldenChance()};
  updateHUD(); renderPlot(i);
  return true;
}

function isReady(p){
  if(!p) return false;
  const c = crop(p.crop); if(!c) return false;
  const realGrow = c.grow / growMult(c.id);
  return (Date.now()-p.plantedAt)/1000 >= realGrow;
}

function harvest(i, el){
  const p = S.plots[i]; if(!p) return;
  const c = crop(p.crop);
  const val = sellValue(c, p.golden);
  S.coins += val; S.totalEarned += val;
  S.mastery[c.id] = (S.mastery[c.id]||0)+1;
  questProgress(c.id);
  if(upLvl('fert')>0 && Math.random() < upEff('fert')) S.fert += 1;
  floatText(el, (p.golden?'✨':'🪙')+'+'+fmt(val), p.golden?'#ffd34d':'#7ed957');
  S.plots[i] = null;
  el.classList.remove('ready','golden');
  if(S.auto) plant(i);
  else renderPlot(i);
  updateHUD();
}

function renderPlots(){ for(let i=0;i<S.plotCount;i++) renderPlot(i); }
function renderPlot(i){
  const el = fieldEl.children[i]; if(!el || el.classList.contains('locked')) return;
  const p = S.plots[i];
  const cs = el.querySelector('.crop'), bar = el.querySelector('.progbar i');
  if(!cs) return;
  if(!p){
    if(el._st!=='empty'){ cs.textContent=''; bar.style.width='0%'; el.classList.remove('ready','golden'); el._st='empty'; el._pct=-1; }
    return;
  }
  const c = crop(p.crop);
  const realGrow = c.grow/growMult(c.id);
  const prog = Math.min(1,(Date.now()-p.plantedAt)/1000/realGrow);
  const pct = Math.round(prog*100);
  if(el._st==='grow' && el._pct===pct) return;
  el._st='grow'; el._pct=pct;
  cs.textContent = prog<0.33?'🌱':prog<0.7?'🌿':c.em;
  cs.style.transform = `scale(${(0.6+prog*0.4).toFixed(2)})`;
  bar.style.width = pct+'%';
  el.classList.toggle('ready', prog>=1);
  el.classList.toggle('golden', prog>=1 && p.golden);
}

// =================================================================
//  คนสวนเดินทำงานอัตโนมัติ
// =================================================================
function walkTo(xPct, yPct, done){
  const px = parseFloat(gardenerEl.style.left||'10');
  const py = parseFloat(gardenerEl.style.top ||'60');
  const dist = Math.hypot(xPct-px, yPct-py);
  const speed = upEff('garden');
  const dur = Math.max(0.25, dist / (CONFIG.gardenerSpeedBase*speed));
  gardenerEl.classList.toggle('flip', xPct < px);
  gardenerEl.style.transition = `left ${dur}s linear, top ${dur}s linear`;
  gardenerEl.style.left = xPct + '%';
  gardenerEl.style.top  = yPct + '%';
  setTimeout(done, dur*1000);
}

function gardenerLoop(){
  if(document.hidden){ setTimeout(gardenerLoop, 1500); return; }
  let ready=-1, empty=-1;
  for(let i=0;i<S.plotCount;i++){
    if(ready<0 && isReady(S.plots[i])) ready=i;
    if(empty<0 && !S.plots[i]) empty=i;
  }
  const target = ready>=0 ? ready : (S.auto?empty:-1);
  const speed = upEff('garden');
  const W = window.innerWidth, H = window.innerHeight;

  if(target<0){
    const fr = fieldEl.getBoundingClientRect();
    const x = (fr.left + Math.random()*fr.width)/W*100 - 1.5;
    const y = (fr.bottom)/H*100 - 5;
    walkTo(x, y, ()=> setTimeout(gardenerLoop, 1500));
    return;
  }

  const el = fieldEl.children[target];
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width/2)/W*100 - 1.5;
  const y = (r.top  + r.height*0.65)/H*100;

  walkTo(x, y, ()=>{
    gardenerEl.classList.add('work');
    setTimeout(()=>{
      gardenerEl.classList.remove('work');
      if(isReady(S.plots[target])) harvest(target, el);
      else if(!S.plots[target] && S.auto) autoPlantBest(target);
      setTimeout(gardenerLoop, 200);
    }, CONFIG.gardenerWorkMs/speed);
  });
}

function autoPlantBest(i){
  const selC = crop(S.selected);
  if(selC && S.totalEarned>=selC.unlock && S.coins>=selC.cost){ plant(i, S.selected); return; }
  for(let k=CROPS.length-1;k>=0;k--){
    const c = CROPS[k];
    if(S.totalEarned>=c.unlock && S.coins>=c.cost){ plant(i, c.id); return; }
  }
}

// =================================================================
//  TICK หลัก
// =================================================================
function tick(dt){
  gameClock = (gameClock + dt) % DAY_LEN;
  weatherTick(dt);
  marketTick(dt);
  for(let i=0;i<S.plotCount;i++) renderPlot(i);
  updateScene();
}

// ---------- weather ----------
let wTimer = CONFIG.weatherFirstMin + Math.random()*CONFIG.weatherFirstRange;
function weatherTick(dt){
  wTimer -= dt;
  if(wTimer<=0){
    const pool = CONFIG.weatherPool;
    weather = pool[Math.floor(Math.random()*pool.length)];
    const [a,b]=WEATHERS[weather].next; wTimer = a+Math.random()*(b-a);
    renderWeather();
    weatherEl.textContent = WEATHERS[weather].em+' '+WEATHERS[weather].nm;
  }
}

// ---------- market ----------
let mTimer = 0;
function marketTick(dt){
  mTimer -= dt;
  if(mTimer<=0){
    mTimer = CONFIG.marketIntervalMin + Math.random()*CONFIG.marketIntervalRange;
    CROPS.forEach(c=>{ market[c.id] = +(CONFIG.marketMin + Math.random()*CONFIG.marketRange).toFixed(2); });
    buildSeedbar();
  }
}

// =================================================================
//  SCENE: ท้องฟ้า/ดวงอาทิตย์/ดวงจันทร์/ดาว/อากาศ
// =================================================================
const SKY = {
  morning:['#fce3b0','#ffc89e','#9fd3e0','#d2ebcb'],
  day:    ['#54aef2','#8ad0ff','#c8ecff','#e0f3d8'],
  evening:['#33264f','#b5487a','#ff8a5b','#ffd9a0'],
  night:  ['#04061a','#0b1640','#142a55','#1d3140'],
};
// alpha ปรับลงเล็กน้อยให้เข้ากับ normal-blend (เดิมจูนไว้สำหรับ mix-blend multiply)
const AMBIENT = {
  morning:'rgba(255,224,188,0.30)',
  day:    'rgba(255,255,255,0)',
  evening:'rgba(255,138,82,0.40)',
  night:  'rgba(28,40,86,0.60)',
};
const GLOW = {
  morning:['rgba(255,236,180,.85)',0.9],
  day:    ['rgba(255,240,190,.9)',1],
  evening:['rgba(255,150,90,.85)',0.85],
  night:  ['rgba(190,210,255,.7)',0.45],
};
let glowEl, ambientEl, _lastPhase=null, _lastLx=null, _lastLy=null;
const PHASE_LABELS={morning:'🌅 เช้า',day:'🌞 กลางวัน',evening:'🌇 เย็น',night:'🌙 กลางคืน'};
function updateScene(){
  const ph = dayPhase();

  if(ph!==_lastPhase){
    const c = SKY[ph]||SKY.day;
    sceneEl.style.background = `linear-gradient(${c[0]} 0%, ${c[1]} 38%, ${c[2]} 70%, ${c[3]} 100%)`;
    if(ambientEl) ambientEl.style.background = AMBIENT[ph];
    celestialEl.textContent = ph==='night'?'🌙':'☀️';
    starsEl.style.opacity = ph==='night'?1:(ph==='evening'?0.35:0);
    starsEl.classList.toggle('off', ph!=='night' && ph!=='evening');
    timeEl.textContent = PHASE_LABELS[ph];
    if(glowEl){
      const g = GLOW[ph]||GLOW.day;
      glowEl.style.opacity = g[1];
      glowEl.style.background =
        `radial-gradient(circle, ${g[0]} 0%, ${g[0].replace(/[\d.]+\)$/,'.3)')} 30%, transparent 64%)`;
    }
    _lastPhase = ph;
  }

  const t = gameClock/DAY_LEN;
  const lx = (8 + t*84).toFixed(1);
  const ly = (70 - Math.sin(t*Math.PI)*58).toFixed(1);
  if(lx!==_lastLx || ly!==_lastLy){
    _lastLx=lx; _lastLy=ly;
    celestialEl.style.left = lx+'%';
    celestialEl.style.top  = ly+'%';
    if(glowEl){
      glowEl.style.left = (+lx+1.6)+'%';
      glowEl.style.top  = (+ly+2)+'%';
    }
  }
}

function buildStars(){
  glowEl = $('#sunGlow'); ambientEl = $('#ambient');
  const sc = CONFIG.scene;

  if(!sc.glow && glowEl){ glowEl.style.display='none'; glowEl=null; }
  if(!sc.ambient && ambientEl){ ambientEl.style.display='none'; ambientEl=null; }
  if(!sc.starTwinkle) starsEl.classList.add('static');   // ดาวนิ่ง ไม่กะพริบ

  let h='';
  for(let i=0;i<sc.starCount;i++){
    const sz = 1+Math.random()*2;
    h+=`<div class="star" style="left:${Math.random()*100}%;top:${Math.random()*55}%;
        width:${sz}px;height:${sz}px;animation-delay:${Math.random()*3}s"></div>`;
  }
  starsEl.innerHTML=h;

  const trees=['🌲','🌳','🌴','🌲','🌳',];
  let th='';
  for(let i=0;i<sc.treeCount;i++){
    const l=3+Math.random()*94, s=40+Math.random()*30, b=12;
    th+=`<div class="tree" style="left:${l}%;bottom:${b}%;font-size:${Math.round(s)}px">${trees[Math.floor(Math.random()*trees.length)]}</div>`;
  }
  $('#hills').insertAdjacentHTML('beforeend', th);
}

function renderWeather(){
  const sc = CONFIG.scene;
  const L=$('#weatherLayer'); L.innerHTML='';
  if(weather==='rain'||weather==='storm'){
    const n = weather==='storm'?sc.stormRainCount:sc.rainCount;
    let h='';
    for(let i=0;i<n;i++){
      h+=`<div class="rain" style="left:${Math.random()*100}%;animation-duration:${0.4+Math.random()*0.5}s;animation-delay:${Math.random()*1}s"></div>`;
    }
    L.innerHTML=h;
    if(weather==='storm' && sc.lightning) startLightning();
  }
  if(weather==='cloud'||weather==='storm'){
    const n=weather==='storm'?sc.stormCloudCount:sc.cloudCount;
    for(let i=0;i<n;i++){
      const cl=document.createElement('div');
      cl.className='cloud'; cl.textContent='☁️';
      cl.style.top=(5+Math.random()*30)+'%';
      cl.style.animationDuration=(25+Math.random()*30)+'s';
      cl.style.animationDelay=(-Math.random()*30)+'s';
      cl.style.fontSize=(50+Math.random()*40)+'px';
      L.appendChild(cl);
    }
  }
}
let lightningOn=false;
function startLightning(){
  if(lightningOn) return; lightningOn=true;
  const f=$('#flash');
  const strike=()=>{
    if(weather!=='storm'){ lightningOn=false; return; }
    f.style.transition='none'; f.style.opacity='0.8';
    setTimeout(()=>{ f.style.transition='opacity .4s'; f.style.opacity='0'; },60);
    setTimeout(strike, 3000+Math.random()*5000);
  };
  setTimeout(strike, 2000+Math.random()*4000);
}

// =================================================================
//  EASTER EGGS
// =================================================================
function maybeShootingStar(){
  if(dayPhase()!=='night') return;
  if(Math.random()>CONFIG.shootingStarChance) return;
  const sh=$('#shooter');
  sh.style.display='block';
  sh.style.left=(60+Math.random()*30)+'%';
  sh.style.top=(5+Math.random()*25)+'%';
  sh.style.transition='none';
  sh.style.transform='translate(0,0) rotate(45deg)';
  requestAnimationFrame(()=>{
    sh.style.transition='transform 2.2s linear';
    sh.style.transform='translate(-40vw,40vh) rotate(45deg)';
  });
  sh.onclick=()=>{
    const r = CONFIG.shootingStarReward;
    S.coins+=r; S.totalEarned+=r; updateHUD();
    floatText(sh,'🌠+'+fmt(r),'#fff'); toast('🌠 ดาวตก! +'+fmt(r)+' เหรียญ');
    sh.style.display='none'; sh.onclick=null;
  };
  setTimeout(()=>{ sh.style.display='none'; sh.onclick=null; }, 2300);
}

function maybeCat(){
  if(Math.random()>CONFIG.catChance) return;
  const cat=$('#cat');
  cat.style.display='block';
  cat.style.transition='none'; cat.style.left='-60px';
  requestAnimationFrame(()=>{
    cat.style.transition='left 6s linear';
    cat.style.left='105%';
  });
  cat.onclick=()=>{
    S.fert+=CONFIG.catFertReward; updateHUD(); floatText(cat,'💩+'+CONFIG.catFertReward,'#caa');
    toast('🐈 แมวจรให้ปุ๋ย +'+CONFIG.catFertReward+'!'); cat.style.display='none'; cat.onclick=null;
  };
  setTimeout(()=>{ cat.style.display='none'; cat.onclick=null; }, 6200);
}

// =================================================================
//  UI: seedbar, HUD, modals
// =================================================================
function buildSeedbar(){
  const bar=$('#seedbar'); bar.innerHTML='';
  CROPS.forEach(c=>{
    const unlocked = S.totalEarned>=c.unlock;
    const d=document.createElement('div');
    d.className='seed'+(c.id===S.selected?' sel':'')+(unlocked?'':' lock');
    const m = market[c.id]||1;
    const mk = m>1.05?`<span class="markup up">▲${Math.round((m-1)*100)}%</span>`
             : m<0.95?`<span class="markup down">▼${Math.round((1-m)*100)}%</span>`:'';
    const lvl = Math.floor((S.mastery[c.id]||0)/CONFIG.masteryPerLevel);
    const mx = lvl>=1?`<span class="mx">🌟${lvl}</span>`:'';
    if(unlocked){
      d.innerHTML=`<span class="em">${c.em}</span><span class="nm">${c.nm}</span>
        <span class="pr">🪙${fmt(c.cost)}</span>${mk}${mx}`;
      d.onclick=()=>{ S.selected=c.id; buildSeedbar(); };
    }else{
      d.innerHTML=`<span class="em">🔒</span><span class="nm">${c.nm}</span>
        <span class="pr" style="color:#9fb4a3">ปลด ${fmt(c.unlock)}</span>`;
    }
    bar.appendChild(d);
  });
}

function updateHUD(){
  $('#coins').textContent=fmt(S.coins);
  $('#fert').textContent=fmt(S.fert);
  $('#spirit').textContent=fmt(S.spirit);
  $('#spiritBonus').textContent=Math.round((spiritBonus()-1)*100);
}

function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  $('#toasts').appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
function floatText(el,txt,color){
  const r=el.getBoundingClientRect();
  const f=document.createElement('div'); f.className='float'; f.textContent=txt;
  f.style.color=color||'#fff'; f.style.left=(r.left+r.width/2)+'px'; f.style.top=r.top+'px';
  document.body.appendChild(f); setTimeout(()=>f.remove(),1000);
}

// ---------- shop ----------
function renderShop(){
  const list=$('#shopList'); list.innerHTML='';
  UPGRADES.forEach(u=>{
    const lv=upLvl(u.id), cost=upCost(u);
    const r=document.createElement('div'); r.className='row';
    let effTxt;
    if(u.id==='fert') effTxt=`โอกาสปุ๋ย ${Math.round(u.eff(lv)*100)}%`;
    else if(u.id==='gold') effTxt=`ผักทอง ${Math.round(goldenChance()*100)}%`;
    else effTxt=`x${u.eff(lv).toFixed(2)}`;
    r.innerHTML=`<div class="l"><b>${u.nm}</b> <span class="lvl">Lv.${lv}</span>
      <small>${u.desc} — ตอนนี้ ${effTxt}</small></div>
      <button class="btn">🪙${fmt(cost)}</button>`;
    r.querySelector('button').onclick=()=>{
      if(S.coins<cost){ toast('เหรียญไม่พอ'); return; }
      S.coins-=cost; S.upgrades[u.id]=lv+1; updateHUD(); renderShop();
    };
    list.appendChild(r);
  });
  if(S.plotCount<PLOT_MAX){
    const cost=plotCost(S.plotCount+1);
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div class="l"><b>🌾 ขยายฟาร์ม</b> <span class="lvl">${S.plotCount}/${PLOT_MAX} แปลง</span>
      <small>เพิ่มพื้นที่ปลูก +1 แปลง</small></div><button class="btn">🪙${fmt(cost)}</button>`;
    r.querySelector('button').onclick=()=>{ buyPlot(); renderShop(); };
    list.appendChild(r);
  }
}

// ---------- mastery ----------
function renderMastery(){
  const list=$('#masteryList'); list.innerHTML='';
  const per = CONFIG.masteryPerLevel;
  CROPS.forEach(c=>{
    const h=S.mastery[c.id]||0;
    const lvl=Math.floor(h/per);
    const next=(lvl+1)*per, prog=(h-lvl*per)/per*100;
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div class="l"><b>${c.em} ${c.nm}</b> <span class="lvl">Lv.${lvl}</span>
      <small>เก็บแล้ว ${fmt(h)} ต้น · ผลผลิต x${masteryMult(c.id).toFixed(1)} · โต x${masteryGrow(c.id).toFixed(2)}</small>
      <div class="barmini"><i style="width:${prog}%"></i></div></div>
      <div style="font-size:12px;color:#9fb4a3">อีก ${next-h} → Lv.${lvl+1}</div>`;
    list.appendChild(r);
  });
}

// ---------- quests ----------
function ensureQuest(){ if(!S.quest) S.quest = newQuest(); }
function newQuest(){
  const avail = CROPS.filter(c=>S.totalEarned>=c.unlock);
  const c = avail[Math.floor(Math.random()*avail.length)] || CROPS[0];
  const need = CONFIG.questNeedMin + Math.floor(Math.random()*CONFIG.questNeedSteps)*CONFIG.questNeedStep;
  const reward = Math.floor(c.sell*need*CONFIG.questRewardRate + CONFIG.questRewardFlat);
  return {crop:c.id, need, have:0, reward};
}
function questProgress(cropId){
  if(!S.quest) return;
  if(S.quest.crop===cropId){
    S.quest.have++;
    if(S.quest.have>=S.quest.need){
      S.coins+=S.quest.reward; S.totalEarned+=S.quest.reward;
      toast('📜 เควสสำเร็จ! +'+fmt(S.quest.reward)+' เหรียญ');
      S.quest=newQuest(); updateHUD();
    }
    if($('#questModal').classList.contains('show')) renderQuests();
  }
}
function renderQuests(){
  ensureQuest();
  const q=S.quest, c=crop(q.crop);
  const prog=Math.min(100, q.have/q.need*100);
  $('#questList').innerHTML=`
    <div style="font-size:16px;margin-bottom:8px;">ส่ง ${c.em} <b>${c.nm} ${q.need} ต้น</b></div>
    <div>คืบหน้า: <b>${q.have}/${q.need}</b></div>
    <div class="qbar"><i style="width:${prog}%"></i></div>
    <div style="margin-top:10px;color:#ffd34d;font-size:15px;">รางวัล 🪙 ${fmt(q.reward)}</div>
    <div class="hint">เก็บเกี่ยว ${c.nm} ให้ครบ แล้วเควสใหม่จะมาเอง</div>`;
}

// ---------- prestige ----------
function spiritGain(){ return Math.floor(Math.sqrt(S.totalEarned/CONFIG.prestigeDivisor)); }
function renderPrestige(){
  const g=spiritGain();
  $('#prestigeInfo').innerHTML=`
    <div class="row"><div class="l"><b>เหรียญสะสมทั้งหมด</b></div><div>🪙 ${fmt(S.totalEarned)}</div></div>
    <div class="row"><div class="l"><b>Spirit ที่จะได้รอบนี้</b></div><div style="color:#b388ff">✨ +${fmt(g)}</div></div>
    <div class="row"><div class="l"><b>Spirit รวมหลังรีเบิร์ธ</b><small>โบนัสผลผลิต +${Math.round(CONFIG.spiritBonusPer*100)}%/spirit · โตไว +${Math.round(CONFIG.spiritGrowPer*100)}%/spirit · Mastery ติดตัว</small></div>
      <div style="color:#b388ff">✨ ${fmt(S.spirit+g)} (+${Math.round((S.spirit+g)*CONFIG.spiritBonusPer*100)}%)</div></div>`;
  $('#doPrestige').disabled = g<1;
  $('#doPrestige').textContent = g<1 ? `ต้องสะสมถึง 🪙${fmt(CONFIG.prestigeDivisor)} ก่อน (มี ${fmt(S.totalEarned)})` : `รีเบิร์ธ → +${fmt(g)} ✨`;
}
function doPrestige(){
  const g=spiritGain(); if(g<1) return;
  const keepSpirit=S.spirit+g, keepMastery=S.mastery;
  S=freshState();
  S.spirit=keepSpirit; S.mastery=keepMastery;
  ensureQuest(); layoutField(); buildSeedbar(); updateHUD();
  $('#prestigeModal').classList.remove('show');
  toast('🔄 รีเบิร์ธสำเร็จ! ✨ Spirit '+fmt(keepSpirit));
  save();
}

// =================================================================
//  bind UI
// =================================================================
function bindUI(){
  $('#shopBtn').onclick=()=>{ renderShop(); openModal('shopModal'); };
  $('#masteryBtn').onclick=()=>{ renderMastery(); openModal('masteryModal'); };
  $('#questBtn').onclick=()=>{ renderQuests(); openModal('questModal'); };
  $('#prestigeBtn').onclick=()=>{ renderPrestige(); openModal('prestigeModal'); };
  $('#settingBtn').onclick=()=>{ refreshSettingUI(); openModal('settingModal'); };
  $('#doPrestige').onclick=doPrestige;

  // ---- เมนูยุบ (☰) — เปิด/ปิด dropdown + คลิกที่อื่นแล้วปิด ----
  $('#menuBtn').onclick=e=>{ e.stopPropagation(); $('#menuDrop').classList.toggle('open'); };
  document.addEventListener('click', e=>{
    const w=$('#menuWrap'); if(w && !w.contains(e.target)) $('#menuDrop').classList.remove('open');
  });

  // ---- settings ----
  document.querySelectorAll('#posBtns button').forEach(b=>{
    b.onclick=()=>{ S.fieldPos=b.dataset.pos; applyLayout(); refreshSettingUI(); save(); };
  });
  document.querySelectorAll('#scaleBtns button').forEach(b=>{
    b.onclick=()=>{ S.fieldScale=+b.dataset.scale; applyLayout(); refreshSettingUI(); save(); };
  });
  $('#bottomRange').oninput=e=>{ S.fieldBottom=+e.target.value; applyLayout(); };
  $('#bottomRange').onchange=save;
  $('#groundRange').oninput=e=>{ S.groundH=+e.target.value; applyLayout(); };
  $('#groundRange').onchange=save;
  // ---- ตั้งค่าแถบเลือกผัก ----
  document.querySelectorAll('#seedPosBtns button').forEach(b=>{
    b.onclick=()=>{ S.seedPos=b.dataset.seedpos; applyLayout(); refreshSettingUI(); save(); };
  });
  document.querySelectorAll('#seedScaleBtns button').forEach(b=>{
    b.onclick=()=>{ S.seedScale=+b.dataset.seedscale; applyLayout(); refreshSettingUI(); save(); };
  });
  $('#seedBottomRange').oninput=e=>{ S.seedBottom=+e.target.value; applyLayout(); };
  $('#seedBottomRange').onchange=save;
  $('#resetBtn').onclick=()=>{
    if(confirm('ลบเซฟทั้งหมดและเริ่มใหม่?')){
      try{ localStorage.removeItem(KEY); }catch(e){}
      location.reload();
    }
  };
  $('#welcomeOk').onclick=()=>$('#welcomeModal').classList.remove('show');
  const setAuto=()=>{
    $('#autoBtn').textContent='🤖 ปลูกอัตโนมัติ: '+(S.auto?'เปิด':'ปิด');
    $('#autoBtn').classList.toggle('on',S.auto);
  };
  $('#autoBtn').onclick=()=>{ S.auto=!S.auto; setAuto(); };
  setAuto();

  document.querySelectorAll('.close').forEach(x=>{
    x.onclick=()=>$('#'+x.dataset.close).classList.remove('show');
  });
  document.querySelectorAll('.modal').forEach(m=>{
    m.onclick=e=>{ if(e.target===m) m.classList.remove('show'); };
  });
  window.addEventListener('keydown',e=>{
    if(e.key>='1'&&e.key<='9'){
      const c=CROPS[+e.key-1];
      if(c && S.totalEarned>=c.unlock){ S.selected=c.id; buildSeedbar(); }
    }
    if(e.code==='Space'){ e.preventDefault(); $('#autoBtn').click(); }
  });
  updateHUD();
}
function openModal(id){
  document.querySelectorAll('.modal').forEach(m=>m.classList.remove('show'));
  const md=$('#menuDrop'); if(md) md.classList.remove('open');   // ปิด ☰ เมื่อเปิดแผง
  $('#'+id).classList.add('show');
}

function refreshSettingUI(){
  document.querySelectorAll('#posBtns button').forEach(b=>
    b.classList.toggle('on', b.dataset.pos===S.fieldPos));
  document.querySelectorAll('#scaleBtns button').forEach(b=>
    b.classList.toggle('on', +b.dataset.scale===S.fieldScale));
  $('#bottomRange').value = S.fieldBottom;
  $('#groundRange').value = S.groundH;
  document.querySelectorAll('#seedPosBtns button').forEach(b=>
    b.classList.toggle('on', b.dataset.seedpos===S.seedPos));
  document.querySelectorAll('#seedScaleBtns button').forEach(b=>
    b.classList.toggle('on', +b.dataset.seedscale===S.seedScale));
  $('#seedBottomRange').value = S.seedBottom;
}

init();
