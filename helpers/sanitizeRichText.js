const sanitizeHtml = require('sanitize-html');

/**
 * Allowed subset for story/timeline rich text (Quill output): paragraphs, lists,
 * bold, italic, links. Stray <br> is stripped by sanitize-html when not allowed.
 */
function sanitizeRichText(input) {
  if (input == null || input === '') return '';
  return sanitizeHtml(String(input), {
    allowedTags: ['p', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const out = { ...attribs };
        if (/^https?:\/\//i.test(href)) {
          out.target = '_blank';
          out.rel = 'noopener noreferrer';
        }
        return { tagName: 'a', attribs: out };
      },
    },
  });
}

/** Heuristic: stored value is HTML from the WYSIWYG vs legacy plain text */
function isStoredRichHtml(s) {
  return /<\s*(p|a|strong|b|em|i|ul|ol|li)\b/i.test(String(s || ''));
}

module.exports = { sanitizeRichText, isStoredRichHtml };
