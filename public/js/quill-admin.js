/**
 * Quill 2 (Snow) — same setup as un-peace-dictionary term editor.
 * Toolbar: bold, italic, link, ordered/bullet lists, remove formatting.
 */
(function () {
  var QUILL_TOOLBAR = [
    ['bold', 'italic'],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ];

  var editors = [];

  function cleanQuillHtml(quill) {
    var html = quill.root.innerHTML;
    if (html === '<p><br></p>' || html === '<p></p>') return '';

    html = html.replace(/<span[^>]*>([\s\S]*?)<\/span>/g, '$1');
    html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, function (match, inner) {
      if (/data-list="bullet"/.test(inner)) {
        var clean = inner.replace(/\s*data-list="[^"]*"/g, '').replace(/\s*class="[^"]*"/g, '');
        return '<ul>' + clean + '</ul>';
      }
      return '<ol>' + inner.replace(/\s*data-list="[^"]*"/g, '').replace(/\s*class="[^"]*"/g, '') + '</ol>';
    });
    html = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>&nbsp;<\/p>/g, '');
    html = html.replace(/(<br\s*\/?>){2,}/g, '<br>');
    html = html.replace(/^\s*<br\s*\/?>\s*/g, '');
    html = html.replace(/\s*<br\s*\/?>\s*$/g, '');
    html = html.trim();
    return html;
  }

  function initQuill(wrapEl, textareaEl, customPlaceholder) {
    var quill = new Quill(wrapEl, {
      theme: 'snow',
      modules: { toolbar: QUILL_TOOLBAR },
      placeholder: customPlaceholder || '',
    });
    var original = textareaEl.value || '';
    var ready = false;
    if (original.trim()) {
      var htmlToLoad = original;
      if (original.trim().charAt(0) !== '<') {
        htmlToLoad = original
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          .replace(/\n/g, '<br>');
      }
      try {
        var delta = quill.clipboard.convert({ html: htmlToLoad });
        quill.setContents(delta, 'silent');
      } catch (e) {
        quill.root.innerHTML = htmlToLoad;
      }
    }
    var entry = { quill: quill, textarea: textareaEl, original: original };
    editors.push(entry);
    setTimeout(function () {
      var cleaned = cleanQuillHtml(quill);
      textareaEl.value = cleaned || original;
      ready = true;
    }, 0);
    quill.on('text-change', function () {
      if (!ready) return;
      var cleaned = cleanQuillHtml(quill);
      textareaEl.value = cleaned || entry.original;
    });
    return quill;
  }

  function initRoots(root) {
    var scope = root || document;
    scope.querySelectorAll('.quill-field-group').forEach(function (group) {
      if (group.getAttribute('data-quill-inited') === 'true') return;
      var wrap = group.querySelector('.quill-wrap');
      var ta = group.querySelector('textarea.wysiwyg-source');
      if (!wrap || !ta) return;
      group.setAttribute('data-quill-inited', 'true');
      initQuill(wrap, ta);
    });
  }

  function syncEditors() {
    editors.forEach(function (e) {
      var cleaned = cleanQuillHtml(e.quill);
      e.textarea.value = cleaned || e.original || '';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initRoots(document);
    ['story-form', 'timeline-form'].forEach(function (id) {
      var f = document.getElementById(id);
      if (f) f.addEventListener('submit', syncEditors);
    });
  });

  window.quillAdmin = { initRoots: initRoots, syncEditors: syncEditors };
})();
