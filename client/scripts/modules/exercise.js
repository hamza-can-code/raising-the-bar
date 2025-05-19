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
    videoUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
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
    videoUrl: "https://www.youtube.com/watch?v=VmB1G1K7v94",
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
    videoUrl: "https://www.youtube.com/watch?v=cJRVVxmytaM",
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
    videoUrl: "https://www.youtube.com/watch?v=nYFjVJqMmM8",
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
    videoUrl: "https://www.youtube.com/watch?v=wveUmKmIBcI",
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
    videoUrl: "https://www.youtube.com/watch?v=fTiHlHlyweU",
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
    videoUrl: "https://www.youtube.com/watch?v=vXyv3dAt5Hc",
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
    videoUrl: "https://www.youtube.com/watch?v=zC3nLlEvin4",
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
    videoUrl: "https://www.youtube.com/watch?v=4FbGrHJyG8o",
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
    videoUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
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
    videoUrl: "https://www.youtube.com/watch?v=3ml7BH7mNwQ",
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
    videoUrl: "https://www.youtube.com/watch?v=D7KaRcUTQeE",
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
    videoUrl: "https://www.youtube.com/watch?v=vLuhN_glFZ8",
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
    videoUrl: "https://www.youtube.com/watch?v=eLX_dyvooKQ",
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
    videoUrl: "https://www.youtube.com/watch?v=SniKHGKDJyU",
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
    videoUrl: "https://www.youtube.com/watch?v=dY7BmNR7RJk",
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
    videoUrl: "https://www.youtube.com/watch?v=iS7atZhcRnw",
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
    videoUrl: "https://www.youtube.com/watch?v=uZ6FYe4U0iY",
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
    videoUrl: "https://www.youtube.com/watch?v=SRUtMJ0tE2A",
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
    videoUrl: "https://www.youtube.com/watch?v=Nkl8WnH6tDU",
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
    videoUrl: "https://www.youtube.com/watch?v=NH7Xv-7NQNQ",
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
    videoUrl: "https://www.youtube.com/watch?v=eozdVDA78K0",
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
    videoUrl: "https://www.youtube.com/watch?v=-Vyt2QdsR7E",
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
    videoUrl: "https://www.youtube.com/watch?v=9ZknEYboBOQ",
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
    videoUrl: "https://www.youtube.com/watch?v=HeovYNoZDRg",
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
    videoUrl: "https://www.youtube.com/watch?v=7ac_qmBjkFI",
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
    videoUrl: "https://www.youtube.com/watch?v=lyMpCIUE6ms",
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
    videoUrl: "https://www.youtube.com/watch?v=uUGDRwge4F8",
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
    videoUrl: "https://www.youtube.com/watch?v=M2rwvNhTOu0",
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
    videoUrl: "https://www.youtube.com/watch?v=xYvRPJ4JG8s",
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
    videoUrl: "https://www.youtube.com/watch?v=-t7fuZ0KhDA",
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
    videoUrl: "https://www.youtube.com/watch?v=ZXpZu_fmheU",
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
    videoUrl: "https://www.youtube.com/watch?v=LccyTxiUrhg",
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
    videoUrl: "https://www.youtube.com/watch?v=T1U3yZne1jw",
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
    videoUrl: "https://www.youtube.com/watch?v=hQgFixeXdZo",
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
    videoUrl: "https://www.youtube.com/watch?v=YXZbptZtKCE",
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
    videoUrl: "https://www.youtube.com/watch?v=ir5PsbniVSc",
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
    videoUrl: "https://www.youtube.com/watch?v=DbFgADa2PL8",
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
    videoUrl: "https://www.youtube.com/watch?v=hWbUlkb5Ms4",
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
    videoUrl: "https://www.youtube.com/watch?v=9xGqgGFAtiM",
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
    videoUrl: "https://www.youtube.com/watch?v=vT2GjY_Umpw",
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
    videoUrl: "https://www.youtube.com/watch?v=Weu9HMHdiDA",
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
    videoUrl: "https://www.youtube.com/watch?v=ZaTM37cfiDs",
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
    videoUrl: "https://www.youtube.com/watch?v=Ctcldf6aJZM",
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
    videoUrl: "https://www.youtube.com/watch?v=1xMaFs0L3ao",
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
    videoUrl: "https://www.youtube.com/watch?v=wyDbagKS7Rg",
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
    videoUrl: "https://www.youtube.com/watch?v=mZxxJEncsyw",
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
    videoUrl: "https://www.youtube.com/watch?v=nEF0bv2FW94",
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
    videoUrl: "https://www.youtube.com/watch?v=d_KZxkY_0cM",
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
    videoUrl: "https://www.youtube.com/watch?v=F3QY5vMz_6I",
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
    videoUrl: "https://www.youtube.com/watch?v=LJcX054ijjk",
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
    videoUrl: "https://www.youtube.com/watch?v=amCU-ziHITM",
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
    videoUrl: "https://www.youtube.com/watch?v=QZEqB6wUPxQ",
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
    videoUrl: "https://www.youtube.com/watch?v=gacJl2rHwtg",
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
    videoUrl: "https://www.youtube.com/watch?v=X9QswJmhBQI",
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
    videoUrl: "https://www.youtube.com/watch?v=3UWi44yN-wM",
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
    videoUrl: "https://www.youtube.com/watch?v=Zp26q4BY5HE",
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
    videoUrl: "https://www.youtube.com/watch?v=sSESeQAir2M",
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
    videoUrl: "https://www.youtube.com/watch?v=4ULa6AJcjr8",
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
    videoUrl: "https://www.youtube.com/watch?v=r5xmb6J-rO8",
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
    videoUrl: "https://www.youtube.com/watch?v=c9h8nR5jiRU",
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
    videoUrl: "https://www.youtube.com/watch?v=qS5q6FgddTI",
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
    videoUrl: "https://www.youtube.com/watch?v=9Q9gwoXHn1o",
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
    videoUrl: "https://www.youtube.com/watch?v=Li4g5p6s2eM",
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
    videoUrl: "https://www.youtube.com/watch?v=ypOX1ve3ZCY",
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
    videoUrl: "https://www.youtube.com/watch?v=OfgQrQCLJsk",
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
    videoUrl: "https://www.youtube.com/watch?v=aNDUbH_Uv4g",
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
    videoUrl: "https://www.youtube.com/watch?v=Uc5rP5xs7qQ",
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
    videoUrl: "https://www.youtube.com/watch?v=y2jz7ot6r2I",
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
    videoUrl: "https://www.youtube.com/watch?v=M1N804yWA-8",
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
    videoUrl: "https://www.youtube.com/watch?v=8Um35Es-ROE",
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
    videoUrl: "https://www.youtube.com/watch?v=WEM9FCIPlxQ",
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
    videoUrl: "https://www.youtube.com/watch?v=-kC035LEfCo",
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
    videoUrl: "https://www.youtube.com/watch?v=GZbfZ033f74",
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
    videoUrl: "https://www.youtube.com/watch?v=bLVeOunB-c0",
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
    videoUrl: "https://www.youtube.com/watch?v=BXDKSPonRt0",
    pairedWith: "Plank Row",
    alternativeExercises: [
      "Single Arm Cable Row",
      "Seated Cable Rows",
      "Single-Arm Dumbbell Rows",
      "Bent-Over Dumbbell Rows",
      "Barbell Rows",
      "Pendlay Rows"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=32auHIqgEoM",
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
    videoUrl: "https://www.youtube.com/watch?v=4oZ_0_bQcOg",
    typeOfMovement: "compound",
    alternativeExercises: [
      "Dumbbell Romanian Deadlift",
      "Romanian Deadlifts (Barbell)",
      "Smith Machine Romanian Deadlift",
      "Kettlebell Swings",
      "Barbell Good Mornings"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=rfRdD5PKrko",
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
    videoUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU",
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
    videoUrl: "https://www.youtube.com/watch?v=InlskQoPgzM",
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
    videoUrl: "https://www.youtube.com/watch?v=SqO-VUEak2M",
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
    videoUrl: "https://www.youtube.com/watch?v=DoACGlPyQTI",
    typeOfMovement: "compound",
    alternativeExercises: [
      "Cable Pull-Throughs"
    ],

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
    videoUrl: "https://www.youtube.com/watch?v=HCfU6LGpgMk",
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
    videoUrl: "https://www.youtube.com/watch?v=sh92B-_2O48",
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
    videoUrl: "https://www.youtube.com/watch?v=G1qWo8YjDPE",
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
    videoUrl: "https://www.youtube.com/watch?v=JUDTGZh4rhg",
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
    videoUrl: "https://www.youtube.com/watch?v=f5V2XHVR3Dg",
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
    videoUrl: "https://www.youtube.com/watch?v=2MUEL4nL6hA",
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
    videoUrl: "https://www.youtube.com/watch?v=xWsZaIImrwU",
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
    videoUrl: "https://www.youtube.com/watch?v=ig0NyNlSce4",
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
    videoUrl: "https://www.youtube.com/watch?v=g3T7LsEeDWQ",
    typeOfMovement: "isolation",
    alternativeExercises: [
      "Dumbbell Chest Fly",
      "Cable Chest Fly",
      "Incline Cable Fly (Low-to-High)",
      "Decline Cable Fly (High-to-Low)"
    ],

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
    videoUrl: "https://www.youtube.com/watch?v=sqNwDkUU_Ps",
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
    videoUrl: "https://www.youtube.com/watch?v=-TKqxK7-ehc",
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
    videoUrl: "https://www.youtube.com/watch?v=3R14MnZbcpw",
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
    videoUrl: "https://www.youtube.com/watch?v=Aq5uxXrXq7c",
    pairedWith: "Bodyweight Lunges",
    alternativeExercises: [
      "Barbell Squats",
      "Front Squats (Barbell)",
      "Goblet Squats (Dumbbell)",
      "Smith Machine Squats",
      "Dumbbell Lunges"
    ],
    // Not matched in your alt-lists
  },
  {
    name: "Leg Extensions",
    muscleGroup: "quads",
    equipmentNeeded: ["Machines"],
    splitTag: "legs",
    isTechnical: false,
    advancedVariant: false,
    videoUrl: "https://www.youtube.com/watch?v=YyvSfVjQeL0",
    typeOfMovement: "isolation",
    alternativeExercises: [
      "Goblet Squats (Dumbbell)",
      "Bulgarian Split Squats (Dumbbell)",
      "Dumbbell Lunges",
      "Smith Machine Bulgarian Split Squat"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=t9sTSr-JYSs",
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
    videoUrl: "https://www.youtube.com/watch?v=MAbThtU8Sis",
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
    videoUrl: "https://www.youtube.com/watch?v=dL92FqMJqVY",
    typeOfMovement: "isolation",
    // Not matched in your alt-lists
    alternativeExercises: [
      "Barbell Hip Thrust",
      "Smith Machine Hip Thrust",
      "Hip Thrust Machine"
    ],
  },
  {
    name: "Tricep Pushdown Machine",
    muscleGroup: "triceps",
    equipmentNeeded: ["Machines"],
    splitTag: "push",
    isTechnical: false,
    advancedVariant: false,
    typeOfMovement: "isolation",
    videoUrl: "https://www.youtube.com/watch?v=OChuGyCSC7U",
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
    videoUrl: "https://www.youtube.com/watch?v=AOpi-p0cJkc",
    pairedWith: "Dumbbell Shrugs",
    alternativeExercises: [
      "Plate Loaded Lat Pulldown",
      "Kettlebell High Pull",
      "Single-Arm Dumbbell High Pull"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=vjrEYyQ6EW0",
    pairedWith: "Dumbbell Shrugs",
    alternativeExercises: [
      "Lat Pulldown",
      "Kettlebell High Pull",
      "Single-Arm Dumbbell High Pull"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=jGhd1pIcQ74",
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
    videoUrl: "https://www.youtube.com/watch?v=UVucPKyQVLU",
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
    videoUrl: "https://www.youtube.com/watch?v=8ppOGwvaFko",
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
    videoUrl: "https://www.youtube.com/watch?v=DUWK_gKcRCc",
    pairedWith: "Bodyweight Lunges",
    alternativeExercises: [
      "Barbell Squats",
      "Front Squats (Barbell)",
      "Goblet Squats (Dumbbell)",
      "Leg Press",
      "Smith Machine Bulgarian Split Squat"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=nmGzbW15qYo",
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
    videoUrl: "https://www.youtube.com/watch?v=kYZ0aUEzgEQ",
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
    videoUrl: "https://www.youtube.com/watch?v=7FyJdsXeta8",
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
    videoUrl: "https://www.youtube.com/watch?v=yFQshytandQ",
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
    videoUrl: "https://www.youtube.com/watch?v=tGGq2VZIW_M",
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
    videoUrl: "https://www.youtube.com/watch?v=z8UWdGwtzRM",
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
    videoUrl: "https://www.youtube.com/watch?v=s3N-i46gR8o",
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
    videoUrl: "https://www.youtube.com/watch?v=MXrSCU4P9L4",
    pairedWith: "Bodyweight Bulgarian Split Squats",
    alternativeExercises: [
      "Bulgarian Split Squats (Dumbbell)",
      "Dumbbell Step-Ups",
      "Smith Machine Bulgarian Split Squat",
      "Barbell Walking Lunge",
      "Dumbbell Lunges"
    ],
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
    videoUrl: "https://www.youtube.com/watch?v=oLi2QcD0B3M",
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
  {
    name: "Dips", muscleGroup: "triceps",
    alternativeExercises: [
      "Assisted Dips",
      "Close-Grip Bench Press (Barbell)",
      "Smith Machine Close-Grip Bench Press",
      "Tricep Pushdowns",
      "Skull Crushers (Dumbbell)"
    ],
    equipmentNeeded: ["Dip Station"],
    videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As",
    splitTag: "push", isTechnical: true, advancedVariant: false, typeOfMovement: "compound", pairedWith: "Diamond Push-Ups", isBodyweight: true
  },
  {
    name: "Assisted Dips", muscleGroup: "triceps",
    alternativeExercises: [
      "Dips",
      "Close-Grip Bench Press (Barbell)",
      "Smith Machine Close-Grip Bench Press",
      "Tricep Pushdowns",
      "Skull Crushers (Dumbbell)"
    ],
    equipmentNeeded: ["Machines"],
    videoUrl: "https://www.youtube.com/watch?v=kbmVlw-i0Vs",
    splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", pairedWith: "Diamond Push-Ups"
  },
  // { name: "TRX Face Pulls", muscleGroup: "back", equipmentNeeded: ["None of the above", "Bodyweight"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", movementPlane: "horizontal" },
  // { name: "Pull-Ups", muscleGroup: "back", equipmentNeeded: ["Pull-Up Bar"], splitTag: "pull", isTechnical: true, advancedVariant: false, typeOfMovement: "compound", movementPlane: "vertical", pairedWith: "Dumbbell Shrugs" },
  {
    name: "Assisted Pull-Ups",
    alternativeExercises: [
      "Lat Pulldown",
      "Plate Loaded Lat Pulldown",
      "Kettlebell High Pull",
      "Single-Arm Dumbbell High Pull"
    ],
    muscleGroup: "back",
    videoUrl: "https://www.youtube.com/watch?v=wFj808u2HWU",
    equipmentNeeded: ["Machines"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", movementPlane: "vertical", pairedWith: "Dumbbell Shrugs"
  },
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
  { name: "Skater Jumps", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
  { name: "Jump Lunges", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
  { name: "Plank Jacks", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
  { name: "Broad Jumps", muscleGroup: "quads", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
  { name: "Battle Rope Waves", muscleGroup: "fullbody", equipmentNeeded: ["None of the above"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isBodyweight: true },
  { name: "Kettlebell Swings", muscleGroup: "hamstrings", equipmentNeeded: ["Kettlebells"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound" },

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
  {
    name: "Chair Squats",
    videoUrl: "https://www.youtube.com/watch?v=OViE2ghEop0",
    muscleGroup: "quads",
    equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true
  },
  {
    name: "Wall Push-Ups",
    muscleGroup: "chest",
    videoUrl: "https://www.youtube.com/watch?v=YB0egDzsu18",
    equipmentNeeded: ["Bodyweight"], splitTag: "push", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true
  },
  {
    name: "Seated Band Rows",
    videoUrl: "https://www.youtube.com/watch?v=jix2wqu2MfE", muscleGroup: "back", equipmentNeeded: ["Cables"], splitTag: "pull", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true
  },
  {
    name: "Bird Dog",
    videoUrl: "https://www.youtube.com/watch?v=-LRjkbEy-qU", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isGroupBOnly: true, isBodyweight: true
  },
  {
    name: "Glute Bridge",
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8", muscleGroup: "hamstrings", equipmentNeeded: ["Bodyweight"], splitTag: "legs", isTechnical: false, advancedVariant: false, typeOfMovement: "compound", isGroupBOnly: true, isBodyweight: true
  },
  {
    name: "Modified Plank (on knees)",
    videoUrl: "https://www.youtube.com/watch?v=Of0YDiN9p00", muscleGroup: "core", equipmentNeeded: ["Bodyweight"], splitTag: "fullbody", isTechnical: false, advancedVariant: false, typeOfMovement: "isolation", isGroupBOnly: true, isBodyweight: true
  },
];