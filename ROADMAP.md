# แผนพัฒนา (Development Roadmap)
## ระบบจัดการสมาชิกร้านเค้กที่รัก — Cake Shop Membership Management System

> อ้างอิงจาก SRS v1.1 · ปรับให้สอดคล้องโครงสร้าง **4 บทบาท** (super_admin / developer / admin / member)
> รวม Phase เฉพาะสำหรับ **LINE OA** และส่วน **Telegram** แบบละเอียด
> dev by Kru_Boat

---

## โครงสร้างบทบาท (Role Model) ที่ roadmap นี้ยึดถือ

| บทบาท | สิทธิ์ | จำนวน |
|---|---|---|
| **super_admin** | ทุกอย่างเหมือน developer + admin · รับแจ้งเตือน Telegram | **1 คนเท่านั้น** |
| **developer** | จัดการทุกอย่างในหลังบ้าน + กำหนด role (member/admin/developer) | หลายคน |
| **admin** | **เพิ่ม/ลดคะแนนเท่านั้น** | หลายคน |
| **member** | ใช้งานหน้าบ้าน | หลายคน |

**กติกาความปลอดภัยที่ต้อง implement:**
- developer ตั้ง role ได้เฉพาะ member/admin/developer (แตะ super_admin ไม่ได้)
- เฉพาะ super_admin คนปัจจุบันโอนตำแหน่ง super_admin ได้ (มีได้คนเดียวเสมอ)
- super_admin ถูกลด role โดยผู้อื่นไม่ได้

---

## แนวทางการล็อกอิน (สรุปก่อนเริ่ม)

- **เปิดจาก LINE Rich Menu** → ใช้ **LIFF** เปิดเว็บ → **auto-login** ด้วย LINE ID Token (ไม่ต้องกดปุ่ม)
- **เปิดจาก browser ปกติ (นอกแอป LINE)** → **Google Login** ผ่าน Supabase Auth OAuth
- ทั้งสองทางจบที่ Supabase session เดียวกัน → ผูกกับ record ในตาราง `members`

---

## 🔧 Phase 0 — วางรากฐาน (Setup) · ~2-3 วัน

- สร้างโปรเจกต์ React (Vite) + โครงสร้างโฟลเดอร์ + Tailwind/UI library
- สร้าง Supabase project, เชื่อม env, ตั้ง Storage buckets (รูปโปรโมชัน/แพคเกจ/คูปอง/เมนู)
- ติดตั้ง i18n (react-i18next) + language switcher TH/EN + จดจำภาษาใน localStorage
- วาง Layout หลัก + Footer "dev by Kru_Boat" + deploy ขึ้น Netlify ให้ผ่านตั้งแต่ต้น (CI/CD)

> 🟡 **เริ่มขนานตั้งแต่วันนี้:** สมัคร/เตรียมบัญชี LINE OA + LINE Developers (ดู Phase 2) เพราะบางขั้นตอนรออนุมัติ/ตั้งค่า ใช้เวลา

**ส่งมอบ:** เว็บเปล่าที่ deploy ได้จริง สลับภาษาได้

---

## 🗄️ Phase 1 — ฐานข้อมูล + Role + Google Auth · ~4-5 วัน

- สร้าง 8 ตารางตาม schema + indexes (เช่น index ที่ `phone`)
- คอลัมน์ `members.role` รองรับ 4 ค่า: `super_admin / developer / admin / member` (default `member`)
- **RLS policies แยก 2 ระดับสิทธิ์หลังบ้าน:**
  - `can_manage_points()` = admin, developer, super_admin → ใช้กับ point_transactions
  - `can_manage_all()` = developer, super_admin → ใช้กับ members, promotions, packages, coupons, menu, settings
  - member เห็นเฉพาะข้อมูลตัวเอง
- ตั้ง **Google Login** ผ่าน Supabase Auth OAuth (ใช้งานได้เลยจาก browser ปกติ)
- Flow สมัครครั้งแรก → กรอกโปรไฟล์ (ชื่อ/นามสกุล/วันเกิด/เบอร์โทร)
- Seed เจ้าของร้านเป็น `super_admin` ตั้งต้น

> ⚠️ จุดเสี่ยง = RLS 2 ระดับ ต้องทำให้แน่นที่นี่ก่อน (LINE login ตามมาใน Phase 2)

**ส่งมอบ:** ล็อกอิน Google ได้, สร้าง member record, RLS กันข้อมูลรั่ว

---

## 💬 Phase 2 — LINE OA & การเชื่อมต่อช่องทางภายนอก · ~3-4 วัน  ⭐ NEW

งานทั้งหมดที่เกี่ยวกับ LINE รวมไว้ที่นี่ที่เดียว

