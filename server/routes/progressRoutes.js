// server/routes/progressRoutes.js

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  updateHeatmapAndWorkoutsDone,
  saveMyProgress,
  getUserProgress,
  setOnboardingComplete
} = require('../controllers/progressController');

const router = express.Router();

console.log('✅ progressRoutes.js loaded');

/**
 * Legacy: mark a set done and bump workoutsDone in the JSON heat-map
 */
router.post(
  '/update-heatmap',
  protect,
  updateHeatmapAndWorkoutsDone
);

/**
 * Full snapshot save → MongoDB
 */
router.post(
  '/saveMyProgress',
  protect,
  saveMyProgress
);

/**
 * Retrieve the full user-progress snapshot PLUS onboarding flags
 */
router.get(
  '/getUserProgress',
  protect,
  getUserProgress
);

/**
 * Flip the Dashboard overlay flag on the server
 */
router.post(
  '/setOnboardingComplete',
  protect,
  setOnboardingComplete
);

module.exports = router;
