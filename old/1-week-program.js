/**************************************************
 * (A) Increase text size & unify page dimensions
 **************************************************/
function setGlobalFontSize() {
  document.documentElement.style.fontSize = "1.2rem";
}

function setUniformPageHeights() {
  const allPages = document.querySelectorAll(".pdf-page");
  if (!allPages) return;

  allPages.forEach(pg => {
    pg.style.width = "793px";
    pg.style.height = "1122px";
    pg.style.margin = "0 auto";
    pg.style.overflow = "hidden";
  });
}

/**************************************************
 * (B) Basic Utility Functions
 **************************************************/
function capitalizeGoal(goal) {
  if (!goal) return "";
  return goal
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function downloadPDF(containerId, fileName) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`No container found with ID: ${containerId}`);
    return;
  }

  // Show container for rendering
  container.style.display = "block";

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
  };

  html2pdf()
    .set(opt)
    .from(container)
    .save()
    .then(() => {
      // Re-hide after generation
      // container.style.display = "none";
    });
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

/**************************************************
 * (C) Creating Headers/Footers & Page Numbers
 **************************************************/

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

function createWorkoutFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-workout";
  footerDiv.innerHTML = `
    <div class="footer-center">
      <a href="workout-tracker.html" class="footer-log-link">Log Your Workout</a>
    </div>
    <div class="footer-right">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function createMealPlanFooter(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-meal-plan";
  footerDiv.innerHTML = `
    <div class="footer-center">
      <a href="#" class="footer-log-link">Log Your Nutrition</a>
    </div>
    <div class="footer-right">
      <span class="page-number">${pageNum} / ${totalPages}</span>
    </div>
  `;
  return footerDiv;
}

function createMealPlanFooterNoNutrition(pageNum, totalPages) {
  const footerDiv = document.createElement("div");
  footerDiv.className = "footer footer-meal-plan locked-meal-plan-footer";
  footerDiv.innerHTML = `
    <div class="footer-right" style="margin-left: auto; text-align: right;">
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

  // Example check if this PDF is for meal plans, if you have that logic:
  const idLower = containerId.toLowerCase();
  const isMealPlanPDF = (
    idLower === "pdf4weeknutritionpart2" ||
    idLower === "pdf1weekcontainer"
  );

  pages.forEach((pg, idx) => {
    // 1) Skip pages that should have NO footer at all.
    if (
      pg.querySelector("#oneWeekCoverTitle") || 
      (pg.querySelector(".page-heading") &&
       pg.querySelector(".page-heading").textContent.includes("Navigation")) ||
      pg.querySelector(".upgrade-now-btn")
    ) {
      return; // no footer on these pages
    }

    // 2) Remove any old footer
    const oldFooter = pg.querySelector(".footer");
    if (oldFooter) oldFooter.remove();

    // 3) Decide which footer function to call
    let newFooter;

    // a) If it’s our special locked meal plan page, use the no-nutrition footer
    if (pg.id === "lockedMealPlanPage") {
      newFooter = createMealPlanFooterNoNutrition(idx + 1, total);

    // b) If it’s a normal meal plan page, use the regular meal plan footer
    } else if (pg.classList.contains("meal-plan-page")) {
      newFooter = createMealPlanFooter(idx + 1, total);

    // c) If it’s a workout page, use the workout footer
    } else if (pg.classList.contains("lyw-page")) {
      newFooter = createWorkoutFooter(idx + 1, total);

    // d) Otherwise, check if we should use intro vs main footers
    } else {
      // Example: detect headings for “Introduction,” “Nutrition Guide,” etc.
      const headingElem = pg.querySelector(".page-heading");
      if (headingElem) {
        const text = headingElem.textContent.toLowerCase();
        if (
          text.includes("introduction") ||
          text.includes("nutrition guide") ||
          text.includes("workout program")
        ) {
          newFooter = createIntroFooter(idx + 1, total);
        } else {
          newFooter = createMainFooter(idx + 1, total);
        }
      } else {
        // fallback if no heading found
        newFooter = createMainFooter(idx + 1, total);
      }
    }

    // 4) Append the new footer
    pg.appendChild(newFooter);
  });
}

/**************************************************
* (D) Fill the "Daily Nutritional Needs"
 **************************************************/
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

function fillDailyNutritionRows() {
  const userGoalRaw = (localStorage.getItem("goal") || "").toLowerCase();
  const effortLevel = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const baseCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);

  let defCals = baseCals;
  let surCals = baseCals;
  let deloadCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);

  // If "Improve Body Composition," apply multipliers
  if (userGoalRaw.includes("improve body composition")) {
    if (effortLevel === "slight") {
      defCals = Math.round(baseCals * 0.9);
      surCals = Math.round(baseCals * 1.1);
    } else if (effortLevel === "moderate") {
      defCals = Math.round(baseCals * 0.8);
      surCals = Math.round(baseCals * 1.2);
    } else if (effortLevel === "high") {
      defCals = Math.round(baseCals * 0.7);
      surCals = Math.round(baseCals * 1.3);
    }
  }

  // Update the DOM
  const dailyDeficitEl = document.getElementById("dailyDeficit");
  const dailySurplusEl = document.getElementById("dailySurplus");
  const dailyDeloadEl = document.getElementById("dailyDeload");

  if (dailyDeficitEl) dailyDeficitEl.textContent = defCals + " kcals";
  if (dailySurplusEl) dailySurplusEl.textContent = surCals + " kcals";
  if (dailyDeloadEl) dailyDeloadEl.textContent = deloadCals + " kcals";

  // Store them for the Weekly Calorie page
  localStorage.setItem("defCalsComputed", defCals.toString());
  localStorage.setItem("surCalsComputed", surCals.toString());

  // Hide if necessary
  if (userGoalRaw.includes("weight")) {
    if (dailySurplusEl) {
      dailySurplusEl.style.display = "none";
      const lbl = dailySurplusEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  } else if (userGoalRaw.includes("muscle")) {
    if (dailyDeficitEl) {
      dailyDeficitEl.style.display = "none";
      const lbl = dailyDeficitEl.previousElementSibling;
      if (lbl) lbl.style.display = "none";
    }
  }
}

