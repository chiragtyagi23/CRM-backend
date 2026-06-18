const { z } = require("zod");

const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
});

const HeroSchema = z
  .object({
    backgroundImages: z.array(ImageSchema).default([]),
    eyebrow: z.string().optional(),
    titleLine1: z.string().optional(),
    titleLine2Italic: z.string().optional(),
    snapshotSummary: z.string().optional(),
    locationLine: z.string().optional(),
    metaCells: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .optional()
      .default([]),
    primaryCta: z.object({ label: z.string(), targetSectionId: z.string() }).optional(),
    secondaryCta: z.object({ label: z.string(), targetSectionId: z.string() }).optional(),
    badge: z.string().optional(),
    mainVisual: z
      .object({
        art: z.string().optional(),
        fontSize: z.string().optional(),
        opacity: z.number().optional(),
      })
      .optional(),
  })
  .passthrough();

const OverviewSchema = z
  .object({
    sectionLabel: z.string().optional(),
    title: z
      .object({
        before: z.string().optional(),
        italic: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    body: z.string().optional(),
    facts: z.array(z.object({ key: z.string(), value: z.string() })).optional().default([]),
    certificationsTitle: z.string().optional(),
    certifications: z
      .array(z.object({ label: z.string(), value: z.string(), tone: z.string().optional() }))
      .optional()
      .default([]),
  })
  .passthrough();

const GallerySchema = z
  .object({
    sectionLabel: z.string().optional(),
    title: z
      .object({
        before: z.string().optional(),
        italic: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    cells: z
      .array(
        z.object({
          tag: z.string().optional(),
          feature: z.boolean().optional(),
          wideBottom: z.boolean().optional(),
          images: z.array(ImageSchema).default([]),
        }),
      )
      .default([]),
  })
  .passthrough();

const FloorplansSchema = z
  .object({
    sectionLabel: z.string().optional(),
    title: z
      .object({
        before: z.string().optional(),
        italic: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    blueprintImage: z.string().optional(),
    defaultTabId: z.string().optional(),
    tabs: z.array(z.object({ id: z.string(), label: z.string() })).optional().default([]),
    // zod v4: record(keySchema, valueSchema)
    panels: z.record(z.string(), z.any()).optional().default({}),
  })
  .passthrough();

const AmenitiesSchema = z
  .object({
    sectionLabel: z.string().optional(),
    title: z
      .object({
        before: z.string().optional(),
        italic: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    items: z
      .array(
        z.object({
          icon: z.string().nullable().optional(),
          name: z.string().min(1),
          desc: z.string().optional(),
        }),
      )
      .default([]),
  })
  .passthrough();

const BenefitsSchema = z
  .object({
    sectionLabel: z.string().optional(),
    title: z
      .object({
        before: z.string().optional(),
        italic: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    backgroundImages: z.array(ImageSchema).optional().default([]),
    items: z
      .array(z.object({ num: z.string().optional(), title: z.string(), text: z.string() }))
      .optional()
      .default([]),
    stats: z.array(z.object({ value: z.string(), label: z.string() })).optional().default([]),
  })
  .passthrough();

const HighlightsSchema = z
  .object({
    sectionLabel: z.string().optional(),
    title: z
      .object({
        before: z.string().optional(),
        italic: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    items: z
      .array(
        z.object({
          num: z.string().optional(),
          icon: z.string().optional(),
          title: z.string().min(1),
          text: z.string().optional(),
        }),
      )
      .default([]),
  })
  .passthrough();

const SocialInfrastructureSchema = z
  .object({
    groups: z
      .array(
        z.object({
          title: z.string().min(1),
          items: z.array(z.object({ name: z.string().min(1), value: z.string().optional() })).default([]),
        }),
      )
      .default([]),
  })
  .passthrough();

const DocumentsSchema = z
  .object({
    items: z.array(z.object({ url: z.string().min(1), type: z.string().min(1) })).default([]),
  })
  .passthrough();

const MediaSchema = z
  .object({
    items: z
      .array(
        z.object({
          url: z.string().min(1),
          kind: z.string().min(1),
          sortOrder: z.number().int().optional(),
        }),
      )
      .default([]),
  })
  .passthrough();

module.exports = {
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
};

