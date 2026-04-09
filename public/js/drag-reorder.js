/**
 * Shared drag-and-drop reorder for story blocks and timeline events.
 * Section 9 — FEATURE-STORIES-TIMELINES-CMS-PLAN
 */
(function () {
  function clearIndicators(container) {
    container.querySelectorAll('.drag-indicator-top, .drag-indicator-bottom').forEach(function (el) {
      el.classList.remove('drag-indicator-top', 'drag-indicator-bottom');
    });
  }

  function updateSortOrders(container) {
    var items = container.querySelectorAll('.drag-item');
    items.forEach(function (item, i) {
      var input = item.querySelector('.sort-order-input');
      if (input) input.value = i;
    });
  }

  function postReorder(container) {
    var url = container.getAttribute('data-reorder-url');
    if (!url) return;
    var key = container.getAttribute('data-reorder-id-key') || 'blockIds';
    var ids = [];
    var items = container.querySelectorAll('.drag-item');
    for (var j = 0; j < items.length; j += 1) {
      var id = items[j].getAttribute('data-id');
      if (!id || id.trim() === '') return;
      ids.push(id);
    }
    if (ids.length !== items.length) return;
    var meta = document.querySelector('meta[name="csrf-token"]');
    var csrf = meta ? meta.getAttribute('content') : '';
    var body = {};
    body[key] = ids;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      body: JSON.stringify(body),
    }).catch(function () {});
  }

  function initContainer(container) {
    var dragged = null;

    container.addEventListener('dragstart', function (e) {
      var item = e.target.closest('.drag-item');
      if (!item || !container.contains(item)) return;
      if (!e.target.closest('.drag-handle')) {
        e.preventDefault();
        return;
      }
      dragged = item;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      item.style.opacity = '0.4';
    });

    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      var target = e.target.closest('.drag-item');
      if (!target || !container.contains(target) || target === dragged) return;
      clearIndicators(container);
      var rect = target.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        target.classList.add('drag-indicator-top');
      } else {
        target.classList.add('drag-indicator-bottom');
      }
    });

    container.addEventListener('dragleave', function (e) {
      var related = e.relatedTarget;
      if (related && container.contains(related)) return;
      clearIndicators(container);
    });

    container.addEventListener('drop', function (e) {
      e.preventDefault();
      var target = e.target.closest('.drag-item');
      if (!dragged || !target || !container.contains(target)) {
        clearIndicators(container);
        return;
      }
      var rect = target.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        container.insertBefore(dragged, target);
      } else {
        container.insertBefore(dragged, target.nextSibling);
      }
      clearIndicators(container);
      updateSortOrders(container);
      container.dispatchEvent(new CustomEvent('dragreorder', { bubbles: true }));
      postReorder(container);
    });

    container.addEventListener('dragend', function (e) {
      var item = e.target.closest('.drag-item');
      if (!item || !container.contains(item)) return;
      item.style.opacity = '';
      clearIndicators(container);
      dragged = null;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-drag-container]').forEach(initContainer);
  });
})();