function finalizeWorkoutNavPage() {
  const navDiv = document.getElementById("pdfWorkoutNavPage");
  if (!navDiv) return;

  // Read from localStorage
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "4", 10);
  const workoutDays = parseInt(localStorage.getItem("workoutDays") || "3", 10);

  let additionalAdvicePage, workoutGuidePage, oneWeekProgramPage, modifyWorkoutPage;

  if (mealFrequency === 2) {
    additionalAdvicePage = 12;
    workoutGuidePage = 13;
    oneWeekProgramPage = 14;
    modifyWorkoutPage = (2 * workoutDays) + 14; // e.g. 3 workouts => 3*2 + 14 = 20
  } else if (mealFrequency === 3 || mealFrequency === 4) {
    additionalAdvicePage = 15;
    workoutGuidePage = 16;
    oneWeekProgramPage = 17;
    modifyWorkoutPage = (2 * workoutDays) + 17; // e.g. 3 workouts => 3*2 + 17 = 23
  } else {
    // Fallback if mealFrequency is unexpected
    additionalAdvicePage = 12;
    workoutGuidePage = 13;
    oneWeekProgramPage = 14;
    modifyWorkoutPage = (2 * workoutDays) + 14;
  }

  // Now build the navigation items with the updated page numbers
  const items = [
    { label: "Introduction", page: 3 },
    { label: "Your Profile", page: 4 },
    { label: "Your Nutrition Guide", page: 5 },
    { label: "Weekly Calorie & Macro Overview", page: 6 },
    { label: "Essential Food Guide", page: 7 },
    { label: "Your Meal Plan", page: 8 },
    { label: "Additional Advice", page: additionalAdvicePage },
    { label: "Your Workout Guide", page: workoutGuidePage },
    { label: "1-Week Program", page: oneWeekProgramPage },
    { label: "Modify Your Workout", page: modifyWorkoutPage },
  ];

  // Render the updated Navigation table as before
  navDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">Navigation</h2>
  `;
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

function fillOneWeekClientProfilePage() {
  // Grab the page container for the 1-Week Profile
  const pageDiv = document.getElementById("oneWeekProfilePage");
  if (!pageDiv) return;

  // Basic user info
  const userName = localStorage.getItem("name") || "User";
  const dobVal = localStorage.getItem("dob") || "1990-01-01";
  const rawGoal = localStorage.getItem("goal") || "lose weight";
  const capGoal = capitalizeGoal(rawGoal);
  const heightVal = localStorage.getItem("height") || "170";
  const weightVal = localStorage.getItem("weight") || "70";

  // TDEE from localStorage
  const tdee = parseInt(localStorage.getItem("maintenanceCalories"), 10) || 2000;
  // Nicely formatted TDEE
  const formattedTDEE = tdee.toLocaleString();

  // Water intake from localStorage (or default)
  // If you have a function fillDailyNutritionVars(), you can re-use that.
  const waterVal = localStorage.getItem("programWaterIntake") || "2.5";

  // Calculate BMR
  const weightNum = parseFloat(weightVal);
  const heightNum = parseFloat(heightVal);
  const age = parseInt(localStorage.getItem("age"), 10) || 30;
  const gender = (localStorage.getItem("gender") || "male").toLowerCase();

  let BMR;
  if (gender === "male") {
    BMR = (10 * weightNum) + (6.25 * heightNum) - (5 * age) + 5;
  } else {
    BMR = (10 * weightNum) + (6.25 * heightNum) - (5 * age) - 161;
  }

  // Steps Per Day (example formula: (TDEE - BMR)/0.05)
  const stepsPerDay = Math.round((tdee - BMR) / 0.05);
  const formattedSteps = stepsPerDay.toLocaleString();

  // Determine Sleeping Hours from activityLevel + effortLevel
  const activityLevel = (localStorage.getItem("activityLevel") || "sedentary").toLowerCase();
  const effortLevel = (localStorage.getItem("effortLevel") || "moderate effort").toLowerCase();

  let activitySleep;
  switch (activityLevel) {
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
  switch (effortLevel) {
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

  // Ultimate Goal from localStorage
  const ultimateGoal = localStorage.getItem("ultimateGoal") || "";

  // Overwrite the entire pageDiv with new content
  pageDiv.innerHTML = `
    <div class="page-header-left-logo">
      <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
    </div>
    <h2 class="page-heading with-badge-logo">${userName}'s Profile</h2>

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
        <div class="profile-grid-item">${waterVal} L</div>

        <div class="profile-grid-item label">Steps Per Day:</div>
        <div class="profile-grid-item">${formattedSteps} steps</div>

        <div class="profile-grid-item label">Sleeping Hours:</div>
        <div class="profile-grid-item">${sleepingHours} hours</div>
      </div>

      <!-- Ultimate Goal section -->
      <h3 class="subheading centered">Ultimate Goal</h3>
      <div style="
        background-color: #F9F6F2; 
        border-color: #E0DAD3; 
        color: #666; 
        text-align: center; 
        padding: 1rem; 
        border-radius: 6px;">
        ${ultimateGoal}
      </div>
    </div>
  `;
}

/**************************************************
 * (E) Weekly Calorie Table & Blurring
 **************************************************/

// For the 1‑Week Program, just return the maintenance calories unadjusted.
function getAdjustedMaintenance(week, maintenanceCals, userGoal) {
  return maintenanceCals;
}

function buildWeeklyCalorieTableDynamically() {
  const pageDiv = document.getElementById("weeklyCaloriePage");
  if (!pageDiv) return;

  pageDiv.innerHTML = "";

  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
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

  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";
  const table = document.createElement("table");
  table.className = "session-table modern-table";
  table.id = "wcmoTable";

  // Table Header
  const thead = document.createElement("thead");
  const headTr = document.createElement("tr");
  const headings = [
    "Week",
    "Daily Calories",
    "Protein<br>(g)",
    "Carbs<br>(g)",
    "Fats<br>(g)"
  ];
  headings.forEach(h => {
    const th = document.createElement("th");
    th.innerHTML = h;
    headTr.appendChild(th);
  });
  thead.appendChild(headTr);
  table.appendChild(thead);

  // User inputs from localStorage
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
  const userEffort = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);
  const fallbackCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);
  const userGender = (localStorage.getItem("gender") || "male").toLowerCase();
  let minCals = (userGender === "male") ? 1500 : 1200;

  // --- For the 1‑Week program, we want Week 1 to use our partial‐fraction logic.
  // Define maps for full multipliers:
  const WEIGHT_LOSS_MAP = {
    low: -0.10,
    medium: -0.15,
    high: -0.20
  };

  const MUSCLE_GAIN_MAP = {
    low: 0.12,
    medium: 0.14,
    high: 0.17
  };

  const IMPROVE_MAP = {
    low:    { deficit: -0.09, surplus: 0.11 },
    medium: { deficit: -0.10, surplus: 0.13 },
    high:   { deficit: -0.11, surplus: 0.15 }
  };

  // Helper function for Week 1 calculations:
  function getCalsForWeek1() {
    // Get base maintenance using your adjusted formula:
    const baseMaint = getAdjustedMaintenance(1, maintenanceCals, userGoal);
    if (userGoal.includes("lose")) {
      // 50% of full deficit multiplier for weight loss
      const basePct = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
      const fraction = 0.50;
      let cals = baseMaint * (1 + basePct * fraction);
      return Math.max(Math.round(cals), minCals);
    }
    if (userGoal.includes("gain")) {
      // 50% of full surplus multiplier for muscle gain
      const basePct = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
      const fraction = 0.50;
      let cals = baseMaint * (1 + basePct * fraction);
      return Math.max(Math.round(cals), minCals);
    }
    if (userGoal.includes("improve")) {
      // For Improve, week 1 uses a deficit at 75%
      const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
      const fraction = 0.75;
      let cals = baseMaint * (1 + obj.deficit * fraction);
      return Math.max(Math.round(cals), minCals);
    }
    // Fallback: maintenance
    return baseMaint;
  }

  const tbody = document.createElement("tbody");

  // For the 1‑Week Program, we only show week 1 with the correct calculations.
  // Weeks 2–12 will be filled with placeholder values (and locked).
  for (let w = 1; w <= 12; w++) {
    let dailyCals;
    if (w === 1) {
      dailyCals = getCalsForWeek1();
    } else {
      // For weeks 2–12, use a default placeholder (e.g. 1800 kcals)
      dailyCals = 1800;
    }

    // Macro breakdown (using a simple 30/40/30 split)
    const p = Math.round((0.3 * dailyCals) / 4);
    const c = Math.round((0.4 * dailyCals) / 4);
    const f = Math.round((0.3 * dailyCals) / 9);

    // Build the row for week w
    const row = document.createElement("tr");
    const tdWeek = document.createElement("td");
    tdWeek.textContent = w;
    row.appendChild(tdWeek);

    const tdCals = document.createElement("td");
    tdCals.textContent = dailyCals + " kcals";
    row.appendChild(tdCals);

    const tdP = document.createElement("td");
    tdP.textContent = p + " g";
    row.appendChild(tdP);

    const tdCarbs = document.createElement("td");
    tdCarbs.textContent = c + " g";
    row.appendChild(tdCarbs);

    const tdF = document.createElement("td");
    tdF.textContent = f + " g";
    row.appendChild(tdF);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  // Lock weeks 2–12 as before (using your existing lock function)
  let purchasedProgram = parseInt(localStorage.getItem("purchasedWeeks") || "1", 10);
  if (purchasedProgram < 12) {
    lockRowsByReplacingTextWithBanner(table, purchasedProgram);
  }

  const foot = createMainFooter(0, 0);
  pageDiv.appendChild(foot);
}

function lockRowsByReplacingTextWithBanner(table, purchasedWeeks) {
  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 12) return;

  // The banner row index logic:
  let bannerRowIndex = 0;
  if (purchasedWeeks === 1) {
    // e.g. show banner at row #6 => week6
    bannerRowIndex = 6;
  } else if (purchasedWeeks === 4) {
    // if the user purchased 4 weeks, maybe show banner at row #7 => week7
    bannerRowIndex = 7;
  } else return;

  rows.forEach((tr, idx) => {
    const wNum = idx + 1; // row #1 => week1, row #2 => week2, etc.
    if (wNum <= purchasedWeeks) {
      // unlocked
      return;
    }

    if (wNum === bannerRowIndex) {
      // banner row
      tr.classList.add("locked-banner-row");
      const tds = [...tr.children];
      if (tds.length >= 5) {
        tds[0].setAttribute("colspan", "5");
        tds[0].innerHTML = `
          <i class="fa fa-lock"></i>
          Unlock your full calorie & macro breakdown for the next 4 weeks!
        `;
        // remove the other columns
        for (let i = tds.length - 1; i >= 1; i--) {
          tr.removeChild(tds[i]);
        }
      }
    } else {
      // normal locked row => replace col2..col5 with “Locked”
      const tds = tr.querySelectorAll("td");
      for (let i = 1; i < tds.length; i++) {
        tds[i].innerHTML = `<i class="fa fa-lock"></i> Locked`;
        tds[i].style.fontWeight = "bold";
        tds[i].style.color = "#666";
        tds[i].style.textAlign = "center";
      }
    }
  });
}

/**************************************************
* (F) Food Table Page
 **************************************************/
function createFoodGuidePage() {
  const pageDiv = document.getElementById("foodGuidePage");
  if (!pageDiv) return;
  pageDiv.innerHTML = "";

  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badgeLogo);

  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Essential Food Guide";
  pageDiv.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.style.textAlign = "center";
  subtext.style.margin = "0 0 1rem 0";
  subtext.style.fontSize = "1rem";
  subtext.textContent = "Discover the best food choices to fuel your progress and optimize results.";
  pageDiv.appendChild(subtext);

  const tableWrap = document.createElement("div");
  tableWrap.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table efg-table";

  // Thead
  const thead = document.createElement("thead");
  const headTr = document.createElement("tr");
  const thFood = document.createElement("th");
  thFood.innerHTML = `Food<br>(100g)`;
  headTr.appendChild(thFood);

  const thProtein = document.createElement("th");
  thProtein.innerHTML = `Protein<br>(g)`;
  headTr.appendChild(thProtein);

  const thCarbs = document.createElement("th");
  thCarbs.innerHTML = `Carbs<br>(g)`;
  headTr.appendChild(thCarbs);

  const thFats = document.createElement("th");
  thFats.innerHTML = `Fats<br>(g)`;
  headTr.appendChild(thFats);

  thead.appendChild(headTr);
  table.appendChild(thead);

  // Tbody
  const foods = [
    { name: "Chicken Breast", protein: 31, carbs: 0, fat: 3 },
    { name: "Eggs (whole)", protein: 13, carbs: 1, fat: 11 },
    { name: "Greek Yogurt (low-fat)", protein: 10, carbs: 3, fat: 0.4 },
    { name: "Canned Tuna", protein: 24, carbs: 0, fat: 1 },
    { name: "Brown Rice", protein: 2.5, carbs: 23, fat: 0.9 },
    { name: "Sweet Potato", protein: 2, carbs: 20, fat: 0.1 },
    { name: "Oats (dry)", protein: 13, carbs: 66, fat: 6 },
    { name: "Banana", protein: 1.3, carbs: 23, fat: 0.3 },
    { name: "Avocado", protein: 2, carbs: 9, fat: 15 },
    { name: "Almonds (raw)", protein: 21, carbs: 22, fat: 50 },
    { name: "Olive Oil", protein: 0, carbs: 0, fat: 100 },
    { name: "Peanut Butter", protein: 25, carbs: 20, fat: 50 },
  ];

  const tbody = document.createElement("tbody");
  foods.forEach((f, idx) => {
    const tr = document.createElement("tr");
    const maxMacro = Math.max(f.protein, f.carbs, f.fat);

    // col1 => name
    const tdName = document.createElement("td");
    tdName.textContent = f.name;
    tdName.style.textAlign = "left";
    tr.appendChild(tdName);

    // col2 => protein
    const tdP = document.createElement("td");
    tdP.textContent = String(f.protein);
    if (f.protein === maxMacro && maxMacro > 0) {
      tdP.classList.add("macro-highlight-green");
    } else {
      tdP.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdP);

    // col3 => carbs
    const tdC = document.createElement("td");
    tdC.textContent = String(f.carbs);
    if (f.carbs === maxMacro && maxMacro > 0) {
      tdC.classList.add("macro-highlight-green");
    } else {
      tdC.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdC);

    // col4 => fat
    const tdF = document.createElement("td");
    tdF.textContent = String(f.fat);
    if (f.fat === maxMacro && maxMacro > 0) {
      tdF.classList.add("macro-highlight-green");
    } else {
      tdF.classList.add("macro-highlight-red");
    }
    tr.appendChild(tdF);

    // overrides => yellow
    if ((f.name === "Oats (dry)" && f.protein === 13) ||
      (f.name === "Almonds (raw)" && f.protein === 21) ||
      (f.name === "Peanut Butter" && f.protein === 25)) {
      tdP.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdP.classList.add("macro-highlight-yellow");
    }
    if ((f.name === "Almonds (raw)" && f.carbs === 22) ||
      (f.name === "Peanut Butter" && f.carbs === 20)) {
      tdC.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdC.classList.add("macro-highlight-yellow");
    }
    if (f.name === "Eggs (whole)" && f.fat === 11) {
      tdF.classList.remove("macro-highlight-red", "macro-highlight-green");
      tdF.classList.add("macro-highlight-yellow");
    }

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  pageDiv.appendChild(tableWrap);

  // Now lock for 1-Week
  const purchasedProgram = parseInt(localStorage.getItem("purchasedWeeks") || "1", 10);
  if (purchasedProgram === 1) {
    lockEFGRowsSingleBanner(table);
  }

  const foot = createMainFooter(0, 0);
  pageDiv.appendChild(foot);
}

function lockEFGRowsSingleBanner(table) {
  const rows = table.querySelectorAll("tbody tr");
  if (rows.length < 12) return;

  rows.forEach((tr, idx) => {
    // row index 0 => locked
    // row index 5 => banner
    // everything else => locked
    if (idx === 5) {
      tr.classList.add("locked-banner-row");
      const tds = [...tr.children];
      if (tds.length >= 4) {
        tds[0].setAttribute("colspan", "4");
        tds[0].innerHTML = `
          <i class="fa fa-lock"></i>
          Unlock your Essential Food Guide—all you need in one place!
        `;
        // remove the other cells
        for (let i = tds.length - 1; i >= 1; i--) {
          tr.removeChild(tds[i]);
        }
      }
    }
    else {
      lockWholeRow(tr);
    }
  });
}

/* Helper function to lock an entire EFG row but preserve row striping. */
function lockWholeRow(tr) {
  const tds = tr.querySelectorAll("td");
  tds.forEach(td => {
    // remove highlight classes if present:
    td.classList.remove("macro-highlight-green", "macro-highlight-red", "macro-highlight-yellow");
    td.innerHTML = `<i class="fa fa-lock"></i> Locked`;
    td.classList.add("locked-meal-cell");
  });
}

/**************************************************
 * Nutrition Intro Page
 **************************************************/
function createNutritionIntroPage(container) {
  const pageDiv = document.getElementById("nutritionIntroPage");
  if (!pageDiv) return;

  pageDiv.innerHTML = "";

  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />
  `;
  pageDiv.appendChild(badgeLogo);

  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Your Nutrition Guide";
  pageDiv.appendChild(heading);

  // optional placeholder image
  const placeholderImg = document.createElement("img");
  placeholderImg.src = "#";
  placeholderImg.alt = "Nutrition Overview Placeholder";
  placeholderImg.style.display = "block";
  placeholderImg.style.margin = "1rem auto";
  placeholderImg.style.objectFit = "cover";
  placeholderImg.style.width = "80%";
  placeholderImg.style.height = "20vh";
  pageDiv.appendChild(placeholderImg);

  const p = document.createElement("p");
  p.style.fontSize = "1.1rem";
  p.style.lineHeight = "1.4";
  p.style.marginBottom = "2rem";
  p.innerHTML = `
Proper nutrition is a key component of any fitness journey, and this section is designed to support your goals. By pairing structured workouts with balanced nutrition, you’ll maximize your results and build sustainable habits.<br/><br/>
Your meal plan is tailored to complement your specific goal. If your focus is weight loss, you’ll find meal ideas that prioritize nutrient-dense, lower-calorie foods to help you maintain a calorie deficit while preserving muscle. If your goal is muscle gain, your meals are designed to fuel strength and recovery with higher-calorie, protein-rich options. And if you're working on improving body composition, you’ll receive a mix of both, helping you strategically balance deficits and surpluses throughout your program.<br/><br/>
Each meal includes a breakdown of macronutrients, a full ingredient list, and step-by-step preparation instructions, ensuring that your nutrition is as simple and effective as your workouts.<br/><br/>
By incorporating these meals into your routine, you’ll be fueling your progress in the best way possible. Enjoy your meal plan, and let’s keep pushing toward your fitness goals!
`;
  pageDiv.appendChild(p);

  const foot = createIntroFooter(0, 0);
  pageDiv.appendChild(foot);
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

