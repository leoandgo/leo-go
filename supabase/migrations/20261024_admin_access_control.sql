-- Admin allowlist: only users listed here may modify data
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "admin_users_read_self" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Current back-office accounts
insert into public.admin_users (user_id) select id from auth.users on conflict do nothing;

-- Admin write access (public read policies on catalog tables are unchanged)
create policy "admin_all_pricing_grids" on public.pricing_grids for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin_all_vehicles" on public.vehicles for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin_all_minute_prices" on public.minute_prices for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin_all_global_settings" on public.global_settings for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin_all_contact_requests" on public.contact_requests for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Public contact form: insert only, rows can never be read back without admin rights
create policy "public_insert_contact_requests" on public.contact_requests for insert to anon, authenticated
  with check (status = 'pending');

-- Vehicle images: public read stays, writes restricted to admins
drop policy if exists "Authenticated users can delete vehicle images" on storage.objects;
drop policy if exists "Authenticated users can update vehicle images" on storage.objects;
drop policy if exists "Authenticated users can upload vehicle images" on storage.objects;
create policy "admin_insert_vehicle_images" on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicles' and (select private.is_admin()));
create policy "admin_update_vehicle_images" on storage.objects for update to authenticated
  using (bucket_id = 'vehicles' and (select private.is_admin()))
  with check (bucket_id = 'vehicles' and (select private.is_admin()));
create policy "admin_delete_vehicle_images" on storage.objects for delete to authenticated
  using (bucket_id = 'vehicles' and (select private.is_admin()));
