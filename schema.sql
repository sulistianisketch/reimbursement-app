-- KlaimKu: jalankan sekali pada Supabase SQL Editor.
-- Empat entitas: departments, employees, categories, reimbursements.

create extension if not exists pgcrypto;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 2 and 100),
  code text not null unique check (length(trim(code)) between 2 and 20),
  head_name text check (head_name is null or length(trim(head_name)) <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null check (length(trim(name)) between 2 and 100),
  email text not null unique check (length(trim(email)) <= 255),
  role text not null default 'employee' check (role in ('employee', 'finance', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 2 and 100),
  code text not null unique check (length(trim(code)) between 2 and 20),
  max_amount numeric(14, 2) not null check (max_amount > 0),
  description text check (description is null or length(description) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reimbursements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (length(trim(title)) between 2 and 120),
  amount numeric(14, 2) not null check (amount > 0),
  expense_date date not null check (expense_date <= current_date),
  note text check (note is null or length(note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text check (rejection_reason is null or length(rejection_reason) <= 500),
  reviewed_by uuid references public.employees(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reimbursement_rejection_reason check (status <> 'rejected' or rejection_reason is not null)
);

create index if not exists employees_department_idx on public.employees(department_id);
create index if not exists reimbursements_employee_created_idx on public.reimbursements(employee_id, created_at desc);
create index if not exists reimbursements_status_created_idx on public.reimbursements(status, created_at desc);
create index if not exists reimbursements_category_idx on public.reimbursements(category_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists departments_set_updated_at on public.departments;
create trigger departments_set_updated_at before update on public.departments for each row execute function public.set_updated_at();
drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists reimbursements_set_updated_at on public.reimbursements;
create trigger reimbursements_set_updated_at before update on public.reimbursements for each row execute function public.set_updated_at();

-- Trigger ini menjaga batas kategori juga saat request tidak berasal dari UI.
create or replace function public.enforce_reimbursement_category_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  category_limit numeric(14, 2);
begin
  select c.max_amount into category_limit
  from public.categories as c
  where c.id = new.category_id and c.active = true;

  if category_limit is null then
    raise exception 'Kategori reimbursement tidak aktif atau tidak ditemukan.';
  end if;
  if new.amount > category_limit then
    raise exception 'Nominal melampaui batas kategori sebesar %.', category_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists reimbursements_check_category_limit on public.reimbursements;
create trigger reimbursements_check_category_limit
before insert or update of category_id, amount on public.reimbursements
for each row execute function public.enforce_reimbursement_category_limit();

-- Fungsi SECURITY DEFINER hanya mengembalikan peran milik user yang sedang login.
create or replace function public.current_employee_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select e.role
  from public.employees as e
  where e.auth_user_id = (select auth.uid()) and e.active = true
  limit 1
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id
  from public.employees as e
  where e.auth_user_id = (select auth.uid()) and e.active = true
  limit 1
$$;

create or replace function public.link_employee_profile(p_name text, p_department_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_id uuid := auth.uid();
  user_email text := lower(auth.jwt() ->> 'email');
  employee_record_id uuid;
begin
  if user_id is null or user_email is null then
    raise exception 'Login diperlukan untuk membuat profil karyawan.';
  end if;

  select e.id into employee_record_id
  from public.employees as e
  where lower(e.email) = user_email and e.auth_user_id is null and e.active = true
  for update;

  if employee_record_id is not null then
    update public.employees as e set auth_user_id = user_id where e.id = employee_record_id;
    return employee_record_id;
  end if;

  insert into public.employees (auth_user_id, department_id, name, email, role, active)
  values (user_id, p_department_id, trim(p_name), user_email, 'employee', true)
  returning id into employee_record_id;

  return employee_record_id;
end;
$$;

revoke all on function public.current_employee_role() from public;
revoke all on function public.current_employee_id() from public;
revoke all on function public.link_employee_profile(text, uuid) from public;
grant execute on function public.current_employee_role() to authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.link_employee_profile(text, uuid) to authenticated;

alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.categories enable row level security;
alter table public.reimbursements enable row level security;

drop policy if exists "Authenticated users read active departments" on public.departments;
create policy "Authenticated users read active departments" on public.departments
for select to authenticated
using (active = true or (select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Finance manages departments" on public.departments;
create policy "Finance manages departments" on public.departments
for all to authenticated
using ((select public.current_employee_role()) in ('finance', 'admin'))
with check ((select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Employees read self and finance reads all" on public.employees;
create policy "Employees read self and finance reads all" on public.employees
for select to authenticated
using (auth_user_id = (select auth.uid()) or (select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Employees create own profile" on public.employees;
create policy "Employees create own profile" on public.employees
for insert to authenticated
with check (
  auth_user_id = (select auth.uid())
  and role = 'employee'
  and active = true
);

drop policy if exists "Finance manages employees" on public.employees;
create policy "Finance manages employees" on public.employees
for all to authenticated
using ((select public.current_employee_role()) in ('finance', 'admin'))
with check ((select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Authenticated users read active categories" on public.categories;
create policy "Authenticated users read active categories" on public.categories
for select to authenticated
using (active = true or (select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Finance manages categories" on public.categories;
create policy "Finance manages categories" on public.categories
for all to authenticated
using ((select public.current_employee_role()) in ('finance', 'admin'))
with check ((select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Employees read own reimbursements and finance reads all" on public.reimbursements;
create policy "Employees read own reimbursements and finance reads all" on public.reimbursements
for select to authenticated
using (employee_id = (select public.current_employee_id()) or (select public.current_employee_role()) in ('finance', 'admin'));

drop policy if exists "Employees create own reimbursements" on public.reimbursements;
drop policy if exists "Finance creates reimbursements for employees" on public.reimbursements;
create policy "Employees and finance create reimbursements" on public.reimbursements
for insert to authenticated
with check (
  (
    employee_id = (select public.current_employee_id())
    or (select public.current_employee_role()) in ('finance', 'admin')
  )
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Finance updates reimbursements" on public.reimbursements;
create policy "Finance updates reimbursements" on public.reimbursements
for update to authenticated
using ((select public.current_employee_role()) in ('finance', 'admin'))
with check ((select public.current_employee_role()) in ('finance', 'admin'));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update on public.reimbursements to authenticated;

-- Data awal opsional: buka komentar dan sesuaikan dengan struktur organisasi.
-- insert into public.departments (name, code, head_name) values
--   ('Finance & Accounting', 'FIN', 'Nama Kepala Finance'),
--   ('People & Culture', 'PC', 'Nama Kepala HR'),
--   ('Product & Technology', 'TECH', 'Nama Kepala Teknologi');
-- insert into public.categories (name, code, max_amount, description) values
--   ('Perjalanan Dinas', 'TRAVEL', 5000000, 'Transportasi dan akomodasi kerja'),
--   ('Konsumsi', 'MEAL', 500000, 'Makan dan minum saat bekerja'),
--   ('Perlengkapan Kerja', 'SUPPLIES', 2000000, 'Kebutuhan penunjang pekerjaan');