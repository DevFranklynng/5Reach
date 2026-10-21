const campaignFieldMap = {
  name: "name",
  description: "description",
  channel: "channel",
  status: "status",
  scheduledAt: "scheduled_at",
};

const campaignRecordFieldMap = {
  ...campaignFieldMap,
  id: "id",
  organizationId: "organization_id",
  createdBy: "created_by",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

export const campaignChannels = ["sms", "email", "both"];
export const campaignStatuses = [
  "draft",
  "scheduled",
  "sending",
  "completed",
  "failed",
  "cancelled",
];

export function toCampaignRecord(campaign) {
  return Object.fromEntries(
    Object.entries(campaignFieldMap)
      .filter(([field]) => Object.hasOwn(campaign, field) && campaign[field] !== undefined)
      .map(([field, column]) => [column, campaign[field]])
  );
}

export function fromCampaignRecord(record) {
  if (!record) return null;

  return Object.fromEntries(
    Object.entries(campaignRecordFieldMap)
      .filter(([, column]) => Object.hasOwn(record, column))
      .map(([field, column]) => [field, record[column]])
  );
}

export function validateCampaignName(name) {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value) {
    return { valid: false, value: "", error: "A campaign name is required." };
  }

  return { valid: true, value, error: null };
}

export function validateCampaignChannel(channel) {
  if (!campaignChannels.includes(channel)) {
    return {
      valid: false,
      value: null,
      error: `Campaign channel must be one of: ${campaignChannels.join(", ")}.`,
    };
  }

  return { valid: true, value: channel, error: null };
}

export function validateCampaignStatus(status) {
  if (!campaignStatuses.includes(status)) {
    return {
      valid: false,
      value: null,
      error: `Campaign status must be one of: ${campaignStatuses.join(", ")}.`,
    };
  }

  return { valid: true, value: status, error: null };
}

export function toScheduledAtIso(value) {
  if (value == null || value === "") {
    return { valid: true, value: null, error: null };
  }

  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) {
    return {
      valid: false,
      value: null,
      error: "Scheduled date must be a valid date or left empty.",
    };
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return {
        valid: false,
        value: null,
        error: "Scheduled date must be a valid date or left empty.",
      };
    }

    return { valid: true, value: date.toISOString(), error: null };
  } catch {
    return {
      valid: false,
      value: null,
      error: "Scheduled date must be a valid date or left empty.",
    };
  }
}

export function getPaginationOffset(page, pageSize) {
  const safePage = toSafeInteger(page, 1, 1);
  const safePageSize = toSafeInteger(pageSize, 1, 1);
  const maxOffset = Number.MAX_SAFE_INTEGER - safePageSize + 1;

  return Math.min((safePage - 1) * safePageSize, maxOffset);
}

export function getPageCount(totalCount, pageSize) {
  const safeTotalCount = toSafeInteger(totalCount, 0, 0);
  const safePageSize = toSafeInteger(pageSize, 1, 1);

  return Math.ceil(safeTotalCount / safePageSize);
}

function toSafeInteger(value, fallback, minimum) {
  let numericValue;

  try {
    numericValue = Number(value);
  } catch {
    return fallback;
  }

  if (!Number.isFinite(numericValue)) return fallback;

  return Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(minimum, Math.floor(numericValue))
  );
}
