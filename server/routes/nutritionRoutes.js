// server/routes/nutritionRoutes.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctl = require('../controllers/nutritionController');

router.post('/logMeal',              protect, ctl.logMeal);
router.post('/nutrition/saveUserProgress', protect, ctl.saveUserProgress);
router.get ('/nutrition/getUserProgress',  protect, ctl.getUserProgress);

module.exports = router;
