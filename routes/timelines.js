const express = require('express');
const {
  Timeline,
  TimelineEvent,
  TimelineRevision,
} = require('../models');
const { ensureAuthenticated } = require('../middleware/auth');
const { generateTimelineHTML } = require('../helpers/exportTimeline');

const router = express.Router();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function eventFieldsFromBody(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const heading = (entry.heading || '').trim();
  if (!heading) return null;
  return {
    sortOrder: parseInt(entry.sortOrder, 10) || 0,
    dateText: entry.dateText != null ? String(entry.dateText) : '',
    dateISO: entry.dateISO != null ? String(entry.dateISO) : '',
    location: entry.location != null ? String(entry.location) : '',
    heading,
    description: entry.description != null ? String(entry.description) : '',
    imageUrl: entry.imageUrl != null ? String(entry.imageUrl) : '',
    imageAlt: entry.imageAlt != null ? String(entry.imageAlt) : '',
  };
}

function parseEvents(body) {
  const raw = body.events;
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((entry, i) => {
    const f = eventFieldsFromBody(entry);
    if (!f) return null;
    f.sortOrder = f.sortOrder || i;
    return f;
  }).filter(Boolean);
}

async function buildSnapshot(timeline) {
  const events = await TimelineEvent.findAll({
    where: { timelineId: timeline.id },
    order: [['sortOrder', 'ASC']],
  });
  return JSON.stringify({
    title: timeline.title,
    slug: timeline.slug,
    description: timeline.description || '',
    status: timeline.status,
    events: events.map((ev) => {
      const e = ev.get({ plain: true });
      return {
        sortOrder: e.sortOrder,
        dateText: e.dateText || '',
        dateISO: e.dateISO || '',
        location: e.location || '',
        heading: e.heading || '',
        description: e.description || '',
        imageUrl: e.imageUrl || '',
        imageAlt: e.imageAlt || '',
      };
    }),
  });
}

router.get('/', ensureAuthenticated, async (req, res) => {
  const rows = await Timeline.findAll({ order: [['updatedAt', 'DESC']] });
  const timelines = await Promise.all(
    rows.map(async (t) => {
      const plain = t.get({ plain: true });
      plain.eventsCount = await TimelineEvent.count({ where: { timelineId: t.id } });
      return plain;
    })
  );
  res.render('admin/timelines', { title: 'timelines', timelines });
});

router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('admin/timeline-edit', {
    title: 'new timeline',
    timeline: null,
    events: [],
    revisionCount: 0,
  });
});

router.post('/new', ensureAuthenticated, async (req, res) => {
  try {
    let slug = (req.body.slug || '').trim();
    const title = (req.body.title || '').trim();
    if (!title) {
      req.flash('error_msg', 'Title is required.');
      return res.redirect('/admin/timelines/new');
    }
    if (!slug) slug = slugify(title);
    const status = ['draft', 'published'].includes(req.body.status) ? req.body.status : 'draft';
    const description = req.body.description != null ? String(req.body.description) : '';
    const timeline = await Timeline.create({ title, slug, description, status });
    const eventData = parseEvents(req.body);
    for (let i = 0; i < eventData.length; i += 1) {
      const e = eventData[i];
      await TimelineEvent.create({ ...e, timelineId: timeline.id, sortOrder: i });
    }
    req.flash('success_msg', 'Timeline created.');
    return res.redirect(`/admin/timelines/${timeline.id}/edit`);
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      req.flash('error_msg', 'Slug already exists.');
    } else {
      req.flash('error_msg', 'Failed to create timeline.');
    }
    return res.redirect('/admin/timelines/new');
  }
});

router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  const timeline = await Timeline.findByPk(req.params.id);
  if (!timeline) {
    req.flash('error_msg', 'Timeline not found.');
    return res.redirect('/admin/timelines');
  }
  const events = await TimelineEvent.findAll({
    where: { timelineId: timeline.id },
    order: [['sortOrder', 'ASC']],
  });
  const revisionCount = await TimelineRevision.count({ where: { timelineId: timeline.id } });
  res.render('admin/timeline-edit', {
    title: 'edit timeline',
    timeline,
    events,
    revisionCount,
  });
});

