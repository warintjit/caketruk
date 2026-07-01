-- =====================================================================
-- เค้กที่รัก — Phase 1: ข้อมูลตั้งต้น (Seed)
-- รันหลังไฟล์ 0001_init.sql
-- ⚠️ แก้ owner_email เป็นอีเมล Google ของเจ้าของร้านก่อนรัน!
--    (เจ้าของร้านที่ล็อกอินด้วยอีเมลนี้ครั้งแรก จะถูกตั้งเป็น super_admin อัตโนมัติ)
-- =====================================================================

-- settings สาธารณะ (1 แถว)
insert into public.settings (id)
  values (true)
  on conflict (id) do nothing;

-- settings ลับ + อีเมลเจ้าของร้าน
insert into public.secure_settings (id, owner_email)
  values (true, 'orawan062525@gmail.com')   -- ⚠️ แก้ให้ตรงอีเมลเจ้าของร้านจริง
  on conflict (id) do update set owner_email = excluded.owner_email;
