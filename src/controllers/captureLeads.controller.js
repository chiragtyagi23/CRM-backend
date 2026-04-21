const { asyncHandler } = require("../lib/asyncHandler");
const { CaptureLead } = require("../models");

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

function normalizePayload(body) {
  const payload = body && typeof body === "object" ? { ...body } : {};

  // Prevent Postgres "Invalid date" by coercing to Date/null.
  payload.firstCallDate = parseDateOrNull(payload.firstCallDate);
  payload.callbackDate = parseDateOrNull(payload.callbackDate);
  payload.possessionDate = parseDateOrNull(payload.possessionDate);

  return payload;
}

const getAll = asyncHandler(async (_req, res) => {
  const items = await CaptureLead.findAll({ order: [["created_at", "DESC"]] });
  res.json({ items });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await CaptureLead.findByPk(id);
  if (!lead) return res.status(404).json({ error: "Capture lead not found" });
  res.json(lead);
});

const create = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body);
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

module.exports = { getAll, getById, create, patch, remove };

