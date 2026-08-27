-- ===========================================================================
--  แบบประเมินบุคลิกภาพก่อนสัมภาษณ์งาน - Supabase schema
--  วิธีใช้: เปิด Supabase Dashboard > SQL Editor > New query > วางทั้งไฟล์ > Run
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) ตารางเก็บคำตอบ
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_responses (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  -- ข้อมูลผู้สมัคร
  full_name         text not null,
  nickname          text,
  position          text,
  email             text,
  phone             text,

  -- ผลการทำแบบประเมิน
  answers           jsonb not null,          -- {"1":"ก","2":"ค", ...}
  scores            jsonb not null,          -- {"red":3,"blue":2,"yellow":1,"green":3}
  primary_color     text not null,
  secondary_color   text,

  duration_seconds  integer,
  user_agent        text,

  -- ช่องให้ HR ใช้ภายหลัง
  hr_note           text,
  reviewed          boolean not null default false,

  constraint primary_color_valid   check (primary_color   in ('red','blue','yellow','green')),
  constraint secondary_color_valid check (secondary_color in ('red','blue','yellow','green')),
  constraint full_name_len         check (char_length(full_name) between 1 and 200),
  constraint answers_complete      check (jsonb_typeof(answers) = 'object')
);

create index if not exists assessment_responses_created_at_idx
  on public.assessment_responses (created_at desc);

create index if not exists assessment_responses_position_idx
  on public.assessment_responses (position);

-- ---------------------------------------------------------------------------
-- 2) Row Level Security
--    - ใครก็ได้ (anon) "เพิ่ม" คำตอบได้   -> ผู้สมัครภายนอกส่งแบบประเมินได้
--    - เฉพาะผู้ที่ล็อกอิน "อ่าน/แก้ไข" ได้ -> ข้อมูลผู้สมัครไม่รั่วสู่สาธารณะ
-- ---------------------------------------------------------------------------
alter table public.assessment_responses enable row level security;

drop policy if exists "anyone can submit" on public.assessment_responses;
create policy "anyone can submit"
  on public.assessment_responses
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "authenticated can read" on public.assessment_responses;
create policy "authenticated can read"
  on public.assessment_responses
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can update notes" on public.assessment_responses;
create policy "authenticated can update notes"
  on public.assessment_responses
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete" on public.assessment_responses;
create policy "authenticated can delete"
  on public.assessment_responses
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 3) มุมมองสรุป (ใช้ดูภาพรวมใน SQL Editor / Dashboard)
-- ---------------------------------------------------------------------------
create or replace view public.assessment_summary as
select
  primary_color,
  count(*)                                  as total,
  round(avg((scores->>primary_color)::int), 2) as avg_primary_score,
  round(avg(duration_seconds), 0)           as avg_seconds
from public.assessment_responses
group by primary_color
order by total desc;

-- ===========================================================================
--  สร้างบัญชี HR สำหรับเข้าหน้า admin.html:
--  Dashboard > Authentication > Users > Add user  (กรอกอีเมล + รหัสผ่าน,
--  ติ๊ก Auto Confirm User)  แล้วปิดการสมัครสมาชิกเองที่
--  Authentication > Providers > Email > ปิด "Enable sign ups"
-- ===========================================================================