function createMealPlanLockedPageFullSize() {
  // Create the outer page container
  const pageDiv = document.createElement("div");
  pageDiv.className = "pdf-page meal-plan-page locked-meal-plan-page";
  // Unique ID so you can detect this page in addPageNumbers() and remove "Log Your Nutrition"
  pageDiv.id = "lockedMealPlanPage";

  // Make the page a flex container
  // so we can place the heading at the top and center the rest vertically.
  pageDiv.style.display = "flex";
  pageDiv.style.flexDirection = "column";
  // Ensure the container spans the full A4 height if you rely on that in CSS:
  pageDiv.style.height = "100%";

  // 1) Top container for heading at the top
  const topContainer = document.createElement("div");
  topContainer.style.display = "flex";
  topContainer.style.flexDirection = "column";
  topContainer.style.alignItems = "center"; // horizontally center heading
  // No justifyContent here, so it stays at the top
  pageDiv.appendChild(topContainer);

  // Add the logo
  const badgeDiv = document.createElement("div");
  badgeDiv.className = "page-header-left-logo";
  badgeDiv.innerHTML = `
    <img src="src/images/rtb-logo-white.png" alt="Badge Logo" class="logo-badge" />
  `;
  topContainer.appendChild(badgeDiv);

  // Add the heading
  const heading = document.createElement("h3");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Extend Your Meal Plan";
  topContainer.appendChild(heading);

  // 2) Main content wrapper (to center the table, line, text vertically)
  //    We let this wrapper flex:1, so it occupies the remaining space.
  const contentWrapper = document.createElement("div");
  contentWrapper.style.display = "flex";
  contentWrapper.style.flexDirection = "column";
  contentWrapper.style.justifyContent = "center"; // vertically center
  contentWrapper.style.alignItems = "center";     // horizontally center
  contentWrapper.style.flex = "1";
  pageDiv.appendChild(contentWrapper);

  // Hardcode a meal from the database
  const hardcodedMeal = {
    mealName: "Quinoa & Black Bean Bowl",
    calories: 550,
    macroRatio: { protein: 0.27, carbs: 0.55, fats: 0.18 },
    category: "Lunch",
    dietaryPhase: ["deficitPhase", "deloadPhase", "surplusPhase"],
    portionSize: 1.0,
    dietaryRestrictions: ["Vegan", "Vegetarian"],
    allergens: [],
    ingredients: [
      { name: "quinoa", quantity: 90, unit: "g" },
      { name: "black beans", quantity: 85, unit: "g" },
      { name: "diced bell peppers", quantity: 75, unit: "g" },
      { name: "olive oil", quantity: 15, unit: "ml" },
      { name: "salt and pepper", quantity: 1, unit: "g" }
    ],
    recipe: [
      "Cook quinoa per instructions.",
      "Sauté bell peppers in olive oil.",
      "Mix with black beans and season."
    ],
    mealNotes: []
  };

  // Build the locked meal table
  const lockedTable = buildLockedMealTableFullSize(hardcodedMeal);
  contentWrapper.appendChild(lockedTable);

  // Thin grey line underneath the table
  const hrLine = document.createElement("hr");
  hrLine.style.width = "100%";
  hrLine.style.border = "none";
  hrLine.style.borderBottom = "1px solid #ccc";
  hrLine.style.marginTop = "1.25rem";
  hrLine.style.marginBottom = "0.4rem";
  contentWrapper.appendChild(hrLine);

  // "Learn More About Your Meal Plan" heading
  const learnMoreHeader = document.createElement("h3");
  learnMoreHeader.className = "learn-more-header";
  learnMoreHeader.textContent = "Learn More About Your Meal Plan";
  contentWrapper.appendChild(learnMoreHeader);

  // Subtext
  const subtext = document.createElement("p");
  subtext.className = "locked-meal-subtext"; // or any class name you like
  subtext.textContent = `
    Your meal plan is designed to provide structure, variety, 
    and optimal nutrition to support your fitness journey. Each 
    meal is tailored to your goals, ensuring balanced macros 
    and delicious, easy-to-make options.
  `;
  contentWrapper.appendChild(subtext);

  return pageDiv;
}

