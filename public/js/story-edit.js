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
      if (!confirm('Remove this block?')) return;
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
    var btnPreview = document.getElementById('btn-preview-story');
    if (btnPreview) {
      btnPreview.addEventListener('click', function () {
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
        btnPreview.disabled = true;
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
              window.open(result.data.previewUrl, '_blank', 'noopener');
            } else {
              var err = (result.data && result.data.error) || 'unknown';
              var msg =
                err === 'title_required'
                  ? 'Title is required before preview.'
                  : err === 'not_found'
                    ? 'Story was not found.'
                    : 'Could not save preview. Try again.';
              window.alert(msg);
            }
          })
          .catch(function () {
            window.alert('Preview request failed. Check your connection and try again.');
          })
          .finally(function () {
            btnPreview.disabled = false;
          });
      });
    }
  }
})();
