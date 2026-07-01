-- =====================================================================
-- เค้กที่รัก — เพิ่มคะแนนที่ใช้แลกโปรโมชัน (points_required)
-- แสดงบนการ์ดโปรโมชันฝั่งสมาชิก: "ใช้ X คะแนน" (ข้อมูลประกอบ ยังไม่หักคะแนนอัตโนมัติ)
-- รันหลัง 0001_init.sql
-- =====================================================================

alter table public.promotions
  add column if not exists points_required integer
  check (points_required is null or points_required >= 0);