function buildLockedMealTableFullSize(mealObj) {
  // Create the table (same classes as your normal meal tables)
  const table = document.createElement("table");
  table.className = "session-table modern-table meal-plan-table locked-fullsize-table";

  // The same column widths as your normal meal‐plan tables
  const colgroup = document.createElement("colgroup");
  const col1 = document.createElement("col");
  col1.style.width = "30%";
  const col2 = document.createElement("col");
  col2.style.width = "35%";
  const col3 = document.createElement("col");
  col3.style.width = "35%";
  colgroup.appendChild(col1);
  colgroup.appendChild(col2);
  colgroup.appendChild(col3);
  table.appendChild(colgroup);

  // Thead (3 columns)
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(txt => {
    const th = document.createElement("th");
    th.textContent = txt;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody (2 rows):
  // Row #1 => normally Meal details / ingredients / recipe
  const tbody = document.createElement("tbody");

  // Row 1
  const row1 = document.createElement("tr");
  // col1
  const td1 = document.createElement("td");
  td1.innerHTML = `
    <strong>${mealObj.mealName}</strong>
    <div>Calories: ${mealObj.calories}</div>
    <div>Protein: ${mealObj.protein}g</div>
    <div>Carbs: ${mealObj.carbs}g</div>
    <div>Fats: ${mealObj.fats}g</div>
  `;
  row1.appendChild(td1);

  // col2
  const td2 = document.createElement("td");
  td2.textContent = "Ingredients here";
  row1.appendChild(td2);

  // col3
  const td3 = document.createElement("td");
  td3.textContent = "Recipe steps here";
  row1.appendChild(td3);
  tbody.appendChild(row1);

  // Row 2 => mealNotes
  const row2 = document.createElement("tr");
  // We'll use just 1 cell that spans all 3 columns, or 3 separate—your choice.
  const tdNotes = document.createElement("td");
  tdNotes.colSpan = 3;
  tdNotes.textContent = mealObj.mealNotes.join(" ");
  row2.appendChild(tdNotes);
  tbody.appendChild(row2);

  table.appendChild(tbody);

  // 4) Now we lock them
  // a) Row #1 => .locked-banner-row
  row1.classList.add("locked-banner-row");
  // remove the existing cells, replace with a single cell that spans all 3 columns
  const r1Tds = [...row1.querySelectorAll("td")];
  r1Tds[0].colSpan = 3;
  r1Tds[0].innerHTML = `<i class="fa fa-lock"></i> Unlock your full meal plan and stay on track with structured nutrition for the next 4 weeks!`;

  // remove extra cells
  for (let i = 1; i < r1Tds.length; i++) {
    row1.removeChild(r1Tds[i]);
  }

  // b) Row #2 => locked cell
  const r2Tds = [...row2.querySelectorAll("td")];
  // If you only want one big cell for "Locked", you already have colSpan=3
  // so just replace the content:
  r2Tds[0].innerHTML = `<i class="fa fa-lock"></i> Locked`;

  // Done
  return table;
}

function buildLockedMealTable(mealObj) {
  // Create the table structure
  const table = document.createElement("table");
  table.className = "session-table modern-table meal-plan-table";

  // Colgroup (3 columns, same widths as your normal meal table)
  const colgroup = document.createElement("colgroup");
  const col1 = document.createElement("col");
  col1.style.width = "30%";
  const col2 = document.createElement("col");
  col2.style.width = "35%";
  const col3 = document.createElement("col");
  col3.style.width = "35%";
  colgroup.appendChild(col1);
  colgroup.appendChild(col2);
  colgroup.appendChild(col3);
  table.appendChild(colgroup);

  // Thead
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach(txt => {
    const th = document.createElement("th");
    th.textContent = txt;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");

  // Row 1 => the main meal row (mealName/macros in col1, ingredients col2, recipe col3)
  const mealRow = document.createElement("tr");

  // Column 1: Meal name + macros
  const tdDetails = document.createElement("td");
  tdDetails.innerHTML = `
    <div class="meal-name-divider">${mealObj.mealName}</div>
    <div style="text-align:center; font-size:0.9rem;">
      Calories: ${mealObj.calories || "?"}<br/>
      Protein: ${mealObj.protein || "?"}g<br/>
      Carbs: ${mealObj.carbs || "?"}g<br/>
      Fat: ${mealObj.fats || "?"}g
    </div>
  `;
  mealRow.appendChild(tdDetails);

  // Column 2: (Placeholder – normally you'd list ingredients)
  const tdIngr = document.createElement("td");
  tdIngr.textContent = "Ingredients go here...";
  mealRow.appendChild(tdIngr);

  // Column 3: (Placeholder – normally you'd list recipe steps)
  const tdRecipe = document.createElement("td");
  tdRecipe.textContent = "Recipe steps go here...";
  mealRow.appendChild(tdRecipe);

  tbody.appendChild(mealRow);

  // Row 2 => mealNotes row
  const mealNotesRow = document.createElement("tr");
  // We'll give it a single cell spanning all 3 columns (if you prefer).
  // Or you can keep 3 separate cells. For simplicity, let's do a single cell:
  const tdNotes = document.createElement("td");
  tdNotes.colSpan = 3;
  tdNotes.textContent = (mealObj.mealNotes && mealObj.mealNotes.length > 0)
    ? mealObj.mealNotes.join(" ") // or however you want to display them
    : "No meal notes.";
  mealNotesRow.appendChild(tdNotes);

  tbody.appendChild(mealNotesRow);
  table.appendChild(tbody);

  // Now LOCK them:
  lockMealTableRows(tbody);

  return table;
}


/**
 * Transforms:
 *  - The first row in tbody => a single "locked banner" cell
 *  - The second row => locked text (each cell, or a single cell if colSpan used)
 */
function lockMealTableRows(tbody) {
  const rows = [...tbody.querySelectorAll("tr")];
  if (rows.length < 2) return;  // guard

  // 1) Banner row => row[0]
  const firstRow = rows[0];
  const firstRowCells = [...firstRow.querySelectorAll("td")];

  // Combine into a single cell spanning all columns
  const totalCols = firstRowCells.length;
  firstRowCells[0].colSpan = totalCols;
  firstRowCells[0].innerHTML = `
    <i class="fa fa-lock"></i> 
    Unlock more meals
  `;

  // Remove the other cells in that row
  for (let i = 1; i < firstRowCells.length; i++) {
    firstRow.removeChild(firstRowCells[i]);
  }

  // 2) Lock the second row => row[1]
  const secondRow = rows[1];
  const secondRowCells = [...secondRow.querySelectorAll("td")];
  secondRowCells.forEach(cell => {
    cell.innerHTML = `<i class="fa fa-lock"></i> Locked`;
    cell.classList.add("locked-meal-cell"); // optional styling class
  });
}

function buildThreeDayMealPlan() {
  // 1. Grab the 1‑Week PDF container
  const container = document.getElementById("pdf1WeekContainer");
  if (!container) return;

  // 2. Find the “Essential Food Guide” page so we can insert after it
  const foodGuidePage = document.getElementById("foodGuidePage");
  if (!foodGuidePage) {
    console.warn("No #foodGuidePage found — cannot insert meal plan afterwards.");
    return;
  }
  const referenceNode = foodGuidePage.nextSibling;

  // 3. Retrieve user data
  const userGoal = (localStorage.getItem("goal") || "").toLowerCase();
  const userEffort = (localStorage.getItem("effortLevel") || "moderate").toLowerCase();
  const maintenanceCals = parseInt(localStorage.getItem("maintenanceCalories") || "2500", 10);
  const userGender = (localStorage.getItem("gender") || "male").toLowerCase();
  const mealFrequency = parseInt(localStorage.getItem("mealFrequency") || "4", 10);
  let minCals = (userGender === "male") ? 1500 : 1200;
  
  // 4. Choose the proper phase splits from ratioData:
  let phase;
  if (userGoal.includes("lose")) {
    phase = "deficitPhase";
  } else if (userGoal.includes("gain")) {
    phase = "surplusPhase";
  } else if (userGoal.includes("improve")) {
    phase = "deloadPhase";
  } else {
    phase = "deficitPhase"; // fallback
  }
  // Get the splits for the current meal frequency (default to 4 if not available)
  const splits = ratioData[phase][mealFrequency] || ratioData[phase][4];
  // Dynamically derive meal keys (e.g. ["Breakfast", "Lunch", "Dinner"] for a 3-meal plan)
  const mealKeys = Object.keys(splits);

  // 5. Calculate week1DailyCals (using your existing logic)
  const baseMaint = maintenanceCals;
  const WEIGHT_LOSS_MAP = { low: -0.10, medium: -0.15, high: -0.20 };
  const MUSCLE_GAIN_MAP = { low: 0.12, medium: 0.14, high: 0.17 };
  const IMPROVE_MAP = {
    low:    { deficit: -0.09, surplus: 0.11 },
    medium: { deficit: -0.10, surplus: 0.13 },
    high:   { deficit: -0.11, surplus: 0.15 }
  };
  
  let week1DailyCals;
  if (userGoal.includes("lose")) {
    const basePct = WEIGHT_LOSS_MAP[userEffort] || WEIGHT_LOSS_MAP.medium;
    week1DailyCals = Math.max(Math.round(baseMaint * (1 + basePct * 0.50)), minCals);
  } else if (userGoal.includes("gain")) {
    const basePct = MUSCLE_GAIN_MAP[userEffort] || MUSCLE_GAIN_MAP.medium;
    week1DailyCals = Math.max(Math.round(baseMaint * (1 + basePct * 0.50)), minCals);
  } else if (userGoal.includes("improve")) {
    const obj = IMPROVE_MAP[userEffort] || IMPROVE_MAP.medium;
    week1DailyCals = Math.max(Math.round(baseMaint * (1 + obj.deficit * 0.75)), minCals);
  } else {
    week1DailyCals = baseMaint;
  }

  // 6. Define your 3-day plan using the dynamic meal keys:
  const threeDayPlan = [
    { dayLabel: "Week 1 - Day 1", meals: {} },
    { dayLabel: "Week 1 - Day 2", meals: {} },
    { dayLabel: "Week 1 - Day 3", meals: {} },
  ];
  threeDayPlan.forEach(dayPlan => {
    mealKeys.forEach(key => {
      const target = Math.round(week1DailyCals * splits[key]);
      dayPlan.meals[key] = pickMealForCategory(key, target, mealDatabase);
    });
  });
  
  // 7. Build pages for each day and store them in an array.
  const newPages = [];
  threeDayPlan.forEach((obj) => {
    const { dayLabel, meals } = obj;
    if (mealKeys.length === 2) {
      // For a 2-meal plan, put all meals on one page.
      const pg = document.createElement("div");
      pg.className = "pdf-page meal-plan-page";
      
      // Add badge logo at top
      const badgeDiv = document.createElement("div");
      badgeDiv.className = "page-header-left-logo";
      badgeDiv.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge Logo" class="logo-badge" />`;
      pg.appendChild(badgeDiv);
      
      const heading = document.createElement("h3");
      heading.className = "page-heading with-badge-logo";
      heading.textContent = dayLabel;
      pg.appendChild(heading);
      
      mealKeys.forEach(key => {
        const subHeading = document.createElement("h4");
        subHeading.className = "subheading";
        subHeading.style.textAlign = "center";
        subHeading.textContent = key;
        pg.appendChild(subHeading);
        const mealTable = buildMealTable(meals[key], key);
        pg.appendChild(mealTable);
      });
      newPages.push(pg);
    } else {
      // For 3 or more meals, split the keys into two pages.
      const allCats = Object.keys(meals);
      const half = Math.ceil(allCats.length / 2);
      const page1Cats = allCats.slice(0, half);
      const page2Cats = allCats.slice(half);
      
      // Page 1
      const pg1 = document.createElement("div");
      pg1.className = "pdf-page meal-plan-page";
      
      const badgeDiv1 = document.createElement("div");
      badgeDiv1.className = "page-header-left-logo";
      badgeDiv1.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge Logo" class="logo-badge" />`;
      pg1.appendChild(badgeDiv1);
      
      const heading1 = document.createElement("h3");
      heading1.className = "page-heading with-badge-logo";
      heading1.textContent = dayLabel;
      pg1.appendChild(heading1);
      
      page1Cats.forEach(cat => {
        const subHeading = document.createElement("h4");
        subHeading.className = "subheading";
        subHeading.style.textAlign = "center";
        subHeading.textContent = cat;
        pg1.appendChild(subHeading);
        const mealTable = buildMealTable(meals[cat], cat);
        pg1.appendChild(mealTable);
      });
      
      // Page 2
      const pg2 = document.createElement("div");
      pg2.className = "pdf-page meal-plan-page";
      
      const badgeDiv2 = document.createElement("div");
      badgeDiv2.className = "page-header-left-logo";
      badgeDiv2.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="Badge Logo" class="logo-badge" />`;
      pg2.appendChild(badgeDiv2);
      
      const heading2 = document.createElement("h3");
      heading2.className = "page-heading with-badge-logo";
      heading2.textContent = dayLabel;
      pg2.appendChild(heading2);
      
      page2Cats.forEach(cat => {
        const subHeading = document.createElement("h4");
        subHeading.className = "subheading";
        subHeading.style.textAlign = "center";
        subHeading.textContent = cat;
        pg2.appendChild(subHeading);
        const mealTable = buildMealTable(meals[cat], cat);
        pg2.appendChild(mealTable);
      });
      
      newPages.push(pg1, pg2);
    }
  });
  
  // 8. Insert all new pages in order immediately after the Food Guide page.
  newPages.forEach(pg => {
    container.insertBefore(pg, referenceNode);
  });

  const lockedPage = createMealPlanLockedPageFullSize();
  const mealPlanPages = container.querySelectorAll(".meal-plan-page");
  if (mealPlanPages.length > 0) {
    const lastMealPlanPage = mealPlanPages[mealPlanPages.length - 1];
    lastMealPlanPage.parentNode.insertBefore(lockedPage, lastMealPlanPage.nextSibling);
  } else {
    container.insertBefore(lockedPage, referenceNode);
  }
  
  // 9. Add page numbering/footers
  addPageNumbers("pdf1WeekContainer");
}

function buildMealTable(mealObj, mealType) {
  if (!mealObj) {
    const p = document.createElement("p");
    p.textContent = `No ${mealType} meal available.`;
    return p;
  }
  
  const table = document.createElement("table");
  table.className = "session-table modern-table meal-plan-table";
  
  // Set up colgroup with columns: 30%, 35%, 35%
  const colgroup = document.createElement("colgroup");
  const col1 = document.createElement("col");
  col1.style.width = "30%";
  const col2 = document.createElement("col");
  col2.style.width = "35%";
  const col3 = document.createElement("col");
  col3.style.width = "35%";
  colgroup.appendChild(col1);
  colgroup.appendChild(col2);
  colgroup.appendChild(col3);
  table.appendChild(colgroup);
  
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  ["MEAL DETAILS", "INGREDIENTS", "RECIPE"].forEach((txt) => {
    const th = document.createElement("th");
    th.textContent = txt;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);
  
  const tbody = document.createElement("tbody");
  const row = document.createElement("tr");
  
  // Column 1: Meal name + macros
  const tdDetails = document.createElement("td");
  tdDetails.innerHTML = `
    <div class="meal-name-divider">${mealObj.mealName}</div>
    <div style="text-align:center; font-size:0.9rem;">
      Calories: ${mealObj.calories || "?"}<br/>
      Protein: ${mealObj.protein || "?"}g<br/>
      Carbs: ${mealObj.carbs || "?"}g<br/>
      Fat: ${mealObj.fats || "?"}g
    </div>
  `;
  row.appendChild(tdDetails);
  
  // Column 2: Ingredients
  const tdIngr = document.createElement("td");
  tdIngr.style.textAlign = "left";
  if (Array.isArray(mealObj.ingredients)) {
    mealObj.ingredients.forEach((ing) => {
      const div = document.createElement("div");
      let text;
      if (ing.wholeItem) {
        // e.g. "• 2 eggs" or "• 1 egg"
        const plural = ing.plural || ing.name + "s";
        text = `• ${ing.quantity} ${ing.quantity === 1 ? ing.singular : plural}`;
      } else {
        // e.g. "• 30g whey protein"
        text = `• ${ing.quantity}${ing.unit || ""} ${ing.name}`;
      }
      div.textContent = text;
      tdIngr.appendChild(div);
    });
  } else {
    tdIngr.textContent = "No ingredients listed.";
  }
  row.appendChild(tdIngr);
  
  // Column 3: Recipe steps
  const tdRecipe = document.createElement("td");
  tdRecipe.style.textAlign = "left";
  if (Array.isArray(mealObj.recipe)) {
    mealObj.recipe.forEach((step) => {
      const div = document.createElement("div");
      div.textContent = "• " + step;
      tdRecipe.appendChild(div);
    });
  } else {
    tdRecipe.textContent = "No recipe steps provided.";
  }
  row.appendChild(tdRecipe);
  
  tbody.appendChild(row);
  table.appendChild(tbody);
  return table;
}

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

/**************************************************
 *  UTILITY to replace {Workout Program Duration}
 *  with "1-Week", "4-Weeks", or "12-Weeks"
 **************************************************/
function replaceProgramDurationText(containerId, label) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // We'll search all paragraphs & replace the placeholder text
  const paragraphs = container.querySelectorAll("p");
  paragraphs.forEach(p => {
    if (p.innerHTML.includes("{Workout Program Duration}")) {
      p.innerHTML = p.innerHTML.replace(/\{Workout Program Duration\}/g, label);
    }
  });
}

/**************************************************
 * (G) 1-WEEK PDF Flow
 **************************************************/
function fillOneWeekPDF() {
  setGlobalFontSize();
  const userName = localStorage.getItem("name") || "User";
  const coverTitle = document.getElementById("oneWeekCoverTitle");
  if (coverTitle) {
    coverTitle.textContent = `${userName}'s 1-Week Program`;
  }
  const userGoalRaw = localStorage.getItem("goal") || "Lose Weight";
  const userGoal = capitalizeGoal(userGoalRaw);
  const dob = localStorage.getItem("dob") || "1990-01-01";
  const heightVal = localStorage.getItem("height") || "170";
  const weightVal = localStorage.getItem("weight") || "70";
  const waterVal = localStorage.getItem("programWaterIntake") || "2.5";
  const selectedCals = parseInt(localStorage.getItem("selectedCalories") || "2200", 10);
  const p = Math.round((0.3 * selectedCals) / 4);
  const c = Math.round((0.4 * selectedCals) / 4);
  const f = Math.round((0.3 * selectedCals) / 9);
  const profileHeadingEl = document.getElementById("oneWeekProfileHeading");
  if (profileHeadingEl) profileHeadingEl.textContent = `${userName}'s Profile`;
  const dobEl = document.getElementById("dob");
  if (dobEl) dobEl.textContent = dob;
  const goalEl = document.getElementById("goal");
  if (goalEl) goalEl.textContent = userGoal;
  const heightEl = document.getElementById("height");
  if (heightEl) heightEl.textContent = `${heightVal} cm`;
  const weightEl = document.getElementById("weight");
  if (weightEl) weightEl.textContent = `${weightVal} kg`;
  const waterEl = document.getElementById("waterIntake");
  if (waterEl) waterEl.textContent = `${waterVal} L`;
  const proteinEl = document.getElementById("protein");
  if (proteinEl) proteinEl.textContent = `${p} g`;
  const carbsEl = document.getElementById("carbs");
  if (carbsEl) carbsEl.textContent = `${c} g`;
  const fatsEl = document.getElementById("fats");
  if (fatsEl) fatsEl.textContent = `${f} g`;
  adjustDailyNutritionRows();
  fillDailyNutritionRows();
  finalizeWorkoutNavPage();
  fillOneWeekClientProfilePage();
  createNutritionIntroPage(document.getElementById("pdf1WeekContainer"));
  buildWeeklyCalorieTableDynamically();
  createFoodGuidePage();
  buildThreeDayMealPlan();
  fillOneWeekSessions();
  createFinalPage("1week", "pdf1WeekContainer");
  const altPage = createAlternativeExercisesPage1Week();
  const theRealFinalPage = document.getElementById("final-page");
  const container = document.getElementById("pdf1WeekContainer");
  
  if (altPage && theRealFinalPage && container) {
    container.insertBefore(altPage, theRealFinalPage);
  }
  replaceProgramDurationText("pdf1WeekContainer", "1-Week");
  setUniformPageHeights();
  addPageNumbers("pdf1WeekContainer");
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

// const ratioData = {
//   deficitPhase: {
//     2: { Lunch: 0.55, Dinner: 0.45 },
//     3: { Breakfast: 0.30, Lunch: 0.40, Dinner: 0.30 },
//     4: { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.25, Snack: 0.15 }
//   },
//   surplusPhase: {
//     2: { Lunch: 0.50, Dinner: 0.50 },
//     3: { Breakfast: 0.33, Lunch: 0.33, Dinner: 0.34 },
//     4: { Breakfast: 0.30, Lunch: 0.30, Dinner: 0.30, Snack: 0.10 }
//   },
//   deloadPhase: {
//     2: { Lunch: 0.52, Dinner: 0.48 },
//     3: { Breakfast: 0.30, Lunch: 0.35, Dinner: 0.35 },
//     4: { Breakfast: 0.28, Lunch: 0.30, Dinner: 0.28, Snack: 0.14 }
//   }
// };

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

/**************************************************
 * (H) 4-WEEK & 12-WEEK PDF placeholders
 **************************************************/
function fillfoureWeekPDF() {
  const container = document.getElementById("pdf4WeekContainer");
  if (!container) return;
  const coverTitle = document.getElementById("fourWeekCoverTitle");
  if (coverTitle) {
    coverTitle.textContent = "Your 4-Week Program (Placeholder)";
  }
}

function fillTwelveWeekPDF() {
  const container = document.getElementById("pdf12WeekContainer");
  if (!container) return;
  const coverTitle = document.getElementById("twelveWeekCoverTitle");
  if (coverTitle) {
    coverTitle.textContent = "Your 12-Week Program (Placeholder)";
  }
}

/**************************************************
 * (I) fillOneWeekSessions
 **************************************************/
function fillOneWeekSessions() {
  const sessionsContainer = document.getElementById("oneWeekSessions");
  if (!sessionsContainer) return;
  sessionsContainer.innerHTML = "";

  const stored = localStorage.getItem("oneWeekProgram");
  if (!stored) {
    const msg = document.createElement("p");
    msg.textContent = "No 1-week program data found in localStorage.";
    sessionsContainer.appendChild(msg);
    return;
  }

  let oneWeekData;
  try {
    oneWeekData = JSON.parse(stored);
  } catch (e) {
    console.error("Parsing oneWeekProgram error:", e);
    return;
  }

  const days = oneWeekData.days || [];

  days.forEach((dayObj, dayIndex) => {
    // -----------------------------
    // PAGE 1: Warm-Up & Cool-Down
    // -----------------------------
    const pgWarm = document.createElement("div");
    pgWarm.className = "pdf-page";

    // Page header + logo
    const badgeDiv = document.createElement("div");
    badgeDiv.className = "page-header-left-logo";
    badgeDiv.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
    pgWarm.appendChild(badgeDiv);

    const h3 = document.createElement("h3");
    h3.className = "page-heading with-badge-logo";
    h3.textContent = `${oneWeekData.phase} - Week ${oneWeekData.week} - Day ${dayIndex + 1}`;
    pgWarm.appendChild(h3);

    // 1) Warm-Up Section
    if (dayObj.warmUp && dayObj.warmUp.length > 0) {
      const warmTitle = document.createElement("h4");
      warmTitle.className = "section-heading";
      warmTitle.textContent = "Pre-Workout Warm-Up";
      pgWarm.appendChild(warmTitle);

      const warmWrap = document.createElement("div");
      warmWrap.className = "session-table-container modern-table-wrapper";

      const warmTable = document.createElement("table");
      warmTable.className = "session-table modern-table";

      // Table header
      const wThead = document.createElement("thead");
      const wTr = document.createElement("tr");
      ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        wTr.appendChild(th);
      });
      wThead.appendChild(wTr);
      warmTable.appendChild(wThead);

      // Table body
      const wTbody = document.createElement("tbody");
      dayObj.warmUp.forEach(wu => {
        const row = buildExerciseRow(
          wu.name || "Warm-Up",
          wu.duration || "",
          wu.rpe ? `RPE ${wu.rpe}` : "",
          wu.notes || ""
        );
        wTbody.appendChild(row);
      });
      warmTable.appendChild(wTbody);

      warmWrap.appendChild(warmTable);
      pgWarm.appendChild(warmWrap);
    }

    // 2) Cool-Down Section
    if (dayObj.coolDown && dayObj.coolDown.length > 0) {
      const coolTitle = document.createElement("h4");
      coolTitle.className = "section-heading";
      coolTitle.textContent = "Post-Workout Cool-Down";
      pgWarm.appendChild(coolTitle);

      const coolWrap = document.createElement("div");
      coolWrap.className = "session-table-container modern-table-wrapper";

      const coolTable = document.createElement("table");
      coolTable.className = "session-table modern-table";

      // Table header
      const cThead = document.createElement("thead");
      const cTr = document.createElement("tr");
      ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        cTr.appendChild(th);
      });
      cThead.appendChild(cTr);
      coolTable.appendChild(cThead);

      // Table body
      const cTbody = document.createElement("tbody");
      dayObj.coolDown.forEach(cd => {
        const row = buildExerciseRow(
          cd.name || "Cool-Down",
          cd.duration || "",
          cd.rpe ? `RPE ${cd.rpe}` : "",
          cd.notes || ""
        );
        cTbody.appendChild(row);
      });
      coolTable.appendChild(cTbody);

      coolWrap.appendChild(coolTable);
      pgWarm.appendChild(coolWrap);
    }

    // Note: "Please see the next page..."
    const noteNext = document.createElement("p");
    noteNext.className = "note-text-nav";
    noteNext.style.textAlign = "center";
    noteNext.style.fontStyle = "italic";
    noteNext.style.fontSize = "0.9rem";
    noteNext.textContent = "Please see the next page for the main workout.";
    pgWarm.appendChild(noteNext);

    sessionsContainer.appendChild(pgWarm);


    // -----------------------------
    // PAGE 2: Main Workout
    // (Resistance Training + Cardio)
    // -----------------------------
    const pgMain = document.createElement("div");
    pgMain.className = "pdf-page lyw-page";

    const badgeMain = document.createElement("div");
    badgeMain.className = "page-header-left-logo";
    badgeMain.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
    pgMain.appendChild(badgeMain);

    const h3b = document.createElement("h3");
    h3b.className = "page-heading with-badge-logo";
    h3b.textContent = `${oneWeekData.phase} - Week ${oneWeekData.week} - Day ${dayIndex + 1}`;
    pgMain.appendChild(h3b);

    // 1) Resistance Training
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

      // Table header
      const rtThd = document.createElement("thead");
      const rtTr = document.createElement("tr");
      ["Exercise", "Sets/Reps", "RPE", "Notes"].forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        rtTr.appendChild(th);
      });
      rtThd.appendChild(rtTr);
      rtTable.appendChild(rtThd);

      // Table body
      const rtTbody = document.createElement("tbody");
      rtBlocks.forEach(block => {
        (block.exercises || []).forEach(ex => {
          // Main exercise row
          const mainRow = buildExerciseRow(
            ex.name || "Exercise",
            (ex.sets && ex.reps) ? `${ex.sets} x ${ex.reps}` : ex.duration || "",
            ex.rpe ? `RPE ${ex.rpe}` : "",
            ex.notes || ""
          );
          rtTbody.appendChild(mainRow);

          // If there's a superset
          if (ex.superset) {
            const ssRow = buildExerciseRow(
              ex.superset.name || "Superset",
              (ex.superset.sets && ex.superset.reps) 
                ? `${ex.superset.sets} x ${ex.superset.reps}` 
                : "",
              ex.superset.rpe ? `RPE ${ex.superset.rpe}` : "",
              ex.superset.notes || ""
            );
            rtTbody.appendChild(ssRow);
          }
        });
      });
      rtTable.appendChild(rtTbody);

      rtWrap.appendChild(rtTable);
      pgMain.appendChild(rtWrap);
    }

    // 2) Post-Workout Cardio
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

      // Table header
      const cThead = document.createElement("thead");
      const cTr2 = document.createElement("tr");
      ["Exercise", "Duration", "RPE", "Notes"].forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        cTr2.appendChild(th);
      });
      cThead.appendChild(cTr2);
      cTable.appendChild(cThead);

      // Table body
      const cTbody = document.createElement("tbody");
      cardioBlocks.forEach(block => {
        if (Array.isArray(block.exercises)) {
          block.exercises.forEach(cx => {
            const row = buildExerciseRow(
              cx.name || "Cardio",
              cx.duration || (block.allocatedMinutes ? `${block.allocatedMinutes} minutes` : ""),
              cx.rpe ? `RPE ${cx.rpe}` : "",
              cx.notes || ""
            );
            cTbody.appendChild(row);
          });
        } else {
          // Single cardio block object
          const row = buildExerciseRow(
            block.name || "Cardio",
            block.allocatedMinutes ? `${block.allocatedMinutes} minutes` : "",
            block.rpe ? `RPE ${block.rpe}` : "",
            block.notes || ""
          );
          cTbody.appendChild(row);
        }
      });
      cTable.appendChild(cTbody);

      cWrap.appendChild(cTable);
      pgMain.appendChild(cWrap);
    }

    // Note: "Please see the previous page..."
    const notePrev = document.createElement("p");
    notePrev.className = "note-text-nav";
    notePrev.style.textAlign = "center";
    notePrev.style.fontStyle = "italic";
    notePrev.style.fontSize = "0.9rem";
    notePrev.textContent = "Please see the previous page for the warm-up and cool-down.";
    pgMain.appendChild(notePrev);

    sessionsContainer.appendChild(pgMain);
  });
}

