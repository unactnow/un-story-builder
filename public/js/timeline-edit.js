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
      if (!confirm('Remove this event?')) return;
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
    var btnPreview = document.getElementById('btn-preview-timeline');
    if (btnPreview) {
      btnPreview.addEventListener('click', function () {
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
                    ? 'Timeline was not found.'
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
