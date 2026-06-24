/* ===================================================================
   🌱 FARM CONFIG — ค่าปรับแต่งทั้งหมดของ map "ฟาร์ม" (โหลดก่อน engine.js)
   ★ แก้ตัวเลข/ธีมที่นี่ที่เดียว — engine.js อ่านค่าจาก const CONFIG นี้
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

  // ----- 🌈 ผักกลายพันธุ์ (Mutant) — หายากกว่าผักทอง จ่ายหนักกว่า -----
  mutantBaseChance: 0.004,         // โอกาสพื้นฐานได้ผักกลายพันธุ์ (ตอนปลูก)
  mutantMult: 30,                  // ผักกลายพันธุ์ขายได้กี่เท่า (ทับผักทอง)
  mutantBoostAdd: 0.02,            // +โอกาสกลายพันธุ์ระหว่างโปรยปุ๋ย

  // ----- Prestige / Spirit -----
  prestigeDivisor: 1e6,            // spirit = √(เหรียญสะสม ÷ ค่านี้)
  spiritBonusPer: 0.05,            // โบนัสมูลค่าขาย +x ต่อ 1 spirit
  spiritGrowPer: 0.02,             // โบนัสความเร็วโต +x ต่อ 1 spirit

  // ----- 🚀 การเดินทาง — ปุ่มในเมนู (engine ผูก onclick ให้ตาม config นี้) -----
  // lock = ต้องซื้อยานด้วย ✨ Spirit ก่อน ถึงจะเดินทางได้ (ปลดล็อกถาวร อยู่ข้ามรีเบิร์ธ)
  travel: {
    target: 'moon.html',
    label: '🚀 เดินทางไปดวงจันทร์',
    lock: {cost: 10, name: 'ยาน Apollo 11', em: '🚀'},
  },

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

  // ----- 🌦️ ฤดูกาล — วงรอบยาวกว่าอากาศรายวัน ปรับความเร็วโต & ราคาขายทั้งฟาร์ม -----
  seasonLength: 300,               // วินาทีต่อ 1 ฤดู (เวลาจริง)
  // grow=ตัวคูณความเร็วโต, sell=ตัวคูณราคาขาย, tint=สีคลุมฉากบางๆ
  seasons: [
    {id: 'spring', em: '🌸', nm: 'ใบไม้ผลิ', grow: 1.25, sell: 1.00, tint: 'rgba(120,220,120,.10)', desc: 'พืชโตไว ราคาปกติ'},
    {id: 'summer', em: '☀️', nm: 'ฤดูร้อน',  grow: 0.85, sell: 1.30, tint: 'rgba(255,200,90,.12)',  desc: 'ขายแพง แต่โตช้า'},
    {id: 'rainy',  em: '🌧️', nm: 'ฤดูฝน',    grow: 1.45, sell: 0.90, tint: 'rgba(90,150,220,.12)',  desc: 'โตไวสุด แต่ราคาตก'},
    {id: 'autumn', em: '🍂', nm: 'ใบไม้ร่วง', grow: 1.00, sell: 1.18, tint: 'rgba(210,130,60,.12)',  desc: 'สมดุล ราคาดีนิดหน่อย'},
  ],

  // ----- Easter eggs -----
  shootingStarReward: 100,         // ดาวตก คลิกได้กี่เหรียญ
  shootingStarChance: 0.5,         // โอกาสเกิดดาวตก (ตอนกลางคืน)
  catFertReward: 2,                // แมวจรให้ปุ๋ยกี่หน่วย
  catChance: 0.4,                  // โอกาสแมวเดินผ่าน

  // ----- 🐛 ศัตรูพืช — โผล่บนแปลงที่กำลังโต ถ้าไม่คลิกไล่ทันจะกัดผัก -----
  pest: {
    checkMs: 26000,                // เช็คทุกกี่ ms ว่าจะมีศัตรูพืชโผล่ไหม
    chance: 0.5,                   // โอกาสโผล่ในแต่ละครั้งที่เช็ค
    lifetime: 8000,                // มีเวลากี่ ms ก่อนมันกัดผัก
    reward: 0.25,                  // ไล่ทันได้เหรียญ = ราคาขายผัก × ค่านี้
    destroys: false,               // true=ทำลายต้นทิ้ง, false=รีเซ็ตความโต (ให้อภัยกว่า)
  },

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

  // ----- 🌱 โปรยปุ๋ย (Active Boost) — กดใช้ปุ๋ยเพื่อเร่งโตทั้งฟาร์มชั่วคราว -----
  fertBoost: {
    cost: 8,            // ใช้ปุ๋ยกี่หน่วยต่อการโปรย 1 ครั้ง
    duration: 75,       // โบนัสอยู่กี่วินาที (ฐาน — ต่อได้ด้วย ⏱️ ปุ๋ยอึด)
    growMult: 2.5,      // ตัวคูณความเร็วโตระหว่างเปิด
    goldenAdd: 0.20,    // +โอกาสผักทองระหว่างเปิด
  },

  // ----- 🏪 ร้านปุ๋ย — อัปเกรดถาวร ซื้อด้วย "ปุ๋ย" เท่านั้น (เงินซื้อไม่ได้) -----
  // base=ปุ๋ยที่ใช้เลเวลแรก, mult=คูณราคาต่อเลเวล, eff=ผล ณ เลเวล l, max=เลเวลสูงสุด
  fertShop: [
    {id: 'richSoil',    nm: '🌾 ดินอุดม',    desc: 'ผลผลิตทุกผัก +6%/lv ถาวร',      base: 12, mult: 1.55, max: 25, eff: l => 1 + l * 0.06},
    {id: 'compostKing', nm: '💩 ราชาปุ๋ย',   desc: 'โอกาสได้ปุ๋ยตอนเก็บ +3%/lv',    base: 15, mult: 1.5,  max: 20, eff: l => l * 0.03},
    {id: 'fertGold',    nm: '✨ ปุ๋ยทองคำ',  desc: 'โอกาสได้ผักทองคำ +1.2%/lv',     base: 20, mult: 1.6,  max: 20, eff: l => l * 0.012},
    {id: 'longBoost',   nm: '⏱️ ปุ๋ยอึด',    desc: 'โปรยปุ๋ยออกฤทธิ์นานขึ้น +12 วิ/lv', base: 18, mult: 1.5,  max: 12, eff: l => l * 12},
  ],

  // ----- 🏯 ของตกแต่งฟาร์ม — ซื้อด้วย "✨ Spirit ที่ใช้ได้" (ใช้แต้มสะสม ไม่ลดโบนัสพาสซีฟ) -----
  // โผล่บนฉากเป็นชิ้น ๆ + ให้โบนัสถาวร · type=ผลที่ให้, per=โบนัสต่อเลเวล, pos=ตำแหน่งซ้าย% บนฉาก, size=ขนาด px (ไม่ใส่ = 40)
  // type: sell=ราคาขาย ·grow=ความเร็วโต ·golden=โอกาสผักทอง ·fert=โอกาสปุ๋ย ·mutant=โอกาสกลายพันธุ์
  decorations: [
    {id: 'lantern',  em: '🏮', nm: 'โคมไฟมงคล',       desc: 'ขายผักได้แพงขึ้น',        type: 'sell',   per: 0.05,  base: 1, mult: 1.6, max: 12, pos: 12, size: 50},
    {id: 'fountain', em: '⛲', nm: 'น้ำพุศักดิ์สิทธิ์', desc: 'ผักโตเร็วขึ้น',           type: 'grow',   per: 0.04,  base: 2, mult: 1.6, max: 12, pos: 22, size: 50},
    {id: 'gnome',    em: '🍄', nm: 'บ้านเห็ดปุ๋ย',      desc: 'เพิ่มโอกาสได้ปุ๋ยตอนเก็บ', type: 'fert',   per: 0.02,  base: 2, mult: 1.6, max: 10, pos: 30, size: 50},
    {id: 'topiary',  em: '🌳', nm: 'ต้นไม้นำโชค',       desc: 'เพิ่มโอกาสผักทองคำ',      type: 'golden', per: 0.012, base: 3, mult: 1.7, max: 10, pos: 72, size: 50},
    {id: 'crystal',  em: '🔮', nm: 'ลูกแก้วพิศวง',      desc: 'เพิ่มโอกาสผักกลายพันธุ์',  type: 'mutant', per: 0.004, base: 5, mult: 1.9, max: 8,  pos: 80, size: 50},
    {id: 'statue',   em: '🗿', nm: 'รูปปั้นโบราณ',      desc: 'ขายผักได้แพงขึ้น (มาก)',  type: 'sell',   per: 0.08,  base: 6, mult: 1.8, max: 10, pos: 88, size: 150},
  ],

  // ----- สภาพอากาศ: grow=ตัวคูณความเร็วโต, next=[min,max] วินาทีที่อยู่ -----
  weathers: {
    sun:   {em: '☀️', nm: 'แดด',  grow: 1.0,  next: [40, 80]},
    cloud: {em: '⛅', nm: 'เมฆ',  grow: 0.7,  next: [40, 70]},
    rain:  {em: '🌧️', nm: 'ฝน',   grow: 1.4,  next: [35, 70]},
    storm: {em: '⛈️', nm: 'พายุ', grow: 0.55, next: [30, 55]},
  },
  // ----- 🎨 ธีมภาพของ map นี้ (engine อ่านจากตรงนี้) -----
  theme: {
    // ไล่สีท้องฟ้า 4 ช่วงเวลา (เช้า/กลางวัน/เย็น/กลางคืน) — 4 สีต่อช่วง
    sky: {
      morning:['#fce3b0','#ffc89e','#9fd3e0','#d2ebcb'],
      day:    ['#54aef2','#8ad0ff','#c8ecff','#e0f3d8'],
      evening:['#33264f','#b5487a','#ff8a5b','#ffd9a0'],
      night:  ['#04061a','#0b1640','#142a55','#1d3140'],
    },
    // โทนแสงคลุมฉากตามเวลา
    ambient: {
      morning:'rgba(255,224,188,0.30)',
      day:    'rgba(255,255,255,0)',
      evening:'rgba(255,138,82,0.40)',
      night:  'rgba(28,40,86,0.60)',
    },
    // แสงเรืองรอบดวงอาทิตย์/จันทร์: [สี, ความเข้ม]
    glow: {
      morning:['rgba(255,236,180,.85)',0.9],
      day:    ['rgba(255,240,190,.9)',1],
      evening:['rgba(255,150,90,.85)',0.85],
      night:  ['rgba(190,210,255,.7)',0.45],
    },
    phaseLabels: {morning:'🌅 เช้า', day:'🌞 กลางวัน', evening:'🌇 เย็น', night:'🌙 กลางคืน'},
    celestialDay: '☀️',          // วัตถุบนฟ้าตอนกลางวัน
    celestialNight: '🌙',        // ตอนกลางคืน
    starsAlways: false,          // ดาวเห็นตลอดไหม (false = เฉพาะเย็น/กลางคืน)
    hillProps: ['🌲','🌳','🌴','🌲','🌳'],  // ของประดับบนเนิน
    cloud: '☁️',                 // อิโมจิเมฆ
    growStages: ['🌱','🌿'],     // [เมล็ด, ต้นอ่อน] ก่อนโตเต็มเป็นอิโมจิผัก
    pests: ['🐛','🐌'],          // ศัตรูพืช
    // ป้ายข้อความที่ engine สร้าง
    fertIcon: '💩',
    fertName: 'ปุ๋ย',
    boostName: 'โปรยปุ๋ย',
    catLabel: '🐈 แมวจร',
  },

};