### 2.1 ตั้งบัญชีและ Channel (งานตั้งค่า — เริ่มขนานได้ตั้งแต่ Phase 0)
- สร้าง **LINE Official Account** ผ่าน LINE OA Manager (ถ้ายังไม่มี)
- สร้าง **Provider** + **LINE Login channel** ใน LINE Developers Console → ได้ `Channel ID` / `Channel Secret`
- เพิ่ม **LIFF app** ภายใต้ channel → ได้ `LIFF ID` + ตั้ง Endpoint URL ชี้มาที่เว็บ (Netlify URL)

### 2.2 LIFF Auto-login เชื่อม Supabase (ส่วนยากที่สุดของเฟส)
- ติดตั้ง `@line/liff` ในเว็บ → `liff.init()` → ตรวจว่าเปิดในแอป LINE ไหม
- เปิดในแอป LINE → `liff.login()` อัตโนมัติ + ดึง LINE ID Token + โปรไฟล์ (ชื่อ/รูป)
- **Supabase Edge Function** `line-auth`: รับ LINE ID Token → verify กับ LINE → สร้าง/หา user → ออก Supabase session (custom token)
- ผูกกับตาราง `members` (provider = `line`) → ครั้งแรกให้กรอกโปรไฟล์เพิ่ม (เหมือน Phase 1)

### 2.3 Rich Menu (5 ปุ่ม)
- ออกแบบรูป Rich Menu + กำหนด action แต่ละปุ่ม:
  | ปุ่ม | ปลายทาง |
  |---|---|
  | โปรโมชัน | LIFF → `/promotions` |
  | สมาชิก | LIFF → `/profile` |
  | เมนู | LIFF → `/menu` |
  | ติดต่อ & แผนที่ | ลิงก์ภายนอก (Google Map) |
  | เฟสบุ๊ค | ลิงก์ภายนอก (Facebook) |
- อัปโหลด Rich Menu + ตั้งเป็น default ของ OA
- ทดสอบ flow จริง: เปิดจาก LINE → auto-login → ใช้งานได้

**ส่งมอบ:** ลูกค้าเปิดจาก LINE Rich Menu แล้วล็อกอินอัตโนมัติเข้าเว็บได้ครบทุกปุ่ม

---

## 👤 Phase 3 — หน้าบ้านสมาชิก (Frontend) · ~4-5 วัน

**บังคับล็อกอินทุกหน้า** (auth guard) — แต่ด้วย LIFF auto-login จึงไร้รอยต่อสำหรับคนเปิดจาก LINE

- หน้าแรกเปิดมาเห็น **คะแนนคงเหลือ + คูปองที่ใช้ได้** ทันที (โปรไฟล์, เบอร์ล็อกแก้ไขไม่ได้)
- ฟอร์มสมัครครั้งแรก: **เติมชื่อ+รูปจาก LINE อัตโนมัติ** เหลือพิมพ์แค่เบอร์+วันเกิด (date picker, auto-format เบอร์)
- ตรวจภาษาอัตโนมัติตอนเข้าครั้งแรก (LINE/เบราว์เซอร์) + สลับ/จดจำได้
- ประวัติการใช้ (Card layout): คะแนน / คะแนนหมดอายุ / คูปอง
- เมนูแฮมเบอร์เกอร์ + หน้า "เร็วๆ นี้" สำหรับแพคเกจ
- หน้าโปรโมชัน, หน้าเมนู (รูปภาพ), หน้าคูปอง + **ปุ่มกดใช้คูปองแบบปุ่มเดียว + กล่องยืนยัน**
- Mobile-first: ปุ่มใหญ่ ตัวอักษรชัด เลื่อนหน้าเดียวจบ

**ส่งมอบ:** สมาชิกใช้งานครบทุกหน้าฝั่ง mobile · ลื่นตั้งแต่เปิด ไม่มีกำแพงล็อกอินที่รู้สึกได้

---

## 🛠️ Phase 4 — หลังบ้าน (Backend Admin) · ~5-6 วัน

**Role-aware UI:** เมนูหลังบ้านแสดงตามสิทธิ์

### 4A. ส่วนที่ทุก role หลังบ้านเห็น (admin/developer/super_admin)
- หน้า **เพิ่ม/ลดคะแนน** (ค้นด้วยเบอร์ → กรอกยอดบิล → `floor(amount/300)`)
  - ทำใน **Supabase Edge Function** เพื่อความถูกต้องและความปลอดภัย

