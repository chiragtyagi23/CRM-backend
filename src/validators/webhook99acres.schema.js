const { z } = require("zod");

const trim = (v) => (typeof v === "string" ? v.trim() : v);
const opt = z.string().transform(trim).optional().or(z.literal("")).transform((v) => v || null);

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

function normalizeIndianPhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const leadSchema = z.object({
  lead_id: z.string().min(1).transform(trim),
  name: z.string().min(1).transform(trim),
  phone: z
    .string()
    .min(1)
    .transform(trim)
    .transform(normalizeIndianPhone)
    .refine((v) => INDIAN_MOBILE_REGEX.test(v), {
      message: "Invalid Indian mobile number (10 digits starting with 6–9)",
    }),
  property_id: opt,
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? trim(v) : null)),
  message: opt,
  city: opt,
  property_type: opt,
  created_at: opt,
});

module.exports = { leadSchema, INDIAN_MOBILE_REGEX, normalizeIndianPhone };
