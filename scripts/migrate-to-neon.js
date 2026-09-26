// One-time migration runner: ports supabase/migrations/*.sql onto the new
// Neon database. Strips `ALTER PUBLICATION supabase_realtime ...` lines
// (not applicable on Neon — see migration notes) and runs each file as one
// multi-statement script via node-postgres's simple query protocol, which
// (unlike the Neon MCP's prepared-statement based tool) executes a whole
// semicolon-separated script in one call.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CONNECTION_STRING = process.env.NEON_DATABASE_URL;
if (!CONNECTION_STRING) {
  console.error('Set NEON_DATABASE_URL first.');
  process.exit(1);
}

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const resumeFrom = process.env.RESUME_FROM; // e.g. "003" to skip already-applied files
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => !resumeFrom || f >= resumeFrom)
  .sort();

function stripRealtimePublication(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*ALTER\s+PUBLICATION\s+supabase_realtime/i.test(line))
    .join('\n');
}

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  // PostGIS/H3 types (geography, h3index, ...) live in the `extensions`
  // schema; Supabase's own projects put them on every role's search_path by
  // default, so the original migrations reference them unqualified.
  await client.query('SET search_path TO public, extensions');

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const sql = stripRealtimePublication(raw);
    process.stdout.write(`Running ${file} ... `);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('OK');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.log('FAILED');
      console.error(`  ${err.message}`);
      console.error(`  (position hint: ${err.position ?? 'n/a'})`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('All migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