/**************************************************
 * (2) The same buildExerciseRow() helper is fine
 **************************************************/
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

/**************************************************
Final Page for 1-Week, 4-Week, 12-Week 
 **************************************************/
function createFinalPage(programType, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pageDiv = document.createElement("div");
  pageDiv.className = "pdf-page";

  // --- CHANGED #9: Decrease motivational section size by 20%
  const motivationalSection = document.createElement("div");
  motivationalSection.style.backgroundColor = "#F3F0EA";
  motivationalSection.style.borderRadius = "6px";
  motivationalSection.style.padding = "0.25rem"; 
  motivationalSection.style.marginBottom = "0.5rem"; // reduced margin
  motivationalSection.style.textAlign = "center"; // center text
  motivationalSection.style.lineHeight = "1.5";

  if (programType === "1week") {
    const subheading = document.createElement("h3");
    subheading.className = "subheading";
    subheading.style.textAlign = "center"; // CHANGED #1: center text
    subheading.textContent = "Congratulations on Completing Your Program!";
    motivationalSection.appendChild(subheading);

    const subtext1 = document.createElement("p");
    subtext1.className = "subtext";
    subtext1.style.textAlign = "center"; // CHANGED #1: center text
    subtext1.textContent = "You’ve made an incredible start—celebrate your progress and stay consistent on your journey!";
    motivationalSection.appendChild(subtext1);
  }
  pageDiv.appendChild(motivationalSection);

  if (programType === "1week") {
    // --- CHANGED: Center upsell heading
    const upsellHeading = document.createElement("p");
    upsellHeading.className = "heading";
    upsellHeading.style.textAlign = "center"; // center heading
    upsellHeading.textContent = "Unlock More Results and Features With Your 4-Week Program!";
    pageDiv.appendChild(upsellHeading);

    // Placeholder image remains the same.
    const testimonialImg = document.createElement("div");
    testimonialImg.className = "upgrade-image-placeholder";
    pageDiv.appendChild(testimonialImg);

    const upsellSubtext = document.createElement("p");
    upsellSubtext.className = "subtext";
    upsellSubtext.style.textAlign = "center"; // center text
    upsellSubtext.textContent = "You’ve built momentum—don’t stop now! Unlock your full 4-week plan to continue progressing.";
    pageDiv.appendChild(upsellSubtext);

    // --- CHANGED #7: Update CTA button text
    const upgradeBtn = document.createElement("a");
    upgradeBtn.className = "upgrade-now-btn";
    upgradeBtn.textContent = "Limited Offer – Unlock Your 4-Week Plan Now!"; // updated text
    upgradeBtn.href = "landing-page.html";
    pageDiv.appendChild(upgradeBtn);

    // --- CHANGED #10: Add price anchor underneath CTA
    const priceAnchor = document.createElement("div");
    priceAnchor.style.textAlign = "center";
    // priceAnchor.style.marginTop = "0.25rem";
    priceAnchor.style.fontFamily = "Poppins";
    // Original price: £49.99 (line-through, 14px, #333)
    const originalPrice = document.createElement("span");
    originalPrice.textContent = "£49.99";
    originalPrice.style.color = "#333";
    originalPrice.style.textDecoration = "line-through";
    originalPrice.style.fontSize = "14px";
    originalPrice.style.marginRight = "2px";
    // New price: £39.99 (red, 18px)
    const newPrice = document.createElement("span");
    newPrice.textContent = " £39.99";
    newPrice.style.color = "#D32F2F";
    newPrice.style.fontSize = "24px";
    newPrice.style.marginLeft = "2px";
    newPrice.style.fontWeight = "800";
    newPrice.style.letterSpacing = "0.5px";
    priceAnchor.appendChild(originalPrice);
    priceAnchor.appendChild(newPrice);
    pageDiv.appendChild(priceAnchor);

    // --- CHANGED #8 & #1: Update 30-day guarantee text and center it
    const moneyBack = document.createElement("p");
    moneyBack.className = "money-back-text";
    moneyBack.style.textAlign = "center"; // center text
    moneyBack.textContent = "100% Risk-Free - Love it or get a FULL refund within 30 days!";
    pageDiv.appendChild(moneyBack);

    // --- CHANGED #5 & #6: Adjust "What's Included?" section spacing and centering
    const whatsIncludedContainer = document.createElement("div");
    whatsIncludedContainer.className = "whats-included-container";
    // (Spacing is further tweaked via CSS and inline style if needed)
    whatsIncludedContainer.style.marginTop = "1rem";
    const listTitle = document.createElement("h4");
    listTitle.className = "subheading";
    listTitle.style.textAlign = "center"; // center subheading
    listTitle.textContent = "What's Included?";
    whatsIncludedContainer.appendChild(listTitle);

    // Create the two-column benefits container
    const benefitsContainer = document.createElement("div");
    benefitsContainer.className = "benefits-container";

    // Left column
    const leftCol = document.createElement("div");
    leftCol.className = "benefit-column";
    const benefit1 = document.createElement("div");
    benefit1.className = "benefit-item";
    benefit1.innerHTML = `<div class="benefit-title"> Tailored 4-Week Program</div>`;
    leftCol.appendChild(benefit1);
    const benefit2 = document.createElement("div");
    benefit2.className = "benefit-item";
    benefit2.innerHTML = `<div class="benefit-title"> Essential Food Guide</div>`;
    leftCol.appendChild(benefit2);
    const benefit3 = document.createElement("div");
    benefit3.className = "benefit-item";
    benefit3.innerHTML = `<div class="benefit-title"> Weekly Calorie & Macro Overview</div>`;
    leftCol.appendChild(benefit3);
    benefitsContainer.appendChild(leftCol);

    // Right column
    const rightCol = document.createElement("div");
    rightCol.className = "benefit-column";
    const benefit4 = document.createElement("div");
    benefit4.className = "benefit-item";
    benefit4.innerHTML = `<div class="benefit-title"> Exclusive Video Tutorials</div>`;
    rightCol.appendChild(benefit4);
    const benefit5 = document.createElement("div");
    benefit5.className = "benefit-item";
    benefit5.innerHTML = `<div class="benefit-title"> Smart Workout Tracker</div>`;
    rightCol.appendChild(benefit5);
    const benefit6 = document.createElement("div");
    benefit6.className = "benefit-item";
    benefit6.innerHTML = `<div class="benefit-title"> Exclusive Access to Webinars</div>`;
    rightCol.appendChild(benefit6);
    benefitsContainer.appendChild(rightCol);
    whatsIncludedContainer.appendChild(benefitsContainer);
    pageDiv.appendChild(whatsIncludedContainer);
  }

  else if (programType === "4week") {
    const sh = document.createElement("h3");
    sh.className="subheading";
    sh.style.textAlign="center";
    sh.textContent="Congratulations on Completing Your Program!";
    motivationalSection.appendChild(sh); // [CHANGED]

    const st1 = document.createElement("p");
    st1.className="subtext";
    st1.style.textAlign="center";
    st1.textContent="You’ve made an incredible start—celebrate your progress and stay consistent on your journey!";
    motivationalSection.appendChild(st1); // [CHANGED]

    const upsellH = document.createElement("p");
    upsellH.className="heading";
    upsellH.style.textAlign="center";
    upsellH.textContent="Unlock More Results and Features With Your 12-Week Program!";
    pageDiv.appendChild(upsellH);

    const testImg = document.createElement("div");
    testImg.className="upgrade-image-placeholder";
    pageDiv.appendChild(testImg);

    const upsellSub = document.createElement("p");
    upsellSub.className="subtext";
    upsellSub.style.textAlign="center";
    upsellSub.textContent="Keep the momentum going! Upgrade now to unlock your full 12-week journey.";
    pageDiv.appendChild(upsellSub);

    const btn = document.createElement("a");
    btn.className="upgrade-now-btn";
    btn.textContent="Limited Offer – Unlock Your 12-Week Plan Now!";
    btn.href="landing-page.html";
    pageDiv.appendChild(btn);

    const priceDiv = document.createElement("div");
    priceDiv.style.textAlign="center";
    priceDiv.style.fontFamily="Poppins";

    const origP = document.createElement("span");
    origP.textContent="£99.99";
    origP.style.color="#333";
    origP.style.textDecoration="line-through";
    origP.style.fontSize="14px";
    origP.style.marginRight="2px";

    const newP = document.createElement("span");
    newP.textContent=" £79.99";
    newP.style.color="#D32F2F";
    newP.style.fontSize="24px";
    newP.style.marginLeft="2px";
    newP.style.fontWeight="800";
    newP.style.letterSpacing="0.5px";

    priceDiv.appendChild(origP);
    priceDiv.appendChild(newP);
    pageDiv.appendChild(priceDiv);

    const moneyBack = document.createElement("p");
    moneyBack.className="money-back-text";
    moneyBack.style.textAlign="center";
    moneyBack.textContent="100% Risk-Free - Love it or get a FULL refund within 30 days!";
    pageDiv.appendChild(moneyBack);

    const wic = document.createElement("div");
    wic.className="whats-included-container";
    pageDiv.appendChild(wic);

    const wicTitle = document.createElement("h4");
    wicTitle.className="subheading";
    wicTitle.style.textAlign="center";
    wicTitle.textContent="What's Included?";
    wic.appendChild(wicTitle);

    const bennCont = document.createElement("div");
    bennCont.className="benefits-container";
    wic.appendChild(bennCont);

    // Left col
    const lCol = document.createElement("div");
    lCol.className="benefit-column";
    const b1 = document.createElement("div");
    b1.className="benefit-item";
    b1.innerHTML=`<div class="benefit-title">Tailored 12-Week Program</div>`;
    lCol.appendChild(b1);
    const b2 = document.createElement("div");
    b2.className="benefit-item";
    b2.innerHTML=`<div class="benefit-title">Essential Food Guide</div>`;
    lCol.appendChild(b2);
    const b3 = document.createElement("div");
    b3.className="benefit-item";
    b3.innerHTML=`<div class="benefit-title">Weekly Calorie & Macro Overview</div>`;
    lCol.appendChild(b3);
    bennCont.appendChild(lCol);

    // Right col
    const rCol = document.createElement("div");
    rCol.className="benefit-column";
    const b4 = document.createElement("div");
    b4.className="benefit-item";
    b4.innerHTML=`<div class="benefit-title">Exclusive Video Tutorials</div>`;
    rCol.appendChild(b4);
    const b5 = document.createElement("div");
    b5.className="benefit-item";
    b5.innerHTML=`<div class="benefit-title">Smart Workout Tracker</div>`;
    rCol.appendChild(b5);
    const b6 = document.createElement("div");
    b6.className="benefit-item";
    b6.innerHTML=`<div class="benefit-title">Exclusive Access to Webinars</div>`;
    rCol.appendChild(b6);
    bennCont.appendChild(rCol);
  }
  else if (programType === "12week") {
    const subtext1 = document.createElement("p");
    subtext1.className = "subtext";
    subtext1.textContent = "You’ve achieved something incredible—twelve weeks of progress, dedication, and growth. Keep striving for more!";
    wrapper.appendChild(subtext1);

    const subtext2 = document.createElement("p");
    subtext2.className = "subtext";
    subtext2.textContent = "We’re incredibly grateful to have been a part of your fitness transformation. Your dedication and hard work inspire us to keep creating programs that empower people like you to achieve their goals. Remember, this is just the beginning—your journey doesn’t end here. Keep striving, keep growing, and know that we’re cheering you on every step of the way!";
    wrapper.appendChild(subtext2);

    const shareSubtext = document.createElement("p");
    shareSubtext.className = "subtext";
    shareSubtext.textContent = "Enjoyed your program? Share your experience and help others start their journey!";
    wrapper.appendChild(shareSubtext);

    const trustpilotLogo = document.createElement("img");
    trustpilotLogo.src = "src/images/trustpilot-logo.png";
    trustpilotLogo.alt = "Trustpilot";
    trustpilotLogo.className = "trustpilot-logo";
    trustpilotLogo.addEventListener("click", () => {
      window.open("https://www.trustpilot.com/", "_blank");
    });
    wrapper.appendChild(trustpilotLogo);
  }

  // Insert into container
  container.appendChild(pageDiv);
}

