const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAmal, getAmals, checkDate, getDashboard,
  getAnalytics, updateAmal, deleteAmal, exportData, importData
} = require('../controllers/amalController');

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/check/:date', checkDate);
router.get('/export', exportData);
router.post('/import', importData);
router.get('/', getAmals);
router.post('/', createAmal);
router.put('/:id', updateAmal);
router.delete('/:id', deleteAmal);

module.exports = router;
