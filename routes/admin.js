const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Setting, FeatureStory, Timeline } = require('../models');
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userCount = await User.count();
    const recentStory = await FeatureStory.findOne({ order: [['updatedAt', 'DESC']] });
    const recentTimeline = await Timeline.findOne({ order: [['updatedAt', 'DESC']] });
    res.render('admin/dashboard', {
      title: 'Dashboard',
      userCount,
      recentStory,
      recentTimeline,
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', {
      title: 'Dashboard',
      userCount: 0,
      recentStory: null,
      recentTimeline: null,
    });
  }
});

router.get('/settings', isAdmin, async (req, res) => {
  try {
    const rows = await Setting.findAll({ order: [['key', 'ASC']] });
    res.render('admin/settings', { title: 'Settings', settings_rows: rows });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load settings.');
    res.redirect('/admin');
  }
});

router.post('/settings', isAdmin, async (req, res) => {
  try {
    const rows = await Setting.findAll();
    for (const row of rows) {
      const val = req.body[row.key] || '';
      await Setting.update({ value: val }, { where: { key: row.key } });
    }
    req.flash('success_msg', 'Settings saved.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to save settings.');
  }
  res.redirect('/admin/settings');
});

router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/users', { title: 'Users', users });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load users.');
    res.redirect('/admin');
  }
});

router.post('/users/add', isAdmin, async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;

    if (!username || !name || !email || !password) {
      req.flash('error_msg', 'All fields are required.');
      return res.redirect('/admin/users');
    }

    const validRole = ['admin', 'user'].includes(role) ? role : 'user';
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, name, email: email.toLowerCase(), password: hash, role: validRole });

    req.flash('success_msg', `User '${username}' created.`);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      req.flash('error_msg', 'Username or email already exists.');
    } else {
      console.error(err);
      req.flash('error_msg', 'Failed to create user.');
    }
  }

  res.redirect('/admin/users');
});

router.post('/users/:id/delete', isAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    req.flash('error_msg', "You can't delete yourself.");
    return res.redirect('/admin/users');
  }

  try {
    await User.destroy({ where: { id: req.params.id } });
    req.flash('success_msg', 'User deleted.');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete user.');
  }

  res.redirect('/admin/users');
});

module.exports = router;
