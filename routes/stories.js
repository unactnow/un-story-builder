const express = require('express');
const {
  FeatureStory,
  StoryBlock,
  StoryRevision,
  Timeline,
} = require('../models');
const { ensureAuthenticated } = require('../middleware/auth');
const { generateStoryHTML, escapeHtml } = require('../helpers/exportStory');
const { sanitizeRichText } = require('../helpers/sanitizeRichText');

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

const YOUTUBE_URL_RE = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;

function blockFieldsFromBody(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const blockType = entry.blockType;
  const rawBody = entry.bodyText != null ? String(entry.bodyText) : '';

  let bodyText;
  if (blockType === 'timeline_embed') {
    bodyText = rawBody.trim();
  } else {
    bodyText = sanitizeRichText(rawBody);
  }

  let videoUrl = entry.videoUrl != null ? String(entry.videoUrl) : '';
  if (blockType === 'youtube_embed') {
    videoUrl = YOUTUBE_URL_RE.test(videoUrl.trim()) ? videoUrl.trim() : '';
  }

  return {
    blockType,
    sortOrder: parseInt(entry.sortOrder, 10) || 0,
    heading: entry.heading != null ? String(entry.heading) : '',
    subheading: entry.subheading != null ? String(entry.subheading) : '',
    bodyText,
    quoteText: sanitizeRichText(entry.quoteText != null ? String(entry.quoteText) : ''),
    quoteSpeaker: entry.quoteSpeaker != null ? String(entry.quoteSpeaker) : '',
    quoteSpeakerTitle: entry.quoteSpeakerTitle != null ? String(entry.quoteSpeakerTitle) : '',
    imageUrl: entry.imageUrl != null ? String(entry.imageUrl) : '',
    imageAlt: entry.imageAlt != null ? String(entry.imageAlt) : '',
    imageCaption: entry.imageCaption != null ? String(entry.imageCaption) : '',
    videoUrl,
  };
}

function parseBlocks(body) {
  const raw = body.blocks;
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((entry, i) => {
    const f = blockFieldsFromBody(entry);
    if (!f || !f.blockType) return null;
    f.sortOrder = f.sortOrder || i;
    return f;
  }).filter(Boolean);
}

async function buildSnapshot(story) {
  const blocks = await StoryBlock.findAll({
    where: { storyId: story.id },
    order: [['sortOrder', 'ASC']],
  });
  return JSON.stringify({
    title: story.title,
    blocks: blocks.map((bl) => {
      const b = bl.get({ plain: true });
      return {
        blockType: b.blockType,
        sortOrder: b.sortOrder,
        heading: b.heading || '',
        subheading: b.subheading || '',
        bodyText: b.bodyText || '',
        quoteText: b.quoteText || '',
        quoteSpeaker: b.quoteSpeaker || '',
        quoteSpeakerTitle: b.quoteSpeakerTitle || '',
        imageUrl: b.imageUrl || '',
        imageAlt: b.imageAlt || '',
        imageCaption: b.imageCaption || '',
        videoUrl: b.videoUrl || '',
      };
    }),
  });
}

/** Persists story + blocks from req.body (same as POST /edit). Returns { story } or { error }. */
async function saveStoryDocument(req, storyId) {
  const story = await FeatureStory.findByPk(storyId);
  if (!story) {
    return { error: 'not_found' };
  }
  const snap = await buildSnapshot(story);
  await StoryRevision.create({
    storyId: story.id,
    snapshot: snap,
    revisedBy: req.user.username || '',
  });

  const title = (req.body.title || '').trim();
  if (!title) {
    return { error: 'title_required' };
  }
  await story.update({ title });

  await StoryBlock.destroy({ where: { storyId: story.id } });
  const blockData = parseBlocks(req.body);
  for (let i = 0; i < blockData.length; i += 1) {
    const b = blockData[i];
    await StoryBlock.create({ ...b, storyId: story.id, sortOrder: i });
  }
  return { story };
}

router.get('/', ensureAuthenticated, async (req, res) => {
  const rows = await FeatureStory.findAll({ order: [['updatedAt', 'DESC']] });
  const stories = await Promise.all(
    rows.map(async (s) => {
      const plain = s.get({ plain: true });
      plain.blocksCount = await StoryBlock.count({ where: { storyId: s.id } });
      return plain;
    })
  );
  res.render('admin/stories', { title: 'Feature stories', stories });
});

