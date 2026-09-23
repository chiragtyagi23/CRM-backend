const { Op, fn, col, where: sqlWhere } = require("sequelize");
const { CampaignMaster, CaptureLead, CrmSignup } = require("../models");
const { userCanAccessModule } = require("./acl.service");
const { MODULE_KEYS } = require("../acl/permissionMap");

/** List payloads skip heavy JSONB — load those only on get-by-id. */
const LIST_ATTRIBUTES = [
  "id",
  "campaignId",
  "source",
  "firstCallDate",
  "callBy",
  "name",
  "number",
  "email",
  "whatsappNumber",
  "bhk",
  "budget",
  "resiLocation",
  "propertyOwnership",
  "workLocation",
  "workProfile",
  "industryType",
  "preferredLocation",
  "possessionDate",
  "status",
  "leadScore",
  "propertyBuyingStage",
  "callbackDate",
  "callbackTime",
  "externalLeadId",
  "created_at",
  "updated_at",
];

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function isLeadUnassigned(lead) {
  return !normalizeName(lead?.callBy);
}

async function resolveCurrentUserName(req) {
  let name = String(req.user?.name || "").trim();
  if (!name && req.user?.sub) {
    const me = await CrmSignup.findByPk(req.user.sub);
    name = String(me?.name || "").trim();
  }
  return name;
}

/** Full admins who manage all campaigns — see all leads (including unassigned). */
async function canBypassLeadIsolation(userId) {
  const [canAssignCampaigns, canEditCampaigns] = await Promise.all([
    userCanAccessModule(userId, MODULE_KEYS.campaign.assignTo),
    userCanAccessModule(userId, MODULE_KEYS.campaign.edit),
  ]);
  return canAssignCampaigns && canEditCampaigns;
}

