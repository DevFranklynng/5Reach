"use server";

import { createClient } from "@/lib/supabase/server";
import { fromContactRecord } from "@/lib/contact-utils";
import {
  fromCampaignRecord,
  getPageCount,
  getPaginationOffset,
  toCampaignRecord,
  toScheduledAtIso,
  validateCampaignChannel,
  validateCampaignName,
  validateCampaignStatus,
} from "@/lib/campaign-utils";

const campaignWriteRoles = ["ADMIN", "MANAGER"];
const campaignDeleteRoles = ["ADMIN"];
const queryBatchSize = 1000;
const campaignInputFields = new Set([
  "name",
  "description",
  "channel",
  "status",
  "scheduledAt",
]);

async function resolveCampaignContext(client) {
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError) {
    throw new Error(`Could not verify your sign-in: ${authError.message}`);
  }
  if (!authData.user) {
    throw new Error("You must be signed in to access campaigns.");
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
    throw new Error("Your account belongs to multiple organizations. Select an organization before managing campaigns.");
  }

  return {
    user: authData.user,
    organizationId: memberships[0].organization_id,
    role: memberships[0].role,
  };
}

function requireCampaignRole(role, allowedRoles) {
  if (!allowedRoles.includes(role)) {
    throw new Error("You do not have permission to perform this campaign action.");
  }
}

function normalizeCampaignInput(campaign, { partial = false } = {}) {
  if (!campaign || typeof campaign !== "object" || Array.isArray(campaign)) {
    throw new Error("Campaign details must be provided as an object.");
  }

  const unsupportedFields = Object.keys(campaign).filter((field) => !campaignInputFields.has(field));
  if (unsupportedFields.length) {
    throw new Error(`Unsupported campaign field: ${unsupportedFields.join(", ")}.`);
  }

  const normalized = { ...campaign };

  if (!partial || Object.hasOwn(campaign, "name")) {
    const result = validateCampaignName(campaign.name);
    if (!result.valid) throw new Error(result.error);
    normalized.name = result.value;
  }

  if (!partial || Object.hasOwn(campaign, "channel")) {
    const result = validateCampaignChannel(campaign.channel);
    if (!result.valid) throw new Error(result.error);
  }

  if (Object.hasOwn(campaign, "description")
    && campaign.description !== null
    && typeof campaign.description !== "string") {
    throw new Error("Campaign description must be text or empty.");
  }

  if (!partial || Object.hasOwn(campaign, "status")) {
    const status = !partial && campaign.status === undefined
      ? "draft"
      : campaign.status;
    const result = validateCampaignStatus(status);
    if (!result.valid) throw new Error(result.error);
    normalized.status = status;
  }

  if (Object.hasOwn(campaign, "scheduledAt")) {
    const result = toScheduledAtIso(campaign.scheduledAt);
    if (!result.valid) throw new Error(result.error);
    normalized.scheduledAt = result.value;
  }

  return toCampaignRecord(normalized);
}

function normalizeRecipientContactIds(contactIds) {
  if (!Array.isArray(contactIds)) {
    throw new Error("Campaign recipient contact IDs must be provided as a list.");
  }

  const uniqueIds = [...new Set(contactIds)];
  if (uniqueIds.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Every campaign recipient must have a valid contact ID.");
  }

  return uniqueIds;
}

async function validateOrganizationContacts(client, organizationId, contactIds) {
  if (!contactIds.length) return;

  const { data, error } = await client
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .in("id", contactIds);

  if (error) {
    throw new Error(`Could not validate campaign contacts: ${error.message}`);
  }

  const foundIds = new Set((data ?? []).map((contact) => contact.id));
  const missingIds = contactIds.filter((contactId) => !foundIds.has(contactId));
  if (missingIds.length) {
    throw new Error("One or more selected contacts do not belong to your organization or are unavailable.");
  }
}

async function insertRecipientAssociations(client, organizationId, campaignId, contactIds) {
  if (!contactIds.length) return;

  const recipientRows = contactIds.map((contactId) => ({
    organization_id: organizationId,
    campaign_id: campaignId,
    contact_id: contactId,
    status: "pending",
  }));

  const { error } = await client.from("campaign_contacts").insert(recipientRows);
  if (error) {
    throw new Error(`Could not save campaign recipients: ${error.message}`);
  }
}

