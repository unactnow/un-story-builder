const fs = require('fs');
const path = require('path');

const photoEssayCss = fs.readFileSync(path.join(__dirname, 'static', 'photo-essay.css'), 'utf8');
const photoEssayJs = fs.readFileSync(path.join(__dirname, 'static', 'photo-essay.js'), 'utf8');

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

function renderBlock(block, index) {
  const b = block.get ? block.get({ plain: true }) : block;
  const type = b.blockType;
  const heading = escapeHtml(b.heading || '');
  const subheading = escapeHtml(b.subheading || '');
  const bodyText = b.bodyText || '';
  const quoteText = escapeHtml(b.quoteText || '');
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
      ? `<p class="pe-hero-sub">${subheading}</p>`
      : '';
    const capTag = (imageCaption && String(imageCaption).trim())
      ? `<span class="pe-hero-caption">${escapeHtml(String(imageCaption).trim())}</span>`
      : '';
    const scroll = showScrollHint
      ? `\t<div class="pe-scroll-hint" aria-hidden="true">\n\t\t<span>Scroll</span>\n\t\t<div class="pe-arrow"></div>\n\t</div>`
      : '';
    return `<div class="pe-hero">
\t<img class="pe-hero-img" src="${escapeHtml(imgSrc)}" alt="${imageAlt}" fetchpriority="high" decoding="async">
\t<div class="pe-hero-overlay pe-overlay-center">
\t\t<h1>${heading}</h1>
\t\t${subTag}
\t</div>
\t${capTag}
${scroll ? scroll + '\n' : ''}</div>`;
  }

  if (type === 'hero_video') {
    const subTag = (b.subheading && String(b.subheading).trim())
      ? `<p class="pe-hero-sub">${subheading}</p>`
      : '';
    const capTag = (imageCaption && String(imageCaption).trim())
      ? `<span class="pe-hero-caption">${escapeHtml(String(imageCaption).trim())}</span>`
      : '';
    const scroll = showScrollHint
      ? `\t<div class="pe-scroll-hint" aria-hidden="true">\n\t\t<span>Scroll</span>\n\t\t<div class="pe-arrow"></div>\n\t</div>`
      : '';
    return `<div class="pe-hero">
\t<video class="pe-hero-video" autoplay loop muted playsinline>
\t\t<source src="${escapeHtml(vidSrc)}" type="video/mp4">
\t</video>
\t<div class="pe-hero-overlay pe-overlay-center">
\t\t<h1>${heading}</h1>
\t\t${subTag}
\t</div>
\t${capTag}
${scroll ? scroll + '\n' : ''}</div>`;
  }

  if (type === 'full_image') {
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="pe-full-image">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t${fig}
</figure>`;
  }

  if (type === 'full_image_overlay_left') {
    const pBody = `<p class="pe-reveal pe-reveal-left">${escapeHtml(bodyText.trim())}</p>`;
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="pe-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="pe-img-overlay pe-overlay-left pe-stagger">
\t\t<h2 class="pe-reveal pe-reveal-left"><span class="pe-animated-line pe-animated-line-light">${heading}</span></h2>
\t\t${pBody}
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'full_image_overlay_center') {
    const pBody = `<p class="pe-reveal pe-reveal-up">${escapeHtml(bodyText.trim())}</p>`;
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="pe-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="pe-img-overlay pe-overlay-center pe-stagger">
\t\t<h2 class="pe-reveal pe-reveal-up"><span class="pe-animated-line pe-animated-line-light">${heading}</span></h2>
\t\t${pBody}
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'full_image_overlay_right') {
    const pBody = `<p class="pe-reveal pe-reveal-right">${escapeHtml(bodyText.trim())}</p>`;
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="pe-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="pe-img-overlay pe-overlay-right pe-stagger">
\t\t<h2 class="pe-reveal pe-reveal-right"><span class="pe-animated-line pe-animated-line-light">${heading}</span></h2>
\t\t${pBody}
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'full_image_subtitle') {
    const fig = figcaptionHtml(imageCaption);
    return `<figure class="pe-full-image-overlay">
\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
\t<div class="pe-img-subtitle pe-stagger">
\t\t<p class="pe-reveal pe-reveal-up">${subheading}</p>
\t</div>
\t${fig}
</figure>`;
  }

  if (type === 'split_image_left') {
    const innerFig = (imageCaption && String(imageCaption).trim())
      ? `\t\t<figcaption>${escapeHtml(String(imageCaption).trim())}</figcaption>`
      : '';
    const paras = splitParagraphs(bodyText).map(
      (seg) => `\t\t<p class="pe-reveal pe-reveal-right">${escapeHtml(seg)}</p>`
    ).join('\n');
    return `<div class="pe-split">
\t<figure class="pe-split-image pe-reveal pe-reveal-left pe-draw-corner">
\t\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
${innerFig ? innerFig + '\n' : ''}\t</figure>
\t<div class="pe-split-text pe-stagger">
\t\t<h3 class="pe-reveal pe-reveal-right"><span class="pe-animated-line">${heading}</span></h3>
${paras}
\t</div>
</div>`;
  }

  if (type === 'split_image_right') {
    const innerFig = (imageCaption && String(imageCaption).trim())
      ? `\t\t<figcaption>${escapeHtml(String(imageCaption).trim())}</figcaption>`
      : '';
    const paras = splitParagraphs(bodyText).map(
      (seg) => `\t\t<p class="pe-reveal pe-reveal-left">${escapeHtml(seg)}</p>`
    ).join('\n');
    return `<div class="pe-split pe-img-right">
\t<figure class="pe-split-image pe-reveal pe-reveal-right pe-draw-corner">
\t\t<img src="${escapeHtml(imgSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">
${innerFig ? innerFig + '\n' : ''}\t</figure>
\t<div class="pe-split-text pe-stagger">
\t\t<h3 class="pe-reveal pe-reveal-left"><span class="pe-animated-line">${heading}</span></h3>
${paras}
\t</div>
</div>`;
  }

  if (type === 'text_block') {
    const paras = splitParagraphs(bodyText).map(
      (seg) => `\t\t<p class="pe-reveal pe-reveal-up">${escapeHtml(seg)}</p>`
    ).join('\n');
    return `<div class="pe-text-block">
\t<div class="pe-text-block-inner pe-stagger">
\t\t<h2 class="pe-reveal pe-reveal-up">${heading}</h2>
${paras}
\t</div>
</div>`;
  }

  if (type === 'text_body') {
    const paras = splitParagraphs(bodyText).map(
      (seg) => `\t\t<p class="pe-reveal pe-reveal-up">${escapeHtml(seg)}</p>`
    ).join('\n');
    return `<div class="pe-text-body">
\t<div class="pe-text-body-inner pe-stagger">
${paras}
\t</div>
</div>`;
  }

  if (type === 'quote_dark') {
    return `<div class="pe-quote-dark">
\t<blockquote class="pe-reveal pe-reveal-scale">
\t\t<p>${quoteText}</p>
\t\t<cite>${quoteSpeaker}<span>${quoteSpeakerTitle}</span></cite>
\t</blockquote>
</div>`;
  }

  if (type === 'quote_light') {
    return `<div class="pe-quote-light">
\t<blockquote class="pe-reveal pe-reveal-scale">
\t\t<p>${quoteText}</p>
\t\t<cite>${quoteSpeaker}<span>${quoteSpeakerTitle}</span></cite>
\t</blockquote>
</div>`;
  }

  if (type === 'divider') {
    return `<div class="pe-divider">
\t<h2>${heading}</h2>
</div>`;
  }

  return '';
}

function generateStoryHTML(story, blocks) {
  const sorted = [...blocks].sort((a, b) => {
    const ao = a.sortOrder != null ? a.sortOrder : 0;
    const bo = b.sortOrder != null ? b.sortOrder : 0;
    return ao - bo;
  });

  const skipLink = '<a href="#pe-essay" class="pe-skip-link" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000;padding:12px 20px;background:#009edb;color:#fff;font-size:16px;font-family:\'Roboto\',sans-serif;text-decoration:none;" onfocus="this.style.cssText=\'position:fixed;left:16px;top:16px;width:auto;height:auto;overflow:visible;z-index:10000;padding:12px 20px;background:#009edb;color:#fff;font-size:16px;font-family:Roboto,sans-serif;text-decoration:none;border-radius:4px;\'" onblur="this.style.cssText=\'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000;\'">Skip to content</a>';

  const progress = '<div class="pe-progress" id="pe-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>';

  const stylesheet = '<link href="https://cdn.jsdelivr.net/gh/robertirish/un-peace-and-security-stylesheet@main/styles.css" rel="stylesheet">';

  const styleBlock = `<style>\n${photoEssayCss}\n</style>`;

  let inner = '';
  sorted.forEach((block, i) => {
    inner += renderBlock(block, i);
  });

  const essayOpen = '<div class="pe-essay" id="pe-essay" role="article" aria-label="Photo essay">';
  const essayClose = '</div><!-- end .pe-essay -->';

  const scriptBlock = `<script>\n${photoEssayJs}\n</script>`;

  return [
    stylesheet,
    '',
    styleBlock,
    '',
    skipLink,
    '',
    progress,
    '',
    essayOpen,
    inner,
    essayClose,
    '',
    scriptBlock,
  ].join('\n');
}

module.exports = { generateStoryHTML, escapeHtml, safeUrl };
