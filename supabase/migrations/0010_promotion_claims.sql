-- =====================================================================
-- เค้กที่รัก — แลกโปรโมชันด้วยคะแนน (จองสิทธิ์ → แอดมินยืนยันหน้าร้าน)
-- - เพิ่มช่วงเวลาโปรโมชัน (start_date / end_date)
-- - ตาราง promotion_claims: จองสิทธิ์ (pending) ยังไม่หักคะแนน
-- - ยืนยันโดยแอดมิน → หักคะแนนจริง (ผ่าน add_points type adjust)
-- รันหลัง 0001_init.sql, 0004 (points_required)
-- =====================================================================

alter table public.promotions add column if not exists start_date date;
alter table public.promotions add column if not exists end_date   date;

create table if not exists public.promotion_claims (
  id           uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  member_id    uuid not null references public.members (id) on delete cascade,
  points_used  integer not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'cancelled')),
  handled_by   uuid references public.members (id),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index if not exists idx_claims_status on public.promotion_claims (status, created_at desc);
create index if not exists idx_claims_member on public.promotion_claims (member_id, created_at desc);

alter table public.promotion_claims enable row level security;

-- อ่าน: เจ้าของเห็นของตัวเอง · แอดมิน (จัดการคะแนน) เห็นทุกอัน
drop policy if exists claims_select on public.promotion_claims;
create policy claims_select on public.promotion_claims for select
  using (member_id = public.my_member_id() or public.can_manage_points());
-- เขียนผ่าน RPC (SECURITY DEFINER) เท่านั้น — ไม่เปิด insert/update ตรง

-- จองสิทธิ์แลกโปรโมชัน (ยังไม่หักคะแนน) → คืน id คำขอ
create or replace function public.claim_promotion(p_promotion_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_member uuid := public.my_member_id();
  v_promo  public.promotions;
  v_today  date := (timezone('Asia/Bangkok', now()))::date;
  v_bal    integer;
  v_id     uuid;
begin
  if v_member is null then raise exception 'ต้องเข้าสู่ระบบก่อน'; end if;

  select * into v_promo from public.promotions where id = p_promotion_id;
  if not found then raise exception 'ไม่พบโปรโมชัน'; end if;
  if not v_promo.is_active then raise exception 'โปรโมชันนี้ปิดอยู่'; end if;
  if v_promo.points_required is null then
    raise exception 'โปรโมชันนี้ไม่ได้ใช้คะแนนแลก';
  end if;
  if v_promo.start_date is not null and v_today < v_promo.start_date then
    raise exception 'ยังไม่ถึงช่วงเวลาโปรโมชัน';
  end if;
  if v_promo.end_date is not null and v_today > v_promo.end_date then
    raise exception 'โปรโมชันหมดเวลาแล้ว';
  end if;

  select points_balance into v_bal from public.members where id = v_member;
  if v_bal < v_promo.points_required then
    raise exception 'คะแนนไม่พอสำหรับแลกโปรโมชันนี้';
  end if;

  insert into public.promotion_claims (promotion_id, member_id, points_used)
    values (p_promotion_id, v_member, v_promo.points_required)
    returning id into v_id;
  return v_id;
end $$;

-- แอดมินยืนยัน/ยกเลิกคำขอ (confirm = หักคะแนนจริง)
create or replace function public.resolve_promotion_claim(p_claim_id uuid, p_action text)
returns public.promotion_claims language plpgsql security definer set search_path = public as $$
declare
  v_claim  public.promotion_claims;
  v_member public.members;
  v_result public.promotion_claims;
begin
  select * into v_claim from public.promotion_claims where id = p_claim_id;
  if not found then raise exception 'ไม่พบคำขอ'; end if;
  if v_claim.status <> 'pending' then raise exception 'คำขอนี้ถูกดำเนินการไปแล้ว'; end if;

  if p_action = 'cancel' then
    -- ยกเลิกได้: แอดมิน หรือ เจ้าของคำขอเอง
    if not (public.can_manage_points() or v_claim.member_id = public.my_member_id()) then
      raise exception 'ไม่มีสิทธิ์ยกเลิกคำขอ';
    end if;
    update public.promotion_claims
      set status = 'cancelled', handled_by = public.my_member_id(), resolved_at = now()
      where id = p_claim_id returning * into v_result;
    return v_result;

  elsif p_action = 'confirm' then
    if not public.can_manage_points() then raise exception 'ไม่มีสิทธิ์ยืนยันคำขอ'; end if;
    select * into v_member from public.members where id = v_claim.member_id;
    -- หักคะแนน (add_points type adjust ติดลบ) — กันติดลบให้เองในฟังก์ชัน
    perform public.add_points(v_member.phone, null, -v_claim.points_used, 'adjust', 'แลกโปรโมชัน');
    update public.promotion_claims
      set status = 'confirmed', handled_by = public.my_member_id(), resolved_at = now()
      where id = p_claim_id returning * into v_result;
    return v_result;

  else
    raise exception 'action ต้องเป็น confirm หรือ cancel';
  end if;
end $$;
