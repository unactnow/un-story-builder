const { exportAssetUrl, mergedAssetUrlForPreview, basePeaceAndSecurityStylesheetHref } = require('./exportAssetUrls');
const { htmlCommentSafe } = require('./htmlComment');
const { stripEmbeddedExportAssets } = require('./stripEmbedAssets');
const { sanitizeRichText, isStoredRichHtml } = require('./sanitizeRichText');

/** Matches admin block type labels (views/admin/story-edit.ejs). */
const BLOCK_TYPE_LABELS = {
  hero_image: 'Hero: image',
  hero_video: 'Hero: video',
  full_image: 'Full-screen image',
  full_image_overlay_left: 'Image + overlay (left)',
  full_image_overlay_center: 'Image + overlay (center)',
  full_image_overlay_right: 'Image + overlay (right)',
  full_image_subtitle: 'Image + statement subtitle',
  split_image_left: 'Split: image left, text right',
  split_image_right: 'Split: image right, text left',
  text_block: 'Text block (heading + body)',
  text_body: 'Text block (body only)',
  quote_dark: 'Quote (dark / blue)',
  quote_light: 'Quote (light / white)',
  code_block: 'Code (HTML embed)',
  divider: 'Divider',
};

function blockTypeLabel(slug) {
  if (!slug) return 'Unknown block';
  return BLOCK_TYPE_LABELS[slug] || slug;
}

function escapeHtml(text) {
  if (text == null || text === '') return '';
  return String(text)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return '';
}

