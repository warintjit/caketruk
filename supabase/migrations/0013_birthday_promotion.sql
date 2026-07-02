-- =====================================================================
-- เค้กที่รัก — โปรโมชันวันเกิด (แสดงตลอด กดรับได้เฉพาะวันเกิดจริง)
-- is_birthday: กดรับสิทธิ์ได้เฉพาะเมื่อ วัน+เดือนเกิดสมาชิก = วันนี้ (เวลาไทย)
-- โปรฯวันเกิดฟรีได้ (points_required = null → ใช้ 0 คะแนน)
-- รันหลัง 0004 (points_required), 0010 (claim)
-- =====================================================================

alter table public.promotions
  add column if not exists is_birthday boolean not null default false;

create or replace function public.claim_promotion(p_promotion_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_member uuid := public.my_member_id();
  v_promo  public.promotions;
  v_today  date := (timezone('Asia/Bangkok', now()))::date;
  v_points integer;
  v_bal    integer;
  v_bday   text;
  v_id     uuid;
begin
  if v_member is null then raise exception 'ต้องเข้าสู่ระบบก่อน'; end if;

  select * into v_promo from public.promotions where id = p_promotion_id;
  if not found then raise exception 'ไม่พบโปรโมชัน'; end if;
  if not v_promo.is_active then raise exception 'โปรโมชันนี้ปิดอยู่'; end if;

  v_points := coalesce(v_promo.points_required, 0);

  if v_promo.is_birthday then
    -- ต้องเป็นวันเกิดจริง (วัน+เดือนตรง)
    select to_char(birthday, 'MM-DD') into v_bday from public.members where id = v_member;
    if v_bday is null or v_bday <> to_char(timezone('Asia/Bangkok', now()), 'MM-DD') then
      raise exception 'สิทธิ์วันเกิดใช้ได้เฉพาะในวันเกิดของคุณ';
    end if;
  else
    -- โปรฯปกติต้องกำหนดคะแนนแลก
    if v_promo.points_required is null then
      raise exception 'โปรโมชันนี้ไม่ได้ใช้คะแนนแลก';
    end if;
  end if;

  if v_promo.start_date is not null and v_today < v_promo.start_date then
    raise exception 'ยังไม่ถึงช่วงเวลาโปรโมชัน';
  end if;
  if v_promo.end_date is not null and v_today > v_promo.end_date then
    raise exception 'โปรโมชันหมดเวลาแล้ว';
  end if;

  if v_points > 0 then
    select points_balance into v_bal from public.members where id = v_member;
    if v_bal < v_points then
      raise exception 'คะแนนไม่พอสำหรับแลกโปรโมชันนี้';
    end if;
  end if;

  insert into public.promotion_claims (promotion_id, member_id, points_used)
    values (p_promotion_id, v_member, v_points)
    returning id into v_id;
  return v_id;
end $$;
