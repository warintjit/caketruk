-- =====================================================================
-- เค้กที่รัก — RPC รายงานสรุปร้าน (เฉพาะ developer/super_admin)
-- คำนวณสถิติที่ server → คืน jsonb (เดือน = เวลาไทย)
-- รันหลัง 0001_init.sql
-- =====================================================================

create or replace function public.admin_report()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_month_start timestamptz :=
    date_trunc('month', timezone('Asia/Bangkok', now())) at time zone 'Asia/Bangkok';
  v_period text := to_char(timezone('Asia/Bangkok', now()), 'YYYY-MM');
  v jsonb;
begin
  if not public.can_manage_all() then
    raise exception 'ไม่มีสิทธิ์ดูรายงาน';
  end if;

  select jsonb_build_object(
    'total_members', (select count(*) from public.members),
    'new_members_month', (select count(*) from public.members where created_at >= v_month_start),
    'total_points', (select coalesce(sum(points_balance), 0) from public.members),
    'members_by_role',
      (select coalesce(jsonb_object_agg(role, c), '{}'::jsonb)
       from (select role, count(*) c from public.members group by role) t),
    'month_earn_count',
      (select count(*) from public.point_transactions
        where type = 'earn' and created_at >= v_month_start),
    'month_points_added',
      (select coalesce(sum(points), 0) from public.point_transactions
        where points > 0 and created_at >= v_month_start),
    'month_points_removed',
      (select coalesce(sum(points), 0) from public.point_transactions
        where points < 0 and created_at >= v_month_start),
    'month_bill_total',
      (select coalesce(sum(bill_amount), 0) from public.point_transactions
        where type = 'earn' and created_at >= v_month_start),
    'month_coupons_used',
      (select count(*) from public.coupon_redemptions where period = v_period)
  ) into v;

  return v;
end $$;
