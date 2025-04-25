export const questions = [
  // Phase 1: Personal Info & Essentials
  {
    question: "What is your name?",
    options: ["(Text Box)"],
    type: "text",
    placeholder: "Enter your name here",
    key: "name",
  },
  {
    question: "What is your date of birth?",
    options: ["(DOB Box)"],
    type: "date",
    key: "dob",
    validateAge: true,
  },
  {
    question: "What is your gender?",
    options: ["Male", "Female", "Other"],
    type: "radio",
    key: "gender",
  },
  {
    question: "Are you currently pregnant or recently post-natal?",
    options: ["Pregnant", "Post-Natal", "None of the above"],
    type: "radio",
    key: "pregnancyStatus",
    condition: {
      key: "gender",
      value: "female"
    }
  },
  {
    question: "What is your height?",
    options: ["(Text Box, numbers only)"],
    type: "number",
    placeholder: "Enter your height",
    key: "height",
  },
  {
    question: "What is your weight?",
    options: ["(Text Box, numbers only)"],
    type: "number",
    placeholder: "Enter your weight",
    key: "weight",
  },

  // Phase 2: Goals & Motivation
  {
    question: "What is your goal?",
    options: [
      { display: "🔥 Lose Weight", value: "Lose Weight" },
      { display: "💪 Gain Muscle", value: "Gain Muscle" },
      { display: "⚖️ Improve Body Composition (Build Muscle & Lose Fat)", value: "Improve Body Composition (Build Muscle & Lose Fat)" }
    ],
    type: "radio",
    key: "goal",
  },
  {
    question: "What’s driving your goal right now?",
    options: [
      { display: "💍 A wedding or special event", value: "A wedding or special event" },
      { display: "✈️ An upcoming holiday", value: "An upcoming holiday" },
      { display: "💔 A recent breakup or life change", value: "A recent breakup or life change" },
      { display: "🪞 I want to feel confident in my body again", value: "I want to feel confident in my body again" },
      { display: "😩 I'm tired of feeling tired or unmotivated", value: "I'm tired of feeling tired or unmotivated" },
      { display: "🧠 I’m doing this for my mental and emotional health", value: "I’m doing this for my mental and emotional health" },
      { display: "🧭 I’ve let things slip and want to get back on track", value: "I’ve let things slip and want to get back on track" },
      { display: "📈 I want to build discipline and stop starting over", value: "I want to build discipline and stop starting over" },
      { display: "🌱 I just feel ready for a change", value: "I just feel ready for a change" },
    ],
    type: "radio",
    key: "goalDriver"
  },
  {
    question: "What is your goal weight?",
    type: "number",
    placeholder: "Enter your goal weight",
    key: "userGoalWeight"
  },
  {
    question: "By when do you want to achieve this goal?",
    type: "date",
    placeholder: "Select target date",
    key: "userGoalDate",
    validateAge: false,
  },
  {
    question: "How hard are you ready to go?",
    options: [
      { display: "🔥 Slight effort: A steady and manageable pace.", value: "Slight effort: A steady and manageable pace." },
      { display: "🔥🔥 Moderate effort: A balanced and sustainable challenge.", value: "Moderate effort: A balanced and sustainable challenge." },
      { display: "🔥🔥🔥 High effort: Requires full commitment and consistency.", value: "High effort: Requires full commitment and consistency." },
    ],
    type: "radio",
    key: "effortLevel",
  },

  // Phase 3: Fitness Background & Preferences
  {
    question: "Have you followed a structured workout program before?",
    options: ["Yes", "No", "Partially"],
    type: "radio",
    key: "structuredProgram",
  },
  {
    question: "What would you rate your fitness level?",
    options: [
      { display: "💪 Beginner", value: "Beginner" },
      { display: "💪💪 Intermediate", value: "Intermediate" },
      { display: "💪💪💪 Advanced", value: "Advanced" }
    ],
    type: "radio",
    key: "fitnessLevel",
  },
  {
    question: "How active are you?",
    options: [
      "Sedentary (little to no exercise)",
      "Lightly active (light exercise/sports 1–3 days per week)",
      "Moderately active (moderate exercise/sports 3–5 days per week)",
      "Very active (hard exercise/sports 6–7 days per week)",
      "Extra active (very hard exercise, physical job, or training twice a day)",
    ],
    type: "radio",
    key: "activityLevel",
  },
  {
    question: "Where do you plan to work out?",
    options: ["Gym", "Home"],
    type: "radio",
    key: "workoutLocation",
  },
  {
    question: "What equipment is available to you?",
    options: [
      "Dumbbells",
      "Barbells",
      "Bench",
      "Rack",
      "Kettlebells",
      "Cables",
      "Machines",
      "Smith Machine",
      "Pull-Up Bar",
      "Dip Station",
      "None of the above",
    ],
    type: "checkbox",
    key: "equipment",
  },
  {
    question: "Do you have any equipment preferences?",
    options: [
      "Dumbbells",
      "Barbells",
      "Kettlebells",
      "Cables",
      "Machines",
      "Smith Machine",
      "Bodyweight",
      "None of the above",
    ],
    type: "checkbox",
    key: "equipmentPreference",
  },
  // {
  //   question: "What kind of training do you enjoy most?",
  //   options: [
  //     { display: "🏋️ Strength Training", value: "Strength Training" },
  //     { display: "🏃 Cardio", value: "Cardio" },
  //     { display: "⏱️ HIIT", value: "HIIT" },
  //     { display: "🔀 Mix", value: "Mix" },
  //   ],
  //   type: "radio",
  //   key: "trainingPreference",
  // },
  {
    question: "Are there any muscle groups you want to focus on?",
    options: ["Chest", "Back", "Shoulders", "Arms", "Legs", "None of the above"],
    type: "checkbox",
    key: "muscleFocus",
  },
  {
    question: "How many days can you work out per week?",
    options: ["1", "2", "3", "4", "5", "6", "7"],
    type: "radio",
    key: "workoutDays",
  },
  {
    question: "How long can your sessions be?",
    options: ["0-30 Minutes", "30-45 Minutes", "45-60 Minutes", "60+ Minutes"],
    type: "radio",
    key: "sessionDuration",
  },

  // Phase 4: Health Considerations
  {
    question: "Any injuries or issues we should know about?",
    options: [
      "Back",
      "Knee",
      "Shoulder",
      "Elbow",
      "Wrist",
      "Ankle",
      "Hip",
      "None of the above",
    ],
    type: "checkbox",
    key: "injuries",
  },

  // Phase 5: Nutrition
  {
    question: "Do you have any dietary restrictions?",
    options: ["Vegetarian", "Vegan", "Pescatarian", "No Restrictions"],
    type: "radio",
    key: "dietaryRestrictions"
  },
  {
    question: "Do you have any food allergies?",
    options: ["Dairy", "Nuts", "Gluten", "Shellfish", "Soy", "None of the above"],
    type: "checkbox",
    key: "foodAllergies"
  },
  {
    question: "How many meals per day do you prefer?",
    options: [
      { display: "🍽️ 2 meals", value: "2 meals" },
      { display: "🍽️🍽️ 3 meals", value: "3 meals" },
      { display: "🍽️🍽️🍽️ 4 meals", value: "4 meals" },
    ],
    type: "radio",
    key: "mealFrequency",
  }
];