function splitParagraphs(text) {
  if (!text) return [];
  return String(text)
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function figcaptionHtml(caption) {
  if (!caption || !String(caption).trim()) return '';
  return `<figcaption>${escapeHtml(String(caption).trim())}</figcaption>`;
}

function overlayBodyHtml(bodyText, revealClass) {
  const t = String(bodyText || '').trim();
  if (!t) return '';
  if (isStoredRichHtml(bodyText)) {
    return `\t\t<div class="fs-rich ${revealClass}">${sanitizeRichText(bodyText)}</div>`;
  }
  return `\t\t<p class="${revealClass}">${escapeHtml(t)}</p>`;
}

function splitBodyHtml(bodyText, pClass) {
  if (!String(bodyText || '').trim()) return '';
  if (isStoredRichHtml(bodyText)) {
    return `\t\t<div class="fs-rich">${sanitizeRichText(bodyText)}</div>`;
  }
  return splitParagraphs(bodyText).map(
    (seg) => `\t\t<p class="${pClass}">${escapeHtml(seg)}</p>`
  ).join('\n');
}

function textBlockBodyHtml(bodyText) {
  if (!String(bodyText || '').trim()) return '';
  if (isStoredRichHtml(bodyText)) {
    return `\t\t<div class="fs-rich">${sanitizeRichText(bodyText)}</div>`;
  }
  return splitParagraphs(bodyText).map(
    (seg) => `\t\t<p class="fs-reveal fs-reveal-up">${escapeHtml(seg)}</p>`
  ).join('\n');
}

function quoteBodyHtml(raw) {
  if (!String(raw || '').trim()) return '';
  if (isStoredRichHtml(raw)) {
    return `\t\t<div class="fs-rich fs-quote-body">${sanitizeRichText(raw)}</div>`;
  }
  return `\t\t<p>${escapeHtml(raw)}</p>`;
}

function renderBlock(block, index) {
  const b = block.get ? block.get({ plain: true }) : block;
  const type = b.blockType;
  const heading = escapeHtml(b.heading || '');
  const subheading = escapeHtml(b.subheading || '');
  const bodyText = b.bodyText || '';
  const quoteSpeaker = escapeHtml(b.quoteSpeaker || '');
  const quoteSpeakerTitle = escapeHtml(b.quoteSpeakerTitle || '');
  const imageAlt = escapeHtml(b.imageAlt || '');
  const imageCaption = b.imageCaption || '';
  const imgSrc = safeUrl(b.imageUrl);
  const vidSrc = safeUrl(b.videoUrl);

  const isFirstInStory = index === 0;
  const isHero = type === 'hero_image' || type === 'hero_video';
  const showScrollHint = isHero && isFirstInStory;

  if (type === 'hero_image') {
    const subTag = (b.subheading && String(b.subheading).trim())
      ? `<p class="fs-hero-sub">${subheading}</p>`
      : '';
    const capTag = (imageCaption && String(imageCaption).trim())
      ? `<span class="fs-hero-caption">${escapeHtml(String(imageCaption).trim())}</span>`
      : '';
    const scroll = showScrollHint
      ? `\t<div class="fs-scroll-hint" aria-hidden="true">\n\t\t<span>Scroll</span>\n\t\t<div class="fs-arrow"></div>\n\t</div>`
      : '';
    return `<div class="fs-hero">
\t<img class="fs-hero-img" src="${escapeHtml(imgSrc)}" alt="${imageAlt}" fetchpriority="high" decoding="async">
\t<div class="fs-hero-overlay fs-overlay-center">
\t\t<h1>${heading}</h1>
\t\t${subTag}
\t</div>
\t${capTag}
${scroll ? scroll + '\n' : ''}</div>`;
  }

  if (type === 'hero_video') {
    const subTag = (b.subheading && String(b.subheading).trim())
      ? `<p class="fs-hero-sub">${subheading}</p>`
      : '';
    const capTag = (imageCaption && String(imageCaption).trim())
      ? `<span class="fs-hero-caption">${escapeHtml(String(imageCaption).trim())}</span>`
      : '';
    const scroll = showScrollHint
      ? `\t<div class="fs-scroll-hint" aria-hidden="true">\n\t\t<span>Scroll</span>\n\t\t<div class="fs-arrow"></div>\n\t</div>`
      : '';
    return `<div class="fs-hero">
\t<video class="fs-hero-video" autoplay loop muted playsinline>
\t\t<source src="${escapeHtml(vidSrc)}" type="video/mp4">
\t</video>
\t<div class="fs-hero-overlay fs-overlay-center">
\t\t<h1>${heading}</h1>
\t\t${subTag}
\t</div>
\t${capTag}
${scroll ? scroll + '\n' : ''}</div>`;
  }

  if (type === 'full_image') {
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="fs-full-image">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t${fig}
</figure>`;
  }

  if (type === 'full_image_overlay_left') {
    const pBody = overlayBodyHtml(bodyText, 'fs-reveal fs-reveal-left');
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="fs-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="fs-img-overlay fs-overlay-left fs-stagger">
\t\t<h2 class="fs-reveal fs-reveal-left"><span class="fs-animated-line fs-animated-line-light">${heading}</span></h2>
\t\t${pBody}
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'full_image_overlay_center') {
    const pBody = overlayBodyHtml(bodyText, 'fs-reveal fs-reveal-up');
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="fs-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="fs-img-overlay fs-overlay-center fs-stagger">
\t\t<h2 class="fs-reveal fs-reveal-up"><span class="fs-animated-line fs-animated-line-light">${heading}</span></h2>
\t\t${pBody}
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'full_image_overlay_right') {
    const pBody = overlayBodyHtml(bodyText, 'fs-reveal fs-reveal-right');
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="fs-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="fs-img-overlay fs-overlay-right fs-stagger">
\t\t<h2 class="fs-reveal fs-reveal-right"><span class="fs-animated-line fs-animated-line-light">${heading}</span></h2>
\t\t${pBody}
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'full_image_subtitle') {
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="fs-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="fs-img-subtitle fs-stagger">
\t\t<p class="fs-reveal fs-reveal-up">${subheading}</p>
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'split_image_left') {
    const innerFig = (imageCaption && String(imageCaption).trim())
      ? `\t\t<figcaption>${escapeHtml(String(imageCaption).trim())}</figcaption>`
      : '';
    const paras = splitBodyHtml(bodyText, 'fs-reveal fs-reveal-right');
    return `<div class="fs-split">
\t<figure class="fs-split-image fs-reveal fs-reveal-left fs-draw-corner">
\t\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
${innerFig ? innerFig + '\n' : ''}\t</figure>
\t<div class="fs-split-text fs-stagger">
\t\t<h3 class="fs-reveal fs-reveal-right"><span class="fs-animated-line">${heading}</span></h3>
${paras}
\t</div>
</div>`;
  }

  if (type === 'split_image_right') {
    const innerFig = (imageCaption && String(imageCaption).trim())
      ? `\t\t<figcaption>${escapeHtml(String(imageCaption).trim())}</figcaption>`
      : '';
    const paras = splitBodyHtml(bodyText, 'fs-reveal fs-reveal-left');
    return `<div class="fs-split fs-img-right">
\t<figure class="fs-split-image fs-reveal fs-reveal-right fs-draw-corner">
\t\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
${innerFig ? innerFig + '\n' : ''}\t</figure>
\t<div class="fs-split-text fs-stagger">
\t\t<h3 class="fs-reveal fs-reveal-left"><span class="fs-animated-line">${heading}</span></h3>
${paras}
\t</div>
</div>`;
  }

  if (type === 'text_block') {
    const paras = textBlockBodyHtml(bodyText);
    return `<div class="fs-text-block">
\t<div class="fs-text-block-inner fs-stagger">
\t\t<h2 class="fs-reveal fs-reveal-up">${heading}</h2>
${paras}
\t</div>
</div>`;
  }

  if (type === 'text_body') {
    const paras = textBlockBodyHtml(bodyText);
    return `<div class="fs-text-body">
\t<div class="fs-text-body-inner fs-stagger">
${paras}
\t</div>
</div>`;
  }

  if (type === 'quote_dark') {
    const qInner = quoteBodyHtml(b.quoteText || '');
    return `<div class="fs-quote-dark">
\t<blockquote class="fs-reveal fs-reveal-scale">
${qInner}
\t\t<cite>${quoteSpeaker}<span>${quoteSpeakerTitle}</span></cite>
\t</blockquote>
</div>`;
  }

  if (type === 'quote_light') {
    const qInner = quoteBodyHtml(b.quoteText || '');
    return `<div class="fs-quote-light">
\t<blockquote class="fs-reveal fs-reveal-scale">
${qInner}
\t\t<cite>${quoteSpeaker}<span>${quoteSpeakerTitle}</span></cite>
\t</blockquote>
</div>`;
  }

  if (type === 'code_block') {
    return stripEmbeddedExportAssets(b.bodyText || '');
  }

  if (type === 'divider') {
    return `<div class="fs-divider">
\t<h2>${heading}</h2>
</div>`;
  }

  return '';
}

/**
 * @param {{ req?: import('express').Request }} [options] - pass `{ req }` for admin preview (includes browser reset CSS; export omits it)
 */
function generateStoryHTML(story, blocks, options = {}) {
  const assetUrl = options.req
    ? (rel) => mergedAssetUrlForPreview(options.req, rel)
    : exportAssetUrl;

  const sorted = [...blocks].sort((a, b) => {
    const ao = a.sortOrder != null ? a.sortOrder : 0;
    const bo = b.sortOrder != null ? b.sortOrder : 0;
    return ao - bo;
  });

  const skipLink = '<a href="#fs-essay" class="fs-skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000;padding:12px 20px;background:#009edb;color:#fff;font-size:16px;font-family:\'Roboto\',sans-serif;text-decoration:none;" onfocus="this.style.cssText=\'position:fixed;left:16px;top:16px;width:auto;height:auto;overflow:visible;z-index:10000;padding:12px 20px;background:#009edb;color:#fff;font-size:16px;font-family:Roboto,sans-serif;text-decoration:none;border-radius:4px;\'" onblur="this.style.cssText=\'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000;\'">Skip to content</a>';

  const progress = '<div class="fs-progress" id="fs-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>';

  const isPreview = !!(options.req && typeof options.req.get === 'function');
  const commentPreviewReset = `<!-- ${htmlCommentSafe('Browser default reset (admin preview only)')} -->`;
  const previewResetLink = `<link href="${escapeHtml(assetUrl('/export/preview-reset.css'))}" rel="stylesheet">`;

  const commentBaseStylesheet = `<!-- ${htmlCommentSafe(
    'Stylesheet — base typography and layout styles',
  )} -->`;
  const stylesheet = `<link href="${escapeHtml(basePeaceAndSecurityStylesheetHref(options.req))}" rel="stylesheet">`;
  const commentMergedStylesheet = `<!-- ${htmlCommentSafe(
    'Stylesheet — feature story and timeline styles',
  )} -->`;
  const mergedStylesheet = `<link href="${escapeHtml(assetUrl('/export/styles.css'))}" rel="stylesheet">`;

  const storyTitlePlain = (() => {
    const s = story && typeof story.get === 'function' ? story.get({ plain: true }) : story;
    return s && s.title ? String(s.title) : '';
  })();

  const inner = sorted
    .map((block, i) => {
      const b = block.get ? block.get({ plain: true }) : block;
      const blockType = b.blockType || '';
      const comment = `<!-- ${htmlCommentSafe(`${storyTitlePlain || 'Untitled'} | ${blockTypeLabel(blockType)}`)} -->`;
      return [comment, renderBlock(block, i)].join('\n');
    })
    .join('\n\n');

  const essayOpen = '<div class="fs-essay" id="fs-essay" role="article" aria-label="Feature story">';
  const essayClose = '</div>';

  const commentStoryStart = `<!-- ${htmlCommentSafe('Feature story — start')} -->`;
  const commentStoryEnd = `<!-- ${htmlCommentSafe('Feature story — end')} -->`;

  const commentMergedScript = `<!-- ${htmlCommentSafe(
    'Script — feature story and timeline scripts',
  )} -->`;
  const scriptBlock = `<script src="${escapeHtml(assetUrl('/export/functions.js'))}"></script>`;

  const headLead = isPreview
    ? [commentPreviewReset, previewResetLink, '']
    : [];

  const commentExportAttribution = `<!-- ${htmlCommentSafe(
    'United Nations Peace and Security feature story and timeline builder, developed by Robert Irish',
  )} -->`;

  return [
    commentExportAttribution,
    '',
    ...headLead,
    commentBaseStylesheet,
    stylesheet,
    '',
    commentMergedStylesheet,
    mergedStylesheet,
    '',
    skipLink,
    '',
    progress,
    '',
    commentStoryStart,
    essayOpen,
    '',
    inner,
    essayClose,
    commentStoryEnd,
    '',
    commentMergedScript,
    scriptBlock,
  ].join('\n');
}

module.exports = { generateStoryHTML, escapeHtml, safeUrl };
