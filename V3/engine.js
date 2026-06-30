/* ===================================================================
   🏭 V3 ENGINE — เครื่องยนต์เกมห่วงโซ่ทรัพยากร
   -------------------------------------------------------------------
   ★ ต้องโหลด V3/v3.config.js ก่อนไฟล์นี้ (นิยาม const CONFIG)
   ★ หัวใจ: produceStep(dt) — ไหลทรัพยากรตามห่วงโซ่ + throttle เมื่อวัตถุดิบขาด
   =================================================================== */
'use strict';

// ----- ทางลัด -----
const RES        = CONFIG.resources;
const BUILDINGS  = CONFIG.buildings;
const UPGRADES   = CONFIG.upgrades;
const WEATHERS   = CONFIG.weathers;
const DAY_LEN    = CONFIG.dayLength;
const $ = s => document.querySelector(s);

// ---------- สถานะเกม ----------
let S = null;
function freshState(){
  const res = {};
  RES.forEach(r => res[r.id] = 0);
  res.coins = CONFIG.startCoins;
  return {
    res,                       // ทรัพยากรทั้งหมด (รวม coins)
    totalEarned: 0,            // เงินที่หาได้รอบนี้ (รีเซ็ตตอน prestige)
    rep: 0,                    // 🏆 ชื่อเสียงสะสม (ถาวร คูณผลผลิต)
    buildings: {},             // id -> level
    upgrades: {},              // id -> level
    fieldHidden: false,
    lastSave: Date.now(),
  };
}

// ---------- localStorage ----------
const KEY = CONFIG.saveKey;
function save(){ S.lastSave = Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return false;
    const d = JSON.parse(raw);
    S = Object.assign(freshState(), d);
    S.res = Object.assign({}, freshState().res, d.res || {});  // กันทรัพยากรใหม่ที่เพิ่มภายหลัง
    S.buildings = d.buildings || {};
    S.upgrades  = d.upgrades  || {};
    return true;
  }catch(e){ return false; }
}

// ---------- ตัวช่วย ----------
const resDef  = id => RES.find(r => r.id === id);
const bLvl    = id => S.buildings[id] || 0;
const bDef    = id => BUILDINGS.find(b => b.id === id);
const bCost   = b  => Math.floor(b.base * Math.pow(b.mult, bLvl(b.id)));
const upLvl   = id => S.upgrades[id] || 0;
const upDef   = id => UPGRADES.find(u => u.id === id);
const upCost  = u  => Math.floor(u.base * Math.pow(u.mult, upLvl(u.id)));
const upEff   = id => { const u = upDef(id); return u ? u.eff(upLvl(id)) : 1; };

// เพดานคลังของทรัพยากร (coins = ไม่จำกัด)
function storageCap(){ return CONFIG.storageBase * upEff('storage'); }

// 🏆 prestige — โบนัสจากชื่อเสียงสะสม (คูณผลผลิตทั้งระบบ) · ชื่อเสียงที่จะได้ถ้ารีเซ็ตตอนนี้
const prestigeMult = () => 1 + (S.rep || 0) * CONFIG.prestige.bonusPer;
const prestigeGain = () => Math.floor(Math.sqrt((S.totalEarned || 0) / CONFIG.prestige.divisor));

// ฟอร์แมตเลขย่อ 1.2K / 3.4M …
function fmt(n){
  n = Math.floor(n);
  if(n < 1000) return '' + n;
  const u = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
  let i = 0, x = n;
  while(x >= 1000 && i < u.length-1){ x /= 1000; i++; }
  return (x<10 ? x.toFixed(2) : x<100 ? x.toFixed(1) : Math.floor(x)) + u[i];
}
// อัตราต่อวินาที (โชว์ทศนิยมเมื่อ < 100)
function fmtRate(n){
  const a = Math.abs(n);
  const s = a < 10 ? n.toFixed(1) : a < 1000 ? Math.round(n) : fmt(n);
  return (n >= 0 ? '+' : '') + s + '/วิ';
}

// ---------- เวลากลางวัน/กลางคืน + อากาศ ----------
let gameClock = 0, weather = 'sun';
function dayPhase(){
  const t = gameClock / DAY_LEN;
  if(t < 0.25) return 'morning';
  if(t < 0.55) return 'day';
  if(t < 0.72) return 'evening';
  return 'night';
}
// ตัวคูณการผลิตจากอากาศ ของทรัพยากร r (default 1)
function weatherMult(r){
  const m = WEATHERS[weather].mult;
  return (m && m[r] != null) ? m[r] : 1;
}

