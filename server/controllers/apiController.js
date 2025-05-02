// server/controllers/apiController.js

const WorkoutLog       = require('../models/WorkoutLog');
const UserPreferences  = require('../models/UserPreferences');

/**
 * Health check endpoint
 */
exports.ping = (req, res) => {
  console.log('🎯 Controller responding');
  return res.json({ message: 'pong' });
};

/**
 * POST /api/logWorkout
 * Save a new workout log for the authenticated user
 */
exports.logWorkout = async (req, res) => {
  try {
    const { date, exercises } = req.body;
    const userId = req.user.id; // extracted by your auth middleware

    const newWorkout = new WorkoutLog({ userId, date, exercises });
    await newWorkout.save();

    return res.status(201).json({ message: 'Workout saved successfully!' });
  } catch (error) {
    console.error('❌ Error saving workout:', error);
    return res.status(500).json({ message: 'Server error saving workout' });
  }
};

exports.saveUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'No user ID found in request' });
    }

    const preferencesData = req.body;

    let prefs = await UserPreferences.findOne({ userId });
    if (prefs) {
      prefs.preferences = preferencesData; // update the preferences object
      await prefs.save();
      console.log('✅ Updated preferences for user:', userId);
    } else {
      prefs = new UserPreferences({ userId, preferences: preferencesData });
      await prefs.save();
      console.log('✅ Created preferences for user:', userId);
    }

    return res.status(200).json({ message: 'Preferences saved successfully.' });
  } catch (error) {
    console.error('❌ Error saving preferences:', error);
    return res.status(500).json({ message: 'Server error saving preferences', error: error.message });
  }
};

/**
 * GET /api/getWorkoutLogs
 * Retrieve all workout logs for the authenticated user, newest first
 */
exports.getWorkouts = async (req, res) => {
  try {
    const userId = req.user.id;

    const workouts = await WorkoutLog
      .find({ userId })
      .sort({ date: -1 });

    return res.json(workouts);
  } catch (error) {
    console.error('❌ Error fetching workouts:', error);
    return res.status(500).json({ message: 'Server error fetching workouts' });
  }
};

/**
 * GET /api/getUserPreferences
 * Retrieve the authenticated user’s saved preferences
 */
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      return res.status(404).json({ message: 'Preferences not found.' });
    }

    return res.json(preferences);
  } catch (error) {
    console.error('❌ Error fetching preferences:', error);
    return res.status(500).json({ message: 'Server error fetching preferences' });
  }
};
