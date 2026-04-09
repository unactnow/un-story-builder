#!/usr/bin/env node
/**
 * Copies users + password_reset_tokens from this app's DATABASE_URL into
 * AUTH_DATABASE_URL. Merges ../../un-shared-auth-db/.env if AUTH_DATABASE_URL
 * is not set in .env. (Schema sync happens inside copy-users-from-source-db.js.)
 *
 *   npm run clone:users-to-auth
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

require('dotenv').config();

const sharedEnv = path.join(__dirname, '..', '..', 'un-shared-auth-db', '.env');
if (!process.env.AUTH_DATABASE_URL && fs.existsSync(sharedEnv)) {
  require('dotenv').config({ path: sharedEnv });
}

const appDb = process.env.DATABASE_URL;
const authDb = process.env.AUTH_DATABASE_URL;

if (!appDb || !authDb) {
  console.error(
    'Set DATABASE_URL (Story Builder app) and AUTH_DATABASE_URL (shared auth), or put AUTH_DATABASE_URL in un-shared-auth-db/.env'
  );
  process.exit(1);
}
if (appDb === authDb) {
  console.error('DATABASE_URL and AUTH_DATABASE_URL must point to different databases.');
  process.exit(1);
}

process.env.SOURCE_DATABASE_URL = appDb;

const r = spawnSync(
  process.execPath,
  [path.join(__dirname, 'copy-users-from-source-db.js'), '--replace'],
  { cwd: path.join(__dirname, '..'), stdio: 'inherit', env: process.env }
);
process.exit(r.status ?? 1);