router.get('/new', ensureAuthenticated, async (req, res) => {
  const timelines = await Timeline.findAll({ order: [['title', 'ASC']] });
  res.render('admin/story-edit', {
    title: 'New story',
    story: null,
    blocks: [],
    revisionCount: 0,
    timelines,
  });
});

router.post('/new', ensureAuthenticated, async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    if (!title) {
      req.flash('error_msg', 'Title is required.');
      return res.redirect('/admin/stories/new');
    }
    const story = await FeatureStory.create({ title });
    const blockData = parseBlocks(req.body);
    for (let i = 0; i < blockData.length; i += 1) {
      const b = blockData[i];
      await StoryBlock.create({ ...b, storyId: story.id, sortOrder: i });
    }
    req.flash('success_msg', 'Story created.');
    return res.redirect(`/admin/stories/${story.id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to create story.');
    return res.redirect('/admin/stories/new');
  }
});

router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  const story = await FeatureStory.findByPk(req.params.id);
  if (!story) {
    req.flash('error_msg', 'Story not found.');
    return res.redirect('/admin/stories');
  }
  const blocks = await StoryBlock.findAll({
    where: { storyId: story.id },
    order: [['sortOrder', 'ASC']],
  });
  const revisionCount = await StoryRevision.count({ where: { storyId: story.id } });
  const timelines = await Timeline.findAll({ order: [['title', 'ASC']] });
  res.render('admin/story-edit', {
    title: 'Edit story',
    story,
    blocks,
    revisionCount,
    timelines,
  });
});

router.post('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const result = await saveStoryDocument(req, req.params.id);
    if (result.error === 'not_found') {
      req.flash('error_msg', 'Story not found.');
      return res.redirect('/admin/stories');
    }
    if (result.error === 'title_required') {
      req.flash('error_msg', 'Title is required.');
      return res.redirect(`/admin/stories/${req.params.id}/edit`);
    }

    req.flash('success_msg', 'Story saved.');
    return res.redirect(`/admin/stories/${result.story.id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to save story.');
    return res.redirect(`/admin/stories/${req.params.id}/edit`);
  }
});

router.post('/:id/preview-save', ensureAuthenticated, async (req, res) => {
  try {
    const result = await saveStoryDocument(req, req.params.id);
    if (result.error === 'not_found') {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    if (result.error === 'title_required') {
      return res.status(400).json({ ok: false, error: 'title_required' });
    }
    return res.json({
      ok: true,
      previewUrl: `/admin/stories/${result.story.id}/preview`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'server' });
  }
});

router.post('/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    await FeatureStory.destroy({ where: { id: req.params.id } });
    req.flash('success_msg', 'Story deleted.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete story.');
  }
  res.redirect('/admin/stories');
});

router.get('/:id/preview', ensureAuthenticated, async (req, res) => {
  const story = await FeatureStory.findByPk(req.params.id);
  if (!story) {
    return res.status(404).send('Story not found');
  }
  const blocks = await StoryBlock.findAll({
    where: { storyId: story.id },
    order: [['sortOrder', 'ASC']],
  });
  const htmlOutput = await generateStoryHTML(story, blocks, { req });
  const titleSafe = escapeHtml(story.title || 'Story');
  const editUrl = `/admin/stories/${story.id}/edit`;
  const doc = `<!DOCTYPE html>
<html lang="en" class="fs-preview-standalone">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Preview — ${titleSafe}</title>
<style>
.fs-preview-edit-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100000;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.25rem;
  min-height: 48px;
  padding: 0.5rem 1rem;
  background: #009edb;
  font-family: Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.fs-preview-edit-bar a {
  color: #fff;
  font-weight: 500;
  text-decoration: none;
  flex-shrink: 0;
}
.fs-preview-edit-bar a:hover {
  text-decoration: underline;
}
.fs-preview-edit-bar-note {
  display: block;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.35;
  color: rgba(255,255,255,0.88);
  max-width: 36rem;
  margin: 0;
}
html.fs-preview-standalone body {
  padding-top: 4.5rem;
}
</style>
</head>
<body>
<nav class="fs-preview-edit-bar" aria-label="Preview">
  <a href="${editUrl}">← Back to edit</a>
  <span class="fs-preview-edit-bar-note"><strong>Note:</strong> Preview text-sizing and fonts may not display accurately.</span>
</nav>
${htmlOutput}
</body>
</html>`;
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Content-Disposition', 'inline');
  res.send(doc);
});

