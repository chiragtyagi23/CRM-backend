const { z } = require("zod");

const trim = (v) => (typeof v === "string" ? v.trim() : v);
const opt = z.string().transform(trim).optional().or(z.literal("")).transform((v) => v || null);

const leadSchema = z.object({
  lead_id: z.string().min(1).transform(trim),
  name: z.string().min(1).transform(trim),
  phone: z.string().min(1).transform(trim),
  property_id: opt,
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? trim(v) : null)),
  message: opt,
  city: opt,
  property_type: opt,
  created_at: opt,
});

module.exports = { leadSchema };
