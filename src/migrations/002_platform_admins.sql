-- ReachOUT platform admins
-- Adds a platform-wide "admin" that can see and do everything, across every
-- organization. Admins are created ONLY from the database (SQL editor or
-- service role); no client request can promote a user.
-- Run after initial_schema.sql.

-- 1. Who is a platform admin.
--    Deliberately a separate table (not a column on profiles): users are
--    allowed to UPDATE their own profile row, so an `is_admin` column there
--    would let anyone promote themselves.
create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  granted_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Clients may only read. All writes go through the functions below
-- (or directly in the SQL editor, which runs as the postgres owner).
revoke all on table public.platform_admins from anon, authenticated;
grant select on table public.platform_admins to authenticated;

-- 2. Admin check used by every policy.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- 3. Make the existing helpers admin-aware.
--    Every existing policy goes through these two functions, so admins now
--    pass all of them (view, create, update, delete) in every organization.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
    );
$$;

create or replace function public.has_org_role(
  target_org uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
        and m.role = any(allowed_roles)
    );
$$;

-- 4. Full-access policies for admins.
--    The helpers above only cover operations that already have a policy.
--    These fill the gaps (no policy existed for creating organizations,
--    managing members, reading other profiles, or editing/deleting
--    interactions), so admins can do everything on every table.
create policy "Platform admins have full access to organizations"
on public.organizations for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins have full access to profiles"
on public.profiles for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins have full access to organization members"
on public.organization_members for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins have full access to contacts"
on public.contacts for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins have full access to campaigns"
on public.campaigns for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins have full access to campaign recipients"
on public.campaign_contacts for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins have full access to interactions"
on public.interactions for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- Users can see their own admin row (lets the app check "am I an admin?");
-- admins can see the whole list.
create policy "Users can view own admin row"
on public.platform_admins for select to authenticated
using (user_id = (select auth.uid()));

create policy "Platform admins can view all admins"
on public.platform_admins for select to authenticated
using (public.is_platform_admin());

-- 5. Grant / revoke by email, from the SQL editor.
--    Not executable by anon or authenticated: only the postgres owner
--    (SQL editor) and service_role can call these.
create or replace function public.grant_platform_admin(
  target_email text,
  admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  select u.id into target_id
  from auth.users u
  where lower(u.email) = lower(trim(target_email));

  if target_id is null then
    raise exception 'No auth user found with email %', target_email;
  end if;

  -- Make sure the admin has a profile row (there is no signup trigger yet).
  insert into public.profiles (id) values (target_id)
  on conflict (id) do nothing;

  insert into public.platform_admins (user_id, note)
  values (target_id, admin_note)
  on conflict (user_id) do update
    set note = coalesce(excluded.note, public.platform_admins.note);

  return target_id;
end;
$$;

create or replace function public.revoke_platform_admin(target_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from public.platform_admins a
  using auth.users u
  where a.user_id = u.id
    and lower(u.email) = lower(trim(target_email));

  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

revoke all on function public.grant_platform_admin(text, text)
  from public, anon, authenticated;
revoke all on function public.revoke_platform_admin(text)
  from public, anon, authenticated;
grant execute on function public.grant_platform_admin(text, text)
  to service_role;
grant execute on function public.revoke_platform_admin(text)
  to service_role;

-- Usage (SQL editor):
--   select public.grant_platform_admin('you@example.com', 'founder');
--   select public.revoke_platform_admin('you@example.com');
--   select u.email, a.granted_at, a.note
--     from public.platform_admins a join auth.users u on u.id = a.user_id;