export  const loadingMessagesAll = {
  muscleGain: [
    "Locating surplus-worthy snacks…",
    "Increasing your training volume… and your sleeves.",
    "Configuring progressive overload… gains protocol initiated.",
    "Dialing in your protein power-ups…",
    "Expanding your upper chest and your confidence…",
    "Scouting heavy compound lifts for maximum growth...",
    "Warming up your nervous system for heavy sets...",
    "Stocking the pantry for lean bulk season...",
    "Aligning hypertrophy with structured progression...",
    "Reinforcing your anabolic environment..."
  ],
  bodyRecomposition: [
    "Balancing strength and symmetry…",
    "Fine-tuning your macros for maximum impact.",
    "Aligning workouts with recovery… recomposition incoming.",
    "Sculpting the new you, one smart decision at a time.",
    "Switching to hybrid mode: train hard, recover smarter.",
    "Syncing strength gains with body fat precision…",
    "Targeting stubborn zones without burning out…",
    "Merging smart volume with strategic deficit…",
    "Loading split routines that do both…",
    "Your recomp blueprint is coming together..."
  ],
  weightLoss: [
    "Initiating fat loss mode — steady, sustainable, smart.",
    "Strategizing calorie precision strikes…",
    "Prioritizing lean muscle retention…",
    "Mapping your metabolic runway… takeoff soon.",
    "Setting realistic goals, not shortcuts.",
    "Calibrating smart cardio recommendations…",
    "Scanning meals for low-calorie density heroes...",
    "Balancing energy intake for sustainable drops...",
    "Activating fat-loss without the burnout...",
    "Reinforcing a results-first, crash-free approach..."
  ],
  featureBased: [
    "Analyzing your effort level…",
    "Loading adaptive workout logic…",
    "Mapping your weekly training split…",
    "Building your nutrition timeline…",
    "Rendering your lo-fi tutorial vault…",
    "Designing your recap dashboard…",
    "Configuring your Progress Score engine…",
    "Prepping your meal swap system…",
    "Wiring up your consistency streak tracker...",
    "Preloading your Daily Summary feedback module...",
    "Initiating intelligent workout suggestions…",
    "Sharpening your recovery tracking tools...",
    "Crafting your program as we speak…",
    "Finalizing your week-by-week strategy..."
  ],
  personality: [
    "If this loads too fast, you’ll miss our humor.",
    "Lo-fi beats loading… please vibe responsibly.",
    "Checking hydration levels… just kidding (or are we?).",
    "Running system check: confidence > 9000.",
    "Generating a program Tony Stark would probably envy.",
    "Spawning gains in your fitness universe…",
    "Polishing dumbbells for extra shine…",
    "Removing burpees from existence (you're welcome).",
    "Re-routing the motivation signal to your brain…",
    "Translating effort into XP...",
    "Applying glow-up filter to your progress graphs...",
    "Warming up the encouragement engine…",
  ]
};

