import { createClient } from "@/lib/supabase/server";

/**
 * Who is the current user and what can they do?
 *
 * Use this in Server Components / route handlers to decide what UI to show.
 * It is for UI gating only: the real enforcement is Row Level Security in
 * the database (see src/migrations/002_platform_admins.sql), so a hidden
 * button is never the only thing stopping a request.
 */
export async function getAccessContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isPlatformAdmin: false, memberships: [] };
  }

  const [adminResult, membershipResult] = await Promise.all([
    supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id),
  ]);

  return {
    user,
    isPlatformAdmin: Boolean(adminResult.data),
    memberships: membershipResult.data ?? [],
  };
}

/**
 * Can this user act in the given organization with one of the given roles?
 * Platform admins can act in every organization.
 */
export function hasOrgRole(access, organizationId, allowedRoles) {
  if (access.isPlatformAdmin) return true;
  return access.memberships.some(
    (m) =>
      m.organization_id === organizationId && allowedRoles.includes(m.role)
  );
}

/** Throws unless the current user is a platform admin. */
export async function requirePlatformAdmin() {
  const access = await getAccessContext();
  if (!access.isPlatformAdmin) {
    throw new Error("Platform admin access required");
  }
  return access;
}
