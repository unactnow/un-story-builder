#!/usr/bin/env node
/**
 * Remove legacy sample story/timeline and import the Youth feature + timeline
 * from scripts/youth-content.js. Safe to run multiple times (idempotent for Youth title).
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
  await Timeline.destroy({ where: { title: 'Sample Timeline' } });

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

  console.log('Youth feature story and timeline imported.');
  process.exit(0);
}

importYouth().catch((err) => {
  console.error(err);
  process.exit(1);
});