async function loadCampaignAssignToById(campaignIds) {
  const ids = [...new Set(campaignIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const rows = await CampaignMaster.findAll({
    where: { id: ids },
    attributes: ["id", "assignTo"],
  });

  const map = new Map();
  for (const row of rows) {
    map.set(String(row.id), normalizeName(row.assignTo));
  }
  return map;
}

async function loadCampaignIdsAssignedTo(managerNameNorm) {
  if (!managerNameNorm) return [];
  const rows = await CampaignMaster.findAll({
    attributes: ["id"],
    where: sqlWhere(fn("LOWER", fn("TRIM", col("assign_to"))), managerNameNorm),
  });
  return rows.map((row) => String(row.id));
}

/** Campaign leads: visible when campaign.assign_to matches the manager. */
function isCampaignLeadVisible(lead, managerNameNorm, campaignAssignToById) {
  const campaignId = String(lead.campaignId || "").trim();
  const assignToNorm = campaignAssignToById.get(campaignId);
  if (assignToNorm === undefined) return false;
  return Boolean(managerNameNorm) && assignToNorm === managerNameNorm;
}

/**
 * Non-admin visibility:
 * - Unassigned leads (no callBy) → hidden (admin-only)
 * - Assigned to current user → visible
 * - Otherwise, campaign-linked leads visible only if campaign is assigned to the user
 */
function isLeadVisibleToUser(lead, managerNameNorm, campaignAssignToById) {
  if (isLeadUnassigned(lead)) return false;

  const callByNorm = normalizeName(lead.callBy);
  if (managerNameNorm && callByNorm === managerNameNorm) return true;

  const campaignId = String(lead.campaignId || "").trim();
  if (!campaignId) return false;
  return isCampaignLeadVisible(lead, managerNameNorm, campaignAssignToById);
}

async function buildVisibilityWhere(req) {
  const userId = req.user?.sub;
  if (!userId) return { where: { id: { [Op.in]: [] } } };

  const where = {};
  const isAdmin = await canBypassLeadIsolation(userId);
  if (isAdmin) return { where, isAdmin: true };

  const managerNameNorm = normalizeName(await resolveCurrentUserName(req));
  const myCampaignIds = await loadCampaignIdsAssignedTo(managerNameNorm);

  const visibilityOr = [sqlWhere(fn("LOWER", fn("TRIM", col("call_by"))), managerNameNorm)];
  if (myCampaignIds.length > 0) {
    visibilityOr.push({ campaignId: { [Op.in]: myCampaignIds } });
  }

  Object.assign(where, {
    callBy: { [Op.ne]: null },
    [Op.and]: [
      sqlWhere(fn("TRIM", col("call_by")), { [Op.ne]: "" }),
      { [Op.or]: visibilityOr },
    ],
  });

  return { where, isAdmin: false };
}

function appendListFilters(baseWhere, { campaignId, q, status, score, source } = {}) {
  const clauses = [];
  if (baseWhere && Object.keys(baseWhere).length > 0) {
    clauses.push(baseWhere);
  }

  const scopedCampaignId = String(campaignId || "").trim();
  if (scopedCampaignId) clauses.push({ campaignId: scopedCampaignId });

  const statusRaw = String(status || "").trim();
  if (statusRaw && statusRaw.toLowerCase() !== "all") {
    const normalizedStatus = statusRaw.replace(/_/g, " ").toUpperCase();
    clauses.push(sqlWhere(fn("UPPER", fn("TRIM", col("status"))), normalizedStatus));
  }

  const scoreRaw = String(score || "").trim();
  if (scoreRaw && scoreRaw.toLowerCase() !== "all") {
    clauses.push(sqlWhere(fn("UPPER", fn("TRIM", col("lead_score"))), scoreRaw.toUpperCase()));
  }

  const sourceRaw = String(source || "").trim();
  if (sourceRaw && sourceRaw.toLowerCase() !== "all") {
    clauses.push(sqlWhere(fn("LOWER", fn("TRIM", col("source"))), sourceRaw.toLowerCase()));
  }

  const query = String(q || "").trim();
  if (query) {
    const like = `%${query.replace(/[%_]/g, "\\$&")}%`;
    clauses.push({
      [Op.or]: [
        { name: { [Op.iLike]: like } },
        { number: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        { source: { [Op.iLike]: like } },
        { resiLocation: { [Op.iLike]: like } },
        { callBy: { [Op.iLike]: like } },
      ],
    });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { [Op.and]: clauses };
}

/**
 * Fast path: filter in SQL + omit heavy JSONB columns for list endpoints.
 * Pass page/pageSize for server pagination; omit them to return the full visible set.
 */
async function findVisibleLeadsForUser(req, opts = {}) {
  const userId = req.user?.sub;
  if (!userId) {
    return { items: [], total: 0, page: 1, pageSize: 0 };
  }

  const visibility = await buildVisibilityWhere(req);
  const where = appendListFilters(visibility.where, opts);

  const pageRaw = opts.page != null ? Number(opts.page) : null;
  const pageSizeRaw = opts.pageSize != null ? Number(opts.pageSize) : null;
  const paginate =
    Number.isFinite(pageRaw) &&
    pageRaw >= 1 &&
    Number.isFinite(pageSizeRaw) &&
    pageSizeRaw >= 1;

  const page = paginate ? Math.floor(pageRaw) : 1;
  const pageSize = paginate ? Math.min(100, Math.floor(pageSizeRaw)) : null;

  const query = {
    where,
    attributes: LIST_ATTRIBUTES,
    order: [["created_at", "DESC"]],
  };

  if (paginate) {
    query.limit = pageSize;
    query.offset = (page - 1) * pageSize;
    const { rows, count } = await CaptureLead.findAndCountAll(query);
    return {
      items: rows,
      total: count,
      page,
      pageSize,
    };
  }

  const items = await CaptureLead.findAll(query);
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length,
  };
}

async function filterLeadsForUser(leads, req) {
  const userId = req.user?.sub;
  if (!userId) return [];
  if (await canBypassLeadIsolation(userId)) return leads;

  const managerNameNorm = normalizeName(await resolveCurrentUserName(req));
  const campaignIds = leads.map((lead) => lead.campaignId).filter(Boolean);
  const campaignAssignToById = await loadCampaignAssignToById(campaignIds);

  return leads.filter((lead) => isLeadVisibleToUser(lead, managerNameNorm, campaignAssignToById));
}

async function assertLeadAccessible(lead, req) {
  const userId = req.user?.sub;
  if (!userId) return false;
  if (await canBypassLeadIsolation(userId)) return true;

  const managerNameNorm = normalizeName(await resolveCurrentUserName(req));
  const campaignId = String(lead.campaignId || "").trim();
  const campaignAssignToById = campaignId ? await loadCampaignAssignToById([campaignId]) : new Map();

  return isLeadVisibleToUser(lead, managerNameNorm, campaignAssignToById);
}

module.exports = {
  LIST_ATTRIBUTES,
  assertLeadAccessible,
  canBypassLeadIsolation,
  filterLeadsForUser,
  findVisibleLeadsForUser,
  isLeadUnassigned,
  isLeadVisibleToUser,
  loadCampaignAssignToById,
  resolveCurrentUserName,
};