// =================================================================
//  หัวใจ: produceStep — ไหลทรัพยากรตามห่วงโซ่ 1 ก้าวเวลา (dt วินาที)
//  คืนค่า rates {resId: net/วิ} ไว้โชว์บน HUD
// =================================================================
function produceStep(dt){
  const autoM  = upEff('automation') * prestigeMult();   // คูณกำลังผลิตทุกโรงงาน (รวมโบนัสชื่อเสียง)
  const effM   = upEff('efficiency');    // คูณการบริโภค (<1 = ประหยัด)
  const tradeM = upEff('trade');         // คูณเงินที่ตลาดทำได้
  const cap    = storageCap();
  const rates  = {};                     // net ต่อวินาที (สำหรับ HUD)

  BUILDINGS.forEach(b => {
    const lvl = bLvl(b.id);
    b._ratio = 0;
    if(lvl <= 0) return;

    // 1) ดูว่าวัตถุดิบพอเดินกี่ % (คอขวด)
    let ratio = 1;
    for(const r in b.consume){
      const need = b.consume[r] * lvl * effM * dt;
      if(need > 0) ratio = Math.min(ratio, (S.res[r] || 0) / need);
    }
    ratio = Math.max(0, Math.min(1, ratio));
    b._ratio = ratio;
    if(ratio <= 0) return;

    // 2) หักวัตถุดิบ
    for(const r in b.consume){
      const used = b.consume[r] * lvl * effM * dt * ratio;
      S.res[r] = Math.max(0, (S.res[r] || 0) - used);
      rates[r] = (rates[r] || 0) - used / dt;
    }
    // 3) เพิ่มผลผลิต (ติดเพดานคลัง ยกเว้นเงิน)
    for(const r in b.produce){
      let amt = b.produce[r] * lvl * dt * ratio * autoM;
      amt *= (r === 'coins') ? tradeM : weatherMult(r);
      if(r === 'coins'){
        S.res.coins += amt;
        S.totalEarned += amt;
      } else {
        S.res[r] = Math.min(cap, (S.res[r] || 0) + amt);
      }
      rates[r] = (rates[r] || 0) + amt / dt;
    }
  });
  return rates;
}

// =================================================================
//  TICK หลัก
// =================================================================
let lastRates = {};
function tick(dt){
  gameClock = (gameClock + dt) % DAY_LEN;
  weatherTick(dt);
  lastRates = produceStep(dt);
  updateScene();
  updateHUD();
  renderBuildScene();
}

// ---------- อากาศ ----------
let wTimer = CONFIG.weatherFirstMin + Math.random()*CONFIG.weatherFirstRange;
function weatherTick(dt){
  wTimer -= dt;
  if(wTimer <= 0){
    const pool = CONFIG.weatherPool;
    weather = pool[Math.floor(Math.random()*pool.length)];
    const [a,b] = WEATHERS[weather].next; wTimer = a + Math.random()*(b-a);
    renderWeather();
    const w = WEATHERS[weather];
    $('#weatherStat').textContent = w.em + ' ' + w.nm;
    toast(`${w.em} ${w.nm} — ${w.desc}`);
  }
}

// =================================================================
//  OFFLINE PROGRESS — เดินห่วงโซ่ซ้ำหลายก้าวด้วย produceStep
// =================================================================
function computeOffline(){
  const away = (Date.now() - (S.lastSave || Date.now())) / 1000;
  if(away < CONFIG.offlineMinSeconds) return;

  const cap = CONFIG.offlineCapHours * 3600;
  const total = Math.min(away, cap);
  const coinBefore = S.res.coins;

  // เดินทีละ 1 วินาที (สูงสุด 8 ชม. = 28800 ก้าว — คณิตเบา ๆ)
  const steps = Math.floor(total);
  for(let i = 0; i < steps; i++) produceStep(1);

  const earned = S.res.coins - coinBefore;
  const m = Math.floor(away/60), h = Math.floor(m/60);
  const tstr = h > 0 ? `${h} ชม. ${m%60} นาที` : `${m} นาที`;
  $('#welcomeBody').innerHTML =
    `คุณหายไป <b>${tstr}</b><br>โรงงานเดินเครื่องต่อเนื่อง<br>
     ได้เงิน <b style="color:#ffd34d">🪙 +${fmt(earned)}</b>`;
  $('#welcomeModal').classList.add('show');
}

