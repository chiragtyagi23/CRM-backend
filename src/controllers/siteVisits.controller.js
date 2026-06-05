const { Op } = require("sequelize");
const { ConnectionError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const { asyncHandler } = require("../lib/asyncHandler");
const { CaptureLead, CampaignMaster, SiteVisit } = require("../models");

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value || "").trim());
}

/** project_id is TEXT — older rows may store demo ids like "p1", not campaign UUIDs. */
async function loadProjectTitleById(projectIds) {
  const ids = [...new Set(projectIds.map((id) => String(id || "").trim()).filter(Boolean))];
  const titleById = new Map();

  for (const id of ids) {
    if (!isUuid(id)) titleById.set(id, id);
  }

  const campaignIds = ids.filter(isUuid);
  if (!campaignIds.length) return titleById;

  const campaigns = await CampaignMaster.findAll({
    where: { id: { [Op.in]: campaignIds } },
    attributes: ["id", "title"],
  });

  for (const c of campaigns) {
    const j = typeof c.toJSON === "function" ? c.toJSON() : c;
    titleById.set(String(j.id), String(j.title || "").trim() || String(j.id));
  }

  return titleById;
}

function serializeSiteVisit(row, projectTitleById) {
  const j = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  const lead = j.lead || null;
  const projectId = String(j.projectId || "").trim();
  const leadName = lead?.name ? String(lead.name).trim() : null;
  const leadLocation = lead?.resiLocation ? String(lead.resiLocation).trim() : null;
  const projectName = projectTitleById.get(projectId) || null;

  delete j.lead;

  return {
    ...j,
    leadName,
    leadLocation,
    projectName,
  };
}

const getAll = asyncHandler(async (_req, res) => {
  const rows = await SiteVisit.findAll({
    order: [["created_at", "DESC"]],
    include: [
      {
        association: "lead",
        attributes: ["id", "name", "resiLocation"],
        required: false,
      },
    ],
  });

  const projectTitleById = await loadProjectTitleById(rows.map((r) => r.projectId));
  const items = rows.map((row) => serializeSiteVisit(row, projectTitleById));
  res.json({ items });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await SiteVisit.findByPk(id, {
    include: [
      {
        association: "lead",
        attributes: ["id", "name", "resiLocation"],
        required: false,
      },
    ],
  });
  if (!item) return res.status(404).json({ error: "Site visit not found" });
  const projectTitleById = await loadProjectTitleById([item.projectId]);
  res.json(serializeSiteVisit(item, projectTitleById));
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
    const hydrated = await SiteVisit.findByPk(created.id, {
      include: [
        {
          association: "lead",
          attributes: ["id", "name", "resiLocation"],
          required: false,
        },
      ],
    });
    const projectTitleById = await loadProjectTitleById([payload.projectId]);
    res.status(201).json(serializeSiteVisit(hydrated || created, projectTitleById));
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
  const hydrated = await SiteVisit.findByPk(id, {
    include: [
      {
        association: "lead",
        attributes: ["id", "name", "resiLocation"],
        required: false,
      },
    ],
  });
  const projectTitleById = await loadProjectTitleById([hydrated?.projectId ?? item.projectId]);
  res.json(serializeSiteVisit(hydrated || item, projectTitleById));
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await SiteVisit.findByPk(id);
  if (!item) return res.status(404).json({ error: "Site visit not found" });
  await item.destroy();
  res.status(204).end();
});

module.exports = { getAll, getById, create, patch, remove };
