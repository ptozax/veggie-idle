/* ===================================================================
   🌙 MOON CONFIG — ค่าปรับแต่งทั้งหมดของ map "ดวงจันทร์" (โหลดก่อน engine.js)
   -------------------------------------------------------------------
   ★ ใช้ engine.js ตัวเดียวกับฟาร์ม — ต่างกันแค่ค่าใน CONFIG นี้
   ★ ตัวเลขสมดุล (cost/grow/sell/unlock) เท่าฟาร์ม แต่รีธีมเป็นอวกาศ
   ★ saveKey แยกช่อง → progress ดวงจันทร์ไม่ชนกับฟาร์ม
   =================================================================== */
'use strict';

const CONFIG = {
  saveKey: 'idleMoon_v1',          // เซฟแยกช่องจากฟาร์ม (idleFarm_v1)

  // ----- เริ่มต้น -----
  startCoins: 30,
  startFert: 0,
  startSelected: 'glowcap',
  startAuto: true,

  // ----- แปลงปลูก (โดมไฮโดรโปนิกส์) -----
  plotBase: 6,
  plotMax: 24,
  plotCostBase: 150,
  plotCostMult: 3.2,
  gridCols: [{upTo: 8, cols: 4}, {upTo: 15, cols: 5}, {upTo: Infinity, cols: 6}],

  // ----- เวลา/รอบเกม -----
  dayLength: 720,                  // โลกโคจรข้ามฟ้าช้าลง (ยิ่งมากยิ่งช้า · เดิม 360)
  tickMs: 100,
  saveInterval: 5000,

  // ----- Offline progress -----
  offlineMinSeconds: 30,
  offlineCapHours: 8,

  // ----- ผลไม้ทองคำ -----
  goldenBaseChance: 0.04,
  goldenMult: 5,

  // ----- 🌈 พืชกลายพันธุ์ (รังสีคอสมิก) -----
  mutantBaseChance: 0.004,
  mutantMult: 30,
  mutantBoostAdd: 0.02,

  // ----- Prestige / Spirit -----
  prestigeDivisor: 1e6,
  spiritBonusPer: 0.05,
  spiritGrowPer: 0.02,

  // ----- 🚀 การเดินทาง — กลับโลกไม่ต้องปลดล็อก (lock: null) -----
  menu_button: {
    label: '🌍 เดินทางกลับโลก (ฟาร์ม)',
    action: ()=>{ location.href='index.html'; },                          // ★ ใส่ฟังก์ชันตรงนี้ให้ปุ่มทำงาน (ปุ่มเรียกฟังก์ชันนี้ตอนคลิก)
                                           //   เช่น  action: ()=>{ toast('🚀 พร้อมเดินทาง!'); }
                                           //   หรือถ้าอยากให้เปลี่ยนหน้า: action: ()=>{ location.href='index.html'; }
                                           //   ถ้าเป็น null → คลิกแล้วแค่ save() ไม่ทำอะไรต่อ
    lock: null,
  },

  // ----- Mastery -----
  masteryPerLevel: 50,
  masteryYieldPer: 0.10,
  masteryGrowEvery: 100,
  masteryGrowPer: 0.05,
  masteryGrowMax: 0.50,

  // ----- ตลาด -----
  marketMin: 0.7,
  marketRange: 0.9,
  marketIntervalMin: 60,
  marketIntervalRange: 120,

  // ----- อีเวนต์อวกาศ (แทนสภาพอากาศ) -----
  weatherPool: ['sun', 'sun', 'sun', 'cloud', 'cloud', 'rain', 'rain', 'storm'],
  weatherFirstMin: 30,
  weatherFirstRange: 40,

  // ----- นักบินอวกาศ (คนเก็บเกี่ยว) -----
  gardenerSpeedBase: 32,
  gardenerWorkMs: 450,

  // ----- 🌑 รอบวงโคจร (แทนฤดูกาล) — ปรับความเร็วโต & ราคาขายทั้งฐาน -----
  seasonLength: 300,
  seasons: [
    {id: 'newmoon', em: '🌑', nm: 'จันทร์ดับ',   grow: 1.25, sell: 1.00, tint: 'rgba(80,120,200,.10)',  desc: 'รังสีคอสมิกเร่งโต ราคาปกติ'},
    {id: 'solar',   em: '☀️', nm: 'สุริยุปราคา',  grow: 0.85, sell: 1.30, tint: 'rgba(255,200,90,.10)',  desc: 'แสงแรง ขายแพง แต่โตช้า'},
    {id: 'meteor',  em: '☄️', nm: 'ฝนดาวตก',     grow: 1.45, sell: 0.90, tint: 'rgba(120,90,200,.12)',  desc: 'แร่ธาตุตก โตไวสุด ราคาตก'},
    {id: 'waning',  em: '🌗', nm: 'ข้างแรม',      grow: 1.00, sell: 1.18, tint: 'rgba(90,110,160,.12)',  desc: 'สมดุล ราคาดีนิดหน่อย'},
  ],

  // ----- Easter eggs -----
  shootingStarReward: 100,         // ☄️ อุกกาบาตคลิกได้กี่เหรียญ
  shootingStarChance: 0.5,
  catFertReward: 2,                // 🛸 จานบินทิ้งสารอาหาร
  catChance: 0.4,

  // ----- 👾 สิ่งมีชีวิตต่างดาว (ศัตรูพืช) -----
  pest: {
    checkMs: 26000,
    chance: 0.5,
    lifetime: 8000,
    reward: 0.25,
    destroys: false,
  },

  // ----- สัญญารับซื้อ (เควส) -----
  questNeedMin: 10,
  questNeedStep: 10,
  questNeedSteps: 5,
  questRewardRate: 0.6,
  questRewardFlat: 50,

  // ----- ค่าตั้งต้น wallpaper -----
  defaultFieldPos: 'center',
  defaultFieldScale: 1,
  defaultFieldBottom: 5,
  defaultGroundH: 32,
  defaultSeedPos: 'center',
  defaultSeedScale: 1,
  defaultSeedBottom: 0,

  // ----- ฉาก (โหมดเบา) -----
  scene: {
    starCount: 60,         // ดาวเยอะกว่าฟาร์ม (อวกาศ)
    starTwinkle: false,
    treeCount: 6,          // ก้อนหิน/หลุมบนเนินจันทรา
    rainCount: 16,         // ☄️ เม็ดอุกกาบาตตอนฝนดาวตก
    stormRainCount: 26,
    cloudCount: 2,         // 🌫️ ฝุ่นจักรวาล
    stormCloudCount: 3,
    lightning: true,       // แสงแฟลร์ตอนพายุสุริยะ
    glow: true,
    ambient: true,
  },

  // ----- 🌱 พืชอวกาศ (tier) — cost/grow/sell/unlock เท่าฟาร์ม สมดุลเดิม -----
  crops: [
    {id: 'glowcap', em: '🍄', nm: 'เห็ดเรืองแสง',   cost: 10,     grow: 8,    sell: 18,      unlock: 0},
    {id: 'algae',   em: '🌿', nm: 'สาหร่ายอวกาศ',   cost: 60,     grow: 18,   sell: 95,      unlock: 200},
    {id: 'cactus',  em: '🌵', nm: 'กระบองเพชรดาว',  cost: 300,    grow: 40,   sell: 480,     unlock: 1500},
    {id: 'plasma',  em: '🍇', nm: 'องุ่นพลาสมา',     cost: 1500,   grow: 85,   sell: 2600,    unlock: 9000},
    {id: 'crystal', em: '💎', nm: 'คริสตัลพลังงาน', cost: 8000,   grow: 170,  sell: 14500,   unlock: 55000},
    {id: 'orb',     em: '🔮', nm: 'ลูกแก้วพลาสมา',   cost: 45000,  grow: 340,  sell: 86000,   unlock: 320000},
    {id: 'star',    em: '🌟', nm: 'ดาวเคราะห์น้อย',  cost: 250000, grow: 600,  sell: 520000,  unlock: 1.8e6},
    {id: 'comet',   em: '☄️', nm: 'ดอกดาวหาง',      cost: 1.4e6,  grow: 1100, sell: 3.2e6,   unlock: 1.1e7},
    {id: 'saturn',  em: '🪐', nm: 'ผลเสาร์',         cost: 8e6,    grow: 2200, sell: 2e7,     unlock: 7e7},
  ],

  // ----- อัปเกรด (id ต้องตรงกับ engine: speed/value/garden/fert/gold) -----
  upgrades: [
    {id: 'speed',  nm: '🌐 โดมไฮโดรโปนิกส์', desc: 'พืชโตเร็วขึ้น',            base: 80,   mult: 1.55, eff: l => 1 + l * 0.08},
    {id: 'value',  nm: '🛰️ สถานีการค้า',     desc: 'ขายผลผลิตได้แพงขึ้น',     base: 120,  mult: 1.6,  eff: l => 1 + l * 0.10},
    {id: 'garden', nm: '🤖 หุ่นยนต์เก็บเกี่ยว', desc: 'นักบินทำงานเร็วขึ้น',    base: 200,  mult: 1.7,  eff: l => 1 + l * 0.15},
    {id: 'fert',   nm: '🧪 ถังสารอาหาร',      desc: 'มีโอกาสได้สารอาหารตอนเก็บ', base: 500,  mult: 1.8,  eff: l => l * 0.02},
    {id: 'gold',   nm: '✨ เมล็ดอุกกาบาต',    desc: 'เพิ่มโอกาสผลไม้ทองคำ',     base: 1000, mult: 2.0,  eff: l => l * 0.015},
  ],

  // ----- 🌱 โปรยสารอาหาร (Active Boost) -----
  fertBoost: {
    cost: 8,
    duration: 75,
    growMult: 2.5,
    goldenAdd: 0.20,
  },

  // ----- 🏪 ร้านสารอาหาร (id ต้องตรงกับ engine) -----
  fertShop: [
    {id: 'richSoil',    nm: '🌱 ดินจำลองชั้นเลิศ', desc: 'ผลผลิตทุกพืช +6%/lv ถาวร',         base: 12, mult: 1.55, max: 25, eff: l => 1 + l * 0.06},
    {id: 'compostKing', nm: '🧪 โรงปุ๋ยชีวภาพ',    desc: 'โอกาสได้สารอาหารตอนเก็บ +3%/lv',    base: 15, mult: 1.5,  max: 20, eff: l => l * 0.03},
    {id: 'fertGold',    nm: '☄️ ฝุ่นอุกกาบาต',     desc: 'โอกาสได้ผลไม้ทองคำ +1.2%/lv',       base: 20, mult: 1.6,  max: 20, eff: l => l * 0.012},
    {id: 'longBoost',   nm: '🚀 เครื่องเร่งปฏิกิริยา', desc: 'โปรยสารอาหารออกฤทธิ์นานขึ้น +12 วิ/lv', base: 18, mult: 1.5,  max: 12, eff: l => l * 12},
  ],

  // ----- 🛰️ ของตกแต่งสถานี (type ต้องเป็น sell/grow/golden/fert/mutant) -----
  decorations: [
    {id: 'satellite', em: '🛰️', nm: 'ดาวเทียมสื่อสาร',     desc: 'ขายผลผลิตได้แพงขึ้น',        type: 'sell',   per: 0.05,  base: 1, mult: 1.6, max: 12, pos: 12, size: 50},
    {id: 'icerig',    em: '💧', nm: 'เครื่องสกัดน้ำแข็ง',   desc: 'พืชโตเร็วขึ้น',              type: 'grow',   per: 0.04,  base: 2, mult: 1.6, max: 12, pos: 22, size: 50},
    {id: 'lab',       em: '🧪', nm: 'แล็บสารอาหาร',         desc: 'เพิ่มโอกาสได้สารอาหารตอนเก็บ', type: 'fert',   per: 0.02,  base: 2, mult: 1.6, max: 10, pos: 30, size: 50},
    {id: 'oremine',   em: '💠', nm: 'เหมืองแร่หายาก',       desc: 'เพิ่มโอกาสผลไม้ทองคำ',       type: 'golden', per: 0.012, base: 3, mult: 1.7, max: 10, pos: 72, size: 50},
    {id: 'genelab',   em: '🧬', nm: 'เครื่องตัดต่อพันธุกรรม', desc: 'เพิ่มโอกาสพืชกลายพันธุ์',    type: 'mutant', per: 0.004, base: 5, mult: 1.9, max: 8,  pos: 80, size: 50},
    {id: 'rocket',    em: '🚀', nm: 'อนุสรณ์จรวด',          desc: 'ขายผลผลิตได้แพงขึ้น (มาก)',  type: 'sell',   per: 0.08,  base: 6, mult: 1.8, max: 10, pos: 88, size: 150},
  ],

  // ----- อีเวนต์อวกาศ: key ต้องเป็น sun/cloud/rain/storm (engine วาดเอฟเฟกต์ตาม key นี้) -----
  weathers: {
    sun:   {em: '☀️', nm: 'แสงสุริยะ',    grow: 1.0,  next: [40, 80]},   // ปกติ
    cloud: {em: '🌫️', nm: 'ฝุ่นจักรวาล',  grow: 0.7,  next: [40, 70]},   // ฝุ่นบังแสง โตช้า
    rain:  {em: '☄️', nm: 'ฝนดาวตก',     grow: 1.4,  next: [35, 70]},   // แร่ธาตุตก เร่งโต
    storm: {em: '🌟', nm: 'พายุสุริยะ',   grow: 0.55, next: [30, 55]},   // รังสีแรง โตช้าสุด
  },

  // ----- 🎨 ธีมภาพดวงจันทร์ (engine อ่านจากตรงนี้) -----
  theme: {
    // ท้องฟ้าอวกาศ — มืดตลอด มีไล่เฉดเล็กน้อยตามเวลา (แสงอาทิตย์ตกกระทบ)
    sky: {
      morning:['#0a0e2a','#141a45','#2a2155','#3a2a4a'],
      day:    ['#06091f','#0d1640','#1a2a5a','#243a55'],
      evening:['#0a0620','#1a1040','#3a1a4a','#2a1a35'],
      night:  ['#01020a','#04061a','#0a1230','#0a1525'],
    },
    ambient: {
      morning:'rgba(80,90,160,0.25)',
      day:    'rgba(20,30,80,0.15)',
      evening:'rgba(90,60,140,0.30)',
      night:  'rgba(5,10,40,0.55)',
    },
    // แสงเรืองสีฟ้า (โลก/ดวงอาทิตย์)
    glow: {
      morning:['rgba(120,170,255,.7)',0.7],
      day:    ['rgba(180,210,255,.85)',0.9],
      evening:['rgba(150,140,255,.7)',0.7],
      night:  ['rgba(120,160,255,.6)',0.55],
    },
    phaseLabels: {morning:'🌄 รุ่งสางจันทรา', day:'☀️ กลางวันจันทรา', evening:'🌆 สนธยา', night:'🌌 ราตรีอวกาศ'},
    celestialSize: 110,          // 🌍 โลกใหญ่กว่าปกติ (เดิม CSS 62px)
    celestialDay: '🌍',          // โลกขึ้น-ลงบนฟ้า (ขึ้นโคจรเป็นเส้นโค้งทั้งวัน)
    celestialNight: '🌍',
    starsAlways: true,           // อวกาศ — ดาวเต็มฟ้าตลอดเวลา
    hillProps: ['🪨','⛰️','🌑','🪨'],   // ก้อนหิน/หลุมบนเนินจันทรา
    cloud: '',                   // ฝุ่นจักรวาล — ใช้พื้นหลัง CSS (.cloud) แทนอิโมจิ ไม่ให้ดูเหลี่ยม
    growStages: ['🌑','🌓'],     // [สปอร์, ตูม] ก่อนโตเต็มเป็นอิโมจิพืช
    miniIcon: '🛰️',             // ไอคอนแทนสวนตอน "ซ่อนสวน" (ฐานย่อบนพื้นจันทรา)
    pests: ['👾','🦠','🛸'],     // สิ่งมีชีวิตต่างดาวมากัดพืช
    // ป้ายข้อความที่ engine สร้าง (รีธีมจาก ปุ๋ย→สารอาหาร)
    fertIcon: '🧪',
    fertName: 'สารอาหาร',
    boostName: 'โปรยสารอาหาร',
    catLabel: '🛸 จานบิน',
  },
};
