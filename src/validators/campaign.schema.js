const { z } = require("zod");

const NullableString = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const CampaignCreateSchema = z.object({
  title: z.string().min(1),
  desc: NullableString,
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : null)),
  mobile: NullableString,
  address: NullableString,
  logo: NullableString,
  coverImage: NullableString,
  reg_no: NullableString,
  templateKey: z
    .enum(["luxury-template", "affordable-template"])
    .optional()
    .default("luxury-template"),
});

const CampaignPatchSchema = CampaignCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required",
);

module.exports = {
  CampaignCreateSchema,
  CampaignPatchSchema,
};