// =================================================================
//  ซื้อ/อัปเกรด
// =================================================================
function buyBuilding(id){
  const b = bDef(id); if(!b) return;
  if(bLvl(id) >= b.max){ toast('⛔ เต็มเลเวลแล้ว'); return; }
  const cost = bCost(b);
  if(S.res.coins < cost){ toast('🪙 เงินไม่พอ'); return; }
  S.res.coins -= cost;
  S.buildings[id] = bLvl(id) + 1;
  renderBuildings(); renderBuildScene(); updateHUD(); save();
}
function buyUpgrade(id){
  const u = upDef(id); if(!u) return;
  const cost = upCost(u);
  if(S.res.coins < cost){ toast('🪙 เงินไม่พอ'); return; }
  S.res.coins -= cost;
  S.upgrades[id] = upLvl(id) + 1;
  renderUpgrades(); updateHUD(); save();
}
function renderPrestige(){
  const P = CONFIG.prestige;
  const gain = prestigeGain();
  const curBonus = Math.round((S.rep||0) * P.bonusPer * 100);
  const newBonus = Math.round((S.rep + gain) * P.bonusPer * 100);
  $('#prestigeInfo').innerHTML = `
    <div class="row"><div class="l"><b>${P.em} ${P.name}ปัจจุบัน</b>
      <small>โบนัสผลผลิตทั้งระบบ +${curBonus}%</small></div>
      <span class="lvl">${fmt(S.rep||0)}</span></div>
    <div class="row"><div class="l"><b>รีเซ็ตตอนนี้จะได้</b>
      <small>โบนัสใหม่รวม +${newBonus}% (จากเงินรอบนี้ ${fmt(S.totalEarned||0)})</small></div>
      <span class="lvl" style="color:#ffd34d">+${fmt(gain)}</span></div>`;
  const btn = $('#doPrestige');
  btn.disabled = gain <= 0;
  btn.textContent = gain > 0 ? `รีเซ็ตเลย → +${fmt(gain)} ${P.em}` : 'ยังได้ชื่อเสียงไม่พอ';
}
function doPrestige(){
  const gain = prestigeGain();
  if(gain <= 0){ toast('ยังได้ชื่อเสียงไม่พอ — หาเงินเพิ่มก่อน'); return; }
  if(!confirm(`รีเซ็ตโรงงาน/อัปเกรด/ทรัพยากรทั้งหมด แลก +${fmt(gain)} ${CONFIG.prestige.em} ${CONFIG.prestige.name}?`)) return;
  const keepRep = (S.rep || 0) + gain;
  S = freshState();
  S.rep = keepRep;
  _buildSceneSig = '';
  closeModal('prestigeModal');
  renderBuildings(); renderUpgrades(); renderBuildScene(); updateHUD(); save();
  toast(`${CONFIG.prestige.em} รีเซ็ตสำเร็จ! ชื่อเสียงรวม ${fmt(keepRep)} (+${Math.round(keepRep*CONFIG.prestige.bonusPer*100)}% ผลผลิต)`);
}

// =================================================================
//  HUD — แถบทรัพยากร + อัตราต่อวินาที
// =================================================================
function updateHUD(){
  const bar = $('#resbar');
  let h = '';
  const cap = storageCap();
  RES.forEach(r => {
    const v = S.res[r.id] || 0;
    const rate = lastRates[r.id] || 0;
    const rc = rate > 0.05 ? 'up' : rate < -0.05 ? 'down' : 'flat';
    const capStr = (r.id !== 'coins') ? `<small class="cap">/${fmt(cap)}</small>` : '';
    h += `<div class="res" title="${r.nm}">
            <span class="re">${r.em}</span>
            <b style="color:${r.color}">${fmt(v)}</b>${capStr}
            <span class="rate ${rc}">${rate===0?'':fmtRate(rate)}</span>
          </div>`;
  });
  // 🏆 ชื่อเสียง (prestige) — โชว์เมื่อมีแล้ว
  if((S.rep||0) > 0){
    const P = CONFIG.prestige;
    h += `<div class="res rep" title="โบนัสผลผลิตถาวรจากการรีเซ็ต">
            <span class="re">${P.em}</span><b>${fmt(S.rep)}</b>
            <small class="cap">+${Math.round(S.rep*P.bonusPer*100)}%</small>
          </div>`;
  }
  bar.innerHTML = h;
}

