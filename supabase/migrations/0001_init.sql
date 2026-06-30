-- =====================================================================
-- เค้กที่รัก — Phase 1: Schema + Functions + RLS
-- รันไฟล์นี้ "ครั้งเดียว" ใน Supabase SQL Editor (Database > SQL Editor)
-- รันไฟล์ 0002_seed.sql ต่อหลังจากนี้ (อย่าลืมแก้ owner_email)
-- =====================================================================

-- ---------- ประเภท role (4 บทบาท) ----------
do $$ begin
  create type public.member_role as enum ('super_admin', 'developer', 'admin', 'member');
exception when duplicate_object then null; end $$;

-- ---------- helper: อัปเดต updated_at อัตโนมัติ ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================
-- ตาราง
-- =====================================================================

-- 9.1 members (สมาชิก)
create table if not exists public.members (
  id             uuid primary key default gen_random_uuid(),
  auth_id        uuid unique references auth.users (id) on delete cascade,
  provider       text,                       -- 'line' / 'google'
  display_name   text,
  last_name      text,
  birthday       date,
  phone          text unique,                -- ใช้ค้นหาตอนเพิ่มคะแนน, กรอกแล้วแก้ไม่ได้
  email          text,
  photo_url      text,
  role           public.member_role not null default 'member',
  points_balance integer not null default 0 check (points_balance >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_members_phone on public.members (phone);
create index if not exists idx_members_role on public.members (role);

-- 9.2 point_transactions (รายการคะแนน) — เป็น ledger ห้ามแก้/ลบ
create table if not exists public.point_transactions (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,
  type          text not null check (type in ('earn', 'adjust')),
  bill_amount   numeric(10, 2),             -- ยอดบิล (เฉพาะ earn)
  points        integer not null,           -- บวก=เพิ่ม / ลบ=ลด
  balance_after integer not null,
  created_by    uuid references public.members (id),  -- แอดมินผู้ทำรายการ
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_pt_member on public.point_transactions (member_id, created_at desc);

-- 9.3 promotions (โปรโมชัน)
create table if not exists public.promotions (
  id             uuid primary key default gen_random_uuid(),
  title_th       text,
  title_en       text,
  description_th text,
  description_en text,
  image_url      text,
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 9.4 special_packages (แพคเกจพิเศษ) — default ปิด (หน้าบ้านขึ้น "เร็วๆ นี้")
create table if not exists public.special_packages (
  id             uuid primary key default gen_random_uuid(),
  name_th        text,
  name_en        text,
  price          numeric(10, 2),
  description_th text,
  description_en text,
  image_url      text,
  is_active      boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 9.5 coupons (คูปองรายเดือน)
create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  name_th           text,
  name_en           text,
  image_url         text,
  max_uses_per_user integer not null default 1 check (max_uses_per_user >= 1),
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 9.6 coupon_redemptions (การใช้คูปอง) — period = 'YYYY-MM' ใช้นับสิทธิ์รายเดือน
create table if not exists public.coupon_redemptions (
  id        uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  period    text not null,
  used_at   timestamptz not null default now()
);
create index if not exists idx_redemption_count
  on public.coupon_redemptions (coupon_id, member_id, period);

-- 9.7 menu_images (รูปเมนู)
create table if not exists public.menu_images (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 9.8a settings (ตั้งค่าสาธารณะ — สมาชิกอ่านได้: ลิงก์ + toggle เมนู)
create table if not exists public.settings (
  id               boolean primary key default true check (id),  -- singleton 1 แถว
  google_map_url   text,
  facebook_url     text,
  show_promotions  boolean not null default true,
  show_coupons     boolean not null default true,
  show_packages    boolean not null default false,
  telegram_enabled boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- 9.8b secure_settings (ตั้งค่าลับ — เฉพาะ developer/super_admin + server)
-- Bot Token ไม่เปิดให้ฝั่ง client อ่าน (ตาม SRS ข้อ 8)
create table if not exists public.secure_settings (
  id                 boolean primary key default true check (id),
  telegram_bot_token text,
  telegram_chat_id   text,
  owner_email        text,                  -- อีเมลเจ้าของร้าน → auto เป็น super_admin ครั้งแรก
  updated_at         timestamptz not null default now()
);

-- =====================================================================
-- ฟังก์ชันช่วยตรวจสิทธิ์ (SECURITY DEFINER เพื่อเลี่ยง RLS recursion)
-- =====================================================================
create or replace function public.my_role()
returns public.member_role language sql stable security definer set search_path = public as $$
  select role from public.members where auth_id = auth.uid()
$$;

create or replace function public.my_member_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.members where auth_id = auth.uid()
$$;

-- เพิ่ม/ลดคะแนนได้: admin, developer, super_admin
create or replace function public.can_manage_points()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin', 'developer', 'super_admin'), false)
$$;

-- จัดการทุกอย่าง (สมาชิก/เนื้อหา/ตั้งค่า/role): developer, super_admin
create or replace function public.can_manage_all()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('developer', 'super_admin'), false)
$$;

-- =====================================================================
-- Trigger ป้องกันข้อมูล members (กัน privilege escalation + ฟิลด์ห้ามแก้)
-- =====================================================================

-- ก่อน INSERT: บังคับสิทธิ์ role + auto super_admin ให้เจ้าของร้าน
create or replace function public.members_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_privileged boolean := (coalesce(current_setting('app.privileged', true), '') = 'on');
  v_owner      text;
  v_has_super  boolean;
begin
  if not v_privileged then
    -- ห้ามตั้ง super_admin เว้นแต่ผู้ทำเป็น super_admin เอง
    if new.role = 'super_admin' and coalesce(public.my_role(), 'member') <> 'super_admin' then
      raise exception 'เฉพาะ super_admin เท่านั้นที่ตั้ง super_admin ได้';
    end if;

    -- คนสมัครเอง (ไม่ใช่ผู้จัดการ) → บังคับเป็น member ก่อน
    if not public.can_manage_all() then
      new.role := 'member';
      -- ยกเว้น: อีเมลเจ้าของร้าน และยังไม่มี super_admin → ตั้งให้เป็น super_admin
      select owner_email into v_owner from public.secure_settings where id = true;
      if v_owner is not null and new.email is not null and lower(new.email) = lower(v_owner) then
        select exists(select 1 from public.members where role = 'super_admin') into v_has_super;
        if not v_has_super then
          new.role := 'super_admin';
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;

create or replace trigger trg_members_before_insert
  before insert on public.members
  for each row execute function public.members_before_insert();

-- ก่อน UPDATE: ฟิลด์ห้ามแก้ + role/คะแนน/เบอร์ ต้องผ่านฟังก์ชันเฉพาะ
create or replace function public.members_before_update()
returns trigger language plpgsql as $$
declare
  v_privileged boolean := (coalesce(current_setting('app.privileged', true), '') = 'on');
begin
  -- ฟิลด์ระบบ ห้ามแก้เด็ดขาด
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
  end if;

  new.updated_at := now();
  return new;
end $$;

create or replace trigger trg_members_before_update
  before update on public.members
  for each row execute function public.members_before_update();

-- updated_at สำหรับตารางอื่น
create or replace trigger trg_promotions_updated before update on public.promotions
  for each row execute function public.set_updated_at();
create or replace trigger trg_packages_updated before update on public.special_packages
  for each row execute function public.set_updated_at();
create or replace trigger trg_coupons_updated before update on public.coupons
  for each row execute function public.set_updated_at();
create or replace trigger trg_settings_updated before update on public.settings
  for each row execute function public.set_updated_at();
create or replace trigger trg_secure_settings_updated before update on public.secure_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RPC: add_points — เพิ่ม/ลดคะแนน (ทุก 300 บาท = 1 คะแนน, ปัดลง)
-- =====================================================================
create or replace function public.add_points(
  p_phone  text,
  p_bill   numeric default null,
  p_points integer default null,
  p_type   text default 'earn',
  p_note   text default null
)
returns public.point_transactions
language plpgsql security definer set search_path = public as $$
declare
  v_actor       uuid := public.my_member_id();
  v_member      public.members;
  v_points      integer;
  v_new_balance integer;
  v_tx          public.point_transactions;
begin
  if not public.can_manage_points() then
    raise exception 'ไม่มีสิทธิ์เพิ่ม/ลดคะแนน';
  end if;

  select * into v_member from public.members where phone = p_phone;
  if not found then
    raise exception 'ไม่พบสมาชิกที่มีเบอร์ %', p_phone;
  end if;

  if p_type = 'earn' then
    if p_bill is null or p_bill < 0 then
      raise exception 'ยอดบิลไม่ถูกต้อง';
    end if;
    v_points := floor(p_bill / 300)::int;        -- สูตรคะแนน
  elsif p_type = 'adjust' then
    if p_points is null then
      raise exception 'ต้องระบุจำนวนคะแนนสำหรับการปรับ (บวก=เพิ่ม, ลบ=ลด)';
    end if;
    v_points := p_points;
  else
    raise exception 'type ต้องเป็น earn หรือ adjust';
  end if;

  v_new_balance := v_member.points_balance + v_points;
  if v_new_balance < 0 then
    raise exception 'คะแนนคงเหลือติดลบไม่ได้ (คงเหลือ %, ปรับ %)', v_member.points_balance, v_points;
  end if;

  perform set_config('app.privileged', 'on', true);  -- อนุญาตแก้คะแนนผ่านฟังก์ชันนี้
  update public.members set points_balance = v_new_balance where id = v_member.id;

  insert into public.point_transactions (member_id, type, bill_amount, points, balance_after, created_by, note)
  values (v_member.id, p_type, p_bill, v_points, v_new_balance, v_actor, p_note)
  returning * into v_tx;

  return v_tx;
end $$;

-- =====================================================================
-- RPC: set_role — กำหนด role (กติกากัน privilege escalation)
-- =====================================================================
create or replace function public.set_role(p_member_id uuid, p_role public.member_role)
returns public.members
language plpgsql security definer set search_path = public as $$
declare
  v_actor_role public.member_role := public.my_role();
  v_target     public.members;
  v_result     public.members;
begin
  if not public.can_manage_all() then
    raise exception 'ไม่มีสิทธิ์กำหนด role';
  end if;

  select * into v_target from public.members where id = p_member_id;
  if not found then
    raise exception 'ไม่พบสมาชิก';
  end if;

  -- แตะ super_admin ได้เฉพาะ super_admin เท่านั้น (ตั้งเป็น หรือถอดออก)
  if (p_role = 'super_admin' or v_target.role = 'super_admin') and v_actor_role <> 'super_admin' then
    raise exception 'เฉพาะ super_admin เท่านั้นที่จัดการตำแหน่ง super_admin ได้';
  end if;

  perform set_config('app.privileged', 'on', true);

  -- ตั้ง super_admin = โอนตำแหน่ง (มีได้คนเดียว) → ลดเจ้าของเดิมเป็น developer
  if p_role = 'super_admin' then
    update public.members set role = 'developer' where role = 'super_admin' and id <> p_member_id;
  end if;

  update public.members set role = p_role where id = p_member_id returning * into v_result;
  return v_result;
end $$;

-- =====================================================================
-- เปิด Row Level Security ทุกตาราง
-- =====================================================================
alter table public.members enable row level security;
alter table public.point_transactions enable row level security;
alter table public.promotions enable row level security;
alter table public.special_packages enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.menu_images enable row level security;
alter table public.settings enable row level security;
alter table public.secure_settings enable row level security;

-- ---------- members ----------
create policy members_select on public.members for select
  using (auth_id = auth.uid() or public.can_manage_points());
create policy members_insert_self on public.members for insert
  with check (auth_id = auth.uid());
create policy members_insert_manage on public.members for insert
  with check (public.can_manage_all());
create policy members_update_self on public.members for update
  using (auth_id = auth.uid()) with check (auth_id = auth.uid());
create policy members_update_manage on public.members for update
  using (public.can_manage_all()) with check (public.can_manage_all());
create policy members_delete_manage on public.members for delete
  using (public.can_manage_all());

-- ---------- point_transactions (insert/update/delete เฉพาะผ่าน RPC) ----------
create policy pt_select on public.point_transactions for select
  using (member_id = public.my_member_id() or public.can_manage_points());

-- ---------- promotions ----------
create policy promo_select on public.promotions for select
  using (public.can_manage_all()
         or (is_active and coalesce((select show_promotions from public.settings where id), false)));
create policy promo_manage on public.promotions for all
  using (public.can_manage_all()) with check (public.can_manage_all());

-- ---------- special_packages ----------
create policy pkg_select on public.special_packages for select
  using (public.can_manage_all()
         or (is_active and coalesce((select show_packages from public.settings where id), false)));
create policy pkg_manage on public.special_packages for all
  using (public.can_manage_all()) with check (public.can_manage_all());

-- ---------- coupons ----------
create policy coupon_select on public.coupons for select
  using (public.can_manage_all()
         or (is_active and coalesce((select show_coupons from public.settings where id), false)));
create policy coupon_manage on public.coupons for all
  using (public.can_manage_all()) with check (public.can_manage_all());

-- ---------- coupon_redemptions ----------
-- หมายเหตุ: การจำกัดจำนวนครั้ง/เดือน จะบังคับผ่าน RPC redeem_coupon ใน Phase 4
create policy redemption_select on public.coupon_redemptions for select
  using (member_id = public.my_member_id() or public.can_manage_points());
create policy redemption_insert_self on public.coupon_redemptions for insert
  with check (member_id = public.my_member_id());

-- ---------- menu_images ----------
create policy menu_select on public.menu_images for select
  using (auth.uid() is not null);
create policy menu_manage on public.menu_images for all
  using (public.can_manage_all()) with check (public.can_manage_all());

-- ---------- settings (สาธารณะอ่านได้ / จัดการเฉพาะ manager) ----------
create policy settings_select on public.settings for select
  using (auth.uid() is not null);
create policy settings_manage on public.settings for all
  using (public.can_manage_all()) with check (public.can_manage_all());

-- ---------- secure_settings (เฉพาะ manager + service role) ----------
create policy secure_settings_manage on public.secure_settings for all
  using (public.can_manage_all()) with check (public.can_manage_all());

-- =====================================================================
-- Storage: bucket "images" (อ่านสาธารณะ / อัปโหลด-แก้-ลบ เฉพาะ manager)
-- =====================================================================
insert into storage.buckets (id, name, public)
  values ('images', 'images', true)
  on conflict (id) do nothing;

create policy "images public read" on storage.objects for select
  using (bucket_id = 'images');
create policy "images manager insert" on storage.objects for insert
  with check (bucket_id = 'images' and public.can_manage_all());
create policy "images manager update" on storage.objects for update
  using (bucket_id = 'images' and public.can_manage_all());
create policy "images manager delete" on storage.objects for delete
  using (bucket_id = 'images' and public.can_manage_all());

-- =====================================================================
-- สิทธิ์ระดับตาราง/ฟังก์ชัน (RLS เป็นด่านจริง ด่านนี้แค่เปิดทาง)
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
