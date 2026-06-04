const { asyncHandler } = require("../lib/asyncHandler");
const { validateAllBulkRows } = require("../lib/bulkCaptureLeadsValidation");
const { CaptureLead, CrmSignup, sequelize } = require("../models");
const { userCanAccessModule } = require("../services/acl.service");
const { MODULE_KEYS } = require("../acl/permissionMap");

function parseDateOrNull(input) {
  if (input === undefined || input === null) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;

  // Try native parsing first (ISO, RFC, etc.)
  const d1 = new Date(raw);
  if (!Number.isNaN(d1.getTime())) return d1;

  // Support "DD-MM-YYYY" and "DD/MM/YYYY"
  const m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const d2 = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
    return Number.isNaN(d2.getTime()) ? null : d2;
  }

  return null;
}

function parseTimeStringOrNull(input) {
  if (input === undefined || input === null) return null;
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  // HTML time: "HH:mm" or "HH:mm:ss"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) return raw;
  return null;
}

function normalizeInterestedProjects(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const projectId = String(item.projectId ?? item.project_id ?? "").trim();
      const projectName = String(item.projectName ?? item.project_name ?? "").trim();
      if (!projectId) return null;
      return { projectId, projectName: projectName || projectId };
    })
    .filter(Boolean);
}

function normalizePayload(body) {
  const payload = body && typeof body === "object" ? { ...body } : {};

  // Only touch keys present on the body so PATCH does not clear omitted columns.
  if ("firstCallDate" in payload) payload.firstCallDate = parseDateOrNull(payload.firstCallDate);
  if ("callbackDate" in payload) payload.callbackDate = parseDateOrNull(payload.callbackDate);
  if ("possessionDate" in payload) payload.possessionDate = parseDateOrNull(payload.possessionDate);
  if ("callbackTime" in payload) payload.callbackTime = parseTimeStringOrNull(payload.callbackTime);
  if ("activityTimeline" in payload) {
    payload.activityTimeline = Array.isArray(payload.activityTimeline) ? payload.activityTimeline : [];
  }
  if ("interestedProjects" in payload) {
    payload.interestedProjects = normalizeInterestedProjects(payload.interestedProjects);
  }
  if ("campaignId" in payload) {
    const raw = payload.campaignId;
    payload.campaignId =
      raw === undefined || raw === null || String(raw).trim() === "" ? null : String(raw).trim();
  }

  return payload;
}

const getAll = asyncHandler(async (req, res) => {
  const where = {};
  const campaignId = String(req.query.campaignId || "").trim();
  if (campaignId) where.campaignId = campaignId;

  // If user cannot reassign leads, show only their assigned leads.
  const canAssign = await userCanAccessModule(req.user.sub, MODULE_KEYS.leads.assignTo);
  const items = await CaptureLead.findAll({ where, order: [["created_at", "DESC"]] });
  if (canAssign) return res.json({ items });

  let currentUserName = String(req.user?.name || "").trim();
  if (!currentUserName && req.user?.sub) {
    const me = await CrmSignup.findByPk(req.user.sub);
    currentUserName = String(me?.name || "").trim();
  }

  const norm = currentUserName.toLowerCase();
  const visible = items.filter((lead) => {
    const callBy = String(lead.callBy || "").trim().toLowerCase();
    // Public enquiries (website/microsite) have no assignee — visible to all lead viewers.
    if (!callBy) return true;
    return Boolean(norm) && callBy === norm;
  });
  res.json({ items: visible });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await CaptureLead.findByPk(id);
  if (!lead) return res.status(404).json({ error: "Capture lead not found" });
  res.json(lead);
});

const create = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body);
  const temp = String(payload.leadScore ?? payload.status ?? "WARM")
    .trim()
    .toUpperCase();
  if (["HOT", "WARM", "COLD"].includes(temp)) payload.leadScore = temp;
  payload.status = "NEW";
  const created = await CaptureLead.create(payload);
  res.status(201).json(created);
});

const patch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await CaptureLead.findByPk(id);
  if (!lead) return res.status(404).json({ error: "Capture lead not found" });

  await lead.update(normalizePayload(req.body));
  res.json(lead);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await CaptureLead.findByPk(id);
  if (!lead) return res.status(404).json({ error: "Capture lead not found" });
  await lead.destroy();
  res.status(204).end();
});

const BULK_MAX = 500;

function emptyLeadFields(source) {
  return {
    campaignId: null,
    source,
    firstCallDate: null,
    callBy: null,
    whatsappNumber: null,
    bhk: null,
    budget: null,
    resiLocation: null,
    propertyOwnership: null,
    workLocation: null,
    workProfile: null,
    industryType: null,
    preferredLocation: [],
    possessionDate: null,
    status: 'NEW',
    leadScore: null,
    propertyBuyingStage: null,
    callbackDate: null,
    callbackTime: null,
    activityTimeline: [],
    interestedProjects: [],
  };
}

/** POST body: { source: string, leads: [{ name, number, email }] } — same validation as CRM bulk UI; all-or-nothing. */
const createBulk = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const source = typeof body.source === "string" ? body.source.trim() : "";
  const leads = body.leads;

  if (!source) {
    return res.status(400).json({ error: "source is required (e.g. campaign title for reporting)" });
  }
  if (!Array.isArray(leads)) {
    return res.status(400).json({ error: "leads must be an array" });
  }
  if (leads.length === 0) {
    return res.status(400).json({ error: "leads must contain at least one row" });
  }
  if (leads.length > BULK_MAX) {
    return res.status(400).json({ error: `Maximum ${BULK_MAX} leads per request` });
  }

  const checked = await validateAllBulkRows(leads);
  if (!checked.ok) {
    return res.status(400).json({
      error: "Validation failed",
      message: `${checked.failures.length} row(s) failed validation; no leads were created.`,
      failures: checked.failures,
    });
  }

  const base = emptyLeadFields(source);
  const created = await sequelize.transaction(async (t) => {
    const rows = [];
    for (const row of checked.rows) {
      const record = await CaptureLead.create(
        {
          ...base,
          name: row.name,
          number: row.number,
          email: row.email || null,
        },
        { transaction: t },
      );
      rows.push(record);
    }
    return rows;
  });

  res.status(201).json({
    items: created.map((r) => r.toJSON()),
    count: created.length,
  });
});

module.exports = { getAll, getById, create, patch, remove, createBulk };