// =================================================================
//  พาเนลโรงงาน
// =================================================================
function rowChain(map, sign){
  return Object.keys(map).map(r => {
    const d = resDef(r);
    return `<span class="chip ${sign}">${sign==='in'?'−':'+'}${map[r]} ${d?d.em:r}</span>`;
  }).join(' ');
}
function renderBuildings(){
  let h = '';
  BUILDINGS.forEach(b => {
    const lvl = bLvl(b.id), cost = bCost(b), maxed = lvl >= b.max;
    const afford = S.res.coins >= cost;
    const inSpec  = Object.keys(b.consume).length ? rowChain(b.consume, 'in') : '<span class="chip free">ไม่ใช้วัตถุดิบ</span>';
    const outSpec = rowChain(b.produce, 'out');
    const runPct  = Math.round((b._ratio || 0) * 100);
    const runBar  = lvl > 0
      ? `<div class="barmini" title="กำลังเดินเครื่อง ${runPct}%"><i style="width:${runPct}%;background:${runPct>=99?'#7ed957':runPct>0?'#ffd34d':'#ff7a7a'}"></i></div>`
      : '';
    h += `<div class="row">
      <div class="l">
        <b>${b.em} ${b.nm} <span class="lvl">Lv ${lvl}</span></b>
        <small>${b.desc}</small>
        <div class="spec">${inSpec} <span class="arrow">→</span> ${outSpec} <small class="per">ต่อวิ/lv</small></div>
        ${runBar}
      </div>
      <button class="btn buy" data-build="${b.id}" ${(!afford||maxed)?'disabled':''}>
        ${maxed ? 'สูงสุด' : `🪙 ${fmt(cost)}`}
      </button>
    </div>`;
  });
  $('#buildList').innerHTML = h;
}

// =================================================================
//  พาเนลอัปเกรด
// =================================================================
function renderUpgrades(){
  let h = '';
  UPGRADES.forEach(u => {
    const lvl = upLvl(u.id), cost = upCost(u), afford = S.res.coins >= cost;
    h += `<div class="row">
      <div class="l">
        <b>${u.nm} <span class="lvl">Lv ${lvl}</span></b>
        <small>${u.desc}</small>
      </div>
      <button class="btn buy" data-up="${u.id}" ${afford?'':'disabled'}>🪙 ${fmt(cost)}</button>
    </div>`;
  });
  $('#upList').innerHTML = h;
}

// =================================================================
//  SCENE: ฟ้า/ดวง/ดาว/อากาศ (พอร์ตจาก engine ฟาร์ม — โหมดเบา)
// =================================================================
let sceneEl, celestialEl, starsEl, glowEl, ambientEl, weatherEl, timeEl, buildLayerEl;
const SKY = CONFIG.theme.sky, AMBIENT = CONFIG.theme.ambient, GLOW = CONFIG.theme.glow;
const PHASE_LABELS = CONFIG.theme.phaseLabels;
let _lastPhase = null, _lastLx = null, _lastLy = null;

function updateScene(){
  const ph = dayPhase();
  if(ph !== _lastPhase){
    const c = SKY[ph] || SKY.day;
    sceneEl.style.background = `linear-gradient(${c[0]} 0%, ${c[1]} 38%, ${c[2]} 70%, ${c[3]} 100%)`;
    if(ambientEl) ambientEl.style.background = AMBIENT[ph];
    celestialEl.textContent = ph === 'night' ? CONFIG.theme.celestialNight : CONFIG.theme.celestialDay;
    const sa = CONFIG.theme.starsAlways;
    starsEl.style.opacity = sa ? 1 : (ph==='night' ? 1 : (ph==='evening' ? 0.35 : 0));
    starsEl.classList.toggle('off', !sa && ph!=='night' && ph!=='evening');
    timeEl.textContent = PHASE_LABELS[ph];
    if(buildLayerEl) buildLayerEl.classList.toggle('night', ph === 'night' || ph === 'evening');  // 🌃 ไฟโรงงานติดตอนค่ำ/คืน
    if(glowEl){
      const g = GLOW[ph] || GLOW.day;
      glowEl.style.opacity = g[1];
      glowEl.style.background = `radial-gradient(circle, ${g[0]} 0%, ${g[0].replace(/[\d.]+\)$/,'.3)')} 30%, transparent 64%)`;
    }
    _lastPhase = ph;
  }
  const t = gameClock / DAY_LEN;
  const lx = (8 + t*84).toFixed(1);
  const ly = (70 - Math.sin(t*Math.PI)*58).toFixed(1);
  if(lx !== _lastLx || ly !== _lastLy){
    _lastLx = lx; _lastLy = ly;
    celestialEl.style.left = lx + '%'; celestialEl.style.top = ly + '%';
    if(glowEl){ glowEl.style.left = (+lx+1.6)+'%'; glowEl.style.top = (+ly+2)+'%'; }
  }
}

