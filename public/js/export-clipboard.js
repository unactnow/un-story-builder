(function () {
  function spinnerHtml() {
    return '<span class="preview-btn-spinner" aria-hidden="true"></span> ';
  }

  function restoreCopyButton(btn) {
    btn.classList.remove('is-loading', 'is-save-success', 'is-feedback-error');
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    if (btn.dataset.storedLabel) btn.innerHTML = btn.dataset.storedLabel;
  }

  function setCopyButtonState(btn, state, message) {
    if (!btn.dataset.storedLabel) btn.dataset.storedLabel = btn.innerHTML;
    if (state === 'loading') {
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.classList.remove('is-save-success', 'is-feedback-error');
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = spinnerHtml() + 'Loading…';
    } else if (state === 'success') {
      btn.disabled = false;
      btn.classList.remove('is-loading');
      btn.classList.add('is-save-success');
      btn.removeAttribute('aria-busy');
      btn.textContent = message || 'Copied!';
      window.setTimeout(function () {
        restoreCopyButton(btn);
      }, 2000);
    } else if (state === 'error') {
      btn.disabled = false;
      btn.classList.remove('is-loading');
      btn.classList.add('is-feedback-error');
      btn.removeAttribute('aria-busy');
      btn.textContent = message || 'Copy failed';
      window.setTimeout(function () {
        restoreCopyButton(btn);
      }, 4000);
    }
  }

  function restoreDownloadLink(a) {
    a.classList.remove('is-loading');
    a.removeAttribute('aria-busy');
    if (a.dataset.storedLabel) a.innerHTML = a.dataset.storedLabel;
  }

  function startDownload(a, href) {
    if (!a.dataset.storedLabel) a.dataset.storedLabel = a.innerHTML;
    a.classList.add('is-loading');
    a.setAttribute('aria-busy', 'true');
    a.innerHTML = spinnerHtml() + 'Loading…';
    window.location.href = href;
    /* File downloads use Content-Disposition: attachment — the page usually does not navigate,
       so restore the control after the browser has started the download. */
    window.setTimeout(function () {
      restoreDownloadLink(a);
    }, 2000);
  }

  function init() {
    var btn = document.getElementById('btn-copy-export');
    var downloadA = document.getElementById('btn-download-export');
    var dataEl = document.getElementById('export-data');
    if (!dataEl) return;
    var rawHtml;
    try {
      rawHtml = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }
    if (btn) {
      btn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          setCopyButtonState(btn, 'loading');
          navigator.clipboard.writeText(rawHtml).then(
            function () {
              setCopyButtonState(btn, 'success', 'Copied!');
            },
            function () {
              setCopyButtonState(btn, 'error', 'Copy failed');
            }
          );
        } else {
          setCopyButtonState(btn, 'error', 'Clipboard unavailable');
        }
      });
    }
    if (downloadA) {
      downloadA.addEventListener('click', function (e) {
        var href = downloadA.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        startDownload(downloadA, href);
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
