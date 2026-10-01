-- Jalankan sekali di Supabase SQL Editor setelah schema.sql.
-- Ganti nilai di bawah dengan email yang dipakai untuk login ke KlaimKu.

begin;

insert into public.departments (name, code, head_name, active) values
  ('Finance & Accounting', 'FIN', 'Finance Manager', true),
  ('People & Culture', 'PC', null, true),
  ('Product & Technology', 'TECH', null, true),
  ('Sales & Marketing', 'GTM', null, true)
on conflict (code) do update
set name = excluded.name, active = true;

insert into public.categories (name, code, max_amount, description, active) values
  ('Perjalanan Dinas', 'TRAVEL', 5000000, 'Transportasi dan akomodasi kerja', true),
  ('Konsumsi', 'MEAL', 500000, 'Makan dan minum saat bekerja', true),
  ('Perlengkapan Kerja', 'SUPPLIES', 2000000, 'Kebutuhan penunjang pekerjaan', true),
  ('Komunikasi', 'COMMS', 750000, 'Internet dan telepon kerja', true)
on conflict (code) do update
set name = excluded.name,
    max_amount = excluded.max_amount,
    description = excluded.description,
    active = true;

do $$
declare
  admin_email text := lower(trim('sulistiaa.anii@gmail.com'));
  auth_user_id uuid;
  profile_name text;
  finance_department_id uuid;
begin
  select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
  into auth_user_id, profile_name
  from auth.users as u
  where lower(u.email) = admin_email;

  if auth_user_id is null then
    raise exception 'Akun Auth dengan email % tidak ditemukan. Buat akun dan login ke KlaimKu terlebih dahulu.', admin_email;
  end if;

  select d.id into finance_department_id
  from public.departments as d
  where d.code = 'FIN';

  insert into public.employees (auth_user_id, department_id, name, email, role, active)
  values (auth_user_id, finance_department_id, profile_name, admin_email, 'admin', true)
  on conflict (email) do update
  set auth_user_id = excluded.auth_user_id,
      department_id = excluded.department_id,
      name = excluded.name,
      role = 'admin',
      active = true;
end;
$$;

commit;