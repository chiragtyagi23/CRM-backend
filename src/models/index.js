const { Sequelize, DataTypes } = require("sequelize");
const pg = require("pg");
const { env } = require("../config/env");

function postgresDialectOptions() {
  const url = String(env.databaseUrl || "");
  if (!url || url.includes("sslmode=disable")) return undefined;
  const sslOff = process.env.DATABASE_SSL === "0" || process.env.DATABASE_SSL === "false";
  if (sslOff) return undefined;
  const sslOn =
    process.env.DATABASE_SSL === "1" ||
    process.env.DATABASE_SSL === "true" ||
    url.includes("sslmode=require") ||
    /neon\.tech|supabase\.co|pooler\.supabase|azure\.com|amazonaws\.com/i.test(url) ||
    process.env.VERCEL === "1";
  if (!sslOn) return undefined;
  return {
    ssl: {
      require: true,
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
    },
  };
}

if (!env.databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set (or set PGHOST, PGDATABASE, PGUSER, and optionally PGPASSWORD, PGPORT).",
  );
}

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  dialectOptions: postgresDialectOptions(),
  pool: {
    max: 10,
    min: 0,
    acquire: 60_000,
    idle: 10_000,
  },
});

const CampaignMaster = sequelize.define(
  "CampaignMaster",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.TEXT, allowNull: false },
    assignTo: { type: DataTypes.TEXT, allowNull: true, field: "assign_to" },
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
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "campaign_id",
      references: { model: "campaign_master_table", key: "id" },
    },
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
    leadScore: { type: DataTypes.TEXT, allowNull: true, field: "lead_score" },
    propertyBuyingStage: { type: DataTypes.TEXT, allowNull: true, field: "property_buying_stage" },
    callbackDate: { type: DataTypes.DATE, allowNull: true, field: "callback_date" },
    callbackTime: { type: DataTypes.TEXT, allowNull: true, field: "callback_time" },
    activityTimeline: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "activity_timeline",
    },
    interestedProjects: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "interested_projects",
    },
  },
  {
    tableName: "capture_leads",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["campaign_id"], name: "capture_leads_campaign_id_idx" }],
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
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "lead_id",
      references: { model: "capture_leads", key: "id" },
    },
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

const Role = sequelize.define(
  "Role",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.TEXT, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "roles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const Module = sequelize.define(
  "Module",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    moduleKey: { type: DataTypes.TEXT, allowNull: false, unique: true, field: "module_key" },
    name: { type: DataTypes.TEXT, allowNull: false },
    route: { type: DataTypes.TEXT, allowNull: false },
    icon: { type: DataTypes.TEXT, allowNull: true },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "parent_id",
      references: { model: "modules", key: "id" },
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
  },
  {
    tableName: "modules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["parent_id", "sort_order"] }],
  },
);

const RoleModule = sequelize.define(
  "RoleModule",
  {
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: "role_id",
      references: { model: "roles", key: "id" },
    },
    moduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: "module_id",
      references: { model: "modules", key: "id" },
    },
  },
  {
    tableName: "role_modules",
    timestamps: false,
  },
);

const UserModuleOverride = sequelize.define(
  "UserModuleOverride",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: { model: "crm_signup", key: "id" },
    },
    moduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "module_id",
      references: { model: "modules", key: "id" },
    },
    effect: { type: DataTypes.TEXT, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "user_module_overrides",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["user_id"] },
      { unique: true, fields: ["user_id", "module_id"], name: "user_module_overrides_user_module_unique" },
    ],
  },
);

const CrmSignup = sequelize.define(
  "CrmSignup",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: "password_hash" },
    roleId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "role_id",
      references: { model: "roles", key: "id" },
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
  },
  {
    tableName: "crm_signup",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["role_id"] }, { fields: ["is_active"] }],
  },
);

const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: { model: "crm_signup", key: "id" },
    },
    tokenHash: { type: DataTypes.TEXT, allowNull: false, unique: true, field: "token_hash" },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
  },
  {
    tableName: "password_reset_tokens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ fields: ["user_id"] }, { fields: ["expires_at"] }],
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

CampaignMaster.hasMany(CaptureLead, { foreignKey: "campaignId", as: "captureLeads" });
CaptureLead.belongsTo(CampaignMaster, { foreignKey: "campaignId", as: "campaign" });

CaptureLead.hasMany(SiteVisit, { foreignKey: "leadId", as: "siteVisits" });
SiteVisit.belongsTo(CaptureLead, { foreignKey: "leadId", as: "lead" });

Role.belongsToMany(Module, {
  through: RoleModule,
  foreignKey: "roleId",
  otherKey: "moduleId",
  as: "modules",
});
Module.belongsToMany(Role, {
  through: RoleModule,
  foreignKey: "moduleId",
  otherKey: "roleId",
  as: "roles",
});

Module.hasMany(Module, { foreignKey: "parentId", as: "children" });
Module.belongsTo(Module, { foreignKey: "parentId", as: "parent" });

Role.hasMany(CrmSignup, { foreignKey: "roleId", as: "users" });
CrmSignup.belongsTo(Role, { foreignKey: "roleId", as: "role" });

Role.hasMany(RoleModule, { foreignKey: "roleId", as: "roleModules" });
RoleModule.belongsTo(Role, { foreignKey: "roleId", as: "role" });
RoleModule.belongsTo(Module, { foreignKey: "moduleId", as: "module" });

Module.hasMany(RoleModule, { foreignKey: "moduleId", as: "roleModules" });
Module.hasMany(UserModuleOverride, { foreignKey: "moduleId", as: "userOverrides" });
UserModuleOverride.belongsTo(Module, { foreignKey: "moduleId", as: "module" });

CrmSignup.hasMany(UserModuleOverride, { foreignKey: "userId", as: "moduleOverrides" });
UserModuleOverride.belongsTo(CrmSignup, { foreignKey: "userId", as: "user" });

CrmSignup.hasMany(PasswordResetToken, { foreignKey: "userId", as: "passwordResetTokens" });
PasswordResetToken.belongsTo(CrmSignup, { foreignKey: "userId", as: "user" });

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
  Role,
  Module,
  RoleModule,
  UserModuleOverride,
  CrmSignup,
  PasswordResetToken,
  sortCampaignRelations,
};