/**************************************************
 * CREATE ALTERNATIVE EXERCISES PAGE (1-Week Only)
 **************************************************/
function createAlternativeExercisesPage1Week() {
  // If user has 4 or 12-week, do not create (per instructions).
  const purchasedWeeks = parseInt(localStorage.getItem("purchasedWeeks") || "1", 10);
  if (purchasedWeeks !== 1) {
    return; // For 4-week or 12-week, we skip this page
  }

  // Retrieve the 1-week program from localStorage
  const stored = localStorage.getItem("oneWeekProgram");
  if (!stored) return;

  let oneWeekData;
  try {
    oneWeekData = JSON.parse(stored);
  } catch (e) {
    console.error("Parsing oneWeekProgram error:", e);
    return;
  }
  const days = oneWeekData.days || [];

  // 1) Gather all "mainWork" => blockType==="Resistance Training" => exercises
  let allExercises = [];
  days.forEach(day => {
    if (day.mainWork && Array.isArray(day.mainWork)) {
      day.mainWork.forEach(block => {
        if (block.blockType === "Resistance Training") {
          block.exercises.forEach(ex => {
            allExercises.push(ex);
            // Also include superset if it exists
            if (ex.superset) {
              allExercises.push(ex.superset);
            }
          });
        }
      });
    }
  });

  // 2) Reorder them based on the specified priority
  const priorityOrder = [
    { muscleGroup: "chest", typeOfMovement: "compound" },
    { muscleGroup: "back", typeOfMovement: "compound" },
    { muscleGroup: "quad", typeOfMovement: "compound" },
    { muscleGroup: "hamstring", typeOfMovement: "compound" },
    { muscleGroup: "shoulder", typeOfMovement: "compound" },
    { muscleGroup: "back", typeOfMovement: "isolation" },
    { muscleGroup: "triceps", typeOfMovement: "isolation" },
    { muscleGroup: "biceps", typeOfMovement: "isolation" },
    { muscleGroup: "chest", typeOfMovement: "isolation" },
    { muscleGroup: "quad", typeOfMovement: "isolation" },
    { muscleGroup: "hamstring", typeOfMovement: "isolation" },
    { muscleGroup: "shoulder", typeOfMovement: "isolation" },
  ];

  // Convert muscleGroup to lower case for match
  const sortedExercises = allExercises.sort((a, b) => {
    const indexA = findPriorityIndex(a, priorityOrder);
    const indexB = findPriorityIndex(b, priorityOrder);
    return indexA - indexB;
  });

  // 3) Take up to 10
  const finalExercises = sortedExercises.slice(0, 9);
  if (!finalExercises.length) {
    // No exercises to display => skip creating page
    return;
  }

  // 4) Create a new PDF page
  const container = document.getElementById("pdf1WeekContainer");
  if (!container) return;

  const altPage = document.createElement("div");
  altPage.className = "pdf-page";

  // Page header with left logo
  const badgeLogo = document.createElement("div");
  badgeLogo.className = "page-header-left-logo";
  badgeLogo.innerHTML = `<img src="src/images/rtb-logo-white.png" alt="RTB small logo" class="logo-badge" />`;
  altPage.appendChild(badgeLogo);

  // Page heading
  const heading = document.createElement("h2");
  heading.className = "page-heading with-badge-logo";
  heading.textContent = "Modify Your Workout";
  altPage.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.style.textAlign = "center";
  subtext.style.margin = "0 0 1rem 0";
  subtext.style.fontSize = "1rem";
  subtext.textContent = "Need a change? Swap exercises if needed for comfort, preference, or variety.";
  altPage.appendChild(subtext);

  // 5) Build the table
  const tableWrapper = document.createElement("div");
  tableWrapper.className = "session-table-container modern-table-wrapper";

  const table = document.createElement("table");
  table.className = "session-table modern-table alt-ex-table";

  // Thead
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  const thMain = document.createElement("th");
  thMain.textContent = "Main Exercise";
  const thAlt = document.createElement("th");
  thAlt.textContent = "Alternative Exercises";
  trHead.appendChild(thMain);
  trHead.appendChild(thAlt);
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");

  // We will display each exercise in the left column; right column is locked.
  // On the 5th data row, we will insert a locked banner row.
  let rowCount = 0;

  finalExercises.forEach((ex, idx) => {
    // Check if we've displayed 4 rows so far, then row #5 is a locked banner row
    if (rowCount === 4) {
      // Insert the locked banner row
      const bannerTr = document.createElement("tr");
      bannerTr.classList.add("locked-banner-row");
      const bannerTd = document.createElement("td");
      bannerTd.setAttribute("colspan", "2");
      bannerTd.innerHTML = `
        <i class="fa fa-lock"></i>
        Unlock exercise swaps to keep your workouts fresh and flexible!
      `;
      bannerTr.appendChild(bannerTd);
      tbody.appendChild(bannerTr);

      // After the banner, proceed
      rowCount++;
    }

    const tr = document.createElement("tr");

    // Left column: main exercise name
    const tdLeft = document.createElement("td");
    tdLeft.textContent = ex.name || "Exercise";
    tr.appendChild(tdLeft);

    // Right column: locked cell
    const tdRight = document.createElement("td");
    tdRight.classList.add("locked-cell");
    // We can follow the same style as other locked cells:
    tdRight.innerHTML = `<i class="fa fa-lock"></i> Locked`;
    tr.appendChild(tdRight);

    tbody.appendChild(tr);
    rowCount++;
  });

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  altPage.appendChild(tableWrapper);

  // Footer (main content style => page number on the right only)
  const foot = createMainFooter(0, 0);
  altPage.appendChild(foot);

  // Insert before the final page. We can assume the final page is the *last* .pdf-page.
  const allPages = container.querySelectorAll(".pdf-page");
  if (allPages.length > 0) {
    // Insert this new page before the final page
    container.insertBefore(altPage, allPages[allPages.length - 1]);
  } else {
    // Fallback: just append if no pages exist
    container.appendChild(altPage);
  }
}