function buildStars(){
  glowEl = $('#sunGlow'); ambientEl = $('#ambient');
  const sc = CONFIG.scene;
  if(!sc.glow && glowEl){ glowEl.style.display='none'; glowEl=null; }
  if(!sc.ambient && ambientEl){ ambientEl.style.display='none'; ambientEl=null; }
  if(!sc.starTwinkle) starsEl.classList.add('static');
  let h='';
  for(let i=0;i<sc.starCount;i++){
    const sz = 1+Math.random()*2;
    h+=`<div class="star" style="left:${Math.random()*100}%;top:${Math.random()*55}%;width:${sz}px;height:${sz}px;animation-delay:${Math.random()*3}s"></div>`;
  }
  starsEl.innerHTML = h;
  const trees = CONFIG.theme.hillProps;
  let th='';
  for(let i=0;i<sc.treeCount;i++){
    const l=3+Math.random()*94, s=40+Math.random()*30;
    th+=`<div class="tree" style="left:${l}%;bottom:12%;font-size:${Math.round(s)}px">${trees[Math.floor(Math.random()*trees.length)]}</div>`;
  }
  $('#hills').insertAdjacentHTML('beforeend', th);
}

function renderWeather(){
  const sc = CONFIG.scene;
  const L = $('#weatherLayer'); L.innerHTML='';
  if(weather==='rain'||weather==='storm'){
    const n = weather==='storm' ? sc.stormRainCount : sc.rainCount;
    let h='';
    for(let i=0;i<n;i++) h+=`<div class="rain" style="left:${Math.random()*100}%;animation-duration:${0.4+Math.random()*0.5}s;animation-delay:${Math.random()*1}s"></div>`;
    L.innerHTML = h;
    if(weather==='storm' && sc.lightning) startLightning();
  }
  if(weather==='cloud'||weather==='storm'){
    const n = weather==='storm' ? sc.stormCloudCount : sc.cloudCount;
    for(let i=0;i<n;i++){
      const cl=document.createElement('div');
      cl.className='cloud'; cl.textContent=CONFIG.theme.cloud ?? '☁️';
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
    f.style.transition='none'; f.style.opacity='0.55';
    setTimeout(()=>{ f.style.transition='opacity .4s'; f.style.opacity='0'; }, 60);
    setTimeout(strike, 4000 + Math.random()*7000);
  };
  setTimeout(strike, 2000 + Math.random()*4000);
}

// =================================================================
//  วาดโรงงานบนฉาก — built = ชัด+badge เลเวล · ยังไม่สร้าง = จาง · คลิก = อัป
// =================================================================
let _buildSceneSig = '';
function renderBuildScene(){
  // สร้าง signature เพื่อวาดใหม่เฉพาะตอนสถานะเปลี่ยน (ประหยัด DOM)
  const sig = BUILDINGS.map(b => bLvl(b.id) + ':' + (Math.round((b._ratio||0)*4))).join('|');
  if(sig === _buildSceneSig) return;
  _buildSceneSig = sig;

  const layer = buildLayerEl || (buildLayerEl = $('#buildLayer'));
  let h = '';
  BUILDINGS.forEach(b => {
    const lvl = bLvl(b.id);
    const running = lvl > 0 && (b._ratio || 0) > 0.01;
    const cls = ['build'];
    if(lvl <= 0) cls.push('off');
    if(running) cls.push('run');
    const badge = lvl > 0 ? `<span class="blvl">${lvl}</span>` : `<span class="bplus">＋</span>`;
    const sz = Math.round(b.size * (1 + Math.min(0.5, lvl * 0.012)));  // 🏭 โตตามเลเวล (+1.2%/lv สูงสุด +50%)
    h += `<div class="${cls.join(' ')}" data-build="${b.id}" style="left:${b.pos}%">
            <span class="be" style="font-size:${sz}px">${b.em}</span>
            ${badge}
          </div>`;
  });
  layer.innerHTML = h;
}

// 💨 ควันจากโรงงานอุตสาหกรรม (ที่ผลิตน้ำมัน/พลังงาน) ตอนเดินเครื่อง
const INDUSTRIAL = BUILDINGS.filter(b => b.produce.oil != null || b.produce.energy != null);
function smokeTick(){
  if(document.hidden || !S) return;
  INDUSTRIAL.forEach(b => {
    if(bLvl(b.id) > 0 && (b._ratio || 0) > 0.01){
      const el = document.createElement('div');
      el.className = 'smoke';
      el.textContent = '💨';
      el.style.left   = (b.pos - 1 + Math.random()*2) + 'vw';
      el.style.bottom = (29 + Math.random()*3) + '%';
      transportLayer.appendChild(el);
      setTimeout(()=> el.remove(), 2600);
    }
  });
}

// =================================================================
//  🚚 รถขนของ — derive เส้นทางจากห่วงโซ่ (โรงผลิต r → โรงที่กิน r)
// =================================================================
let transportLayer, ROUTES = [], _routeIdx = 0;
function buildRoutes(){
  const routes = [];
  BUILDINGS.forEach(src => {
    for(const r in src.produce){
      if(r === 'coins') continue;                 // เงินไม่ขนด้วยรถ (ลอยขึ้นแทน)
      BUILDINGS.forEach(dst => {
        if(dst !== src && dst.consume[r] != null) routes.push({from: src, to: dst, res: r});
      });
    }
  });
  return routes;
}
function spawnTruck(rt){
  const el = document.createElement('div');
  const goLeft = rt.to.pos < rt.from.pos;
  el.className = 'truck' + (goLeft ? '' : ' flip');   // วิ่งขวา → พลิกให้หน้ารถนำ (อิโมจิหันซ้ายโดยกำเนิด)
  const rd = resDef(rt.res);
  el.innerHTML = `<span class="veh">🚚</span><span class="pkg">${rd ? rd.em : ''}</span>`;
  el.style.transform = `translateX(${rt.from.pos}vw)`;
  transportLayer.appendChild(el);
  const dur = 2.2 + Math.abs(rt.to.pos - rt.from.pos) * 0.045;   // วิ ตามระยะทาง
  setTimeout(()=>{ el.style.transition = `transform ${dur}s linear`; el.style.transform = `translateX(${rt.to.pos}vw)`; }, 30);
  setTimeout(()=> el.remove(), dur*1000 + 250);
}
// +/- ทรัพยากรลอยขึ้นจากโรงงาน b
function popRes(b, text, cls){
  const el = document.createElement('div');
  el.className = 'respop ' + cls;
  el.textContent = text;
  el.style.left   = (b.pos - 1.5 + Math.random()*3) + 'vw';
  el.style.bottom = (27 + Math.random()*4) + '%';
  transportLayer.appendChild(el);
  setTimeout(()=> el.remove(), 1450);
}
// สแปวน์ทีละคันเวียนรอบเส้นทางที่ "เดินเครื่องจริง"
function transportTick(){
  if(document.hidden || !S) return;
  const active = ROUTES.filter(rt => bLvl(rt.from.id) > 0 && bLvl(rt.to.id) > 0 && (bDef(rt.from.id)._ratio || 0) > 0.01);
  if(active.length && transportLayer.querySelectorAll('.truck').length < 16){
    const rt = active[_routeIdx % active.length]; _routeIdx++;
    spawnTruck(rt);
  }
}
// เด้ง +/- ทรัพยากรของโรงงานที่กำลังเดินเครื่อง (เวียนทีละโรง กันรก)
let _popIdx = 0;
function resPopTick(){
  if(document.hidden || !S) return;
  const live = BUILDINGS.filter(b => bLvl(b.id) > 0 && (b._ratio || 0) > 0.01);
  if(!live.length) return;
  const b = live[_popIdx % live.length]; _popIdx++;
  for(const r in b.consume){ const rd = resDef(r); popRes(b, '−' + (rd?rd.em:r), 'minus'); }      // ใช้วัตถุดิบ
  for(const r in b.produce){ const rd = resDef(r); popRes(b, '+' + (rd?rd.em:r), r==='coins'?'coin':'plus'); }  // ผลิต
}

// =================================================================
//  Toast
// =================================================================
let toastTimer = 0;
function toast(msg){
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=> el.remove(), 3200);
}

