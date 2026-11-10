-- PartnerAssess database setup
-- Paste this whole script into Supabase > SQL Editor and click Run. It is safe to run once on a new project.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  org_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_name text not null,
  entity_type text not null check (entity_type in ('Corporate', 'Foundation', 'Business')),
  scores jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  summary text,
  total_score numeric,
  tier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assessments_user_idx on public.assessments (user_id, updated_at desc);

create table if not exists public.app_settings (
  key text primary key,
  value text
);

-- Helper that checks whether the signed-in user is an admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile for every new sign-up. The very first account becomes the admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, org_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'org_name',
    case when exists (select 1 from public.profiles) then 'member' else 'admin' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "assessments read" on public.assessments;
create policy "assessments read" on public.assessments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "assessments insert" on public.assessments;
create policy "assessments insert" on public.assessments for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "assessments update" on public.assessments;
create policy "assessments update" on public.assessments for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "assessments delete" on public.assessments;
create policy "assessments delete" on public.assessments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "settings read" on public.app_settings;
create policy "settings read" on public.app_settings for select to authenticated using (true);

drop policy if exists "settings admin write" on public.app_settings;
create policy "settings admin write" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Table permissions for signed-in users (row level security still applies).
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.app_settings to authenticated;

-- To make another person an admin later, run:
--   update public.profiles set role = 'admin' where email = 'person@example.com';
