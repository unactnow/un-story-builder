(function () {
  function reindexTimelineEvents() {
    var list = document.getElementById('event-list');
    if (!list) return;
    var cards = list.querySelectorAll('.event-card');
    cards.forEach(function (card, i) {
      card.querySelectorAll('[name^="events["]').forEach(function (el) {
        el.name = el.name.replace(/^events\[[^\]]+\]/, 'events[' + i + ']');
      });
      var so = card.querySelector('.sort-order-input');
      if (so) so.value = i;
    });
  }

  var eventListEl = document.getElementById('event-list');
  if (eventListEl) eventListEl.addEventListener('dragreorder', reindexTimelineEvents);

  function postEventsReorder() {
    var list = document.getElementById('event-list');
    var url = list.getAttribute('data-reorder-url');
    if (!url) return;
    var key = list.getAttribute('data-reorder-id-key') || 'eventIds';
    var ids = [];
    var items = list.querySelectorAll('.drag-item');
    for (var j = 0; j < items.length; j += 1) {
      var id = items[j].getAttribute('data-id');
      if (!id || id.trim() === '') return;
      ids.push(id);
    }
    if (ids.length !== items.length) return;
    var meta = document.querySelector('meta[name="csrf-token"]');
    var body = {}; body[key] = ids;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': meta ? meta.getAttribute('content') : '' }, body: JSON.stringify(body) }).catch(function () {});
  }

  function wireEventCard(card) {
    var header = card.querySelector('.event-card-header');
    if (header) {
      header.addEventListener('click', function (e) {
        if (e.target.closest('.block-actions') || e.target.closest('.drag-handle')) return;
        card.classList.toggle('expanded');
      });
    }
    card.querySelector('.btn-remove').addEventListener('click', function (e) {
      e.stopPropagation();
      card.remove();
      reindexTimelineEvents();
    });
    card.querySelector('.btn-move-up').addEventListener('click', function (e) {
      e.stopPropagation();
      var prev = card.previousElementSibling;
      if (prev && prev.classList.contains('event-card')) {
        card.parentNode.insertBefore(card, prev);
        reindexTimelineEvents();
        if (eventListEl) eventListEl.dispatchEvent(new CustomEvent('dragreorder', { bubbles: true }));
        postEventsReorder();
      }
    });
    card.querySelector('.btn-move-down').addEventListener('click', function (e) {
      e.stopPropagation();
      var next = card.nextElementSibling;
      if (next && next.classList.contains('event-card')) {
        card.parentNode.insertBefore(card, next.nextSibling);
        reindexTimelineEvents();
        if (eventListEl) eventListEl.dispatchEvent(new CustomEvent('dragreorder', { bubbles: true }));
        postEventsReorder();
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

  document.querySelectorAll('#event-list .event-card').forEach(wireEventCard);

  var btnAdd = document.getElementById('btn-add-event');
  if (btnAdd) {
    btnAdd.addEventListener('click', function () {
      var tpl = document.getElementById('tpl-timeline-event');
      if (!tpl) return;
      var list = document.getElementById('event-list');
      var n = list.querySelectorAll('.event-card').length;
      var html = tpl.innerHTML.replace(/__INDEX__/g, String(n));
      var wrap = document.createElement('div');
      wrap.innerHTML = html.trim();
      var card = wrap.firstElementChild;
      list.appendChild(card);
      wireEventCard(card);
      reindexTimelineEvents();
      if (window.quillAdmin) window.quillAdmin.initRoots(card);
    });
  }

  var timelineForm = document.getElementById('timeline-form');
  if (timelineForm && timelineForm.getAttribute('data-has-delete') === 'true') {
    var btnDelete = document.getElementById('btn-delete-timeline');
    if (btnDelete) {
      btnDelete.addEventListener('click', function () {
        if (confirm('Delete this timeline permanently?')) document.getElementById('delete-timeline-form').submit();
      });
    }
  }
  if (timelineForm) {
    function setPreviewTimelineLoading(loading) {
      document.querySelectorAll('.btn-preview-timeline').forEach(function (b) {
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

    function setPreviewTimelineError(msg) {
      document.querySelectorAll('.btn-preview-timeline').forEach(function (b) {
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
      document.querySelectorAll('#timeline-form .btn-save').forEach(function (b) {
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
      document.querySelectorAll('#timeline-form .btn-save').forEach(function (b) {
        if (!b.dataset.saveLabel) b.dataset.saveLabel = b.innerHTML;
        b.classList.add('is-save-success');
        b.textContent = 'Saved!';
        window.setTimeout(function () {
          b.classList.remove('is-save-success');
          b.innerHTML = b.dataset.saveLabel;
        }, 2500);
      });
    }

    timelineForm.addEventListener('submit', function () {
      if (window.quillAdmin) window.quillAdmin.syncEditors();
      setSaveButtonsSubmitting(true);
    });

    maybeShowSaveSuccessFeedback();

    function setExportTimelineLoading(loading) {
      document.querySelectorAll('.btn-export-timeline').forEach(function (b) {
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

    function runPreviewTimeline() {
      if (window.quillAdmin) window.quillAdmin.syncEditors();
      reindexTimelineEvents();
      var action = timelineForm.getAttribute('action') || '';
      var saveUrl = action.replace(/\/edit$/, '/preview-save');
      var fd = new FormData(timelineForm);
      var params = new URLSearchParams();
      fd.forEach(function (value, key) {
        params.append(key, value);
      });
      var meta = document.querySelector('meta[name="csrf-token"]');
      setPreviewTimelineLoading(true);
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
          setPreviewTimelineError(shortMsg);
        })
        .catch(function () {
          setPreviewTimelineError('Request failed');
        });
    }
    document.querySelectorAll('.btn-preview-timeline').forEach(function (btn) {
      btn.addEventListener('click', runPreviewTimeline);
    });
    document.querySelectorAll('.btn-export-timeline').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        setExportTimelineLoading(true);
        window.location.href = a.getAttribute('href');
      });
    });
  }
})();
