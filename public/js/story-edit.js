(function () {
  function reindexStoryBlocks() {
    var list = document.getElementById('block-list');
    if (!list) return;
    var cards = list.querySelectorAll('.block-card');
    cards.forEach(function (card, i) {
      card.querySelectorAll('[name^="blocks["]').forEach(function (el) {
        el.name = el.name.replace(/^blocks\[[^\]]+\]/, 'blocks[' + i + ']');
      });
      var so = card.querySelector('.sort-order-input');
      if (so) so.value = i;
    });
  }

  var blockListEl = document.getElementById('block-list');
  if (blockListEl) blockListEl.addEventListener('dragreorder', reindexStoryBlocks);

  function wireBlockCard(card) {
    var header = card.querySelector('.block-card-header');
    if (header) {
      header.addEventListener('click', function (e) {
        if (e.target.closest('.block-actions') || e.target.closest('.drag-handle')) return;
        card.classList.toggle('expanded');
      });
    }
    card.querySelector('.btn-remove').addEventListener('click', function (e) {
      e.stopPropagation();
      card.remove();
      reindexStoryBlocks();
    });
    card.querySelector('.btn-move-up').addEventListener('click', function (e) {
      e.stopPropagation();
      var prev = card.previousElementSibling;
      if (prev && prev.classList.contains('block-card')) {
        card.parentNode.insertBefore(card, prev);
        reindexStoryBlocks();
        document.getElementById('block-list').dispatchEvent(new CustomEvent('dragreorder', { bubbles: true }));
        var url = document.getElementById('block-list').getAttribute('data-reorder-url');
        if (url) {
          var key = document.getElementById('block-list').getAttribute('data-reorder-id-key') || 'blockIds';
          var ids = [];
          document.querySelectorAll('#block-list .drag-item').forEach(function (it) {
            var id = it.getAttribute('data-id');
            if (id) ids.push(id);
          });
          if (ids.length === document.querySelectorAll('#block-list .drag-item').length) {
            var meta = document.querySelector('meta[name="csrf-token"]');
            var body = {}; body[key] = ids;
            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': meta ? meta.getAttribute('content') : '' }, body: JSON.stringify(body) }).catch(function () {});
          }
        }
      }
    });
    card.querySelector('.btn-move-down').addEventListener('click', function (e) {
      e.stopPropagation();
      var next = card.nextElementSibling;
      if (next && next.classList.contains('block-card')) {
        card.parentNode.insertBefore(card, next.nextSibling);
        reindexStoryBlocks();
        document.getElementById('block-list').dispatchEvent(new CustomEvent('dragreorder', { bubbles: true }));
        var url = document.getElementById('block-list').getAttribute('data-reorder-url');
        if (url) {
          var key = document.getElementById('block-list').getAttribute('data-reorder-id-key') || 'blockIds';
          var ids = [];
          document.querySelectorAll('#block-list .drag-item').forEach(function (it) {
            var id = it.getAttribute('data-id');
            if (id) ids.push(id);
          });
          if (ids.length === document.querySelectorAll('#block-list .drag-item').length) {
            var meta = document.querySelector('meta[name="csrf-token"]');
            var body = {}; body[key] = ids;
            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': meta ? meta.getAttribute('content') : '' }, body: JSON.stringify(body) }).catch(function () {});
          }
        }
      }
    });
    card.querySelectorAll('.img-url').forEach(function (inp) {
      inp.addEventListener('input', function () { updateImagePreview(inp); });
      updateImagePreview(inp);
    });
  }

  function updateImagePreview(inp) {
    var v = (inp.value || '').trim();
    var wrap = inp.parentNode.parentNode;
    var prev = wrap.querySelector('.image-preview');
    if (prev) prev.remove();
    if (!/^https?:\/\//i.test(v)) return;
    var div = document.createElement('div');
    div.className = 'image-preview';
    var img = document.createElement('img');
    img.alt = '';
    img.src = v;
    img.onerror = function () { div.style.display = 'none'; };
    div.appendChild(img);
    wrap.appendChild(div);
  }

  document.querySelectorAll('#block-list .block-card').forEach(wireBlockCard);

  var btnAdd = document.getElementById('btn-add-block');
  if (btnAdd) {
    btnAdd.addEventListener('click', function () {
      var bt = document.getElementById('add-block-type').value;
      var tpl = document.getElementById('tpl-block-' + bt);
      if (!tpl) return;
      var list = document.getElementById('block-list');
      var n = list.querySelectorAll('.block-card').length;
      var html = tpl.innerHTML.replace(/__INDEX__/g, String(n));
      var wrap = document.createElement('div');
      wrap.innerHTML = html.trim();
      var card = wrap.firstElementChild;
      list.appendChild(card);
      wireBlockCard(card);
      reindexStoryBlocks();
      if (window.quillAdmin) window.quillAdmin.initRoots(card);
    });
  }

  var storyForm = document.getElementById('story-form');
  if (storyForm && storyForm.getAttribute('data-has-delete') === 'true') {
    var btnDelete = document.getElementById('btn-delete-story');
    if (btnDelete) {
      btnDelete.addEventListener('click', function () {
        if (confirm('Delete this story permanently?')) document.getElementById('delete-story-form').submit();
      });
    }
  }
  if (storyForm) {
    function setPreviewStoryLoading(loading) {
      document.querySelectorAll('.btn-preview-story').forEach(function (b) {
        if (loading) {
          if (!b.dataset.previewLabel) b.dataset.previewLabel = b.innerHTML;
          b.disabled = true;
          b.classList.remove('is-feedback-error');
          b.classList.add('is-loading');
          b.setAttribute('aria-busy', 'true');
          b.innerHTML =
            '<span class="preview-btn-spinner" aria-hidden="true"></span> Loading…';
        } else {
          b.disabled = false;
          b.classList.remove('is-loading');
          b.removeAttribute('aria-busy');
          if (b.dataset.previewLabel) b.innerHTML = b.dataset.previewLabel;
        }
      });
    }

    function setPreviewStoryError(msg) {
      document.querySelectorAll('.btn-preview-story').forEach(function (b) {
        b.disabled = false;
        b.classList.remove('is-loading');
        b.classList.add('is-feedback-error');
        b.removeAttribute('aria-busy');
        if (!b.dataset.previewLabel) b.dataset.previewLabel = 'Preview';
        b.textContent = msg;
        window.setTimeout(function () {
          b.classList.remove('is-feedback-error');
          b.innerHTML = b.dataset.previewLabel;
        }, 4000);
      });
    }

    function setSaveButtonsSubmitting(submitting) {
      document.querySelectorAll('#story-form .btn-save').forEach(function (b) {
        if (submitting) {
          if (!b.dataset.saveLabel) b.dataset.saveLabel = b.innerHTML;
          b.disabled = true;
          b.classList.add('is-loading');
          b.setAttribute('aria-busy', 'true');
          b.innerHTML =
            '<span class="preview-btn-spinner" aria-hidden="true"></span> Saving…';
        } else {
          b.disabled = false;
          b.classList.remove('is-loading');
          b.removeAttribute('aria-busy');
          if (b.dataset.saveLabel) b.innerHTML = b.dataset.saveLabel;
        }
      });
    }

    function maybeShowSaveSuccessFeedback() {
      var flash = document.querySelector('.flash.flash-success');
      if (!flash) return;
      var t = (flash.textContent || '').toLowerCase();
      if (t.indexOf('saved') === -1 && t.indexOf('created') === -1) return;
      document.querySelectorAll('#story-form .btn-save').forEach(function (b) {
        if (!b.dataset.saveLabel) b.dataset.saveLabel = b.innerHTML;
        b.classList.add('is-save-success');
        b.textContent = 'Saved!';
        window.setTimeout(function () {
          b.classList.remove('is-save-success');
          b.innerHTML = b.dataset.saveLabel;
        }, 2500);
      });
    }

    storyForm.addEventListener('submit', function () {
      if (window.quillAdmin) window.quillAdmin.syncEditors();
      setSaveButtonsSubmitting(true);
    });

    maybeShowSaveSuccessFeedback();

    function setExportStoryLoading(loading) {
      document.querySelectorAll('.btn-export-story').forEach(function (b) {
        if (loading) {
          if (!b.dataset.exportLabel) b.dataset.exportLabel = b.innerHTML;
          b.classList.add('is-loading');
          b.setAttribute('aria-busy', 'true');
          b.setAttribute('aria-disabled', 'true');
          b.innerHTML =
            '<span class="preview-btn-spinner" aria-hidden="true"></span> Loading…';
        } else {
          b.classList.remove('is-loading');
          b.removeAttribute('aria-busy');
          b.removeAttribute('aria-disabled');
          if (b.dataset.exportLabel) b.innerHTML = b.dataset.exportLabel;
        }
      });
    }

    function runPreviewStory() {
      if (window.quillAdmin) window.quillAdmin.syncEditors();
      reindexStoryBlocks();
      var action = storyForm.getAttribute('action') || '';
      var saveUrl = action.replace(/\/edit$/, '/preview-save');
      var fd = new FormData(storyForm);
      var params = new URLSearchParams();
      fd.forEach(function (value, key) {
        params.append(key, value);
      });
      var meta = document.querySelector('meta[name="csrf-token"]');
      setPreviewStoryLoading(true);
      fetch(saveUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'X-CSRF-Token': meta ? meta.getAttribute('content') : '',
        },
        credentials: 'same-origin',
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, status: r.status, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.ok && result.data.previewUrl) {
            window.location.href = result.data.previewUrl;
            return;
          }
          var err = (result.data && result.data.error) || 'unknown';
          var shortMsg =
            err === 'title_required'
              ? 'Title required'
              : err === 'not_found'
                ? 'Not found'
                : 'Preview failed';
          setPreviewStoryError(shortMsg);
        })
        .catch(function () {
          setPreviewStoryError('Request failed');
        });
    }
    document.querySelectorAll('.btn-preview-story').forEach(function (btn) {
      btn.addEventListener('click', runPreviewStory);
    });
    document.querySelectorAll('.btn-export-story').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        setExportStoryLoading(true);
        window.location.href = a.getAttribute('href');
      });
    });
  }
})();
