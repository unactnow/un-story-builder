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

async function seed() {
  await sequelize.sync();

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
    const story = await FeatureStory.create({
      title: 'Sample Photo Essay',
      slug: 'sample-photo-essay',
      status: 'draft',
    });
    const blocks = [
      {
        blockType: 'hero_image',
        sortOrder: 0,
        heading: 'Sample Photo Essay Title',
        subheading: 'A demonstration of the block-based editor',
        imageUrl: 'https://www.un.org/sites/un2.un.org/files/sample.jpg',
        imageAlt: '',
        imageCaption: '',
      },
      {
        blockType: 'text_block',
        sortOrder: 1,
        heading: 'Introduction',
        bodyText: 'This is a sample text block with a heading and body paragraph.',
      },
      {
        blockType: 'quote_dark',
        sortOrder: 2,
        quoteText: 'The future belongs to those who believe in the beauty of their dreams.',
        quoteSpeaker: 'Eleanor Roosevelt',
        quoteSpeakerTitle: '',
      },
      {
        blockType: 'full_image',
        sortOrder: 3,
        imageUrl: 'https://www.un.org/sites/un2.un.org/files/sample2.jpg',
        imageAlt: 'Sample image',
        imageCaption: '',
      },
    ];
    for (const b of blocks) {
      await StoryBlock.create({ ...b, storyId: story.id });
    }
    console.log('Sample feature story seeded (Sample Photo Essay).');
  }

  const timelineCount = await Timeline.count();
  if (timelineCount === 0) {
    const timeline = await Timeline.create({
      title: 'Sample Timeline',
      slug: 'sample-timeline',
      description: 'A sample timeline for the editor.',
      status: 'draft',
    });
    const evs = [
      {
        sortOrder: 0,
        dateText: '2020',
        dateISO: '2020-01-01',
        location: '',
        heading: 'First Event',
        description: 'Description of the first event.',
      },
      {
        sortOrder: 1,
        dateText: '2022',
        dateISO: '2022-06-15',
        location: '',
        heading: 'Second Event',
        description: 'Description of the second event.',
      },
      {
        sortOrder: 2,
        dateText: '2024',
        dateISO: '2024-03-01',
        location: '',
        heading: 'Third Event',
        description: 'Description of the third event.',
      },
    ];
    for (const e of evs) {
      await TimelineEvent.create({ ...e, timelineId: timeline.id });
    }
    console.log('Sample timeline seeded (Sample Timeline).');
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
