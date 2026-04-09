/**
 * Plain text safe for HTML comments (no --, no raw newlines).
 */
function htmlCommentSafe(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\r?\n/g, ' ')
    .replace(/--/g, '- -')
    .trim();
}

module.exports = { htmlCommentSafe };
