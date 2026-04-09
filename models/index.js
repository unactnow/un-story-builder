const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'password_reset_tokens',
  timestamps: true,
});

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  label: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'text',
  },
}, {
  tableName: 'settings',
  timestamps: false,
});

const FeatureStory = sequelize.define('FeatureStory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('draft', 'published'), defaultValue: 'draft' },
}, { tableName: 'feature_stories', timestamps: true });

const StoryBlock = sequelize.define('StoryBlock', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  blockType: {
    type: DataTypes.ENUM(
      'hero_image',
      'hero_video',
      'full_image',
      'full_image_overlay_left',
      'full_image_overlay_center',
      'full_image_overlay_right',
      'full_image_subtitle',
      'split_image_left',
      'split_image_right',
      'text_block',
      'text_body',
      'quote_dark',
      'quote_light',
      'divider'
    ),
    allowNull: false,
  },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  heading: { type: DataTypes.TEXT, defaultValue: '' },
  subheading: { type: DataTypes.TEXT, defaultValue: '' },
  bodyText: { type: DataTypes.TEXT, defaultValue: '' },
  quoteText: { type: DataTypes.TEXT, defaultValue: '' },
  quoteSpeaker: { type: DataTypes.STRING, defaultValue: '' },
  quoteSpeakerTitle: { type: DataTypes.STRING, defaultValue: '' },
  imageUrl: { type: DataTypes.TEXT, defaultValue: '' },
  imageAlt: { type: DataTypes.STRING, defaultValue: '' },
  imageCaption: { type: DataTypes.STRING, defaultValue: '' },
  videoUrl: { type: DataTypes.TEXT, defaultValue: '' },
}, { tableName: 'story_blocks', timestamps: true });

const Timeline = sequelize.define('Timeline', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  status: { type: DataTypes.ENUM('draft', 'published'), defaultValue: 'draft' },
}, { tableName: 'timelines', timestamps: true });

const TimelineEvent = sequelize.define('TimelineEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  dateText: { type: DataTypes.STRING, allowNull: false },
  dateISO: { type: DataTypes.STRING, defaultValue: '' },
  location: { type: DataTypes.STRING, defaultValue: '' },
  heading: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  imageUrl: { type: DataTypes.TEXT, defaultValue: '' },
  imageAlt: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'timeline_events', timestamps: true });

const StoryRevision = sequelize.define('StoryRevision', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  snapshot: { type: DataTypes.TEXT, allowNull: false },
  revisedBy: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'story_revisions', timestamps: true });

const TimelineRevision = sequelize.define('TimelineRevision', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  snapshot: { type: DataTypes.TEXT, allowNull: false },
  revisedBy: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'timeline_revisions', timestamps: true });

User.hasMany(PasswordResetToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

FeatureStory.hasMany(StoryBlock, { foreignKey: 'storyId', onDelete: 'CASCADE', as: 'blocks' });
StoryBlock.belongsTo(FeatureStory, { foreignKey: 'storyId' });

FeatureStory.hasMany(StoryRevision, { foreignKey: 'storyId', onDelete: 'CASCADE', as: 'revisions' });
StoryRevision.belongsTo(FeatureStory, { foreignKey: 'storyId' });

Timeline.hasMany(TimelineEvent, { foreignKey: 'timelineId', onDelete: 'CASCADE', as: 'events' });
TimelineEvent.belongsTo(Timeline, { foreignKey: 'timelineId' });

Timeline.hasMany(TimelineRevision, { foreignKey: 'timelineId', onDelete: 'CASCADE', as: 'revisions' });
TimelineRevision.belongsTo(Timeline, { foreignKey: 'timelineId' });

module.exports = {
  sequelize,
  User,
  PasswordResetToken,
  Setting,
  FeatureStory,
  StoryBlock,
  Timeline,
  TimelineEvent,
  StoryRevision,
  TimelineRevision,
};
