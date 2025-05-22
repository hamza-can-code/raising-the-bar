/******************************************************
 * 12-week-program.js
 ******************************************************/

// (A) PDF GENERATION HELPER
function downloadPDF(containerId, fileName, callback) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`No container found with ID: ${containerId}`);
    if (callback) callback();
    return;
  }
  // Make sure it's visible
  container.style.display = "block";

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 1 },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(container)
    .save()
    .then(() => {
      container.style.display = "none"; // hide again
      if (callback) callback();
    });
}

function getAdjustedMaintenance(week, maintenanceCals, userGoal) {
  let phase;
  if (week <= 4) phase = 1;
  else if (week <= 8) phase = 2;
  else phase = 3;
  
  let base = maintenanceCals; // the original maintenance calories

  if (userGoal.includes("lose")) {
    // For weight loss, decrease by 2% for each phase beyond phase 1.
    if (phase === 2) base *= 0.98;
    else if (phase === 3) base *= 0.98 * 0.98;
  } else if (userGoal.includes("gain")) {
    // For muscle gain, increase by 1% for each phase beyond phase 1.
    if (phase === 2) base *= 1.01;
    else if (phase === 3) base *= 1.01 * 1.01;
  } else if (userGoal.includes("improve")) {
    // For improve body comp, decrease by 1% for each phase beyond phase 1.
    if (phase === 2) base *= 0.99;
    else if (phase === 3) base *= 0.99 * 0.99;
  }
  return Math.round(base);
}

