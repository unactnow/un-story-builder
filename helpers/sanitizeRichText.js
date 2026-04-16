const sanitizeHtml = require('sanitize-html');

/**
 * Tier 1 — Standard rich text (Quill output): paragraphs, lists,
 * bold, italic, links, YouTube iframes.
 */
const SANITIZE_OPTIONS = {
  allowedTags: ['p', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li', 'br', 'iframe'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'youtube.com'],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || '';
      const out = { ...attribs };
      if (/^https?:\/\//.test(href)) {
        out.target = '_blank';
        out.rel = 'noopener noreferrer';
      }
      return { tagName: 'a', attribs: out };
    },
  },
};

function sanitizeRichText(input) {
  if (input == null || input === '') return '';
  return sanitizeHtml(String(input), SANITIZE_OPTIONS);
}

/** Heuristic: stored value is HTML from the WYSIWYG vs legacy plain text */
function isStoredRichHtml(s) {
  return /<\s*(p|a|strong|b|em|i|ul|ol|li)\b/i.test(String(s || ''));
}

module.exports = { sanitizeRichText, isStoredRichHtml };
