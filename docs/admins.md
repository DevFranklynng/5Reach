# Platform admins

A platform admin can view and change everything in every organization:
organizations, members, profiles, contacts, campaigns, recipients and
interactions. Organization roles (ADMIN / MANAGER / AGENT) still work as
before for everyone else.

Admins can only be created from the database. No app request can promote a
user, because `platform_admins` is read-only for `anon` and `authenticated`.

## Setup

1. Run `src/migrations/initial_schema.sql`, then `src/migrations/002_platform_admins.sql`
   in the Supabase SQL editor.
2. The person must already have signed up (a row in `auth.users`).
3. Make them an admin:

```sql
select public.grant_platform_admin('you@example.com', 'founder');
```

## Remove an admin

```sql
select public.revoke_platform_admin('you@example.com');
```

## List admins

```sql
select u.email, a.note, a.granted_at
from public.platform_admins a
join auth.users u on u.id = a.user_id;
```

## In the app

```js
import { getAccessContext, hasOrgRole } from "@/lib/auth/access";

const access = await getAccessContext();
if (access.isPlatformAdmin) { /* show admin UI */ }
hasOrgRole(access, orgId, ["ADMIN", "MANAGER"]); // true for platform admins
```

This is for showing or hiding UI. Row Level Security is what actually
enforces access.

## Notes

- There is no signup trigger that creates `profiles` rows yet.
  `grant_platform_admin` creates the profile for the admin it promotes.
- The app does not have login yet, so nothing is gated in the UI today.
