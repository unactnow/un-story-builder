#!/usr/bin/env node
/**
 * Copy app data into the database pointed to by DATABASE_URL (Neon).
 *
 * Full migration (users, stories, timelines, revisions, settings):
 *   Set SOURCE_DATABASE_URL to another Postgres that already has Story Builder data
 *   (e.g. local Postgres, or a Neon dev branch). DATABASE_URL = target Neon.
 *
 *   SOURCE_DATABASE_URL=postgresql://... DATABASE_URL=postgresql://... node scripts/migrate-local-to-neon.js
 *
 * SQLite fallback (no SOURCE_DATABASE_URL):
 *   Copies only users, password_reset_tokens, settings from database.sqlite.
 *   This repo's database.sqlite is often a legacy CMS schema: it does NOT contain
 *   feature_stories / timelines. For those, use SOURCE_DATABASE_URL from a Postgres
 *   where you ran the app and created content.
 */
require('dotenv').config();
const path = require('path');
const { execSync } = require('child_process');
const { Pool } = require('pg');

const sqlitePath = path.join(__dirname, '..', 'database.sqlite');

const TABLES_COPY_ORDER = [
  'users',
  'password_reset_tokens',
  'settings',
  'feature_stories',
  'story_blocks',
  'story_revisions',
  'timelines',
  'timeline_events',
  'timeline_revisions',
];

const TRUNCATE_ORDER = [
  'story_blocks',
  'story_revisions',
  'timeline_events',
  'timeline_revisions',
  'feature_stories',
  'timelines',
  'password_reset_tokens',
  'settings',
  'users',
];

function pool(connectionString) {
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 2,
  });
}

async function tableExists(client, name) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return r.rows.length > 0;
}

async function copyTable(src, dst, tableName) {
  const exists = await tableExists(src, tableName);
  if (!exists) {
    console.log(`Source: skip ${tableName} (missing)`);
    return 0;
  }
  const { rows } = await src.query(`SELECT * FROM "${tableName}"`);
  if (rows.length === 0) {
    console.log(`Source: ${tableName} (0 rows)`);
    return 0;
  }
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders})`;
  let n = 0;
  for (const row of rows) {
    const vals = cols.map((c) => row[c]);
    await dst.query(insertSql, vals);
    n += 1;
  }
  console.log(`Copied ${tableName}: ${n} rows`);
  return n;
}

async function migratePostgresToPostgres() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    throw new Error('SOURCE_DATABASE_URL and DATABASE_URL are required for Postgres→Postgres migration');
  }
  if (sourceUrl === targetUrl) {
    throw new Error('SOURCE_DATABASE_URL and DATABASE_URL must differ');
  }

  const src = pool(sourceUrl);
  const dst = pool(targetUrl);

  const clientSrc = await src.connect();
  const clientDst = await dst.connect();

  try {
    await clientDst.query('BEGIN');

    const hasUsers = await tableExists(clientDst, 'users');
    if (!hasUsers) {
      throw new Error('Target has no users table. Run the app or sequelize.sync once against DATABASE_URL first.');
    }

    const toTruncate = [];
    for (const t of TRUNCATE_ORDER) {
      if (await tableExists(clientDst, t)) toTruncate.push(`"${t}"`);
    }
    if (toTruncate.length) {
      await clientDst.query(`TRUNCATE TABLE ${toTruncate.join(', ')} CASCADE`);
    }

    for (const t of TABLES_COPY_ORDER) {
      await copyTable(clientSrc, clientDst, t);
    }

    await clientDst.query('COMMIT');
    console.log('Postgres→Postgres migration finished.');
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

function sqliteJson(query) {
  const safe = query.replace(/"/g, '""');
  const out = execSync(`sqlite3 "${sqlitePath}" -json "${safe}"`, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  }).trim();
  if (!out) return [];
  return JSON.parse(out);
}

function sqliteHasTable(name) {
  const n = execSync(
    `sqlite3 "${sqlitePath}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='${name}'"`,
    { encoding: 'utf8' }
  ).trim();
  return n === '1';
}

async function migrateSqlitePartial() {
  const {
    sequelize,
    User,
    PasswordResetToken,
    Setting,
  } = require('../models');

  await sequelize.sync({ alter: true });

  const users = sqliteJson('SELECT * FROM users');
  const tokens = sqliteJson('SELECT * FROM password_reset_tokens');
  const settings = sqliteJson('SELECT * FROM settings');

  console.log(
    `SQLite: ${users.length} users, ${tokens.length} reset tokens, ${settings.length} settings`
  );

  if (users.length) {
    await User.bulkCreate(users, { validate: true, ignoreDuplicates: true });
    console.log('Users migrated.');
  }
  if (tokens.length) {
    await PasswordResetToken.bulkCreate(tokens, { validate: true, ignoreDuplicates: true });
    console.log('Password reset tokens migrated.');
  }
  if (settings.length) {
    for (const row of settings) {
      await Setting.upsert(row);
    }
    console.log('Settings migrated.');
  }

  const hasStories = sqliteHasTable('feature_stories');
  if (!hasStories) {
    console.warn(
      '\nNote: database.sqlite has no feature_stories table (legacy CMS schema or empty). ' +
        'Stories and timelines live in PostgreSQL only. To copy them, set SOURCE_DATABASE_URL ' +
        'to the Postgres where you built that content (e.g. another Neon branch), then run this script again.\n'
    );
  } else {
    console.warn(
      'SQLite contains feature_stories; Postgres→Postgres path is preferred. ' +
        'Add SOURCE_DATABASE_URL for a full copy.'
    );
  }

  await sequelize.close();
}

async function main() {
  if (process.env.SOURCE_DATABASE_URL) {
    await migratePostgresToPostgres();
    return;
  }
  await migrateSqlitePartial();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
