const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { AcresWebhookLead } = require("../models");
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

function toLead(row) {
  const j = row.toJSON();
  return {
    id: j.id,
    lead_id: j.leadId,
    property_id: j.propertyId,
    name: j.name,
    phone: j.phone,
    email: j.email,
    message: j.message,
    city: j.city,
    property_type: j.propertyType,
    created_at: j.created_at,
  };
}

function leadFields(data, rawPayload) {
  const sourceCreatedAt = data.created_at ? new Date(data.created_at) : null;
  return {
    leadId: data.lead_id,
    propertyId: data.property_id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    message: data.message,
    city: data.city,
    propertyType: data.property_type,
    sourceCreatedAt:
      sourceCreatedAt && !Number.isNaN(sourceCreatedAt.getTime()) ? sourceCreatedAt : null,
    webhookPayload: rawPayload,
  };
}

router.post(
  "/99acres",
  asyncHandler(async (req, res) => {
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
    const existing = await AcresWebhookLead.findOne({ where: { leadId: data.lead_id } });
    if (existing) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        id: existing.id,
        lead_id: existing.leadId,
        name: existing.name,
        phone: existing.phone,
      });
    }

    const lead = await AcresWebhookLead.create(leadFields(data, { ...req.body }));
    return res.status(201).json({
      ok: true,
      duplicate: false,
      id: lead.id,
      lead_id: lead.leadId,
      name: lead.name,
      phone: lead.phone,
    });
  }),
);

router.get(
  "/99acres/:id",
  asyncHandler(async (req, res) => {
    const row = await AcresWebhookLead.findByPk(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: "Lead not found" });
    return res.json({ ok: true, lead: toLead(row) });
  }),
);

router.get(
  "/99acres",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const rows = await AcresWebhookLead.findAll({
      order: [["created_at", "DESC"]],
      limit,
    });
    return res.json({ ok: true, count: rows.length, items: rows.map(toLead) });
  }),
);

module.exports = { webhook99acresRouter: router };
