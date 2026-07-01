-- =====================================================================
-- เค้กที่รัก — ล็อกวันเกิด (กันเปลี่ยนเดือนเกิดเพื่อฟาร์มคูปองวันเกิด)
-- แก้ trigger members_before_update: วันเกิดตั้งได้ครั้งเดียว (ตอน null)
-- เปลี่ยนหลังจากนั้นไม่ได้ — เหมือนกฎเบอร์โทร
-- รันหลัง 0001_init.sql
-- =====================================================================

create or replace function public.members_before_update()
returns trigger language plpgsql as $$
declare
  v_privileged boolean := (coalesce(current_setting('app.privileged', true), '') = 'on');
begin
  if new.auth_id is distinct from old.auth_id
     or new.provider is distinct from old.provider
     or new.email is distinct from old.email then
    raise exception 'ห้ามแก้ auth_id / provider / email';
  end if;
  if not v_privileged then
    if new.role is distinct from old.role then
      raise exception 'ห้ามแก้ role โดยตรง — ใช้ฟังก์ชัน set_role()';
    end if;
    if new.points_balance is distinct from old.points_balance then
      raise exception 'ห้ามแก้คะแนนโดยตรง — ใช้ฟังก์ชัน add_points()';
    end if;
    if old.phone is not null and new.phone is distinct from old.phone then
      raise exception 'ห้ามแก้เบอร์โทรหลังกรอกครั้งแรกแล้ว';
    end if;
    if old.birthday is not null and new.birthday is distinct from old.birthday then
      raise exception 'ห้ามแก้วันเกิดหลังกรอกครั้งแรกแล้ว';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