/** Helper to find the index in priority array; returns large number if not found */
function findPriorityIndex(ex, priorityList) {
  if (!ex.muscleGroup || !ex.typeOfMovement) return 9999;
  const mg = ex.muscleGroup.toLowerCase();
  const tm = ex.typeOfMovement.toLowerCase();
  for (let i = 0; i < priorityList.length; i++) {
    const p = priorityList[i];
    if (p.muscleGroup === mg && p.typeOfMovement === tm) {
      return i;
    }
  }
  return 9999;
}

/**************************************************
 * (J) DOM READY
 **************************************************/
document.addEventListener("DOMContentLoaded", () => {
  fillOneWeekPDF();
  fillTwelveWeekPDF();
  document.getElementById("download1WeekBtn")?.addEventListener("click", () => {
    localStorage.setItem("purchasedWeeks", "1");
    downloadPDF("pdf1WeekContainer", "1-Week-Program.pdf");
  });
  document.getElementById("download4WeekBtn")?.addEventListener("click", () => {
    localStorage.setItem("purchasedWeeks", "4");
    downloadPDF("pdf4WeekContainer", "4-Week-Program.pdf");
  });
  document.getElementById("download12WeekBtn")?.addEventListener("click", () => {
    localStorage.setItem("purchasedWeeks", "12");
    downloadPDF("pdf12WeekContainer", "12-Week-Program.pdf");
  });
});