### 4B. ส่วนที่เฉพาะ developer/super_admin เห็น
- จัดการสมาชิก (เพิ่ม/ลบ/แก้ไข)
- **กำหนด role** + logic ป้องกัน privilege escalation (ดูกติกาด้านบน)
- CRUD: โปรโมชัน / แพคเกจ / คูปอง / เมนู (อัปโหลดรูป + 2 ภาษา + toggle เปิดปิด)
- ตั้งค่าทั่วไป (Google Map, Facebook, toggle เมนูฝั่งสมาชิก)

> **สำคัญ:** ซ่อนเมนู 4B จากฝั่ง admin ที่ UI **และ** บังคับซ้ำที่ RLS/Edge Function (อย่าพึ่ง UI อย่างเดียว)

**ส่งมอบ:** admin ทำได้แค่คะแนน · developer/super_admin บริหารร้านครบ · กำหนด role ปลอดภัย

---

## 🔔 Phase 5 — Telegram + คูปองรายเดือน · ~2-3 วัน

### 5.1 Telegram — ตั้งค่า (ทำครั้งเดียว)
1. สร้าง Bot ผ่าน **@BotFather** → ได้ **Bot Token** (ฟรี)
2. เจ้าของร้านทักแชทบอท → ระบบดึง **Chat ID** ของเจ้าของร้าน (ผ่าน `getUpdates` หรือปุ่มในหน้าตั้งค่า)
3. บันทึก `telegram_bot_token` / `telegram_chat_id` / `telegram_enabled` ในตาราง `settings` (เก็บฝั่ง server)

### 5.2 Telegram — การส่งแจ้งเตือน
- **Supabase Edge Function** ส่งข้อความทุกครั้งที่มีการ **เพิ่ม/ลดคะแนน** (เรียกต่อจาก Edge Function ใน Phase 4A)
- Bot Token อยู่ฝั่ง server เท่านั้น — ไม่หลุดไป client
- **ผู้รับ = super_admin คนเดียว** (developer/admin ไม่รับแจ้งเตือน)
- ข้อความระบุ: ชื่อแอดมินผู้ทำรายการ / ประเภท (เพิ่ม-ลด) / ชื่อสมาชิก / จำนวนคะแนน / ยอดบิล / วันเวลา
- หน้าตั้งค่ามี **ปุ่มทดสอบส่ง** + **สวิตช์เปิด/ปิด** (เข้าได้เฉพาะ developer/super_admin)

### 5.3 คูปองรายเดือน
- Logic นับสิทธิ์การใช้ต่อเดือนจากตาราง `coupon_redemptions` (`period` เช่น `2026-06`)
- เริ่มเดือนใหม่ = สิทธิ์รีเซ็ตอัตโนมัติ (ไม่ต้อง cron — นับจาก period ปัจจุบัน)

**ส่งมอบ:** Super Admin ได้รับแจ้งเตือนเรียลไทม์, คูปองทำงานครบ

---

## ✅ Phase 6 — ขัดเงา + ส่งมอบ · ~2-3 วัน

- ทดสอบ end-to-end **ทั้ง 4 role** — โดยเฉพาะ admin เข้าถึงเฉพาะคะแนนจริง และ developer ตั้ง super_admin ไม่ได้จริง
- ทดสอบ **LINE LIFF auto-login** บนมือถือจริง (เปิดในแอป LINE) + Google login บน browser
- ตรวจ RLS รั่วไหม (ลองเรียก API ตรงด้วย role ต่ำ), เช็ค i18n ครบทุกข้อความ
- Loading/Error states, validation, responsive ทุกหน้า
- ตรวจ Rich Menu ทุกปุ่มชี้ URL จริงหลัง deploy
- เอกสารส่งมอบ + คู่มือแอดมิน

**รวมประมาณ 22-28 วันทำงาน** (คนเดียว) — ปรับได้ตามจริง

---

## ลำดับความเสี่ยง (ทำให้แน่ก่อน)

1. 🔴 **RLS 2 ระดับ** (Phase 1) — เสี่ยงสุด แก้ทีหลังเจ็บ
2. 🔴 **LIFF ↔ Supabase custom token** (Phase 2.2) — ส่วนเทคนิคยากสุดของ LINE
3. 🔴 **Logic กำหนด role / กัน privilege escalation** (Phase 4B) — ช่องโหว่ความปลอดภัยถ้าพลาด
4. 🟠 **Edge Function เพิ่มคะแนน + Telegram** — ความถูกต้องของเงิน/คะแนน
5. 🟡 **i18n เนื้อหา 2 ภาษา** — ลืมง่าย ควรวางตั้งแต่ Phase 0
6. 🟡 **บัญชี LINE OA/Channel รออนุมัติ** — เริ่มสมัครขนานตั้งแต่ Phase 0
