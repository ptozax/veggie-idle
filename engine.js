/* ===================================================================
   🌱 ENGINE — เครื่องยนต์เกม (ใช้ร่วมทุก map)
   -------------------------------------------------------------------
   ★ ไฟล์นี้ไม่มี CONFIG ของตัวเอง — ต้องโหลด *.config.js ก่อนไฟล์นี้
     (config นิยาม const CONFIG พร้อม CONFIG.theme)
   ★ ธีมภาพ (ฟ้า/พื้น/ดาว/อิโมจิ/สเตจการโต) อ่านจาก CONFIG.theme ทั้งหมด
   =================================================================== */
'use strict';

// ----- ทางลัดอ้างถึง CONFIG (ของเดิมหลายจุดใช้ชื่อสั้น) -----
const CROPS = CONFIG.crops;
const UPGRADES = CONFIG.upgrades;
const FERTSHOP = CONFIG.fertShop;
const DECOR = CONFIG.decorations;
const SEASONS = CONFIG.seasons;
const WEATHERS = CONFIG.weathers;
const PLOT_BASE = CONFIG.plotBase;
const PLOT_MAX = CONFIG.plotMax;
const DAY_LEN = CONFIG.dayLength;
const plotCost = n => Math.floor(CONFIG.plotCostBase * Math.pow(CONFIG.plotCostMult, n - PLOT_BASE - 1));

// ----- ป้ายข้อความที่ปรับตามธีม (farm: ปุ๋ย/💩 · moon: สารอาหาร/🧪) — มี fallback เป็นฟาร์ม -----
const FERT_ICON  = (CONFIG.theme && CONFIG.theme.fertIcon)  || '💩';
const FERT_NAME  = (CONFIG.theme && CONFIG.theme.fertName)  || 'ปุ๋ย';
const BOOST_NAME = (CONFIG.theme && CONFIG.theme.boostName) || 'โปรยปุ๋ย';
const CAT_LABEL  = (CONFIG.theme && CONFIG.theme.catLabel)  || '🐈 แมวจร';

