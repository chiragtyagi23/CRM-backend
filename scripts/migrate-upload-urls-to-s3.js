require('../src/config/loadEnv');

const { sequelize } = require('../src/models');

const OLD_BASES = [
  process.env.MIGRATE_OLD_UPLOAD_BASE || 'http://localhost:4000/uploads',
  'http://127.0.0.1:4000/uploads',
  'https://crm-backend-ydni.onrender.com/uploads',
].map((b) => b.replace(/\/+$/, ''));

const NEW_BASE = (
  process.env.AWS_S3_PUBLIC_BASE_URL ||
  process.env.MIGRATE_NEW_UPLOAD_BASE ||
  'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads'
).replace(/\/+$/, '');

function replaceInString(value) {
  if (value == null || typeof value !== 'string') return value;
  let out = value;
  for (const old of OLD_BASES) {
    if (out.includes(old)) out = out.split(old).join(NEW_BASE);
  }
  if (out.startsWith('/uploads/')) {
    out = `${NEW_BASE}${out.slice('/uploads'.length)}`;
  }
  return out;
}

function replaceInJson(value) {
  if (value == null) return value;
  if (typeof value === 'string') return replaceInString(value);
  if (Array.isArray(value)) return value.map(replaceInJson);
  if (typeof value === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'src' || k === 'url' || k === 'icon' || k === 'image' || k === 'imageId' || k === 'blueprintImage') {
        next[k] = typeof v === 'string' ? replaceInString(v) : replaceInJson(v);
      } else {
        next[k] = replaceInJson(v);
      }
    }
    return next;
  }
  return value;
}

function needsReplace(value) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return OLD_BASES.some((b) => s.includes(b)) || s.includes('"/uploads/') || s.includes("'/uploads/");
}

async function updateTextColumn(table, column) {
  const quoted = column === 'desc' ? '"desc"' : column;
  let total = 0;
  for (const old of OLD_BASES) {
    const [, meta] = await sequelize.query(
      `UPDATE ${table} SET ${quoted} = REPLACE(${quoted}, :old, :new) WHERE ${quoted} LIKE :like`,
      { replacements: { old: `${old}/`, new: `${NEW_BASE}/`, like: `%${old}%` } },
    );
    total += meta?.rowCount ?? 0;
  }
  const [, relMeta] = await sequelize.query(
    `UPDATE ${table} SET ${quoted} = :new || SUBSTRING(${quoted} FROM 10)
     WHERE ${quoted} LIKE '/uploads/%'`,
    { replacements: { new: `${NEW_BASE}/` } },
  );
  total += relMeta?.rowCount ?? 0;
  return total;
}

async function updateJsonColumn(table, column) {
  const rows = await sequelize.query(`SELECT id, ${column} AS data FROM ${table}`, {
    type: sequelize.QueryTypes.SELECT,
  });
  let updated = 0;
  for (const row of rows) {
    if (!needsReplace(row.data)) continue;
    const next = replaceInJson(row.data);
    await sequelize.query(`UPDATE ${table} SET ${column} = :data::jsonb WHERE id = :id`, {
      replacements: { data: JSON.stringify(next), id: row.id },
    });
    updated += 1;
  }
  return updated;
}

async function main() {
  console.log('Migrating upload URLs to S3 base:');
  console.log('  FROM:', OLD_BASES.join(', '));
  console.log('  TO:  ', NEW_BASE);

  const textUpdates = [
    ['campaign_master_table', 'logo'],
    ['campaign_master_table', 'cover_image'],
    ['campaign_document_table', 'url'],
    ['campaign_banner_data', 'image_id'],
    ['campaign_media', 'url'],
    ['campaign_size_floor', 'blueprint_image'],
    ['campaign_project_highlights', 'icon'],
    ['campaign_amenities', 'icon'],
  ];

  const jsonUpdates = [
    ['campaign_hero_data', 'data'],
    ['campaign_project_images', 'images'],
    ['campaign_project_benefits', 'background_images'],
    ['campaign_project_benefits', 'items'],
    ['campaign_project_benefits', 'stats'],
    ['campaign_size_floor', 'panels'],
    ['campaign_size_floor', 'tabs'],
  ];

  for (const [table, col] of textUpdates) {
    const n = await updateTextColumn(table, col);
    console.log(`  ${table}.${col}: ${n} row(s) (text replace)`);
  }

  for (const [table, col] of jsonUpdates) {
    const n = await updateJsonColumn(table, col);
    console.log(`  ${table}.${col}: ${n} row(s) (jsonb)`);
  }

  console.log('Done.');
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