router.post('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const timeline = await Timeline.findByPk(req.params.id);
    if (!timeline) {
      req.flash('error_msg', 'Timeline not found.');
      return res.redirect('/admin/timelines');
    }
    const snap = await buildSnapshot(timeline);
    await TimelineRevision.create({
      timelineId: timeline.id,
      snapshot: snap,
      revisedBy: req.user.username || '',
    });

    let slug = (req.body.slug || '').trim();
    const title = (req.body.title || '').trim();
    if (!title) {
      req.flash('error_msg', 'Title is required.');
      return res.redirect(`/admin/timelines/${timeline.id}/edit`);
    }
    if (!slug) slug = slugify(title);
    const status = ['draft', 'published'].includes(req.body.status) ? req.body.status : 'draft';
    const description = req.body.description != null ? String(req.body.description) : '';
    await timeline.update({ title, slug, description, status });

    await TimelineEvent.destroy({ where: { timelineId: timeline.id } });
    const eventData = parseEvents(req.body);
    for (let i = 0; i < eventData.length; i += 1) {
      const e = eventData[i];
      await TimelineEvent.create({ ...e, timelineId: timeline.id, sortOrder: i });
    }

    req.flash('success_msg', 'Timeline saved.');
    return res.redirect(`/admin/timelines/${timeline.id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to save timeline.');
    return res.redirect(`/admin/timelines/${req.params.id}/edit`);
  }
});

router.post('/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    await Timeline.destroy({ where: { id: req.params.id } });
    req.flash('success_msg', 'Timeline deleted.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete timeline.');
  }
  res.redirect('/admin/timelines');
});

router.get('/:id/export', ensureAuthenticated, async (req, res) => {
  const timeline = await Timeline.findByPk(req.params.id);
  if (!timeline) {
    req.flash('error_msg', 'Timeline not found.');
    return res.redirect('/admin/timelines');
  }
  const events = await TimelineEvent.findAll({
    where: { timelineId: timeline.id },
    order: [['sortOrder', 'ASC']],
  });
  const htmlOutput = generateTimelineHTML(timeline, events);
  res.render('admin/timeline-export', {
    title: 'export timeline',
    timeline,
    htmlOutput,
    eventsCount: events.length,
  });
});

router.get('/:id/export/download', ensureAuthenticated, async (req, res) => {
  const timeline = await Timeline.findByPk(req.params.id);
  if (!timeline) {
    return res.status(404).send('Not found');
  }
  const events = await TimelineEvent.findAll({
    where: { timelineId: timeline.id },
    order: [['sortOrder', 'ASC']],
  });
  const htmlOutput = generateTimelineHTML(timeline, events);
  res.set('Content-Type', 'text/html');
  res.set('Content-Disposition', `attachment; filename="${timeline.slug}-timeline.html"`);
  res.send(htmlOutput);
});

router.get('/:id/revisions', ensureAuthenticated, async (req, res) => {
  const timeline = await Timeline.findByPk(req.params.id);
  if (!timeline) {
    req.flash('error_msg', 'Timeline not found.');
    return res.redirect('/admin/timelines');
  }
  const revisions = await TimelineRevision.findAll({
    where: { timelineId: timeline.id },
    order: [['createdAt', 'DESC']],
  });
  res.render('admin/timeline-revisions', { title: 'revisions', timeline, revisions });
});

router.post('/:id/revisions/:revId/restore', ensureAuthenticated, async (req, res) => {
  try {
    const timeline = await Timeline.findByPk(req.params.id);
    if (!timeline) {
      req.flash('error_msg', 'Timeline not found.');
      return res.redirect('/admin/timelines');
    }
    const revision = await TimelineRevision.findByPk(req.params.revId);
    if (!revision || revision.timelineId !== timeline.id) {
      req.flash('error_msg', 'Revision not found.');
      return res.redirect(`/admin/timelines/${timeline.id}/edit`);
    }

    const snap = await buildSnapshot(timeline);
    await TimelineRevision.create({
      timelineId: timeline.id,
      snapshot: snap,
      revisedBy: req.user.username || '',
    });

    const data = JSON.parse(revision.snapshot);
    await timeline.update({
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      status: data.status,
    });
    await TimelineEvent.destroy({ where: { timelineId: timeline.id } });
    if (Array.isArray(data.events)) {
      for (let i = 0; i < data.events.length; i += 1) {
        const e = data.events[i];
        await TimelineEvent.create({
          timelineId: timeline.id,
          sortOrder: e.sortOrder != null ? e.sortOrder : i,
          dateText: e.dateText || '',
          dateISO: e.dateISO || '',
          location: e.location || '',
          heading: e.heading || 'Event',
          description: e.description || '',
          imageUrl: e.imageUrl || '',
          imageAlt: e.imageAlt || '',
        });
      }
    }

    req.flash('success_msg', 'Revision restored.');
    return res.redirect(`/admin/timelines/${timeline.id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to restore revision.');
    return res.redirect(`/admin/timelines/${req.params.id}/edit`);
  }
});

router.post('/:id/events/reorder', ensureAuthenticated, async (req, res) => {
  try {
    const timeline = await Timeline.findByPk(req.params.id);
    if (!timeline) {
      return res.status(404).json({ success: false });
    }
    const ids = req.body.eventIds;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false });
    }
    for (let i = 0; i < ids.length; i += 1) {
      await TimelineEvent.update(
        { sortOrder: i },
        { where: { id: ids[i], timelineId: timeline.id } }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
