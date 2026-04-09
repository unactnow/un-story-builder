'use strict';

/**
 * Neon dashboard URIs sometimes include channel_binding=require (SCRAM).
 * node-postgres + serverless poolers often work more reliably without it.
 */
function normalizeDatabaseUrl(raw) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return raw;
  }
}

function getDatabaseUrl() {
  return normalizeDatabaseUrl(process.env.DATABASE_URL);
}

/** When set, shared users + password_reset_tokens live on this Postgres. */
function getAuthDatabaseUrl() {
  if (!process.env.AUTH_DATABASE_URL) return null;
  return normalizeDatabaseUrl(process.env.AUTH_DATABASE_URL);
}

module.exports = { normalizeDatabaseUrl, getDatabaseUrl, getAuthDatabaseUrl };
