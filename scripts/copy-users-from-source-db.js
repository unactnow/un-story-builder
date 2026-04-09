#!/usr/bin/env node
/**
 * Copy the `users` table from another Postgres (e.g. un-peace-dictionary on Neon)
 * into the Story Builder auth database (AUTH_DATABASE_URL if set, else DATABASE_URL).
 *
 * Schemas must match (same Express template User model). Uses upsert on `username`
 * so existing rows are updated; new users are inserted.
 *
 * Usage:
 *   SOURCE_DATABASE_URL="postgresql://..." npm run copy:users
 *
 * Optional — replace all Story Builder users with only the source rows (truncates
 * `users` and dependent `password_reset_tokens` on the target first):
 *   SOURCE_DATABASE_URL="postgresql://..." npm run copy:users -- --replace
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharedEnv = path.join(__dirname, '..', '..', 'un-shared-auth-db', '.env');
if (!process.env.AUTH_DATABASE_URL && fs.existsSync(sharedEnv)) {
  require('dotenv').config({ path: sharedEnv });
}
const { getAuthDatabaseUrl, getDatabaseUrl } = require('../config/database-url');
const { Pool } = require('pg');

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = getAuthDatabaseUrl() || getDatabaseUrl();
const replace = process.argv.includes('--replace');

function pool(url) {
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 2,
  });
}

async function main() {
  if (!sourceUrl || !targetUrl) {
    console.error('Set SOURCE_DATABASE_URL (source) and AUTH_DATABASE_URL or DATABASE_URL (Story Builder user store).');
    process.exit(1);
  }
  if (sourceUrl === targetUrl) {
    console.error('SOURCE_DATABASE_URL and DATABASE_URL must be different databases.');
    process.exit(1);
  }

  require('../models');
  const authSequelize = require('../config/auth-database');
  await authSequelize.sync({ alter: true });
  console.log('Auth database schema ready.');

  const src = pool(sourceUrl);
  const dst = pool(targetUrl);

  const clientSrc = await src.connect();
  const clientDst = await dst.connect();

  try {
    const { rows } = await clientSrc.query('SELECT * FROM users ORDER BY "createdAt"');
    if (rows.length === 0) {
      console.log('Source users table is empty. Nothing to copy.');
      return;
    }

    await clientDst.query('BEGIN');

    if (replace) {
      const { rows: chk } = await clientDst.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) AS e;
      `);
      if (chk[0].e) {
        await clientDst.query('TRUNCATE TABLE users CASCADE');
        console.log('Target: truncated users (and tokens) (--replace).');
      }
    }

    const first = rows[0];
    const cols = Object.keys(first);
    const colList = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(', ');
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const updateCols = cols.filter((c) => c !== 'username' && c !== 'id');
    const setClause = updateCols
      .map((c) => `"${c.replace(/"/g, '""')}" = EXCLUDED."${c.replace(/"/g, '""')}"`)
      .join(', ');

    const insertSql = replace
      ? `INSERT INTO users (${colList}) VALUES (${placeholders})`
      : `INSERT INTO users (${colList}) VALUES (${placeholders})
         ON CONFLICT ("username") DO UPDATE SET ${setClause}`;

    let n = 0;
    for (const row of rows) {
      const vals = cols.map((c) => row[c]);
      await clientDst.query(insertSql, vals);
      n += 1;
    }

    let tokRows = [];
    try {
      tokRows = (await clientSrc.query(
        'SELECT * FROM password_reset_tokens ORDER BY "createdAt"'
      )).rows;
    } catch (e) {
      if (e.code === '42P01') {
        console.log('Source has no password_reset_tokens table; skipping tokens.');
      } else {
        throw e;
      }
    }
    let tn = 0;
    if (tokRows.length) {
      const t0 = tokRows[0];
      const tc = Object.keys(t0);
      const tColList = tc.map((c) => `"${c.replace(/"/g, '""')}"`).join(', ');
      const tPlace = tc.map((_, i) => `$${i + 1}`).join(', ');
      const tokInsert = `INSERT INTO password_reset_tokens (${tColList}) VALUES (${tPlace}) ON CONFLICT (id) DO NOTHING`;
      for (const row of tokRows) {
        await clientDst.query(tokInsert, tc.map((c) => row[c]));
        tn += 1;
      }
    }

    await clientDst.query('COMMIT');
    console.log(
      `Copied ${n} user(s) and ${tn} password_reset_token(s) from source ${replace ? '(replace mode)' : '(merge on username)'}`
    );
  } catch (e) {
    await clientDst.query('ROLLBACK');
    throw e;
  } finally {
    clientSrc.release();
    clientDst.release();
    await src.end();
    await dst.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
