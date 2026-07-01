-- =====================================================================
-- เค้กที่รัก — คูปองวันเกิด (แสดง/ใช้ได้เฉพาะเดือนเกิดของสมาชิก)
-- อิงเดือนจาก members.birthday · เทียบกับเดือนปัจจุบัน (เวลาไทย)
-- บังคับทั้ง RLS (การมองเห็น) และ RPC redeem_coupon (การใช้)
-- รันหลัง 0001_init.sql, 0003_redeem_coupon.sql
-- =====================================================================

alter table public.coupons
  add column if not exists is_birthday boolean not null default false;

-- เดือนเกิดของสมาชิกที่ล็อกอินอยู่ (null ถ้ายังไม่กรอกวันเกิด)
create or replace function public.my_birth_month()
returns integer language sql stable security definer set search_path = public as $$
  select extract(month from birthday)::int from public.members where auth_id = auth.uid()
$$;

-- มองเห็นคูปอง: คูปองวันเกิดโผล่เฉพาะเมื่อเดือนเกิด = เดือนปัจจุบัน (เวลาไทย)
drop policy if exists coupon_select on public.coupons;
create policy coupon_select on public.coupons for select
  using (
    public.can_manage_all()
    or (
      is_active
      and coalesce((select show_coupons from public.settings where id), false)
      and (
        not is_birthday
        or public.my_birth_month() = extract(month from timezone('Asia/Bangkok', now()))::int
      )
    )
  );

-- ใช้คูปอง: เพิ่มเงื่อนไขคูปองวันเกิด ต่อจากลอจิกลิมิตรายเดือนเดิม
create or replace function public.redeem_coupon(p_coupon_id uuid)
returns integer  -- คืนจำนวนสิทธิ์คงเหลือของเดือนนี้ (หลังใช้ครั้งนี้)
language plpgsql security definer set search_path = public as $$
declare
  v_member uuid := public.my_member_id();
  v_coupon public.coupons;
  v_period text := to_char(timezone('Asia/Bangkok', now()), 'YYYY-MM');
  v_month  integer := extract(month from timezone('Asia/Bangkok', now()))::int;
  v_bmonth integer;
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

  -- คูปองวันเกิด: ใช้ได้เฉพาะเดือนเกิดของสมาชิก
  if v_coupon.is_birthday then
    select extract(month from birthday)::int into v_bmonth
      from public.members where id = v_member;
    if v_bmonth is null or v_bmonth <> v_month then
      raise exception 'คูปองวันเกิดใช้ได้เฉพาะในเดือนเกิดของคุณ';
    end if;
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
