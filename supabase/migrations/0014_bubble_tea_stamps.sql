-- =====================================================================
-- เค้กที่รัก — บัตรตอกชานมไข่มุก (ซื้อ 10 แถม 1)
-- แอดมินกดเพิ่มแก้ว · ครบ 10 → count กลับ 0 + free_available +1
-- แอดมินกดใช้สิทธิ์ฟรีตอนลูกค้ามารับ
-- รันหลัง 0001_init.sql
-- =====================================================================

create table if not exists public.stamp_cards (
  member_id       uuid primary key references public.members (id) on delete cascade,
  count           integer not null default 0 check (count >= 0),
  free_available  integer not null default 0 check (free_available >= 0),
  total_earned    integer not null default 0,   -- แก้วสะสมทั้งหมด (สถิติ)
  total_redeemed  integer not null default 0,   -- ฟรีที่ใช้ไปแล้ว (สถิติ)
  updated_at      timestamptz not null default now()
);

alter table public.stamp_cards enable row level security;

-- อ่าน: เจ้าของเห็นของตัวเอง · แอดมิน (จัดการคะแนน) เห็นทุกคน
drop policy if exists stamp_select on public.stamp_cards;
create policy stamp_select on public.stamp_cards for select
  using (member_id = public.my_member_id() or public.can_manage_points());
-- เขียนผ่าน RPC (SECURITY DEFINER) เท่านั้น

-- เพิ่มแก้ว (แอดมิน) — ค้นด้วยเบอร์ · คืนสถานะบัตรล่าสุด
create or replace function public.add_stamp(p_phone text, p_qty integer default 1)
returns public.stamp_cards language plpgsql security definer set search_path = public as $$
declare
  v_member uuid;
  v_card   public.stamp_cards;
  v_new    integer;
  v_free   integer;
begin
  if not public.can_manage_points() then raise exception 'ไม่มีสิทธิ์เพิ่มแสตมป์'; end if;
  if p_qty is null or p_qty < 1 then raise exception 'จำนวนไม่ถูกต้อง'; end if;

  select id into v_member from public.members where phone = p_phone;
  if v_member is null then raise exception 'ไม่พบสมาชิกที่มีเบอร์ %', p_phone; end if;

  -- สร้างบัตรถ้ายังไม่มี
  insert into public.stamp_cards (member_id) values (v_member)
    on conflict (member_id) do nothing;

  select * into v_card from public.stamp_cards where member_id = v_member for update;

  v_new  := v_card.count + p_qty;
  v_free := v_new / 10;              -- ครบ 10 กี่ชุด
  update public.stamp_cards set
    count          = v_new % 10,     -- เศษที่เหลือ
    free_available = v_card.free_available + v_free,
    total_earned   = v_card.total_earned + p_qty,
    updated_at     = now()
  where member_id = v_member returning * into v_card;

  return v_card;
end $$;

-- ใช้สิทธิ์ฟรี 1 แก้ว (แอดมิน)
create or replace function public.redeem_stamp_free(p_phone text)
returns public.stamp_cards language plpgsql security definer set search_path = public as $$
declare
  v_member uuid;
  v_card   public.stamp_cards;
begin
  if not public.can_manage_points() then raise exception 'ไม่มีสิทธิ์ใช้สิทธิ์ฟรี'; end if;

  select id into v_member from public.members where phone = p_phone;
  if v_member is null then raise exception 'ไม่พบสมาชิกที่มีเบอร์ %', p_phone; end if;

  select * into v_card from public.stamp_cards where member_id = v_member for update;
  if not found or v_card.free_available < 1 then
    raise exception 'สมาชิกยังไม่มีสิทธิ์ฟรี';
  end if;

  update public.stamp_cards set
    free_available = free_available - 1,
    total_redeemed = total_redeemed + 1,
    updated_at     = now()
  where member_id = v_member returning * into v_card;

  return v_card;
end $$;
