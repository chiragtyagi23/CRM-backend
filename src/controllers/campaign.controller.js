const { asyncHandler } = require("../lib/asyncHandler");
const { CampaignFullCreateSchema } = require("../validators/campaignFull.schema");
const { listCampaigns, getCampaignById, createCampaignFull, updateCampaignFull } = require("../services/campaign.service");

const getAll = asyncHandler(async (_req, res) => {
  const items = await listCampaigns();
  res.json({ items });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json(campaign);
});

const createFull = asyncHandler(async (req, res) => {
  const parsed = CampaignFullCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const campaign = await createCampaignFull(parsed.data); // one transaction inside service
  res.status(201).json(campaign);
});

const updateFull = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const parsed = CampaignFullCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const campaign = await updateCampaignFull(id, parsed.data);
  res.json(campaign);
});

module.exports = {
  getAll,
  getById,
  createFull,
  updateFull,
};

