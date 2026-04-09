const express = require('express');
const {
  FeatureStory,
  StoryBlock,
  StoryRevision,
} = require('../models');
const { ensureAuthenticated } = require('../middleware/auth');
const { generateStoryHTML } = require('../helpers/exportStory');

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

function blockFieldsFromBody(entry) {
  if (!entry || typeof entry !== 'object') return null;
  return {
    blockType: entry.blockType,
    sortOrder: parseInt(entry.sortOrder, 10) || 0,
    heading: entry.heading != null ? String(entry.heading) : '',
    subheading: entry.subheading != null ? String(entry.subheading) : '',
    bodyText: entry.bodyText != null ? String(entry.bodyText) : '',
    quoteText: entry.quoteText != null ? String(entry.quoteText) : '',
    quoteSpeaker: entry.quoteSpeaker != null ? String(entry.quoteSpeaker) : '',
    quoteSpeakerTitle: entry.quoteSpeakerTitle != null ? String(entry.quoteSpeakerTitle) : '',
    imageUrl: entry.imageUrl != null ? String(entry.imageUrl) : '',
    imageAlt: entry.imageAlt != null ? String(entry.imageAlt) : '',
    imageCaption: entry.imageCaption != null ? String(entry.imageCaption) : '',
    videoUrl: entry.videoUrl != null ? String(entry.videoUrl) : '',
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
    slug: story.slug,
    status: story.status,
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

router.get('/', ensureAuthenticated, async (req, res) => {
  const rows = await FeatureStory.findAll({ order: [['updatedAt', 'DESC']] });
  const stories = await Promise.all(
    rows.map(async (s) => {
      const plain = s.get({ plain: true });
      plain.blocksCount = await StoryBlock.count({ where: { storyId: s.id } });
      return plain;
    })
  );
  res.render('admin/stories', { title: 'feature stories', stories });
});

router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('admin/story-edit', {
    title: 'new story',
    story: null,
    blocks: [],
    revisionCount: 0,
  });
});

router.post('/new', ensureAuthenticated, async (req, res) => {
  try {
    let slug = (req.body.slug || '').trim();
    const title = (req.body.title || '').trim();
    if (!title) {
      req.flash('error_msg', 'Title is required.');
      return res.redirect('/admin/stories/new');
    }
    if (!slug) slug = slugify(title);
    const status = ['draft', 'published'].includes(req.body.status) ? req.body.status : 'draft';
    const story = await FeatureStory.create({ title, slug, status });
    const blockData = parseBlocks(req.body);
    for (let i = 0; i < blockData.length; i += 1) {
      const b = blockData[i];
      await StoryBlock.create({ ...b, storyId: story.id, sortOrder: i });
    }
    req.flash('success_msg', 'Story created.');
    return res.redirect(`/admin/stories/${story.id}/edit`);
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      req.flash('error_msg', 'Slug already exists.');
    } else {
      req.flash('error_msg', 'Failed to create story.');
    }
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
  res.render('admin/story-edit', {
    title: 'edit story',
    story,
    blocks,
    revisionCount,
  });
});

router.post('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const story = await FeatureStory.findByPk(req.params.id);
    if (!story) {
      req.flash('error_msg', 'Story not found.');
      return res.redirect('/admin/stories');
    }
    const snap = await buildSnapshot(story);
    await StoryRevision.create({
      storyId: story.id,
      snapshot: snap,
      revisedBy: req.user.username || '',
    });

    let slug = (req.body.slug || '').trim();
    const title = (req.body.title || '').trim();
    if (!title) {
      req.flash('error_msg', 'Title is required.');
      return res.redirect(`/admin/stories/${story.id}/edit`);
    }
    if (!slug) slug = slugify(title);
    const status = ['draft', 'published'].includes(req.body.status) ? req.body.status : 'draft';
    await story.update({ title, slug, status });

    await StoryBlock.destroy({ where: { storyId: story.id } });
    const blockData = parseBlocks(req.body);
    for (let i = 0; i < blockData.length; i += 1) {
      const b = blockData[i];
      await StoryBlock.create({ ...b, storyId: story.id, sortOrder: i });
    }

    req.flash('success_msg', 'Story saved.');
    return res.redirect(`/admin/stories/${story.id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to save story.');
    return res.redirect(`/admin/stories/${req.params.id}/edit`);
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
  const htmlOutput = generateStoryHTML(story, blocks);
  res.render('admin/story-export', {
    title: 'export story',
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
  const htmlOutput = generateStoryHTML(story, blocks);
  res.set('Content-Type', 'text/html');
  res.set('Content-Disposition', `attachment; filename="${story.slug}.html"`);
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
  res.render('admin/story-revisions', { title: 'revisions', story, revisions });
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
      slug: data.slug,
      status: data.status,
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
          bodyText: b.bodyText || '',
          quoteText: b.quoteText || '',
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
