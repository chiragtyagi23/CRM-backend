const express = require("express");
const { UniqueConstraintError } = require("sequelize");
const { asyncHandler } = require("../lib/asyncHandler");
const { requireWebhookApiKey } = require("../middleware/webhookApiKey");
const { CaptureLead } = require("../models");
const { leadSchema } = require("../validators/webhook99acres.schema");

const router = express.Router();

function normalizeIncomingPayload(body) {
  const leadId = body.lead_id || body.leadId || `${body.Mobile || ""}-${body.Project || ""}-${body.Name || ""}`;
  return {
    lead_id: String(leadId || "").trim(),
    name: body.name ?? body.Name,
    phone: body.phone ?? body.Mobile,
    email: body.email ?? body.Email,
    message: body.message ?? body.remarks,
    property_id: body.property_id ?? body.Project,
    city: body.city,
    property_type: body.property_type,
    created_at: body.created_at,
  };
}

function captureLeadFields(source, data, rawPayload) {
  const sourceCreatedAt = data.created_at ? new Date(data.created_at) : null;
  const at =
    sourceCreatedAt && !Number.isNaN(sourceCreatedAt.getTime())
      ? sourceCreatedAt.toISOString()
      : new Date().toISOString();

  return {
    source,
    externalLeadId: data.lead_id,
    name: data.name,
    number: data.phone,
    email: data.email,
    resiLocation: data.city,
    status: "NEW",
    leadScore: "WARM",
    preferredLocation: [],
    activityTimeline: [
      {
        type: "webhook_received",
        source,
        at,
        message: data.message,
        propertyType: data.property_type,
        propertyId: data.property_id,
        city: data.city,
        payload: rawPayload,
      },
    ],
    interestedProjects: data.property_id
      ? [{ projectId: String(data.property_id), projectName: String(data.property_id) }]
      : [],
  };
}

function duplicateResponse(existing) {
  return {
    ok: true,
    duplicate: true,
    id: existing.id,
    lead_id: existing.externalLeadId,
    name: existing.name,
    phone: existing.number,
  };
}

function createdResponse(lead) {
  return {
    ok: true,
    duplicate: false,
    id: lead.id,
    lead_id: lead.externalLeadId,
    name: lead.name,
    phone: lead.number,
  };
}

async function findExistingWebhookLead(source, leadId) {
  return CaptureLead.findOne({
    where: { source, externalLeadId: leadId },
  });
}

async function handleWebhookLead(req, res, source) {
  const normalized = normalizeIncomingPayload(req.body || {});
  const parsed = leadSchema.safeParse(normalized);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;
  const existing = await findExistingWebhookLead(source, data.lead_id);
  if (existing) {
    return res.status(200).json(duplicateResponse(existing));
  }

  try {
    const lead = await CaptureLead.create(captureLeadFields(source, data, { ...req.body }));
    return res.status(201).json(createdResponse(lead));
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      const duplicate = await findExistingWebhookLead(source, data.lead_id);
      if (duplicate) return res.status(200).json(duplicateResponse(duplicate));
    }
    throw err;
  }
}

router.post("/99acres", requireWebhookApiKey("99acres"), asyncHandler((req, res) => handleWebhookLead(req, res, "99acres")));
router.post("/housing.com", requireWebhookApiKey("housing"), asyncHandler((req, res) => handleWebhookLead(req, res, "housing")));
router.post("/magicBricks", requireWebhookApiKey("magicbricks"), asyncHandler((req, res) => handleWebhookLead(req, res, "magicbricks")));

module.exports = { webhook99acresRouter: router };
