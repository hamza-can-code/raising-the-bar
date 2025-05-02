const mongoose = require('mongoose');

const WorkoutLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  exercises: [
    {
      name: { type: String, required: true },
      sets: [
        {
          reps: { type: Number, required: true },
          weight: { type: Number, required: true }
        }
      ]
    }
  ]
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);
