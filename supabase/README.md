# คู่มือตั้งค่า Supabase (Phase 1)

ทำตามทีละขั้น — ส่วนนี้ต้องทำบนเว็บ Supabase (ผมรันแทนไม่ได้เพราะต้องใช้บัญชีคุณ)

## 1. สร้างโปรเจกต์ Supabase

1. ไปที่ https://supabase.com → Sign in (ใช้ GitHub ล็อกอินได้เลย)
2. กด **New project**
   - **Name:** `caketruk`
   - **Database Password:** ตั้งรหัสแล้ว **จดเก็บไว้** (ลืมแล้วยุ่ง)
   - **Region:** เลือก **Southeast Asia (Singapore)** (ใกล้ไทยสุด เร็วสุด)
3. รอสร้างเสร็จ ~2 นาที

## 2. รัน SQL สร้างตาราง + ระบบสิทธิ์

1. เมนูซ้าย → **SQL Editor** → **New query**
2. เปิดไฟล์ [`migrations/0001_init.sql`](./migrations/0001_init.sql) ก๊อปทั้งหมดมาวาง → กด **Run** (มุมขวาล่าง)
   - ถ้าขึ้น "Success" = ผ่าน ✅
3. ⚠️ เปิดไฟล์ [`migrations/0002_seed.sql`](./migrations/0002_seed.sql) → **แก้ `owner_email`** เป็นอีเมล Google ของเจ้าของร้าน → ก๊อปมาวาง → **Run**

> อีเมลใน owner_email = คนที่จะเป็น **super_admin** อัตโนมัติเมื่อล็อกอินครั้งแรก

## 3. เปิดล็อกอินด้วย Google

1. เมนูซ้าย → **Authentication** → **Sign In / Providers** (หรือ **Providers**)
2. หา **Google** → เปิด (Enable)
3. ต้องมี **Client ID** + **Client Secret** จาก Google:
   - ไปที่ https://console.cloud.google.com → สร้าง project
   - **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URI:** ใส่ค่าที่ Supabase บอก (หน้าตั้ง Google ใน Supabase จะโชว์ URL ให้ก๊อป เช่น `https://xxxx.supabase.co/auth/v1/callback`)
   - ก๊อป Client ID + Secret กลับมาใส่ใน Supabase → **Save**

## 4. เอาค่าเชื่อมต่อมาใส่ในโปรเจกต์

1. Supabase → **Project Settings** (รูปเฟือง) → **API**
2. ก๊อป 2 ค่านี้:
   - **Project URL** → ใส่ใน `.env` ช่อง `VITE_SUPABASE_URL`
   - **anon public key** → ใส่ใน `.env` ช่อง `VITE_SUPABASE_ANON_KEY`
3. ที่โฟลเดอร์โปรเจกต์ ก๊อป `.env.example` เป็น `.env` แล้วเติมค่า

```bash
cp .env.example .env
# แล้วแก้ค่าในไฟล์ .env
```

> ✅ ไฟล์ `.env` ถูกกันไม่ให้ขึ้น GitHub แล้ว (ปลอดภัย)

## 5. ตรวจว่าผ่าน

- Supabase → **Table Editor** ควรเห็น 9 ตาราง (members, point_transactions, promotions, ...)
- **Database → Roles/Policies** ควรเห็น RLS เปิด (โล่เขียว) ทุกตาราง

---

## โครงสร้างสิทธิ์ (สรุป)

| ฟังก์ชัน | ใครเรียกได้ | ทำอะไร |
|---|---|---|
| `add_points(phone, bill, ...)` | admin/developer/super_admin | เพิ่มคะแนน `floor(bill/300)` หรือปรับมือ |
| `set_role(member_id, role)` | developer/super_admin | เปลี่ยน role (super_admin แตะได้เฉพาะ super_admin) |

**RLS 2 ระดับ:** `can_manage_points()` (admin+) · `can_manage_all()` (developer+)
**ความลับ:** `telegram_bot_token` อยู่ในตาราง `secure_settings` ที่สมาชิกอ่านไม่ได้