router.get('/:id/export', ensureAuthenticated, async (req, res) => {
  const story = await FeatureStory.findByPk(req.params.id);
  if (!story) {
    req.flash('error_msg', 'Story not found.');
    return res.redirect('/admin/stories');
  }
  const blocks = await StoryBlock.findAll({
    where: { storyId: story.id },
    order: [['sortOrder', 'ASC']],
  });
  const htmlOutput = await generateStoryHTML(story, blocks);
  res.render('admin/story-export', {
    title: 'Export story',
    story,
    htmlOutput,
    blocksCount: blocks.length,
  });
});

router.get('/:id/export/download', ensureAuthenticated, async (req, res) => {
  const story = await FeatureStory.findByPk(req.params.id);
  if (!story) {
    return res.status(404).send('Not found');
  }
  const blocks = await StoryBlock.findAll({
    where: { storyId: story.id },
    order: [['sortOrder', 'ASC']],
  });
  const htmlOutput = await generateStoryHTML(story, blocks);
  res.set('Content-Type', 'text/html');
  const base = slugify(story.title || 'story') || 'story';
  res.set('Content-Disposition', `attachment; filename="${base}.html"`);
  res.send(htmlOutput);
});

router.get('/:id/revisions', ensureAuthenticated, async (req, res) => {
  const story = await FeatureStory.findByPk(req.params.id);
  if (!story) {
    req.flash('error_msg', 'Story not found.');
    return res.redirect('/admin/stories');
  }
  const revisions = await StoryRevision.findAll({
    where: { storyId: story.id },
    order: [['createdAt', 'DESC']],
  });
  res.render('admin/story-revisions', { title: 'Revisions', story, revisions });
});

router.post('/:id/revisions/:revId/restore', ensureAuthenticated, async (req, res) => {
  try {
    const story = await FeatureStory.findByPk(req.params.id);
    if (!story) {
      req.flash('error_msg', 'Story not found.');
      return res.redirect('/admin/stories');
    }
    const revision = await StoryRevision.findByPk(req.params.revId);
    if (!revision || revision.storyId !== story.id) {
      req.flash('error_msg', 'Revision not found.');
      return res.redirect(`/admin/stories/${story.id}/edit`);
    }

    const snap = await buildSnapshot(story);
    await StoryRevision.create({
      storyId: story.id,
      snapshot: snap,
      revisedBy: req.user.username || '',
    });

    const data = JSON.parse(revision.snapshot);
    await story.update({
      title: data.title,
    });
    await StoryBlock.destroy({ where: { storyId: story.id } });
    if (Array.isArray(data.blocks)) {
      for (let i = 0; i < data.blocks.length; i += 1) {
        const b = data.blocks[i];
        await StoryBlock.create({
          storyId: story.id,
          blockType: b.blockType,
          sortOrder: b.sortOrder != null ? b.sortOrder : i,
          heading: b.heading || '',
          subheading: b.subheading || '',
          bodyText: b.blockType === 'timeline_embed' ? (b.bodyText || '').trim() : sanitizeRichText(b.bodyText || ''),
          quoteText: sanitizeRichText(b.quoteText || ''),
          quoteSpeaker: b.quoteSpeaker || '',
          quoteSpeakerTitle: b.quoteSpeakerTitle || '',
          imageUrl: b.imageUrl || '',
          imageAlt: b.imageAlt || '',
          imageCaption: b.imageCaption || '',
          videoUrl: b.videoUrl || '',
        });
      }
    }

    req.flash('success_msg', 'Revision restored.');
    return res.redirect(`/admin/stories/${story.id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to restore revision.');
    return res.redirect(`/admin/stories/${req.params.id}/edit`);
  }
});

router.post('/:id/blocks/reorder', ensureAuthenticated, async (req, res) => {
  try {
    const story = await FeatureStory.findByPk(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false });
    }
    const ids = req.body.blockIds;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false });
    }
    for (let i = 0; i < ids.length; i += 1) {
      await StoryBlock.update(
        { sortOrder: i },
        { where: { id: ids[i], storyId: story.id } }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
