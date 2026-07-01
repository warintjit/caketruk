-- =====================================================================
-- เค้กที่รัก — รายงาน: สรุปสมาชิก + รายงานรายเดือน (ย้อนหลังได้)
-- แทนที่ admin_report() เดิม (0008)
-- เดือนอิงเวลาไทย (Asia/Bangkok)
-- =====================================================================

drop function if exists public.admin_report();

-- สรุปสมาชิก: รวม / เดือนที่แล้ว / เดือนนี้
create or replace function public.admin_report_summary()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_now        timestamp   := timezone('Asia/Bangkok', now());
  v_this_start timestamptz := date_trunc('month', v_now) at time zone 'Asia/Bangkok';
  v_last_start timestamptz := (date_trunc('month', v_now) - interval '1 month') at time zone 'Asia/Bangkok';
begin
  if not public.can_manage_all() then
    raise exception 'ไม่มีสิทธิ์ดูรายงาน';
  end if;
  return jsonb_build_object(
    'total_members', (select count(*) from public.members),
    'new_members_last_month',
      (select count(*) from public.members where created_at >= v_last_start and created_at < v_this_start),
    'new_members_this_month',
      (select count(*) from public.members where created_at >= v_this_start)
  );
end $$;

-- รายงานของเดือนที่เลือก (p_period = 'YYYY-MM')
create or replace function public.admin_report_month(p_period text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_start timestamptz := ((p_period || '-01')::timestamp) at time zone 'Asia/Bangkok';
  v_end   timestamptz := (((p_period || '-01')::timestamp) + interval '1 month') at time zone 'Asia/Bangkok';
begin
  if not public.can_manage_all() then
    raise exception 'ไม่มีสิทธิ์ดูรายงาน';
  end if;
  return jsonb_build_object(
    -- รายชื่อโปรโมชันที่สร้างในเดือนนั้น
    'promotions',
      (select coalesce(jsonb_agg(
         jsonb_build_object('id', id, 'title_th', title_th, 'title_en', title_en,
                            'points_required', points_required, 'is_active', is_active)
         order by created_at desc), '[]'::jsonb)
       from public.promotions where created_at >= v_start and created_at < v_end),
    -- คูปองที่ใช้ในเดือนนั้น (รวม + แยกตามคูปอง)
    'coupons_total',
      (select count(*) from public.coupon_redemptions where period = p_period),
    'coupons',
      (select coalesce(jsonb_agg(
         jsonb_build_object('name_th', c.name_th, 'name_en', c.name_en, 'count', t.c)
         order by t.c desc), '[]'::jsonb)
       from (select coupon_id, count(*) c from public.coupon_redemptions
             where period = p_period group by coupon_id) t
       join public.coupons c on c.id = t.coupon_id),
    -- การใช้คะแนนในเดือนนั้น
    'points', jsonb_build_object(
      'earn_count',   (select count(*) from public.point_transactions
                         where type = 'earn' and created_at >= v_start and created_at < v_end),
      'adjust_count', (select count(*) from public.point_transactions
                         where type = 'adjust' and created_at >= v_start and created_at < v_end),
      'points_added', (select coalesce(sum(points), 0) from public.point_transactions
                         where points > 0 and created_at >= v_start and created_at < v_end),
      'points_removed',(select coalesce(sum(points), 0) from public.point_transactions
                         where points < 0 and created_at >= v_start and created_at < v_end),
      'bill_total',   (select coalesce(sum(bill_amount), 0) from public.point_transactions
                         where type = 'earn' and created_at >= v_start and created_at < v_end)
    )
  );
end $$;
