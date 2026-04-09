(function () {
  document.addEventListener(
    'click',
    function (e) {
      var a = e.target.closest('a.js-export-nav');
      if (!a) return;
      e.preventDefault();
      if (a.classList.contains('is-loading')) return;
      var href = a.getAttribute('href');
      if (!href) return;
      if (!a.dataset.exportLabel) a.dataset.exportLabel = a.innerHTML;
      a.classList.add('is-loading');
      a.setAttribute('aria-busy', 'true');
      a.innerHTML =
        '<span class="preview-btn-spinner" aria-hidden="true"></span> Loading…';
      window.location.href = href;
    },
    true
  );
})();