async function removeRecipientAssociations(client, organizationId, campaignId, contactIds) {
  if (!contactIds.length) return;

  const { data, error } = await client
    .from("campaign_contacts")
    .delete()
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .in("contact_id", contactIds)
    .select("contact_id");

  if (error) {
    throw new Error(`Could not remove campaign recipients: ${error.message}`);
  }

  const removedIds = new Set((data ?? []).map((row) => row.contact_id));
  if (contactIds.some((contactId) => !removedIds.has(contactId))) {
    throw new Error("Some campaign recipients could not be removed. Check your ADMIN permissions and try again.");
  }
}

async function fetchCampaignRecipientCounts(client, organizationId, campaignIds) {
  const countsByCampaignId = {};
  if (campaignIds && campaignIds.length === 0) return countsByCampaignId;

  let offset = 0;
  let totalCount = 0;

  do {
    let query = client
      .from("campaign_contacts")
      .select("id, campaign_id", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("id", { ascending: true });

    if (campaignIds) query = query.in("campaign_id", campaignIds);

    const { data, count, error } = await query.range(
      offset,
      offset + queryBatchSize - 1
    );
    if (error) {
      throw new Error(`Could not load campaign recipient counts: ${error.message}`);
    }

    for (const row of data ?? []) {
      countsByCampaignId[row.campaign_id] = (countsByCampaignId[row.campaign_id] ?? 0) + 1;
    }

    totalCount = count ?? 0;
    offset += data?.length ?? 0;
  } while (offset < totalCount && offset > 0);

  return countsByCampaignId;
}

async function listExistingRecipientIds(client, organizationId, campaignId) {
  const contactIds = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from("campaign_contacts")
      .select("id, contact_id")
      .eq("organization_id", organizationId)
      .eq("campaign_id", campaignId)
      .order("id", { ascending: true })
      .range(offset, offset + queryBatchSize - 1);

    if (error) {
      throw new Error(`Could not load current campaign recipients: ${error.message}`);
    }

    contactIds.push(...(data ?? []).map((row) => row.contact_id));
    if (!data || data.length < queryBatchSize) return contactIds;
    offset += data.length;
  }
}

async function restoreCampaignFields(client, organizationId, campaignId, originalCampaign, updatedColumns) {
  if (!updatedColumns.length) return null;

  const restoreValues = Object.fromEntries(
    updatedColumns.map((column) => [column, originalCampaign[column]])
  );
  restoreValues.updated_at = new Date().toISOString();

  const { data, error } = await client
    .from("campaigns")
    .update(restoreValues)
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();

  if (error) return error.message;
  if (!data) return "Campaign fields could not be restored.";
  return null;
}

async function cleanupAddedRecipients(client, organizationId, campaignId, contactIds) {
  if (!contactIds.length) return null;

  const { data, error } = await client
    .from("campaign_contacts")
    .delete()
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .in("contact_id", contactIds)
    .select("contact_id");

  if (error) return error.message;

  const removedIds = new Set((data ?? []).map((row) => row.contact_id));
  if (contactIds.some((contactId) => !removedIds.has(contactId))) {
    return "Added recipients could not be fully rolled back.";
  }

  return null;
}

function safePageValues(page, pageSize) {
  const requestedPage = Number(page);
  const requestedPageSize = Number(pageSize);
  const safePage = Number.isFinite(requestedPage)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(requestedPage)))
    : 1;
  const safePageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(requestedPageSize)))
    : 20;

  return {
    page: safePage,
    pageSize: safePageSize,
    offset: getPaginationOffset(safePage, safePageSize),
  };
}

