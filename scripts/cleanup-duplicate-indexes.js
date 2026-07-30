require("../src/config/loadEnv");
const { Client } = require("pg");
const { env } = require("../src/config/env");

/**
 * Sequelize sync({ alter: true }) recreates unique constraints as
 * table_col_key / table_col_key1 / table_col_key2 / ...
 * Drop numbered duplicates; keep one bare *_key (or a named *_unique).
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const c = new Client({
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    query_timeout: 120000,
  });
  await c.connect();

  const { rows: constraints } = await c.query(`
    SELECT
      n.nspname AS schema,
      t.relname AS table_name,
      c.conname AS constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND c.contype = 'u'
      AND c.conname ~ '_key[0-9]+$'
    ORDER BY t.relname, c.conname
  `);

  // Also drop bare *_key when a sibling *_unique constraint/index exists.
  const { rows: bareKeys } = await c.query(`
    SELECT
      t.relname AS table_name,
      c.conname AS constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND c.contype = 'u'
      AND c.conname ~ '_key$'
      AND EXISTS (
        SELECT 1
        FROM pg_indexes i
        WHERE i.schemaname = 'public'
          AND i.tablename = t.relname
          AND i.indexname = regexp_replace(c.conname, '_key$', '_unique')
      )
    ORDER BY t.relname, c.conname
  `);

  const toDrop = [...constraints, ...bareKeys];
  const before = (
    await c.query(`SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname = 'public'`)
  ).rows[0].n;

  console.log(`Indexes before: ${before}`);
  console.log(`Unique constraints to drop: ${toDrop.length}`);
  if (dryRun) {
    for (const row of toDrop.slice(0, 40)) {
      console.log(`${row.table_name}.${row.constraint_name}`);
    }
    if (toDrop.length > 40) console.log(`... and ${toDrop.length - 40} more`);
    await c.end();
    return;
  }

  let dropped = 0;
  for (const row of toDrop) {
    await c.query(
      `ALTER TABLE ${quoteIdent(row.table_name)} DROP CONSTRAINT IF EXISTS ${quoteIdent(row.constraint_name)}`,
    );
    dropped += 1;
    if (dropped % 100 === 0) console.log(`Dropped ${dropped}/${toDrop.length}...`);
  }

  // Any leftover numbered unique indexes that are not constraints
  const { rows: leftoverIndexes } = await c.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname ~ '_key[0-9]+$'
  `);
  for (const row of leftoverIndexes) {
    await c.query(`DROP INDEX IF EXISTS ${quoteIdent(row.indexname)}`);
    dropped += 1;
  }

  const after = (
    await c.query(`SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname = 'public'`)
  ).rows[0].n;
  console.log(`Done. Dropped ${dropped} objects. Indexes after: ${after}`);
  await c.end();
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
