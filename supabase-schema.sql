create extension if not exists pgcrypto;

-- ================================================================
-- STORES
-- ================================================================
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ================================================================
-- EMPLOYEES
-- ================================================================
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  store_name text not null default 'GINZA',
  role text not null default 'staff',           -- 'staff' | 'manager'
  auth_id uuid,                                  -- linked to auth.users(id)
  email text,                                    -- synthetic email for Supabase Auth
  join_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ================================================================
-- LESSONS
-- ================================================================
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_title text not null,
  topic_area text not null,
  youtube_url text,
  grammar_point text,
  vocabulary_json jsonb not null default '[]'::jsonb,
  example_sentences jsonb not null default '[]'::jsonb,
  difficulty_level text not null default 'beginner',
  created_at timestamptz not null default now()
);

-- ================================================================
-- PRACTICE_QUESTIONS
-- ================================================================
create table if not exists practice_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  question_type text not null check (question_type in ('fill_blank', 'match', 'roleplay')),
  question_text text not null,
  blank_answer text,
  multiple_choice jsonb,
  context text,
  created_at timestamptz not null default now()
);

-- ================================================================
-- RESULTS
-- ================================================================
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  question_id uuid references practice_questions(id) on delete set null,
  user_answer text not null,
  is_correct boolean not null default false,
  time_spent_seconds integer not null default 0,
  attempted_date timestamptz not null default now()
);

-- ================================================================
-- MISTAKES
-- ================================================================
create table if not exists mistakes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  wrong_word text not null,
  frequency integer not null default 1,
  context_example text,
  last_mistake_date timestamptz not null default now(),
  unique (employee_id, lesson_id, wrong_word)
);

-- ================================================================
-- STORE_SUMMARY
-- ================================================================
create table if not exists store_summary (
  id uuid primary key default gen_random_uuid(),
  store_name text not null unique,
  avg_score numeric(5, 2) not null default 0,
  total_study_minutes integer not null default 0,
  active_employees integer not null default 0,
  weak_vocabulary jsonb not null default '[]'::jsonb,
  last_updated timestamptz not null default now()
);

-- ================================================================
-- RLS (enable — policies are in supabase-rls.sql)
-- ================================================================
alter table employees enable row level security;
alter table lessons enable row level security;
alter table practice_questions enable row level security;
alter table results enable row level security;
alter table mistakes enable row level security;
alter table store_summary enable row level security;

-- Temporary permissive policies (replaced by supabase-rls.sql)
create policy "employees_read_all" on employees for select using (true);
create policy "employees_insert_self" on employees for insert with check (true);
create policy "employees_update_self" on employees for update using (true);
create policy "lessons_read_all" on lessons for select using (true);
create policy "lessons_insert_manager_mvp" on lessons for insert with check (true);
create policy "lessons_update_manager_mvp" on lessons for update using (true);
create policy "questions_read_all" on practice_questions for select using (true);
create policy "questions_insert_manager_mvp" on practice_questions for insert with check (true);
create policy "questions_update_manager_mvp" on practice_questions for update using (true);
create policy "results_read_all_mvp" on results for select using (true);
create policy "results_insert_all_mvp" on results for insert with check (true);
create policy "mistakes_read_all_mvp" on mistakes for select using (true);
create policy "mistakes_insert_all_mvp" on mistakes for insert with check (true);
create policy "mistakes_update_all_mvp" on mistakes for update using (true);
create policy "store_summary_read_all" on store_summary for select using (true);
create policy "store_summary_write_mvp" on store_summary for all using (true) with check (true);

-- ================================================================
-- SEED: Stores
-- ================================================================
insert into stores (name) values
  ('GINZA'), ('SHIBUYA'), ('SHINJUKU')
on conflict (name) do nothing;

-- ================================================================
-- SEED: Employees
-- ================================================================
insert into employees (name, store_name, role, email) values
  ('FUJIMURA', 'GINZA',   'staff',   'fujimura@nhmenswear.app'),
  ('ONISHI',   'GINZA',   'staff',   'onishi@nhmenswear.app'),
  ('KIM',      'GINZA',   'staff',   'kim@nhmenswear.app'),
  ('SAKATA',   'GINZA',   'staff',   'sakata@nhmenswear.app'),
  ('MANAGER',  'GINZA',   'manager', 'manager@nhmenswear.app')
on conflict (name) do nothing;

-- ================================================================
-- SEED: Sample lesson
-- ================================================================
insert into lessons (
  lesson_title, topic_area, youtube_url, grammar_point,
  vocabulary_json, example_sentences, difficulty_level
) values (
  'Size Expression',
  'Menswear fit',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Korean and Japanese place the predicate at the end. English moves the main meaning earlier.',
  '[
    {"japanese":"大きめ","english":"oversized"},
    {"japanese":"細身","english":"slim fit"},
    {"japanese":"ゆったり","english":"relaxed fit"},
    {"japanese":"大きい","english":"big"}
  ]'::jsonb,
  '[
    {"japanese":"こちらのジャケットは少し大きめです。","korean":"이 재킷은 조금 크게 나온 편입니다.","english":"This jacket runs slightly large."},
    {"japanese":"少しゆったり目でお召しいただけます。","korean":"조금 여유 있게 입으실 수 있습니다.","english":"You can wear it with a slightly relaxed fit."},
    {"japanese":"こちらは細身のシルエットです。","korean":"이쪽은 슬림한 실루엣입니다.","english":"This has a slim silhouette."}
  ]'::jsonb,
  'beginner'
)
on conflict do nothing;

-- ================================================================
-- SESSIONS (add if not exists — run this migration in Supabase)
-- ================================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  study_minutes integer not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;
create policy "sessions_read_all" on sessions for select using (true);
create policy "sessions_insert_all" on sessions for insert with check (true);

-- WEEKLY_SHEETS (add if not exists)
create table if not exists weekly_sheets (
  id uuid primary key default gen_random_uuid(),
  week_start_date date not null,
  is_hidden boolean not null default false,
  situations jsonb not null default '[]'::jsonb,
  test1_questions jsonb not null default '[]'::jsonb,
  test2_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table weekly_sheets enable row level security;
create policy "weekly_sheets_read_all" on weekly_sheets for select using (true);
create policy "weekly_sheets_write_manager" on weekly_sheets for all using (true) with check (true);
