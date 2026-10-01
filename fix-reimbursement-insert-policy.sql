-- Perbaikan untuk klaim yang dibuat Finance/Admin atas nama karyawan.
-- Jalankan sekali di Supabase SQL Editor.

drop policy if exists "Employees create own reimbursements" on public.reimbursements;
drop policy if exists "Finance creates reimbursements for employees" on public.reimbursements;
drop policy if exists "Employees and finance create reimbursements" on public.reimbursements;

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