/**
 * Remove duplicate stylesheet/script tags from pasted timeline (or story) export HTML
 * when embedded in a story code block, so the page head does not load assets twice.
 */
function stripEmbeddedExportAssets(html) {
  let s = String(html || '');

  // Asset annotation comments from our exporters (current + legacy wording)
  s = s.replace(/<!--\s*Stylesheet — base typography and layout styles[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Stylesheet — UN Peace and Security base[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Stylesheet — feature story and timeline styles[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Stylesheet — feature story and timeline merged bundle[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Script — feature story and timeline scripts[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Script — feature story and timeline behaviour[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Base UN peace and security[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Feature story & timeline:[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Feature story:[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Timeline:[\s\S]*?-->\s*/gi, '');
  s = s.replace(/<!--\s*Browser default reset[\s\S]*?-->\s*/gi, '');

  // Standalone preview reset
  s = s.replace(/<link\b[^>]*href=["'][^"']*\/export\/preview-reset\.css[^"']*["'][^>]*>\s*/gi, '');
  s = s.replace(
    /<link\b[^>]*href=["'][^"']*cdn\.jsdelivr\.net\/gh\/[^"']*\/public\/export\/preview-reset\.css[^"']*["'][^>]*>\s*/gi,
    ''
  );

  // Base UN stylesheet (CDN) — current repo name and legacy embeds
  s = s.replace(
    /<link\b[^>]*href=["'][^"']*(?:un-stylesheet|un-peace-and-security-stylesheet)[^"']*["'][^>]*>\s*/gi,
    ''
  );

  // Merged or legacy export stylesheets (relative or jsDelivr)
  s = s.replace(/<link\b[^>]*href=["'][^"']*\/export\/styles\.css[^"']*["'][^>]*>\s*/gi, '');
  s = s.replace(/<link\b[^>]*href=["'][^"']*\/export\/story\/styles\.css[^"']*["'][^>]*>\s*/gi, '');
  s = s.replace(/<link\b[^>]*href=["'][^"']*\/export\/timeline\/styles\.css[^"']*["'][^>]*>\s*/gi, '');
  s = s.replace(
    /<link\b[^>]*href=["'][^"']*cdn\.jsdelivr\.net\/gh\/[^"']*\/public\/export\/styles\.css[^"']*["'][^>]*>\s*/gi,
    ''
  );
  s = s.replace(
    /<link\b[^>]*href=["'][^"']*cdn\.jsdelivr\.net\/gh\/[^"']*\/public\/export\/(?:story|timeline)\/styles\.css[^"']*["'][^>]*>\s*/gi,
    ''
  );

  // Merged or legacy export scripts
  s = s.replace(
    /<script\b[^>]*src=["'][^"']*\/export\/functions\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );
  s = s.replace(
    /<script\b[^>]*src=["'][^"']*\/export\/story\/functions\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );
  s = s.replace(
    /<script\b[^>]*src=["'][^"']*\/export\/timeline\/functions\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );
  s = s.replace(
    /<script\b[^>]*src=["'][^"']*cdn\.jsdelivr\.net\/gh\/[^"']*\/public\/export\/functions\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );
  s = s.replace(
    /<script\b[^>]*src=["'][^"']*cdn\.jsdelivr\.net\/gh\/[^"']*\/public\/export\/(?:story|timeline)\/functions\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    ''
  );

  return s.replace(/^\s+/, '').trimEnd();
}

module.exports = { stripEmbeddedExportAssets };