// ---------- สถานะเกม ----------
let S = null;
function freshState(){
  return {
    coins: CONFIG.startCoins, fert: CONFIG.startFert,
    spirit: 0,                     // ✨ สกุลเงินสำหรับแลกของ (ใช้แล้วลด)
    prestigeLv: 0,                 // ⭐ ระดับบารมี — ขับโบนัสพาสซีฟ (ขึ้นอย่างเดียว ไม่ลด)
    totalEarned: 0,
    plotCount: PLOT_BASE,
    decor: {},                     // ของตกแต่ง: id->level
    plots: [],                     // {crop, plantedAt, golden} | null
    selected: CONFIG.startSelected,
    auto: CONFIG.startAuto,
    upgrades: {},                  // id->level
    fertUp: {},                    // ร้านปุ๋ย: id->level
    boostEnds: 0,                  // โปรยปุ๋ย: timestamp ที่โบนัสหมดอายุ (0 = ไม่มี)
    mastery: {},                   // cropId -> harvested count
    quest: null,
    fieldPos: CONFIG.defaultFieldPos,
    fieldScale: CONFIG.defaultFieldScale,
    fieldBottom: CONFIG.defaultFieldBottom,
    groundH: CONFIG.defaultGroundH,
    seedPos: CONFIG.defaultSeedPos,
    seedScale: CONFIG.defaultSeedScale,
    seedBottom: CONFIG.defaultSeedBottom,
    fieldHidden: false,            // ซ่อนสวนเต็ม → แสดงเป็นแปลงผักแบบย่อบนพื้น
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
    // ----- ย้ายเซฟเก่า: เดิม spirit ทำหน้าที่ทั้งโบนัส & กระเป๋า → แยกเป็น prestigeLv (โบนัส) + spirit (กระเป๋า) -----
    if(d.prestigeLv === undefined){
      S.prestigeLv = d.spirit || 0;                                   // โบนัส = spirit สะสมเดิม (โบนัสคงเดิมเป๊ะ)
      S.spirit = Math.max(0, (d.spirit || 0) - (d.spiritSpent || 0)); // กระเป๋า = ที่เหลือหลังใช้ซื้อของตกแต่ง
    }
    delete S.spiritSpent;
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

// ----- ร้านปุ๋ย (ซื้อด้วยปุ๋ย) -----
const fertUpLvl  = id => (S.fertUp && S.fertUp[id]) || 0;
const fertUpDef  = id => FERTSHOP.find(u => u.id === id);
const fertUpCost = u  => Math.floor(u.base * Math.pow(u.mult, fertUpLvl(u.id)));
const fertEff    = id => { const u = fertUpDef(id); return u ? u.eff(fertUpLvl(id)) : 0; };  // ผล ณ เลเวลปัจจุบัน

// ----- โปรยปุ๋ย (Active Boost) -----
const fertBoostActive   = () => S.boostEnds && Date.now() < S.boostEnds;
const fertBoostLeft     = () => fertBoostActive() ? Math.ceil((S.boostEnds - Date.now())/1000) : 0;
const fertBoostDuration = () => CONFIG.fertBoost.duration + fertEff('longBoost');

// ----- 🏯 ของตกแต่ง (ซื้อด้วย ✨ ที่ใช้ได้) -----
const decorLvl   = id => (S.decor && S.decor[id]) || 0;
const decorDef   = id => DECOR.find(d => d.id === id);
const decorCost  = d  => Math.floor(d.base * Math.pow(d.mult, decorLvl(d.id)));
// รวมโบนัสจากของตกแต่งทุกชิ้นที่เป็นชนิด type (sum ของ level×per)
function decorSum(type){
  let s = 0;
  DECOR.forEach(d => { if(d.type === type){ const l = decorLvl(d.id); if(l > 0) s += l * d.per; } });
  return s;
}

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
const spiritBonus = () => 1 + S.prestigeLv * CONFIG.spiritBonusPer;
function masteryMult(cropId){
  const h = S.mastery[cropId]||0;
  return 1 + Math.floor(h/CONFIG.masteryPerLevel)*CONFIG.masteryYieldPer;
}
function masteryGrow(cropId){
  const h = S.mastery[cropId]||0;
  return 1 + Math.min(CONFIG.masteryGrowMax, Math.floor(h/CONFIG.masteryGrowEvery)*CONFIG.masteryGrowPer);
}

// ---------- ฤดูกาล ----------
let season = 0;                              // index ใน SEASONS (วนตามลำดับ)
let seasonTimer = CONFIG.seasonLength;
const curSeason = () => SEASONS[season];

// ---------- สภาพอากาศ ----------
let weather = 'sun';
function growMult(cropId){
  return WEATHERS[weather].grow
       * curSeason().grow
       * upEff('speed')
       * masteryGrow(cropId)
       * (1 + S.prestigeLv*CONFIG.spiritGrowPer)
       * (1 + decorSum('grow'))
       * (fertBoostActive() ? CONFIG.fertBoost.growMult : 1);
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
  renderSeason();
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
  setInterval(maybePest, CONFIG.pest.checkMs);
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
    const gm = WEATHERS.sun.grow * upEff('speed') * masteryGrow(c.id) * (1+S.prestigeLv*CONFIG.spiritGrowPer) * (1+decorSum('grow'));
    const realGrow = c.grow / gm;
    let elapsed = (Date.now()-p.plantedAt)/1000;
    if(elapsed >= realGrow){
      if(S.auto){
        const cycles = Math.floor(Math.min(elapsed, dt+realGrow)/realGrow);
        for(let i=0;i<cycles;i++){
          earned += sellValue(c, p.golden && i===0, p.mutant && i===0);
          harvested++;
          S.mastery[c.id]=(S.mastery[c.id]||0)+1;
        }
        p.plantedAt = Date.now() - (elapsed % realGrow)*1000;
        const mut = Math.random() < mutantChance();
        p.mutant = mut; p.golden = !mut && Math.random() < goldenChance();
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
function sellValue(c, golden, mutant){
  const m = market[c.id]||1;
  let v = c.sell * m * upEff('value') * masteryMult(c.id) * spiritBonus()
        * fertEff('richSoil') * curSeason().sell * (1 + decorSum('sell'));
  if(mutant) v *= CONFIG.mutantMult;       // กลายพันธุ์มาก่อน (จ่ายหนักกว่าทอง)
  else if(golden) v *= CONFIG.goldenMult;
  return v;
}
function goldenChance(){
  return CONFIG.goldenBaseChance + upEff('gold') + fertEff('fertGold')
       + decorSum('golden')
       + (fertBoostActive() ? CONFIG.fertBoost.goldenAdd : 0);
}
function mutantChance(){
  return CONFIG.mutantBaseChance + decorSum('mutant')
       + (fertBoostActive() ? CONFIG.mutantBoostAdd : 0);
}
// โอกาสได้ปุ๋ยตอนเก็บ = บ่อปุ๋ย (เงิน) + ราชาปุ๋ย (ปุ๋ย) + บ้านเห็ดปุ๋ย (ของตกแต่ง)
function fertDropChance(){ return upEff('fert') + fertEff('compostKing') + decorSum('fert'); }

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
  renderDecorScene();   // วาง/ปรับตำแหน่งของตกแต่งให้ตรงระดับพื้นดินปัจจุบัน

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

  // ----- แปลงผักแบบย่อ — วางบนพื้นที่ระดับขอบหญ้าแบบเดียวกับ "ของตกแต่ง" -----
  const mf = $('#miniField');
  if(mf){
    mf.style.bottom = gh + '%';   // ปักที่ขอบบนพื้นดิน เหมือน .decor-item (renderDecorScene)
    mf.style.left = S.fieldPos==='left' ? '12%' : S.fieldPos==='right' ? '88%' : '50%';
  }
}

function gridColsFor(n){
  for(const g of CONFIG.gridCols){ if(n<=g.upTo) return g.cols; }
  return CONFIG.gridCols[CONFIG.gridCols.length-1].cols;
}

function layoutField(){
  if(typeof clearPest==='function') clearPest();   // ลบศัตรูพืชค้าง ก่อนสร้างกริดใหม่
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
  const mutant = Math.random()<mutantChance();
  S.plots[i] = {crop:c.id, plantedAt:Date.now(), golden: !mutant && Math.random()<goldenChance(), mutant};
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
  const val = sellValue(c, p.golden, p.mutant);
  S.coins += val; S.totalEarned += val;
  S.mastery[c.id] = (S.mastery[c.id]||0)+1;
  questProgress(c.id);
  const fc = fertDropChance(); if(fc>0 && Math.random() < fc) S.fert += 1;
  const icon = p.mutant?'🌈':p.golden?'✨':'🪙';
  const col  = p.mutant?'#54e0ff':p.golden?'#ffd34d':'#7ed957';
  floatText(el, icon+'+'+fmt(val), col);
  S.plots[i] = null;
  el.classList.remove('ready','golden','mutant');
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
    if(el._st!=='empty'){ cs.textContent=''; bar.style.width='0%'; el.classList.remove('ready','golden','mutant'); el._st='empty'; el._pct=-1; }
    return;
  }
  const c = crop(p.crop);
  const realGrow = c.grow/growMult(c.id);
  const prog = Math.min(1,(Date.now()-p.plantedAt)/1000/realGrow);
  const pct = Math.round(prog*100);
  if(el._st==='grow' && el._pct===pct) return;
  el._st='grow'; el._pct=pct;
  const gs = CONFIG.theme.growStages;   // [เมล็ด, ต้นอ่อน] ก่อนโตเต็มเป็น c.em
  cs.textContent = prog<0.33?gs[0]:prog<0.7?gs[1]:c.em;
  cs.style.transform = `scale(${(0.6+prog*0.4).toFixed(2)})`;
  bar.style.width = pct+'%';
  el.classList.toggle('ready', prog>=1);
  el.classList.toggle('golden', prog>=1 && p.golden);
  el.classList.toggle('mutant', prog>=1 && p.mutant);
}

// =================================================================
//  แปลงผักแบบย่อ (ซ่อนสวน) — โหมด wallpaper สะอาดตา
// =================================================================
// เปิด/ปิดการซ่อนสวน: ซ่อนแปลงเต็ม+แถบผัก+คนสวน แล้วโชว์แปลงย่อบนพื้น
function setFieldHidden(hidden){
  S.fieldHidden = !!hidden;
  document.body.classList.toggle('hide-field', S.fieldHidden);
  const btn = $('#hideFieldBtn');
  if(btn){
    btn.textContent = S.fieldHidden ? '🌾 แสดงสวน' : '🌿 ซ่อนสวน';
    btn.classList.toggle('on', S.fieldHidden);
  }
  if(S.fieldHidden) buildMiniField();
  // หมายเหตุ: ไม่ save() ที่นี่ — ถูกเรียกตอน init ก่อน computeOffline() ด้วย (กัน lastSave ถูกเขียนทับ)
}

// เก็บเกี่ยวแบบเงียบ — ใช้ตอนสวนถูกซ่อน · คืนค่าเหรียญที่ได้เพื่อเอาไปเด้งรวม
function harvestSilent(i){
  const p = S.plots[i]; if(!p) return 0;
  const c = crop(p.crop); if(!c) return 0;
  const val = sellValue(c, p.golden, p.mutant);
  S.coins += val; S.totalEarned += val;
  S.mastery[c.id] = (S.mastery[c.id]||0)+1;
  questProgress(c.id);
  const fc = fertDropChance(); if(fc>0 && Math.random() < fc) S.fert += 1;
  const golden = p.golden, mutant = p.mutant;
  S.plots[i] = null;
  if(S.auto) autoPlantBest(i);
  return { val, golden, mutant };
}

// ดูแลสวนตอนซ่อน (คนสวนหยุดทำงาน) — เก็บผักสุก & ปลูกต่อถ้าเปิดอัตโนมัติ
function tendHidden(){
  let changed = false, gained = 0, hadGold = false, hadMut = false;
  for(let i=0;i<S.plotCount;i++){
    if(isReady(S.plots[i])){
      const r = harvestSilent(i);
      if(r){ gained += r.val; hadGold = hadGold||r.golden; hadMut = hadMut||r.mutant; }
      changed = true;
    }
    else if(!S.plots[i] && S.auto){ if(autoPlantBest(i)) changed=true; }
  }
  if(gained > 0) popMiniGain(gained, hadMut, hadGold);   // เด้ง +999 รวมต่อ tick
  if(changed) updateHUD();
}

// เด้งตัวเลขเหรียญลอยขึ้นจากไอคอนฟาร์มย่อ
function popMiniGain(val, mutant, golden){
  const icon = document.querySelector('#miniField .mini-icon'); if(!icon) return;
  const txt = (mutant?'🌈':golden?'✨':'🪙')+'+'+fmt(val);
  const col = mutant?'#54e0ff':golden?'#ffd34d':'#7ed957';
  floatText(icon, txt, col);   // เด้งเฉพาะเลข +999 — ตัวไอคอนบ้านอยู่นิ่ง
}

// สร้างไอคอนฟาร์มย่อ (อิโมจิวางบนพื้นแบบของตกแต่ง) — ครั้งเดียว
function buildMiniField(){
  const mf = $('#miniField'); if(!mf) return;
  const icon = CONFIG.theme.miniIcon || '🏡';
  mf.innerHTML = `<span class="mini-icon">${icon}</span>`;
  mf.title = 'แตะเพื่อแสดงสวน';
  mf.onclick = ()=>{ setFieldHidden(false); save(); };
  renderMiniField();
}

// อัปเดตสถานะไอคอนฟาร์มย่อ (เรืองเขียว/กระดิกเมื่อมีผักพร้อมเก็บ)
function renderMiniField(){
  const mf = $('#miniField'); if(!mf || !S.fieldHidden) return;
  if(!mf.querySelector('.mini-icon')){ buildMiniField(); return; }
  let ready = 0;
  for(let i=0;i<S.plotCount;i++){ if(isReady(S.plots[i])) ready++; }
  mf.classList.toggle('has-ready', ready>0);
}

// =================================================================
//  คนสวนเดินทำงานอัตโนมัติ
// =================================================================
let _gx = 10, _gy = 60;   // ตำแหน่งคนสวนปัจจุบัน (หน่วย vw/vh) — เก็บใน JS แทนการ parse style ทุกครั้ง
function walkTo(xPct, yPct, done){
  const dist = Math.hypot(xPct-_gx, yPct-_gy);
  const speed = upEff('garden');
  const dur = Math.max(0.25, dist / (CONFIG.gardenerSpeedBase*speed));
  gardenerEl.classList.toggle('flip', xPct < _gx);
  gardenerEl.style.transition = `transform ${dur}s linear`;
  gardenerEl.style.transform = `translate(${xPct}vw,${yPct}vh)`;
  _gx = xPct; _gy = yPct;
  setTimeout(done, dur*1000);
}

function gardenerLoop(){
  if(document.hidden || S.fieldHidden){ setTimeout(gardenerLoop, 1500); return; }
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
  if(selC && S.totalEarned>=selC.unlock && S.coins>=selC.cost){ return plant(i, S.selected); }
  for(let k=CROPS.length-1;k>=0;k--){
    const c = CROPS[k];
    if(S.totalEarned>=c.unlock && S.coins>=c.cost){ return plant(i, c.id); }
  }
  return false;
}

// =================================================================
//  TICK หลัก
// =================================================================
function tick(dt){
  gameClock = (gameClock + dt) % DAY_LEN;
  weatherTick(dt);
  seasonTick(dt);
  marketTick(dt);
  if(S.fieldHidden){ tendHidden(); renderMiniField(); }
  else { for(let i=0;i<S.plotCount;i++) renderPlot(i); }
  updateScene();
  updateBoostBtn();
}

// ---------- ฤดูกาล ----------
function seasonTick(dt){
  seasonTimer -= dt;
  if(seasonTimer<=0){
    season = (season+1) % SEASONS.length;
    seasonTimer = CONFIG.seasonLength;
    const s = curSeason();
    renderSeason();
    toast(`${s.em} เข้าสู่${s.nm} — ${s.desc}`);
  }
}
function renderSeason(){
  const s = curSeason();
  const el = $('#seasonStat'); if(el) el.textContent = s.em+' '+s.nm;
  const tint = $('#seasonTint'); if(tint) tint.style.background = s.tint;
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
// ----- ธีมภาพทั้งหมดมาจาก CONFIG.theme (กำหนดต่อ map ในไฟล์ *.config.js) -----
const SKY = CONFIG.theme.sky;
const AMBIENT = CONFIG.theme.ambient;
const GLOW = CONFIG.theme.glow;
let glowEl, ambientEl, _lastPhase=null, _lastLx=null, _lastLy=null;
const PHASE_LABELS = CONFIG.theme.phaseLabels;
function updateScene(){
  const ph = dayPhase();

  if(ph!==_lastPhase){
    const c = SKY[ph]||SKY.day;
    sceneEl.style.background = `linear-gradient(${c[0]} 0%, ${c[1]} 38%, ${c[2]} 70%, ${c[3]} 100%)`;
    if(ambientEl) ambientEl.style.background = AMBIENT[ph];
    celestialEl.textContent = ph==='night'?CONFIG.theme.celestialNight:CONFIG.theme.celestialDay;
    const sa = CONFIG.theme.starsAlways;   // moon: ดาวเห็นตลอด (อวกาศ) · farm: เฉพาะเย็น/กลางคืน
    starsEl.style.opacity = sa?1:(ph==='night'?1:(ph==='evening'?0.35:0));
    starsEl.classList.toggle('off', !sa && ph!=='night' && ph!=='evening');
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

  // ขนาดดวง (อาทิตย์/จันทร์/โลก) — ตั้งต่อธีม (ไม่กำหนด = ใช้ค่า CSS เดิม 62px)
  if(CONFIG.theme.celestialSize) celestialEl.style.fontSize = CONFIG.theme.celestialSize + 'px';

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

  const trees = CONFIG.theme.hillProps;   // ของประดับบนเนิน (farm: ต้นไม้ · moon: ก้อนหิน/หลุม)
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
      cl.className='cloud'; cl.textContent=CONFIG.theme.cloud ?? '☁️';  // '' = ไม่ใช้อิโมจิ (ใช้พื้นหลัง CSS แทน)
      cl.style.top=(5+Math.random()*30)+'%';
      cl.style.animationDuration=(90+Math.random()*90)+'s';
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
  if(document.hidden) return;              // ไม่เกิดตอนแท็บถูกบัง (โหมดเบา)
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
  if(document.hidden) return;              // ไม่เกิดตอนแท็บถูกบัง (โหมดเบา)
  if(Math.random()>CONFIG.catChance) return;
  const cat=$('#cat');
  cat.style.display='block';
  cat.style.transition='none'; cat.style.left='-60px';
  requestAnimationFrame(()=>{
    cat.style.transition='left 6s linear';
    cat.style.left='105%';
  });
  cat.onclick=()=>{
    S.fert+=CONFIG.catFertReward; updateHUD(); floatText(cat,FERT_ICON+'+'+CONFIG.catFertReward,'#caa');
    toast(CAT_LABEL+'ให้'+FERT_NAME+' +'+CONFIG.catFertReward+'!'); cat.style.display='none'; cat.onclick=null;
  };
  setTimeout(()=>{ cat.style.display='none'; cat.onclick=null; }, 6200);
}

// ---------- 🐛 ศัตรูพืช ----------
let pestEl = null, pestRef = null, pestTimer = null, pestIdx = -1;
function clearPest(){
  if(pestTimer){ clearTimeout(pestTimer); pestTimer = null; }
  if(pestEl && pestEl.parentNode) pestEl.parentNode.removeChild(pestEl);
  pestEl = null; pestRef = null; pestIdx = -1;
}
function maybePest(){
  if(document.hidden || pestEl) return;              // ทีละตัว และไม่เกิดตอนแท็บถูกบัง
  if(Math.random() > CONFIG.pest.chance) return;
  const cands = [];                                  // เฉพาะแปลงที่กำลังโต (ยังไม่สุก)
  for(let i=0;i<S.plotCount;i++){ const p=S.plots[i]; if(p && !isReady(p)) cands.push(i); }
  if(!cands.length) return;
  const i = cands[Math.floor(Math.random()*cands.length)];
  const plot = fieldEl.children[i]; if(!plot) return;
  pestIdx = i; pestRef = S.plots[i];
  pestEl = document.createElement('div');
  pestEl.className = 'pest';
  const pp = CONFIG.theme.pests || ['🐛','🐌'];
  pestEl.textContent = pp[Math.floor(Math.random()*pp.length)];
  pestEl.onclick = e => { e.stopPropagation(); resolvePest(true); };
  plot.appendChild(pestEl);
  pestTimer = setTimeout(()=>resolvePest(false), CONFIG.pest.lifetime);
}
function resolvePest(saved){
  const i = pestIdx, ref = pestRef;
  const stillThere = i>=0 && ref && S.plots[i]===ref;   // ต้นเดิมยังอยู่ไหม (อาจถูกเก็บไปแล้ว)
  if(saved){
    if(stillThere){
      const r = Math.floor(sellValue(crop(ref.crop), false, false) * CONFIG.pest.reward);
      if(r>0 && pestEl){ S.coins+=r; S.totalEarned+=r; floatText(pestEl,'🪙+'+fmt(r),'#7ed957'); updateHUD(); }
      toast('🐛 ไล่ศัตรูพืชสำเร็จ! ผักปลอดภัย');
    }
  }else if(stillThere){
    if(CONFIG.pest.destroys){
      S.plots[i]=null; renderPlot(i); if(S.auto) plant(i);
      toast('🐛 ศัตรูพืชกินผักไป 1 ต้น!');
    }else{
      ref.plantedAt = Date.now(); ref.golden = false; ref.mutant = false; renderPlot(i);
      toast('🐛 ศัตรูพืชกัดผัก — ต้องเริ่มโตใหม่!');
    }
  }
  clearPest();
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
  $('#prestigeLv').textContent=fmt(S.prestigeLv);
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

// ---------- 🌱 โปรยปุ๋ย (Active Boost) ----------
function activateBoost(){
  if(fertBoostActive()){ toast('🌱 กำลังเร่งโตอยู่แล้ว!'); return; }
  const cost = CONFIG.fertBoost.cost;
  if(S.fert < cost){ toast(FERT_ICON+' '+FERT_NAME+'ไม่พอ — ต้องมี '+cost); return; }
  S.fert -= cost;
  const dur = fertBoostDuration();
  S.boostEnds = Date.now() + dur*1000;
  toast(`🌱 ${BOOST_NAME}! เร่งโต x${CONFIG.fertBoost.growMult} นาน ${dur} วิ`);
  updateHUD(); updateBoostBtn(); save();
}
let _boostLbl = null, _boostGlow = null;
function updateBoostBtn(){
  const b = $('#boostBtn'); if(!b) return;
  const on = fertBoostActive();
  const lbl = on ? '🌱 เร่งโต '+fertBoostLeft()+'s'
                 : '🌱 '+BOOST_NAME+' ('+CONFIG.fertBoost.cost+FERT_ICON+')';
  if(lbl !== _boostLbl){ b.textContent = lbl; _boostLbl = lbl; }
  if(on !== _boostGlow){
    b.classList.toggle('boosting', on);
    const g = $('#fertGlow'); if(g) g.classList.toggle('on', on);
    _boostGlow = on;
  }
}

// ---------- 🏪 ร้านปุ๋ย ----------
function fertShopEffText(u){
  const lv = fertUpLvl(u.id), e = u.eff(lv);
  if(u.id==='richSoil')    return `ผลผลิต x${e.toFixed(2)}`;
  if(u.id==='compostKing') return `โอกาส${FERT_NAME} +${Math.round(e*100)}%`;
  if(u.id==='fertGold')    return `ทองคำ +${Math.round(e*100)}%`;
  if(u.id==='longBoost')   return `${BOOST_NAME}นานขึ้น +${e} วิ`;
  return '';
}
function renderFertShop(){
  const list = $('#fertShopList'); list.innerHTML='';
  const head = document.createElement('div');
  head.className='row'; head.style.background='rgba(126,217,87,.08)';
  head.innerHTML = `<div class="l"><b>${FERT_ICON} ${FERT_NAME}ที่มี</b><small>ได้${FERT_NAME}จากการเก็บเกี่ยว & ${CAT_LABEL}</small></div>
    <div style="color:var(--green);font-weight:700;font-size:17px;">${fmt(S.fert)}</div>`;
  list.appendChild(head);
  FERTSHOP.forEach(u=>{
    const lv = fertUpLvl(u.id), maxed = u.max && lv>=u.max, cost = fertUpCost(u);
    const r = document.createElement('div'); r.className='row';
    r.innerHTML = `<div class="l"><b>${u.nm}</b> <span class="lvl">Lv.${lv}${u.max?'/'+u.max:''}</span>
      <small>${u.desc} — ตอนนี้ ${fertShopEffText(u)}</small></div>
      <button class="btn">${maxed?'สูงสุด':FERT_ICON+fmt(cost)}</button>`;
    const btn = r.querySelector('button');
    if(maxed){ btn.disabled = true; }
    else btn.onclick = ()=>{
      if(S.fert < cost){ toast(FERT_ICON+' '+FERT_NAME+'ไม่พอ'); return; }
      S.fert -= cost; S.fertUp[u.id] = lv+1; updateHUD(); renderFertShop(); save();
    };
    list.appendChild(r);
  });
}

// ---------- 🏯 ของตกแต่ง ----------
function decorEffText(d){
  if(typeof d.action === 'function') return 'คลิกยานบนฟาร์มเพื่อเดินทาง';   // ของที่คลิกได้ (มี action) — ไม่ผูกกับ type
  const e = decorLvl(d.id) * d.per;
  if(d.type==='sell')   return `ขาย +${Math.round(e*100)}%`;
  if(d.type==='grow')   return `โต +${Math.round(e*100)}%`;
  if(d.type==='fert')   return `${FERT_NAME} +${Math.round(e*100)}%`;
  if(d.type==='golden') return `ทองคำ +${(e*100).toFixed(1)}%`;
  if(d.type==='mutant') return `กลายพันธุ์ +${(e*100).toFixed(2)}%`;
  return '';
}
// แสดงของตกแต่งที่ครอบครองไว้บนฉาก (โผล่ที่ระดับพื้นดิน กระจายซ้าย-ขวา ไม่ทับแปลง)
function renderDecorScene(){
  let layer = $('#decorLayer');
  if(!layer) return;
  layer.innerHTML = '';
  const gh = S.groundH || CONFIG.defaultGroundH;
  DECOR.forEach(d=>{
    if(decorLvl(d.id) < 1) return;
    const el = document.createElement('div');
    el.className = 'decor-item';
    el.textContent = d.em;
    el.style.fontSize = (d.size || 40) + 'px';   // ขนาดแยกทีละชิ้น (ไม่ใส่ใน CONFIG = 40)
    el.style.left = d.pos + '%';
    el.style.bottom = gh + '%';   // ตั้งนิ่งที่ขอบบนพื้นดิน — แถบหญ้าบังโคนให้เหมือนปักในหญ้า
    if(typeof d.action === 'function'){   // 🚀 ของตกแต่งที่คลิกได้ — มี action เท่านั้นถึงเปิดรับคลิก (ไม่มี = ไม่ทำอะไร)
      el.classList.add('travel');
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.title = 'คลิกเพื่อเดินทาง 🚀';
      el.onclick = ()=>{ save(); d.action(); };   // เซฟก่อนเสมอ แล้วเรียกฟังก์ชัน
    }
    layer.appendChild(el);
  });
}
function renderDecorShop(){
  const list = $('#decorList'); list.innerHTML='';
  const head = document.createElement('div');
  head.className='row'; head.style.background='rgba(179,136,255,.10)';
  head.innerHTML = `<div class="l"><b>✨ Spirit</b><small>สกุลเงินสำหรับแลกของ · ได้จากรีเบิร์ธ · ⭐ บารมีไม่ลดเมื่อใช้</small></div>
    <div style="color:#b388ff;font-weight:700;font-size:17px;">✨ ${fmt(S.spirit)}</div>`;
  list.appendChild(head);
  DECOR.forEach(d=>{
    const lv = decorLvl(d.id), maxed = d.max && lv>=d.max, cost = decorCost(d);
    const owned = lv>0;
    const r = document.createElement('div'); r.className='row';
    r.innerHTML = `<div class="l"><b>${d.em} ${d.nm}</b> <span class="lvl">Lv.${lv}${d.max?'/'+d.max:''}</span>
      <small>${d.desc} — ตอนนี้ ${decorEffText(d)}${owned?'':' · ยังไม่ได้วาง'}</small></div>
      <button class="btn">${maxed?'สูงสุด':'✨'+fmt(cost)}</button>`;
    const btn = r.querySelector('button');
    if(maxed){ btn.disabled = true; }
    else btn.onclick = ()=>{
      if(S.spirit < cost){ toast('✨ Spirit ไม่พอ — ต้องมี '+fmt(cost)); return; }
      S.spirit -= cost;
      S.decor[d.id] = lv+1;
      if(typeof d.action === 'function') toast(`${d.em} ซื้อ${d.nm}แล้ว! คลิกยานบนฟาร์มเพื่อเดินทาง`);
      else if(lv===0) toast('🏯 วาง '+d.nm+' ลงฟาร์มแล้ว!');
      updateHUD(); renderDecorShop(); renderDecorScene(); save();
    };
    list.appendChild(r);
  });
}

// ---------- shop ----------
function renderShop(){
  const list=$('#shopList'); list.innerHTML='';
  UPGRADES.forEach(u=>{
    const lv=upLvl(u.id), cost=upCost(u);
    const r=document.createElement('div'); r.className='row';
    let effTxt;
    if(u.id==='fert') effTxt=`โอกาส${FERT_NAME} ${Math.round(u.eff(lv)*100)}%`;
    else if(u.id==='gold') effTxt=`ทองคำ ${Math.round(goldenChance()*100)}%`;
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
  const lvAfter=S.prestigeLv+g;
  $('#prestigeInfo').innerHTML=`
    <div class="row"><div class="l"><b>เหรียญสะสมทั้งหมด</b></div><div>🪙 ${fmt(S.totalEarned)}</div></div>
    <div class="row"><div class="l"><b>รอบนี้จะได้</b><small>เพิ่มทั้งระดับบารมี & สปิริต อย่างละ +${fmt(g)}</small></div>
      <div style="text-align:right"><div style="color:#ffd34d">⭐ Lv +${fmt(g)}</div><div style="color:#b388ff">✨ +${fmt(g)}</div></div></div>
    <div class="row"><div class="l"><b>⭐ บารมีหลังรีเบิร์ธ</b><small>โบนัสผลผลิต +${Math.round(CONFIG.spiritBonusPer*100)}%/Lv · โตไว +${Math.round(CONFIG.spiritGrowPer*100)}%/Lv · Mastery ติดตัว</small></div>
      <div style="color:#ffd34d">⭐ Lv ${fmt(lvAfter)} (+${Math.round(lvAfter*CONFIG.spiritBonusPer*100)}%)</div></div>
    <div class="row"><div class="l"><b>✨ Spirit หลังรีเบิร์ธ</b><small>สกุลเงินไว้แลกของตกแต่ง</small></div>
      <div style="color:#b388ff">✨ ${fmt(S.spirit+g)}</div></div>`;
  $('#doPrestige').disabled = g<1;
  $('#doPrestige').textContent = g<1 ? `ต้องสะสมถึง 🪙${fmt(CONFIG.prestigeDivisor)} ก่อน (มี ${fmt(S.totalEarned)})` : `รีเบิร์ธ → ⭐ Lv +${fmt(g)} · ✨ +${fmt(g)}`;
}
function doPrestige(){
  const g=spiritGain(); if(g<1) return;
  const keepLv=S.prestigeLv+g, keepSpirit=S.spirit+g, keepMastery=S.mastery;
  const keepDecor=S.decor||{};
  S=freshState();
  S.prestigeLv=keepLv;          // ⭐ บารมี (โบนัส) — สะสมขึ้นอย่างเดียว
  S.spirit=keepSpirit;          // ✨ สปิริต (กระเป๋า) — ไว้แลกของ
  S.mastery=keepMastery; S.decor=keepDecor;   // ของตกแต่ง (รวมยาน 🚀) & ความเชี่ยวชาญ เป็นของถาวร
  ensureQuest(); layoutField(); buildSeedbar(); renderDecorScene(); updateHUD();
  $('#prestigeModal').classList.remove('show');
  toast(`🔄 รีเบิร์ธสำเร็จ! ⭐ Lv ${fmt(keepLv)} · ✨ ${fmt(keepSpirit)}`);
  save();
}

// =================================================================
//  bind UI
// =================================================================
function bindUI(){
  $('#boostBtn').onclick=activateBoost;
  $('#fertShopBtn').onclick=()=>{ renderFertShop(); openModal('fertShopModal'); };
  $('#shopBtn').onclick=()=>{ renderShop(); openModal('shopModal'); };
  $('#masteryBtn').onclick=()=>{ renderMastery(); openModal('masteryModal'); };
  $('#decorBtn').onclick=()=>{ renderDecorShop(); openModal('decorModal'); };
  $('#questBtn').onclick=()=>{ renderQuests(); openModal('questModal'); };
  $('#prestigeBtn').onclick=()=>{ renderPrestige(); openModal('prestigeModal'); };
  $('#settingBtn').onclick=()=>{ refreshSettingUI(); openModal('settingModal'); };
  $('#doPrestige').onclick=doPrestige;
  bindTravel();

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
  $('#reloadBtn').onclick=()=>{
    save();                 // เซฟก่อน แล้วค่อยโหลดใหม่ (เซฟไม่หาย เพราะ origin เดิม)
    location.reload();      // reload จะ revalidate script.js → ได้โค้ดเวอร์ชันล่าสุดที่ deploy ไว้
  };
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
  $('#hideFieldBtn').onclick=()=>{ setFieldHidden(!S.fieldHidden); save(); };
  setFieldHidden(S.fieldHidden);   // สะท้อนสถานะที่เซฟไว้ตอนเริ่มเกม (ยังไม่ save — กัน lastSave ทับ)

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
    if(e.key==='b'||e.key==='B'){ activateBoost(); }
  });
  updateHUD();
  updateBoostBtn();
}
// ---- 🚀 ปุ่มในเมนู (ผูกตาม CONFIG.menu_button) — คลิกแล้วเรียกฟังก์ชันที่กำหนดใน config
//      ฝั่งฟาร์มไม่มีปุ่มนี้แล้ว (เดินทางโดยคลิกไอคอนยาน 🚀 บนฉาก — ดู renderDecorScene) ----
function bindTravel(){
  const btn = $('#travelBtn'); const t = CONFIG.menu_button;
  if(!btn || !t) return;                 // ไม่มีปุ่ม/ไม่มี config → ข้าม
  btn.textContent = t.label;
  btn.onclick = ()=>{
    save();                                         // เซฟก่อนเสมอ
    if(typeof t.action === 'function') t.action();  // มีฟังก์ชันใน config → เรียกฟังก์ชัน
  };
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
