const fs = require('fs');
const path = require('path');

const timelineCss = fs.readFileSync(path.join(__dirname, 'static', 'timeline.css'), 'utf8');
const timelineJs = fs.readFileSync(path.join(__dirname, 'static', 'timeline.js'), 'utf8');
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

function generateTimelineHTML(timeline, events) {
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

  const stylesheet = '<link href="https://cdn.jsdelivr.net/gh/robertirish/un-peace-and-security-stylesheet@main/styles.css" rel="stylesheet">';
  const styleBlock = `<style type="text/css">\n${timelineCss}\n</style>`;

  const header = `<div class="tl-header">
\t<h2>${title}</h2>
${descP}</div>`;

  let items = '';
  sorted.forEach((ev) => {
    const e = ev.get ? ev.get({ plain: true }) : ev;
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

    items += `<li class="tl-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/Event">
\t<div aria-hidden="true" class="tl-dot"></div>
\t<div class="${cardClass}">
\t\t${timeTag}
${loc}\t\t<h3 itemprop="name">${head}</h3>
\t\t${isStoredRichHtml(descRaw) ? `<div class="tl-rich" itemprop="description">${desc}</div>` : `<p itemprop="description">${desc}</p>`}
${hasImg ? imgBlock + '\n' : ''}\t</div>
</li>
`;
  });

  const section = `<section aria-label="Timeline" class="tl-block" id="timeline">
${header}
\t<ol class="tl-list" itemscope itemtype="https://schema.org/ItemList">
${items}\t</ol>
</section>`;

  const scriptBlock = `<script>\n${timelineJs}\n</script>`;

  return [
    stylesheet,
    '',
    styleBlock,
    '',
    section,
    '',
    scriptBlock,
  ].join('\n');
}

module.exports = { generateTimelineHTML, escapeHtml, safeUrl };
