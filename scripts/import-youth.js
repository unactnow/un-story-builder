#!/usr/bin/env node
/**
 * Remove legacy sample rows and import the photo essay template story + sample timeline
 * from scripts/youth-content.js. Safe to run multiple times (matches story/timeline titles).
 *
 * Usage: node scripts/import-youth.js
 */
require('dotenv').config();
const {
  sequelize,
  FeatureStory,
  StoryBlock,
  Timeline,
  TimelineEvent,
} = require('../models');
const youth = require('./youth-content');

async function importYouth() {
  await sequelize.sync({ alter: true });

  await FeatureStory.destroy({ where: { title: 'Sample Photo Essay' } });
  await FeatureStory.destroy({ where: { title: 'Youth Have Always Moved History' } });
  await Timeline.destroy({ where: { title: 'Sample Timeline' } });
  await Timeline.destroy({ where: { title: 'Youth Have Always Moved History' } });

  const [story] = await FeatureStory.findOrCreate({
    where: { title: youth.featureStory.title },
    defaults: youth.featureStory,
  });
  await story.update(youth.featureStory);
  await StoryBlock.destroy({ where: { storyId: story.id } });
  for (const b of youth.storyBlocks) {
    await StoryBlock.create({ ...b, storyId: story.id });
  }

  const [timeline] = await Timeline.findOrCreate({
    where: { title: youth.timeline.title },
    defaults: youth.timeline,
  });
  await timeline.update(youth.timeline);
  await TimelineEvent.destroy({ where: { timelineId: timeline.id } });
  for (const e of youth.timelineEvents) {
    await TimelineEvent.create({ ...e, timelineId: timeline.id });
  }

  console.log('Photo essay template story and sample timeline imported.');
  process.exit(0);
}

importYouth().catch((err) => {
  console.error(err);
  process.exit(1);
});
