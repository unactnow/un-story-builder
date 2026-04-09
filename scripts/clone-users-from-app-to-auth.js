#!/usr/bin/env node
/**
 * Copies users + password_reset_tokens from this app's DATABASE_URL (where they
 * lived before split auth) into AUTH_DATABASE_URL. Requires both in .env.
 *
 *   npm run clone:users-to-auth
 */
require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');

const appDb = process.env.DATABASE_URL;
const authDb = process.env.AUTH_DATABASE_URL;

if (!appDb || !authDb) {
  console.error(
    'Set DATABASE_URL (Story Builder app database) and AUTH_DATABASE_URL (shared auth) in .env'
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
