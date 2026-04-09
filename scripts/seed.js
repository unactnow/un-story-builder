#!/usr/bin/env node
/**
 * Create the first admin user. Run once after first deploy.
 *
 * Usage:
 *   npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Setting,
  FeatureStory,
  StoryBlock,
  Timeline,
  TimelineEvent,
} = require('../models');
const youth = require('./youth-content');

async function seed() {
  await sequelize.sync({ alter: true });

  const existing = await User.findOne({ where: { role: 'admin' } });
  if (existing) {
    console.log('Admin user already exists. Skipping user creation.');
  } else {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const name = process.env.ADMIN_NAME || 'Admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin';

    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, name, email, password: hash, role: 'admin' });

    console.log(`Admin user created: ${username} (${email})`);
  }

  const defaults = [
    { key: 'site_name', value: 'UN Feature Stories and Timelines', label: 'Site Name', type: 'text' },
    { key: 'tagline', value: '', label: 'Tagline', type: 'text' },
    { key: 'footer_text', value: '', label: 'Footer Text', type: 'text' },
    { key: 'analytics_code', value: '', label: 'Analytics Code', type: 'textarea' },
  ];
  for (const d of defaults) {
    await Setting.findOrCreate({ where: { key: d.key }, defaults: d });
  }
  console.log('Default settings seeded.');

  const storyCount = await FeatureStory.count();
  if (storyCount === 0) {
    const story = await FeatureStory.create(youth.featureStory);
    for (const b of youth.storyBlocks) {
      await StoryBlock.create({ ...b, storyId: story.id });
    }
    console.log('Feature story seeded (photo essay template).');
  }

  const timelineCount = await Timeline.count();
  if (timelineCount === 0) {
    const timeline = await Timeline.create(youth.timeline);
    for (const e of youth.timelineEvents) {
      await TimelineEvent.create({ ...e, timelineId: timeline.id });
    }
    console.log('Timeline seeded (sample).');
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