export async function listCampaigns({ page = 1, pageSize = 20, status } = {}) {
  const client = await createClient();
  const context = await resolveCampaignContext(client);
  const { organizationId } = context;
  const pagination = safePageValues(page, pageSize);

  let query = client
    .from("campaigns")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (status != null && status !== "") {
    const result = validateCampaignStatus(status);
    if (!result.valid) throw new Error(result.error);
    query = query.eq("status", status);
  }

  const { data, count, error } = await query.range(
    pagination.offset,
    pagination.offset + pagination.pageSize - 1
  );
  if (error) throw new Error(`Could not load campaigns: ${error.message}`);

  const campaigns = (data ?? []).map(fromCampaignRecord);
  const countsByCampaignId = await fetchCampaignRecipientCounts(
    client,
    organizationId,
    campaigns.map((campaign) => campaign.id)
  );

  return {
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      recipientCount: countsByCampaignId[campaign.id] ?? 0,
    })),
    pagination: {
      ...pagination,
      totalCount: count ?? 0,
      pageCount: getPageCount(count ?? 0, pagination.pageSize),
    },
    permissions: {
      canManage: campaignWriteRoles.includes(context.role),
      canDelete: campaignDeleteRoles.includes(context.role),
      canRemoveRecipients: campaignDeleteRoles.includes(context.role),
    },
  };
}

export async function createCampaign(campaign, recipientContactIds = []) {
  const client = await createClient();
  const context = await resolveCampaignContext(client);
  requireCampaignRole(context.role, campaignWriteRoles);

  const campaignRecord = normalizeCampaignInput(campaign);
  const contactIds = normalizeRecipientContactIds(recipientContactIds);
  await validateOrganizationContacts(client, context.organizationId, contactIds);

  const { data: createdCampaign, error: createError } = await client
    .from("campaigns")
    .insert({
      ...campaignRecord,
      organization_id: context.organizationId,
      created_by: context.user.id,
    })
    .select("*")
    .single();

  if (createError) throw new Error(`Could not create campaign: ${createError.message}`);

  try {
    await insertRecipientAssociations(
      client,
      context.organizationId,
      createdCampaign.id,
      contactIds
    );
  } catch (recipientError) {
    const cleanup = await client
      .from("campaigns")
      .delete()
      .eq("id", createdCampaign.id)
      .eq("organization_id", context.organizationId)
      .select("id")
      .maybeSingle();

    const associationMessage = recipientError instanceof Error
      ? recipientError.message
      : "Could not save campaign recipients.";

    if (cleanup.error || !cleanup.data) {
      const cleanupMessage = cleanup.error?.message ?? "The campaign could not be removed.";
      throw new Error(
        `Campaign recipients were not saved, and campaign cleanup failed (${cleanupMessage}). The campaign may remain without all recipients. Original error: ${associationMessage}`
      );
    }

    throw new Error(`Campaign was not created because recipient associations failed: ${associationMessage}`);
  }

  return {
    ...fromCampaignRecord(createdCampaign),
    recipientCount: contactIds.length,
  };
}

