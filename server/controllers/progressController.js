// // server/controllers.

// const fs = require('fs');
// const path = require('path');
// const UserProgress = require('../models/UserProgress'); // 🧠 Add this at top

// // ✅ OLD FUNCTION: For single heatmap & workoutsDone update (legacy)
// const updateHeatmapAndWorkoutsDone = async (req, res) => {
//   try {
//     const { weekNumber, dayNumber, exerciseName, workoutDoneUpdate } = req.body;
//     const userId = req.user.id;

//     const filePath = path.join(process.cwd(), 'data', `user_${userId}_progress.json`);
//     let userProgress = {};

//     if (fs.existsSync(filePath)) {
//       const fileData = fs.readFileSync(filePath, 'utf8');
//       userProgress = JSON.parse(fileData);
//     }

//     if (!userProgress.heatmap) userProgress.heatmap = {};
//     if (!userProgress.weeklyStats) userProgress.weeklyStats = {};

//     const heatmapKey = `${exerciseName}_week${weekNumber}_day${dayNumber}`;
//     userProgress.heatmap[heatmapKey] = true;

//     const weekKey = `week${weekNumber}`;
//     if (!userProgress.weeklyStats[weekKey]) {
//       userProgress.weeklyStats[weekKey] = { workoutsDone: 0 };
//     }
//     userProgress.weeklyStats[weekKey].workoutsDone += workoutDoneUpdate;

//     fs.writeFileSync(filePath, JSON.stringify(userProgress, null, 2));

//     res.status(200).json({ message: 'Progress updated successfully.' });
//   } catch (error) {
//     console.error('❌ Error updating heatmap/workoutsDone:', error.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // ✅ NEW FUNCTION: Full My Progress save to MongoDB
// const saveMyProgress = async (req, res) => {
//   try {
//     const userId   = req.user.id;
//     const { progress } = req.body;

//     if (!progress) {
//       return res.status(400).json({ message: 'No progress data provided' });
//     }

//     // 1) find or new
//     let userProgress = await UserProgress.findOne({ userId });
//     if (!userProgress) {
//       userProgress = new UserProgress({ userId, progress });
//     } else {
//       userProgress.progress   = progress;
//       userProgress.updatedAt  = Date.now();
//     }

//     // 2) always sync onboarding flags from the payload
//     if (progress.ds_onboarding_complete !== undefined) {
//       userProgress.ds_onboarding_complete = !!progress.ds_onboarding_complete;
//     }
//     if (progress.wt_onboarding_complete !== undefined) {
//       userProgress.wt_onboarding_complete = !!progress.wt_onboarding_complete;
//     }

//     // 3) save everything
//     await userProgress.save();
//     res.status(200).json({ message: 'Progress saved successfully.' });

//   } catch (error) {
//     console.error('❌ Error saving My Progress:', error.message);
//     res.status(500).json({ message: 'Server error saving My Progress' });
//   }
// };

// const setOnboardingComplete = async (req, res) => {
//   try {
//     await UserProgress.findOneAndUpdate(
//       { userId: req.user.id },
//       { ds_onboarding_complete: true },
//       { upsert: true }                  // create row if it doesn’t exist yet
//     );
//     return res.sendStatus(204);
//   } catch (err) {
//     console.error('❌ Error in setOnboardingComplete:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // ✅ Export BOTH
// module.exports = { updateHeatmapAndWorkoutsDone, saveMyProgress, setOnboardingComplete      };

'use strict';

const fs           = require('fs');
const path         = require('path');
const UserProgress = require('../models/UserProgress');   // Mongoose model

/* ────────────────────────────────────────────────────────────
   1. Legacy: heat-map + workoutsDone counter (JSON file)
   ──────────────────────────────────────────────────────────── */
const updateHeatmapAndWorkoutsDone = async (req, res) => {
  try {
    const { weekNumber, dayNumber, exerciseName, workoutDoneUpdate } = req.body;
    const userId = req.user.id;

    const filePath = path.join(
      process.cwd(),
      'data',
      `user_${userId}_progress.json`
    );

    let userProgress = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : {};

    /* ensure sub-objects exist */
    userProgress.heatmap     = userProgress.heatmap     || {};
    userProgress.weeklyStats = userProgress.weeklyStats || {};

    /* mark the set in the heat-map */
    const heatmapKey = `${exerciseName}_week${weekNumber}_day${dayNumber}`;
    userProgress.heatmap[heatmapKey] = true;

    /* bump workoutsDone */
    const weekKey = `week${weekNumber}`;
    userProgress.weeklyStats[weekKey] =
      userProgress.weeklyStats[weekKey] || { workoutsDone: 0 };

    userProgress.weeklyStats[weekKey].workoutsDone += workoutDoneUpdate;

    fs.writeFileSync(filePath, JSON.stringify(userProgress, null, 2));
    res.status(200).json({ message: 'Progress updated successfully.' });

  } catch (err) {
    console.error('❌ Error updating heatmap/workoutsDone:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ────────────────────────────────────────────────────────────
   2. Snapshot save (My Progress) → MongoDB
   ──────────────────────────────────────────────────────────── */
const saveMyProgress = async (req, res) => {
  try {
    const userId   = req.user.id;
    const { progress } = req.body;

    if (!progress) {
      return res.status(400).json({ message: 'No progress data provided' });
    }

    /* find or create */
    let userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      userProgress = new UserProgress({ userId, progress });
    } else {
      userProgress.progress  = progress;
      userProgress.updatedAt = Date.now();
    }

    /* keep onboarding flags in sync */
    if (progress.ds_onboarding_complete !== undefined) {
      userProgress.ds_onboarding_complete = !!progress.ds_onboarding_complete;
    }
    if (progress.wt_onboarding_complete !== undefined) {
      userProgress.wt_onboarding_complete = !!progress.wt_onboarding_complete;
    }

    await userProgress.save();
    res.status(200).json({ message: 'Progress saved successfully.' });

  } catch (err) {
    console.error('❌ Error saving My Progress:', err);
    res.status(500).json({ message: 'Server error saving My Progress' });
  }
};

/* ────────────────────────────────────────────────────────────
   3. Read-only endpoint – return progress snapshot + flags
   ──────────────────────────────────────────────────────────── */
const getUserProgress = async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ userId: req.user.id });
    if (!userProgress) return res.status(404).json({});

    /* send the stored snapshot, plus the two overlay flags */
    return res.json({
      ...userProgress.progress,
      ds_onboarding_complete: userProgress.ds_onboarding_complete,
      wt_onboarding_complete: userProgress.wt_onboarding_complete
    });
  } catch (err) {
    console.error('❌ getUserProgress:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ────────────────────────────────────────────────────────────
   4. Simple helper – flip Dashboard onboarding flag
   ──────────────────────────────────────────────────────────── */
const setOnboardingComplete = async (req, res) => {
  try {
    await UserProgress.findOneAndUpdate(
      { userId: req.user.id },
      { ds_onboarding_complete: true },
      { upsert: true }
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Error in setOnboardingComplete:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────────────────── */
module.exports = {
  updateHeatmapAndWorkoutsDone,
  saveMyProgress,
  getUserProgress,
  setOnboardingComplete
};
