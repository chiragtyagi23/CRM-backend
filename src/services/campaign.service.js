const {
  sequelize,
  CampaignMaster,
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
  CampaignDocument,
  CampaignMedia,
  sortCampaignRelations,
} = require("../models");

function notFound() {
  const err = new Error("Not found");
  err.code = "NOT_FOUND";
  return err;
}

async function listCampaigns() {
  return CampaignMaster.findAll({
    order: [["created_at", "DESC"]],
    limit: 200,
  });
}

async function getCampaignById(id) {
  const campaign = await CampaignMaster.findByPk(id, {
    include: [
      { association: "overview", required: false },
      { association: "benefits", required: false },
      { association: "sizeFloor", required: false },
      { association: "documents", required: false, separate: true, order: [["created_at", "ASC"]] },
      { association: "media", required: false, separate: true, order: [["sort_order", "ASC"]] },
      { association: "banners", required: false, separate: true, order: [["sort_order", "ASC"]] },
      { association: "amenities", required: false, separate: true, order: [["sort_order", "ASC"]] },
      { association: "projectImages", required: false, separate: true, order: [["sort_order", "ASC"]] },
      { association: "highlights", required: false, separate: true, order: [["sort_order", "ASC"]] },
      { association: "hero", required: false },
      {
        association: "socialInfraGroups",
        required: false,
        separate: true,
        order: [["sort_order", "ASC"]],
        include: [{ association: "items", required: false, separate: true, order: [["sort_order", "ASC"]] }],
      },
    ],
  });
  return campaign ? sortCampaignRelations(campaign) : null;
}

async function createCampaign(data) {
  const { title, desc, email, mobile, address, logo, coverImage, reg_no, templateKey } = data;
  return CampaignMaster.create({
    title,
    desc,
    email,
    mobile,
    address,
    logo,
    coverImage,
    regNo: reg_no,
    templateKey: templateKey ?? "luxury-template",
  });
}

