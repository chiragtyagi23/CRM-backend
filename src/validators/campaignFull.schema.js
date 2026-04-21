const { z } = require("zod");

const { CampaignCreateSchema } = require("./campaign.schema");
const {
  HeroSchema,
  OverviewSchema,
  GallerySchema,
  FloorplansSchema,
  AmenitiesSchema,
  BenefitsSchema,
  HighlightsSchema,
  SocialInfrastructureSchema,
  DocumentsSchema,
  MediaSchema,
} = require("./campaignSections.schema");

// One-shot create payload: master + all sections (all optional except master).
const CampaignFullCreateSchema = z  
  .object({
    master: CampaignCreateSchema,
    hero: HeroSchema.optional(),
    overview: OverviewSchema.optional(),
    gallery: GallerySchema.optional(),
    floorplans: FloorplansSchema.optional(),
    amenities: AmenitiesSchema.optional(),
    benefits: BenefitsSchema.optional(),
    highlights: HighlightsSchema.optional(),
    socialInfrastructure: SocialInfrastructureSchema.optional(),
    documents: DocumentsSchema.optional(),
    media: MediaSchema.optional(),
  })
  .passthrough();

module.exports = { CampaignFullCreateSchema };