function adjustDailyNutritionRows() {
  const userGoalRaw = (localStorage.getItem("goal") || "").toLowerCase();

  // Grab elements
  const dailyDeficitEl = document.getElementById("dailyDeficit");
  const dailySurplusEl = document.getElementById("dailySurplus");
  const dailyDeloadEl = document.getElementById("dailyDeload");

  // Use selectedCalories for both deficit & surplus by default
  const fallbackCals = parseInt(localStorage.getItem("selectedCalories") || "2100", 10);
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  if (dailyDeficitEl) dailyDeficitEl.textContent = fallbackCals + " kcals";
  if (dailySurplusEl) dailySurplusEl.textContent = fallbackCals + " kcals";
  if (dailyDeloadEl) dailyDeloadEl.textContent = maintenanceCals + " kcals";

  if (userGoalRaw.includes("weight")) {
    // hide surplus
    if (dailySurplusEl) {
      dailySurplusEl.style.display = "none";
      const lbl = dailySurplusEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  } else if (userGoalRaw.includes("muscle")) {
    // hide deficit
    if (dailyDeficitEl) {
      dailyDeficitEl.style.display = "none";
      const lbl = dailyDeficitEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  }
}

const mealDatabase = [
    {
      "mealName": "Protein Pancakes & Strawberries",
      "calories": 420,
      "macroRatio": {
        "protein": 0.30, 
        "carbs": 0.48,  
        "fats": 0.22     
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "whey protein",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "oats",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "egg",
          "quantity": 1,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "strawberries",
          "quantity": 80,
          "unit": "g"
        }
      ],
      "recipe": [
        "Blend oats, egg, and protein powder.",
        "Cook small pancakes, top with berries."
      ],
      "mealNotes": [
        "For fluffier pancakes, let the batter rest for 5 minutes before cooking!"
      ]
    },
    {
      "mealName": "Avocado Toast with Eggs & Bacon",
      "calories": 600,
      "macroRatio": {
        "protein": 0.211,
        "carbs": 0.282,
        "fats": 0.507
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Eggs", "Gluten"],
      "ingredients": [
        {
          "name": "whole grain bread",
          "quantity": 2,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "avocado",
          "quantity": 75,
          "unit": "g"
        },
        {
          "name": "egg",
          "quantity": 2,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "bacon",
          "quantity": 30,
          "unit": "g"
        }
      ],
      "recipe": [
        "Toast bread and fry bacon, eggs.",
        "Mash avocado and spread on toast."
      ],
      "mealNotes": [
        "Add red pepper flakes for extra spice!"
      ]
    },
    {
      "mealName": "Banana Nut Oatmeal",
      "calories": 550,
      "macroRatio": {
        "protein": 0.14,
        "carbs": 0.545,
        "fats": 0.315
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts"],
      "ingredients": [
        {
          "name": "rolled oats",
          "quantity": 80,
          "unit": "g"
        },
        {
          "name": "banana",
          "quantity": 1,
          "singular": "banana",
          "plural": "bananas",
          "wholeItem": true
        },
        {
          "name": "peanut butter",
          "quantity": 16,
          "unit": "g"
        },
        {
          "name": "walnuts",
          "quantity": 30,
          "unit": "g"
        }
      ],
      "recipe": [
        "Cook oats with water, stir in banana and peanut butter.",
        "Top with walnuts."
      ],
      "mealNotes": [
        "For creamier oats, use milk instead of water."
      ]
    },
    {
      "mealName": "Blueberry Protein Smoothie",
      "calories": 310,
      "macroRatio": {
        "protein": 0.301,
        "carbs": 0.482,
        "fats": 0.217
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "whey protein",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "blueberries",
          "quantity": 75,
          "unit": "g"
        },
        {
          "name": "almond milk",
          "quantity": 240,
          "unit": "ml"
        },
        {
          "name": "honey",
          "quantity": 7,
          "unit": "g"
        }
      ],
      "recipe": [
        "Blend all until smooth."
      ],
      "mealNotes": []
    },
{
  "mealName": "Whole Wheat Waffles & Yogurt",
  "calories": 450,
  "macroRatio": {
    "protein": 0.248,
    "carbs": 0.513,
    "fats": 0.239
  },
  "category": "Breakfast",
  "dietaryPhase": ["surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    {
      "name": "whole wheat waffle",
      "quantity": 1,
      "singular": "waffle",
      "plural": "waffles",
      "wholeItem": true
    },
    {
      "name": "Greek yogurt",
      "quantity": 100,
      "unit": "g"
    },
    {
      "name": "honey",
      "quantity": 7,
      "unit": "g"
    },
    {
      "name": "mixed berries",
      "quantity": 60,
      "unit": "g"
    }
  ],
  "recipe": [
    "Toast waffle.",
    "Top with yogurt, honey, and berries."
  ],
  "mealNotes": []
},
{
  "mealName": "Veggie Omelet & Cheese",
  "calories": 390,
  "macroRatio": {
    "protein": 0.317,
    "carbs": 0.159,
    "fats": 0.524
  },
  "category": "Breakfast",
  "dietaryPhase": ["deficitPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    {
      "name": "egg",
      "quantity": 2,
      "singular": "egg",
      "plural": "eggs",
      "wholeItem": true
    },
    {
      "name": "mixed veggies",
      "quantity": 70,
      "unit": "g"
    },
    {
      "name": "cheese",
      "quantity": 30,
      "unit": "g"
    },
    {
      "name": "salt, pepper",
      "quantity": 1,
      "unit": "dash"
    }
  ],
  "recipe": [
    "Whisk eggs, add veggies.",
    "Cook in pan, top with cheese."
  ],
  "mealNotes": []
},
  {
    "mealName": "Banana Oatmeal & Peanut Butter",
    "calories": 440,
    "macroRatio": {
      "protein": 0.176,
      "carbs": 0.527,
      "fats": 0.297
    },
    "category": "Breakfast",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Nuts"],
    "ingredients": [
      {
        "name": "oats",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "banana",
        "quantity": 1,
        "singular": "banana",
        "plural": "bananas",
        "wholeItem": true
      },
      {
        "name": "peanut butter",
        "quantity": 16,
        "unit": "g"
      },
      {
        "name": "milk",
        "quantity": 240,
        "unit": "ml"
      }
    ],
    "recipe": [
      "Cook oats with milk.",
      "Stir in peanut butter, top with banana."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Turkey Bacon & Egg Wrap",
    "calories": 400,
    "macroRatio": {
      "protein": 0.304,
      "carbs": 0.354,
      "fats": 0.342
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "tortilla",
        "quantity": 1,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      },
      {
        "name": "turkey bacon",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "egg",
        "quantity": 1,
        "singular": "egg",
        "plural": "eggs",
        "wholeItem": true
      },
      {
        "name": "salt, pepper",
        "quantity": 1,
        "unit": "g"
      }
    ],
    "recipe": [
      "Cook bacon and egg.",
      "Wrap in tortilla and serve."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Greek Yogurt Parfait with Granola",
    "calories": 370,
    "macroRatio": {
      "protein": 0.27,
      "carbs": 0.486,
      "fats": 0.244
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      {
        "name": "Greek yogurt",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "granola",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "mixed berries",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "honey",
        "quantity": 7,
        "unit": "g"
      }
    ],
    "recipe": [
      "Layer yogurt, berries, and granola.",
      "Drizzle with honey."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Egg White Spinach Wrap",
    "calories": 340,
    "macroRatio": {
      "protein": 0.303,
      "carbs": 0.424,
      "fats": 0.273
    },
    "category": "Breakfast",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      {
        "name": "egg white",
        "quantity": 3,
        "singular": "egg white",
        "plural": "egg whites",
        "wholeItem": true
      },
      {
        "name": "spinach",
        "quantity": 20,
        "unit": "g"
      },
      {
        "name": "tortilla",
        "quantity": 1,
        "singular": "tortilla",
        "plural": "tortillas",
        "wholeItem": true
      },
      {
        "name": "salt, pepper",
        "quantity": 1,
        "unit": "g"
      }
    ],
    "recipe": [
      "Cook egg whites with spinach.",
      "Wrap in tortilla."
    ],
    "mealNotes": []
  },
    {
      "mealName": "Turkey Omelet",
      "calories": 380,
      "macroRatio": {
        "protein": 0.353,
        "carbs": 0.118,
        "fats": 0.529
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "egg",
          "quantity": 2,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "turkey slices",
          "quantity": 50,
          "unit": "g"
        },
        {
          "name": "cheese",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "salt, pepper",
          "quantity": 1,
          "unit": "g"
        }
      ],
      "recipe": [
        "Whisk eggs, add turkey/cheese.",
        "Cook in pan."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Protein French Toast",
      "calories": 450,
      "macroRatio": {
        "protein": 0.255,
        "carbs": 0.50,
        "fats": 0.245
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "wheat bread",
          "quantity": 2,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "protein powder",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "egg",
          "quantity": 1,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "milk",
          "quantity": 120,
          "unit": "ml"
        }
      ],
      "recipe": [
        "Mix egg, milk, protein powder.",
        "Dip bread & pan-fry."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Breakfast Tacos",
      "calories": 430,
      "macroRatio": {
        "protein": 0.269,
        "carbs": 0.385,
        "fats": 0.346
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "tortilla",
          "quantity": 2,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "egg",
          "quantity": 2,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "salsa",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "peppers",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "cheese (optional)",
          "quantity": 15,
          "unit": "g"
        }
      ],
      "recipe": [
        "Scramble eggs, fill tortillas w/ eggs, peppers, salsa."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Spinach & Turkey Bacon Omelet",
      "calories": 380,
      "macroRatio": {
        "protein": 0.337,
        "carbs": 0.12,
        "fats": 0.543
      },
      "category": "Breakfast",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "egg",
          "quantity": 2,
          "singular": "egg",
          "plural": "eggs",
          "wholeItem": true
        },
        {
          "name": "turkey bacon",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "spinach",
          "quantity": 20,
          "unit": "g"
        },
        {
          "name": "salt, pepper",
          "quantity": 1,
          "unit": "g"
        }
      ],
      "recipe": [
        "Cook bacon, set aside.",
        "Whisk eggs w/ spinach, fold in bacon."
      ],
      "mealNotes": []
    },
      {
        "mealName": "Ham & Egg Cup",
        "calories": 260,
        "macroRatio": {
          "protein": 0.336,
          "carbs": 0.046,
          "fats": 0.618
        },
        "category": "Breakfast",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "ham",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "egg",
            "quantity": 1,
            "singular": "egg",
            "plural": "eggs",
            "wholeItem": true
          },
          {
            "name": "seasoning",
            "quantity": 1,
            "unit": "g"
          }
        ],
        "recipe": [
          "Line muffin tin w/ ham.",
          "Crack egg, bake 15 min."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Pumpkin Spice Oatmeal",
        "calories": 390,
        "macroRatio": {
          "protein": 0.145,
          "carbs": 0.622,
          "fats": 0.233
        },
        "category": "Breakfast",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "oats",
            "quantity": 40,
            "unit": "g"
          },
          {
            "name": "pumpkin puree",
            "quantity": 60,
            "unit": "g"
          },
          {
            "name": "pumpkin spice",
            "quantity": 1,
            "unit": "g"
          },
          {
            "name": "water",
            "quantity": 240,
            "unit": "ml"
          }
        ],
        "recipe": [
          "Cook oats w/ puree & spice.",
          "Serve warm."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Egg & Cheese Muffin Sandwich",
        "calories": 410,
        "macroRatio": {
          "protein": 0.253,
          "carbs": 0.405,
          "fats": 0.342
        },
        "category": "Breakfast",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Dairy"],
        "ingredients": [
          {
            "name": "English muffin",
            "quantity": 1,
            "singular": "muffin",
            "plural": "muffins",
            "wholeItem": true
          },
          {
            "name": "egg",
            "quantity": 1,
            "singular": "egg",
            "plural": "eggs",
            "wholeItem": true
          },
          {
            "name": "cheese",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "salt, pepper",
            "quantity": 1,
            "unit": "g"
          }
        ],
        "recipe": [
          "Cook egg, place on muffin w/ cheese."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Whole Wheat Bagel w/ Lox",
        "calories": 450,
        "macroRatio": {
          "protein": 0.23,
          "carbs": 0.46,
          "fats": 0.31
        },
        "category": "Breakfast",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Fish"],
        "ingredients": [
          {
            "name": "wheat bagel",
            "quantity": 1,
            "singular": "bagel",
            "plural": "bagels",
            "wholeItem": true
          },
          {
            "name": "smoked salmon",
            "quantity": 50,
            "unit": "g"
          },
          {
            "name": "cream cheese (optional)",
            "quantity": 15,
            "unit": "g"
          },
          {
            "name": "capers",
            "quantity": 5,
            "unit": "g"
          }
        ],
        "recipe": [
          "Toast bagel, layer salmon & cream cheese."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Peanut Butter Banana Wrap",
        "calories": 400,
        "macroRatio": {
          "protein": 0.14,
          "carbs": 0.50,
          "fats": 0.36
        },
        "category": "Breakfast",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Nuts"],
        "ingredients": [
          {
            "name": "tortilla",
            "quantity": 1,
            "singular": "tortilla",
            "plural": "tortillas",
            "wholeItem": true
          },
          {
            "name": "peanut butter",
            "quantity": 16,
            "unit": "g"
          },
          {
            "name": "banana",
            "quantity": 1,
            "singular": "banana",
            "plural": "bananas",
            "wholeItem": true
          },
          {
            "name": "honey",
            "quantity": 5,
            "unit": "g"
          }
        ],
        "recipe": [
          "Spread PB, add banana, drizzle honey.",
          "Roll up."
        ],
        "mealNotes": []
      },  

  // --------------------
  // (B) 10 LUNCHES
  // --------------------
    {
      "mealName": "Chicken Caesar Wrap",
      "calories": 520,
      "macroRatio": {
        "protein": 0.28,
        "carbs": 0.36,
        "fats": 0.36
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "chicken",
          "quantity": 150,
          "unit": "g"
        },
        {
          "name": "tortilla",
          "quantity": 1,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "lettuce",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "Caesar dressing",
          "quantity": 20,
          "unit": "g"
        },
        {
          "name": "Parmesan cheese",
          "quantity": 15,
          "unit": "g"
        }
      ],
      "recipe": [
        "Cook chicken, slice.",
        "Wrap w/ lettuce, dressing, cheese."
      ],
      "mealNotes": ["A classic wrap, full of flavor!"]
    },
    {
      "mealName": "Mediterranean Chicken Bowl",
      "calories": 675,
      "macroRatio": {
        "protein": 0.22,
        "carbs": 0.43,
        "fats": 0.35
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["None"],
      "ingredients": [
        {
          "name": "chicken",
          "quantity": 113,
          "unit": "g"
        },
        {
          "name": "cooked quinoa",
          "quantity": 185,
          "unit": "g"
        },
        {
          "name": "avocado",
          "quantity": 75,
          "unit": "g"
        },
        {
          "name": "mixed greens",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "cherry tomatoes",
          "quantity": 50,
          "unit": "g"
        },
        {
          "name": "cucumber",
          "quantity": 50,
          "unit": "g"
        },
        {
          "name": "olive oil & lemon dressing",
          "quantity": 20,
          "unit": "g"
        }
      ],
      "recipe": [
        "Combine chicken, quinoa, and veggies.",
        "Drizzle with dressing and toss."
      ],
      "mealNotes": ["For extra flavor, add fresh herbs."]
    },
    {
      "mealName": "Steak & Sweet Potato Bowl",
      "calories": 950,
      "macroRatio": {
        "protein": 0.20,
        "carbs": 0.40,
        "fats": 0.40
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["None"],
      "ingredients": [
        {
          "name": "steak",
          "quantity": 170,
          "unit": "g"
        },
        {
          "name": "cooked brown rice",
          "quantity": 185,
          "unit": "g"
        },
        {
          "name": "sweet potato",
          "quantity": 130,
          "unit": "g"
        },
        {
          "name": "steamed broccoli",
          "quantity": 75,
          "unit": "g"
        },
        {
          "name": "avocado",
          "quantity": 60,
          "unit": "g"
        },
        {
          "name": "olive oil",
          "quantity": 15,
          "unit": "g"
        }
      ],
      "recipe": [
        "Layer rice, sweet potato, and broccoli.",
        "Top with steak, avocado, and olive oil."
      ],
      "mealNotes": ["Season steak well for robust flavor."]
    },
    {
      "mealName": "Spicy Chicken Wrap",
      "calories": 700,
      "macroRatio": {
        "protein": 0.24,
        "carbs": 0.33,
        "fats": 0.43
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Gluten"],
      "ingredients": [
        {
          "name": "chicken",
          "quantity": 113,
          "unit": "g"
        },
        {
          "name": "tortilla",
          "quantity": 1,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "spicy mayo",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "lettuce",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "tomato",
          "quantity": 40,
          "unit": "g"
        }
      ],
      "recipe": [
        "Layer chicken and veggies on tortilla, drizzle mayo.",
        "Wrap tightly and serve."
      ],
      "mealNotes": ["Toast tortilla for extra crunch."]
    },
    {
      "mealName": "Steak & Quinoa Bowl",
      "calories": 750,
      "macroRatio": {
        "protein": 0.24,
        "carbs": 0.33,
        "fats": 0.43
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "steak",
          "quantity": 113,
          "unit": "g"
        },
        {
          "name": "cooked quinoa",
          "quantity": 185,
          "unit": "g"
        },
        {
          "name": "mixed greens",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "bell peppers",
          "quantity": 50,
          "unit": "g"
        }
      ],
      "recipe": [
        "Combine steak, quinoa, and veggies.",
        "Drizzle olive oil and toss lightly."
      ],
      "mealNotes": ["Season steak well before grilling for bold flavor."]
    },
      {
        "mealName": "Pesto Shrimp Pasta",
        "calories": 800,
        "macroRatio": {
          "protein": 0.23,
          "carbs": 0.39,
          "fats": 0.38
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Shellfish"],
        "ingredients": [
          {
            "name": "shrimp",
            "quantity": 113,
            "unit": "g"
          },
          {
            "name": "cooked pasta",
            "quantity": 200,
            "unit": "g"
          },
          {
            "name": "pesto",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "cherry tomatoes",
            "quantity": 50,
            "unit": "g"
          }
        ],
        "recipe": [
          "Sauté shrimp and mix with pasta and pesto.",
          "Add tomatoes and toss briefly."
        ],
        "mealNotes": ["Finish with Parmesan if desired."]
      },
      {
        "mealName": "Roast Beef & Swiss Sandwich",
        "calories": 550,
        "macroRatio": {
          "protein": 0.30,
          "carbs": 0.35,
          "fats": 0.35
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Dairy"],
        "ingredients": [
          {
            "name": "wheat bread",
            "quantity": 2,
            "singular": "slice",
            "plural": "slices",
            "wholeItem": true
          },
          {
            "name": "roast beef",
            "quantity": 80,
            "unit": "g"
          },
          {
            "name": "Swiss cheese",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "mustard",
            "quantity": 10,
            "unit": "g"
          }
        ],
        "recipe": [
          "Assemble beef, cheese on bread.",
          "Spread mustard."
        ],
        "mealNotes": ["Classic and satisfying!"]
      },
      {
        "mealName": "BBQ Pulled Chicken Sandwich",
        "calories": 560,
        "macroRatio": {
          "protein": 0.29,
          "carbs": 0.44,
          "fats": 0.26
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "shredded chicken",
            "quantity": 150,
            "unit": "g"
          },
          {
            "name": "BBQ sauce",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "whole wheat bun",
            "quantity": 1,
            "singular": "bun",
            "plural": "buns",
            "wholeItem": true
          },
          {
            "name": "coleslaw (optional)",
            "quantity": 50,
            "unit": "g"
          }
        ],
        "recipe": [
          "Mix chicken w/ sauce.",
          "Serve on bun."
        ],
        "mealNotes": ["Try it toasted for extra crunch."]
      },
      {
        "mealName": "Turkey Chili Wrap",
        "calories": 580,
        "macroRatio": {
          "protein": 0.29,
          "carbs": 0.42,
          "fats": 0.28
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "turkey chili",
            "quantity": 120,
            "unit": "g"
          },
          {
            "name": "tortilla",
            "quantity": 1,
            "singular": "tortilla",
            "plural": "tortillas",
            "wholeItem": true
          },
          {
            "name": "lettuce",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "cheese (optional)",
            "quantity": 15,
            "unit": "g"
          }
        ],
        "recipe": [
          "Heat chili, spoon into tortilla.",
          "Wrap & serve."
        ],
        "mealNotes": ["Great for meal prep!"]
      },
      {
        "mealName": "Chicken & Brown Rice Bowl",
        "calories": 550,
        "macroRatio": {
          "protein": 0.30,
          "carbs": 0.45,
          "fats": 0.25
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "chicken breast",
            "quantity": 150,
            "unit": "g"
          },
          {
            "name": "brown rice",
            "quantity": 100,
            "unit": "g"
          },
          {
            "name": "mixed veggies",
            "quantity": 50,
            "unit": "g"
          },
          {
            "name": "salt, pepper",
            "quantity": 1,
            "unit": "g"
          }
        ],
        "recipe": [
          "Cook chicken, season.",
          "Serve over brown rice with veggies."
        ],
        "mealNotes": ["Balanced and nutritious."]
      },
      {
        "mealName": "Tuna Wrap & Lettuce",
        "calories": 420,
        "macroRatio": {
          "protein": 0.36,
          "carbs": 0.41,
          "fats": 0.23
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "tuna",
            "quantity": 1,
            "singular": "can",
            "plural": "cans",
            "wholeItem": true
          },
          {
            "name": "tortilla",
            "quantity": 1,
            "singular": "tortilla",
            "plural": "tortillas",
            "wholeItem": true
          },
          {
            "name": "lettuce",
            "quantity": 30,
            "unit": "g"
          },
          {
            "name": "tomato",
            "quantity": 40,
            "unit": "g"
          },
          {
            "name": "mayo",
            "quantity": 10,
            "unit": "g"
          }
        ],
        "recipe": [
          "Mix tuna, mayo, veggies.",
          "Wrap in tortilla."
        ],
        "mealNotes": ["Light but filling!"]
      },
    {
      "mealName": "Turkey Burger & Sweet Potato",
      "calories": 600,
      "macroRatio": {
        "protein": 0.30,
        "carbs": 0.40,
        "fats": 0.30
      },
      "category": "Lunch",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "turkey burger patty",
          "quantity": 1,
          "singular": "patty",
          "plural": "patties",
          "wholeItem": true
        },
        {
          "name": "whole wheat bun",
          "quantity": 1,
          "singular": "bun",
          "plural": "buns",
          "wholeItem": true
        },
        {
          "name": "sweet potato",
          "quantity": 1,
          "singular": "sweet potato",
          "plural": "sweet potatoes",
          "wholeItem": true
        },
        {
          "name": "lettuce, ketchup",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Grill turkey burger.",
        "Serve on bun, sweet potato fries."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Salmon & Brown Rice Salad",
      "calories": 540,
      "macroRatio": {
        "protein": 0.30,
        "carbs": 0.39,
        "fats": 0.31
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "salmon",
          "quantity": 120,
          "unit": "g"
        },
        {
          "name": "brown rice",
          "quantity": 0.5,
          "singular": "cup",
          "plural": "cups",
          "wholeItem": true
        },
        {
          "name": "mixed greens",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        },
        {
          "name": "olive oil",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Bake salmon, cook rice.",
        "Toss greens with oil, top with salmon."
      ],
      "mealNotes": []
    },
    {
      "mealName": "BBQ Chicken Quesadilla",
      "calories": 590,
      "macroRatio": {
        "protein": 0.29,
        "carbs": 0.41,
        "fats": 0.31
      },
      "category": "Lunch",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "chicken",
          "quantity": 100,
          "unit": "g"
        },
        {
          "name": "BBQ sauce",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        },
        {
          "name": "cheese",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        },
        {
          "name": "tortillas",
          "quantity": 2,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Cook chicken in BBQ sauce.",
        "Assemble cheese/chicken in tortillas."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Turkey & Avocado Sandwich",
      "calories": 450,
      "macroRatio": {
        "protein": 0.28,
        "carbs": 0.40,
        "fats": 0.32
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "whole wheat bread",
          "quantity": 2,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "turkey breast",
          "quantity": 3,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "avocado",
          "quantity": 0.25,
          "singular": "avocado",
          "plural": "avocados",
          "wholeItem": true
        },
        {
          "name": "lettuce, tomato",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Spread avocado on bread.",
        "Add turkey, lettuce, tomato."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Shrimp & Quinoa Bowl",
      "calories": 520,
      "macroRatio": {
        "protein": 0.27,
        "carbs": 0.47,
        "fats": 0.26
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Shellfish"],
      "ingredients": [
        {
          "name": "shrimp",
          "quantity": 100,
          "unit": "g"
        },
        {
          "name": "quinoa",
          "quantity": 0.5,
          "singular": "cup",
          "plural": "cups",
          "wholeItem": true
        },
        {
          "name": "bell peppers",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        },
        {
          "name": "garlic, oil",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Cook quinoa, sauté shrimp/peppers.",
        "Combine and season."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Chicken Pita & Hummus",
      "calories": 530,
      "macroRatio": {
        "protein": 0.31,
        "carbs": 0.45,
        "fats": 0.24
      },
      "category": "Lunch",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "chicken breast",
          "quantity": 150,
          "unit": "g"
        },
        {
          "name": "whole wheat pita",
          "quantity": 1,
          "singular": "pita",
          "plural": "pitas",
          "wholeItem": true
        },
        {
          "name": "hummus",
          "quantity": 2,
          "singular": "tbsp",
          "plural": "tbsps",
          "wholeItem": true
        },
        {
          "name": "lettuce",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Cook chicken, slice.",
        "Spread hummus in pita, add chicken/lettuce."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Steak & Spinach Wrap",
      "calories": 600,
      "macroRatio": {
        "protein": 0.32,
        "carbs": 0.37,
        "fats": 0.32
      },
      "category": "Lunch",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "steak",
          "quantity": 120,
          "unit": "g"
        },
        {
          "name": "tortilla",
          "quantity": 1,
          "singular": "tortilla",
          "plural": "tortillas",
          "wholeItem": true
        },
        {
          "name": "spinach",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        },
        {
          "name": "sauce",
          "quantity": 1,
          "singular": "tbsp",
          "plural": "tbsps",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Cook steak, slice thin.",
        "Wrap with spinach and sauce."
      ],
      "mealNotes": []
    },
    {
      "mealName": "Ham & Cheese Whole Wheat Sandwich",
      "calories": 480,
      "macroRatio": {
        "protein": 0.31,
        "carbs": 0.39,
        "fats": 0.31
      },
      "category": "Lunch",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "whole wheat bread",
          "quantity": 2,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "ham",
          "quantity": 2,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "cheese",
          "quantity": 1,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "lettuce, mustard",
          "quantity": 1,
          "singular": "portion",
          "plural": "portions",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Assemble sandwich with ham, cheese.",
        "Add lettuce, mustard to taste."
      ],
      "mealNotes": []
    },  

  // --------------------
  // (C) 10 DINNERS
  // --------------------

  {
    "mealName": "Fish Tacos",
    "calories": 610,
    "macroRatio": {
      "protein": 0.28,
      "carbs": 0.41,
      "fats": 0.31
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Fish"],
    "ingredients": [
      { "name": "white fish", "quantity": 150, "unit": "g" },
      { "name": "tortilla", "quantity": 2, "singular": "tortilla", "plural": "tortillas", "wholeItem": true },
      { "name": "cabbage slaw", "quantity": 80, "unit": "g" },
      { "name": "lime", "quantity": 1, "singular": "lime", "plural": "limes", "wholeItem": true }
    ],
    "recipe": [
      "Season & grill fish.",
      "Serve in tortillas w/ slaw."
    ]
  },
  {
    "mealName": "Chicken Stir-Fry & Brown Rice",
    "calories": 620,
    "macroRatio": {
      "protein": 0.29,
      "carbs": 0.44,
      "fats": 0.27
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "chicken breast", "quantity": 150, "unit": "g" },
      { "name": "brown rice", "quantity": 100, "unit": "g" },
      { "name": "mixed stir-fry veggies", "quantity": 150, "unit": "g" },
      { "name": "soy sauce", "quantity": 15, "unit": "ml" }
    ],
    "recipe": [
      "Stir-fry chicken, veggies.",
      "Serve with cooked brown rice."
    ]
  },
  {
    "mealName": "Beef & Broccoli Bowl",
    "calories": 650,
    "macroRatio": {
      "protein": 0.33,
      "carbs": 0.33,
      "fats": 0.34
    },
    "category": "Dinner",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Soy"],
    "ingredients": [
      { "name": "lean beef", "quantity": 150, "unit": "g" },
      { "name": "broccoli florets", "quantity": 150, "unit": "g" },
      { "name": "rice", "quantity": 100, "unit": "g" },
      { "name": "soy sauce", "quantity": 15, "unit": "ml" },
      { "name": "ginger", "quantity": 2, "unit": "g" }
    ],
    "recipe": [
      "Sauté beef with ginger/soy.",
      "Steam broccoli, serve over rice."
    ]
  },
  {
    "mealName": "Grilled Chicken & Sweet Potato",
    "calories": 580,
    "macroRatio": {
      "protein": 0.33,
      "carbs": 0.37,
      "fats": 0.30
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "chicken breast", "quantity": 150, "unit": "g" },
      { "name": "sweet potato", "quantity": 1, "singular": "sweet potato", "plural": "sweet potatoes", "wholeItem": true },
      { "name": "broccoli", "quantity": 90, "unit": "g" },
      { "name": "olive oil", "quantity": 15, "unit": "ml" }
    ],
    "recipe": [
      "Grill chicken, season.",
      "Roast sweet potato, steam broccoli."
    ]
  },
  {
    "mealName": "Whole Wheat Pasta & Turkey Meatballs",
    "calories": 680,
    "macroRatio": {
      "protein": 0.29,
      "carbs": 0.47,
      "fats": 0.24
    },
    "category": "Dinner",
    "dietaryPhase": ["surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      { "name": "turkey meatballs", "quantity": 100, "unit": "g" },
      { "name": "whole wheat pasta", "quantity": 150, "unit": "g" },
      { "name": "tomato sauce", "quantity": 125, "unit": "ml" },
      { "name": "grated cheese", "quantity": 15, "unit": "g" }
    ],
    "recipe": [
      "Cook pasta, simmer meatballs in sauce.",
      "Serve with cheese on top."
    ]
  },
  {
    "mealName": "Baked Cod & Veggies",
    "calories": 520,
    "macroRatio": {
      "protein": 0.33,
      "carbs": 0.25,
      "fats": 0.42
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "cod fillet", "quantity": 150, "unit": "g" },
      { "name": "zucchini", "quantity": 80, "unit": "g" },
      { "name": "peppers", "quantity": 80, "unit": "g" },
      { "name": "olive oil", "quantity": 15, "unit": "ml" },
      { "name": "lemon juice", "quantity": 15, "unit": "ml" }
    ],
    "recipe": [
      "Bake cod with veggies.",
      "Season with oil, lemon, salt."
    ]
  },
  {
    "mealName": "Ground Beef & Sweet Potato Skillet",
    "calories": 640,
    "macroRatio": {
      "protein": 0.25,
      "carbs": 0.35,
      "fats": 0.40
    },
    "category": "Dinner",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "lean ground beef", "quantity": 150, "unit": "g" },
      { "name": "sweet potato", "quantity": 1, "singular": "sweet potato", "plural": "sweet potatoes", "wholeItem": true },
      { "name": "onion", "quantity": 50, "unit": "g" },
      { "name": "peppers", "quantity": 50, "unit": "g" },
      { "name": "seasonings", "quantity": 2, "unit": "g" }
    ],
    "recipe": [
      "Brown beef, add sweet potato and veggies.",
      "Cook until tender."
    ]
  },
  {
    "mealName": "Turkey Chili & Brown Rice",
    "calories": 600,
    "macroRatio": {
      "protein": 0.32,
      "carbs": 0.44,
      "fats": 0.24
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "ground turkey", "quantity": 150, "unit": "g" },
      { "name": "kidney beans", "quantity": 125, "unit": "g" },
      { "name": "tomato sauce", "quantity": 125, "unit": "ml" },
      { "name": "brown rice", "quantity": 100, "unit": "g" }
    ],
    "recipe": [
      "Cook turkey, add beans & sauce.",
      "Simmer, serve over rice."
    ]
  },
  {
    "mealName": "Chicken Fajita Bowl",
    "calories": 590,
    "macroRatio": {
      "protein": 0.31,
      "carbs": 0.41,
      "fats": 0.28
    },
    "category": "Dinner",
    "dietaryPhase": ["surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "chicken", "quantity": 150, "unit": "g" },
      { "name": "bell peppers", "quantity": 75, "unit": "g" },
      { "name": "onions", "quantity": 50, "unit": "g" },
      { "name": "fajita seasoning", "quantity": 3, "unit": "g" },
      { "name": "rice", "quantity": 100, "unit": "g" }
    ],
    "recipe": [
      "Sauté chicken & peppers with seasoning.",
      "Serve over rice."
    ]
  },
  {
    "mealName": "Pesto Salmon & Whole Wheat Pasta",
    "calories": 660,
    "macroRatio": {
      "protein": 0.29,
      "carbs": 0.43,
      "fats": 0.28
    },
    "category": "Dinner",
    "dietaryPhase": ["surplusPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      { "name": "salmon", "quantity": 150, "unit": "g" },
      { "name": "whole wheat pasta", "quantity": 150, "unit": "g" },
      { "name": "pesto", "quantity": 30, "unit": "ml" },
      { "name": "cherry tomatoes", "quantity": 80, "unit": "g" }
    ],
    "recipe": [
      "Bake salmon, boil pasta.",
      "Toss pasta with pesto, top with salmon."
    ]
  },
  {
    "mealName": "Chicken & Veggie Curry",
    "calories": 600,
    "macroRatio": {
      "protein": 0.27,
      "carbs": 0.47,
      "fats": 0.26
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "chicken", "quantity": 150, "unit": "g" },
      { "name": "curry sauce", "quantity": 125, "unit": "ml" },
      { "name": "mixed veggies", "quantity": 150, "unit": "g" },
      { "name": "rice", "quantity": 100, "unit": "g" }
    ],
    "recipe": [
      "Cook chicken in curry sauce with veggies.",
      "Serve with rice."
    ]
  },
  {
    "mealName": "Shrimp Scampi with Zucchini Noodles",
    "calories": 550,
    "macroRatio": {
      "protein": 0.35,
      "carbs": 0.30,
      "fats": 0.35
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Pescatarian"],
    "allergens": ["Shellfish"],
    "ingredients": [
      { "name": "shrimp", "quantity": 150, "unit": "g" },
      { "name": "zucchini noodles", "quantity": 200, "unit": "g" },
      { "name": "garlic", "quantity": 2, "unit": "g" },
      { "name": "olive oil", "quantity": 15, "unit": "ml" },
      { "name": "lemon juice", "quantity": 15, "unit": "ml" },
      { "name": "parsley", "quantity": 5, "unit": "g" }
    ],
    "recipe": [
      "Sauté garlic in olive oil and add shrimp until pink.",
      "Toss with zucchini noodles and lemon juice.",
      "Garnish with parsley."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Vegetable Stir-Fry with Tofu and Rice",
    "calories": 600,
    "macroRatio": {
      "protein": 0.25,
      "carbs": 0.50,
      "fats": 0.25
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Vegan", "Vegetarian"],
    "allergens": ["Soy"],
    "ingredients": [
      { "name": "tofu", "quantity": 150, "unit": "g" },
      { "name": "mixed vegetables", "quantity": 200, "unit": "g" },
      { "name": "brown rice", "quantity": 100, "unit": "g" },
      { "name": "soy sauce", "quantity": 15, "unit": "ml" },
      { "name": "sesame oil", "quantity": 10, "unit": "ml" },
      { "name": "garlic", "quantity": 2, "unit": "g" }
    ],
    "recipe": [
      "Stir-fry tofu and vegetables in sesame oil with garlic.",
      "Serve over brown rice with a drizzle of soy sauce."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Pesto Chicken with Quinoa",
    "calories": 650,
    "macroRatio": {
      "protein": 0.35,
      "carbs": 0.40,
      "fats": 0.25
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": ["Dairy"],
    "ingredients": [
      { "name": "chicken breast", "quantity": 150, "unit": "g" },
      { "name": "quinoa", "quantity": 100, "unit": "g" },
      { "name": "pesto", "quantity": 30, "unit": "ml" },
      { "name": "cherry tomatoes", "quantity": 80, "unit": "g" }
    ],
    "recipe": [
      "Grill chicken and slice it.",
      "Toss with cooked quinoa, pesto, and cherry tomatoes."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Lentil Soup with Whole Wheat Bread",
    "calories": 500,
    "macroRatio": {
      "protein": 0.20,
      "carbs": 0.60,
      "fats": 0.20
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Vegan", "Vegetarian"],
    "allergens": [],
    "ingredients": [
      { "name": "lentils", "quantity": 150, "unit": "g" },
      { "name": "diced tomatoes", "quantity": 125, "unit": "g" },
      { "name": "carrots", "quantity": 80, "unit": "g" },
      { "name": "celery", "quantity": 50, "unit": "g" },
      { "name": "onion", "quantity": 50, "unit": "g" },
      { "name": "vegetable broth", "quantity": 500, "unit": "ml" },
      { "name": "whole wheat bread", "quantity": 1, "singular": "slice", "plural": "slices", "wholeItem": true }
    ],
    "recipe": [
      "Simmer lentils with vegetables in broth until tender.",
      "Serve with a slice of whole wheat bread."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Stuffed Bell Peppers with Ground Turkey",
    "calories": 680,
    "macroRatio": {
      "protein": 0.35,
      "carbs": 0.45,
      "fats": 0.20
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "bell pepper", "quantity": 2, "singular": "pepper", "plural": "peppers", "wholeItem": true },
      { "name": "ground turkey", "quantity": 150, "unit": "g" },
      { "name": "quinoa", "quantity": 80, "unit": "g" },
      { "name": "diced tomatoes", "quantity": 125, "unit": "g" },
      { "name": "onion", "quantity": 50, "unit": "g" }
    ],
    "recipe": [
      "Halve bell peppers and stuff with a mix of ground turkey, quinoa, tomatoes, and onion.",
      "Bake until peppers are tender."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Baked Tilapia with Steamed Asparagus",
    "calories": 550,
    "macroRatio": {
      "protein": 0.35,
      "carbs": 0.30,
      "fats": 0.35
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Pescatarian"],
    "allergens": ["Fish"],
    "ingredients": [
      { "name": "tilapia fillet", "quantity": 150, "unit": "g" },
      { "name": "asparagus", "quantity": 100, "unit": "g" },
      { "name": "olive oil", "quantity": 15, "unit": "ml" },
      { "name": "lemon", "quantity": 1, "singular": "lemon", "plural": "lemons", "wholeItem": true }
    ],
    "recipe": [
      "Bake tilapia with olive oil and lemon.",
      "Steam asparagus and serve together."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Vegetable Pasta Primavera",
    "calories": 630,
    "macroRatio": {
      "protein": 0.20,
      "carbs": 0.60,
      "fats": 0.20
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Vegetarian"],
    "allergens": ["Gluten", "Dairy"],
    "ingredients": [
      { "name": "whole wheat pasta", "quantity": 150, "unit": "g" },
      { "name": "mixed vegetables", "quantity": 150, "unit": "g" },
      { "name": "olive oil", "quantity": 15, "unit": "ml" },
      { "name": "Parmesan cheese", "quantity": 15, "unit": "g" }
    ],
    "recipe": [
      "Boil pasta and sauté vegetables in olive oil.",
      "Toss together with Parmesan cheese."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Slow Cooker Beef Stew",
    "calories": 700,
    "macroRatio": {
      "protein": 0.30,
      "carbs": 0.40,
      "fats": 0.30
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["No Restrictions"],
    "allergens": [],
    "ingredients": [
      { "name": "beef stew meat", "quantity": 200, "unit": "g" },
      { "name": "potatoes", "quantity": 150, "unit": "g" },
      { "name": "carrots", "quantity": 80, "unit": "g" },
      { "name": "celery", "quantity": 50, "unit": "g" },
      { "name": "beef broth", "quantity": 500, "unit": "ml" },
      { "name": "tomato paste", "quantity": 30, "unit": "g" }
    ],
    "recipe": [
      "Combine beef, vegetables, broth, and tomato paste in a slow cooker.",
      "Cook on low until tender."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Shrimp Fried Rice",
    "calories": 640,
    "macroRatio": {
      "protein": 0.30,
      "carbs": 0.45,
      "fats": 0.25
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Pescatarian"],
    "allergens": ["Shellfish"],
    "ingredients": [
      { "name": "shrimp", "quantity": 150, "unit": "g" },
      { "name": "rice", "quantity": 150, "unit": "g" },
      { "name": "mixed vegetables", "quantity": 100, "unit": "g" },
      { "name": "soy sauce", "quantity": 15, "unit": "ml" },
      { "name": "egg", "quantity": 1, "singular": "egg", "plural": "eggs", "wholeItem": true },
      { "name": "sesame oil", "quantity": 10, "unit": "ml" }
    ],
    "recipe": [
      "Stir-fry shrimp, vegetables, and egg.",
      "Add rice and soy sauce, then finish with sesame oil."
    ],
    "mealNotes": []
  },
  {
    "mealName": "Eggplant Parmesan",
    "calories": 680,
    "macroRatio": {
      "protein": 0.25,
      "carbs": 0.45,
      "fats": 0.30
    },
    "category": "Dinner",
    "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
    "portionSize": 1.0,
    "dietaryRestrictions": ["Vegetarian"],
    "allergens": ["Dairy", "Gluten"],
    "ingredients": [
      { "name": "eggplant", "quantity": 1, "singular": "eggplant", "plural": "eggplants", "wholeItem": true },
      { "name": "marinara sauce", "quantity": 200, "unit": "ml" },
      { "name": "mozzarella cheese", "quantity": 60, "unit": "g" },
      { "name": "Parmesan cheese", "quantity": 15, "unit": "g" },
      { "name": "whole wheat breadcrumbs", "quantity": 40, "unit": "g" }
    ],
    "recipe": [
      "Slice eggplant and layer with marinara and cheeses.",
      "Bake until bubbly."
    ],
    "mealNotes": []
  },  
  
  // --------------------
  // (D) 10 SNACKS
  // --------------------
    {
      "mealName": "Apple Slices & Almond Butter",
      "calories": 220,
      "macroRatio": {
        "protein": 0.11,
        "carbs": 0.50,
        "fats": 0.39
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts"],
      "ingredients": [
        {
          "name": "apple",
          "quantity": 1,
          "singular": "apple",
          "plural": "apples",
          "wholeItem": true
        },
        {
          "name": "almond butter",
          "quantity": 16,
          "unit": "g"
        }
      ],
      "recipe": [
        "Slice apple, spread almond butter."
      ],
      "mealNotes": ["A crunchy and nutritious snack."]
    },
    {
      "mealName": "Greek Yogurt Parfait",
      "calories": 400,
      "macroRatio": {
        "protein": 0.23,
        "carbs": 0.51,
        "fats": 0.26
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Dairy"],
      "ingredients": [
        {
          "name": "Greek yogurt",
          "quantity": 150,
          "unit": "g"
        },
        {
          "name": "granola",
          "quantity": 30,
          "unit": "g"
        },
        {
          "name": "mixed berries",
          "quantity": 50,
          "unit": "g"
        }
      ],
      "recipe": [
        "Layer yogurt, granola, and berries.",
        "Serve immediately."
      ],
      "mealNotes": ["Drizzle honey for added sweetness."]
    },
    {
      "mealName": "Peanut Butter Banana Toast",
      "calories": 400,
      "macroRatio": {
        "protein": 0.15,
        "carbs": 0.51,
        "fats": 0.34
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Gluten", "Peanuts"],
      "ingredients": [
        {
          "name": "whole grain bread",
          "quantity": 1,
          "singular": "slice",
          "plural": "slices",
          "wholeItem": true
        },
        {
          "name": "peanut butter",
          "quantity": 16,
          "unit": "g"
        },
        {
          "name": "banana",
          "quantity": 0.5,
          "singular": "banana",
          "plural": "bananas",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Toast bread, spread peanut butter.",
        "Top with banana slices."
      ],
      "mealNotes": ["Sprinkle chia seeds for extra crunch."]
    },
    {
      "mealName": "Hummus & Carrot Sticks",
      "calories": 180,
      "macroRatio": {
        "protein": 0.11,
        "carbs": 0.44,
        "fats": 0.45
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "hummus",
          "quantity": 40,
          "unit": "g"
        },
        {
          "name": "carrot sticks",
          "quantity": 60,
          "unit": "g"
        }
      ],
      "recipe": [
        "Dip carrot sticks in hummus."
      ],
      "mealNotes": ["A great fiber-rich snack."]
    },
    {
      "mealName": "Rice Cakes & Peanut Butter",
      "calories": 230,
      "macroRatio": {
        "protein": 0.13,
        "carbs": 0.42,
        "fats": 0.45
      },
      "category": "Snack",
      "dietaryPhase": ["surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": ["Nuts"],
      "ingredients": [
        {
          "name": "rice cakes",
          "quantity": 2,
          "singular": "rice cake",
          "plural": "rice cakes",
          "wholeItem": true
        },
        {
          "name": "peanut butter",
          "quantity": 16,
          "unit": "g"
        }
      ],
      "recipe": [
        "Spread peanut butter on rice cakes."
      ],
      "mealNotes": ["A crunchy and satisfying snack."]
    },
    {
      "mealName": "Protein Bar (Homemade or Store-Bought)",
      "calories": 250,
      "macroRatio": {
        "protein": 0.32,
        "carbs": 0.32,
        "fats": 0.36
      },
      "category": "Snack",
      "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
      "portionSize": 1.0,
      "dietaryRestrictions": ["No Restrictions"],
      "allergens": [],
      "ingredients": [
        {
          "name": "protein bar",
          "quantity": 1,
          "singular": "bar",
          "plural": "bars",
          "wholeItem": true
        }
      ],
      "recipe": [
        "Enjoy as a quick snack."
      ],
      "mealNotes": ["Great for on-the-go."]
    },
      {
        "mealName": "Mixed Berries & Low-Fat Cottage Cheese",
        "calories": 220,
        "macroRatio": {
          "protein": 0.32,
          "carbs": 0.43,
          "fats": 0.25
        },
        "category": "Snack",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Dairy"],
        "ingredients": [
          {
            "name": "cottage cheese",
            "quantity": 100,
            "unit": "g"
          },
          {
            "name": "mixed berries",
            "quantity": 75,
            "unit": "g"
          }
        ],
        "recipe": [
          "Combine in a bowl, serve."
        ],
        "mealNotes": ["Refreshing and protein-packed!"]
      },
      {
        "mealName": "Whole Grain Crackers & Cheese",
        "calories": 260,
        "macroRatio": {
          "protein": 0.19,
          "carbs": 0.46,
          "fats": 0.35
        },
        "category": "Snack",
        "dietaryPhase": ["surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Dairy"],
        "ingredients": [
          {
            "name": "whole grain crackers",
            "quantity": 4,
            "singular": "cracker",
            "plural": "crackers",
            "wholeItem": true
          },
          {
            "name": "cheese",
            "quantity": 30,
            "unit": "g"
          }
        ],
        "recipe": [
          "Top crackers with sliced cheese."
        ],
        "mealNotes": ["A simple and satisfying snack."]
      },
      {
        "mealName": "Almonds & Dark Chocolate Chips",
        "calories": 300,
        "macroRatio": {
          "protein": 0.10,
          "carbs": 0.31,
          "fats": 0.59
        },
        "category": "Snack",
        "dietaryPhase": ["surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Nuts"],
        "ingredients": [
          {
            "name": "almonds",
            "quantity": 20,
            "unit": "g"
          },
          {
            "name": "dark chocolate chips",
            "quantity": 10,
            "unit": "g"
          }
        ],
        "recipe": [
          "Combine in a small bowl."
        ],
        "mealNotes": ["A great sweet and crunchy combo!"]
      },
      {
        "mealName": "Overnight Oats with Chia & Almond Butter",
        "calories": 530,
        "macroRatio": {
          "protein": 0.31,
          "carbs": 0.45,
          "fats": 0.24
        },
        "category": "Breakfast",
        "dietaryPhase": ["surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["Vegetarian"],
        "allergens": ["Nuts"],
        "ingredients": [
          {
            "name": "rolled oats",
            "quantity": 40,
            "unit": "g"
          },
          {
            "name": "chia seeds",
            "quantity": 10,
            "unit": "g"
          },
          {
            "name": "almond milk",
            "quantity": 250,
            "unit": "ml"
          },
          {
            "name": "almond butter",
            "quantity": 16,
            "unit": "g"
          },
          {
            "name": "honey",
            "quantity": 7,
            "unit": "g"
          }
        ],
        "recipe": [
          "Mix oats, chia seeds, and almond milk in a container.",
          "Refrigerate overnight.",
          "Top with almond butter and honey before serving."
        ],
        "mealNotes": ["Perfect for busy mornings!"]
      },
      {
        "mealName": "Greek Yogurt & Mixed Berries",
        "calories": 320,
        "macroRatio": {
          "protein": 0.33,
          "carbs": 0.52,
          "fats": 0.15
        },
        "category": "Breakfast",
        "dietaryPhase": ["deficitPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Dairy"],
        "ingredients": [
          {
            "name": "Greek yogurt",
            "quantity": 200,
            "unit": "g"
          },
          {
            "name": "mixed berries",
            "quantity": 75,
            "unit": "g"
          },
          {
            "name": "honey",
            "quantity": 7,
            "unit": "g"
          },
          {
            "name": "chia seeds",
            "quantity": 10,
            "unit": "g"
          }
        ],
        "recipe": [
          "Mix Greek yogurt with honey.",
          "Top with mixed berries and chia seeds."
        ],
        "mealNotes": ["A nutritious and filling snack!"]
      },
      {
        "mealName": "Grilled Chicken Salad",
        "calories": 500,
        "macroRatio": {
          "protein": 0.38,
          "carbs": 0.34,
          "fats": 0.28
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          {
            "name": "grilled chicken breast",
            "quantity": 150,
            "unit": "g"
          },
          {
            "name": "mixed greens",
            "quantity": 80,
            "unit": "g"
          },
          {
            "name": "avocado",
            "quantity": 50,
            "unit": "g"
          },
          {
            "name": "balsamic dressing",
            "quantity": 10,
            "unit": "g"
          },
          {
            "name": "cherry tomatoes",
            "quantity": 50,
            "unit": "g"
          }
        ],
        "recipe": [
          "Grill chicken breast until golden brown.",
          "Toss mixed greens, avocado, and tomatoes with dressing.",
          "Slice chicken and serve on top."
        ],
        "mealNotes": ["A clean and protein-rich meal!"]
      },    
      {
        "mealName": "Quinoa & Black Bean Bowl",
        "calories": 550,
        "macroRatio": {
          "protein": 0.27,
          "carbs": 0.55,
          "fats": 0.18
        },
        "category": "Lunch",
        "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["Vegan", "Vegetarian"],
        "allergens": [],
        "ingredients": [
          { "name": "quinoa", "quantity": 90, "unit": "g" },
          { "name": "black beans", "quantity": 85, "unit": "g" },
          { "name": "diced bell peppers", "quantity": 75, "unit": "g" },
          { "name": "olive oil", "quantity": 15, "unit": "ml" },
          { "name": "salt and pepper", "quantity": 1, "unit": "g" }
        ],
        "recipe": [
          "Cook quinoa per instructions.",
          "Sauté bell peppers in olive oil.",
          "Mix with black beans and season."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Baked Salmon with Quinoa & Veggies",
        "calories": 600,
        "macroRatio": {
          "protein": 0.34,
          "carbs": 0.38,
          "fats": 0.28
        },
        "category": "Dinner",
        "dietaryPhase": ["surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["Pescatarian"],
        "allergens": [],
        "ingredients": [
          { "name": "salmon fillet", "quantity": 150, "unit": "g" },
          { "name": "quinoa", "quantity": 90, "unit": "g" },
          { "name": "steamed broccoli", "quantity": 150, "unit": "g" },
          { "name": "olive oil", "quantity": 15, "unit": "ml" },
          { "name": "lemon juice", "quantity": 15, "unit": "ml" }
        ],
        "recipe": [
          "Season salmon and bake at 180°C for 15-20 min.",
          "Cook quinoa, steam broccoli.",
          "Serve together."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Lean Turkey & Brown Rice Bowl",
        "calories": 620,
        "macroRatio": {
          "protein": 0.39,
          "carbs": 0.42,
          "fats": 0.19
        },
        "category": "Dinner",
        "dietaryPhase": ["surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": [],
        "ingredients": [
          { "name": "lean ground turkey", "quantity": 150, "unit": "g" },
          { "name": "brown rice", "quantity": 100, "unit": "g" },
          { "name": "spinach", "quantity": 15, "unit": "g" },
          { "name": "garlic powder", "quantity": 3, "unit": "g" },
          { "name": "olive oil", "quantity": 15, "unit": "ml" }
        ],
        "recipe": [
          "Cook brown rice.",
          "Sauté turkey with garlic powder.",
          "Steam spinach and serve."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Banana & Peanut Butter Protein Shake",
        "calories": 350,
        "macroRatio": {
          "protein": 0.32,
          "carbs": 0.43,
          "fats": 0.25
        },
        "category": "Snack",
        "dietaryPhase": ["surplusPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Nuts", "Soy"],
        "ingredients": [
          { "name": "whey protein", "quantity": 30, "unit": "g" },
          { "name": "banana", "quantity": 1, "singular": "banana", "plural": "bananas", "wholeItem": true },
          { "name": "almond milk", "quantity": 250, "unit": "ml" },
          { "name": "peanut butter", "quantity": 16, "unit": "g" }
        ],
        "recipe": [
          "Blend all until smooth."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Cottage Cheese with Almonds & Honey",
        "calories": 280,
        "macroRatio": {
          "protein": 0.37,
          "carbs": 0.37,
          "fats": 0.26
        },
        "category": "Snack",
        "dietaryPhase": ["deficitPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Dairy", "Nuts"],
        "ingredients": [
          { "name": "cottage cheese", "quantity": 150, "unit": "g" },
          { "name": "honey", "quantity": 21, "unit": "g" },
          { "name": "almonds", "quantity": 12, "unit": "g" }
        ],
        "recipe": [
          "Mix honey into cottage cheese.",
          "Top with almonds."
        ],
        "mealNotes": []
      },
      {
        "mealName": "Dark Chocolate & Mixed Nuts",
        "calories": 300,
        "macroRatio": {
          "protein": 0.13,
          "carbs": 0.25,
          "fats": 0.62
        },
        "category": "Snack",
        "dietaryPhase": ["surplusPhase", "deloadPhase"],
        "portionSize": 1.0,
        "dietaryRestrictions": ["No Restrictions"],
        "allergens": ["Nuts"],
        "ingredients": [
          { "name": "dark chocolate", "quantity": 30, "unit": "g" },
          { "name": "mixed nuts", "quantity": 28, "unit": "g" }
        ],
        "recipe": [
          "Serve as a snack."
        ],
        "mealNotes": []
      },      
    {
  "mealName": "Beef Jerky & Grapes",
  "calories": 220,
  "macroRatio": {
    "protein": 0.41,
    "carbs": 0.31,
    "fats": 0.28
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "surplusPhase", "deloadPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": [],
  "ingredients": [
    { "name": "beef jerky", "quantity": 30, "unit": "g" },
    { "name": "grapes", "quantity": 75, "unit": "g" }
  ],
  "recipe": [
    "Enjoy together."
  ],
  "mealNotes": []
},
{
  "mealName": "Greek Yogurt & Honey",
  "calories": 200,
  "macroRatio": {
    "protein": 0.31,
    "carbs": 0.51,
    "fats": 0.18
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    { "name": "Greek yogurt", "quantity": 245, "unit": "g" },
    { "name": "honey", "quantity": 7, "unit": "g" }
  ],
  "recipe": [
    "Mix Greek yogurt and honey in a bowl."
  ],
  "mealNotes": []
},
{
  "mealName": "Cottage Cheese & Pineapple",
  "calories": 220,
  "macroRatio": {
    "protein": 0.35,
    "carbs": 0.53,
    "fats": 0.12
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    { "name": "cottage cheese", "quantity": 150, "unit": "g" },
    { "name": "pineapple chunks", "quantity": 80, "unit": "g" }
  ],
  "recipe": [
    "Combine cottage cheese and pineapple in a bowl."
  ],
  "mealNotes": []
},
{
  "mealName": "Peanut Butter Banana Toast",
  "calories": 250,
  "macroRatio": {
    "protein": 0.16,
    "carbs": 0.55,
    "fats": 0.29
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Peanuts", "Gluten"],
  "ingredients": [
    { "name": "whole wheat bread", "quantity": 1, "singular": "slice", "plural": "slices", "wholeItem": true },
    { "name": "peanut butter", "quantity": 16, "unit": "g" },
    { "name": "banana", "quantity": 0.5, "singular": "banana", "plural": "bananas", "wholeItem": true }
  ],
  "recipe": [
    "Toast the bread.",
    "Spread peanut butter and top with banana slices."
  ],
  "mealNotes": []
},
{
  "mealName": "Hummus & Veggie Sticks",
  "calories": 180,
  "macroRatio": {
    "protein": 0.15,
    "carbs": 0.47,
    "fats": 0.38
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegan", "Vegetarian"],
  "allergens": ["None"],
  "ingredients": [
    { "name": "hummus", "quantity": 60, "unit": "g" },
    { "name": "carrot sticks", "quantity": 50, "unit": "g" },
    { "name": "cucumber sticks", "quantity": 50, "unit": "g" }
  ],
  "recipe": [
    "Serve hummus with fresh veggie sticks."
  ],
  "mealNotes": []
},
{
  "mealName": "Boiled Eggs & Almonds",
  "calories": 230,
  "macroRatio": {
    "protein": 0.32,
    "carbs": 0.04,
    "fats": 0.64
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Eggs", "Nuts"],
  "ingredients": [
    { "name": "egg", "quantity": 2, "singular": "egg", "plural": "eggs", "wholeItem": true },
    { "name": "almonds", "quantity": 12, "unit": "g" }
  ],
  "recipe": [
    "Boil eggs and serve with almonds."
  ],
  "mealNotes": []
},
{
  "mealName": "Rice Cakes & Almond Butter",
  "calories": 210,
  "macroRatio": {
    "protein": 0.11,
    "carbs": 0.53,
    "fats": 0.36
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegan", "Vegetarian"],
  "allergens": ["Nuts"],
  "ingredients": [
    { "name": "rice cakes", "quantity": 2, "singular": "rice cake", "plural": "rice cakes", "wholeItem": true },
    { "name": "almond butter", "quantity": 16, "unit": "g" }
  ],
  "recipe": [
    "Spread almond butter over rice cakes."
  ],
  "mealNotes": []
},
{
  "mealName": "Cucumber & Tuna Salad",
  "calories": 180,
  "macroRatio": {
    "protein": 0.47,
    "carbs": 0.11,
    "fats": 0.42
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Pescatarian"],
  "allergens": ["Fish"],
  "ingredients": [
    { "name": "tuna", "quantity": 80, "unit": "g" },
    { "name": "chopped cucumber", "quantity": 50, "unit": "g" },
    { "name": "olive oil", "quantity": 15, "unit": "ml" }
  ],
  "recipe": [
    "Mix tuna and cucumber, drizzle with olive oil."
  ],
  "mealNotes": []
},
{
  "mealName": "Protein Shake & Berries",
  "calories": 240,
  "macroRatio": {
    "protein": 0.51,
    "carbs": 0.34,
    "fats": 0.15
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["No Restrictions"],
  "allergens": ["Dairy"],
  "ingredients": [
    { "name": "protein powder", "quantity": 30, "unit": "g" },
    { "name": "almond milk", "quantity": 250, "unit": "ml" },
    { "name": "mixed berries", "quantity": 75, "unit": "g" }
  ],
  "recipe": [
    "Blend protein powder, almond milk, and berries until smooth."
  ],
  "mealNotes": []
},
{
  "mealName": "Dark Chocolate & Walnuts",
  "calories": 230,
  "macroRatio": {
    "protein": 0.08,
    "carbs": 0.25,
    "fats": 0.67
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegan", "Vegetarian"],
  "allergens": ["Nuts"],
  "ingredients": [
    { "name": "dark chocolate", "quantity": 20, "unit": "g" },
    { "name": "walnuts", "quantity": 14, "unit": "g" }
  ],
  "recipe": [
    "Enjoy dark chocolate with walnuts."
  ],
  "mealNotes": []
},
{
  "mealName": "Cinnamon Oat Energy Bites",
  "calories": 190,
  "macroRatio": {
    "protein": 0.12,
    "carbs": 0.56,
    "fats": 0.32
  },
  "category": "Snack",
  "dietaryPhase": ["deficitPhase", "deloadPhase", "surplusPhase"],
  "portionSize": 1.0,
  "dietaryRestrictions": ["Vegan", "Vegetarian"],
  "allergens": ["None"],
  "ingredients": [
    { "name": "oats", "quantity": 40, "unit": "g" },
    { "name": "peanut butter", "quantity": 16, "unit": "g" },
    { "name": "honey", "quantity": 21, "unit": "g" },
    { "name": "cinnamon", "quantity": 1, "unit": "g" }
  ],
  "recipe": [
    "Mix all ingredients, roll into small balls, refrigerate."
  ],
  "mealNotes": []
}
];

function getMealFrequency() {
  // e.g. localStorage might contain "2", "3", or "4", or "2 meals"
  const freqRaw = localStorage.getItem("mealFrequency") || "4";
  // Try parseInt. e.g. parseInt("3 meals", 10) => 3
  const freq = parseInt(freqRaw, 10);
  if (freq === 2 || freq === 3 || freq === 4) {
    return freq;
  }
  return 4; // fallback
}

// For debugging if “mealFrequency” never got stored properly
function debugCheckMealFreq() {
  const raw = localStorage.getItem("mealFrequency");
  console.log("DEBUG: localStorage mealFrequency=", raw, " => parsed=", getMealFrequency());
}

function calculateMacros(totalCals, macroRatio) {
  // standard: 4 kcal/g for protein, 4 kcal/g carbs, 9 kcal/g fats
  const p = Math.round((totalCals * (macroRatio.protein || 0)) / 4);
  const c = Math.round((totalCals * (macroRatio.carbs   || 0)) / 4);
  const f = Math.round((totalCals * (macroRatio.fats    || 0)) / 9);
  return { protein: p, carbs: c, fats: f };
}

function scaleIngredient(ingredient, multiplier) {
  let newQuantity = ingredient.quantity * multiplier;

  // 1) Decide if this is a whole-item ingredient (e.g., “eggs”).
  //    If wholeItem = true, the final integer must be at least 1.
  if (ingredient.wholeItem) {
    newQuantity = Math.round(newQuantity);
    if (newQuantity < 1) {
      newQuantity = 1; // Minimum 1 whole item
    }
  } else {
    // 2) For weight- or volume-based ingredients:
    //    - If ingredient.unit === "g" or "ml", enforce min of 1g/ml
    //    - Otherwise, fallback to your existing logic
    newQuantity = newQuantity >= 0 ? newQuantity : 0;

    // If specified in the meal database:
    //   "unit": "g" or "unit": "ml"
    const u = (ingredient.unit || "").toLowerCase();
    if (u === "g" || u === "ml") {
      // Force a 1g or 1ml minimum
      if (newQuantity < 1) {
        newQuantity = 1;
      } else {
        // Then do your "tiered" rounding if you want to keep that.
        if (newQuantity >= 50) {
          // nearest 5g
          newQuantity = Math.round(newQuantity / 5) * 5;
        } else if (newQuantity >= 5) {
          // nearest 1g
          newQuantity = Math.round(newQuantity);
        } else {
          // nearest 0.25g
          newQuantity = Math.round(newQuantity * 4) / 4;
        }
      }
    } else {
      // If no .unit or a unit that isn't g/ml,
      // use the tiered rounding or anything else you prefer:
      if (newQuantity >= 50) {
        newQuantity = Math.round(newQuantity / 5) * 5;
      } else if (newQuantity >= 5) {
        newQuantity = Math.round(newQuantity);
      } else {
        newQuantity = Math.round(newQuantity * 4) / 4;
      }
      // If you want a generic min 1 for *all* non-whole items, you could do:
      // if (newQuantity < 1) {
      //   newQuantity = 1;
      // }
    }
  }

  // Return the updated object
  return {
    ...ingredient,
    quantity: newQuantity
  };
}

function pickMealForCategory(category, mealTarget, database) {
  const lowerBound = 0.9 * mealTarget;
  const upperBound = 1.1 * mealTarget;

  console.log(`\n[pickMealForCategory] Cat=${category} target=${mealTarget}, range=[${Math.round(lowerBound)}..${Math.round(upperBound)}]`);

  // filter
  const possibleMeals = database.filter(m => {
    if (!m.category || m.category.toLowerCase() !== category.toLowerCase()) return false;
    // If the meal's base cals are in [0.9..1.1] × mealTarget
    return (m.calories >= lowerBound && m.calories <= upperBound);
  });

  console.log(`  -> Found ${possibleMeals.length} possible meal(s) for "${category}"`, possibleMeals.map(m=>m.mealName));

  if (!possibleMeals.length) {
    console.warn(`No ${category} meal found in ±10% range for target ${mealTarget}`);
    return null;
  }

  // pick random
  const rndIndex = Math.floor(Math.random() * possibleMeals.length);
  const chosen = possibleMeals[rndIndex];

  // scale to exactly the mealTarget (within 0.9..1.1 clamp)
  const scaledMeal = portionScaleMeal(chosen, mealTarget);
  return scaledMeal;
}

function portionScaleMeal(meal, newCalorieTarget) {
  console.log("\n--- portionScaleMeal START ---");
  console.log("Original Meal:", meal.mealName);

  // 1) If the meal’s current .calories is X, 
  //    the scale factor = newCalorieTarget / X
  const baseCals = meal.calories;
  const rawScale = newCalorieTarget / baseCals;

  // Constrain to 0.9..1.1 or your chosen range
  const portionMultiplier = Math.max(0.9, Math.min(1.1, rawScale));
  console.log(`Target cals=${newCalorieTarget}, base cals=${baseCals}, rawScale=${rawScale.toFixed(3)}, final multiplier=${portionMultiplier.toFixed(2)}`);

  // 2) Recompute the "actual" final total cals 
  //    after we clamp the portionMultiplier:
  const finalCals = Math.round(baseCals * portionMultiplier);

  // 3) Recompute macros from macroRatio * finalCals
  const macrosObj = calculateMacros(finalCals, meal.macroRatio);

  console.log("New totalCals:", finalCals, " => macros:", macrosObj);

  // 4) Scale the portionSize
  const newPortionSize = parseFloat((meal.portionSize * portionMultiplier).toFixed(2));
  console.log("Old portionSize=", meal.portionSize, " => new portionSize=", newPortionSize);

  // 5) Scale each ingredient
  const updatedIngredients = meal.ingredients.map(origIng => {
    const scaled = scaleIngredient(origIng, portionMultiplier);
    console.log(`  Ingredient "${origIng.name}" => old qty=${origIng.quantity} new qty=${scaled.quantity}`);
    return scaled;
  });

  // 6) Return a brand-new meal object with updated cals, macros, ingredients, portionSize
  const updatedMeal = {
    ...meal,
    calories: finalCals,
    protein: macrosObj.protein,
    carbs: macrosObj.carbs,
    fats: macrosObj.fats,
    portionSize: newPortionSize,
    ingredients: updatedIngredients
  };

  console.log("--- portionScaleMeal END ---\n");
  return updatedMeal;
}

// (B) FOOTER LOGIC
function createIntroFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-intro";
  footerDiv.innerHTML = `
      <div class="footer-left">
        <a href="contact-us.html" class="contact-link">Need Help?</a>
      </div>
      <div class="footer-center">
        <a href="https://instagram.com" target="_blank">
          <img src="src/images/instagram-icon.png" alt="Instagram" class="social-icon-lg"/>
        </a>
        <a href="https://youtube.com" target="_blank">
          <img src="src/images/youtube-icon.png" alt="YouTube" class="social-icon-lg"/>
        </a>
        <a href="https://facebook.com" target="_blank">
          <img src="src/images/facebook-icon.png" alt="Facebook" class="social-icon-lg"/>
        </a>
      </div>
      <div class="footer-right">
        <span class="page-number">${pageNum} / ${totalPages}</span>
      </div>
    `;
  return footerDiv;
}

function createMainFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-main";
  footerDiv.innerHTML = `
      <div class="footer-left"></div>
      <div class="footer-center"></div>
      <div class="footer-right">
        <span class="page-number">${pageNum} / ${totalPages}</span>
      </div>
    `;
  return footerDiv;
}

function addPageNumbers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pages = container.querySelectorAll(".pdf-page");
  const total = pages.length;

  // 1) Identify if it's one of the Meal Plan PDFs or one of the Workout PDFs
  const isMealPlanPDF = [
    "pdf12MealPlanFoundation",
    "pdf12MealPlanHypertrophy",
    "pdf12MealPlanStrength"
  ].includes(containerId);

  const isWorkoutPDF = [
    "pdf12WeekWorkoutFoundation",
    "pdf12WeekWorkoutHypertrophy",
    "pdf12WeekWorkoutStrength"
  ].includes(containerId);

  pages.forEach((pg, idx) => {
    // Remove any existing footer
    const oldFooter = pg.querySelector(".footer");
    if (oldFooter) oldFooter.remove();

    // Skip the cover page (idx===0), any .no-footer, or navigation pages
    if (pg.classList.contains("no-footer") || idx === 0) {
      return;
    }
    const skipNavIDs = [
      "pdf12FoundationNavPage",
      "pdf12HypertrophyNavPage",
      "pdf12StrengthNavPage",
      "pdf12NutritionNavPage",
      "pdf12MealPlanFoundationNavPage",
      "pdf12MealPlanHypertrophyNavPage",
      "pdf12MealPlanStrengthNavPage"
    ];
    if (skipNavIDs.includes(pg.id)) {
      return;
    }

    // Determine if it's an intro page vs. main
    const headingEl = pg.querySelector(".page-heading");
    const headingText = headingEl ? headingEl.textContent.toLowerCase() : "";
    const introKeys = [
      "introduction",
      "your workout guide",
      "client profile",
      "your nutrition guide"
    ];
    let isIntroPage = false;
    introKeys.forEach(k => {
      if (headingText.includes(k)) {
        isIntroPage = true;
      }
    });

    // 2) Build the footer (intro or main) exactly as before
    let newFooter;
    if (isIntroPage) {
      newFooter = createIntroFooter(idx + 1, total);
    } else {
      // Keep your existing logic for .myw-page, etc.
      if (pg.classList.contains("myw-page")) {
        const footDiv = createMainFooter(idx + 1, total);
        footDiv.style.backgroundColor = "#E6EBF1";
        footDiv.style.borderTop = "none";
        newFooter = footDiv;
      } else {
        newFooter = createMainFooter(idx + 1, total);
      }
    }

    // 3) Tag the footer as Meal Plan or Workout
    if (isMealPlanPDF) {
      newFooter.classList.add("footer-mealplan");
    } else if (isWorkoutPDF) {
      newFooter.classList.add("footer-workout");
    }

    // 4) Insert the correct link
    //    A) Meal Plan => "Log Your Nutrition"
    if (newFooter.classList.contains("footer-mealplan")) {
      const centerDiv = newFooter.querySelector(".footer-center");
      if (centerDiv) {
        const logLink = document.createElement("a");
        logLink.href = "landing-page.html";
        logLink.className = "footer-log-link";
        logLink.textContent = "Log Your Nutrition";
        centerDiv.appendChild(logLink);
      }
    }

    //    B) Workout => "Log Your Workout", but ONLY on the page with "Resistance Training" & "Post-Workout Cardio"
    else if (newFooter.classList.contains("footer-workout")) {
      const pageText = pg.textContent.toLowerCase();
      if (pageText.includes("resistance training") && pageText.includes("post-workout cardio")) {
        const centerDiv = newFooter.querySelector(".footer-center");
        if (centerDiv) {
          const logLink = document.createElement("a");
          logLink.href = "landing-page.html";
          logLink.className = "footer-log-link";
          logLink.textContent = "Log Your Workout";
          centerDiv.appendChild(logLink);
        }
      }
    }

    // Finally, append the new footer to the page
    pg.appendChild(newFooter);
  });
}

// (C) HELPER: GET USER NAME & GOAL (EXAMPLE)
function getAdjustedUserName() {
  const name = localStorage.getItem("name") || "Your";
  if (name.length < 24) return name;
  const firstWord = name.split(" ")[0];
  if (firstWord.length < 25) {
    return firstWord;
  }
  return "Committed Champion";
}

function capitalizeGoal(goal) {
  if (!goal) return "";
  return goal
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// (D) PLACEHOLDER TEXT
function placeholderIntroText() {
  return `
      <div class="video-placeholder"><p>Video Placeholder</p></div>
<p class="introduction-text">
  <strong>Welcome to your 12-Week Tailored Workout Program!</strong> This program is designed to build lasting strength, endurance, and fitness habits over the next three months.<br><br>

  Unlike quick-fix routines, this structured 12-week plan progressively adapts to your fitness level, ensuring you continue making measurable progress without burnout. Your key health metrics—such as height, weight, and fitness goals—have been used to personalize your daily caloric intake, macronutrient targets, and training structure to support optimal recovery and results.<br><br>

  Over the next 12 weeks, you’ll experience a blend of progressive overload, structured recovery, and tailored nutrition. This approach ensures steady progress while reinforcing long-term sustainability. <br><br>

  Throughout the journey, expert guidance on training, nutrition, and recovery will help you build consistency, prevent plateaus, and keep you motivated.<br><br>

  Expect to see noticeable strength and endurance improvements by Week 4. By Week 8, you'll notice changes in muscle definition and overall fitness levels. By Week 12, you'll have built sustainable habits that can support long-term fitness success.<br><br>

  Let’s commit to these 12 weeks and build a stronger, more resilient you!
</p>
    `;
}

function fillDailyNutritionVars() {
  // Pull the true maintenance from localStorage
  const maint = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  // Apply ±20% to maintenance for deficit and surplus calculations
  const defCals = Math.round(maint * 0.8); // e.g. if maint = 2482 then defCals ≈ 1986
  const surCals = Math.round(maint * 1.2); // e.g. if maint = 2482 then surCals ≈ 2978
  const deloadCals = maint;               // Deload (maintenance) calories

  // Store them in localStorage so the Weekly Calorie table can read them:
  localStorage.setItem("defCalsComputed", defCals.toString());
  localStorage.setItem("surCalsComputed", surCals.toString());
  localStorage.setItem("deloadCalsComputed", deloadCals.toString());

  // Macros – based on maintenance as well:
  const p = Math.round((0.3 * maint) / 4);
  const c = Math.round((0.4 * maint) / 4);
  const f = Math.round((0.3 * maint) / 9);
  const water = localStorage.getItem("programWaterIntake") || "2.5";

  return {
    dailyDeficit: defCals,
    dailySurplus: surCals,
    dailyDeload: deloadCals, // This is now your true maintenance
    protein: p,
    carbs: c,
    fats: f,
    waterIntake: water
  };
}

function buildMYWDynamicPages_12week(containerId, localStorageKey, fromWeek, toWeek, phaseLabel) {
  const wrapper = document.getElementById(containerId);
  if (!wrapper) return 0;
  wrapper.innerHTML = "";

  const stored = localStorage.getItem(localStorageKey);
  if (!stored) return 0;

  let programData = [];
  try {
    programData = JSON.parse(stored);
  } catch (err) {
    console.error("Error parsing 12-week data from localStorage:", err);
    return 0;
  }

  // 1) Filter the program data down to fromWeek..toWeek only
  const relevantWeeks = programData.filter(w => w.week >= fromWeek && w.week <= toWeek);
  if (!relevantWeeks.length) return 0;

  // 2) Collect all "Resistance Training" exercises from these weeks
  const allExercises = [];
  relevantWeeks.forEach(weekObj => {
    (weekObj.days || []).forEach(dayObj => {
      (dayObj.mainWork || []).forEach(block => {
        if (block.blockType === "Resistance Training") {
          block.exercises.forEach(ex => allExercises.push(ex));
        }
      });
    });
  });

  // Remove duplicates by name
  const seen = new Set();
  const unique = [];
  allExercises.forEach(e => {
    if (!seen.has(e.name)) {
      seen.add(e.name);
      unique.push(e);
    }
  });

  // Group by muscle
  const groupMap = {
    chest: [], back: [], shoulders: [], arms: [],
    quads: [], hamstrings: [], calves: [], abs: []
  };
  unique.forEach(ex => {
    let mg = (ex.muscleGroup || "").toLowerCase();
    if (["biceps", "triceps", "forearms"].includes(mg)) mg = "arms";
    if (["abdominals", "abs"].includes(mg)) mg = "abs";
    if (groupMap[mg]) groupMap[mg].push(ex);
  });

  // muscle priority
  const muscleOrder = ["chest", "back", "shoulders", "arms", "quads", "hamstrings", "calves", "abs"];
  let muscleBlocks = [];
  muscleOrder.forEach(mg => {
    if (groupMap[mg].length > 0) {
      muscleBlocks.push({
        muscle: mg,
        exercises: groupMap[mg] // array of exercises
      });
    }
  });

  if (muscleBlocks.length > 0) {
    const first = muscleBlocks[0];
    if (first.exercises.length > 5) {
      // Split
      const first5 = first.exercises.slice(0, 5);
      const remainder = first.exercises.slice(5);

      // rewrite the first block to only contain the first 5
      muscleBlocks[0].exercises = first5;

      // insert a new block next in line with the remainder
      muscleBlocks.splice(1, 0, {
        muscle: first.muscle, // same muscle
        exercises: remainder
      });
    }
  }

  function canPair(a, b) {
    // In your original code, you used exCount < 4, etc.
    const aCount = a.exercises.length;
    const bCount = b.exercises.length;
    if (aCount >= 4) return false;
    if (aCount === 3 && bCount === 1) return true;
    if (aCount === 2 && [1, 2].includes(bCount)) return true;
    if (aCount === 1 && [1, 2, 3].includes(bCount)) return true;
    return false;
  }

  // We'll build finalPages by scanning muscleBlocks from index=0 onward
  //  - For the *first* block, we've already enforced max 5 exercises.
  //  - For subsequent blocks, we use your normal canPair logic.
  const finalPages = [];
  let i = 0;
  while (i < muscleBlocks.length) {
    const current = muscleBlocks[i];
    // If we can pair with the next
    if (i + 1 < muscleBlocks.length) {
      const next = muscleBlocks[i + 1];
      if (canPair(current, next)) {
        finalPages.push([current, next]);
        i += 2;
      } else {
        finalPages.push([current]);
        i++;
      }
    } else {
      finalPages.push([current]);
      i++;
    }
  }

  // Build the actual PDF pages
  let pageCount = 0;
  finalPages.forEach((blocksOnThisPage, pageIndex) => {
    const pdfPage = document.createElement("div");
    pdfPage.className = "pdf-page myw-page";
    pdfPage.style.backgroundColor = "#E6EBF1";

    // top-left badge
    const badgeDiv = document.createElement("div");
    badgeDiv.className = "page-header-left-logo";
    badgeDiv.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
    pdfPage.appendChild(badgeDiv);

    // If first MYW page, add the heading & subtext
    if (pageIndex === 0) {
      const h2 = document.createElement("h2");
      h2.className = "page-heading with-badge-logo";
      h2.textContent = "Modify Your Workout";
      pdfPage.appendChild(h2);

      const sub = document.createElement("p");
      sub.style.textAlign = "center";
      sub.style.fontSize = "1rem";
      sub.style.margin = "0 0 1rem 0";
      sub.textContent = "Need a change? Swap exercises if needed for comfort, preference, or variety.";
      pdfPage.appendChild(sub);
    }

    // Build the tables for the muscle blocks on this page
    blocksOnThisPage.forEach(block => {
      const containerDiv = document.createElement("div");
      containerDiv.className = "session-table-container modern-table-wrapper alt-ex-table";

      const mgHeading = document.createElement("h3");
      mgHeading.className = "subheading";
      mgHeading.textContent = block.muscle.charAt(0).toUpperCase() + block.muscle.slice(1);
      containerDiv.appendChild(mgHeading);

      const table = document.createElement("table");
      table.className = "session-table modern-table alt-ex-table";

      // colgroup
      const colgroup = document.createElement("colgroup");
      const colLeft = document.createElement("col");
      colLeft.style.width = "32%";
      const colRight = document.createElement("col");
      colRight.style.width = "68%";
      colgroup.appendChild(colLeft);
      colgroup.appendChild(colRight);
      table.appendChild(colgroup);

      const thead = document.createElement("thead");
      const thr = document.createElement("tr");
      ["Main Exercise", "Alternative Exercises"].forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        thr.appendChild(th);
      });
      thead.appendChild(thr);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      block.exercises.forEach(ex => {
        const tr = document.createElement("tr");
        const tdMain = document.createElement("td");
        tdMain.textContent = ex.name || "Exercise";
        const tdAlt = document.createElement("td");
        tdAlt.style.textAlign = "left";

        if (ex.alternativeExercises && ex.alternativeExercises.length) {
          ex.alternativeExercises.forEach(alt => {
            const div = document.createElement("div");
            div.textContent = "• " + alt;
            tdAlt.appendChild(div);
          });
        } else {
          tdAlt.textContent = "No alternative exercises specified.";
        }
        tr.appendChild(tdMain);
        tr.appendChild(tdAlt);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      containerDiv.appendChild(table);

      pdfPage.appendChild(containerDiv);
    });

    wrapper.appendChild(pdfPage);
    pageCount++;
  });

  return pageCount;
}

function buildFullWorkoutSection_12week(containerId, localStorageKey, fromWeek, toWeek, phaseLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const stored = localStorage.getItem(localStorageKey);
  if (!stored) {
    const msg = document.createElement("p");
    msg.textContent = `No ${localStorageKey} data found in localStorage.`;
    container.appendChild(msg);
    return;
  }

  let allData = [];
  try {
    allData = JSON.parse(stored);
  } catch (err) {
    console.error("Error parsing 12-week data:", err);
    return;
  }

  // Filter for fromWeek..toWeek
  const relevantWeeks = allData.filter(w => w.week >= fromWeek && w.week <= toWeek);
  if (!relevantWeeks.length) {
    const msg = document.createElement("p");
    msg.textContent = `No weeks found for ${phaseLabel} (weeks ${fromWeek}-${toWeek}).`;
    container.appendChild(msg);
    return;
  }

  relevantWeeks.forEach(weekObj => {
    const wNum = weekObj.week;
    const days = weekObj.days || [];
    days.forEach(dayObj => {
      // PAGE 1 (Warm-up & Cool-down)
      const pgWarm = document.createElement("div");
      pgWarm.className = "pdf-page";

      const badgeDiv = document.createElement("div");
      badgeDiv.className = "page-header-left-logo";
      badgeDiv.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
      pgWarm.appendChild(badgeDiv);

      const shortDay = (dayObj.dayLabel || "Day").replace(/ - [A-Za-z]+$/, "");
      const h3 = document.createElement("h3");
      h3.className = "page-heading with-badge-logo";
      h3.textContent = `${phaseLabel} - Week ${wNum} - ${shortDay}`;
      pgWarm.appendChild(h3);

      // Warm-up table
      if (dayObj.warmUp && dayObj.warmUp.length > 0) {
        const warmTitle = document.createElement("h4");
        warmTitle.className = "section-heading";
        warmTitle.textContent = "Pre-Workout Warm-Up";
        pgWarm.appendChild(warmTitle);

        const warmWrap = document.createElement("div");
        warmWrap.className = "session-table-container modern-table-wrapper";
        const warmTable = document.createElement("table");
        warmTable.className = "session-table modern-table";

        const wThead = document.createElement("thead");
        const wTr = document.createElement("tr");
        ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
          const th = document.createElement("th");
          th.textContent = col;
          wTr.appendChild(th);
        });
        wThead.appendChild(wTr);
        warmTable.appendChild(wThead);

        const wTbody = document.createElement("tbody");
        dayObj.warmUp.forEach(wu => {
          const row = buildExerciseRow(
            wu.name,
            wu.duration,
            wu.rpe ? `RPE ${wu.rpe}` : "",
            wu.notes
          );
          wTbody.appendChild(row);
        });
        warmTable.appendChild(wTbody);
        warmWrap.appendChild(warmTable);
        pgWarm.appendChild(warmWrap);
      }

      // Cool-down table
      if (dayObj.coolDown && dayObj.coolDown.length > 0) {
        const coolTitle = document.createElement("h4");
        coolTitle.className = "section-heading";
        coolTitle.textContent = "Post-Workout Cool-Down";
        pgWarm.appendChild(coolTitle);

        const coolWrap = document.createElement("div");
        coolWrap.className = "session-table-container modern-table-wrapper";
        const coolTable = document.createElement("table");
        coolTable.className = "session-table modern-table";

        const cThead = document.createElement("thead");
        const cTr = document.createElement("tr");
        ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
          const th = document.createElement("th");
          th.textContent = col;
          cTr.appendChild(th);
        });
        cThead.appendChild(cTr);
        coolTable.appendChild(cThead);

        const cTbody = document.createElement("tbody");
        dayObj.coolDown.forEach(cd => {
          const row = buildExerciseRow(
            cd.name,
            cd.duration,
            cd.rpe ? `RPE ${cd.rpe}` : "",
            cd.notes
          );
          cTbody.appendChild(row);
        });
        coolTable.appendChild(cTbody);
        coolWrap.appendChild(coolTable);
        pgWarm.appendChild(coolWrap);
      }

      const noteNext = document.createElement("p");
      noteNext.className = "note-text-nav";
      noteNext.textContent = "Please see the next page for the main workout.";
      pgWarm.appendChild(noteNext);

      container.appendChild(pgWarm);


      // PAGE 2 (Resistance + Cardio + log button)
      const pgMain = document.createElement("div");
      pgMain.className = "pdf-page lyw-page";

      const badgeMain = document.createElement("div");
      badgeMain.className = "page-header-left-logo";
      badgeMain.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
      pgMain.appendChild(badgeMain);

      const h3b = document.createElement("h3");
      h3b.className = "page-heading with-badge-logo";
      h3b.textContent = `${phaseLabel} - Week ${wNum} - ${shortDay}`;
      pgMain.appendChild(h3b);

      // Resistance
      const rtBlocks = (dayObj.mainWork || []).filter(b => b.blockType === "Resistance Training");
      if (rtBlocks.length > 0) {
        const rtTitle = document.createElement("h4");
        rtTitle.className = "section-heading";
        rtTitle.textContent = "Resistance Training";
        pgMain.appendChild(rtTitle);

        const rtWrap = document.createElement("div");
        rtWrap.className = "session-table-container modern-table-wrapper";
        const rtTable = document.createElement("table");
        rtTable.className = "session-table modern-table";

        // thead
        const rtThd = document.createElement("thead");
        const rtTr = document.createElement("tr");
        ["Exercise", "Sets/Reps", "RPE", "Notes"].forEach(col => {
          const th = document.createElement("th");
          th.textContent = col;
          rtTr.appendChild(th);
        });
        rtThd.appendChild(rtTr);
        rtTable.appendChild(rtThd);

        const rtTbody = document.createElement("tbody");
        rtBlocks.forEach(block => {
          (block.exercises || []).forEach(ex => {
            const row = buildExerciseRow(
              ex.name,
              (ex.sets && ex.reps) ? `${ex.sets} x ${ex.reps}` : ex.duration || "",
              ex.rpe ? `RPE ${ex.rpe}` : "",
              ex.notes
            );
            rtTbody.appendChild(row);
          });
        });
        rtTable.appendChild(rtTbody);
        rtWrap.appendChild(rtTable);
        pgMain.appendChild(rtWrap);
      }

      // Cardio
      const cardioBlocks = (dayObj.mainWork || []).filter(b => b.blockType === "Cardio");
      if (cardioBlocks.length > 0) {
        const cTitle = document.createElement("h4");
        cTitle.className = "section-heading";
        cTitle.textContent = "Post-Workout Cardio";
        pgMain.appendChild(cTitle);

        const cWrap = document.createElement("div");
        cWrap.className = "session-table-container modern-table-wrapper";
        const cTable = document.createElement("table");
        cTable.className = "session-table modern-table";

        const cThead = document.createElement("thead");
        const cTr2 = document.createElement("tr");
        ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
          const th = document.createElement("th");
          th.textContent = col;
          cTr2.appendChild(th);
        });
        cThead.appendChild(cTr2);
        cTable.appendChild(cThead);

        const cTbody = document.createElement("tbody");
        cardioBlocks.forEach(block => {
          if (Array.isArray(block.exercises)) {
            block.exercises.forEach(cx => {
              const row = buildExerciseRow(
                cx.name,
                cx.duration || (block.allocatedMinutes ? `${block.allocatedMinutes} mins` : ""),
                cx.rpe ? `RPE ${cx.rpe}` : "",
                cx.notes
              );
              cTbody.appendChild(row);
            });
          } else {
            // single block obj
            const row = buildExerciseRow(
              block.name,
              block.allocatedMinutes ? `${block.allocatedMinutes} mins` : "",
              block.rpe ? `RPE ${block.rpe}` : "",
              block.notes
            );
            cTbody.appendChild(row);
          }
        });
        cTable.appendChild(cTbody);
        cWrap.appendChild(cTable);
        pgMain.appendChild(cWrap);
      }

      const notePrev = document.createElement("p");
      notePrev.className = "note-text-nav";
      notePrev.textContent = "Please see the previous page for the warm-up and cool-down.";
      pgMain.appendChild(notePrev);

      container.appendChild(pgMain);

    });
  });
}

// Helper to build an exercise row
function buildExerciseRow(name, setsReps, rpe, notes) {
  const tr = document.createElement("tr");
  const td1 = document.createElement("td");
  td1.textContent = name || "";
  const td2 = document.createElement("td");
  td2.textContent = setsReps || "";
  const td3 = document.createElement("td");
  td3.textContent = rpe || "";
  const td4 = document.createElement("td");
  td4.textContent = notes || "";
  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tr.appendChild(td4);
  return tr;
}


/**
 * This replicates the 4-week approach for building
 * the "Modify Your Workout" pages with dynamic grouping,
 * pairing tables, etc. We copy it exactly (and rename).
 */
function buildMYWDynamicPages4Week(containerId) {
  const wrapper = document.getElementById(containerId);
  if (!wrapper) return 0;
  wrapper.innerHTML = "";

  // [Placeholder if you store the 12-week data in localStorage, e.g. "twelveWeekProgram" etc.]
  // We just replicate the logic from 4-week code, but you can adapt it for 12 weeks if needed.
  const stored = localStorage.getItem("fourWeekProgram");
  // or "foundationProgram" if you store the first 4 weeks separately...
  if (!stored) {
    return 0; // no pages
  }

  let programData = [];
  try {
    programData = JSON.parse(stored);
  } catch (err) {
    console.error("Error parsing program data:", err);
    return 0;
  }

  // [In 4-week code, we group all exercises by muscle group, pair them, etc.]
  // For brevity, I'm abbreviating with "... same logic as 4-week ..."

  // [BEGIN] Actual copy from your 4-week approach (omitting some detail):
  // 1) Collect all "Resistance Training" exercises
  // 2) Remove duplicates
  // 3) Group by muscle
  // 4) Pair into pages
  // 5) Build pages
  // [END]

  // For demonstration, let's say we generate 1 "Modify" page:
  const pageDiv = document.createElement("div");
  pageDiv.className = "pdf-page myw-page";
  pageDiv.style.backgroundColor = "#E6EBF1"; // same as 4-week "myw-page"
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Modify Your Workout</h2>
      <p style="text-align:center;margin-bottom:1rem;">
        Need a change? Swap exercises if needed for comfort, preference, or variety.
      </p>
      <!-- Example table(s) ... from your 4-week logic -->
    `;
  wrapper.appendChild(pageDiv);

  // This would produce multiple pages in the real 4-week code.
  const totalPagesCreated = 1;
  return totalPagesCreated;
}

/**
 * Similarly, we replicate the 4-week logic for building
 * the main workout pages (Warm-up, main, cardio, log button, etc.).
 */
function buildWorkoutSectionPages4Week(containerId, fromWeek, toWeek, phaseLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const stored = localStorage.getItem("fourWeekProgram");
  // or your real data for that range of weeks
  if (!stored) {
    const msg = document.createElement("p");
    msg.textContent = "No program data found in localStorage.";
    container.appendChild(msg);
    return;
  }

  let programData = [];
  try {
    programData = JSON.parse(stored);
  } catch (err) {
    console.error("Error parsing data:", err);
    return;
  }

  // [BEGIN 4-week logic] For each week in fromWeek..toWeek
  //   for each day -> build 2 pages
  programData.forEach(weekObj => {
    const wNum = weekObj.week || 1;
    if (wNum < fromWeek || wNum > toWeek) return; // skip

    // e.g. "Foundational Phase - Week X"
    const days = weekObj.days || [];
    days.forEach(dayObj => {
      const shortDay = (dayObj.dayLabel || `Day`).replace(/ - [A-Za-z]+$/, "");

      // Page 1: Warm-up & Cool-down
      const pgWarm = document.createElement("div");
      pgWarm.className = "pdf-page";
      pgWarm.innerHTML = `
          <div class="page-header-left-logo">
            <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
          </div>
          <h3 class="page-heading with-badge-logo">${phaseLabel} - Week ${wNum} - ${shortDay}</h3>
          <!-- Warm-up & Cool-down tables here -->
        `;
      // ... in your 4-week code, you generate a table for warmUp & coolDown
      container.appendChild(pgWarm);

      // Page 2: Resistance + Cardio
      const pgMain = document.createElement("div");
      pgMain.className = "pdf-page lyw-page";
      pgMain.innerHTML = `
          <div class="page-header-left-logo">
            <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
          </div>
          <h3 class="page-heading with-badge-logo">${phaseLabel} - Week ${wNum} - ${shortDay}</h3>
          <!-- Resistance & Cardio tables, plus "Log Your Workout" button -->
        `;
      container.appendChild(pgMain);
    });
  });
}

// ============== PDF #1: 12-Week-Workout-Program-Foundation =============

function buildPdf12WeekFoundationWorkout() {
  fillFoundationCoverPage();
  fillFoundationIntroPage();
  fillFoundationClientProfilePage();
  fillFoundationAdditionalAdvicePage();
  fillFoundationYourWorkoutProgramPage();

  // Build MYW pages (and get the dynamic page count)
  const mywPages = buildMYWDynamicPages_12week(
    "pdf12FoundationModifyWorkoutWrapper",
    "twelveWeekProgram", // the key for your program data
    1, 4,
    "Foundational Phase"
  );

  // Build the real workout section for weeks 1-4
  buildFullWorkoutSection_12week(
    "pdf12FoundationWorkoutsContainer",
    "twelveWeekProgram",
    1, 4,
    "Foundational Phase"
  );

  fillFoundationCongratsPage();

  // Now update the navigation using the dynamic MYW pages count:
  finalizeFoundationNavPage(mywPages);

  addPageNumbers("pdf12WeekWorkoutFoundation");
}

function finalizeFoundationNavPage(mywPagesCount = 0) {
  const navDiv = document.getElementById("pdf12FoundationNavPage");
  if (!navDiv) return;

  // Assume workoutDays is stored (defaulting to 3 if not set)
  const workoutDays = parseInt(localStorage.getItem("workoutDays") || "3", 10);
  const pagesPerWeek = workoutDays * 2;

  // In your 4‑Week code the base for week 1 was 7 + mywPagesCount;
  // Here we follow a similar pattern for Weeks 1–4.
  const week1Start = 7 + mywPagesCount;
  const week2Start = week1Start + pagesPerWeek;
  const week3Start = week2Start + pagesPerWeek;
  const week4Start = week3Start + pagesPerWeek;

  // Build the nav header and items
  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  const items = [
    { label: "Introduction", page: 3 },
    { label: "Client Profile", page: 4 },
    { label: "Additional Advice", page: 5 },
    { label: "Your Workout Guide", page: 6 },
    { label: "Modify Your Workout", page: 7 },
    { label: "Week 1", page: week1Start },
    { label: "Week 2", page: week2Start },
    { label: "Week 3", page: week3Start },
    { label: "Week 4", page: week4Start },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach(obj => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillFoundationCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("twelveWeekCoverTitleFoundation");
  if (coverTitleEl) {
    if (adjustedName === "Committed Champion") {
      coverTitleEl.textContent = "Your 12-Week Program";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 12-Week Program`;
    }
  }
}

function fillFoundationIntroPage() {
  const pageDiv = document.getElementById("pdf12FoundationIntroPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Introduction</h2>
      ${placeholderIntroText()}
    `;
}

function fillFoundationClientProfilePage() {
  const pageDiv = document.getElementById("pdf12FoundationClientProfilePage");
  if (!pageDiv) return;

  const adjustedName = getAdjustedUserName();
  const dobVal = localStorage.getItem("dob") || "1990-01-01";
  const rawGoal = localStorage.getItem("goal") || "lose weight";
  const capGoal = capitalizeGoal(rawGoal);
  const heightVal = localStorage.getItem("height") || "170";
  const weightVal = localStorage.getItem("weight") || "70";

  // Pull daily nutrition variables (used for water intake)
  const nutriVars = fillDailyNutritionVars();

  // Estimated Daily Energy Burn (TDEE) from localStorage:
  const tdee = parseInt(localStorage.getItem("maintenanceCalories"), 10) || 2000;
  // Format TDEE with commas
  const formattedTDEE = tdee.toLocaleString();

  // Use programWaterIntake instead of programIntake
  const programWaterIntake = nutriVars.waterIntake;

  // Calculate BMR using the appropriate formula:
  const weight = parseFloat(weightVal);
  const height = parseFloat(heightVal);
  const age = parseInt(localStorage.getItem("age"), 10) || 30;
  const gender = (localStorage.getItem("gender") || "male").toLowerCase();
  let BMR;
  if (gender === "male") {
    BMR = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    BMR = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  const stepsPerDay = Math.round((tdee - BMR) / 0.05);
  // Format Steps with commas
  const formattedSteps = stepsPerDay.toLocaleString();

  // Determine Sleeping Hours based on activityLevel and effortLevel:
  const activityLevel = localStorage.getItem("activityLevel") || "sedentary (little to no exercise)";
  const effortLevel = localStorage.getItem("effortLevel") || "moderate effort";

  let activitySleep;
  switch(activityLevel.toLowerCase()) {
    case "sedentary (little to no exercise)":
    case "lightly active (light exercise/sports 1–3 days per week)":
      activitySleep = 8;
      break;
    case "moderately active (moderate exercise/sports 3–5 days per week)":
      activitySleep = 9;
      break;
    case "very active (hard exercise/sports 6–7 days per week)":
    case "extra active (very hard exercise, physical job, or training twice a day)":
      activitySleep = 10;
      break;
    default:
      activitySleep = 8;
  }

  let effortSleep;
  switch(effortLevel.toLowerCase()) {
    case "slight effort":
      effortSleep = 8;
      break;
    case "moderate effort":
      effortSleep = 9;
      break;
    case "high effort":
      effortSleep = 10;
      break;
    default:
      effortSleep = 8;
  }
  const sleepingHours = Math.max(activitySleep, effortSleep);

  // Retrieve the Ultimate Goal from localStorage:
  const ultimateGoal = localStorage.getItem("ultimateGoal") || "";

  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">${adjustedName}'s Profile</h2>
    <div class="profile-container">
      <h3 class="subheading centered">Personal Details</h3>
      <div class="profile-grid">
        <div class="profile-grid-item label">Date of Birth:</div>
        <div class="profile-grid-item">${dobVal}</div>

        <div class="profile-grid-item label">Goal:</div>
        <div class="profile-grid-item">${capGoal}</div>

        <div class="profile-grid-item label">Height:</div>
        <div class="profile-grid-item">${heightVal} cm</div>

        <div class="profile-grid-item label">Weight:</div>
        <div class="profile-grid-item">${weightVal} kg</div>
      </div>

      <div class="profile-grid">
        <div class="profile-grid-item label">Maintenance Calories:</div>
        <div class="profile-grid-item">${formattedTDEE} kcals</div>

        <div class="profile-grid-item label">Water Intake:</div>
        <div class="profile-grid-item">${programWaterIntake} L</div>

        <div class="profile-grid-item label">Steps Per Day:</div>
        <div class="profile-grid-item">${formattedSteps} steps</div>

        <div class="profile-grid-item label">Sleeping Hours:</div>
        <div class="profile-grid-item">${sleepingHours} hours</div>
      </div>

      <!-- New Ultimate Goal section outside the table/grid -->
      <h3 class="subheading centered">Ultimate Goal</h3>
      <div style="background-color: #F9F6F2; border-color: #E0DAD3; color: #666; text-align: center; padding: 1rem; border-radius: 6px;">
        ${ultimateGoal}
      </div>
    </div>
  `;
}

function fillFoundationAdditionalAdvicePage() {
  const pageDiv = document.getElementById("pdf12FoundationAdditionalAdvicePage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Additional Advice</h2>
<p class="advice-text">
  <strong>Exercise</strong><br/>
  Progress takes time, and consistency is key. Each workout should challenge you, but avoid pushing to failure every session. Prioritize proper form, controlled movements, and gradual increases in intensity. Ensure you warm up effectively before resistance training and cool down afterward to enhance flexibility and prevent injury.<br><br>
  
  If you experience discomfort or persistent soreness, don’t hesitate to modify exercises or incorporate additional recovery strategies. Training is about longevity—listen to your body and train smart.
</p>

<p class="advice-text">
  <strong>Nutrition</strong><br/>
  Nutrition fuels your progress, and a sustainable approach beats perfection. Stick to nutrient-dense whole foods, ensuring you hit your protein and calorie targets. Your program has been designed with gradual calorie adjustments to match your changing needs over time. If you struggle with consistency, meal prepping or tracking intake can be valuable tools.<br><br>
  
  Supplements can support your goals, but they are not a replacement for a well-balanced diet. Prioritize whole foods first, then consider supplements if needed.
</p>

<p class="advice-text">
  <strong>Recovery</strong><br/>
  Strength is built outside of the gym as much as inside it. Sleep, hydration, and stress management are crucial for maximizing performance and recovery. Aim for 7-9 hours of sleep per night, stay hydrated, and implement active recovery techniques like stretching or light movement on rest days.<br><br>
  
  This 12-week journey is about progress, not perfection. Some days will be harder than others, but showing up consistently and making small improvements will lead to real, long-term success.
</p>

<p class="advice-text">
Some weeks will feel tougher—this is normal. Adjust intensity if needed, but stay consistent. Progress comes from showing up, not being perfect.
</p>
    `;
}

function fillFoundationYourWorkoutProgramPage() {
  const pageDiv = document.getElementById("pdf12FoundationYourWorkoutProgramPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Your Workout Guide</h2>
      <img
        src="#"
        alt="Program Overview Placeholder"
        style="display:block;margin:1rem auto;object-fit:cover;width:80%;height:20vh;"
      />
<p class="program-intro-text">
  <strong>Welcome to your 12-Week Training Program!</strong> This plan has been built around structured progression to ensure continuous improvement in strength, endurance, and body composition over time.
</p>

<p class="program-intro-text">
  This 12-week structure prioritizes gradual overload, recovery periods, and intelligent adaptation to keep you progressing while minimizing fatigue or injury risk. Here's how your training is structured:
</p>

<p class="program-intro-text">
  <strong>Warm-Up:</strong> Activates key muscle groups, improves mobility, and prepares your body for peak performance.
  <br>
  <strong>Resistance Training:</strong> Focuses on strength, hypertrophy, and muscular endurance through progressive overload.
  <br>
  <strong>Cardio & Conditioning:</strong> Enhances endurance, fat loss, and cardiovascular health without compromising muscle retention.
  <br>
  <strong>Recovery & Adaptation:</strong> Planned deload weeks and active recovery ensure sustained progress without burnout.
</p>

<p class="program-intro-text">
  This is a marathon, not a sprint. By staying consistent with this structured plan, you'll see incredible transformations over the next 12 weeks. Use the built-in workout tracker to log your sessions, monitor progress, and stay accountable throughout your journey. <b>Let’s get started and make these 12 weeks count!</b>
</p>

<p class="program-intro-text last-paragraph">
  Let’s get started and make these 12 weeks count!
</p>
    `;
}

function buildFoundationMYWPages(containerId) {
  const wrapper = document.getElementById(containerId);
  if (!wrapper) return 0;
  wrapper.innerHTML = "";
  const pageDiv = document.createElement("div");
  pageDiv.className = "pdf-page";
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Modify Your Workout</h2>
      <p class="introduction-text">
        Placeholder for alternative exercise tables or instructions to modify your workout.
      </p>
    `;
  wrapper.appendChild(pageDiv);
  return 1; // Returns the number of pages created.
}

function buildFoundationWorkoutPages(mywCount) {
  const container = document.getElementById("pdf12FoundationWorkoutsContainer");
  if (!container) return;
  container.innerHTML = "";

  // In your real code, you'll generate pages for Weeks 1,2,3,4 with all the exercise details.
  // For demo, let's just create two pages:
  for (let wk = 1; wk <= 4; wk++) {
    // For each week
    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.innerHTML = `
        <h3 class="page-heading with-badge-logo">Week ${wk}</h3>
        <p class="introduction-text">Placeholder for workout tables for Week ${wk}...</p>
      `;
    container.appendChild(pageDiv);
  }
}

function fillFoundationCongratsPage() {
  const pageDiv = document.getElementById("pdf12FoundationCongratsPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <div class="congrats-container">
        <h2>Congratulations!</h2>
        <p>
          You've completed the Foundational Phase (Weeks 1-4). <br><br>
          That’s a major step forward in your fitness journey.  
          Every session, every rep, and every effort you put in has built a stronger foundation for what’s next.  
        </p>
        <p>
          Keep challenging yourself, trust the process, and most importantly—enjoy the journey.  
          The best transformations come from consistency, and you’re already proving you have what it takes.
        </p>
      </div>
    `;
}

// ============== PDF #2: 12-Week-Workout-Program-Hypertrophy =============

function buildPdf12WeekHypertrophyWorkout() {
  fillHypertrophyCoverPage();
  fillHypertrophyIntroPage();
  const pdfContainer = document.getElementById("pdf12WeekWorkoutHypertrophy");
  if (!pdfContainer) return;
  // Create a wrapper if it doesn’t already exist:
  let mywWrapper = document.getElementById("pdf12HypertrophyModifyWorkoutWrapper");
  if (!mywWrapper) {
    mywWrapper = document.createElement("div");
    mywWrapper.id = "pdf12HypertrophyModifyWorkoutWrapper";
    // Insert it at the desired position—for example, before the workout section:
    const workoutContainer = document.getElementById("pdf12HypertrophyWorkoutsContainer");
    pdfContainer.insertBefore(mywWrapper, workoutContainer);
  }

  // Attempt to build dynamic MWY pages for weeks 5-8:
  let mywPagesCount = buildMYWDynamicPages_12week(
    "pdf12HypertrophyModifyWorkoutWrapper",
    "twelveWeekProgram",
    5, 8,
    "Hypertrophy Phase"
  );
  // If no pages were created, fall back to the 4‑week (default) MWY page:
  if (mywPagesCount === 0) {
    mywPagesCount = buildFoundationMYWPages("pdf12HypertrophyModifyWorkoutWrapper");
  }

  // Build the main workout pages for weeks 5-8
  buildFullWorkoutSection_12week(
    "pdf12HypertrophyWorkoutsContainer",
    "twelveWeekProgram",
    5, 8,
    "Hypertrophy Phase"
  );

  fillHypertrophyCongratsPage();
  finalizeHypertrophyNavPage(mywPagesCount);
  addPageNumbers("pdf12WeekWorkoutHypertrophy");
}


function fillHypertrophyCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("twelveWeekCoverTitleHypertrophy");
  if (coverTitleEl) {
    if (adjustedName === "Committed Champion") {
      coverTitleEl.textContent = "Your 12-Week Program";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 12-Week Program`;
    }
  }
}

function finalizeHypertrophyNavPage(mywPagesCount = 0) {
  const navDiv = document.getElementById("pdf12HypertrophyNavPage");
  if (!navDiv) return;

  const workoutDays = parseInt(localStorage.getItem("workoutDays") || "3", 10);
  const pagesPerWeek = workoutDays * 2;
  const week5Start = 4 + mywPagesCount;
  const week6Start = week5Start + pagesPerWeek;
  const week7Start = week6Start + pagesPerWeek;
  const week8Start = week7Start + pagesPerWeek;

  navDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Navigation</h2>
  `;

  // Now we insert "Modify Your Workout" as page 4, 
  // then weeks start at week5Start, etc.
  const items = [
    { label: "Introduction", page: 3 },
    { label: "Modify Your Workout", page: 4 }, // always page 4
    { label: "Week 5", page: week5Start },
    { label: "Week 6", page: week6Start },
    { label: "Week 7", page: week7Start },
    { label: "Week 8", page: week8Start },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach(obj => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillHypertrophyNavPage() {
  const navDiv = document.getElementById("pdf12HypertrophyNavPage");
  if (!navDiv) return;

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  // As specified: "Introduction", "Week 5", "Week 6", "Week 7", "Week 8"
  // Page numbers: "3", "4", "10", "16"
  const items = [
    { label: "Introduction", page: 3 },
    { label: "Week 5", page: 4 },
    { label: "Week 6", page: 10 },
    { label: "Week 7", page: 16 },
    { label: "Week 8", page: 22 },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillHypertrophyIntroPage() {
  const pageDiv = document.getElementById("pdf12HypertrophyIntroPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Introduction</h2>
      <img
        src="#"
        alt="Program Overview Placeholder"
        style="display:block;margin:1rem auto;object-fit:cover;width:80%;height:20vh;"
      />
<p class="introduction-text">
  <strong>Welcome to the Hypertrophy Phase of Your 12-Week Program!</strong> This phase is designed to maximize muscle growth by focusing on increased training volume, controlled tempo, and strategic overload.<br><br>

  Over the next four weeks, your training will emphasize moderate-to-high rep ranges (8-12 reps), time under tension, and progressive overload. This structured approach ensures consistent hypertrophic adaptations while maintaining recovery and performance.<br><br>

  To optimize results, your training intensity will gradually increase while ensuring sufficient recovery through programmed deloads and balanced nutrition. Expect to see noticeable improvements in muscle definition, endurance, and strength endurance by the end of this phase.<br><br>

  Stay consistent, push with intent, and focus on perfecting your form. The foundation you build here will set you up for even greater strength gains in the final phase.<br><br>

  <strong>Let’s make every session count!</strong>
</p>
    `;
}

function buildHypertrophyWorkoutPages() {
  const container = document.getElementById("pdf12HypertrophyWorkoutsContainer");
  if (!container) return;
  container.innerHTML = "";

  // We want to show pages for Weeks 5,6,7,8
  for (let wk = 5; wk <= 8; wk++) {
    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.innerHTML = `
        <h3 class="page-heading with-badge-logo">Week ${wk}</h3>
        <p class="introduction-text">Placeholder for workout details for Week ${wk} (Hypertrophy Phase)...</p>
      `;
    container.appendChild(pageDiv);
  }
}

function fillHypertrophyCongratsPage() {
  const pageDiv = document.getElementById("pdf12HypertrophyCongratsPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <div class="congrats-container">
        <h2>Congratulations!</h2>
        <p>
          You have successfully completed the Hypertrophy Phase (Weeks 5-8).<br><br>
          By pushing through these past weeks, you've developed not just muscle, but resilience, focus, and discipline.  
        </p>
        <p>
          This is where your hard work starts to show. Strength isn't just measured in weight lifted,  
          but in the consistency you've built. Keep challenging yourself and trust in the process.  
        </p>
      </div>
    `;
}

// ============== PDF #3: 12-Week-Workout-Program-Strength =============

function buildPdf12WeekStrengthWorkout() {
  fillStrengthCoverPage();
  fillStrengthIntroPage();

  const pdfContainer = document.getElementById("pdf12WeekWorkoutStrength");
  if (!pdfContainer) return;

  let mywWrapper = document.getElementById("pdf12StrengthModifyWorkoutWrapper");
  if (!mywWrapper) {
    mywWrapper = document.createElement("div");
    mywWrapper.id = "pdf12StrengthModifyWorkoutWrapper";
    // Try to insert it before the workouts container so it appears in the correct order
    const workoutsContainer = document.getElementById("pdf12StrengthWorkoutsContainer");
    if (workoutsContainer) {
      pdfContainer.insertBefore(mywWrapper, workoutsContainer);
    } else {
      pdfContainer.appendChild(mywWrapper);
    }
  }

  // Build dynamic MWY pages for weeks 9-12:
  let mywPagesCount = buildMYWDynamicPages_12week(
    "pdf12StrengthModifyWorkoutWrapper",
    "twelveWeekProgram",
    9, 12,
    "Strength Phase"
  );
  // Fallback if no MWY pages were created:
  if (mywPagesCount === 0) {
    mywPagesCount = buildFoundationMYWPages("pdf12StrengthModifyWorkoutWrapper");
  }

  // Build the main workout section for weeks 9-12
  buildFullWorkoutSection_12week(
    "pdf12StrengthWorkoutsContainer",
    "twelveWeekProgram",
    9, 12,
    "Strength Phase"
  );

  fillStrengthCongratsPage();
  finalizeStrengthNavPage(mywPagesCount);
  addPageNumbers("pdf12WeekWorkoutStrength");
}

function fillStrengthCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("twelveWeekCoverTitleStrength");
  if (coverTitleEl) {
    if (adjustedName === "Committed Champion") {
      coverTitleEl.textContent = "Your 12-Week Program";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 12-Week Program`;
    }
  }
}


function finalizeStrengthNavPage(mywPagesCount = 0) {
  const navDiv = document.getElementById("pdf12StrengthNavPage");
  if (!navDiv) return;

  const workoutDays = parseInt(localStorage.getItem("workoutDays") || "3", 10);
  const pagesPerWeek = workoutDays * 2;

  // same logic approach as the hypertrophy navigation
  const week9Start = 4 + mywPagesCount;
  const week10Start = week9Start + pagesPerWeek;
  const week11Start = week10Start + pagesPerWeek;
  const week12Start = week11Start + pagesPerWeek;

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  const items = [
    { label: "Introduction", page: 3 },
    { label: "Week 9", page: week9Start },
    { label: "Week 10", page: week10Start },
    { label: "Week 11", page: week11Start },
    { label: "Week 12", page: week12Start },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach(obj => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillStrengthNavPage() {
  const navDiv = document.getElementById("pdf12StrengthNavPage");
  if (!navDiv) return;

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  // As specified: "Introduction", "Week 9", "Week 10", "Week 11", "Week 12"
  // Page numbers: "3", "4", "10", "16"
  const items = [
    { label: "Introduction", page: 3 },
    { label: "Week 9", page: 4 },
    { label: "Week 10", page: 10 },
    { label: "Week 11", page: 16 },
    { label: "Week 12", page: 22 },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fillStrengthIntroPage() {
  const pageDiv = document.getElementById("pdf12StrengthIntroPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Introduction</h2>
      <img
        src="#"
        alt="Program Overview Placeholder"
        style="display:block;margin:1rem auto;object-fit:cover;width:80%;height:20vh;"
      />
<p class="introduction-text">
  <strong>Welcome to the Strength Phase of Your 12-Week Program!</strong> This phase shifts the focus from hypertrophy to maximizing raw strength, power, and neural efficiency.<br><br>

  Over the next four weeks, your training will prioritize lower rep ranges (3-6 reps), heavier weights, and longer rest periods. This structured approach improves your ability to generate force, enhances neuromuscular coordination, and builds foundational strength that extends beyond this program.<br><br>

  While volume will be slightly reduced, intensity will increase, requiring complete focus and intent on each lift. Form, control, and recovery will be key—pushing heavy while maintaining proper technique ensures progress while minimizing injury risk.<br><br>

  By the end of this phase, expect noticeable increases in absolute strength, bar speed, and power output. Your progress throughout this program has led to this moment—now it’s time to test and surpass your limits.<br><br>

  <strong>Stay focused, trust the process, and finish strong!</strong>
</p>

    `;
}

function buildStrengthWorkoutPages() {
  const container = document.getElementById("pdf12StrengthWorkoutsContainer");
  if (!container) return;
  container.innerHTML = "";

  // Weeks 9-12
  for (let wk = 9; wk <= 12; wk++) {
    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.innerHTML = `
        <h3 class="page-heading with-badge-logo">Week ${wk}</h3>
        <p class="introduction-text">Placeholder for workout details for Week ${wk} (Strength Phase)...</p>
      `;
    container.appendChild(pageDiv);
  }
}

function fillStrengthCongratsPage() {
  const pageDiv = document.getElementById("pdf12StrengthCongratsPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <div class="congrats-container">
        <h2>Congratulations!</h2>
        <p>
          You've completed the Strength Phase (Weeks 9-12). <br><br>
          This isn't just the end of a program—it’s proof of what you’re capable of when you stay committed.  
        </p>
        <p>
          Every session, every rep, every challenge you pushed through has made you stronger—not just physically, but mentally.  
          Take this strength beyond the gym, beyond this program, and into every goal you set for yourself.
        </p>
      </div>
    `;
}

// ============== PDF #4: 12-Week-Nutrition-Guide =============

function buildPdf12WeekNutritionGuide() {
  fill12NutritionCoverPage();
  fill12NutritionNavPage();
  fill12NutritionIntroPage();
  fill12NutritionCaloriePage();
  fill12EssentialFoodGuidePage();
  fill12PortionStructPage();
  fill12NutritionSummaryPage1();
  fill12NutritionSummaryPage2();
  fill12MealPrepTimePage();
  fill12LongTermSuccessPage();
  fill12EatingOutSocialPage();
  fill12GroceryPlanningPage();

  addPageNumbers("pdf12WeekNutritionGuide");
}

function saveWeeklyCaloriesFor12Weeks() {
  // For demonstration, let's assume each block of 4 weeks modifies the base
  // by ~75 kcals, just as an example. You can adapt your real logic here.
  const defBase = parseInt(localStorage.getItem("defCalsComputed") || "1800", 10);
  const surBase = parseInt(localStorage.getItem("surCalsComputed") || "2500", 10);
  const maintenance = parseInt(localStorage.getItem("maintenanceCalories") || "2200", 10);

  // Suppose the user goal:
  const userGoal = (localStorage.getItem("goal") || "lose").toLowerCase();

  // We'll do a very simplified approach:
  // Each week from 1..12:
  //   - If userGoal includes "lose": Weeks 1-3 => def, 4 => deload, 5-7 => def, 8 => deload, etc.
  //   - If userGoal includes "gain": Weeks 1-3 => sur, 4 => deload, ...
  //   - If userGoal includes "improve": your custom pattern
  // Each block of 4 weeks we can decrement or increment the base by 50 or 75 to mimic adaptation.
  const blockSize = 4;
  const decrementFactor = 75; // for demonstration
  // We'll store as localStorage.setItem("weekN_dailyCals", someNumber);

  let currentDef = defBase;
  let currentSur = surBase;
  let currentMaint = maintenance;

  for (let w = 1; w <= 12; w++) {
    // Check if we are at the start of a block (4-week block)
    const blockIndex = Math.floor((w - 1) / blockSize); // 0-based
    // We'll adapt the cals once we move to a new block
    if (w > 1 && (w - 1) % blockSize === 0) {
      // e.g. after 4, 8...
      currentDef -= decrementFactor;  // reduce deficit a bit each block
      currentSur -= decrementFactor;  // or reduce surplus to reflect new BMR, etc.
      currentMaint -= 25;            // maybe a small shift
    }

    let dailyTarget = currentMaint; // default to maintenance

    if (userGoal.includes("lose")) {
      // weeks 1-3 => def, 4 => deload, 5-7 => def, 8 => deload, ...
      const mod = (w - 1) % 4; // 0,1,2,3
      if (mod < 3) {
        // deficit
        dailyTarget = currentDef;
      } else {
        // deload
        dailyTarget = currentMaint;
      }
    } else if (userGoal.includes("gain")) {
      // weeks 1-3 => surplus, 4 => deload
      const mod = (w - 1) % 4;
      if (mod < 3) {
        dailyTarget = currentSur;
      } else {
        dailyTarget = currentMaint;
      }
    } else if (userGoal.includes("improve")) {
      const mod = week % 4; // 1,2,3,... => 1,2,3,0 pattern
      if (mod === 1 || mod === 2) {
        return defCals;  // Weeks 1 & 2 in each cycle → deficit
      } else if (mod === 3) {
        return surCals;  // Week 3 in each cycle → surplus
      } else {
        // mod === 0
        return deloadCals; // Week 4 in each cycle → deload
      }
    }

    localStorage.setItem(`week${w}_dailyCals`, dailyTarget.toString());
  }
}

/**
 * [2] Implementation of Weekly Adjustment Mode:
 *  - We track the daily difference from the target.
 *  - If within ±5%, we do nothing.
 *  - If outside ±5%, we store that surplus/deficit in a "runningBalance".
 *  - We distribute that difference gradually across the remaining days
 *    of the same week so we don’t cause big fluctuations.
 *
 * This requires we plan all 7 days at once, see if day1 was ±X, then
 * adjust day2..7 in increments not exceeding the 0.8–1.2 portion-scaling
 * constraint. For brevity, we do a simplified approach here.
 */
function applyWeeklyAdjustmentMode(daysArray, dailyTarget) {
  // daysArray is something like [ { dayIndex, totalCals, meals: [...] }, ... ]
  // We'll assume each item has .finalTotalCals after meal selection & scaling.
  // dailyTarget is the nominal daily target for that entire week.
  // We'll do a quick pass and accumulate difference in "weekBalance".

  let weekBalance = 0; // net surplus or deficit for the entire week so far

  daysArray.forEach((dayObj, idx) => {
    const dayDiff = dayObj.finalTotalCals - dailyTarget;
    const dayDiffPct = (dayDiff / dailyTarget) * 100;

    if (Math.abs(dayDiffPct) <= 5) {
      // within 5% => do nothing
      // but accumulate small difference in the weekBalance
      weekBalance += dayDiff;
    } else {
      // outside 5%, we add it to weekBalance
      weekBalance += dayDiff;
      // see if we can partially correct the next day
      // for example, let's shift 25% of the current surplus/deficit into the next day
      // while bounding the portion-scaling factor. For brevity, we won't do full details.
    }

    // We won't show the full multi-day distribution code here for brevity,
    // but in principle, you'd do:
    //  - If weekBalance is large, you reduce or increase the following day or days by small increments,
    //    ensuring you don't exceed the 0.8–1.2 portion multiplier.
    //  - You keep carrying leftover in weekBalance until the end of the week.
  });

  // Return the updated array if you actually changed dayObj.meals
  return daysArray;
}

function selectMealClosestToTarget(candidates, targetCals, rotationIndex = 0) {
  // [START OF UPDATE]
  // We handle tie-breakers with the following priorities:
  // 1) closest to target
  // 2) rotate selections to prevent repetition (using rotationIndex)
  // 3) highest protein
  // We'll do a two-step approach:
  // (a) sort by absolute difference from target
  // (b) then group ties, rotate or compare protein

  // If no candidates:
  if (!candidates || candidates.length === 0) return null;

  // Sort by absolute difference from target first
  const sorted = [...candidates].sort((a, b) => {
    const diffA = Math.abs(a.calories - targetCals);
    const diffB = Math.abs(b.calories - targetCals);
    if (diffA === diffB) {
      // We'll just sort by protein descending as a fallback for now
      return b.protein - a.protein;
    }
    return diffA - diffB;
  });

  // Now the best is at sorted[0], but we need to handle potential ties
  // Let's find all meals that have the same diff as sorted[0].
  const bestDiff = Math.abs(sorted[0].calories - targetCals);
  const sameDiffGroup = sorted.filter(
    (m) => Math.abs(m.calories - targetCals) === bestDiff
  );

  if (sameDiffGroup.length === 1) {
    // only one
    return sameDiffGroup[0];
  }

  // If multiple: rotate by the rotationIndex
  const idx = rotationIndex % sameDiffGroup.length;
  return sameDiffGroup[idx];
  // [END OF UPDATE]
}

function adjustPortionSize(originalMeal, targetCals) {
  if (!originalMeal) return null;
  const meal = JSON.parse(JSON.stringify(originalMeal)); // clone

  // If meal is already within 0.8..1.2 * target, no changes:
  const lowerBound = targetCals * 0.8;
  const upperBound = targetCals * 1.2;
  if (meal.calories >= lowerBound && meal.calories <= upperBound) {
    return meal;
  }

  // Otherwise, scale:
  const scaleFactor = targetCals / meal.calories;
  let finalScale = Math.max(0.8, Math.min(1.2, scaleFactor));

  meal.calories = Math.round(meal.calories * finalScale);
  meal.protein = Math.round(meal.protein * finalScale);
  meal.carbs = Math.round(meal.carbs * finalScale);
  meal.fats = Math.round(meal.fats * finalScale);
  meal.portionSize = parseFloat((meal.portionSize * finalScale).toFixed(2));

  // Round ingredients if they contain numbers (simple approach)
  meal.ingredients = meal.ingredients.map((ing) => {
    const match = ing.match(/(\d+)(g|ml)/i);
    if (match) {
      let val = parseFloat(match[1]);
      let newVal = Math.round(val * finalScale);
      if (newVal >= 20) {
        // round to nearest 5
        newVal = Math.round(newVal / 5) * 5;
      }
      return ing.replace(/\d+(g|ml)/, `${newVal}${match[2]}`);
    }
    return ing;
  });

  return meal;
}

function build12WeekMealPlanDay(weekNumber, dayNumber) {
  const dailyCals = parseInt(localStorage.getItem(`week${weekNumber}_dailyCalsWMCO`) || "2000", 10);

  // weight-loss splits for example, etc.
  const splits = { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 };

  const breakfastTarget = Math.round(dailyCals * splits.Breakfast);
  const lunchTarget     = Math.round(dailyCals * splits.Lunch);
  const dinnerTarget    = Math.round(dailyCals * splits.Dinner);
  const snackTarget     = Math.round(dailyCals * splits.Snack);

  console.log(`\n--- build12WeekMealPlanDay(W${weekNumber}D${dayNumber}) dailyCals=${dailyCals} ---`);
  console.log(` breakfast=${breakfastTarget}, lunch=${lunchTarget}, dinner=${dinnerTarget}, snack=${snackTarget}`);

  // pick & scale
  const breakfastMeal = pickMealForCategory("Breakfast", breakfastTarget, mealDatabase);
  const lunchMeal     = pickMealForCategory("Lunch",     lunchTarget,     mealDatabase);
  const dinnerMeal    = pickMealForCategory("Dinner",    dinnerTarget,    mealDatabase);
  const snackMeal     = pickMealForCategory("Snack",     snackTarget,     mealDatabase);

  let finalTotalCals = 0;
  [breakfastMeal, lunchMeal, dinnerMeal, snackMeal].forEach(m => {
    if (m) finalTotalCals += m.calories;
  });

  return {
    week: weekNumber,
    day:  dayNumber,
    meals: {
      Breakfast: breakfastMeal,
      Lunch: lunchMeal,
      Dinner: dinnerMeal,
      Snack: snackMeal
    },
    finalTotalCals
  };
}

function buildAndRender12WeekMealPlan(containerId, fromWeek, toWeek) {
  debugCheckMealFreq(); // console log what we see in localStorage

  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // This is what the user sets in forms.js
  const mealFrequency = getMealFrequency();
  const userGoal = (localStorage.getItem("goal") || "Lose").toLowerCase();

  // We'll define a helper to build the meal table (with notes row)
  function buildMealTable(mealObj, mealType) {
    if (!mealObj) {
      const p = document.createElement("p");
      p.textContent = `No ${mealType} meal found.`;
      return p;
    }
    const tbl = document.createElement("table");
    tbl.className = "session-table modern-table meal-plan-table";
    
    // Set up colgroup => middle column bigger
    const cg = document.createElement("colgroup");
    const c1 = document.createElement("col");
    c1.style.width = "30%";
    const c2 = document.createElement("col");
    c2.style.width = "35%";
    const c3 = document.createElement("col");
    c3.style.width = "35%";
    cg.appendChild(c1);
    cg.appendChild(c2);
    cg.appendChild(c3);
    tbl.appendChild(cg);
    
    const thead = document.createElement("thead");
    const thr = document.createElement("tr");
    ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      thr.appendChild(th);
    });
    thead.appendChild(thr);
    tbl.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    const row = document.createElement("tr");
    
    // Column 1: Name + Macros
    const td1 = document.createElement("td");
    td1.innerHTML = `
      <div class="meal-name-divider">${mealObj.mealName}</div>
      <div style="text-align:center;font-size:0.9rem;">
        Calories: ${mealObj.calories}<br/>
        Protein: ${mealObj.protein}g<br/>
        Carbs: ${mealObj.carbs}g<br/>
        Fat: ${mealObj.fats}g
      </div>
    `;
    row.appendChild(td1);
    
    // Column 2: Ingredients
    const td2 = document.createElement("td");
    td2.style.textAlign = "left";
    mealObj.ingredients.forEach(ing => {
      let line = "";
      if (ing.wholeItem) {
        const singular = ing.singular || ing.name;
        const plural = ing.plural || ing.name + "s";
        line = `${ing.quantity} ${ing.quantity === 1 ? singular : plural}`;
      } else {
        if (ing.unit) {
          line = `${ing.quantity}${ing.unit} ${ing.name}`;
        } else {
          line = `${ing.quantity} ${ing.name}`;
        }
      }
      const div = document.createElement("div");
      div.textContent = "• " + line;
      td2.appendChild(div);
    });
    row.appendChild(td2);
    
    // Column 3: Recipe
    const td3 = document.createElement("td");
    td3.style.textAlign = "left";
    if (Array.isArray(mealObj.recipe)) {
      mealObj.recipe.forEach(step => {
        const div = document.createElement("div");
        div.textContent = "• " + step;
        td3.appendChild(div);
      });
    } else {
      td3.textContent = "No recipe steps provided.";
    }
    row.appendChild(td3);
    
    tbody.appendChild(row);
    
    // Always add the "Notes" row—even if mealObj.mealNotes is empty.
    const notesArr = mealObj.mealNotes || [];
    const notesRow = document.createElement("tr");
    notesRow.className = "meal-notes-row";
    const notesCell = document.createElement("td");
    notesCell.colSpan = 3;
    // Force the text color to black to ensure visibility on all pages.
    notesCell.style.color = "#000";
    notesCell.textContent = notesArr.length ? notesArr.join(" | ") : "Enjoy your meal!";
    notesRow.appendChild(notesCell);
    tbody.appendChild(notesRow);
    
    tbl.appendChild(tbody);
    return tbl;
  }  

  // For each week in [fromWeek..toWeek], we do 7 days => 2 PDF pages each day
  for (let w = fromWeek; w <= toWeek; w++) {
    const baseDailyCals = parseInt(localStorage.getItem(`week${w}_dailyCalsWMCO`) || "2000", 10);
    const phase = getPhaseForWeek(w, userGoal);

    // Figure out the ratio object for this phase & mealFrequency
    const ratioObj = getSplitsObj(phase, mealFrequency);
    // Example ratioObj => {Breakfast:0.3, Lunch:0.4, Dinner:0.3} for 3-meals deficit

    for (let d = 1; d <= 7; d++) {
      console.log(`\n=== Week ${w} - Day ${d}, mealFreq=${mealFrequency}, phase=${phase} ===`);
      console.log(` dailyCals=${baseDailyCals} => ratioObj=`, ratioObj);

      // Build the dayMeals object
      const dayMeals = {};
      Object.entries(ratioObj).forEach(([cat, r]) => {
        const mealTarget = Math.round(baseDailyCals * r);
        console.log(`   ${cat} => ${Math.round(r*100)}% => target=${mealTarget}`);
        const meal = pickMealForCategory(cat, mealTarget, mealDatabase);
        dayMeals[cat] = meal;
      });

      // Now we have only the categories that appear in ratioObj
      const allCats = Object.keys(ratioObj); // e.g. ["Breakfast","Lunch","Dinner"]
      // We'll do page1 for the first 2 categories, page2 for the rest
      const page1Cats = allCats.slice(0,2);
      const page2Cats = allCats.slice(2);

      // ============ PAGE 1 ============ 
      const page1 = document.createElement("div");
      page1.className = "pdf-page meal-plan-page";
      // top-left logo
      const logo1 = document.createElement("div");
      logo1.className = "page-header-left-logo";
      logo1.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge" class="logo-badge"/>`;
      page1.appendChild(logo1);

      const heading1 = document.createElement("h3");
      heading1.className = "page-heading with-badge-logo";
      heading1.textContent = `Week ${w} - Day ${d}`;
      page1.appendChild(heading1);

      // For each cat in page1Cats
      page1Cats.forEach(cat => {
        const sh = document.createElement("h4");
        sh.className = "subheading";
        sh.textContent = cat;
        page1.appendChild(sh);

        const mealTbl = buildMealTable(dayMeals[cat], cat);
        page1.appendChild(mealTbl);
      });

      container.appendChild(page1);

      // ============ PAGE 2 ============ 
      // If page2Cats is empty, we skip
      if (page2Cats.length) {
        const page2 = document.createElement("div");
        page2.className = "pdf-page meal-plan-page";

        const logo2 = document.createElement("div");
        logo2.className = "page-header-left-logo";
        logo2.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge" class="logo-badge"/>`;
        page2.appendChild(logo2);

        const heading2 = document.createElement("h3");
        heading2.className = "page-heading with-badge-logo";
        heading2.textContent = `Week ${w} - Day ${d}`;
        page2.appendChild(heading2);

        page2Cats.forEach(cat => {
          const sh = document.createElement("h4");
          sh.className = "subheading";
          sh.textContent = cat;
          page2.appendChild(sh);

          const mealTbl = buildMealTable(dayMeals[cat], cat);
          page2.appendChild(mealTbl);
        });

        container.appendChild(page2);
      }
    }
  }
}

function fill12NutritionCoverPage() {
  const userName = getAdjustedUserName();
  const titleEl = document.getElementById("twelveWeekNutritionCoverTitle");
  if (titleEl) {
    if (userName === "User") {
      titleEl.textContent = "Your 12-Week Nutrition Guide";
    } else {
      titleEl.textContent = `${userName}'s 12-Week Nutrition Guide`;
    }
  }
}

function fill12NutritionNavPage() {
  const navDiv = document.getElementById("pdf12NutritionNavPage");
  if (!navDiv) return;

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
      </div>
      <h2 class="page-heading">Navigation</h2>
    `;

  const items = [
    { label: "Introduction", page: 3 },
    { label: "Weekly Calorie & Macro Overview", page: 4 },
    { label: "Essential Food Guide", page: 5 },
    { label: "Portioning & Structuring Your Meals", page: 6 },
    { label: "Nutrition Summary", page: 7 },
    { label: "Strategic Meal Prep & Time-Saving Guide", page: 9 },
    { label: "How to Eat for Long-Term Success", page: 10 },
    { label: "Eating Out & Social Events Guide", page: 11 },
    { label: "Grocery Planning & Substitutions", page: 12 },
  ];

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function fill12NutritionIntroPage() {
  const pageDiv = document.getElementById("pdf12NutritionIntroPage");
  if (!pageDiv) return;
  pageDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Introduction</h2>
 <div style="width:100%; height:200px; background:#ccc; border-radius:6px; margin-bottom:1rem; display:flex;align-items:center;justify-content:center;">
      <p style="text-align:center;">Image Placeholder</p>
    </div>

<p class="introduction-text">
  <strong>Welcome to Your 12-Week Nutrition Plan!</strong>

  Nutrition is more than just food—it’s about building sustainable habits that fuel performance, recovery, and long-term success. This 12-week guide will help you optimize your diet, stay consistent, and make informed choices that align with your goals.<br><br>

  Throughout this journey, you’ll learn how to structure your meals effectively, maintain flexibility, and develop a nutrition strategy that works for you.<br><br>

<b>Weekly Calorie & Macro Overview:</b> Your targets will adjust over 12 weeks to match your progress, ensuring you stay on track while optimizing energy and recovery.<br>
<b>Essential Food Guide:</b> Discover the best nutrient-dense foods to fuel workouts, enhance muscle growth, and support overall well-being throughout your journey.<br>
<b>Strategic Meal Prep & Time-Saving Tips:</b> Plan meals efficiently to reduce stress, stay organized, and ensure you always have the right foods on hand for success.<br>
  <b>Eating Out & Social Events Guide:</b> Enjoy meals while staying aligned with your goals.<br>
  <b>12-Week Meal Plan:</b> Follow a structured plan designed to simplify meal prep, balance macros, and support long-term consistency.<br>
  <b>How to Eat for Long-Term Success:</b> Build a balanced approach that sustains results beyond these 12 weeks.<br><br>

  Consistent habits create lasting results—let’s make these 12 weeks count!
</p>
  `;
}


function fill12NutritionCaloriePage() {
  const pageDiv = document.getElementById("pdf12NutritionCaloriePage");
  if (!pageDiv) return;

  // Clear existing content
  pageDiv.innerHTML = "";

  // 1) Page Header
  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
  pageDiv.appendChild(badgeLogo);

  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Weekly Calorie & Macro Overview";
  pageDiv.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.style.textAlign = "center";
  subtext.style.margin = "0 0 1rem 0";
  subtext.style.fontSize = "1rem";
  subtext.textContent = "Stay on track with a structured breakdown of your daily nutritional needs.";
  pageDiv.appendChild(subtext);

  // 2) Create Table
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table";
  table.id = "wcmoTable12";

  // Column widths
  const colgroupEl = document.createElement("colgroup");
  const colWeek = document.createElement("col");
  colWeek.style.width = "12%"; // "Week" column
  colgroupEl.appendChild(colWeek);
  for (let i = 0; i < 4; i++) {
    const col = document.createElement("col");
    col.style.width = "22%";
    colgroupEl.appendChild(col);
  }
  table.appendChild(colgroupEl);

  // Table header
  const thead = document.createElement("thead");
  const headTr = document.createElement("tr");
  const headers = ["Week", "Daily Calories", "Protein (g)", "Carbs (g)", "Fats (g)"];
  headers.forEach(txt => {
    const th = document.createElement("th");
    th.innerHTML = txt;
    headTr.appendChild(th);
  });
  thead.appendChild(headTr);
  table.appendChild(thead);

  // 3) Get user inputs from localStorage
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
  const userEffort = (localStorage.getItem("effort") || "").toLowerCase();
  const userGender = (localStorage.getItem("gender") || "").toLowerCase();

  // Make sure you have localStorage.setItem("maintenanceCalories", "2423") or similar
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  // Deload = maintenance by default
  const deloadCals = maintenanceCals;

  // Determine the user's min calorie cap
  let minCals = 1200; // default
  if (userGender === "male") {
    minCals = 1500;
  } else if (userGender === "female") {
    minCals = 1200;
  }

  // 4) Phase-based % arrays
  const WEIGHT_LOSS_MAP = {
    low:    [-0.10, -0.11, -0.12],
    medium: [-0.15, -0.17, -0.19],
    high:   [-0.20, -0.22, -0.24],
  };

  const MUSCLE_GAIN_MAP = {
    low:    [0.18, 0.20, 0.22],  // Higher base since early weeks scale gradually
    medium: [0.20, 0.22, 0.24],  // Balanced increase
    high:   [0.22, 0.24, 0.26],  // Stronger final push for max lean gain
};

const IMPROVE_MAP = {
  low: {
    deficit: [-0.08, -0.09, -0.10],  // Slightly deeper deficit
    surplus: [ 0.10,  0.11,  0.12],  // Smoother lean muscle gain
  },
  medium: {
    deficit: [-0.09, -0.10, -0.11],  
    surplus: [ 0.12,  0.13,  0.14],  
  },
  high: {
    deficit: [-0.10, -0.11, -0.12],  
    surplus: [ 0.14,  0.15,  0.16],  
  },
};

  /**
   *  A) Which "phase" index for weeks 1..4 => 0, 5..8 => 1, 9..12 => 2
   */
  function getPhaseForWeek(week) {
    if (week >= 9) return 3; // phase3
    if (week >= 5) return 2; // phase2
    return 1;               // phase1
  }
  function getPhaseIndex(week) {
    return getPhaseForWeek(week) - 1; // => 0..2
  }
  
  /**
   * For a 12‑week cycle:
   *
   * - For Weight Loss:
   *   * Weeks with remainder 1,2,3 (i.e. weeks 1,2,3,5,6,7,9,10,11): use deficit multipliers—
   *     but gradually: 50% in week1, 75% in week2, then 100% in week3.
   *   * Weeks where week % 4 === 0 are maintenance.
   *
   * - For Muscle Gain:
   *   * Weeks 1,2,3: use surplus multipliers gradually (50%, then 75%, then 100%), and week4 is maintenance.
   *
   * - For Improve Body Composition:
   *   * Use the same idea as above: For weeks with remainder 1 or 2, use partial multipliers;
   *     week 3 gets the full multiplier; week 4 is maintenance.
   */
  function getWeeklyPhaseLose(week) {
    return (week % 4 === 0) ? "maintenance" : "deficit";
  }
  function getWeeklyPhaseGain(week) {
    return (week % 4 === 0) ? "maintenance" : "surplus";
  }
  function getWeeklyPhaseImprove(week) {
    const mod = week % 4;
    if (mod === 0) return "maintenance";
    if (mod === 3) return "surplus";
    return "deficit";
  }
  function getWeeklyPhase(userGoal, week) {
    const g = userGoal.toLowerCase();
    if (g.includes("improve")) {
      return getWeeklyPhaseImprove(week);
    } else if (g.includes("gain")) {
      return getWeeklyPhaseGain(week);
    } else if (g.includes("lose")) {
      return getWeeklyPhaseLose(week);
    }
    return "maintenance"; // fallback
  }
  
  /**
   * getCalsForWeek
   * Combines the base maintenance calories (adjusted) with a multiplier
   * based on the weekly phase and the week’s position within the cycle.
   *
   * For weeks that are deficit or surplus, we now apply a gradual scale:
   *   - If week % 4 === 1, use 50% of the full multiplier.
   *   - If week % 4 === 2, use 75%.
   *   - If week % 4 === 3, use 100%.
   * Week % 4 === 0 returns maintenance.
   */
  function getCalsForWeek(week) {
    // 1) Base & phase determination
    const baseMaint = getAdjustedMaintenance(week, maintenanceCals, userGoal);
    const weeklyPhase = getWeeklyPhase(userGoal, week); // "maintenance", "deficit", or "surplus"
    const idx = getPhaseIndex(week); // 0..2 => which "phase" of the 12 weeks
    const mod = week % 4;            // 1..3 => partial fraction weeks, 0 => maintenance
  
    // If it's a maintenance week, just return base
    if (weeklyPhase === "maintenance") {
      return baseMaint;
    }
  
    // 2) Weight Loss logic
    if (userGoal.includes("lose") && weeklyPhase === "deficit") {
      // Use your WEIGHT_LOSS_MAP arrays
      const arr = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
      const basePct = arr[idx];  // e.g. -0.15, -0.17, -0.19 for medium
  
      if (mod === 1) {
        // Week 1 => 50% partial fraction
        return Math.round(baseMaint * (1 + basePct * 0.50));
      } else if (mod === 2) {
        // Week 2 => 75%
        return Math.round(baseMaint * (1 + basePct * 0.75));
      } else {
        // mod === 3 => 100%
        return Math.round(baseMaint * (1 + basePct));
      }
    }
  
    // 3) Muscle Gain logic (unchanged partial fraction)
    if (userGoal.includes("gain") && weeklyPhase === "surplus") {
      // Use your MUSCLE_GAIN_MAP arrays
      const arr = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
      const basePct = arr[idx];  // e.g. 0.20, 0.22, 0.24 for medium
  
      if (mod === 1) {
        // Week 1 => 50%
        return Math.round(baseMaint * (1 + basePct * 0.50));
      } else if (mod === 2) {
        // Week 2 => 75%
        return Math.round(baseMaint * (1 + basePct * 0.75));
      } else {
        // mod === 3 => 100%
        return Math.round(baseMaint * (1 + basePct));
      }
    }
  
    // 4) Improve Body Composition logic
    //    Remainder 1 => deficit(75%), remainder 2 => deficit(100%), remainder 3 => surplus(100%), remainder 0 => maint
    if (userGoal.includes("improve")) {
      const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
  
      if (weeklyPhase === "deficit") {
        // Check the deficit array
        const defArr = obj.deficit; // e.g. [-0.09, -0.10, -0.11] for medium
        const basePct = defArr[idx];
  
        if (mod === 1) {
          // First deficit => 75%
          return Math.round(baseMaint * (1 + basePct * 0.75));
        } else {
          // mod === 2 => second deficit => 100%
          // mod === 3 => also "deficit"? (Shouldn't happen if your getWeeklyPhase says mod=3 => surplus)
          return Math.round(baseMaint * (1 + basePct));
        }
      } else if (weeklyPhase === "surplus") {
        // Check the surplus array
        const surArr = obj.surplus; // e.g. [0.12, 0.13, 0.14]
        const basePct = surArr[idx];
        // Always 100% for the surplus in improve body comp
        return Math.round(baseMaint * (1 + basePct));
      }
      // if it's "maintenance", we handled that at the top
    }
  
    // 5) Fallback (shouldn't occur if your getWeeklyPhase is correct)
    return baseMaint;
    
    // // For deficit weeks that are full (i.e. week % 4 === 3)
    // if (weeklyPhase === "deficit") {
    //   if (userGoal.includes("lose")) {
    //     const arr = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
    //     const pct = arr[idx] || -0.20;
    //     return Math.round(baseMaint * (1 + pct));
    //   } else if (userGoal.includes("improve")) {
    //     const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
    //     const defArr = obj.deficit || [-0.06, -0.07, -0.08];
    //     const pct = defArr[idx];
    //     return Math.round(baseMaint * (1 + pct));
    //   }
    //   return baseMaint;
    // }
    
    // // For surplus weeks that are full (i.e. week % 4 === 3)
    // if (weeklyPhase === "surplus") {
    //   if (userGoal.includes("gain")) {
    //     const arr = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
    //     const pct = arr[idx] || 0.12;
    //     return Math.round(baseMaint * (1 + pct));
    //   } else if (userGoal.includes("improve")) {
    //     const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
    //     const surArr = obj.surplus || [0.10, 0.09, 0.08];
    //     const pct = surArr[idx];
    //     return Math.round(baseMaint * (1 + pct));
    //   }
    //   return baseMaint;
    // }
    
    // // Fallback (should not occur)
    // return baseMaint;
  }
  
  // 5) Build Table Rows for Weeks 1..12
  const tbody = document.createElement("tbody");

  for (let w = 1; w <= 12; w++) {
    // 1) Calculate raw cals
    let dailyCals = getCalsForWeek(w);

    // 2) Clamp to minCals
    dailyCals = Math.max(dailyCals, minCals);

    // 3) Macro breakdown
    const p = Math.round((0.3 * dailyCals) / 4);
    const c = Math.round((0.4 * dailyCals) / 4);
    const f = Math.round((0.3 * dailyCals) / 9);

    localStorage.setItem(`week${w}_dailyCalsWMCO`, String(dailyCals));
    localStorage.setItem(`week${w}_proteinWMCO`,  String(p));
    localStorage.setItem(`week${w}_carbsWMCO`,    String(c));
    localStorage.setItem(`week${w}_fatsWMCO`,     String(f));

    // 4) Build row
    const tr = document.createElement("tr");

    const tdWeek = document.createElement("td");
    tdWeek.textContent = w;
    tr.appendChild(tdWeek);

    const tdCals = document.createElement("td");
    tdCals.textContent = dailyCals + " kcals";
    tr.appendChild(tdCals);

    const tdP = document.createElement("td");
    tdP.textContent = p + " g";
    tr.appendChild(tdP);

    const tdCarbs = document.createElement("td");
    tdCarbs.textContent = c + " g";
    tr.appendChild(tdCarbs);

    const tdF = document.createElement("td");
    tdF.textContent = f + " g";
    tr.appendChild(tdF);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  // 6) (Optional) Footer
  const foot = createMainFooter(0, 0);
  pageDiv.appendChild(foot);
}

function fill12EssentialFoodGuidePage() {
  const pg = document.getElementById("pdf12EssentialFoodGuidePage");
  if (!pg) return;

  // 1) Insert the table markup with colgroup for widths
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge" />
    </div>
    <h2 class="page-heading">Essential Food Guide</h2>
    <p style="text-align:center; margin-bottom:1rem; font-size:1rem;">
      Discover the best food choices to fuel your progress and optimize results.
    </p>

    <div class="session-table-container modern-table-wrapper efg-table">
      <table class="session-table modern-table efg-table">
        <!-- Make the left column (Food) wider, and the 3 macro columns narrower -->
        <colgroup>
          <col style="width: 35%;" />   <!-- Food column -->
          <col style="width: 21.6667%;" /> <!-- Protein -->
          <col style="width: 21.6667%;" /> <!-- Carbs -->
          <col style="width: 21.6667%;" /> <!-- Fats -->
        </colgroup>
        <thead>
          <tr>
            <th>Food<br>(100g)</th>
            <th>Protein<br>(g)</th>
            <th>Carbs<br>(g)</th>
            <th>Fats<br>(g)</th>
          </tr>
        </thead>
        <tbody id="efgTbody12"></tbody>
      </table>
    </div>
  `;

  const tBody = pg.querySelector("#efgTbody12");
  if (!tBody) return;

  // 2) Define your foods array
  const foods = [
    { name: "Chicken Breast", p: 31, c: 0, f: 3 },
    { name: "Eggs (whole)", p: 13, c: 1, f: 11 },
    { name: "Greek Yogurt (low-fat)", p: 10, c: 3, f: 0.4 },
    { name: "Canned Tuna", p: 24, c: 0, f: 1 },
    { name: "Brown Rice", p: 2.5, c: 23, f: 0.9 },
    { name: "Sweet Potato", p: 2, c: 20, f: 0.1 },
    { name: "Oats (dry)", p: 13, c: 66, f: 6 },
    { name: "Banana", p: 1.3, c: 23, f: 0.3 },
    { name: "Avocado", p: 2, c: 9, f: 15 },
    { name: "Almonds (raw)", p: 21, c: 22, f: 50 },
    { name: "Olive Oil", p: 0, c: 0, f: 100 },
    { name: "Peanut Butter", p: 25, c: 20, f: 50 }
  ];

  // 3) Create rows, highlight macros
  foods.forEach((food) => {
    const tr = document.createElement("tr");

    // Determine the highest macro for this food
    const maxMacro = Math.max(food.p, food.c, food.f);

    // (A) Food name cell
    const tdName = document.createElement("td");
    tdName.textContent = food.name;
    tdName.style.textAlign = "left";
    tr.appendChild(tdName);

    // (B) Protein cell
    const tdP = document.createElement("td");
    tdP.textContent = food.p;
    // If protein is the highest (and > 0), make it green; else red
    if (food.p === maxMacro && maxMacro > 0) {
      tdP.classList.add("macro-highlight-green");
    } else {
      tdP.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdP);

    // (C) Carbs cell
    const tdC = document.createElement("td");
    tdC.textContent = food.c;
    if (food.c === maxMacro && maxMacro > 0) {
      tdC.classList.add("macro-highlight-green");
    } else {
      tdC.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdC);

    // (D) Fats cell
    const tdF = document.createElement("td");
    tdF.textContent = food.f;
    if (food.f === maxMacro && maxMacro > 0) {
      tdF.classList.add("macro-highlight-green");
    } else {
      tdF.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdF);

    // (E) Apply "yellow" overrides for specific foods/macros
    // Oats (dry) => highlight protein in yellow if p=13
    if (food.name === "Oats (dry)" && food.p === 13) {
      tdP.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdP.classList.add("macro-highlight-yellow");
    }
    // Almonds (raw) => highlight protein & carbs in yellow
    if (food.name === "Almonds (raw)" && food.p === 21) {
      tdP.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdP.classList.add("macro-highlight-yellow");
    }
    if (food.name === "Almonds (raw)" && food.c === 22) {
      tdC.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdC.classList.add("macro-highlight-yellow");
    }
    // Peanut Butter => highlight protein & carbs in yellow
    if (food.name === "Peanut Butter" && food.p === 25) {
      tdP.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdP.classList.add("macro-highlight-yellow");
    }
    if (food.name === "Peanut Butter" && food.c === 20) {
      tdC.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdC.classList.add("macro-highlight-yellow");
    }
    // Eggs (whole) => highlight fat in yellow if f=11
    if (food.name === "Eggs (whole)" && food.f === 11) {
      tdF.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdF.classList.add("macro-highlight-yellow");
    }

    // Append the row
    tBody.appendChild(tr);
  });

  // 4) (Optional) Add your own footer
  // e.g. const foot = createMainFooter(0, 0);
  // pg.appendChild(foot);
}

function fill12PortionStructPage() {
  const pageDiv = document.getElementById("pdf12PortionStructPage");
  if (!pageDiv) return;

  // Page heading and subtext
  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Portioning & Structuring Your Meals</h2>
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      Portion sizes can be estimated using your hands as a guide, making it easy
      to eat balanced meals without a scale.
    </p>
  `;

  /*
   * ─────────────────────────────────────────────────────────────────
   * 1) TOP TABLE: "Portion sizes" (4 columns)
   *    Make the left column slightly narrower and the right column wider
   * ─────────────────────────────────────────────────────────────────
   */
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table portion-table-adjusted";

  // <colgroup> to control column widths (slightly narrower 1st col, wider 4th col)
  const colgroupTop = document.createElement("colgroup");

  // Adjust these % values to tweak how narrow/wide columns should be
  const col1 = document.createElement("col");
  col1.style.width = "18%"; // Left column (Nutrient) slightly narrower

  const col2 = document.createElement("col");
  col2.style.width = "25%"; // Hand-Size Method

  const col3 = document.createElement("col");
  col3.style.width = "25%"; // Measured Serving

  const col4 = document.createElement("col");
  col4.style.width = "32%"; // Examples (wider)

  colgroupTop.appendChild(col1);
  colgroupTop.appendChild(col2);
  colgroupTop.appendChild(col3);
  colgroupTop.appendChild(col4);

  table.appendChild(colgroupTop);

  // Thead
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  const headers = ["Nutrient", "Hand-Size Method", "Measured Serving", "Examples"];
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");
  const rowData = [
    ["Protein", "Palm-sized", "~100-150g (3.5-5oz)", "Chicken, Fish, Tofu, Eggs"],
    ["Carbs", "Cupped hand", "~40-60g (½-⅔ cup)", "Rice, Oats, Potatoes, Pasta"],
    ["Veggies", "Unlimited", "~1-2 cups", "Leafy Greens, Broccoli, Peppers"]
  ];
  rowData.forEach((rowArr) => {
    const tr = document.createElement("tr");
    rowArr.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  /*
   * ─────────────────────────────────────────────────────────────────
   * 2) SUBTEXT BETWEEN TABLES
   * ─────────────────────────────────────────────────────────────────
   */
  const mbfSubtext = document.createElement("p");
  mbfSubtext.style.textAlign = "center";
  mbfSubtext.style.fontSize = "1rem";
  mbfSubtext.style.margin = "2rem 0 1rem 0";
  mbfSubtext.innerHTML = `
    Use this simple formula to build balanced meals—pick one option from each category to meet your macro needs.
  `;
  pageDiv.appendChild(mbfSubtext);

  /*
   * ─────────────────────────────────────────────────────────────────
   * 3) SECOND TABLE: Meal-Building Framework (2 columns, 20:80)
   * ─────────────────────────────────────────────────────────────────
   */
  const mbfTableWrap = document.createElement("div");
  mbfTableWrap.className = "session-table-container modern-table-wrapper twocol-20-80";

  const mbfTable = document.createElement("table");
  mbfTable.className = "session-table modern-table twocol-20-80";

  // Enforce 20%:80% with colgroup
  const colgroup = document.createElement("colgroup");
  const colLeft = document.createElement("col");
  colLeft.style.width = "20%";
  const colRight = document.createElement("col");
  colRight.style.width = "80%";
  colgroup.appendChild(colLeft);
  colgroup.appendChild(colRight);
  mbfTable.appendChild(colgroup);

  // Thead
  const mbfThead = document.createElement("thead");
  const mbfTrHead = document.createElement("tr");
  const thLeft = document.createElement("th");
  thLeft.textContent = "Step";
  const thRight = document.createElement("th");
  thRight.textContent = "Pick One (Examples)";
  mbfTrHead.appendChild(thLeft);
  mbfTrHead.appendChild(thRight);
  mbfThead.appendChild(mbfTrHead);
  mbfTable.appendChild(mbfThead);

  // Tbody
  const mbfTbody = document.createElement("tbody");
  const mbfRows = [
    ["Protein", "Chicken, Salmon, Tofu, Greek Yogurt, Eggs"],
    ["Carbs", "Rice, Quinoa, Potatoes, Pasta, Oats"],
    ["Fats", "Avocado, Olive Oil, Nuts, Cheese"],
    ["Veggies", "Leafy Greens, Broccoli, Peppers, Carrots"],
    ["Seasonings", "Herbs, Spices, Lemon, Vinegar"]
  ];
  mbfRows.forEach(([step, examples]) => {
    const tr = document.createElement("tr");
    const tdStep = document.createElement("td");
    tdStep.textContent = step;
    const tdExamples = document.createElement("td");
    tdExamples.textContent = examples;
    tr.appendChild(tdStep);
    tr.appendChild(tdExamples);
    mbfTbody.appendChild(tr);
  });
  mbfTable.appendChild(mbfTbody);
  mbfTableWrap.appendChild(mbfTable);
  pageDiv.appendChild(mbfTableWrap);

}

// ===============================
// PAGE 1: Nutrition Summary Page 1
// ===============================
function fill12NutritionSummaryPage1() {
  const pg = document.getElementById("pdf12NutritionSummaryPage1");
  if (!pg) return;

  // Main header and intro
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Nutrition Summary</h2>
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      A streamlined summary to help you structure meals, adjust your nutrition, 
      and stay on track with your goals.
    </p>
    <p style="font-weight:bold; font-size:1.1rem; text-align:center; margin-bottom:1rem;">
      Balance your plate with the right mix of macronutrients.
    </p>
  `;

  // 1) Table: "Macronutrient | Function | Food Sources"
  const tableWrap1 = document.createElement("div");
  tableWrap1.className = "session-table-container modern-table-wrapper";
  const table1 = document.createElement("table");
  table1.className = "session-table modern-table";

  // Thead for first table
  const thead1 = document.createElement("thead");
  const thr1 = document.createElement("tr");
  ["Macronutrient", "Function", "Food Sources"].forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    thr1.appendChild(th);
  });
  thead1.appendChild(thr1);
  table1.appendChild(thead1);

  // Tbody for first table
  const tbody1 = document.createElement("tbody");
  const macroRows = [
    ["Protein", "Builds & repairs muscle", "Chicken, Salmon, Tofu, Eggs"],
    ["Carbs", "Provides energy", "Rice, Oats, Potatoes, Pasta"],
    ["Fats", "Supports hormones & brain function", "Avocado, Nuts, Olive Oil"],
  ];
  macroRows.forEach((r) => {
    const tr = document.createElement("tr");
    r.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody1.appendChild(tr);
  });
  table1.appendChild(tbody1);
  tableWrap1.appendChild(table1);
  pg.appendChild(tableWrap1);

  // 2) Bold subtext and description
  const pBold1 = document.createElement("p");
  pBold1.style.fontWeight = "bold";
  pBold1.style.textAlign = "center";
  pBold1.style.margin = "1rem 0 0.5rem 0";
  pBold1.style.fontSize = "1.1rem";
  pBold1.textContent = "Follow this simple structure to create balanced meals.";
  pg.appendChild(pBold1);

  const pDesc = document.createElement("p");
  pDesc.style.textAlign = "center";
  pDesc.style.marginBottom = "1.5rem";
  pDesc.style.fontSize = "1rem";
  pDesc.textContent =
    "Protein (Palm-Sized) + Carbs (Cupped-Hand) + Fats (Thumb-Sized) + Veggies (Unlimited)";
  pg.appendChild(pDesc);

  // 3) Second table (2 columns: 20%/80% split)
  const tableWrap2 = document.createElement("div");
  tableWrap2.className = "session-table-container modern-table-wrapper twocol-20-80";
  const table2 = document.createElement("table");
  table2.className = "session-table modern-table twocol-20-80";

  // Insert colgroup to enforce 20:80 split
  const colgroup2 = document.createElement("colgroup");
  const colLeft2 = document.createElement("col");
  colLeft2.style.width = "30%";
  const colRight2 = document.createElement("col");
  colRight2.style.width = "70%";
  colgroup2.appendChild(colLeft2);
  colgroup2.appendChild(colRight2);
  table2.appendChild(colgroup2);

  // Thead for second table
  const thead2 = document.createElement("thead");
  const thr2 = document.createElement("tr");
  ["Step", "Choose One (Examples)"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    thr2.appendChild(th);
  });
  thead2.appendChild(thr2);
  table2.appendChild(thead2);

  // Tbody for second table
  const tbody2 = document.createElement("tbody");
  const data2 = [
    ["Protein", "Chicken, Salmon, Tofu, Greek Yogurt"],
    ["Carbs", "Rice, Quinoa, Sweet Potatoes, Oats"],
    ["Healthy Fats", "Avocado, Nuts, Olive Oil"],
    ["Veggies", "Leafy Greens, Broccoli, Peppers"],
  ];
  data2.forEach((row) => {
    const tr = document.createElement("tr");
    const tdLeft = document.createElement("td");
    tdLeft.textContent = row[0];
    const tdRight = document.createElement("td");
    tdRight.textContent = row[1];
    tr.appendChild(tdLeft);
    tr.appendChild(tdRight);
    tbody2.appendChild(tr);
  });
  table2.appendChild(tbody2);
  tableWrap2.appendChild(table2);
  pg.appendChild(tableWrap2);
}

// ===============================
// PAGE 2: Nutrition Summary Page 2
// ===============================
function fill12NutritionSummaryPage2() {
  const pg = document.getElementById("pdf12NutritionSummaryPage2");
  if (!pg) return;

  // Main header and intro
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Nutrition Summary</h2>
    <p style="text-align:center; font-size:1rem; margin-top:0; margin-bottom:1.5rem;">
      A streamlined summary to help you structure meals, adjust your nutrition, 
      and stay on track with your goals.
    </p>
  `;

  // 1) Bold subtext for page 2
  const pBold = document.createElement("p");
  pBold.style.fontWeight = "bold";
  pBold.style.textAlign = "center";
  pBold.style.margin = "1rem 0 0.5rem 0";
  pBold.style.fontSize = "1.1rem";
  pBold.textContent =
    "Out of an ingredient? Swap it with these easy alternatives.";
  pg.appendChild(pBold);

  // 2) First table on page 2 (2 columns with 20:80 split)
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper twocol-20-80";
  const table = document.createElement("table");
  table.className = "session-table modern-table twocol-20-80";

  // Insert colgroup for 20:80 split
  const colgroup = document.createElement("colgroup");
  const colLeft = document.createElement("col");
  colLeft.style.width = "25%";
  const colRight = document.createElement("col");
  colRight.style.width = "75%";
  colgroup.appendChild(colLeft);
  colgroup.appendChild(colRight);
  table.appendChild(colgroup);

  // Thead for first table on page 2
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["Swap This", "Use These Instead"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody for first table on page 2
  const tbody = document.createElement("tbody");
  const data = [
    ["Chicken", "Turkey, Lean Beef, Tofu"],
    ["White Rice", "Quinoa, Cauliflower Rice, Whole Wheat Couscous"],
    ["Butter", "Olive Oil, Avocado, Coconut Oil"],
  ];
  data.forEach((row) => {
    const tr = document.createElement("tr");
    const tdLeft = document.createElement("td");
    tdLeft.textContent = row[0];
    const tdRight = document.createElement("td");
    tdRight.textContent = row[1];
    tr.appendChild(tdLeft);
    tr.appendChild(tdRight);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pg.appendChild(tableWrap);

  // 3) Small subheading and final text
  const subHeading = document.createElement("h3");
  subHeading.style.textAlign = "center";
  subHeading.style.margin = "2rem 0 0.5rem 0";
  subHeading.style.fontSize = "1.2rem";
  subHeading.textContent = "What's Next?";
  pg.appendChild(subHeading);

  const pBold2 = document.createElement("p");
  pBold2.style.textAlign = "center";
  pBold2.style.margin = "1.5rem 0 0 0";
  pBold2.style.fontSize = "1rem";
  pBold2.textContent = `
    You now have the knowledge to structure balanced meals. Ready to put it into action?
    Head over to your 4-Week Meal Plan for everything mapped out for you. 
    The next few pages offer simple ingredient swaps if you ever want variety while staying on track.
  `;
  pg.appendChild(pBold2);
}

function fill12MealPrepTimePage() {
  const pg = document.getElementById("pdf12MealPrepTimePage");
  if (!pg) return;
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
    </div>

    <!-- Title Section -->
    <h2 class="page-heading">🍽️ Meal Prep & Time-Saving Guide</h2>
    <p class="page-subheading">
      Save time, stay on track, and make healthy eating effortless.
    </p>

    <!-- Content Wrapper with Background Color -->
    <div class="content-container">
      
      <!-- Meal Prep Strategy -->
      <div class="info-box">
        <h3>📌 The 3-Step Meal Prep Strategy</h3>
        <p style = "text-align: center;">Effortless meal prep in three simple steps.</p>
        <ul>
          <li><strong>Plan:</strong> Choose 2-3 staple meals per category.</li>
          <li><strong>Prep:</strong> Batch-cook proteins, carbs, veggies at the start of the week.</li>
          <li><strong>Portion:</strong> Store meals in ready-to-eat containers.</li>
        </ul>
        <p class="pro-tip">💡 <strong>Pro Tip:</strong> Rotate spices & sauces to keep meals exciting!</p>
      </div>

      <!-- Time-Saving Hacks -->
      <div class="info-box alt-background">
        <h3>⏳ Time-Saving Hacks for Meal Prep</h3>
        <ul>
          <li>🍲 Cook Once, Eat Twice</li>
          <li>🔥 Use a Slow Cooker or Instant Pot</li>
          <li>🔪 Pre-Chop Veggies & Proteins</li>
          <li>🥩 Choose Quick & Easy Proteins</li>
          <li>📦 Invest in Meal Prep Containers</li>
        </ul>
      </div>

      <!-- Smart Grocery Shopping Strategy -->
      <div class="info-box">
        <h3>🛒 Smart Grocery Shopping Strategy</h3>
        <ul>
          <li>📋 Create a Master Grocery List</li>
          <li>🛍️ Shop Once Per Week</li>
          <li>📌 Organize Your List by Aisle</li>
          <li>❄️ Buy Frozen & Canned Options</li>
          <li>🚚 Use Delivery or Pickup Services</li>
        </ul>
      </div>

      <!-- Final Tip -->
      <div class="final-tip">
        <h3>🚀 Final Tip: Start Small & Stay Consistent!</h3>
      </div>
      
    </div>
  `;
}

function fill12LongTermSuccessPage() {
  const pg = document.getElementById("pdf12LongTermSuccessPage");
  if (!pg) return;
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
    </div>

    <!-- Title Section -->
    <h2 class="page-heading">🏆 How to Eat for Long-Term Success</h2>
    <p class="page-subheading">Build habits, not restrictions.</p>

    <!-- Content Wrapper with Background Color -->
    <div class="content-container">

      <!-- Sustainability -->
      <div class="info-box">
        <h3>🌱 The Key to Success: Sustainability</h3>
        <ul>
          <li>🚫 Avoid extreme restrictions—enjoy the foods you love.</li>
          <li>⚖️ Follow the 80/20 rule—80% whole foods, 20% flexibility.</li>
        </ul>
        <p class="pro-tip">💡 <strong>Pro Tip:</strong> Swap foods instead of cutting them out!</p>
      </div>

      <!-- Mindset Shift -->
      <div class="info-box alt-background">
        <h3>🧠 Stop "Dieting"—Think Long-Term</h3>
        <ul>
          <li>🔄 Ditch yo-yo dieting—drastic changes don’t last.</li>
          <li>🍽️ Eat mindfully—listen to hunger & fullness.</li>
          <li>📝 Plan ahead for success.</li>
        </ul>
      </div>

      <!-- Simple Eating Framework -->
      <div class="info-box">
        <h3>🍽️ Simple Eating Framework</h3>
        <ul>
          <li>🥩 Build balanced meals—protein, carbs, fats, fiber.</li>
          <li>💧 Stay hydrated—water fuels energy & digestion.</li>
        </ul>
      </div>

      <!-- Action Plan -->
      <div class="info-box alt-background">
        <h3>🚀 Action Plan: Maintain Progress</h3>
        <ul>
          <li>📊 Adjust portions as goals change.</li>
          <li>🥘 Keep meal prep simple & enjoyable.</li>
        </ul>
      </div>

      <!-- Final Tip -->
      <div class="final-tip">
        <h3>🏆 Final Tip: Think Long-Term!</h3>
      </div>

    </div>
  `;
}

function fill12EatingOutSocialPage() {
  const pg = document.getElementById("pdf12EatingOutSocialPage");
  if (!pg) return;
  pg.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
    </div>

    <!-- Title Section -->
    <h2 class="page-heading">🍽️ Eating Out & Social Events Guide</h2>
    <p class="page-subheading">Enjoy social life without derailing progress.</p>

    <!-- Content Wrapper with Background Color -->
    <div class="content-container">

      <!-- Plan, Don’t Panic -->
      <div class="info-box">
        <h3>🛑 Plan, Don’t Panic</h3>
        <ul>
          <li>😌 One meal won’t ruin progress—relax & enjoy.</li>
          <li>📋 Check the menu & plan ahead.</li>
          <li>🍏 Have a light snack before heading out.</li>
        </ul>
        <p class="pro-tip">💡 <strong>Pro Tip:</strong> Prioritize protein & veggies.</p>
      </div>

      <!-- Smart Ordering -->
      <div class="info-box alt-background">
        <h3>🥗 Smart Ordering</h3>
        <ul>
          <li>🍗 Choose lean protein—chicken, fish, tofu.</li>
          <li>🥦 Add veggies for fiber & balance.</li>
          <li>🚰 Stick to water or low-calorie drinks.</li>
        </ul>
      </div>

      <!-- Social Events & Buffets -->
      <div class="info-box">
        <h3>🎉 Social Events & Buffets</h3>
        <ul>
          <li>🍽️ Use a smaller plate & start with protein.</li>
        </ul>
        <p class="pro-tip">💡 <strong>Pro Tip:</strong> Eat lighter earlier if a big event is coming up!</p>
      </div>

      <!-- Action Plan -->
      <div class="info-box alt-background">
        <h3>🚀 After a Big Meal</h3>
        <ul>
          <li>🔄 Get back on track next meal.</li>
          <li>💧 Stay hydrated—water aids digestion.</li>
        </ul>
      </div>

      <!-- Final Tip -->
      <div class="final-tip">
        <h3>⚖️ Final Tip: Balance, Not Perfection!</h3>
      </div>

    </div>
  `;
}

function fill12GroceryPlanningPage() {
  // Page 1 data – Protein Sources
  const proteinData = [
    { main: "Chicken Breast", alt: "Turkey, Lean Beef, Tofu, Seitan" },
    { main: "Ground Beef", alt: "Ground Turkey, Chicken, Lentils" },
    { main: "Salmon", alt: "Tuna, White Fish, Tempeh" },
    { main: "Eggs", alt: "Egg Whites, Chia Seeds, Silken Tofu" },
    { main: "Greek Yogurt", alt: "Cottage Cheese, Skyr, Plant-Based Yogurt" },
    { main: "Milk (Dairy)", alt: "Almond Milk, Oat Milk, Soy Milk" },
    { main: "Cheese", alt: "Nutritional Yeast, Vegan Cheese, Cottage Cheese" },
    { main: "Whey Protein", alt: "Plant-Based Protein, Collagen Powder" },
    { main: "Tofu", alt: "Tempeh, Seitan, Chickpeas" },
    { main: "Lentils", alt: "Black Beans, Kidney Beans, Chickpeas" },
    { main: "Duck", alt: "Chicken, Turkey, Lean Beef" },
    { main: "Pork (Lean)", alt: "Chicken, Turkey, Tempeh" },
  ];

  // Page 2 data – Carb & Grain Substitutes
  const carbData = [
    { main: "Rice", alt: "Quinoa, Cauliflower Rice, Whole Wheat Couscous" },
    { main: "Pasta", alt: "Whole Wheat Pasta, Zucchini Noodles, Chickpea Pasta" },
    { main: "Bread", alt: "Whole Wheat Bread, Sourdough, Rye Bread" },
    { main: "Oats", alt: "Quinoa Flakes, Chia Pudding, Buckwheat" },
    { main: "Potatoes", alt: "Sweet Potatoes, Butternut Squash, Parsnips" },
    { main: "Cereal", alt: "Granola, Overnight Oats, Chia Pudding" },
    { main: "Crackers", alt: "Whole Wheat Crackers, Rice Cakes, Corn Cakes" },
    { main: "Flour (Wheat)", alt: "Almond Flour, Coconut Flour, Oat Flour" },
    { main: "Tortilla Wraps", alt: "Whole Wheat Wraps, Lettuce Wraps, Corn Tortillas" },
    { main: "White Sugar", alt: "Honey, Maple Syrup, Coconut Sugar" },
    { main: "Couscous", alt: "Quinoa, Brown Rice, Bulgur" },
    { main: "Corn Tortilla", alt: "Whole Wheat Tortilla, Lettuce Wraps, Almond Flour Wraps" },
  ];

  // Page 3 data – Fats & Cooking Substitutes
  const fatsData = [
    { main: "Butter", alt: "Coconut Oil, Olive Oil, Avocado" },
    { main: "Cooking Oil", alt: "Olive Oil, Avocado Oil, Ghee" },
    { main: "Mayonnaise", alt: "Greek Yogurt, Mashed Avocado, Hummus" },
    { main: "Peanut Butter", alt: "Almond Butter, Sunflower Seed Butter, Cashew Butter" },
    { main: "Cream (Dairy)", alt: "Coconut Cream, Greek Yogurt, Cashew Cream" },
    { main: "Avocado", alt: "Hummus, Guacamole, Cottage Cheese" },
    { main: "Nuts", alt: "Seeds (Sunflower, Pumpkin), Nut-Free Granola" },
    { main: "Coconut Milk", alt: "Almond Milk, Oat Milk, Cashew Milk" },
    { main: "Chocolate", alt: "Cacao Nibs, Dark Chocolate, Carob Powder" },
    { main: "Ice Cream", alt: "Frozen Yogurt, Banana Ice Cream, Coconut Ice Cream" },
    { main: "Sour Cream", alt: "Greek Yogurt, Cottage Cheese, Cashew Cream" },
    { main: "Shortening", alt: "Butter, Coconut Oil, Applesauce (for baking)" },
  ];

  // --- Page 1: Protein Substitutes ---
  const pg1 = document.getElementById("pdf12GroceryPlanningPage1");
  if (pg1) {
    pg1.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
      </div>
      <h2 class="page-heading with-badge-logo">Protein Substitutes</h2>
      <p style="text-align:center; font-size:1rem;">
        Your 4‑Week meal plan is structured, but this guide is always here if you want variety.
        Swap these protein sources while maintaining balanced nutrition.
      </p>
    `;
    build12SubTable(pg1, proteinData);
  }

  // --- Page 2: Carb & Grain Sources ---
  const pg2 = document.getElementById("pdf12GroceryPlanningPage2");
  if (pg2) {
    pg2.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
      </div>
      <h2 class="page-heading with-badge-logo">Carb & Grain Substitutes</h2>
      <p style="text-align:center; font-size:1rem;">
        Your 4‑Week meal plan is structured, but this guide is always here if you want variety.
        Swap these carb sources while maintaining balanced nutrition.
      </p>
    `;
    build12SubTable(pg2, carbData);
  }

  // --- Page 3: Fats & Cooking Substitutes ---
  const pg3 = document.getElementById("pdf12GroceryPlanningPage3");
  if (pg3) {
    pg3.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB Logo" class="logo-badge"/>
      </div>
      <h2 class="page-heading with-badge-logo">Fats & Cooking Substitutes</h2>
      <p style="text-align:center; font-size:1rem;">
        Your 4‑Week meal plan is structured, but this guide is always here if you want variety.
        Swap these fat sources while maintaining balanced nutrition.
      </p>
    `;
    build12SubTable(pg3, fatsData);
  }
}

/**
 * Helper function to build the substitution table.
 * Inserts a table with two columns: "Main Ingredient" and "Alternative Ingredients"
 * using a 20:80 left-to-right column width split.
 */
function build12SubTable(pg, dataRows) {
  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper grocery-sub-table";

  const table = document.createElement("table");
  table.className = "session-table modern-table grocery-sub-table";

  // Enforce 20:80 column split
  const colgroup = document.createElement("colgroup");
  const colLeft = document.createElement("col");
  colLeft.style.width = "25%";
  const colRight = document.createElement("col");
  colRight.style.width = "75%";
  colgroup.appendChild(colLeft);
  colgroup.appendChild(colRight);
  table.appendChild(colgroup);

  // Create table header.
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  const th1 = document.createElement("th");
  th1.textContent = "Main Ingredient";
  const th2 = document.createElement("th");
  th2.textContent = "Alternative Ingredients";
  thr.appendChild(th1);
  thr.appendChild(th2);
  thead.appendChild(thr);
  table.appendChild(thead);

  // Build table body.
  const tbody = document.createElement("tbody");
  dataRows.forEach(item => {
    const tr = document.createElement("tr");
    const tdMain = document.createElement("td");
    tdMain.textContent = item.main;
    const tdAlt = document.createElement("td");
    tdAlt.textContent = item.alt;
    tr.appendChild(tdMain);
    tr.appendChild(tdAlt);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pg.appendChild(tableWrap);
}

// ============== PDF #5: 12-Week-Meal-Plan-Foundation =============

function buildPdf12MealPlanFoundation() {
  fillMealPlanFoundationCover();
  fillMealPlanFoundationNav();
  buildAndRender12WeekMealPlan("pdf12MealPlanFoundationContainer", 1, 4);
  addPageNumbers("pdf12MealPlanFoundation");
}
function fillMealPlanFoundationCover() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("twelveWeekMealPlanFoundationTitle");
  if (coverTitleEl) {
    if (adjustedName === "Committed Champion") {
      coverTitleEl.textContent = "Your 12-Week Meal Plan";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 12-Week Meal Plan`;
    }
  }
}

function fillMealPlanFoundationNav() {
  const navDiv = document.getElementById("pdf12MealPlanFoundationNavPage");
  if (!navDiv) return;

  // Read mealFrequency from localStorage
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "3", 10);

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  // If mealFrequency=2 => (Week 1 => p3, Week 2 => p10, Week 3 => p17, Week 4 => p24)
  // Otherwise => (Week 1 => p3, Week 2 => p17, Week 3 => p31, Week 4 => p45)
  let items;
  if (mealFrequency === 2) {
    items = [
      { label: "Week 1", page: 3 },
      { label: "Week 2", page: 10 },
      { label: "Week 3", page: 17 },
      { label: "Week 4", page: 24 },
    ];
  } else {
    items = [
      { label: "Week 1", page: 3 },
      { label: "Week 2", page: 17 },
      { label: "Week 3", page: 31 },
      { label: "Week 4", page: 45 },
    ];
  }

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function buildMealPlanFoundationPages() {
  const container = document.getElementById("pdf12MealPlanFoundationContainer");
  if (!container) return;

  // Clear out any existing placeholder
  container.innerHTML = "";

  // Now call your 4-week function, restricting it to weeks 1..4
  build28DayMealPlanRework({
    fromWeek: 1,
    toWeek: 4,
    targetContainerId: "pdf12MealPlanFoundationContainer"
  });
}

// ============== PDF #6: 12-Week-Meal-Plan-Hypertrophy =============

function buildPdf12MealPlanHypertrophy() {
  fillMealPlanHypertrophyCover();
  fillMealPlanHypertrophyNav();
  buildAndRender12WeekMealPlan("pdf12MealPlanHypertrophyContainer", 5, 8);
  addPageNumbers("pdf12MealPlanHypertrophy");
}


function fillMealPlanHypertrophyCover() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("twelveWeekMealPlanHypertrophyTitle");
  if (coverTitleEl) {
    if (adjustedName === "Committed Champion") {
      coverTitleEl.textContent = "Your 12-Week Meal Plan";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 12-Week Meal Plan`;
    }
  }
}

function fillMealPlanHypertrophyNav() {
  const navDiv = document.getElementById("pdf12MealPlanHypertrophyNavPage");
  if (!navDiv) return;

  // Read mealFrequency from localStorage
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "3", 10);

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  // If mealFrequency=2 => (Week 5 => p3, Week 6 => p10, Week 7 => p17, Week 8 => p24)
  // Otherwise => (Week 5 => p3, Week 6 => p17, Week 7 => p31, Week 8 => p45)
  let items;
  if (mealFrequency === 2) {
    items = [
      { label: "Week 5", page: 3 },
      { label: "Week 6", page: 10 },
      { label: "Week 7", page: 17 },
      { label: "Week 8", page: 24 },
    ];
  } else {
    items = [
      { label: "Week 5", page: 3 },
      { label: "Week 6", page: 17 },
      { label: "Week 7", page: 31 },
      { label: "Week 8", page: 45 },
    ];
  }

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function buildMealPlanHypertrophyPages() {
  const container = document.getElementById("pdf12MealPlanHypertrophyContainer");
  if (!container) return;

  container.innerHTML = "";

  // Weeks 5..8
  build28DayMealPlanRework({
    fromWeek: 5,
    toWeek: 8,
    targetContainerId: "pdf12MealPlanHypertrophyContainer"
  });
}


// ============== PDF #7: 12-Week-Meal-Plan-Strength =============

function buildPdf12MealPlanStrength() {
  fillMealPlanStrengthCover();
  fillMealPlanStrengthNav();
  buildAndRender12WeekMealPlan("pdf12MealPlanStrengthContainer", 9, 12);
  addPageNumbers("pdf12MealPlanStrength");
}

function fillMealPlanStrengthCover() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("twelveWeekMealPlanStrengthTitle");
  if (coverTitleEl) {
    if (adjustedName === "Committed Champion") {
      coverTitleEl.textContent = "Your 12-Week Meal Plan";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 12-Week Meal Plan`;
    }
  }
}

function fillMealPlanStrengthNav() {
  const navDiv = document.getElementById("pdf12MealPlanStrengthNavPage");
  if (!navDiv) return;

  // Read mealFrequency from localStorage
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "3", 10);

  navDiv.innerHTML = `
      <div class="page-header-left-logo">
        <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
      </div>
      <h2 class="page-heading with-badge-logo">Navigation</h2>
    `;

  // If mealFrequency=2 => (Week 9 => p3, Week 10 => p10, Week 11 => p17, Week 12 => p24)
  // Otherwise => (Week 9 => p3, Week 10 => p17, Week 11 => p31, Week 12 => p45)
  let items;
  if (mealFrequency === 2) {
    items = [
      { label: "Week 9", page: 3 },
      { label: "Week 10", page: 10 },
      { label: "Week 11", page: 17 },
      { label: "Week 12", page: 24 },
    ];
  } else {
    items = [
      { label: "Week 9", page: 3 },
      { label: "Week 10", page: 17 },
      { label: "Week 11", page: 31 },
      { label: "Week 12", page: 45 },
    ];
  }

  const navGrid = document.createElement("div");
  navGrid.className = "nav-grid-container";

  items.forEach((obj) => {
    const leftDiv = document.createElement("div");
    leftDiv.textContent = obj.label;
    leftDiv.style.borderBottom = "1px solid #ccc";
    leftDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(leftDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className = "nav-right-num";
    rightDiv.textContent = obj.page;
    rightDiv.style.borderBottom = "1px solid #ccc";
    rightDiv.style.padding = "0.3rem 0";
    navGrid.appendChild(rightDiv);
  });

  navDiv.appendChild(navGrid);
}

function buildMealPlanStrengthPages() {
  const container = document.getElementById("pdf12MealPlanStrengthContainer");
  if (!container) return;

  container.innerHTML = "";

  // Weeks 9..12
  build28DayMealPlanRework({
    fromWeek: 9,
    toWeek: 12,
    targetContainerId: "pdf12MealPlanStrengthContainer"
  });
}

/*******************************************************
* (L) DYNAMIC MEAL PLAN GENERATOR
*******************************************************/

/**
 * 1) BUILD & FILTER DATABASE
 *    - We handle the user’s dietaryPhase for each week,
 *      dietaryRestrictions, and allergies in a single function.
 */
function getFilteredMealsForPhase(phase, userDiet, userAllergies) {
  // Convert userAllergies to array if needed
  let allergiesArr = [];
  if (Array.isArray(userAllergies)) {
    allergiesArr = userAllergies;
  } else if (typeof userAllergies === "string" && userAllergies !== "None of the above") {
    allergiesArr = [userAllergies];
  }

  // Filter logic
  return mealDatabase.filter((meal) => {
    // Step 2a: Filter by dietaryPhase
    if (!meal.dietaryPhase.includes(phase)) {
      return false;
    }

    // Step 2b: Filter by dietary restrictions
    // If user is "No Restrictions", pass all. Otherwise meal must match userDiet exactly.
    if (userDiet && userDiet !== "No Restrictions") {
      // For instance, "Vegetarian" => the meal must have "Vegetarian" in meal.dietaryRestrictions
      if (!meal.dietaryRestrictions.includes(userDiet)) {
        return false;
      }
    }

    // Step 2c: Filter by allergies
    // If userAllergies is "None of the above", pass all. Otherwise exclude meals that contain any of those allergens
    if (allergiesArr.length) {
      // If the meal's allergens intersect with userAllergies => exclude
      for (let i = 0; i < allergiesArr.length; i++) {
        if (meal.allergens.includes(allergiesArr[i])) {
          return false;
        }
      }
    }

    return true;
  });
}

const ratioData = {
  deficitPhase: {
    2: { Lunch: 0.55, Dinner: 0.45 },
    3: { Breakfast: 0.30, Lunch: 0.40, Dinner: 0.30 },
    4: { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 }
  },
  surplusPhase: {
    2: { Lunch: 0.50, Dinner: 0.50 },
    3: { Breakfast: 0.33, Lunch: 0.33, Dinner: 0.34 },
    4: { Breakfast: 0.30, Lunch: 0.30, Dinner: 0.30, Snack: 0.10 }
  },
  deloadPhase: {
    2: { Lunch: 0.52, Dinner: 0.48 },
    3: { Breakfast: 0.30, Lunch: 0.35, Dinner: 0.35 },
    4: { Breakfast: 0.28, Lunch: 0.30, Dinner: 0.28, Snack: 0.14 }
  }
};

/**
 * 2) HELPER - CALCULATE THE USER’S WEEKLY PHASE
 *    Based on user’s goal & which week number (1-4).
 */
function getPhaseForWeek(weekNum, userGoal) {
  // Example logic:
  const g = userGoal.toLowerCase();
  // w4 => deload, else deficit/surplus
  if (g.includes("lose")) {
    return (weekNum === 4) ? "deloadPhase" : "deficitPhase";
  } else if (g.includes("gain")) {
    return (weekNum === 4) ? "deloadPhase" : "surplusPhase";
  } else {
    // improve body comp => e.g. w1-2 => deficit, w3 => surplus, w4 => deload
    if (weekNum === 1 || weekNum === 2) return "deficitPhase";
    if (weekNum === 3) return "surplusPhase";
    return "deloadPhase";
  }
}

function getSplitsObj(phase, mealFreq) {
  if (!ratioData[phase]) return ratioData.deloadPhase[mealFreq] || ratioData.deloadPhase[4];
  return ratioData[phase][mealFreq] || ratioData[phase][4];
}

/**
 * 3) DETERMINE CALORIC TARGETS FOR THE 4 WEEKS,
 *    THEN BREAK DOWN BY MEAL TYPE (Breakfast, Lunch, Dinner, Snacks).
 *    Return an object that tells us how many cals each meal should have
 *    for each day of each week.
 */
function getWeeklyMealTargets(userGoal) {
  // We'll pull the dailyDeficit, dailySurplus, dailyDeload from local storage
  // which your "fillDailyNutritionVars" sets. Or you can get them from your final calculations.
  const dailyDeficit = parseInt(localStorage.getItem("defCalsComputed") || "1800", 10);
  const dailySurplus = parseInt(localStorage.getItem("surCalsComputed") || "2500", 10);
  const dailyDeload = parseInt(localStorage.getItem("maintenanceCalories") || "2000", 10);

  // We define the meal percentage splits for each phase:
  const splits = {
    deficitPhase: { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 },
    surplusPhase: { Breakfast: 0.30, Lunch: 0.30, Dinner: 0.30, Snack: 0.10 },
    deloadPhase: { Breakfast: 0.28, Lunch: 0.30, Dinner: 0.28, Snack: 0.14 },
  };

  // We'll build a structure: 
  // weeklyMealTargets = {
  //   week1: {
  //     day1: { Breakfast: <number>, Lunch: <number>, ... },
  //     day2: { ... },
  //     ...
  //     day7: { ... }
  //   },
  //   week2: {...}
  // }
  const result = {};

  for (let w = 1; w <= 4; w++) {
    const phase = getPhaseForWeek(userGoal, w);
    const dailyCals =
      phase === "deficitPhase" ? dailyDeficit :
        phase === "surplusPhase" ? dailySurplus :
          dailyDeload;

    const mealSplit = splits[phase];
    result["week" + w] = {};

    for (let d = 1; d <= 7; d++) {
      result["week" + w]["day" + d] = {
        Breakfast: Math.round(dailyCals * mealSplit.Breakfast),
        Lunch: Math.round(dailyCals * mealSplit.Lunch),
        Dinner: Math.round(dailyCals * mealSplit.Dinner),
        Snack: Math.round(dailyCals * mealSplit.Snack),
        phaseUsed: phase
      };
    }
  }
  return result;
}

/**
 * 4) CORE MEAL-SELECTION + ADJUSTMENT (Steps 3 & 4 from your spec)
 *    - Given a set of candidate meals (already filtered) and a target calorie,
 *      pick the best meal based on closeness to the target,
 *      tie-break on highest protein, then random.
 *    - Check if within ±10%. If not, scale the meal portion.
 */
function selectAndAdjustMeal(candidates, targetCals) {
  if (!candidates.length) return null; // no meal available

  // 4A) Pick best meal by closeness
  let bestMeal = null;
  let smallestDiff = Infinity;
  const withinRange = (val, target) => Math.abs(val - target);

  // First pass: find the smallest difference
  for (const meal of candidates) {
    const diff = withinRange(meal.calories, targetCals);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestMeal = meal;
    } else if (diff === smallestDiff && meal.protein && bestMeal?.protein) {
      // tie-break on highest protein
      if (meal.protein > bestMeal.protein) {
        bestMeal = meal;
      } else if (meal.protein === bestMeal.protein) {
        // final tie-break => random
        if (Math.random() > 0.5) {
          bestMeal = meal;
        }
      }
    }
  }

  if (!bestMeal) return null;

  // 4B) Check threshold
  const tenPercent = 0.1 * targetCals;
  const diff = Math.abs(bestMeal.calories - targetCals);

  // If within ±10%, no adjustment needed
  if (diff <= tenPercent) {
    return { ...bestMeal }; // no scaling
  }

  // Otherwise we scale
  const scalingFactor = targetCals / bestMeal.calories;

  // We clamp the scalingFactor between 0.8x and 1.2x
  let finalScale = Math.max(0.8, Math.min(1.2, scalingFactor));

  // 4C) scale macros & portion size
  const adjustedMeal = JSON.parse(JSON.stringify(bestMeal)); // deep copy
  adjustedMeal.calories = Math.round(adjustedMeal.calories * finalScale);
  adjustedMeal.protein = Math.round(adjustedMeal.protein * finalScale);
  adjustedMeal.carbs = Math.round(adjustedMeal.carbs * finalScale);
  adjustedMeal.fats = Math.round(adjustedMeal.fats * finalScale);
  adjustedMeal.portionSize = Number((adjustedMeal.portionSize * finalScale).toFixed(2));

  // 4D) (Optional) round ingredient amounts 
  // For demonstration, we'll do a basic round to nearest 5g for proteins, nearest 1g for small items, etc.
  // (You can refine these rules as needed.)
  // We'll just add a note in the ingredient for now, to indicate scaling. 
  adjustedMeal.ingredients = adjustedMeal.ingredients.map((ing) => {
    // Example: if the ingredient ends in a number + "g" or "ml", we scale it
    // This is very simplistic:
    const m = ing.match(/(\d+)(g|ml)/i);
    if (m) {
      let originalVal = parseFloat(m[1]);
      let unit = m[2];
      let scaledVal = Math.round(originalVal * finalScale);
      // if protein-like item, round to nearest 5:
      if (scaledVal >= 20) {
        scaledVal = Math.round(scaledVal / 5) * 5;
      }
      return ing.replace(/\d+(g|ml)/, scaledVal + unit);
    }
    return ing; // not scaled
  });

  return adjustedMeal;
}

function build28DayMealPlanRework(options = {}) {
  let fromW = options.fromWeek || 1;
  let toW = options.toWeek || 4;
  let targetId = options.targetContainerId || "pdf4MealPlansContainer";

  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = "";
  const userGoal = localStorage.getItem("goal") || "Weight Loss";
  const userDiet = localStorage.getItem("dietaryRestrictions") || "No Restrictions";
  let userAllergies = localStorage.getItem("foodAllergies") || "None of the above";
  try {
    userAllergies = JSON.parse(userAllergies);
  } catch (e) {
  }
  const weeklyTargets = getWeeklyMealTargets(userGoal);

  function getAllPhasesForCategory(category) {
    return ["deficitPhase", "surplusPhase", "deloadPhase"];
  }

  // Quick function to approximate average needed cals for a category across all 4 weeks
  function approximateCategoryCals(category) {
    let total = 0;
    let daysCount = 0;
    for (let w = 1; w <= 4; w++) {
      for (let d = 1; d <= 7; d++) {
        total += weeklyTargets["week" + w]["day" + d][category];
        daysCount++;
      }
    }
    return Math.round(total / daysCount);
  }

  const categoryQuota = {
    Breakfast: 10,
    Lunch: 14,
    Dinner: 14,
    Snack: 10
  };

  const finalMealsPool = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: []
  };

  ["Breakfast", "Lunch", "Dinner", "Snack"].forEach(cat => {
    const avgCalsNeeded = approximateCategoryCals(cat);

    // Potentially valid meals for cat come from ANY of the 3 phases
    const phases = getAllPhasesForCategory(cat);
    let candidates = mealDatabase.filter(m => {
      if (m.category.toLowerCase() !== cat.toLowerCase()) return false;
      if (userDiet !== "No Restrictions" && !m.dietaryRestrictions.includes(userDiet)) return false;
      if (Array.isArray(userAllergies) && userAllergies.length) {
        for (let a of userAllergies) {
          if (m.allergens.includes(a)) return false;
        }
      } else if (typeof userAllergies === "string" && userAllergies !== "None of the above") {
        if (m.allergens.includes(userAllergies)) return false;
      }
      // If it passes, keep it
      return true;
    });

    // Sort them by closeness to avgCalsNeeded
    candidates.sort((a, b) => {
      const diffA = Math.abs(a.calories - avgCalsNeeded);
      const diffB = Math.abs(b.calories - avgCalsNeeded);
      if (diffA === diffB) {
        // tie-break => highest protein
        if (b.protein === a.protein) {
          // random
          return Math.random() - 0.5 > 0 ? 1 : -1;
        }
        return b.protein - a.protein;
      }
      return diffA - diffB;
    });

    // We only want up to categoryQuota[cat] distinct meals
    const topCandidates = candidates.slice(0, categoryQuota[cat]);
    finalMealsPool[cat] = topCandidates; // no scaling at this stage
  });

  // If we have fewer than 48 total, that’s okay. We use what we have.

  // (D) Now we produce the 28-day plan, day by day, using the finalMealsPool in a cycle:
  // The spec gave an example of cycling the 7 meals for each week. 
  // We'll build an array of meal references for each category, then cycle them.

  const dayByDayPlan = []; // array of { week: n, day: n, meals: {Breakfast, Lunch, Dinner, Snacks} }
  // We'll create cyc indexes:
  let cycIdx = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };

  for (let w = 1; w <= 4; w++) {
    for (let d = 1; d <= 7; d++) {
      const dayObj = { week: w, day: d, meals: {} };
      const dayTargets = weeklyTargets["week" + w]["day" + d]; // { Breakfast: X cals, Lunch: X cals, ... }

      // For each category, pick the meal from finalMealsPool in cyc fashion
      ["Breakfast", "Lunch", "Dinner", "Snack"].forEach(cat => {
        const pool = finalMealsPool[cat];
        if (!pool.length) {
          dayObj.meals[cat] = null;
          return;
        }

        const meal = pool[cycIdx[cat] % pool.length];
        cycIdx[cat]++;

        // Now re-check if this meal is valid for the day’s phase
        // (If not, we might attempt to find an alternative. If none found, we set null.)
        const dayPhase = dayTargets.phaseUsed;
        if (!meal.dietaryPhase.includes(dayPhase)) {
          // Try to find any other meal in the pool that does match
          let altFound = null;
          for (let alt of pool) {
            if (alt.dietaryPhase.includes(dayPhase)) {
              altFound = alt;
              break;
            }
          }
          if (!altFound) {
            dayObj.meals[cat] = null; // no suitable meal
          } else {
            // portion scaling to day’s cals
            dayObj.meals[cat] = selectAndAdjustMeal([altFound], dayTargets[cat]);
          }
        } else {
          // We do the portion scaling to match day’s cals
          dayObj.meals[cat] = selectAndAdjustMeal([meal], dayTargets[cat]);
        }
      });

      dayByDayPlan.push(dayObj);
    }
  }

  // (E) Finally, display these 28 days -> 2 meals per page, 2 pages per day (4 meals per day).
  render28DayMealPlanRework(dayByDayPlan, targetId);
}

function fillMealPlanCoverPage() {
  const adjustedName = getAdjustedUserName();
  const coverTitleEl = document.getElementById("fourWeekMealPlanCoverTitle");
  if (coverTitleEl) {
    // If the fallback generic string is returned, omit the possessive form.
    if (adjustedName === "8 Weeks to Your Best Self—Don't Stop Now!") {
      coverTitleEl.textContent = "Your Meal Plan";
    } else {
      coverTitleEl.textContent = `${adjustedName}'s 4-Week Meal Plan`;
    }
  }
}

function render28DayMealPlanRework(planArray, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Helper to build a single meal table
  function buildMealTable(meal, mealType) {
    // If meal is null => no meal found
    if (!meal) {
      const p = document.createElement("p");
      p.textContent = `No ${mealType} meal available.`;
      return p;
    }
    const table = document.createElement("table");
    table.className = "session-table modern-table meal-plan-table";

    // thead
    const thead = document.createElement("thead");
    const thr = document.createElement("tr");
    ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(txt => {
      const th = document.createElement("th");
      th.textContent = txt;
      thr.appendChild(th);
    });
    thead.appendChild(thr);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    const tr = document.createElement("tr");

    // col 1 - name & macros
    const td1 = document.createElement("td");
    td1.className = "col-2";
    td1.innerHTML = `
      <div class="meal-name-divider">${meal.mealName}</div>
      <div style="text-align:center; font-size:0.9rem;">
        Calories: ${meal.calories}<br/>
        Protein: ${meal.protein}g<br/>
        Carbs: ${meal.carbs}g<br/>
        Fat: ${meal.fats}g
      </div>
    `;
    tr.appendChild(td1);

    // col 2 - ingredients
    const td2 = document.createElement("td");
    td2.className = "col-4";
    td2.style.textAlign = "left";
    meal.ingredients.forEach(ing => {
      const div = document.createElement("div");
      div.textContent = "• " + ing;
      td2.appendChild(div);
    });
    tr.appendChild(td2);

    // col 3 - recipe
    const td3 = document.createElement("td");
    td3.className = "col-4";
    td3.style.textAlign = "left";
    meal.recipe.forEach(step => {
      const div = document.createElement("div");
      div.textContent = "• " + step;
      td3.appendChild(div);
    });
    tr.appendChild(td3);

    tbody.appendChild(tr);
    table.appendChild(tbody);

    return table;
  }

  // We have 28 days. For each day, we create 2 PDF pages. The user wants:
  //  Page 1: Breakfast + Lunch
  //  Page 2: Dinner + Snacks
  planArray.forEach((obj) => {
    const { week, day, meals } = obj;
    // Page heading = "Week X - Day Y"
    const headingText = `Week ${week} - Day ${day}`;

    // Build page1
    const page1 = document.createElement("div");
    page1.className = "pdf-page meal-plan-page"; 

    // Subheading
    const hSub1 = document.createElement("h3");
    hSub1.className = "page-heading with-badge-logo";
    hSub1.textContent = headingText;
    page1.appendChild(hSub1);

    // Smaller subheading "Breakfast"
    const s1 = document.createElement("h4");
    s1.textContent = "Breakfast";
    s1.className = "subheading";
    page1.appendChild(s1);

    // Breakfast table
    const breakfastTable = buildMealTable(meals.Breakfast, "Breakfast");
    page1.appendChild(breakfastTable);

    // Next subheading "Lunch"
    const s2 = document.createElement("h4");
    s2.textContent = "Lunch";
    s2.className = "subheading";
    page1.appendChild(s2);

    const lunchTable = buildMealTable(meals.Lunch, "Lunch");
    page1.appendChild(lunchTable);

    container.appendChild(page1);

    // Build page2
    const page2 = document.createElement("div");
    page2.className = "pdf-page meal-plan-page";

    // Same day heading again
    const hSub2 = document.createElement("h3");
    hSub2.className = "page-heading with-badge-logo";
    hSub2.textContent = headingText;
    page2.appendChild(hSub2);

    // "Dinner"
    const s3 = document.createElement("h4");
    s3.textContent = "Dinner";
    s3.className = "subheading";
    page2.appendChild(s3);

    const dinnerTable = buildMealTable(meals.Dinner, "Dinner");
    page2.appendChild(dinnerTable);

    // "Snacks"
    const s4 = document.createElement("h4");
    s4.textContent = "Snack";
    s4.className = "subheading";
    page2.appendChild(s4);

    const snackTable = buildMealTable(meals.Snack, "Snack");
    page2.appendChild(snackTable);

    container.appendChild(page2);
  });
}

// (E) MASTER DOWNLOAD LOGIC
function generateAll12WeekPDFs() {
  // 1) Build & download Foundation
  buildPdf12WeekFoundationWorkout();
  setTimeout(() => {
    downloadPDF("pdf12WeekWorkoutFoundation", "12-Week-Workout-Program-Foundation.pdf", () => {

      // 2) Hypertrophy
      buildPdf12WeekHypertrophyWorkout();
      setTimeout(() => {
        downloadPDF("pdf12WeekWorkoutHypertrophy", "12-Week-Workout-Program-Hypertrophy.pdf", () => {

          // 3) Strength
          buildPdf12WeekStrengthWorkout();
          setTimeout(() => {
            downloadPDF("pdf12WeekWorkoutStrength", "12-Week-Workout-Program-Strength.pdf", () => {

              // 4) Nutrition Guide
              buildPdf12WeekNutritionGuide();
              setTimeout(() => {
                downloadPDF("pdf12WeekNutritionGuide", "12-Week-Nutrition-Guide.pdf", () => {

                  // 5) Meal Plan - Foundation
                  buildPdf12MealPlanFoundation();
                  setTimeout(() => {
                    downloadPDF("pdf12MealPlanFoundation", "12-Week-Meal-Plan-Foundation.pdf", () => {

                      // 6) Meal Plan - Hypertrophy
                      buildPdf12MealPlanHypertrophy();
                      setTimeout(() => {
                        downloadPDF("pdf12MealPlanHypertrophy", "12-Week-Meal-Plan-Hypertrophy.pdf", () => {

                          // 7) Meal Plan - Strength
                          buildPdf12MealPlanStrength();
                          setTimeout(() => {
                            downloadPDF("pdf12MealPlanStrength", "12-Week-Meal-Plan-Strength.pdf", () => {
                              console.log("All 12-week PDFs downloaded!");
                            });
                          }, 400);

                        });
                      }, 400);

                    });
                  }, 400);

                });
              }, 400);

            });
          }, 400);

        });
      }, 400);

    });
  }, 400);
}

// (F) INIT
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("download12WeekBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      // Possibly store or check localStorage to confirm user has purchased the 12-week
      localStorage.setItem("purchasedWeeks", "12");
      generateAll12WeekPDFs();
    });
  }
});
