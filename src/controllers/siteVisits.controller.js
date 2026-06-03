const { ConnectionError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const { asyncHandler } = require("../lib/asyncHandler");
const { CaptureLead, SiteVisit } = require("../models");

function normalizeSiteVisitPayload(body) {
  const raw = body && typeof body === "object" ? body : {};
  return {
    leadId: String(raw.leadId ?? "").trim(),
    projectId: String(raw.projectId ?? "").trim(),
    date: String(raw.date ?? "").trim(),
    time: String(raw.time ?? "").trim(),
    notes:
      raw.notes === undefined || raw.notes === null ? null : String(raw.notes).trim() || null,
  };
}

function isTransientDbError(err) {
  if (err instanceof ConnectionError) return true;
  const code = err?.parent?.code || err?.original?.code;
  return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "57P01";
}

async function createSiteVisitRecord(payload) {
  const attempts = 2;
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await SiteVisit.create(payload);
    } catch (err) {
      lastErr = err;
      if (!isTransientDbError(err) || i === attempts - 1) throw err;
    }
  }
  throw lastErr;
}

const getAll = asyncHandler(async (_req, res) => {
  const items = await SiteVisit.findAll({ order: [["created_at", "DESC"]] });
  res.json({ items });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await SiteVisit.findByPk(id);
  if (!item) return res.status(404).json({ error: "Site visit not found" });
  res.json(item);
});

const create = asyncHandler(async (req, res) => {
  const payload = normalizeSiteVisitPayload(req.body);
  if (!payload.leadId || !payload.projectId || !payload.date || !payload.time) {
    return res.status(400).json({
      error: "leadId, projectId, date, and time are required",
    });
  }

  const lead = await CaptureLead.findByPk(payload.leadId);
  if (!lead) {
    return res.status(400).json({ error: "Lead not found" });
  }

  try {
    const created = await createSiteVisitRecord(payload);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ error: "Lead not found or invalid reference" });
    }
    throw err;
  }
});

const patch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await SiteVisit.findByPk(id);
  if (!item) return res.status(404).json({ error: "Site visit not found" });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const updates = {};
  if ("leadId" in body) updates.leadId = String(body.leadId ?? "").trim();
  if ("projectId" in body) updates.projectId = String(body.projectId ?? "").trim();
  if ("date" in body) updates.date = String(body.date ?? "").trim();
  if ("time" in body) updates.time = String(body.time ?? "").trim();
  if ("notes" in body) {
    updates.notes =
      body.notes === undefined || body.notes === null
        ? null
        : String(body.notes).trim() || null;
  }
  await item.update(updates);
  res.json(item);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await SiteVisit.findByPk(id);
  if (!item) return res.status(404).json({ error: "Site visit not found" });
  await item.destroy();
  res.status(204).end();
});

module.exports = { getAll, getById, create, patch, remove };