export  const warmUpRoutines = {
  push: [
    { name: "Arm Circles", reps: "10 reps", rpe: 5 },
    { name: "Scapular Push-Ups", reps: "10 reps", rpe: 5 },
    { name: "Wall Slides", reps: "10 reps", rpe: 5 }
  ],
  pull: [
    { name: "Shoulder Rolls", reps: "10 reps", rpe: 5 },
    { name: "Cat-Cow Stretch", reps: "10 reps", rpe: 5 },
    { name: "Standing Ys & Ts", reps: "10 reps", rpe: 5 }
  ],
  legs: [
    { name: "Bodyweight Squats", reps: "10 reps", rpe: 5 },
    { name: "Leg Swings (Front & Side)", reps: "10 reps", rpe: 5 },
    { name: "Glute Bridges", reps: "10 reps", rpe: 5 }
  ],
  generic: [
    { name: "Jumping Jacks", reps: "10 reps", rpe: 5 },
    { name: "High Knees", reps: "10 reps", rpe: 5 },
    { name: "Hip Circles", reps: "10 reps", rpe: 5 }
  ],
};

export  const coolDownMap = {
  push: [
    { name: "Chest Stretch", duration: "30 seconds", rpe: 5 },
    { name: "Overhead Triceps Stretch", duration: "30 seconds", rpe: 5 }
  ],
  pull: [
    { name: "Seated Forward Fold", duration: "30 seconds", rpe: 5 },
    { name: "Cross-Body Shoulder Stretch", duration: "30 seconds", rpe: 5 }
  ],
  legs: [
    { name: "Standing Quad Stretch", duration: "30 seconds", rpe: 5 },
    { name: "Seated Hamstring Stretch", duration: "30 seconds", rpe: 5 }
  ],
  generic: [
    { name: "Child’s Pose", duration: "30 seconds", rpe: 5 },
    { name: "Standing Side Stretch", duration: "30 seconds", rpe: 5 }
  ]
};

export const staticCoolDownStretches = [
  { name: "Standing Quadriceps Stretch", duration: "30 seconds", rpe: 3 },
  { name: "Seated Hamstring Stretch", duration: "30 seconds", rpe: 3 },
  { name: "Chest Opener Stretch", duration: "30 seconds", rpe: 3 },
  { name: "Upper Back Stretch", duration: "30 seconds", rpe: 3 },
];

