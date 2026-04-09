const { exportAssetUrl, mergedAssetUrlForPreview, basePeaceAndSecurityStylesheetHref } = require('./exportAssetUrls');
const { htmlCommentSafe } = require('./htmlComment');
const { parseDisplayDateToISO } = require('./parseDisplayDate');
const { sanitizeRichText, isStoredRichHtml } = require('./sanitizeRichText');

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

/**
 * @param {{ req?: import('express').Request }} [options] - pass `{ req }` for admin preview (jsDelivr in production, same-origin in dev)
 */
function generateTimelineHTML(timeline, events, options = {}) {
  const assetUrl = options.req
    ? (rel) => mergedAssetUrlForPreview(options.req, rel)
    : exportAssetUrl;

  const t = timeline.get ? timeline.get({ plain: true }) : timeline;
  const title = escapeHtml(t.title || '');
  const description = t.description ? String(t.description).trim() : '';
  let descP = '';
  if (description) {
    descP = isStoredRichHtml(description)
      ? `\t<div class="tl-rich">${sanitizeRichText(description)}</div>\n`
      : `\t<p>${escapeHtml(description)}</p>\n`;
  }

  const sorted = [...events].sort((a, b) => {
    const ao = a.sortOrder != null ? a.sortOrder : 0;
    const bo = b.sortOrder != null ? b.sortOrder : 0;
    return ao - bo;
  });

  const commentPreviewReset = `<!-- ${htmlCommentSafe('Browser default reset (standalone preview / export)')} -->`;
  const previewResetLink = `<link href="${escapeHtml(assetUrl('/export/preview-reset.css'))}" rel="stylesheet">`;

  const commentBaseStylesheet = `<!-- ${htmlCommentSafe('Base UN peace and security stylesheet (site-wide typography and layout)')} -->`;
  const stylesheet = `<link href="${escapeHtml(basePeaceAndSecurityStylesheetHref(options.req))}" rel="stylesheet">`;
  const commentMergedStylesheet = `<!-- ${htmlCommentSafe('Feature story & timeline: styles.css (feature story + timeline)')} -->`;
  const mergedStylesheet = `<link href="${escapeHtml(assetUrl('/export/styles.css'))}" rel="stylesheet">`;

  const header = `<div class="tl-header">
\t<h2>${title}</h2>
${descP}</div>`;

  function plainForComment(raw) {
    return String(raw || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let items = '';
  sorted.forEach((ev) => {
    const e = ev.get ? ev.get({ plain: true }) : ev;
    const datePlain = plainForComment(e.dateText || '');
    const titlePlain = plainForComment(e.heading || '');
    const eventComment = `<!-- ${htmlCommentSafe(datePlain || '—')} | ${htmlCommentSafe(titlePlain || '—')} -->`;

    const dateText = escapeHtml(e.dateText || '');
    const dateISO = parseDisplayDateToISO(e.dateText || '');
    const loc = (e.location && String(e.location).trim())
      ? `\t\t<span class="tl-location">${escapeHtml(String(e.location).trim())}</span>\n`
      : '';
    const head = escapeHtml(e.heading || '');
    const descRaw = e.description || '';
    const desc = isStoredRichHtml(descRaw)
      ? sanitizeRichText(descRaw)
      : escapeHtml(String(descRaw).trim());
    const imgUrl = safeUrl(e.imageUrl);
    const imgAlt = escapeHtml(e.imageAlt || '');
    const hasImg = !!imgUrl;
    const capRaw = e.imageCaption != null ? String(e.imageCaption).trim() : '';
    const capForHtml = capRaw
      ? capRaw.split(/\n/).map((line) => escapeHtml(line)).join('<br>')
      : '';

    const timeTag = dateISO
      ? `<time datetime="${escapeHtml(dateISO)}" itemprop="startDate">${dateText}</time>`
      : `<time itemprop="startDate">${dateText}</time>`;

    let imgBlock = '';
    if (hasImg) {
      const imgTag = `\t\t<img src="${escapeHtml(imgUrl)}" alt="${imgAlt}" loading="lazy" decoding="async">`;
      if (capForHtml) {
        imgBlock = `\t\t<figure class="tl-figure">\n${imgTag}\n\t\t<figcaption class="tl-img-caption">${capForHtml}</figcaption>\n\t\t</figure>`;
      } else {
        imgBlock = imgTag;
      }
    }

    const cardClass = hasImg ? 'tl-card tl-has-img' : 'tl-card';

    const descBlock = isStoredRichHtml(descRaw)
      ? `\t\t<div class="tl-rich" itemprop="description">${desc}</div>`
      : `\t\t<p itemprop="description">${desc}</p>`;

    items += `${eventComment}\n<li class="tl-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/Event">
\t<div aria-hidden="true" class="tl-dot"></div>
\t<div class="${cardClass}">
\t\t${timeTag}
${loc}\t\t<h3 itemprop="name">${head}</h3>
${descBlock}
${hasImg ? `${imgBlock}\n` : ''}\t</div>
</li>

`;
  });

  const section = `<section aria-label="Timeline" class="tl-block" id="timeline">
${header}
\t<ol class="tl-list" itemscope itemtype="https://schema.org/ItemList">
${items}\t</ol>
</section>`;

  const commentMergedScript = `<!-- ${htmlCommentSafe('Feature story & timeline: functions.js (feature story + timeline behaviour)')} -->`;
  const scriptBlock = `<script src="${escapeHtml(assetUrl('/export/functions.js'))}"></script>`;

  return [
    commentPreviewReset,
    previewResetLink,
    '',
    commentBaseStylesheet,
    stylesheet,
    '',
    commentMergedStylesheet,
    mergedStylesheet,
    '',
    section,
    '',
    commentMergedScript,
    scriptBlock,
  ].join('\n');
}

module.exports = { generateTimelineHTML, escapeHtml, safeUrl };
