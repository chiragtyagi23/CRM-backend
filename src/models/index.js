const { Sequelize, DataTypes } = require("sequelize");
const { env } = require("../config/env");

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
});

const CampaignMaster = sequelize.define(
  "CampaignMaster",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.TEXT, allowNull: false },
    desc: { type: DataTypes.TEXT, allowNull: true, field: "desc" },
    email: DataTypes.TEXT,
    mobile: DataTypes.TEXT,
    address: DataTypes.TEXT,
    logo: DataTypes.TEXT,
    coverImage: { type: DataTypes.TEXT, allowNull: true, field: "cover_image" },
    regNo: { type: DataTypes.TEXT, field: "reg_no" },
    templateKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "luxury-template",
      field: "template_key",
    },
  },
  {
    tableName: "campaign_master_table",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

const CampaignDocument = sequelize.define(
  "CampaignDocument",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    url: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "campaign_document_table",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignMedia = sequelize.define(
  "CampaignMedia",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    kind: { type: DataTypes.TEXT, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_media",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignBanner = sequelize.define(
  "CampaignBanner",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    imageId: { type: DataTypes.TEXT, allowNull: false, field: "image_id" },
    alt: DataTypes.TEXT,
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_banner_data",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignHeroData = sequelize.define(
  "CampaignHeroData",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "campaign_id" },
    data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  {
    tableName: "campaign_hero_data",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

const CampaignProjectOverview = sequelize.define(
  "CampaignProjectOverview",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "campaign_id" },
    sectionLabel: { type: DataTypes.TEXT, field: "section_label" },
    titleBefore: { type: DataTypes.TEXT, field: "title_before" },
    titleItalic: { type: DataTypes.TEXT, field: "title_italic" },
    titleAfter: { type: DataTypes.TEXT, field: "title_after" },
    body: DataTypes.TEXT,
    facts: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    certificationsTitle: { type: DataTypes.TEXT, field: "certifications_title" },
    certifications: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  {
    tableName: "campaign_project_overview",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

const CampaignProjectImage = sequelize.define(
  "CampaignProjectImage",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    tag: DataTypes.TEXT,
    feature: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    wideBottom: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "wide_bottom" },
    images: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_project_images",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignSizeFloor = sequelize.define(
  "CampaignSizeFloor",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "campaign_id" },
    sectionLabel: { type: DataTypes.TEXT, field: "section_label" },
    titleBefore: { type: DataTypes.TEXT, field: "title_before" },
    titleItalic: { type: DataTypes.TEXT, field: "title_italic" },
    titleAfter: { type: DataTypes.TEXT, field: "title_after" },
    blueprintImage: { type: DataTypes.TEXT, field: "blueprint_image" },
    defaultTabId: { type: DataTypes.TEXT, field: "default_tab_id" },
    tabs: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    panels: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  {
    tableName: "campaign_size_floor",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

const CampaignAmenity = sequelize.define(
  "CampaignAmenity",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    icon: DataTypes.TEXT,
    name: { type: DataTypes.TEXT, allowNull: false },
    desc: { type: DataTypes.TEXT, allowNull: true, field: "desc" },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_amenities",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignHighlight = sequelize.define(
  "CampaignHighlight",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    num: DataTypes.TEXT,
    icon: DataTypes.TEXT,
    title: { type: DataTypes.TEXT, allowNull: false },
    text: DataTypes.TEXT,
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_project_highlights",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignSocialInfraGroup = sequelize.define(
  "CampaignSocialInfraGroup",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, field: "campaign_id" },
    title: { type: DataTypes.TEXT, allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_social_infra_group",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignSocialInfraItem = sequelize.define(
  "CampaignSocialInfraItem",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    groupId: { type: DataTypes.UUID, allowNull: false, field: "group_id" },
    name: { type: DataTypes.TEXT, allowNull: false },
    value: DataTypes.TEXT,
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  {
    tableName: "campaign_social_infra_item",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

const CampaignProjectBenefits = sequelize.define(
  "CampaignProjectBenefits",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    campaignId: { type: DataTypes.UUID, allowNull: false, unique: true, field: "campaign_id" },
    sectionLabel: { type: DataTypes.TEXT, field: "section_label" },
    titleBefore: { type: DataTypes.TEXT, field: "title_before" },
    titleItalic: { type: DataTypes.TEXT, field: "title_italic" },
    titleAfter: { type: DataTypes.TEXT, field: "title_after" },
    backgroundImages: { type: DataTypes.JSONB, allowNull: false, defaultValue: [], field: "background_images" },
    items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    stats: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  {
    tableName: "campaign_project_benefits",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

const CaptureLead = sequelize.define(
  "CaptureLead",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    source: { type: DataTypes.TEXT, allowNull: true },
    firstCallDate: { type: DataTypes.DATE, allowNull: true, field: "first_call_date" },
    callBy: { type: DataTypes.TEXT, allowNull: true, field: "call_by" },
    name: { type: DataTypes.TEXT, allowNull: false },
    number: { type: DataTypes.TEXT, allowNull: false },
    whatsappNumber: { type: DataTypes.TEXT, allowNull: true, field: "whatsapp_number" },
    email: { type: DataTypes.TEXT, allowNull: true, field: "email" },
    bhk: { type: DataTypes.TEXT, allowNull: true },
    budget: { type: DataTypes.TEXT, allowNull: true },
    resiLocation: { type: DataTypes.TEXT, allowNull: true, field: "resi_location" },
    propertyOwnership: { type: DataTypes.TEXT, allowNull: true, field: "property_ownership" },
    workLocation: { type: DataTypes.TEXT, allowNull: true, field: "work_location" },
    workProfile: { type: DataTypes.TEXT, allowNull: true, field: "work_profile" },
    industryType: { type: DataTypes.TEXT, allowNull: true, field: "industry_type" },
    preferredLocation: { type: DataTypes.JSONB, allowNull: false, defaultValue: [], field: "preferred_location" },
    possessionDate: { type: DataTypes.DATE, allowNull: true, field: "possession_date" },
    status: { type: DataTypes.TEXT, allowNull: true },
    propertyBuyingStage: { type: DataTypes.TEXT, allowNull: true, field: "property_buying_stage" },
    callbackDate: { type: DataTypes.DATE, allowNull: true, field: "callback_date" },
  },
  {
    tableName: "capture_leads",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const AcresWebhookLead = sequelize.define(
  "AcresWebhookLead",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    leadId: { type: DataTypes.TEXT, allowNull: false, unique: true, field: "lead_id" },
    propertyId: { type: DataTypes.TEXT, allowNull: true, field: "property_id" },
    name: { type: DataTypes.TEXT, allowNull: false },
    phone: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.TEXT, allowNull: true },
    propertyType: { type: DataTypes.TEXT, allowNull: true, field: "property_type" },
    sourceCreatedAt: { type: DataTypes.DATE, allowNull: true, field: "source_created_at" },
    webhookPayload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {}, field: "webhook_payload" },
  },
  {
    tableName: "acres_webhook_leads",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const SiteVisit = sequelize.define(
  "SiteVisit",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    leadId: { type: DataTypes.UUID, allowNull: false, field: "lead_id" },
    projectId: { type: DataTypes.TEXT, allowNull: false, field: "project_id" },
    date: { type: DataTypes.TEXT, allowNull: false },
    time: { type: DataTypes.TEXT, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "site_visits",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const CrmSignup = sequelize.define(
  "CrmSignup",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: "password_hash" },
    role: { type: DataTypes.TEXT, allowNull: true,},
  },
  {
    tableName: "crm_signup",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

CampaignMaster.hasMany(CampaignDocument, { foreignKey: "campaignId", as: "documents" });
CampaignDocument.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasMany(CampaignMedia, { foreignKey: "campaignId", as: "media" });
CampaignMedia.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasMany(CampaignBanner, { foreignKey: "campaignId", as: "banners" });
CampaignBanner.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasOne(CampaignHeroData, { foreignKey: "campaignId", as: "hero" });
CampaignHeroData.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasOne(CampaignProjectOverview, { foreignKey: "campaignId", as: "overview" });
CampaignProjectOverview.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasMany(CampaignProjectImage, { foreignKey: "campaignId", as: "projectImages" });
CampaignProjectImage.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasOne(CampaignSizeFloor, { foreignKey: "campaignId", as: "sizeFloor" });
CampaignSizeFloor.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasMany(CampaignAmenity, { foreignKey: "campaignId", as: "amenities" });
CampaignAmenity.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasMany(CampaignHighlight, { foreignKey: "campaignId", as: "highlights" });
CampaignHighlight.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignMaster.hasMany(CampaignSocialInfraGroup, { foreignKey: "campaignId", as: "socialInfraGroups" });
CampaignSocialInfraGroup.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CampaignSocialInfraGroup.hasMany(CampaignSocialInfraItem, { foreignKey: "groupId", as: "items" });
CampaignSocialInfraItem.belongsTo(CampaignSocialInfraGroup, { foreignKey: "groupId", as: "group" });

CampaignMaster.hasOne(CampaignProjectBenefits, { foreignKey: "campaignId", as: "benefits" });
CampaignProjectBenefits.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

function sortCampaignRelations(campaign) {
  if (!campaign) return null;
  const j = typeof campaign.toJSON === "function" ? campaign.toJSON() : { ...campaign };
  const bySort = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (Array.isArray(j.banners)) j.banners.sort(bySort);
  if (Array.isArray(j.amenities)) j.amenities.sort(bySort);
  if (Array.isArray(j.projectImages)) j.projectImages.sort(bySort);
  if (Array.isArray(j.highlights)) j.highlights.sort(bySort);
  if (Array.isArray(j.socialInfraGroups)) {
    j.socialInfraGroups.sort(bySort);
    for (const g of j.socialInfraGroups) {
      if (Array.isArray(g.items)) g.items.sort(bySort);
    }
  }
  return j;
}

module.exports = {
  sequelize,
  CampaignMaster,
  CampaignDocument,
  CampaignMedia,
  CampaignBanner,
  CampaignHeroData,
  CampaignProjectOverview,
  CampaignProjectImage,
  CampaignSizeFloor,
  CampaignAmenity,
  CampaignHighlight,
  CampaignSocialInfraGroup,
  CampaignSocialInfraItem,
  CampaignProjectBenefits,
  CaptureLead,
  AcresWebhookLead,
  SiteVisit,
  CrmSignup,
  sortCampaignRelations,
};
