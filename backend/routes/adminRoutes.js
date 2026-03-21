const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  getUserData,
  getStats,
} = require('../controllers/adminController');

router.use(protect, admin);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserData);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
// Admin can delete their own amal data (not account)
router.delete('/my-data', async (req, res) => {
  try {
    const Amal = require('../models/Amal');
    const result = await Amal.deleteMany({ user: req.user._id });
    res.json({
      success: true,
      message: `${result.deletedCount} টি record মুছে দেওয়া হয়েছে`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
