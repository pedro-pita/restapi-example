const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const jwt = require('jsonwebtoken');
const { authorize, protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, authorize('select_user'), async (req, res) => {
  try {
    const users = await User.find({});
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!'  });
  }
});

router.post('/register', async (req, res) => {
  const isStrongPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username and password' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
  }

  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  try {
    const user = await User.create({ username, password });
    return res.status(201).json({
      name: user.username,
      created: true,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!'  });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req?.body ?? "";
  const user = await User.findOne({ username });

  if (user && (await user.comparePassword(password))) {
    await user.updateLastLogin();
    return res.json({
      user: user.username,
      admin: user.isAdmin,
      roles: user.roles,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
    });
  } else {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
});

router.get('/:username', protect, admin, authorize('select_user'), async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (user) {
      return res.json({
        id: user._id,
        user: user.username,
        admin: user.isAdmin,
        roles: user.roles,
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!' });
  }
});

router.put('/promote/:username', protect, admin, authorize('promote_admin'), async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (user) {
      user.isAdmin = true;
      await user.save();
      return res.json({ message: 'User promoted to admin' });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!' });
  }
});

router.post('/roles/:username', protect, admin, authorize('add_roles'), async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const { roles, action } = req.body;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'add') {
      roles.forEach(role => {
        if (!user.roles.includes(role)) {
          user.roles.push(role);
        }
      });
    } else if (action === 'remove') {
      user.roles = user.roles.filter(role => !roles.includes(role));
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "add" or "remove".' });
    }

    await user.save();
    return res.json({ message: `Roles successfully ${action}ed`, roles: user.roles });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong!'  });
  }
});

module.exports = router;