// server/routes/workoutRoutes.js

const express = require('express');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const UserProgress = require('../models/UserProgress');
const { protect } = require('../middleware/auth'); // protect = checks JWT

// @desc    Save a completed workout
// @route   POST /api/workouts
// @access  Private (needs token)
router.post('/workouts', protect, async (req, res) => {
  try {
    const { date, exercises } = req.body;

    const workout = new WorkoutLog({
      userId: req.user.id,
      date,
      exercises,
    });

    await workout.save();

    res.status(201).json({ message: 'Workout saved successfully' });
  } catch (error) {
    console.error('❌ Error saving workout log:', error.message);
    res.status(500).json({ message: 'Server error saving workout' });
  }
});

// @desc    Save user progress snapshot
// @route   POST /api/workouts/saveUserProgress
// @access  Private (needs token)
router.post('/workouts/saveUserProgress', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = req.body;

    if (!progress) {
      return res.status(400).json({ message: 'No progress data provided' });
    }

    const existing = await UserProgress.findOne({ userId });

    if (existing) {
      existing.progress = progress;
      existing.updatedAt = Date.now();
      await existing.save();
    } else {
      const newProgress = new UserProgress({ userId, progress });
      await newProgress.save();
    }

    res.status(200).json({ message: 'User progress saved successfully' });
  } catch (error) {
    console.error('❌ Error saving user progress:', error.message);
    res.status(500).json({ message: 'Server error saving user progress' });
  }
});

// @desc    Get saved user progress
// @route   GET /api/workouts/getUserProgress
// @access  Private (needs token)
router.get('/workouts/getUserProgress', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProgress = await UserProgress.findOne({ userId });

    if (!userProgress) {
      return res.status(404).json({ message: 'No user progress found' });
    }

    res.status(200).json(userProgress.progress);
  } catch (error) {
    console.error('❌ Error fetching user progress:', error.message);
    res.status(500).json({ message: 'Server error fetching user progress' });
  }
});

module.exports = router;
