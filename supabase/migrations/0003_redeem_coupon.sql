-- =====================================================================
-- เค้กที่รัก — RPC ใช้คูปอง (บังคับสิทธิ์ต่อเดือนฝั่ง server)
-- period = 'YYYY-MM' ตามเวลาไทย (Asia/Bangkok) → ขึ้นเดือนใหม่รีเซ็ตสิทธิ์เอง
-- รันหลัง 0001_init.sql
-- =====================================================================

create or replace function public.redeem_coupon(p_coupon_id uuid)
returns integer  -- คืนจำนวนสิทธิ์คงเหลือของเดือนนี้ (หลังใช้ครั้งนี้)
language plpgsql security definer set search_path = public as $$
declare
  v_member uuid := public.my_member_id();
  v_coupon public.coupons;
  v_period text := to_char(timezone('Asia/Bangkok', now()), 'YYYY-MM');
  v_used   integer;
begin
  if v_member is null then
    raise exception 'ต้องเข้าสู่ระบบก่อนใช้คูปอง';
  end if;

  select * into v_coupon from public.coupons where id = p_coupon_id;
  if not found then
    raise exception 'ไม่พบคูปอง';
  end if;
  if not v_coupon.is_active then
    raise exception 'คูปองนี้ปิดใช้งานอยู่';
  end if;

  -- ล็อกแถวสมาชิกกันกดซ้ำพร้อมกัน (serialize ต่อสมาชิก)
  perform 1 from public.members where id = v_member for update;

  select count(*) into v_used
    from public.coupon_redemptions
    where coupon_id = p_coupon_id and member_id = v_member and period = v_period;

  if v_used >= v_coupon.max_uses_per_user then
    raise exception 'ใช้คูปองนี้ครบสิทธิ์ของเดือนนี้แล้ว';
  end if;

  insert into public.coupon_redemptions (coupon_id, member_id, period)
    values (p_coupon_id, v_member, v_period);

  return v_coupon.max_uses_per_user - v_used - 1;
end $$;
