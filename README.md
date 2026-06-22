# 🌱 ฟาร์มไม่มีวันหยุด — Idle Farm Wallpaper

เกม idle farming ที่รันเป็น **desktop wallpaper** ได้ (ผ่าน Lively Wallpaper) — ปลูก/เก็บเกี่ยวอัตโนมัติ, ความคืบหน้าออฟไลน์, ระบบกลางวัน-กลางคืน, อากาศ, mutant/pest และ prestige

เป็นเว็บล้วน (HTML + JS, ไม่มี dependency / ไม่ต้อง build)

---

## 📁 ไฟล์

| ไฟล์ | หน้าที่ |
|------|---------|
| `index.html` | โครงหน้าเกม + CSS |
| `script.js` | ลอจิกเกมทั้งหมด |
| `lively-wallpaper/` | แพ็กเกจสำหรับ Lively (`index.html` + `script.js` + `LivelyInfo.json`) |
| `V1/` | เวอร์ชันเก่า |

เซฟเกมเก็บใน `localStorage` คีย์ **`idleFarm_v1`** (ดู `script.js`)

---

## ▶️ วิธีเล่นปกติ (ในเบราว์เซอร์)

เปิด `index.html` ด้วยเบราว์เซอร์ใดก็ได้

---

## 🖥️ วิธีตั้งเป็น Desktop Wallpaper (Lively)

### 1. ติดตั้ง Lively Wallpaper
จาก Microsoft Store หรือ https://www.rocksdanister.com/lively/ (ฟรี)

### 2. เพิ่ม wallpaper
เปิด Lively → กดปุ่ม **`+`** (Add Wallpaper) → **Browse** → เลือกไฟล์:
```
lively-wallpaper\index.html
```
จะได้ wallpaper ชื่อ **"Idle Farm — ฟาร์มไม่มีวันหยุด"** → ดับเบิลคลิกเพื่อใช้งาน

---

## ⚠️ สำคัญ: เปิด Disk Cache เพื่อไม่ให้เซฟหาย

> **ต้องทำ ไม่งั้นความคืบหน้าจะรีเซ็ตเวลารี Lively / รีเครื่อง**

โดยปริยาย Lively (ตัว Store + WebView2) เก็บ `localStorage` ไว้ใน **โฟลเดอร์ชั่วคราว `%TEMP%` ที่สุ่มชื่อใหม่ทุกครั้งที่เปิด** → เซฟไม่ย้ายตามแบบเชื่อถือได้ → **เกมเริ่มใหม่หมด**

### วิธีแก้
เปิด Lively → **Settings (⚙️) → Wallpaper** → ส่วน **Plugins → Web browser**
เปิดสวิตช์ **"Disk cache" (Store temporary files on disk instead of memory) → On**

> Web browser ต้องตั้งเป็น **WebView2**

หลังเปิด `Disk cache` แล้ว WebView2 จะย้ายไปเขียนเซฟที่ path ถาวรคงที่:
```
%LOCALAPPDATA%\Packages\12030rocksdanister.LivelyWallpaper_*\LocalCache\Local\
  Lively Wallpaper\WebView2\Lively.Player.WebView2\<Arrangement>\EBWebView\...
```
ทดสอบแล้ว: ความคืบหน้าอยู่ครบหลังรี Lively / รีเครื่อง ✅

**หมายเหตุ**
- ตอนเปิดสวิตช์นี้ครั้งแรก เซฟเดิม (ที่อยู่ใน `%TEMP%`) จะหายไป **1 ครั้ง** เพราะที่เก็บย้าย location — จากนั้นจะเสถียร
- path ผูกกับรูปแบบจัดจอ (`Arrangement` เช่น `Span`) — ถ้าเปลี่ยน arrangement ใน Lively เซฟอาจแยกเป็นชุดใหม่

---

## 💾 สำรองเซฟ (แนะนำ)

ถ้าอยากชัวร์ขั้นสุด สำรองเซฟด้วยมือได้ — เปิด DevTools (ตั้ง Debugging port ใน Lively แล้วเข้า `http://localhost:<port>`) แล้วรัน:
```js
// สำรอง
copy(localStorage.getItem('idleFarm_v1'))
// กู้คืน
localStorage.setItem('idleFarm_v1', '<วางข้อความที่สำรองไว้>')
```