// =================================================================
//  UI bindings
// =================================================================
function bindUI(){
  // เปิด/ปิดเมนู
  const menuBtn = $('#menuBtn'), menuDrop = $('#menuDrop');
  menuBtn.onclick = e => { e.stopPropagation(); menuDrop.classList.toggle('open'); };
  document.addEventListener('click', e => {
    if(!menuDrop.contains(e.target) && e.target!==menuBtn) menuDrop.classList.remove('open');
  });

  // เปิด modal จากปุ่มเมนู
  $('#buildBtn').onclick     = () => { renderBuildings(); openModal('buildModal'); };
  $('#upBtn').onclick        = () => { renderUpgrades();  openModal('upModal'); };
  $('#prestigeBtn').onclick  = () => { renderPrestige();  openModal('prestigeModal'); };
  $('#doPrestige').onclick   = doPrestige;
  $('#settingBtn').onclick   = () => openModal('settingModal');

  // ปิด modal
  document.querySelectorAll('[data-close]').forEach(x => x.onclick = () => closeModal(x.dataset.close));

  // ปุ่มซื้อในพาเนล (event delegation)
  $('#buildList').addEventListener('click', e => {
    const btn = e.target.closest('[data-build]'); if(btn) buyBuilding(btn.dataset.build);
  });
  $('#upList').addEventListener('click', e => {
    const btn = e.target.closest('[data-up]'); if(btn) buyUpgrade(btn.dataset.up);
  });

  // คลิกโรงงานบนฉาก = เปิดพาเนลโรงงาน (เลื่อนไปที่ตัวนั้น)
  $('#buildLayer').addEventListener('click', e => {
    const el = e.target.closest('[data-build]');
    if(el){ renderBuildings(); openModal('buildModal'); }
  });

  // ตั้งค่า: โหลดใหม่ / รีเซ็ต
  $('#reloadBtn').onclick = () => { save(); location.reload(); };
  $('#resetBtn').onclick  = () => {
    if(confirm('ลบเซฟทั้งหมดและเริ่มใหม่?')){ localStorage.removeItem(KEY); location.reload(); }
  };

  $('#welcomeOk').onclick = () => closeModal('welcomeModal');
}
function openModal(id){ $('#'+id).classList.add('show'); $('#menuDrop').classList.remove('open'); }
function closeModal(id){ $('#'+id).classList.remove('show'); }

