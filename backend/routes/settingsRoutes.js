const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/', protect, (req, res) => {
  res.json({ success: true, data: { theme: req.user.theme, reminderSettings: req.user.reminderSettings } });
});

module.exports = router;