export  const HIIT_WORKOUTS = {
    "0-10": [
      {
        name: "HIIT 0-10 #1",
        details: `8 min: 20s on / 10s rest x4 rounds (Burpees, Squat Jumps, Push-Ups, High Knees)`,
      },
      {
        name: "HIIT 0-10 #2",
        details: `8 min: 20s on / 10s rest x8 rounds, alternating (Mountain Climbers, Plank Jacks)`,
      },
      {
        name: "HIIT 0-10 #3",
        details: `10 min: 40s on / 20s rest x2 rounds (Jumping Jacks, Push-Ups, Lunges, Plank, Skater Jumps)`,
      },
      {
        name: "HIIT 0-10 #4",
        details: `4 min Tabata: 20s on / 10s rest x8 (Burpees only)`,
      },
      {
        name: "HIIT 0-10 #5",
        details: `6 min: 30s on / 15s rest x3 rounds (Jump Squats, Push-Up to Shoulder Tap, Lateral Bounds)`,
      },
      {
        name: "HIIT 0-10 #6",
        details: `8 min: 30s on / 15s rest x2 rounds (Mountain Climbers, Plank Jacks, High Knees, Russian Twists)`,
      },
      {
        name: "HIIT 0-10 #7",
        details: `4 min Tabata: 20s on / 10s rest x8 (Jump Squats only)`,
      },
    ],
    "10-20": [
      {
        name: "HIIT 10-20 #1",
        details: `15 min: 45s on / 15s rest x3 rounds (Jumping Jacks, Push-Ups, Squat Jumps, Mtn Climbers, Plank Taps)`,
      },
      {
        name: "HIIT 10-20 #2",
        details: `16 min: 20s on / 10s rest in Tabatas: (Burpees&JumpSquats, HighKnees&PlankJacks, PushUps&BicycleCrunches, SkaterJumps&RussianTwists)`,
      },
      {
        name: "HIIT 10-20 #3",
        details: `18 min Ladder: 1-2-3 etc. reps for 9 min (Burpees, Air Squats, Push-Ups), rest 1 min, repeat.`,
      },
      {
        name: "HIIT 10-20 #4",
        details: `12 min: 40s on / 20s rest x3 rounds (Lunge->Knee Drive R, Lunge->Knee Drive L, PushUp->PlankJack, Lateral Bounds, Squat Pulse->Jump)`,
      },
      {
        name: "HIIT 10-20 #5",
        details: `20 min: 30s on / 15s rest x4 rounds (Burpees, Jump Squats, Mtn Climbers, High Knees, Plank Taps)`,
      },
      {
        name: "HIIT 10-20 #6",
        details: `10 min: 30s on / 10s rest x4 rounds (Plank Jacks, Russian Twists, Mtn Climbers, Bicycle Crunches)`,
      },
      {
        name: "HIIT 10-20 #7",
        details: `12 min: 40s on / 20s rest x3 (Jump Squats, Step-Back Lunges, Glute Bridges, Wall Sit)`,
      },
    ],
    "20-30": [
      {
        name: "HIIT 20-30 #1",
        details: `20 min: 40s on / 20s rest x4 rounds (Jumping Jacks, Push-Ups, Air Squats, Mtn Climbers, Plank Taps)`,
      },
      {
        name: "HIIT 20-30 #2",
        details: `25 min: 50s on / 10s rest x3 rounds (Burpees, Lunges, PushUp->PlankJack, SkaterJumps, RussianTwists, JumpSquats)`,
      },
      {
        name: "HIIT 20-30 #3",
        details: `24 min Tabatas: 20s on / 10s rest x8 each for (HighKnees&PlankJacks, JumpSquats&PushUps, Burpees&BicycleCrunches)`,
      },
      {
        name: "HIIT 20-30 #4",
        details: `30 min: 30s on / 15s rest x5 rounds (High Knees, Burpees, Mtn Climbers, Lunges, PushUp->SidePlank)`,
      },
      {
        name: "HIIT 20-30 #5",
        details: `22 min: 45s on / 15s rest x4 rounds (JumpSquats, StepUp->KneeDrive R, StepUp->KneeDrive L, Burpees, Lateral Bounds)`,
      },
      {
        name: "HIIT 20-30 #6",
        details: `20 min: 40s on / 20s rest x4 rounds (Mtn Climbers, BicycleCrunches, PlankJacks, HighKnees, RussianTwists)`,
      },
      {
        name: "HIIT 20-30 #7",
        details: `30 min: 1m on / 30s rest x3 rounds (Burpees+PushUp, JumpingLunges, PushUp->Row, SkaterJumps, WallSit, PlankWalkOut)`,
      },
      {
        name: "HIIT 20-30 #8",
        details: `20 min: 30s on / 10s rest x5 rounds (HighKnees, Burpees, JumpSquats, SkaterJumps, Mtn Climbers)`,
      },
    ],
  };
  
  // ADDED: Pre-made FBB (Full Body Bodyweight) workouts by duration
  export  const FBB_WORKOUTS = {
    "0-10": [
      {
        name: "FBB 0-10 #1",
        details: `8 min: 30s each x2 (Bodyweight Squats, Incline Push-Ups, Glute Bridges, Plank Hold)`,
      },
      {
        name: "FBB 0-10 #2",
        details: `10 min: 45s on / 15s rest x2 (Plank Shoulder Taps, Leg Raises, Bird Dogs, Bicycle Crunches)`,
      },
      {
        name: "FBB 0-10 #3",
        details: `10 min: 40s on / 20s rest x2 (Push-Ups, Reverse Lunges, Side Plank R, Side Plank L)`,
      },
      {
        name: "FBB 0-10 #4",
        details: `8 min: 30s each x2 (Cat-Cow, World's Greatest Stretch, Child's Pose->Cobra, Deep BW Squat Hold)`,
      },
      {
        name: "FBB 0-10 #5",
        details: `8 min: 45s on / 15s rest x2 (Push-Ups, Single-Leg Glute Bridge R, Single-Leg Glute Bridge L, Plank->Forearm)`,
      },
      {
        name: "FBB 0-10 #6",
        details: `10 min: 30s on / 15s rest x3 (High Knees, Bodyweight Squats, Mountain Climbers, Burpees)`,
      },
      {
        name: "FBB 0-10 #7",
        details: `9 min: 45s each x2 (World's Greatest Stretch R/L, Cat-Cow, Seated Forward Fold, Child's Pose->ThreadNeedle)`,
        isSeventh: true, // special note if day7
      },
    ],
    "10-20": [
      {
        name: "FBB 10-20 #1",
        details: `15 min: 40s on / 20s off x3 (PushUps, BodyweightSquats, PlankTaps, ReverseLunges, GluteBridges)`,
      },
      {
        name: "FBB 10-20 #2",
        details: `18 min: 30s on / 10s off x4 (HighKnees, MtnClimbers, JumpSquats, Burpees, PlankJacks)`,
      },
      {
        name: "FBB 10-20 #3",
        details: `20 min: 45s on / 15s off x2 (PlankHold, SidePlank R, SidePlank L, LegRaises, BirdDogs)`,
      },
      {
        name: "FBB 10-20 #4",
        details: `12 min: 1m each x2 (Cat-Cow, World's Greatest Stretch R/L, SeatedForwardFold, ChildPose->CobraFlow)`,
      },
      {
        name: "FBB 10-20 #5",
        details: `20 min: 40s on / 20s off x3 (JumpingJacks, MtnClimbers, Burpees, StepBackLunges, PlankTaps)`,
      },
      {
        name: "FBB 10-20 #6",
        details: `15 min: 45s on / 15s off x3 (BodyweightSquats, Lunges R, Lunges L, GluteBridges, WallSit)`,
      },
      {
        name: "FBB 10-20 #7",
        details: `20 min: 1m on / 15s off x3 (Push-Ups, StepThroughLunge R/L, Plank->DownDog, BirdDogs, AirSquats)`,
      },
    ],
    "20-30": [
      {
        name: "FBB 20-30 #1",
        details: `30 min: 40s on / 20s off x4 (PushUps, BW Squats, ReverseLunges, PlankTaps, GluteBridges)`,
      },
      {
        name: "FBB 20-30 #2",
        details: `25 min: 30s on / 10s off x5 (HighKnees, MtnClimbers, Burpees, JumpSquats, PlankJacks)`,
      },
      {
        name: "FBB 20-30 #3",
        details: `30 min: 45s on / 15s off x3 (PlankHold, LegRaises, SidePlank R, SidePlank L, BirdDogs)`,
      },
      {
        name: "FBB 20-30 #4",
        details: `20 min: 1m each x2 (Cat-Cow, World's Greatest Stretch R/L, SeatedForwardFold, ChildPose->Cobra, ThreadNeedle)`,
      },
      {
        name: "FBB 20-30 #5",
        details: `25 min: 40s on / 20s off x4 (JumpingJacks, StepBackLunges, SquatPulses, GluteBridges, WallSit)`,
      },
      {
        name: "FBB 20-30 #6",
        details: `30 min: 1m on / 15s off x3 (PushUps, StepThroughLunge R/L, Plank->DownDog, BirdDogs, BW Squats)`,
      },
      {
        name: "FBB 20-30 #7",
        details: `28 min: 45s on / 15s off x4 (Burpees, BW Squats, PushUps, MtnClimbers, PlankTaps)`,
      },
    ],
  };

  export  const CALIS_DICT = {
      pullupOnly: {
        "Foundational Phase": {
          push: [
            { name: "Incline Push-Ups", sets: 3, reps: "10-12", notes: "3s up/down" },
            { name: "Pike Push-Ups", sets: 3, reps: "8-10", notes: "Emphasis on shoulders" },
            { name: "Hollow Body Hold", sets: 3, reps: "15-20s" },
          ],
          pull: [
            { name: "Pull-Ups", sets: 3, reps: "6-8", notes: "Controlled tempo: 3s up/down" },
            { name: "Chin-Ups", sets: 3, reps: "8-10" },
            { name: "Hanging Leg Raises", sets: 3, reps: "12-15" },
          ],
          legs: [
            { name: "Single-Leg Box Squats", sets: 3, reps: "6-8/leg", notes: "Use support for balance" },
            { name: "Hanging Knee Tucks", sets: 3, reps: "12-15" },
            { name: "Calf Raises on a Step", sets: 3, reps: "15-20" },
          ],
          upper: [
            { name: "Pull-Ups", sets: 3, reps: "6-8" },
            { name: "Chin-Ups", sets: 3, reps: "8-10" },
            { name: "Incline Push-Ups", sets: 3, reps: "10-12" },
            { name: "Hollow Body Hold", sets: 3, reps: "15-20s" },
          ],
          fullbody: [
            { name: "Pull-Ups", sets: 3, reps: "6-8" },
            { name: "Hanging Knee Raises", sets: 3, reps: "12-15" },
            { name: "Single-Leg Box Squats", sets: 3, reps: "6-8/leg" },
            { name: "Calf Raises", sets: 3, reps: "15-20" },
          ],
        },
        "Hypertrophy Phase": {
          push: [
            { name: "Incline Push-Ups", sets: 4, reps: "12-15" },
            { name: "Pike Push-Ups", sets: 4, reps: "10-12" },
            { name: "Hollow Body Hold", sets: 4, reps: "20-30s" },
          ],
          pull: [
            { name: "Pull-Ups", sets: 4, reps: "8-10", notes: "Slight pause at the top" },
            { name: "Chin-Ups", sets: 4, reps: "10-12" },
            { name: "Hanging Leg Raises", sets: 4, reps: "12-15" },
          ],
          legs: [
            { name: "Single-Leg Box Squats", sets: 4, reps: "8-10/leg" },
            { name: "Hanging Knee Tucks", sets: 4, reps: "12-15" },
            { name: "Calf Raises on a Step", sets: 4, reps: "20-25" },
          ],
          upper: [
            { name: "Pull-Ups", sets: 4, reps: "8-10" },
            { name: "Chin-Ups", sets: 4, reps: "10-12" },
            { name: "Incline Push-Ups", sets: 4, reps: "12-15" },
            { name: "Hollow Body Hold", sets: 4, reps: "20-30s" },
          ],
          fullbody: [
            { name: "Pull-Ups", sets: 4, reps: "8-10" },
            { name: "Hanging Knee Raises", sets: 4, reps: "12-15" },
            { name: "Single-Leg Box Squats", sets: 4, reps: "8-10/leg" },
            { name: "Calf Raises", sets: 4, reps: "20-25" },
          ],
        },
        "Strength Phase": {
          push: [
            { name: "Incline Push-Ups (Feet Elevated)", sets: 4, reps: "12-15" },
            { name: "Pike Push-Ups (Advanced)", sets: 4, reps: "10-12" },
            { name: "Hollow Body Rock", sets: 4, reps: "20-30s" },
          ],
          pull: [
            { name: "Archer Pull-Ups", sets: 4, reps: "6-8", notes: "Advanced progression" },
            { name: "Chin-Ups (Weighted or Tempo)", sets: 4, reps: "8-10" },
            { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
          ],
          legs: [
            { name: "Single-Leg Box Squats (Depth Increased)", sets: 4, reps: "8-10/leg" },
            { name: "Hanging Knee Tucks (Add Tempo)", sets: 4, reps: "15-20" },
            { name: "Calf Raises on a Step (Paused)", sets: 4, reps: "20-25" },
          ],
          upper: [
            { name: "Archer Pull-Ups", sets: 4, reps: "6-8" },
            { name: "Chin-Ups", sets: 4, reps: "8-10" },
            { name: "Incline Push-Ups (Feet Elevated)", sets: 4, reps: "12-15" },
            { name: "Hollow Body Rock", sets: 4, reps: "20-30s" },
          ],
          fullbody: [
            { name: "Pull-Ups (Tempo)", sets: 4, reps: "8-10" },
            { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
            { name: "Single-Leg Box Squats", sets: 4, reps: "8-10/leg" },
            { name: "Calf Raises", sets: 4, reps: "20-25" },
          ],
        },
      },
      dipOnly: {
        "Foundational Phase": {
          push: [
            { name: "Dips", sets: 3, reps: "8-10" },
            { name: "Incline Dips", sets: 3, reps: "10-12" },
            { name: "Knee Raises (on Dip Station)", sets: 3, reps: "12-15" },
            { name: "L-Sit", sets: 3, reps: "10-15s" },
          ],
          pull: [
            { name: "Modified Rows (on Dip Bars)", sets: 3, reps: "10-12" },
            { name: "Bodyweight Bicep Curls", sets: 3, reps: "12-15" },
            { name: "Dip Bar Shrugs", sets: 3, reps: "12-15" },
          ],
          legs: [
            { name: "Step-Ups (on Dip Bars)", sets: 3, reps: "8-10/leg" },
            { name: "Sissy Squats", sets: 3, reps: "10-12" },
            { name: "Hip Thrusts", sets: 3, reps: "12-15" },
          ],
          upper: [
            { name: "Dips", sets: 3, reps: "8-10" },
            { name: "Incline Dips", sets: 3, reps: "10-12" },
            { name: "Modified Rows", sets: 3, reps: "10-12" },
            { name: "Dip Bar Shrugs", sets: 3, reps: "12-15" },
            { name: "L-Sit", sets: 3, reps: "10-15s" },
          ],
          fullbody: [
            { name: "Dips", sets: 3, reps: "8-10" },
            { name: "Step-Ups", sets: 3, reps: "8-10/leg" },
            { name: "Modified Rows", sets: 3, reps: "10-12" },
            { name: "Sissy Squats", sets: 3, reps: "10-12" },
            { name: "L-Sit", sets: 3, reps: "10-15s" },
          ],
        },
        "Hypertrophy Phase": {
          push: [
            { name: "Dips", sets: 4, reps: "10-12" },
            { name: "Incline Dips", sets: 4, reps: "12-15" },
            { name: "Knee Raises (on Dip Station)", sets: 4, reps: "15-20" },
            { name: "L-Sit", sets: 4, reps: "15-20s" },
          ],
          pull: [
            { name: "Modified Rows (on Dip Bars)", sets: 4, reps: "10-12" },
            { name: "Bodyweight Bicep Curls", sets: 4, reps: "15-18" },
            { name: "Dip Bar Shrugs", sets: 4, reps: "15-20" },
          ],
          legs: [
            { name: "Step-Ups (on Dip Bars)", sets: 4, reps: "10-12/leg" },
            { name: "Sissy Squats", sets: 4, reps: "12-15" },
            { name: "Hip Thrusts", sets: 4, reps: "15-18" },
          ],
          upper: [
            { name: "Dips", sets: 4, reps: "10-12" },
            { name: "Incline Dips", sets: 4, reps: "12-15" },
            { name: "Modified Rows", sets: 4, reps: "10-12" },
            { name: "Dip Bar Shrugs", sets: 4, reps: "15-20" },
            { name: "L-Sit on Dip Bars", sets: 4, reps: "15-20s" },
          ],
          fullbody: [
            { name: "Dips", sets: 4, reps: "10-12" },
            { name: "Step-Ups", sets: 4, reps: "10-12/leg" },
            { name: "Modified Rows", sets: 4, reps: "10-12" },
            { name: "Sissy Squats", sets: 4, reps: "12-15" },
            { name: "L-Sit", sets: 4, reps: "15-20s" },
          ],
        },
        "Strength Phase": {
          push: [
            { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
            { name: "Incline Dips (Pause at Bottom)", sets: 4, reps: "10-12" },
            { name: "Knee Raises (on Dip Station)", sets: 4, reps: "15-20" },
            { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
          ],
          pull: [
            { name: "Modified Rows (Feet Elevated)", sets: 4, reps: "8-10" },
            { name: "Bodyweight Bicep Curls (Slow Tempo)", sets: 4, reps: "12-15" },
            { name: "Dip Bar Shrugs (Add Tempo)", sets: 4, reps: "15-20" },
          ],
          legs: [
            { name: "Step-Ups (Weighted or Higher Platform)", sets: 4, reps: "10-12/leg" },
            { name: "Sissy Squats (Advanced Range)", sets: 4, reps: "12-15" },
            { name: "Hip Thrusts (Hold at Top)", sets: 4, reps: "12-15" },
          ],
          upper: [
            { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
            { name: "Incline Dips (Pause at Bottom)", sets: 4, reps: "10-12" },
            { name: "Modified Rows (Feet Elevated)", sets: 4, reps: "8-10" },
            { name: "Dip Bar Shrugs", sets: 4, reps: "15-20" },
            { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
          ],
          fullbody: [
            { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
            { name: "Step-Ups (Weighted)", sets: 4, reps: "10-12/leg" },
            { name: "Modified Rows", sets: 4, reps: "8-10" },
            { name: "Sissy Squats", sets: 4, reps: "12-15" },
            { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
          ],
        },
      },
      both: {
        "Foundational Phase": {
          push: [
            { name: "Dips", sets: 3, reps: "8-10" },
            { name: "Pike Push-Ups", sets: 3, reps: "8-10" },
            { name: "Incline Push-Ups (on Dip Bars)", sets: 3, reps: "10-12" },
            { name: "L-Sit", sets: 3, reps: "10-15s" },
          ],
          pull: [
            { name: "Pull-Ups (Wide Grip)", sets: 3, reps: "6-8" },
            { name: "Chin-Ups", sets: 3, reps: "8-10" },
            { name: "Archer Rows (on Dip Bars)", sets: 3, reps: "10-12" },
            { name: "Hanging Leg Raises", sets: 3, reps: "12-15" },
          ],
          legs: [
            { name: "Assisted Pistol Squats (using bars for balance)", sets: 3, reps: "6-8/leg" },
            { name: "Hanging Knee Tucks", sets: 3, reps: "12-15" },
            { name: "Step-Ups (on Dip Bars)", sets: 3, reps: "8-10/leg" },
          ],
          upper: [
            { name: "Pull-Ups", sets: 3, reps: "6-8" },
            { name: "Dips", sets: 3, reps: "8-10" },
            { name: "Chin-Ups", sets: 3, reps: "8-10" },
            { name: "Incline Push-Ups (on Dip Bars)", sets: 3, reps: "10-12" },
            { name: "Hanging Leg Raises", sets: 3, reps: "12-15" },
          ],
          fullbody: [
            { name: "Pull-Ups", sets: 3, reps: "6-8" },
            { name: "Dips", sets: 3, reps: "8-10" },
            { name: "Hanging Knee Tucks", sets: 3, reps: "12-15" },
            { name: "Step-Ups (on Dip Bars)", sets: 3, reps: "8-10/leg" },
          ],
        },
        "Hypertrophy Phase": {
          push: [
            { name: "Dips", sets: 4, reps: "10-12" },
            { name: "Pike Push-Ups", sets: 4, reps: "10-12" },
            { name: "Incline Push-Ups (on Dip Bars)", sets: 4, reps: "12-15" },
            { name: "L-Sit", sets: 4, reps: "15-20s" },
          ],
          pull: [
            { name: "Pull-Ups (Wide Grip)", sets: 4, reps: "8-10" },
            { name: "Chin-Ups", sets: 4, reps: "10-12" },
            { name: "Archer Rows (on Dip Bars)", sets: 4, reps: "10-12" },
            { name: "Hanging Leg Raises", sets: 4, reps: "15-20" },
          ],
          legs: [
            { name: "Assisted Pistol Squats (using bars for balance)", sets: 4, reps: "8-10/leg" },
            { name: "Hanging Knee Tucks", sets: 4, reps: "12-15" },
            { name: "Step-Ups (on Dip Bars)", sets: 4, reps: "10-12/leg" },
          ],
          upper: [
            { name: "Pull-Ups", sets: 4, reps: "8-10" },
            { name: "Dips", sets: 4, reps: "10-12" },
            { name: "Chin-Ups", sets: 4, reps: "10-12" },
            { name: "Incline Push-Ups (on Dip Bars)", sets: 4, reps: "12-15" },
            { name: "Hanging Leg Raises", sets: 4, reps: "15-20" },
          ],
          fullbody: [
            { name: "Pull-Ups", sets: 4, reps: "8-10" },
            { name: "Dips", sets: 4, reps: "10-12" },
            { name: "Hanging Knee Tucks", sets: 4, reps: "12-15" },
            { name: "Step-Ups (on Dip Bars)", sets: 4, reps: "10-12/leg" },
          ],
        },
        "Strength Phase": {
          push: [
            { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
            { name: "Pike Push-Ups (Feet Elevated)", sets: 4, reps: "10-12" },
            { name: "Incline Push-Ups (Pause at Bottom)", sets: 4, reps: "12-15" },
            { name: "L-Sit (Extended Hold)", sets: 4, reps: "15-25s" },
          ],
          pull: [
            { name: "Pull-Ups (Wide Grip, Weighted or Tempo)", sets: 4, reps: "8-10" },
            { name: "Chin-Ups (Weighted)", sets: 4, reps: "10-12" },
            { name: "Archer Rows (on Dip Bars)", sets: 4, reps: "10-12" },
            { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
          ],
          legs: [
            { name: "Assisted Pistol Squats (Add Load)", sets: 4, reps: "8-10/leg" },
            { name: "Hanging Knee Tucks (Slow Tempo)", sets: 4, reps: "12-15" },
            { name: "Step-Ups (Weighted)", sets: 4, reps: "10-12/leg" },
          ],
          upper: [
            { name: "Pull-Ups (Weighted)", sets: 4, reps: "8-10" },
            { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
            { name: "Chin-Ups (Tempo)", sets: 4, reps: "10-12" },
            { name: "Incline Push-Ups (Feet Elevated)", sets: 4, reps: "12-15" },
            { name: "Hanging Windshield Wipers", sets: 4, reps: "8-12" },
          ],
          fullbody: [
            { name: "Pull-Ups (Weighted)", sets: 4, reps: "8-10" },
            { name: "Dips (Weighted)", sets: 4, reps: "8-10" },
            { name: "Hanging Knee Tucks (Tempo)", sets: 4, reps: "12-15" },
            { name: "Step-Ups (Weighted)", sets: 4, reps: "10-12/leg" },
          ],
        },
      },
    };