async function createCampaignFull(payload) {
  const { master } = payload;

  // One beginner-friendly rule: in "full create", we write EVERYTHING in one transaction.
  // If any part fails, nothing is saved.
  const campaignId = await sequelize.transaction(async (t) => {
    const campaign = await CampaignMaster.create(
      {
        title: master.title,
        desc: master.desc ?? null,
        email: master.email ?? null,
        mobile: master.mobile ?? null,
        address: master.address ?? null,
        logo: master.logo ?? null,
        coverImage: master.coverImage ?? null,
        regNo: master.reg_no ?? null,
        templateKey: master.templateKey ?? "luxury-template",
      },
      { transaction: t }
    );

    const campaignId = campaign.id;

    // HERO + BANNERS
    if (payload.hero) {
      const hero = payload.hero;
      const backgroundImages = Array.isArray(hero.backgroundImages) ? hero.backgroundImages : [];

      await CampaignHeroData.upsert({ campaignId, data: hero }, { transaction: t });

      await CampaignBanner.destroy({ where: { campaignId }, transaction: t });
      if (backgroundImages.length > 0) {
        await CampaignBanner.bulkCreate(
          backgroundImages.map((img, idx) => ({
            campaignId,
            imageId: img.src,
            alt: img.alt ?? null,
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // OVERVIEW (1 row)
    if (payload.overview) {
      const overview = payload.overview;
      const title = overview.title || {};
      await CampaignProjectOverview.upsert(
        {
          campaignId,
          sectionLabel: overview.sectionLabel ?? null,
          titleBefore: title.before ?? null,
          titleItalic: title.italic ?? null,
          titleAfter: title.after ?? null,
          body: overview.body ?? null,
          facts: overview.facts ?? [],
          certificationsTitle: overview.certificationsTitle ?? null,
          certifications: overview.certifications ?? [],
        },
        { transaction: t }
      );
    }

    // GALLERY (many rows, replace all)
    if (payload.gallery) {
      const cells = Array.isArray(payload.gallery.cells) ? payload.gallery.cells : [];
      await CampaignProjectImage.destroy({ where: { campaignId }, transaction: t });
      if (cells.length > 0) {
        await CampaignProjectImage.bulkCreate(
          cells.map((cell, idx) => ({
            campaignId,
            tag: cell.tag ?? null,
            feature: Boolean(cell.feature),
            wideBottom: Boolean(cell.wideBottom),
            images: cell.images ?? [],
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // FLOORPLANS (1 row)
    if (payload.floorplans) {
      const floorplans = payload.floorplans;
      const title = floorplans.title || {};
      await CampaignSizeFloor.upsert(
        {
          campaignId,
          sectionLabel: floorplans.sectionLabel ?? null,
          titleBefore: title.before ?? null,
          titleItalic: title.italic ?? null,
          titleAfter: title.after ?? null,
          blueprintImage: floorplans.blueprintImage ?? null,
          defaultTabId: floorplans.defaultTabId ?? null,
          tabs: floorplans.tabs ?? [],
          panels: floorplans.panels ?? {},
        },
        { transaction: t }
      );
    }

    // AMENITIES (many rows, replace all)
    if (payload.amenities) {
      const items = Array.isArray(payload.amenities.items) ? payload.amenities.items : [];
      await CampaignAmenity.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignAmenity.bulkCreate(
          items.map((a, idx) => ({
            campaignId,
            icon: a.icon ?? null,
            name: a.name,
            desc: a.desc ?? null,
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // BENEFITS (1 row)
    if (payload.benefits) {
      const benefits = payload.benefits;
      const title = benefits.title || {};
      await CampaignProjectBenefits.upsert(
        {
          campaignId,
          sectionLabel: benefits.sectionLabel ?? null,
          titleBefore: title.before ?? null,
          titleItalic: title.italic ?? null,
          titleAfter: title.after ?? null,
          backgroundImages: benefits.backgroundImages ?? [],
          items: benefits.items ?? [],
          stats: benefits.stats ?? [],
        },
        { transaction: t }
      );
    }

    // HIGHLIGHTS (many rows, replace all)
    if (payload.highlights) {
      const items = Array.isArray(payload.highlights.items) ? payload.highlights.items : [];
      await CampaignHighlight.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignHighlight.bulkCreate(
          items.map((h, idx) => ({
            campaignId,
            num: h.num ?? null,
            icon: h.icon ?? null,
            title: h.title,
            text: h.text ?? null,
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // SOCIAL INFRA (groups + items, replace all)
    if (payload.socialInfrastructure) {
      const groups = Array.isArray(payload.socialInfrastructure.groups)
        ? payload.socialInfrastructure.groups
        : [];

      const existing = await CampaignSocialInfraGroup.findAll({
        where: { campaignId },
        attributes: ["id"],
        transaction: t,
      });
      const existingIds = existing.map((g) => g.id);
      if (existingIds.length > 0) {
        await CampaignSocialInfraItem.destroy({ where: { groupId: existingIds }, transaction: t });
      }
      await CampaignSocialInfraGroup.destroy({ where: { campaignId }, transaction: t });

      for (let gi = 0; gi < groups.length; gi += 1) {
        const g = groups[gi];
        const groupRow = await CampaignSocialInfraGroup.create(
          { campaignId, title: g.title, sortOrder: gi },
          { transaction: t }
        );
        const gItems = Array.isArray(g.items) ? g.items : [];
        if (gItems.length > 0) {
          await CampaignSocialInfraItem.bulkCreate(
            gItems.map((it, ii) => ({
              groupId: groupRow.id,
              name: it.name,
              value: it.value ?? null,
              sortOrder: ii,
            })),
            { transaction: t }
          );
        }
      }
    }

    // DOCUMENTS (many rows, replace all)
    if (payload.documents) {
      const items = Array.isArray(payload.documents.items) ? payload.documents.items : [];
      await CampaignDocument.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignDocument.bulkCreate(
          items.map((d) => ({ campaignId, url: d.url, type: d.type })),
          { transaction: t }
        );
      }
    }

    // MEDIA (videos + reels in a single table)
    if (payload.media) {
      const items = Array.isArray(payload.media.items) ? payload.media.items : [];
      await CampaignMedia.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignMedia.bulkCreate(
          items.map((m, idx) => ({
            campaignId,
            kind: m.kind,
            url: m.url,
            sortOrder: Number.isInteger(m.sortOrder) ? m.sortOrder : idx,
          })),
          { transaction: t }
        );
      }
    }

    // Return id; we fetch after commit so the response is never null.
    return campaignId;
  });

  return getCampaignById(campaignId);
}

async function updateCampaignFull(campaignId, payload) {
  const { master } = payload;

  await sequelize.transaction(async (t) => {
    const campaign = await CampaignMaster.findByPk(campaignId, { transaction: t });
    if (!campaign) throw notFound();

    await campaign.update(
      {
        title: master.title,
        desc: master.desc ?? null,
        email: master.email ?? null,
        mobile: master.mobile ?? null,
        address: master.address ?? null,
        logo: master.logo ?? null,
        coverImage: master.coverImage ?? null,
        regNo: master.reg_no ?? null,
        templateKey: master.templateKey ?? campaign.templateKey ?? "luxury-template",
      },
      { transaction: t }
    );

    // HERO + BANNERS
    if (payload.hero) {
      const hero = payload.hero;
      const backgroundImages = Array.isArray(hero.backgroundImages) ? hero.backgroundImages : [];

      await CampaignHeroData.upsert({ campaignId, data: hero }, { transaction: t });

      await CampaignBanner.destroy({ where: { campaignId }, transaction: t });
      if (backgroundImages.length > 0) {
        await CampaignBanner.bulkCreate(
          backgroundImages.map((img, idx) => ({
            campaignId,
            imageId: img.src,
            alt: img.alt ?? null,
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // OVERVIEW (1 row)
    if (payload.overview) {
      const overview = payload.overview;
      const title = overview.title || {};
      await CampaignProjectOverview.upsert(
        {
          campaignId,
          sectionLabel: overview.sectionLabel ?? null,
          titleBefore: title.before ?? null,
          titleItalic: title.italic ?? null,
          titleAfter: title.after ?? null,
          body: overview.body ?? null,
          facts: overview.facts ?? [],
          certificationsTitle: overview.certificationsTitle ?? null,
          certifications: overview.certifications ?? [],
        },
        { transaction: t }
      );
    }

    // GALLERY (many rows, replace all)
    if (payload.gallery) {
      const cells = Array.isArray(payload.gallery.cells) ? payload.gallery.cells : [];
      await CampaignProjectImage.destroy({ where: { campaignId }, transaction: t });
      if (cells.length > 0) {
        await CampaignProjectImage.bulkCreate(
          cells.map((cell, idx) => ({
            campaignId,
            tag: cell.tag ?? null,
            feature: Boolean(cell.feature),
            wideBottom: Boolean(cell.wideBottom),
            images: cell.images ?? [],
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // FLOORPLANS (1 row)
    if (payload.floorplans) {
      const floorplans = payload.floorplans;
      const title = floorplans.title || {};
      await CampaignSizeFloor.upsert(
        {
          campaignId,
          sectionLabel: floorplans.sectionLabel ?? null,
          titleBefore: title.before ?? null,
          titleItalic: title.italic ?? null,
          titleAfter: title.after ?? null,
          blueprintImage: floorplans.blueprintImage ?? null,
          defaultTabId: floorplans.defaultTabId ?? null,
          tabs: floorplans.tabs ?? [],
          panels: floorplans.panels ?? {},
        },
        { transaction: t }
      );
    }

    // AMENITIES (many rows, replace all)
    if (payload.amenities) {
      const items = Array.isArray(payload.amenities.items) ? payload.amenities.items : [];
      await CampaignAmenity.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignAmenity.bulkCreate(
          items.map((a, idx) => ({
            campaignId,
            icon: a.icon ?? null,
            name: a.name,
            desc: a.desc ?? null,
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // BENEFITS (1 row)
    if (payload.benefits) {
      const benefits = payload.benefits;
      const title = benefits.title || {};
      await CampaignProjectBenefits.upsert(
        {
          campaignId,
          sectionLabel: benefits.sectionLabel ?? null,
          titleBefore: title.before ?? null,
          titleItalic: title.italic ?? null,
          titleAfter: title.after ?? null,
          backgroundImages: benefits.backgroundImages ?? [],
          items: benefits.items ?? [],
          stats: benefits.stats ?? [],
        },
        { transaction: t }
      );
    }

    // HIGHLIGHTS (many rows, replace all)
    if (payload.highlights) {
      const items = Array.isArray(payload.highlights.items) ? payload.highlights.items : [];
      await CampaignHighlight.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignHighlight.bulkCreate(
          items.map((h, idx) => ({
            campaignId,
            num: h.num ?? null,
            icon: h.icon ?? null,
            title: h.title,
            text: h.text ?? null,
            sortOrder: idx,
          })),
          { transaction: t }
        );
      }
    }

    // SOCIAL INFRA (groups + items, replace all)
    if (payload.socialInfrastructure) {
      const groups = Array.isArray(payload.socialInfrastructure.groups)
        ? payload.socialInfrastructure.groups
        : [];

      const existing = await CampaignSocialInfraGroup.findAll({
        where: { campaignId },
        attributes: ["id"],
        transaction: t,
      });
      const existingIds = existing.map((g) => g.id);
      if (existingIds.length > 0) {
        await CampaignSocialInfraItem.destroy({ where: { groupId: existingIds }, transaction: t });
      }
      await CampaignSocialInfraGroup.destroy({ where: { campaignId }, transaction: t });

      for (let gi = 0; gi < groups.length; gi += 1) {
        const g = groups[gi];
        const groupRow = await CampaignSocialInfraGroup.create(
          { campaignId, title: g.title, sortOrder: gi },
          { transaction: t }
        );
        const gItems = Array.isArray(g.items) ? g.items : [];
        if (gItems.length > 0) {
          await CampaignSocialInfraItem.bulkCreate(
            gItems.map((it, ii) => ({
              groupId: groupRow.id,
              name: it.name,
              value: it.value ?? null,
              sortOrder: ii,
            })),
            { transaction: t }
          );
        }
      }
    }

    // DOCUMENTS (many rows, replace all)
    if (payload.documents) {
      const items = Array.isArray(payload.documents.items) ? payload.documents.items : [];
      await CampaignDocument.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignDocument.bulkCreate(
          items.map((d) => ({ campaignId, url: d.url, type: d.type })),
          { transaction: t }
        );
      }
    }

    // MEDIA (videos + reels in a single table)
    if (payload.media) {
      const items = Array.isArray(payload.media.items) ? payload.media.items : [];
      await CampaignMedia.destroy({ where: { campaignId }, transaction: t });
      if (items.length > 0) {
        await CampaignMedia.bulkCreate(
          items.map((m, idx) => ({
            campaignId,
            kind: m.kind,
            url: m.url,
            sortOrder: Number.isInteger(m.sortOrder) ? m.sortOrder : idx,
          })),
          { transaction: t }
        );
      }
    }
  });

  return getCampaignById(campaignId);
}

// async function updateCampaign(id, data) {
//   const row = await CampaignMaster.findByPk(id);
//   if (!row) throw notFound();
//   const { title, desc, email, mobile, address, logo, reg_no } = data;
//   const patch = {};
//   if (title !== undefined) patch.title = title;
//   if (desc !== undefined) patch.desc = desc;
//   if (email !== undefined) patch.email = email;
//   if (mobile !== undefined) patch.mobile = mobile;
//   if (address !== undefined) patch.address = address;
//   if (logo !== undefined) patch.logo = logo;
//   if (reg_no !== undefined) patch.regNo = reg_no;
//   await row.update(patch);
//   return row.reload();
// }

// async function deleteCampaign(id) {
//   const n = await CampaignMaster.destroy({ where: { id } });
//   if (n === 0) throw notFound();
// }

// async function upsertHero(campaignId, hero) {
//   const backgroundImages = Array.isArray(hero.backgroundImages) ? hero.backgroundImages : [];
//   return sequelize.transaction(async (t) => {
//     const [heroRow] = await CampaignHeroData.findOrCreate({
//       where: { campaignId },
//       defaults: { campaignId, data: hero },
//       transaction: t,
//     });
//     await heroRow.update({ data: hero }, { transaction: t });

//     await CampaignBanner.destroy({ where: { campaignId }, transaction: t });
//     if (backgroundImages.length > 0) {
//       await CampaignBanner.bulkCreate(
//         backgroundImages.map((img, idx) => ({
//           campaignId,
//           imageId: img.src,
//           alt: img.alt ?? null,
//           sortOrder: idx,
//         })),
//         { transaction: t }
//       );
//     }

//     return CampaignHeroData.findOne({ where: { campaignId }, transaction: t });
//   });
// }

// async function upsertOverview(campaignId, overview) {
//   const title = overview.title || {};
//   const payload = {
//     sectionLabel: overview.sectionLabel ?? null,
//     titleBefore: title.before ?? null,
//     titleItalic: title.italic ?? null,
//     titleAfter: title.after ?? null,
//     body: overview.body ?? null,
//     facts: overview.facts ?? [],
//     certificationsTitle: overview.certificationsTitle ?? null,
//     certifications: overview.certifications ?? [],
//   };

//   const [row, created] = await CampaignProjectOverview.findOrCreate({
//     where: { campaignId },
//     defaults: { campaignId, ...payload },
//   });
//   if (!created) await row.update(payload);
//   return row.reload();
// }

// async function replaceGallery(campaignId, gallery) {
//   const cells = Array.isArray(gallery.cells) ? gallery.cells : [];
//   return sequelize.transaction(async (t) => {
//     await CampaignProjectImage.destroy({ where: { campaignId }, transaction: t });
//     if (cells.length > 0) {
//       await CampaignProjectImage.bulkCreate(
//         cells.map((cell, idx) => ({
//           campaignId,
//           tag: cell.tag ?? null,
//           feature: Boolean(cell.feature),
//           wideBottom: Boolean(cell.wideBottom),
//           images: cell.images ?? [],
//           sortOrder: idx,
//         })),
//         { transaction: t }
//       );
//     }
//     return CampaignProjectImage.findAll({
//       where: { campaignId },
//       order: [["sort_order", "ASC"]],
//       transaction: t,
//     });
//   });
// }

// async function upsertFloorplans(campaignId, floorplans) {
//   const title = floorplans.title || {};
//   const payload = {
//     sectionLabel: floorplans.sectionLabel ?? null,
//     titleBefore: title.before ?? null,
//     titleItalic: title.italic ?? null,
//     titleAfter: title.after ?? null,
//     blueprintImage: floorplans.blueprintImage ?? null,
//     defaultTabId: floorplans.defaultTabId ?? null,
//     tabs: floorplans.tabs ?? [],
//     panels: floorplans.panels ?? {},
//   };
//   const [row, created] = await CampaignSizeFloor.findOrCreate({
//     where: { campaignId },
//     defaults: { campaignId, ...payload },
//   });
//   if (!created) await row.update(payload);
//   return row.reload();
// }

// async function replaceAmenities(campaignId, amenities) {
//   const items = Array.isArray(amenities.items) ? amenities.items : [];
//   return sequelize.transaction(async (t) => {
//     await CampaignAmenity.destroy({ where: { campaignId }, transaction: t });
//     if (items.length > 0) {
//       await CampaignAmenity.bulkCreate(
//         items.map((a, idx) => ({
//           campaignId,
//           icon: a.icon ?? null,
//           name: a.name,
//           desc: a.desc ?? null,
//           sortOrder: idx,
//         })),
//         { transaction: t }
//       );
//     }
//     return CampaignAmenity.findAll({
//       where: { campaignId },
//       order: [["sort_order", "ASC"]],
//       transaction: t,
//     });
//   });
// }

// async function upsertBenefits(campaignId, benefits) {
//   const title = benefits.title || {};
//   const payload = {
//     sectionLabel: benefits.sectionLabel ?? null,
//     titleBefore: title.before ?? null,
//     titleItalic: title.italic ?? null,
//     titleAfter: title.after ?? null,
//     backgroundImages: benefits.backgroundImages ?? [],
//     items: benefits.items ?? [],
//     stats: benefits.stats ?? [],
//   };
//   const [row, created] = await CampaignProjectBenefits.findOrCreate({
//     where: { campaignId },
//     defaults: { campaignId, ...payload },
//   });
//   if (!created) await row.update(payload);
//   return row.reload();
// }

// async function replaceHighlights(campaignId, highlights) {
//   const items = Array.isArray(highlights.items) ? highlights.items : [];
//   return sequelize.transaction(async (t) => {
//     await CampaignHighlight.destroy({ where: { campaignId }, transaction: t });
//     if (items.length > 0) {
//       await CampaignHighlight.bulkCreate(
//         items.map((h, idx) => ({
//           campaignId,
//           num: h.num ?? null,
//           icon: h.icon ?? null,
//           title: h.title,
//           text: h.text ?? null,
//           sortOrder: idx,
//         })),
//         { transaction: t }
//       );
//     }
//     return CampaignHighlight.findAll({
//       where: { campaignId },
//       order: [["sort_order", "ASC"]],
//       transaction: t,
//     });
//   });
// }

// async function replaceSocialInfrastructure(campaignId, social) {
//   const groups = Array.isArray(social.groups) ? social.groups : [];
//   return sequelize.transaction(async (t) => {
//     await CampaignSocialInfraGroup.destroy({ where: { campaignId }, transaction: t });

//     for (let gi = 0; gi < groups.length; gi += 1) {
//       const g = groups[gi];
//       const createdGroup = await CampaignSocialInfraGroup.create(
//         { campaignId, title: g.title, sortOrder: gi },
//         { transaction: t }
//       );
//       const gItems = Array.isArray(g.items) ? g.items : [];
//       if (gItems.length > 0) {
//         await CampaignSocialInfraItem.bulkCreate(
//           gItems.map((it, ii) => ({
//             groupId: createdGroup.id,
//             name: it.name,
//             value: it.value ?? null,
//             sortOrder: ii,
//           })),
//           { transaction: t }
//         );
//       }
//     }

//     const rows = await CampaignSocialInfraGroup.findAll({
//       where: { campaignId },
//       order: [["sort_order", "ASC"]],
//       include: [{ association: "items", required: false }],
//       transaction: t,
//     });
//     for (const gr of rows) {
//       if (gr.items) gr.items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
//     }
//     return rows;
//   });
// }

// async function replaceDocuments(campaignId, documents) {
//   const items = Array.isArray(documents.items) ? documents.items : [];
//   return sequelize.transaction(async (t) => {
//     await CampaignDocument.destroy({ where: { campaignId }, transaction: t });
//     if (items.length > 0) {
//       await CampaignDocument.bulkCreate(
//         items.map((d) => ({ campaignId, url: d.url, type: d.type })),
//         { transaction: t }
//       );
//     }
//     return CampaignDocument.findAll({ where: { campaignId }, transaction: t });
//   });
// }

module.exports = {
  listCampaigns,
  getCampaignById,
  createCampaign,
  createCampaignFull,
  updateCampaignFull,
  // updateCampaign,
  // deleteCampaign,
  // upsertHero,
  // upsertOverview,
  // replaceGallery,
  // upsertFloorplans,
  // replaceAmenities,
  // upsertBenefits,
  // replaceHighlights,
  // replaceSocialInfrastructure,
  // replaceDocuments,
};
