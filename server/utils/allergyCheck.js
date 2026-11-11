/**
 * Allergy conflict detection engine.
 * IMPORTANT: This is a FLAGGING AID, not a safety guarantee.
 * It matches declared allergies against meal ingredients using synonym expansion
 * and word-aware matching to limit false positives.
 * A human must verify every meal before serving.
 */

const SYNONYM_MAP = {
  peanut: ['peanut', 'groundnut', 'arachis', 'satay'],
  dairy: ['milk', 'cheese', 'butter', 'ghee', 'paneer', 'cream', 'curd', 'yogurt', 'whey', 'casein', 'lactose'],
  milk: ['milk', 'cheese', 'butter', 'ghee', 'paneer', 'cream', 'curd', 'yogurt', 'whey', 'casein', 'lactose'],
  egg: ['egg', 'mayonnaise', 'albumin'],
  gluten: ['wheat', 'flour', 'maida', 'atta', 'semolina', 'rava', 'barley', 'rye', 'bread', 'gluten'],
  wheat: ['wheat', 'flour', 'maida', 'atta', 'semolina', 'rava', 'barley', 'rye', 'bread', 'gluten'],
  soy: ['soy', 'soya', 'tofu', 'edamame'],
  'tree nut': ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'anchovy', 'sardine'],
  sesame: ['sesame', 'tahini', 'til'],
  mustard: ['mustard'],
};

// Build reverse map: ingredient keyword -> list of canonical allergen names
const INGREDIENT_TO_ALLERGENS = {};
for (const [allergen, keywords] of Object.entries(SYNONYM_MAP)) {
  for (const kw of keywords) {
    if (!INGREDIENT_TO_ALLERGENS[kw]) INGREDIENT_TO_ALLERGENS[kw] = [];
    if (!INGREDIENT_TO_ALLERGENS[kw].includes(allergen)) {
      INGREDIENT_TO_ALLERGENS[kw].push(allergen);
    }
  }
}

/**
 * Word-aware match: does the text contain the keyword as a whole word?
 * Uses word boundary logic that avoids false positives from substrings.
 */
function wordMatch(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[^a-zA-Z])${escaped}(?:$|[^a-zA-Z])`, 'i');
  return re.test(text);
}

/**
 * Expand a declared allergen to all synonym keywords to search for.
 */
function expandAllergen(allergen) {
  const lower = allergen.toLowerCase().trim();
  if (SYNONYM_MAP[lower]) return [...SYNONYM_MAP[lower]];
  const results = new Set();
  for (const [, keywords] of Object.entries(SYNONYM_MAP)) {
    if (keywords.includes(lower)) {
      keywords.forEach(k => results.add(k));
    }
  }
  return results.size > 0 ? [...results] : [lower];
}

/**
 * Find conflicts between declared allergies and meal ingredients.
 * Returns array of { allergen, matchedIngredient }
 */
function findConflicts(allergies, ingredients) {
  if (!allergies || !ingredients || allergies.length === 0 || ingredients.length === 0) {
    return [];
  }

  const conflicts = [];
  const seen = new Set();

  for (const rawAllergen of allergies) {
    const allergen = rawAllergen.toLowerCase().trim();
    if (!allergen) continue;
    const keywords = expandAllergen(allergen);

    for (const rawIngredient of ingredients) {
      const ingredient = rawIngredient.toLowerCase().trim();
      if (!ingredient) continue;

      for (const keyword of keywords) {
        if (wordMatch(ingredient, keyword)) {
          const key = `${allergen}||${ingredient}`;
          if (!seen.has(key)) {
            seen.add(key);
            conflicts.push({ allergen, matchedIngredient: ingredient });
          }
          break;
        }
      }
    }
  }
  return conflicts;
}

/**
 * Rescan an entire event for allergy conflicts.
 * - Upserts pending flags for new conflicts
 * - Preserves verified/dismissed flags
 * - Removes pending flags that no longer match
 */
async function rescanEvent(eventId) {
  const Meal = require('../models/Meal');
  const Registration = require('../models/Registration');
  const AllergyFlag = require('../models/AllergyFlag');

  const [meals, registrations] = await Promise.all([
    Meal.find({ event: eventId }),
    Registration.find({ event: eventId })
  ]);

  const currentConflicts = new Map();

  for (const reg of registrations) {
    if (!reg.allergies || reg.allergies.length === 0) continue;
    for (const meal of meals) {
      const conflicts = findConflicts(reg.allergies, meal.ingredients);
      for (const { allergen, matchedIngredient } of conflicts) {
        const key = `${meal._id}||${reg._id}||${allergen}`;
        currentConflicts.set(key, {
          event: eventId,
          meal: meal._id,
          registration: reg._id,
          allergen,
          matchedIngredient
        });
      }
    }
  }

  const existingFlags = await AllergyFlag.find({ event: eventId });

  // Remove pending flags that no longer conflict
  for (const flag of existingFlags) {
    const key = `${flag.meal}||${flag.registration}||${flag.allergen}`;
    if (!currentConflicts.has(key) && flag.status === 'pending') {
      await AllergyFlag.findByIdAndDelete(flag._id);
    }
  }

  // Upsert new conflicts as pending (don't overwrite verified/dismissed)
  for (const [, conflict] of currentConflicts) {
    await AllergyFlag.findOneAndUpdate(
      { meal: conflict.meal, registration: conflict.registration, allergen: conflict.allergen },
      { $setOnInsert: { ...conflict, status: 'pending' } },
      { upsert: true, new: true }
    );
  }

  return await AllergyFlag.find({ event: eventId });
}

module.exports = { findConflicts, expandAllergen, wordMatch, rescanEvent, SYNONYM_MAP };
