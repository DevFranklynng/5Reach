"use server";

import { createClient } from "@/lib/supabase/server";
import {
  findDuplicateContactFields,
  fromContactRecord,
  getPageCount,
  getPaginationOffset,
  toContactRecord,
  validatePhoneNumber,
} from "@/lib/contact-utils";

const contactWriteRoles = ["ADMIN", "MANAGER"];
const contactDeleteRoles = ["ADMIN"];
const duplicateCheckBatchSize = 1000;

async function resolveContactContext(client) {
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError) {
    throw new Error(`Could not verify your sign-in: ${authError.message}`);
  }
  if (!authData.user) {
    throw new Error("You must be signed in to access contacts.");
  }

  const { data: memberships, error: membershipError } = await client
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", authData.user.id);

  if (membershipError) {
    throw new Error(`Could not load your organization membership: ${membershipError.message}`);
  }
  if (!memberships?.length) {
    throw new Error("Your account is not a member of an organization.");
  }
  if (memberships.length > 1) {
    throw new Error("Your account belongs to multiple organizations. Select an organization before managing contacts.");
  }

  return {
    user: authData.user,
    organizationId: memberships[0].organization_id,
    role: memberships[0].role,
  };
}

function requireContactRole(role, allowedRoles) {
  if (!allowedRoles.includes(role)) {
    throw new Error("You do not have permission to perform this contact action.");
  }
}

function validateContactPhone(contact) {
  const result = validatePhoneNumber(contact.phone);
  if (!result.valid) throw new Error(result.error);
}

async function findOrganizationDuplicates(client, organizationId, contact, ignoredContactId) {
  const hasEmail = typeof contact.email === "string" && contact.email.trim();
  const hasPhone = typeof contact.phone === "string" && contact.phone.trim();

  if (!hasEmail && !hasPhone) return [];

  const existingContacts = [];
  let offset = 0;
  let totalCount = 0;

  do {
    let query = client
      .from("contacts")
      .select("id, email, phone", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("id", { ascending: true });

    if (ignoredContactId != null) query = query.neq("id", ignoredContactId);

    const { data, count, error } = await query.range(
      offset,
      offset + duplicateCheckBatchSize - 1
    );
    if (error) {
      throw new Error(`Could not check for duplicate contacts: ${error.message}`);
    }

    existingContacts.push(...(data ?? []));
    totalCount = count ?? 0;
    offset += data?.length ?? 0;
  } while (offset < totalCount && offset > 0);

  return findDuplicateContactFields(contact, existingContacts, ignoredContactId);
}

function throwForDuplicates(fields) {
  if (!fields.length) return;

  const labels = fields.map((field) => field === "email" ? "email address" : "phone number");
  throw new Error(`A contact with this ${labels.join(" and ")} already exists in your organization.`);
}

export async function listContacts({ page = 1, pageSize = 20, status } = {}) {
  const client = await createClient();
  const { organizationId, role } = await resolveContactContext(client);
  const requestedPage = Number(page);
  const requestedPageSize = Number(pageSize);
  const safePage = Number.isFinite(requestedPage)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(requestedPage)))
    : 1;
  const safePageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(requestedPageSize)))
    : 1;
  const offset = getPaginationOffset(safePage, safePageSize);

  let query = client
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query.range(offset, offset + safePageSize - 1);
  if (error) throw new Error(`Could not load contacts: ${error.message}`);

  return {
    contacts: (data ?? []).map(fromContactRecord),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      offset,
      totalCount: count ?? 0,
      pageCount: getPageCount(count ?? 0, safePageSize),
    },
    permissions: {
      canCreate: contactWriteRoles.includes(role),
      canUpdate: contactWriteRoles.includes(role),
      canDelete: contactDeleteRoles.includes(role),
    },
  };
}

export async function createContact(contact) {
  const client = await createClient();
  const context = await resolveContactContext(client);
  requireContactRole(context.role, contactWriteRoles);
  validateContactPhone(contact);

  if (!contact.firstName?.trim()) {
    throw new Error("A first name is required to create a contact.");
  }

  const duplicateFields = await findOrganizationDuplicates(
    client,
    context.organizationId,
    contact
  );
  throwForDuplicates(duplicateFields);

  const { data, error } = await client
    .from("contacts")
    .insert({
      ...toContactRecord(contact),
      organization_id: context.organizationId,
      created_by: context.user.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create contact: ${error.message}`);
  return fromContactRecord(data);
}

export async function updateContact(contactId, changes) {
  const client = await createClient();
  const context = await resolveContactContext(client);
  requireContactRole(context.role, contactWriteRoles);
  validateContactPhone(changes);

  if (Object.hasOwn(changes, "firstName") && !changes.firstName?.trim()) {
    throw new Error("A contact's first name cannot be empty.");
  }

  const { data: existingContact, error: lookupError } = await client
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (lookupError) throw new Error(`Could not find the contact to update: ${lookupError.message}`);
  if (!existingContact) throw new Error("That contact was not found in your organization.");

  const duplicateFields = await findOrganizationDuplicates(
    client,
    context.organizationId,
    changes,
    contactId
  );
  throwForDuplicates(duplicateFields);

  const contactChanges = toContactRecord(changes);
  if (!Object.keys(contactChanges).length) {
    throw new Error("Provide at least one contact field to update.");
  }

  const { data, error } = await client
    .from("contacts")
    .update(contactChanges)
    .eq("id", contactId)
    .eq("organization_id", context.organizationId)
    .select("*")
    .single();

  if (error) throw new Error(`Could not update contact: ${error.message}`);
  return fromContactRecord(data);
}

export async function deleteContact(contactId) {
  const client = await createClient();
  const context = await resolveContactContext(client);
  requireContactRole(context.role, contactDeleteRoles);

  const { data, error } = await client
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("organization_id", context.organizationId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Could not delete contact: ${error.message}`);
  if (!data) throw new Error("That contact was not found in your organization.");

  return data.id;
}