export async function updateCampaign(campaignId, changes, recipientContactIds) {
  const client = await createClient();
  const context = await resolveCampaignContext(client);
  requireCampaignRole(context.role, campaignWriteRoles);

  const campaignRecord = normalizeCampaignInput(changes, { partial: true });
  if (recipientContactIds === undefined && !Object.keys(campaignRecord).length) {
    throw new Error("Provide campaign fields or recipient changes to update.");
  }

  const { data: originalCampaign, error: lookupError } = await client
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (lookupError) throw new Error(`Could not find the campaign to update: ${lookupError.message}`);
  if (!originalCampaign) throw new Error("That campaign was not found in your organization.");

  let addedContactIds = [];
  let removedContactIds = [];
  let shouldReplaceRecipients = recipientContactIds !== undefined;
  let desiredRecipientIds = [];

  if (shouldReplaceRecipients) {
    desiredRecipientIds = normalizeRecipientContactIds(recipientContactIds);
    await validateOrganizationContacts(client, context.organizationId, desiredRecipientIds);

    const existingIds = await listExistingRecipientIds(
      client,
      context.organizationId,
      campaignId
    );
    const existingSet = new Set(existingIds);
    const desiredSet = new Set(desiredRecipientIds);
    addedContactIds = desiredRecipientIds.filter((contactId) => !existingSet.has(contactId));
    removedContactIds = existingIds.filter((contactId) => !desiredSet.has(contactId));

    if (removedContactIds.length && !campaignDeleteRoles.includes(context.role)) {
      throw new Error("Only an ADMIN can remove recipients from a campaign.");
    }
  }

  const updatedColumns = Object.keys(campaignRecord);
  let updatedCampaign = originalCampaign;

  if (updatedColumns.length) {
    const { data, error } = await client
      .from("campaigns")
      .update({ ...campaignRecord, updated_at: new Date().toISOString() })
      .eq("id", campaignId)
      .eq("organization_id", context.organizationId)
      .select("*")
      .single();

    if (error) throw new Error(`Could not update campaign: ${error.message}`);
    updatedCampaign = data;
  }

  try {
    await insertRecipientAssociations(
      client,
      context.organizationId,
      campaignId,
      addedContactIds
    );
    await removeRecipientAssociations(
      client,
      context.organizationId,
      campaignId,
      removedContactIds
    );
  } catch (recipientError) {
    const rollbackErrors = [];

    if (addedContactIds.length) {
      const cleanupError = await cleanupAddedRecipients(
        client,
        context.organizationId,
        campaignId,
        addedContactIds
      );
      if (cleanupError) rollbackErrors.push(`Added recipients could not be rolled back: ${cleanupError}`);
    }

    const campaignRestoreError = await restoreCampaignFields(
      client,
      context.organizationId,
      campaignId,
      originalCampaign,
      updatedColumns
    );
    if (campaignRestoreError) rollbackErrors.push(campaignRestoreError);

    const originalMessage = recipientError instanceof Error
      ? recipientError.message
      : "Could not update campaign recipients.";
    const rollbackMessage = rollbackErrors.length
      ? ` Rollback was incomplete: ${rollbackErrors.join(" ")}`
      : " Campaign field changes were rolled back.";

    throw new Error(`${originalMessage}${rollbackMessage}`);
  }

  const countsByCampaignId = shouldReplaceRecipients
    ? { [campaignId]: desiredRecipientIds.length }
    : await fetchCampaignRecipientCounts(client, context.organizationId, [campaignId]);

  return {
    ...fromCampaignRecord(updatedCampaign),
    recipientCount: countsByCampaignId[campaignId] ?? 0,
  };
}

export async function deleteCampaign(campaignId) {
  const client = await createClient();
  const context = await resolveCampaignContext(client);
  requireCampaignRole(context.role, campaignDeleteRoles);

  const { data, error } = await client
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("organization_id", context.organizationId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Could not delete campaign: ${error.message}`);
  if (!data) throw new Error("That campaign was not found in your organization.");

  return data.id;
}

export async function listCampaignRecipientContacts({ page = 1, pageSize = 20 } = {}) {
  const client = await createClient();
  const { organizationId } = await resolveCampaignContext(client);
  const pagination = safePageValues(page, pageSize);

  const { data, count, error } = await client
    .from("contacts")
    .select("id, first_name, last_name, email, phone, company, status, created_at", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.pageSize - 1);

  if (error) throw new Error(`Could not load contacts for campaign recipients: ${error.message}`);

  return {
    contacts: (data ?? []).map(fromContactRecord),
    pagination: {
      ...pagination,
      totalCount: count ?? 0,
      pageCount: getPageCount(count ?? 0, pagination.pageSize),
    },
  };
}

export async function listCampaignRecipientIds(campaignId) {
  const client = await createClient();
  const { organizationId } = await resolveCampaignContext(client);

  if (typeof campaignId !== "string" || !campaignId.trim()) {
    throw new Error("A valid campaign ID is required to load recipients.");
  }

  const { data, error } = await client
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error(`Could not find the campaign: ${error.message}`);
  if (!data) throw new Error("That campaign was not found in your organization.");

  return listExistingRecipientIds(client, organizationId, campaignId);
}

export async function getCampaignRecipientCounts(campaignIds) {
  const client = await createClient();
  const { organizationId } = await resolveCampaignContext(client);
  let scopedCampaignIds = null;

  if (campaignIds !== undefined) {
    if (!Array.isArray(campaignIds)) {
      throw new Error("Campaign IDs must be provided as a list.");
    }

    scopedCampaignIds = [...new Set(campaignIds)];
    if (scopedCampaignIds.some((id) => typeof id !== "string" || !id.trim())) {
      throw new Error("Every campaign must have a valid campaign ID.");
    }
  }

  return fetchCampaignRecipientCounts(client, organizationId, scopedCampaignIds);
}
