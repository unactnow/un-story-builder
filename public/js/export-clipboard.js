(function () {
  function init() {
    var btn = document.getElementById('btn-copy-export');
    var dataEl = document.getElementById('export-data');
    if (!btn || !dataEl) return;
    var rawHtml;
    try {
      rawHtml = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }
    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawHtml).then(function () {
          alert('Copied to clipboard.');
        }).catch(function () {
          alert('Copy failed.');
        });
      } else {
        alert('Clipboard API not available.');
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
