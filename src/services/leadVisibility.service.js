const { CampaignMaster, CrmSignup } = require("../models");
const { userCanAccessModule } = require("./acl.service");
const { MODULE_KEYS } = require("../acl/permissionMap");

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

async function resolveCurrentUserName(req) {
  let name = String(req.user?.name || "").trim();
  if (!name && req.user?.sub) {
    const me = await CrmSignup.findByPk(req.user.sub);
    name = String(me?.name || "").trim();
  }
  return name;
}

/** Full admins who manage all campaigns — see all leads. Managers with leads.assignto still only see their campaigns. */
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

/** Non-campaign leads: all managers see them (only campaign-linked leads are isolated). */
function isNonCampaignLeadVisible() {
  return true;
}

/** Campaign leads: visible only when campaign.assign_to matches the manager. */
function isCampaignLeadVisible(lead, managerNameNorm, campaignAssignToById) {
  const campaignId = String(lead.campaignId || "").trim();
  const assignToNorm = campaignAssignToById.get(campaignId);
  if (assignToNorm === undefined) return false;
  return Boolean(managerNameNorm) && assignToNorm === managerNameNorm;
}

function isLeadVisibleToUser(lead, managerNameNorm, campaignAssignToById) {
  const campaignId = String(lead.campaignId || "").trim();
  if (!campaignId) return isNonCampaignLeadVisible();
  return isCampaignLeadVisible(lead, managerNameNorm, campaignAssignToById);
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
  assertLeadAccessible,
  canBypassLeadIsolation,
  filterLeadsForUser,
  isLeadVisibleToUser,
  loadCampaignAssignToById,
  resolveCurrentUserName,
};