// =================================================================
//  เริ่มเกม
// =================================================================
function init(){
  sceneEl = $('#scene'); celestialEl = $('#celestial'); starsEl = $('#stars');
  weatherEl = $('#weatherStat'); timeEl = $('#timeStat');
  transportLayer = $('#transportLayer'); buildLayerEl = $('#buildLayer'); ROUTES = buildRoutes();

  if(!load()) S = freshState();

  buildStars();
  bindUI();
  computeOffline();
  renderWeather();
  $('#weatherStat').textContent = WEATHERS[weather].em + ' ' + WEATHERS[weather].nm;
  updateScene();
  updateHUD();
  _buildSceneSig = '';
  renderBuildScene();

  // เดินเกม — setInterval (เบากว่า rAF) · หน้าต่างถูกบัง = หยุด
  let last = performance.now(), gameTimer = null;
  function step(){ const now = performance.now(); const dt = Math.min(0.25, (now-last)/1000); last = now; tick(dt); }
  function startLoop(){ if(!gameTimer){ last = performance.now(); gameTimer = setInterval(step, CONFIG.tickMs); } }
  function stopLoop(){ if(gameTimer){ clearInterval(gameTimer); gameTimer = null; } }
  startLoop();
  document.addEventListener('visibilitychange', ()=> document.hidden ? stopLoop() : startLoop());

  setInterval(save, CONFIG.saveInterval);
  setInterval(transportTick, 900);          // 🚚 สแปวน์รถขนของ ~1 คัน/0.9 วิ เวียนรอบเส้นทาง
  setInterval(resPopTick, 700);             // +/- ทรัพยากรลอยจากโรงงาน เวียนทีละโรง
  setInterval(smokeTick, 850);              // 💨 ควันจากโรงงานอุตสาหกรรม
  window.addEventListener('beforeunload', save);
}

window.addEventListener('DOMContentLoaded', init);
