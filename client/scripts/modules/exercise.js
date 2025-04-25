/*******************************************************
 * 2) EXERCISE DATABASE + WARM-UPS & COOL-DOWNS
 *******************************************************/

export const EXERCISE_DATABASE = [
    // *** Dumbbells
    {
      name: "Incline Bench Press (Dumbbell)",
      muscleGroup: "chest",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        "Incline Bench Press (Barbell)",
        "Smith Machine Bench Press (Incline)",
        "Incline Chest Press Machine",
        "Cable Chest Press",
        "Flat Bench Press (Dumbbell)"
      ]
    },
    {
      name: "Flat Bench Press (Dumbbell)",
      muscleGroup: "chest",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        "Flat Bench Press (Barbell)",
        "Smith Machine Bench Press (Flat)",
        "Chest Press Machine",
        "Cable Chest Press",
        "Dumbbell Floor Press"
      ]
    },
    {
      name: "Dumbbell Shrugs",
      muscleGroup: "traps",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Barbell Shrugs",
        "Smith Machine Shrugs",
        "Cable Shrugs"
      ]
    },
    {
      name: "Single-Arm Dumbbell Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Dumbbell Rear Delt Fly",
      alternativeExercises: [
        "Bent-Over Dumbbell Rows",
        "Barbell Rows",
        "Pendlay Rows",
        "Seated Cable Rows",
        "Single Arm Cable Row"
      ]
    },
    {
      name: "Dumbbell Pullover",
      muscleGroup: "back",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "arch",
      isHomeOnly: true,
      pairedWith: "Dumbbell Rear Delt Fly",
      alternativeExercises: ["Cable Lat Pullover"]
    },
    {
      name: "Single-Arm Dumbbell High Pull",
      muscleGroup: "back",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "vertical",
      isHomeOnly: true,
      pairedWith: "Dumbbell Shrugs",
      alternativeExercises: ["Kettlebell High Pull", "Cable Upright Row"]
    },
    {
      name: "Dumbbell Good Mornings",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: ["Barbell Good Mornings", "Smith Machine Romanian Deadlift"]
    },
    {
      name: "Hammer Curls",
      muscleGroup: "biceps",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Bicep Curls (Dumbbell)",
        "Cable Bicep Curl",
        "Barbell Bicep Curl",
        "Preacher Curl Machine"
      ]
    },
    {
      name: "Incline Curls (Dumbbell)",
      muscleGroup: "biceps",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Bicep Curls (Dumbbell)",
        "Hammer Curls",
        "Cable Bicep Curl"
      ]
    },
    {
      name: "Dumbbell Shoulder Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Lateral Raises",
      alternativeExercises: [
        "Arnold Press (Dumbbell)",
        "Standing Dumbbell Overhead Press",
        "Barbell Overhead Press",
        "Cable Overhead Shoulder Press",
        "Machine Shoulder Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Arnold Press (Dumbbell)",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Front Raises",
      alternativeExercises: [
        "Dumbbell Shoulder Press",
        "Standing Dumbbell Overhead Press",
        "Barbell Overhead Press",
        "Cable Overhead Shoulder Press",
        "Machine Shoulder Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Dumbbell Lunges",
      muscleGroup: "quads",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Bulgarian Split Squats (Dumbbell)",
        "Walking Lunges (Dumbbell)",
        "Dumbbell Step-Ups",
        "Goblet Squats (Dumbbell)",
        "Barbell Walking Lunge",
        "Smith Machine Bulgarian Split Squat"
      ]
    },
    {
      name: "Bulgarian Split Squats (Dumbbell)",
      muscleGroup: "quads",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Lunges",
        "Dumbbell Step-Ups",
        "Smith Machine Bulgarian Split Squat"
      ]
    },
    {
      name: "Goblet Squats (Dumbbell)",
      muscleGroup: "quads",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Barbell Squats",
        "Front Squats (Barbell)",
        "Dumbbell Lunges",
        "Barbell Walking Lunge"
      ]
    },
    {
      name: "Walking Lunges (Dumbbell)",
      muscleGroup: "quads",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Lunges",
        "Bulgarian Split Squats (Dumbbell)",
        "Barbell Walking Lunge",
        "Smith Machine Bulgarian Split Squat"
      ]
    },
    {
      name: "Dumbbell Hamstring Curls",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      isHomeOnly: true,
      alternativeExercises: [
        "Hamstring Curls (Cable)",
        "Lying Leg Curls",
        "Seated Leg Curls"
      ]
    },
    {
      name: "Single-Leg Romanian Deadlifts",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      alternativeExercises: [
        "Dumbbell Romanian Deadlift",
        "Romanian Deadlifts (Barbell)",
        "Smith Machine Romanian Deadlift"
      ]
    },
    {
      name: "Dumbbell Hamstring Kickbacks",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      isHomeOnly: true,
      alternativeExercises: [
        "Cable Kickbacks"
      ]
    },
    {
      name: "Dumbbell Calf Raises",
      muscleGroup: "calves",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Barbell Calf Raise"
      ]
    },
    {
      name: "Bicep Curls (Dumbbell)",
      muscleGroup: "biceps",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Hammer Curls",
        "Incline Curls (Dumbbell)",
        "Cable Bicep Curl",
        "Barbell Bicep Curl",
        "Preacher Curl Machine"
      ]
    },
    {
      name: "Farmers Walk",
      muscleGroup: "fullbody",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "fullbody",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Plank Hold",
      alternativeExercises: [
        "Plank Hold"
      ]
    },
    {
      name: "Dumbbell Chest Fly",
      muscleGroup: "chest",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Cable Chest Fly",
        "Incline Cable Fly (Low-to-High)",
        "Decline Cable Fly (High-to-Low)"
      ]
    },
    {
      name: "Dumbbell Overhead Triceps Extension",
      muscleGroup: "triceps",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Cable Overhead Triceps Extension",
        "Kettlebell Tricep Extension"
      ]
    },
    {
      name: "Dumbbell Step-Ups",
      muscleGroup: "quads",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Lunges",
        "Bulgarian Split Squats (Dumbbell)",
        "Smith Machine Bulgarian Split Squat"
      ]
    },
    {
      name: "Dumbbell Lateral Raises",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Cable Lateral Raises",
        "Reverse Pec Deck Machine"
      ]
    },
    {
      name: "Dumbbell Wrist Curls",
      muscleGroup: "forearms",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Barbell Wrist Curls"
      ]
    },
    {
      name: "Dumbbell Wrist Extensions",
      muscleGroup: "forearms",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Barbell Wrist Extensions"
      ]
    },
    {
      name: "Dumbbell Floor Press",
      muscleGroup: "chest",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      pairedWith: "Dumbbell Chest Fly",
      alternativeExercises: [
        "Flat Bench Press (Dumbbell)",
        "Dumbbell Chest Fly",
        "Flat Bench Press (Barbell)"
      ]
    },
    {
      name: "Standing Dumbbell Overhead Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      pairedWith: "Dumbbell Lateral Raises",
      alternativeExercises: [
        "Dumbbell Shoulder Press",
        "Arnold Press (Dumbbell)",
        "Barbell Overhead Press",
        "Cable Overhead Shoulder Press",
        "Machine Shoulder Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Dumbbell Push-Up",
      muscleGroup: "chest",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      alternativeExercises: [
        "Push-Ups",
        "Cable Chest Press"
      ]
    },
    {
      name: "Dumbbell Front Raise",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      movementPlane: "horizontal",
      alternativeExercises: [
        "Cable Front Raise",
        "Barbell Front Raise"
      ]
    },
    {
      name: "Bent-Over Dumbbell Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Dumbbell Rear Delt Fly",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Barbell Rows",
        "Pendlay Rows",
        "Seated Cable Rows",
        "Smith Machine Barbell Rows"
      ]
    },
    {
      name: "Renegade Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      pairedWith: "Push-Up to Plank Hold",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Bent-Over Dumbbell Rows",
        "Push-Up to Plank Hold"
      ]
    },
    {
      name: "Dumbbell Reverse Fly",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Cable Rear Delt Fly",
        "Reverse Pec Deck Machine"
      ]
    },
    {
      name: "Dumbbell Romanian Deadlift",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Romanian Deadlifts (Barbell)",
        "Smith Machine Romanian Deadlift",
        "Kettlebell Romanian Deadlift"
      ]
    },
    {
      name: "Dumbbell Split Squat",
      muscleGroup: "quads",
      equipmentNeeded: ["Dumbbells"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Bulgarian Split Squats",
      alternativeExercises: [
        "Bulgarian Split Squats (Dumbbell)",
        "Dumbbell Step-Ups",
        "Smith Machine Bulgarian Split Squat"
      ]
    },
    {
      name: "Skull Crushers (Dumbbell)",
      muscleGroup: "triceps",
      equipmentNeeded: ["Dumbbells", "Bench"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Skull Crushers (Barbell)",
        "Cable Overhead Triceps Extension",
        "Kettlebell Tricep Extension"
      ]
    },
    
    // *** Barbells
    {
      name: "Incline Bench Press (Barbell)",
      muscleGroup: "chest",
      equipmentNeeded: ["Barbells", "Bench"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        // Mirrors what "Incline Bench Press (Dumbbell)" had, minus itself:
        "Incline Bench Press (Dumbbell)",
        "Smith Machine Bench Press (Incline)",
        "Incline Chest Press Machine",
        "Cable Chest Press"
      ]
    },
    {
      name: "Flat Bench Press (Barbell)",
      muscleGroup: "chest",
      equipmentNeeded: ["Barbells", "Bench"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        "Flat Bench Press (Dumbbell)",
        "Smith Machine Bench Press (Flat)",
        "Chest Press Machine",
        "Cable Chest Press",
        "Dumbbell Floor Press"
      ]
    },
    {
      name: "Barbell Shrugs",
      muscleGroup: "traps",
      equipmentNeeded: ["Barbells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Shrugs",
        "Smith Machine Shrugs",
        "Cable Shrugs"
      ]
    },
    {
      name: "Barbell Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Barbells"],
      splitTag: "pull",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Dumbbell Rear Delt Fly",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Bent-Over Dumbbell Rows",
        "Pendlay Rows",
        "Seated Cable Rows",
        "Single Arm Cable Row",
        "Smith Machine Barbell Rows"
      ]
    },
    {
      name: "Pendlay Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Barbells"],
      splitTag: "pull",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Dumbbell Shrugs",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Bent-Over Dumbbell Rows",
        "Barbell Rows",
        "Seated Cable Rows",
        "Single Arm Cable Row",
        "Smith Machine Barbell Rows"
      ]
    },
    {
      name: "Deadlifts",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Barbells"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Dumbbell Good Mornings",
        "Barbell Good Mornings",
        "Dumbbell Romanian Deadlift",
        "Barbell Romanian Deadlift",
        "Smith Machine Romanian Deadlift",
      ]
    },
    {
      name: "Barbell Good Mornings",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Barbells"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Dumbbell Good Mornings",
        "Smith Machine Romanian Deadlift"
      ]
    },
    {
      name: "Barbell Squats",
      muscleGroup: "quads",
      equipmentNeeded: ["Barbells", "Rack"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Step-Ups",
      alternativeExercises: [
        "Goblet Squats (Dumbbell)",
        "Front Squats (Barbell)",
        "Dumbbell Lunges",
        "Barbell Walking Lunge"
      ]
    },
    {
      name: "Front Squats (Barbell)",
      muscleGroup: "quads",
      equipmentNeeded: ["Barbells", "Rack"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Goblet Squats (Dumbbell)",
        "Barbell Squats",
        "Dumbbell Lunges",
        "Barbell Walking Lunge"
      ]
    },
    {
      name: "Romanian Deadlifts (Barbell)",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Barbells"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Dumbbell Romanian Deadlift",
        "Smith Machine Romanian Deadlift",
        "Kettlebell Romanian Deadlift",
        "Single-Leg Romanian Deadlifts"
      ]
    },
    {
      name: "Close-Grip Bench Press (Barbell)",
      muscleGroup: "triceps",
      equipmentNeeded: ["Barbells", "Bench"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Push-Ups",
      alternativeExercises: [
        "Smith Machine Close-Grip Bench Press",
        "Skull Crushers (Dumbbell)",
        "Cable Overhead Triceps Extension",
        "Kettlebell Tricep Extension"
      ]
    },
    {
      name: "Skull Crushers (Barbell)",
      muscleGroup: "triceps",
      equipmentNeeded: ["Barbells", "Bench"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Skull Crushers (Dumbbell)",
        "Cable Overhead Triceps Extension",
        "Kettlebell Tricep Extension"
      ]
    },
    {
      name: "Barbell Overhead Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Barbells"],
      splitTag: "push",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Lateral Raises",
      alternativeExercises: [
        "Dumbbell Shoulder Press",
        "Arnold Press (Dumbbell)",
        "Standing Dumbbell Overhead Press",
        "Cable Overhead Shoulder Press",
        "Machine Shoulder Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Barbell Front Raise",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Barbell"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Front Raise",
        "Cable Front Raise"
      ]
    },
    {
      name: "Barbell Upright Row",
      muscleGroup: "traps",
      equipmentNeeded: ["Barbell"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      alternativeExercises: [
        "Kettlebell Upright Row"
      ]
    },
    {
      name: "Barbell Bicep Curl",
      muscleGroup: "biceps",
      equipmentNeeded: ["Barbell"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Bicep Curls (Dumbbell)",
        "Hammer Curls",
        "Incline Curls (Dumbbell)",
        "Cable Bicep Curl",
        "Preacher Curl Machine"
      ]
    },
    {
      name: "Barbell Bench Press (Floor Press)",
      muscleGroup: "chest",
      equipmentNeeded: ["Barbell"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        "Dumbbell Floor Press"
      ]
    },
    {
      name: "Barbell Walking Lunge",
      muscleGroup: "quads",
      equipmentNeeded: ["Barbell"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Squats",
      alternativeExercises: [
        "Dumbbell Lunges",
        "Bulgarian Split Squats (Dumbbell)",
        "Walking Lunges (Dumbbell)",
        "Dumbbell Step-Ups",
        "Goblet Squats (Dumbbell)",
        "Smith Machine Bulgarian Split Squat"
      ]
    },
    {
      name: "Barbell Calf Raise",
      muscleGroup: "calves",
      equipmentNeeded: ["Barbell"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Calf Raises"
      ]
    },
    {
      name: "Barbell Hip Thrust",
      muscleGroup: "glutes",
      equipmentNeeded: ["Barbell"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Smith Machine Hip Thrust",
        "Hip Thrust Machine"
      ]
    },
    
    // *** Kettlebells
    {
      name: "Kettlebell Swings",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Glute Bridge",
      alternativeExercises: [
        // hamstrings + compound
        "Dumbbell Romanian Deadlift",
        "Romanian Deadlifts (Barbell)",
        "Smith Machine Romanian Deadlift"
      ]
    },
    {
      name: "Kettlebell Floor Press",
      muscleGroup: "chest",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      pairedWith: "Kettlebell Chest Fly",
      alternativeExercises: [
        // chest + compound
        "Flat Bench Press (Dumbbell)",
        "Flat Bench Press (Barbell)",
        "Cable Chest Press"
      ]
    },
    {
      name: "Kettlebell Overhead Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      pairedWith: "Kettlebell Lateral Raises",
      alternativeExercises: [
        // shoulders + compound
        "Dumbbell Shoulder Press",
        "Barbell Overhead Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Kettlebell Push-Up",
      muscleGroup: "chest",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      isHomeOnly: true,
      alternativeExercises: [
        // chest + compound
        "Flat Bench Press (Dumbbell)",
        "Dumbbell Floor Press",
        "Cable Chest Press"
      ]
    },
    {
      name: "Kettlebell Tricep Extension",
      muscleGroup: "triceps",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      isHomeOnly: true,
      alternativeExercises: [
        // triceps + isolation
        "Dumbbell Overhead Triceps Extension",
        "Cable Overhead Triceps Extension",
        "Skull Crushers (Barbell)"
      ]
    },
    {
      name: "Kettlebell Bent-Over Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      isHomeOnly: true,
      pairedWith: "Kettlebell Rear Delt Fly",
      alternativeExercises: [
        // back + compound + horizontal
        "Bent-Over Dumbbell Rows",
        "Barbell Rows",
        "Seated Cable Rows"
      ]
    },
    {
      name: "Kettlebell High Pull",
      muscleGroup: "back",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "vertical",
      isHomeOnly: true,
      alternativeExercises: [
        // back + compound + vertical
        "Single-Arm Dumbbell High Pull",
        "Lat Pulldown",
        "Plate Loaded Lat Pulldown"
      ]
    },
    {
      name: "Kettlebell Upright Row",
      muscleGroup: "traps",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      alternativeExercises: [
        // traps + compound
        "Barbell Upright Row"
      ]
    },
    {
      name: "Kettlebell Bicep Curl",
      muscleGroup: "biceps",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      isHomeOnly: true,
      alternativeExercises: [
        // biceps + isolation
        "Bicep Curls (Dumbbell)",
        "Hammer Curls",
        "Cable Bicep Curl"
      ]
    },
    {
      name: "Kettlebell Goblet Squat",
      muscleGroup: "quads",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        // quads + compound
        "Goblet Squats (Dumbbell)",
        "Barbell Squats",
        "Smith Machine Squats"
      ]
    },
    {
      name: "Kettlebell Romanian Deadlift",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Dumbbell Romanian Deadlift",
        "Romanian Deadlifts (Barbell)",
        "Smith Machine Romanian Deadlift"
      ]
    },
    {
      name: "Kettlebell Reverse Lunge",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Kettlebells"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Bulgarian Split Squats",
      alternativeExercises: [
        // hamstrings + compound
        "Dumbbell Romanian Deadlift",
        "Romanian Deadlifts (Barbell)",
        "Smith Machine Romanian Deadlift"
      ]
    },
    
    // *** Cables
    {
      name: "Incline Cable Fly (Low-to-High)",
      muscleGroup: "chest",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Chest Fly",
        "Cable Fly (Mid-level, Horizontal Path)",
        "Decline Cable Fly (High-to-Low)"
      ]
    },
    {
      name: "Decline Cable Fly (High-to-Low)",
      muscleGroup: "chest",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Chest Fly",
        "Cable Fly (Mid-level, Horizontal Path)",
        "Incline Cable Fly (Low-to-High)"
      ]
    },
    {
      name: "Cable Fly (Mid-level, Horizontal Path)",
      muscleGroup: "chest",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Chest Fly",
        "Incline Cable Fly (Low-to-High)",
        "Decline Cable Fly (High-to-Low)"
      ]
    },
    {
      name: "Cable Shrugs",
      muscleGroup: "traps",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Shrugs",
        "Barbell Shrugs",
        "Smith Machine Shrugs"
      ]
    },
    {
      name: "Seated Cable Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Dumbbell Rear Delt Fly",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Bent-Over Dumbbell Rows",
        "Barbell Rows",
        "Pendlay Rows",
        "Single Arm Cable Row",
        "Smith Machine Barbell Rows"
      ]
    },
    {
      name: "Single Arm Cable Row",
      muscleGroup: "back",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Dumbbell Shrugs",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Bent-Over Dumbbell Rows",
        "Barbell Rows",
        "Pendlay Rows",
        "Seated Cable Rows",
        "Smith Machine Barbell Rows"
      ]
    },
    {
      name: "Kneeling Single Arm Cable Row",
      muscleGroup: "back",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Plank Row"
      // Not in your original alt-lists
    },
    {
      name: "Cable Lat Pullover",
      muscleGroup: "back",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      movementPlane: "arch",
      alternativeExercises: [
        "Dumbbell Pullover"
      ]
    },
    {
      name: "Cable Pull-Throughs",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Cables"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound"
      // No mention in your alt-lists
    },
    {
      name: "Cable Curls",
      muscleGroup: "biceps",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        // Essentially the same “Cable Bicep Curl,” so keep them symmetrical:
        "Hammer Curls",
        "Bicep Curls (Dumbbell)",
        "Incline Curls (Dumbbell)",
        "Barbell Bicep Curl",
        "Preacher Curl Machine",
        "Cable Bicep Curl" // Another name in your DB
      ]
    },
    {
      name: "Tricep Pushdowns",
      muscleGroup: "triceps",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        // The only direct machine-based variant is "Tricep Pushdown Machine"
        "Tricep Pushdown Machine"
      ]
    },
    {
      name: "Hamstring Curls (Cable)",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Cables"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Hamstring Curls",
        "Lying Leg Curls",
        "Seated Leg Curls"
      ]
    },
    {
      name: "Cable Kickbacks",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Cables"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Hamstring Kickbacks"
      ]
    },
    {
      name: "Cable Woodchoppers",
      muscleGroup: "core",
      equipmentNeeded: ["Cables"],
      splitTag: "fullbody",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound"
      // No direct alt-lists
    },
    {
      name: "Cable Lateral Raises",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Lateral Raises",
        "Reverse Pec Deck Machine"
      ]
    },
    {
      name: "Cable Chest Press",
      muscleGroup: "chest",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Push-Ups",
      alternativeExercises: [
        "Incline Bench Press (Dumbbell)",
        "Flat Bench Press (Dumbbell)",
        "Smith Machine Bench Press (Incline)",
        "Smith Machine Bench Press (Flat)",
        "Incline Chest Press Machine",
        "Chest Press Machine"
      ]
    },
    {
      name: "Cable Overhead Shoulder Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Lateral Raises",
      alternativeExercises: [
        "Dumbbell Shoulder Press",
        "Arnold Press (Dumbbell)",
        "Standing Dumbbell Overhead Press",
        "Barbell Overhead Press",
        "Machine Shoulder Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Cable Chest Fly",
      muscleGroup: "chest",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Chest Fly",
        "Incline Cable Fly (Low-to-High)",
        "Decline Cable Fly (High-to-Low)"
      ]
    },
    {
      name: "Cable Rear Delt Fly",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Cables"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Reverse Fly",
        "Reverse Pec Deck Machine"
      ]
    },
    {
      name: "Cable Bicep Curl",
      muscleGroup: "biceps",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Hammer Curls",
        "Bicep Curls (Dumbbell)",
        "Incline Curls (Dumbbell)",
        "Barbell Bicep Curl",
        "Preacher Curl Machine"
      ]
    },
    {
      name: "Cable Upright Row",
      muscleGroup: "traps",
      equipmentNeeded: ["Cables"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Cable Shrugs",
      alternativeExercises: ["Barbell Upright Row", "Kettlebell High Pull", "Smith Machine Shrugs"]
    },
    
    // *** Machines
    {
      name: "Incline Chest Press Machine",
      muscleGroup: "chest",
      equipmentNeeded: ["Machines"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Push-Ups",
      alternativeExercises: [
        "Incline Bench Press (Dumbbell)",
        "Incline Bench Press (Barbell)",
        "Smith Machine Bench Press (Incline)",
        "Cable Chest Press"
      ]
    },
    {
      name: "Pec Deck Machine",
      muscleGroup: "chest",
      equipmentNeeded: ["Machines"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation"
      // You did not map "Pec Deck" to Dumbbell Fly in your lists,
      // so no alt added
    },
    {
      name: "Chest Press Machine",
      muscleGroup: "chest",
      equipmentNeeded: ["Machines"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Push-Ups",
      alternativeExercises: [
        "Flat Bench Press (Dumbbell)",
        "Smith Machine Bench Press (Flat)",
        "Cable Chest Press"
      ]
    },
    {
      name: "Reverse Pec Deck Machine",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Machines"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Reverse Fly",
        "Cable Rear Delt Fly"
      ]
    },
    {
      name: "Machine Shoulder Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Machines"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Lateral Raises",
      alternativeExercises: [
        "Dumbbell Shoulder Press",
        "Arnold Press (Dumbbell)",
        "Standing Dumbbell Overhead Press",
        "Barbell Overhead Press",
        "Cable Overhead Shoulder Press",
        "Smith Machine Shoulder Press"
      ]
    },
    {
      name: "Leg Press",
      muscleGroup: "quads",
      equipmentNeeded: ["Machines"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges"
      // Not matched in your alt-lists
    },
    {
      name: "Leg Extensions",
      muscleGroup: "quads",
      equipmentNeeded: ["Machines"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation"
      // Not matched in your alt-lists
    },
    {
      name: "Seated Leg Curls",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Machines"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      // From "Dumbbell Hamstring Curls" => alt includes "Seated Leg Curls"
      alternativeExercises: [
        "Dumbbell Hamstring Curls",
        "Hamstring Curls (Cable)",
        "Lying Leg Curls"
      ]
    },
    {
      name: "Lying Leg Curls",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Machines"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Hamstring Curls",
        "Hamstring Curls (Cable)",
        "Seated Leg Curls"
      ]
    },
    {
      name: "Abductor Machine",
      muscleGroup: "quads",
      equipmentNeeded: ["Machines"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation"
      // Not matched in your alt-lists
    },
    {
      name: "Tricep Pushdown Machine",
      muscleGroup: "triceps",
      equipmentNeeded: ["Machines"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Tricep Pushdowns"
      ]
    },
    {
      name: "Lat Pulldown",
      muscleGroup: "back",
      equipmentNeeded: ["Machines"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "vertical",
      pairedWith: "Dumbbell Shrugs"
      // Not matched in your alt-lists
    },
    {
      name: "Plate Loaded Lat Pulldown",
      muscleGroup: "back",
      equipmentNeeded: ["Machines"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "vertical",
      pairedWith: "Dumbbell Shrugs"
      // Not matched in your alt-lists
    },
    {
      name: "Preacher Curl Machine",
      muscleGroup: "biceps",
      equipmentNeeded: ["Machines"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      // From many dumbbell bicep variants
      alternativeExercises: [
        "Bicep Curls (Dumbbell)",
        "Hammer Curls",
        "Incline Curls (Dumbbell)",
        "Cable Bicep Curl",
        "Barbell Bicep Curl"
      ]
    },
    {
      name: "Hip Thrust Machine",
      muscleGroup: "glutes",
      equipmentNeeded: ["Machines"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Glute Bridge",
      alternativeExercises: [
        "Barbell Hip Thrust",
        "Smith Machine Hip Thrust"
      ]
    },
    
    // *** Smith Machine
    {
      name: "Smith Machine Shrugs",
      muscleGroup: "traps",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "isolation",
      alternativeExercises: [
        "Dumbbell Shrugs",
        "Barbell Shrugs",
        "Cable Shrugs"
      ]
    },
    {
      name: "Smith Machine Squats",
      muscleGroup: "quads",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges"
      // Not in your alt-lists
    },
    {
      name: "Smith Machine Romanian Deadlift",
      muscleGroup: "hamstrings",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Dumbbell Good Mornings",
        "Dumbbell Romanian Deadlift",
        "Romanian Deadlifts (Barbell)",
        // also from "Single-Leg Romanian Deadlifts" alt
      ]
    },
    {
      name: "Smith Machine Shoulder Press",
      muscleGroup: "shoulders",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Lateral Raises",
      alternativeExercises: [
        "Dumbbell Shoulder Press",
        "Arnold Press (Dumbbell)",
        "Standing Dumbbell Overhead Press",
        "Barbell Overhead Press",
        "Cable Overhead Shoulder Press",
        "Machine Shoulder Press"
      ]
    },
    {
      name: "Smith Machine Bench Press (Flat)",
      muscleGroup: "chest",
      equipmentNeeded: ["Smith Machine", "Bench"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        "Flat Bench Press (Dumbbell)",
        "Flat Bench Press (Barbell)",
        "Chest Press Machine",
        "Cable Chest Press"
      ]
    },
    {
      name: "Smith Machine Bench Press (Incline)",
      muscleGroup: "chest",
      equipmentNeeded: ["Smith Machine", "Bench"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Dumbbell Fly",
      alternativeExercises: [
        "Incline Bench Press (Dumbbell)",
        "Incline Bench Press (Barbell)",
        "Incline Chest Press Machine",
        "Cable Chest Press"
      ]
    },
    {
      name: "Smith Machine Barbell Rows",
      muscleGroup: "back",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "pull",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      movementPlane: "horizontal",
      pairedWith: "Bodyweight Rear Delt Fly",
      alternativeExercises: [
        "Single-Arm Dumbbell Rows",
        "Bent-Over Dumbbell Rows",
        "Barbell Rows",
        "Pendlay Rows",
        "Seated Cable Rows",
        "Single Arm Cable Row"
      ]
    },
    {
      name: "Smith Machine Close-Grip Bench Press",
      muscleGroup: "triceps",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "push",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Push-Ups",
      alternativeExercises: [
        "Close-Grip Bench Press (Barbell)"
      ]
    },
    {
      name: "Smith Machine Hip Thrust",
      muscleGroup: "glutes",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Glute Bridge",
      alternativeExercises: [
        "Barbell Hip Thrust",
        "Hip Thrust Machine"
      ]
    },
    {
      name: "Smith Machine Split Squat",
      muscleGroup: "quads",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "legs",
      isTechnical: true,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Bulgarian Split Squats"
      // Not in your alt-lists
    },
    {
      name: "Smith Machine Bulgarian Split Squat",
      muscleGroup: "quads",
      equipmentNeeded: ["Smith Machine"],
      splitTag: "legs",
      isTechnical: false,
      advancedVariant: false,
      typeOfMovement: "compound",
      pairedWith: "Bodyweight Lunges",
      alternativeExercises: [
        "Dumbbell Lunges",
        "Bulgarian Split Squats (Dumbbell)",
        "Walking Lunges (Dumbbell)",
        "Dumbbell Step-Ups",
        "Barbell Walking Lunge"
      ]
    },
    
      // *** Bodyweight
      // { name: "Decline Push-Ups", muscleGroup: "chest", equipmentNeeded: ["Bodyweight"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
      // { name: "Push-Ups", muscleGroup: "chest", equipmentNeeded: ["Bodyweight"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
      // { name: "Incline Push-Ups", muscleGroup: "chest", equipmentNeeded: ["Bodyweight"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
      { name: "Dips", muscleGroup: "triceps", equipmentNeeded: ["Dip Station"], splitTag: "push", isTechnical: true, advancedVariant: false, typeOfMovement: "compound", pairedWith: "Diamond Push-Ups", isBodyweight: true },
      { name: "Assisted Dips", muscleGroup: "triceps", equipmentNeeded: ["Machines"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", pairedWith: "Diamond Push-Ups" },
      // { name: "TRX Face Pulls", muscleGroup: "back", equipmentNeeded: ["None of the above", "Bodyweight"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", movementPlane: "horizontal" },
      // { name: "Pull-Ups", muscleGroup: "back", equipmentNeeded: ["Pull-Up Bar"], splitTag: "pull", isTechnical: true, advancedVariant: false, typeOfMovement: "compound", movementPlane: "vertical", pairedWith: "Dumbbell Shrugs" },
      { name: "Assisted Pull-Ups", muscleGroup: "back", equipmentNeeded: ["Machines"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", movementPlane: "vertical", pairedWith: "Dumbbell Shrugs" },
      // { name: "Chin-Ups", muscleGroup: "back", equipmentNeeded: ["Pull-Up Bar"], splitTag: "pull", isTechnical: true, advancedVariant: false, typeOfMovement: "compound", movementPlane: "vertical", pairedWith: "Dumbbell Shrugs" },
      // { name: "Diamond Push-Ups", muscleGroup: "triceps", equipmentNeeded: ["Bodyweight"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
      // { name: "Sissy Squats", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: true, advancedVariant: false, typeOfMovement: "compound", pairedWith: "Step-Ups" },
      // { name: "Step-Ups", muscleGroup: "quads", equipmentNeeded: ["Bodyweight", "Bench"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
      // { name: "Back Extensions", muscleGroup: "hamstrings", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
    
      // *** Core
      { name: "Crunches", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Sit-Ups", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Mountain Climbers", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Hanging Leg Raises", muscleGroup: "core", equipmentNeeded: ["Pull-Up Bar"], splitTag: "fullbody", isTechnical: true, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Flutter Kicks", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Hanging Knee Raises", muscleGroup: "core", equipmentNeeded: ["Pull-Up Bar"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Russian Twists", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Supermans", muscleGroup: "back", equipmentNeeded: ["Bodyweight"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", movementPlane: "arch", isBodyweight: true },
      { name: "Neck Flexion", muscleGroup: "neck", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
      { name: "Neck Extension", muscleGroup: "neck", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isBodyweight: true },
    
      // *** Misc Bodyweight
      { name: "Tire Flips", muscleGroup: "fullbody", equipmentNeeded: ["None of the above"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Sled Push", muscleGroup: "quads", equipmentNeeded: ["None of the above"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },
      { name: "Medicine Ball Slams", muscleGroup: "fullbody", equipmentNeeded: ["None of the above"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      // { name: "Weighted Pull-Ups", muscleGroup: "back", equipmentNeeded: ["Pull-Up Bar", "Weight Belt"], splitTag: "pull", isTechnical: true, advancedVariant: true, typeOfMovement: "compound", movementPlane: "vertical" },
      // { name: "Weighted Chin-Ups", muscleGroup: "back", equipmentNeeded: ["Pull-Up Bar", "Weight Belt"], splitTag: "pull", isTechnical: true, advancedVariant: true, typeOfMovement: "compound", movementPlane: "vertical" },
      // { name: "Weighted Dips", muscleGroup: "triceps", equipmentNeeded: ["Dip Station", "Weight Belt"], splitTag: "push", isTechnical: true, advancedVariant: true, typeOfMovement: "compound" },
    
      // *** Plyo / HIIT
      { name: "Jumping Jacks", muscleGroup: "fullbody", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "High Knees", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Burpees", muscleGroup: "fullbody", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Jump Squats", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Butt Kicks", muscleGroup: "hamstrings", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Skater Jumps", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true},
      { name: "Jump Lunges", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Plank Jacks", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Broad Jumps", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Battle Rope Waves", muscleGroup: "fullbody", equipmentNeeded: ["None of the above"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
      { name: "Kettlebell Swings", muscleGroup: "hamstrings", equipmentNeeded: ["Kettlebells"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
    
      // *** Cardio Machines (Gym Only)
      { name: "Treadmill", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Rowing Machine", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Stationary Bike", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Stairmaster", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Elliptical Trainer", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Spin Bike", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Ski Erg", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
      { name: "Assault Air Bike", muscleGroup: "cardio", equipmentNeeded: ["Machines"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "cardio" },
    
      // For "Group B" (elderly/pregnant/postnatal)
      { name: "Chair Squats", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true },
      { name: "Wall Push-Ups", muscleGroup: "chest", equipmentNeeded: ["Bodyweight"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true , isBodyweight: true},
      { name: "Seated Band Rows", muscleGroup: "back", equipmentNeeded: ["Cables"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true },
      { name: "Bird Dog", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isGroupBOnly: true , isBodyweight: true},
      { name: "Glute Bridge", muscleGroup: "hamstrings", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true },
      { name: "Modified Plank (on knees)", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isGroupBOnly: true, isBodyweight: true },
    ];