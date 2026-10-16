-- ReachOUT initial database schema
-- Organization-aware foundation for the first release.
-- Requires PostgreSQL 15+ (column-list ON DELETE SET NULL).

create extension if not exists pgcrypto;

-- 1. Organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- 2. User profiles linked to Supabase Auth
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Organization membership and roles
create table public.organization_members (
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  role text not null
    check (role in ('ADMIN', 'MANAGER', 'AGENT')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- 4. Contacts
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  company text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

-- 5. Campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  channel text not null
    check (channel in ('sms', 'email', 'both')),
  status text not null default 'draft'
    check (status in (
      'draft', 'scheduled', 'sending',
      'completed', 'failed', 'cancelled'
    )),
  scheduled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

-- 6. Campaign recipients
create table public.campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  campaign_id uuid not null,
  contact_id uuid not null,
  status text not null default 'pending'
    check (status in (
      'pending', 'queued', 'sent',
      'delivered', 'failed', 'skipped'
    )),
  created_at timestamptz not null default now(),
  unique (campaign_id, contact_id),
  foreign key (campaign_id, organization_id)
    references public.campaigns(id, organization_id)
    on delete cascade,
  foreign key (contact_id, organization_id)
    references public.contacts(id, organization_id)
    on delete cascade
);

-- 7. Interaction history
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  contact_id uuid not null,
  campaign_id uuid,
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null
    check (channel in ('sms', 'email', 'call')),
  direction text not null default 'outbound'
    check (direction in ('inbound', 'outbound')),
  status text not null
    check (status in (
      'queued', 'sent', 'delivered',
      'failed', 'completed', 'no_answer'
    )),
  subject text,
  details text,
  provider_message_id text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (contact_id, organization_id)
    references public.contacts(id, organization_id)
    on delete cascade,
  -- Column-list SET NULL: deleting a campaign clears only campaign_id,
  -- never organization_id (which is NOT NULL).
  foreign key (campaign_id, organization_id)
    references public.campaigns(id, organization_id)
    on delete set null (campaign_id)
);

-- Indexes for common queries
create index idx_members_user
  on public.organization_members(user_id);

create index idx_contacts_org_created
  on public.contacts(organization_id, created_at desc);

create index idx_contacts_org_email
  on public.contacts(organization_id, lower(email))
  where email is not null;

create index idx_contacts_org_phone
  on public.contacts(organization_id, phone)
  where phone is not null;

create index idx_campaigns_org_created
  on public.campaigns(organization_id, created_at desc);

create index idx_campaign_contacts_campaign
  on public.campaign_contacts(campaign_id);

create index idx_interactions_org_time
  on public.interactions(organization_id, occurred_at desc);

create index idx_interactions_contact_time
  on public.interactions(contact_id, occurred_at desc);

-- Helper functions for RLS policies.
-- SECURITY DEFINER prevents membership-check recursion.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
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
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;

grant execute on function public.is_org_member(uuid)
  to authenticated;
grant execute on function public.has_org_role(uuid, text[])
  to authenticated;

-- Enable RLS on every application table.
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_contacts enable row level security;
alter table public.interactions enable row level security;

-- Organizations: members can view their own organizations.
create policy "Members can view organizations"
on public.organizations for select to authenticated
using (public.is_org_member(id));

-- Profiles: users can read and update their own profile.
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Membership: users can view their organization's membership list.
create policy "Members can view organization members"
on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));

-- Contacts: all members can view; ADMIN and MANAGER can modify.
create policy "Members can view contacts"
on public.contacts for select to authenticated
using (public.is_org_member(organization_id));

create policy "Managers can create contacts"
on public.contacts for insert to authenticated
with check (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
);

create policy "Managers can update contacts"
on public.contacts for update to authenticated
using (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
)
with check (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
);

create policy "Admins can delete contacts"
on public.contacts for delete to authenticated
using (public.has_org_role(organization_id, array['ADMIN']));

-- Campaigns: members can view; ADMIN and MANAGER can modify.
create policy "Members can view campaigns"
on public.campaigns for select to authenticated
using (public.is_org_member(organization_id));

create policy "Managers can create campaigns"
on public.campaigns for insert to authenticated
with check (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
);

create policy "Managers can update campaigns"
on public.campaigns for update to authenticated
using (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
)
with check (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
);

create policy "Admins can delete campaigns"
on public.campaigns for delete to authenticated
using (public.has_org_role(organization_id, array['ADMIN']));

-- Campaign recipients: members can view; managers can manage.
create policy "Members can view campaign recipients"
on public.campaign_contacts for select to authenticated
using (public.is_org_member(organization_id));

create policy "Managers can add campaign recipients"
on public.campaign_contacts for insert to authenticated
with check (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
);

create policy "Managers can update campaign recipients"
on public.campaign_contacts for update to authenticated
using (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
)
with check (
  public.has_org_role(organization_id, array['ADMIN', 'MANAGER'])
);

create policy "Admins can remove campaign recipients"
on public.campaign_contacts for delete to authenticated
using (public.has_org_role(organization_id, array['ADMIN']));

-- Interaction history: members can read and record events.
create policy "Members can view interactions"
on public.interactions for select to authenticated
using (public.is_org_member(organization_id));

create policy "Members can record interactions"
on public.interactions for insert to authenticated
with check (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = (select auth.uid()))
);

-- No general UPDATE or DELETE policies for interactions:
-- preserve history by default.