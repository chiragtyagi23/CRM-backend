const { asyncHandler } = require("../lib/asyncHandler");
const { CampaignFullCreateSchema } = require("../validators/campaignFull.schema");
const {
  listCampaigns,
  getCampaignById,
  createCampaignFull,
  updateCampaignFull,
  updateCampaignAssignee,
} = require("../services/campaign.service");

function sanitizeCampaignFullBody(body) {
  if (!body || typeof body !== "object") return body;
  const next = { ...body };

  if (next.master && typeof next.master === "object") {
    const master = { ...next.master };
    const title = typeof master.title === "string" ? master.title.trim() : "";
    if (!title && master.templateKey === "default-template") {
      master.title = "Untitled Project";
    }
    next.master = master;
  }

  if (next.amenities?.items && Array.isArray(next.amenities.items)) {
    next.amenities = {
      ...next.amenities,
      items: next.amenities.items.map((item) => {
        if (!item || typeof item !== "object") return item;
        if (item.icon === null) {
          const { icon: _icon, ...rest } = item;
          return rest;
        }
        return item;
      }),
    };
  }

  return next;
}

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
  const parsed = CampaignFullCreateSchema.safeParse(sanitizeCampaignFullBody(req.body));

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const campaign = await createCampaignFull(parsed.data); // one transaction inside service
  res.status(201).json(campaign);
});

const updateFull = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const parsed = CampaignFullCreateSchema.safeParse(sanitizeCampaignFullBody(req.body));

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const campaign = await updateCampaignFull(id, parsed.data);
  res.json(campaign);
});

const updateAssignee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assignToRaw = req.body?.assignTo;
  const assignTo =
    typeof assignToRaw === "string" && assignToRaw.trim().length > 0
      ? assignToRaw.trim()
      : null;
  const campaign = await updateCampaignAssignee(id, assignTo);
  res.json(campaign);
});

module.exports = {
  getAll,
  getById,
  createFull,
  updateFull,
  updateAssignee,
};

