-- =====================================================================
-- เค้กที่รัก — รูปการ์ดเมนูหน้าแรก (home tiles)
-- แอดมินตั้งรูปให้แต่ละเมนู (โปรโมชัน/เมนู/คูปอง/แพคเกจ/ประวัติ)
-- ถ้าไม่มีรูป หน้าแรกจะ fallback เป็นการ์ดสีแบรนด์
-- รันหลัง 0001_init.sql
-- =====================================================================

create table if not exists public.home_tiles (
  key        text primary key,
  image_url  text,
  updated_at timestamptz not null default now()
);

alter table public.home_tiles enable row level security;

drop policy if exists home_tiles_select on public.home_tiles;
create policy home_tiles_select on public.home_tiles for select
  using (auth.uid() is not null);

drop policy if exists home_tiles_manage on public.home_tiles;
create policy home_tiles_manage on public.home_tiles for all
  using (public.can_manage_all()) with check (public.can_manage_all());

drop trigger if exists trg_home_tiles_updated on public.home_tiles;
create trigger trg_home_tiles_updated before update on public.home_tiles
  for each row execute function public.set_updated_at();

-- ตั้งต้น 5 การ์ด (ยังไม่มีรูป)
insert into public.home_tiles (key) values
  ('promotions'), ('menu'), ('coupons'), ('packages'), ('history')
  on conflict (key) do nothing;
