-- =====================================================================
-- เค้กที่รัก — เพิ่ม toggle เปิด/ปิด ให้การ์ดเมนูลูกค้า (home_tiles)
-- enabled = แสดงการ์ดนี้บนหน้าแรกลูกค้าไหม (default เปิด)
-- รันหลัง 0006_home_tiles.sql
-- =====================================================================

alter table public.home_tiles
  add column if not exists enabled boolean not null default true;
