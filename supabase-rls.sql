-- ================================================================
-- RLS Policies for n.h Menswear Language Trainer
-- Run this AFTER supabase-schema.sql
-- ================================================================

-- ── Helper: is current user a manager? ───────────────────────────
-- security definer = runs as postgres owner, bypasses RLS internally
create or replace function is_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from employees
    where auth_id = auth.uid()
      and role = 'manager'
  );
$$;

-- ================================================================
-- EMPLOYEES
-- ================================================================
-- Drop old permissive policies
drop policy if exists "employees_read_all" on employees;
drop policy if exists "employees_insert_self" on employees;
drop policy if exists "employees_update_self" on employees;

-- Anyone (including unauthenticated) can read employee names/stores
-- Required for the login lookup before auth session exists
create policy "employees_select" on employees
  for select using (true);

-- Only managers can add new employees
create policy "employees_insert" on employees
  for insert with check (is_manager());

-- Staff can link their own auth_id on first login (auth_id was null)
-- Manager can update any row
create policy "employees_update_own" on employees
  for update using (
    (auth_id is null and auth.uid() is not null)  -- first-login claim
    or auth.uid() = auth_id                        -- own record
    or is_manager()                                -- manager override
  )
  with check (
    auth.uid() = auth_id or is_manager()
  );

-- Only managers can delete employees
create policy "employees_delete" on employees
  for delete using (is_manager());

-- ================================================================
-- RESULTS
-- ================================================================
drop policy if exists "results_read_all_mvp" on results;
drop policy if exists "results_insert_all_mvp" on results;

-- Staff can only see their own results; manager sees all
create policy "results_select" on results
  for select using (
    employee_id in (select id from employees where auth_id = auth.uid())
    or is_manager()
  );

-- Staff can only insert their own results
create policy "results_insert" on results
  for insert with check (
    employee_id in (select id from employees where auth_id = auth.uid())
    or is_manager()
  );

-- ================================================================
-- MISTAKES
-- ================================================================
drop policy if exists "mistakes_read_all_mvp" on mistakes;
drop policy if exists "mistakes_insert_all_mvp" on mistakes;
drop policy if exists "mistakes_update_all_mvp" on mistakes;

create policy "mistakes_select" on mistakes
  for select using (
    employee_id in (select id from employees where auth_id = auth.uid())
    or is_manager()
  );

create policy "mistakes_insert" on mistakes
  for insert with check (
    employee_id in (select id from employees where auth_id = auth.uid())
    or is_manager()
  );

create policy "mistakes_update" on mistakes
  for update using (
    employee_id in (select id from employees where auth_id = auth.uid())
    or is_manager()
  );

-- ================================================================
-- LESSONS & PRACTICE_QUESTIONS
-- (All authenticated users can read; manager can write)
-- ================================================================
drop policy if exists "lessons_read_all" on lessons;
drop policy if exists "lessons_insert_manager_mvp" on lessons;
drop policy if exists "lessons_update_manager_mvp" on lessons;

create policy "lessons_select" on lessons
  for select using (auth.uid() is not null);

create policy "lessons_insert" on lessons
  for insert with check (is_manager());

create policy "lessons_update" on lessons
  for update using (is_manager());

drop policy if exists "questions_read_all" on practice_questions;
drop policy if exists "questions_insert_manager_mvp" on practice_questions;
drop policy if exists "questions_update_manager_mvp" on practice_questions;

create policy "questions_select" on practice_questions
  for select using (auth.uid() is not null);

create policy "questions_insert" on practice_questions
  for insert with check (is_manager());

create policy "questions_update" on practice_questions
  for update using (is_manager());

-- ================================================================
-- STORES
-- (All can read; manager can write)
-- ================================================================
alter table stores enable row level security;

create policy "stores_select" on stores
  for select using (true);

create policy "stores_insert" on stores
  for insert with check (is_manager());

create policy "stores_update" on stores
  for update using (is_manager());

create policy "stores_delete" on stores
  for delete using (is_manager());

-- ================================================================
-- STORE_SUMMARY
-- (Manager only)
-- ================================================================
drop policy if exists "store_summary_read_all" on store_summary;
drop policy if exists "store_summary_write_mvp" on store_summary;

create policy "store_summary_select" on store_summary
  for select using (is_manager());

create policy "store_summary_all" on store_summary
  for all using (is_manager()) with check (is_manager());
