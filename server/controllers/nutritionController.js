// server/controllers/nutritionController.js
const MealLog            = require('../models/MealLog');
const NutritionProgress  = require('../models/NutritionProgress');

exports.logMeal = async (req,res) => {
  try {
    const userId = req.user.id;
    const meal   = new MealLog({ userId, ...req.body });
    await meal.save();
    res.status(200).json({ message:'Meal logged.' });
  } catch (err) {
    console.error('❌ logMeal:', err.message);
    res.status(500).json({ message:'Server error logging meal' });
  }
};

exports.saveUserProgress = async (req,res) => {
  try {
    const userId   = req.user.id;
    const progress = req.body;          // ← full snapshot object
    const doc = await NutritionProgress.findOneAndUpdate(
      { userId },
      { progress, updatedAt: Date.now() },
      { new:true, upsert:true }
    );
    res.status(200).json({ message:'Nutrition progress saved.' });
  } catch (err) {
    console.error('❌ saveUserProgress:', err.message);
    res.status(500).json({ message:'Server error saving progress' });
  }
};

exports.getUserProgress = async (req,res) => {
  try {
    const doc = await NutritionProgress.findOne({ userId:req.user.id });
    if (!doc) return res.status(404).end();
    res.json(doc.progress);
  } catch (err) {
    console.error('❌ getUserProgress:', err.message);
    res.status(500).end();
  }
};
