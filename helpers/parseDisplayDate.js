/**
 * Best-effort ISO date (YYYY-MM-DD) for <time datetime=""> from free-form display text.
 * Order of events is controlled by drag-and-drop sortOrder, not by this value.
 */
function parseDisplayDateToISO(dateText) {
  if (dateText == null || dateText === '') return '';
  const t = String(dateText).trim();
  if (!t) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const ym = t.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) {
    const mm = ym[2].padStart(2, '0');
    return `${ym[1]}-${mm}-01`;
  }
  const years = t.match(/\b(\d{4})\b/g);
  if (years && years.length) return `${years[0]}-01-01`;
  return '';
}

module.exports = { parseDisplayDateToISO };
