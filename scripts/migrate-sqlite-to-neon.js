#!/usr/bin/env node
/**
 * @deprecated Prefer `node scripts/migrate-local-to-neon.js` (same SQLite-only path when
 * SOURCE_DATABASE_URL is unset).
 */
delete process.env.SOURCE_DATABASE_URL;
require('./migrate-local-to-neon.js');
