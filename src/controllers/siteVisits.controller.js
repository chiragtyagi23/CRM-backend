const { asyncHandler } = require("../lib/asyncHandler");
const { SiteVisit } = require("../models");

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
  const payload = req.body || {};
  const created = await SiteVisit.create(payload);
  res.status(201).json(created);
});

const patch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await SiteVisit.findByPk(id);
  if (!item) return res.status(404).json({ error: "Site visit not found" });
  await item.update(req.body || {});
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

