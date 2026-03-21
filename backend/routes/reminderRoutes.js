const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReminders, saveReminders, getUpcomingFasting } = require('../controllers/reminderController');

router.use(protect);
router.get('/', getReminders);
router.post('/', saveReminders);
router.get('/fasting-upcoming', getUpcomingFasting);

module.exports = router;
