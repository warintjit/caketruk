-- =====================================================================
-- เค้กที่รัก — เพิ่มสถิติการแลกโปรโมชันในรายงานรายเดือน
-- (คำขอที่ยืนยันแล้ว = confirmed) พร้อมโปรไฟล์สมาชิก + โปรฯ + เวลา
-- แทนที่ admin_report_month() เดิม (0009)
-- =====================================================================

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
    'promotions',
      (select coalesce(jsonb_agg(
         jsonb_build_object('id', id, 'title_th', title_th, 'title_en', title_en,
                            'points_required', points_required, 'is_active', is_active)
         order by created_at desc), '[]'::jsonb)
       from public.promotions where created_at >= v_start and created_at < v_end),
    'coupons_total',
      (select count(*) from public.coupon_redemptions where period = p_period),
    'coupons',
      (select coalesce(jsonb_agg(
         jsonb_build_object('name_th', c.name_th, 'name_en', c.name_en, 'count', t.c)
         order by t.c desc), '[]'::jsonb)
       from (select coupon_id, count(*) c from public.coupon_redemptions
             where period = p_period group by coupon_id) t
       join public.coupons c on c.id = t.coupon_id),
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
    ),
    -- การแลกโปรโมชันที่ยืนยันแล้วในเดือนนั้น (พร้อมโปรไฟล์สมาชิก)
    'redemptions',
      (select coalesce(jsonb_agg(
         jsonb_build_object(
           'id', pc.id,
           'points_used', pc.points_used,
           'resolved_at', pc.resolved_at,
           'member_name', m.display_name,
           'member_last', m.last_name,
           'member_phone', m.phone,
           'member_photo', m.photo_url,
           'promo_th', p.title_th,
           'promo_en', p.title_en
         ) order by pc.resolved_at desc), '[]'::jsonb)
       from public.promotion_claims pc
       join public.members m on m.id = pc.member_id
       left join public.promotions p on p.id = pc.promotion_id
       where pc.status = 'confirmed'
         and pc.resolved_at >= v_start and pc.resolved_at < v_end)
  );
end $$;
