/**
 * Base URL for story / timeline export CSS and JS (`styles.css`, `functions.js`) in exported HTML.
 * Defaults to jsDelivr serving files from this repo's `public/` on GitHub.
 *
 * Override with EXPORT_ASSET_BASE_URL (e.g. your deployed app or another CDN base that includes `/public` in the path).
 */
const DEFAULT_JSDELIVR_REPO = process.env.EXPORT_JSDELIVR_REPO || 'unactnow/un-feature-stories-timelines';
const DEFAULT_JSDELIVR_REF = process.env.EXPORT_JSDELIVR_REF || 'main';

function getExportAssetBase() {
  const explicit = process.env.EXPORT_ASSET_BASE_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).replace(/\/$/, '');
  }
  return `https://cdn.jsdelivr.net/gh/${DEFAULT_JSDELIVR_REPO}@${DEFAULT_JSDELIVR_REF}/public`;
}

/**
 * @param {string} relPath - path starting with /, e.g. /export/styles.css
 */
function exportAssetUrl(relPath) {
  const p = relPath.startsWith('/') ? relPath : `/${relPath}`;
  return `${getExportAssetBase()}${p}`;
}

/**
 * Same-origin absolute URLs for /public assets (e.g. /export/styles.css) when rendering
 * preview in the admin. Avoids relying on jsDelivr when developing locally or offline.
 *
 * @param {import('express').Request} req
 * @param {string} relPath - path starting with /, e.g. /export/styles.css
 */
function exportAssetUrlForRequest(req, relPath) {
  if (!req || typeof req.get !== 'function') {
    return exportAssetUrl(relPath);
  }
  const host = req.get('host');
  if (!host) {
    return exportAssetUrl(relPath);
  }
  const p = relPath.startsWith('/') ? relPath : `/${relPath}`;
  let proto = req.protocol || 'http';
  const forwarded = req.get('x-forwarded-proto');
  if (forwarded) {
    proto = String(forwarded).split(',')[0].trim();
  }
  return `${proto}://${host}${p}`;
}

/**
 * Admin preview: in production, merged CSS/JS use jsDelivr (same URLs as export downloads).
 * In non-production, use same-origin URLs so preview works offline / without CDN.
 *
 * @param {import('express').Request} req
 * @param {string} relPath - path starting with /, e.g. /export/styles.css
 */
function mergedAssetUrlForPreview(req, relPath) {
  if (process.env.NODE_ENV === 'production') {
    return exportAssetUrl(relPath);
  }
  if (req && typeof req.get === 'function') {
    return exportAssetUrlForRequest(req, relPath);
  }
  return exportAssetUrl(relPath);
}

/** jsDelivr copy of the UN peace & security base typography stylesheet (same as photo essay template). */
const BASE_PEACE_STYLESHEET_CDN =
  'https://cdn.jsdelivr.net/gh/robertirish/un-peace-and-security-stylesheet@main/styles.css';

/** Served from `public/vendor/un-peace-and-security-stylesheet/styles.css` for offline local preview. */
const BASE_PEACE_STYLESHEET_LOCAL = '/vendor/un-peace-and-security-stylesheet/styles.css';

/**
 * Base UN stylesheet: CDN for export and production preview; same-origin local file for non-production preview only.
 *
 * @param {import('express').Request | undefined} req - set when rendering admin preview
 */
function basePeaceAndSecurityStylesheetHref(req) {
  if (!req || typeof req.get !== 'function') {
    return BASE_PEACE_STYLESHEET_CDN;
  }
  if (process.env.NODE_ENV === 'production') {
    return BASE_PEACE_STYLESHEET_CDN;
  }
  return exportAssetUrlForRequest(req, BASE_PEACE_STYLESHEET_LOCAL);
}

module.exports = {
  getExportAssetBase,
  exportAssetUrl,
  exportAssetUrlForRequest,
  mergedAssetUrlForPreview,
  basePeaceAndSecurityStylesheetHref,
  BASE_PEACE_STYLESHEET_CDN,
  BASE_PEACE_STYLESHEET_LOCAL,
};
