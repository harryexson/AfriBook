const fs = require('fs');
const { Client } = require('pg');

const CONNECTION_STRING = process.env.NEON_DATABASE_URL;
const grants = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  await client.query('SET search_path TO public, extensions');
  let ok = 0;
  for (const stmt of grants) {
    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      console.log('FAILED:', stmt.slice(0, 100).replace(/\n/g, ' '));
      console.log('  ', err.message);
    }
  }
  console.log(`Reapplied ${ok}/${grants.length} grant/revoke statements.`);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
