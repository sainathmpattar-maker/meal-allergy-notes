const { findConflicts, expandAllergen, wordMatch } = require('../utils/allergyCheck');

describe('wordMatch', () => {
  test('matches whole word at start', () => {
    expect(wordMatch('milk powder', 'milk')).toBe(true);
  });

  test('matches whole word at end', () => {
    expect(wordMatch('whole milk', 'milk')).toBe(true);
  });

  test('matches exact single word', () => {
    expect(wordMatch('milk', 'milk')).toBe(true);
  });

  test('does not match partial word - suffix', () => {
    expect(wordMatch('milkshake', 'milk')).toBe(false);
  });

  test('does not match partial word - prefix', () => {
    expect(wordMatch('buttermilk', 'milk')).toBe(false);
  });

  test('is case insensitive', () => {
    expect(wordMatch('Milk Powder', 'milk')).toBe(true);
  });

  test('matches multi-word keyword', () => {
    expect(wordMatch('contains satay sauce', 'satay')).toBe(true);
  });

  test('matches word with comma separator', () => {
    expect(wordMatch('salt,milk,sugar', 'milk')).toBe(true);
  });
});

describe('expandAllergen', () => {
  test('expands dairy to include milk, paneer, butter, etc.', () => {
    const expanded = expandAllergen('dairy');
    expect(expanded).toContain('milk');
    expect(expanded).toContain('paneer');
    expect(expanded).toContain('butter');
    expect(expanded).toContain('ghee');
    expect(expanded).toContain('cream');
  });

  test('expands peanut to include groundnut and satay', () => {
    const expanded = expandAllergen('peanut');
    expect(expanded).toContain('groundnut');
    expect(expanded).toContain('satay');
  });

  test('expands gluten to include wheat, flour, maida, etc.', () => {
    const expanded = expandAllergen('gluten');
    expect(expanded).toContain('wheat');
    expect(expanded).toContain('flour');
    expect(expanded).toContain('maida');
  });

  test('expands tree nut to include almond, cashew, walnut', () => {
    const expanded = expandAllergen('tree nut');
    expect(expanded).toContain('almond');
    expect(expanded).toContain('cashew');
    expect(expanded).toContain('walnut');
  });

  test('expands a known synonym backwards to all keywords', () => {
    const expanded = expandAllergen('cheese');
    expect(expanded).toContain('milk');
    expect(expanded).toContain('paneer');
  });

  test('unknown allergen returns itself', () => {
    expect(expandAllergen('kiwi')).toEqual(['kiwi']);
  });
});

describe('findConflicts', () => {
  test('detects dairy conflict with paneer', () => {
    const result = findConflicts(['dairy'], ['tomato', 'paneer', 'spices']);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ allergen: 'dairy', matchedIngredient: 'paneer' });
  });

  test('detects multiple dairy conflicts', () => {
    const result = findConflicts(['dairy'], ['paneer', 'butter', 'cream']);
    expect(result).toHaveLength(3);
  });

  test('detects peanut conflict via satay sauce', () => {
    const result = findConflicts(['peanut'], ['noodles', 'satay sauce', 'vegetables']);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].allergen).toBe('peanut');
  });

  test('detects peanut conflict via groundnut', () => {
    const result = findConflicts(['peanut'], ['groundnut oil', 'salt']);
    expect(result).toHaveLength(1);
    expect(result[0].matchedIngredient).toBe('groundnut oil');
  });

  test('no false positive for partial words', () => {
    const result = findConflicts(['dairy'], ['milkshake']);
    expect(result).toHaveLength(0);
  });

  test('no conflict when ingredients are safe', () => {
    const result = findConflicts(['peanut'], ['tomato', 'onion', 'spices']);
    expect(result).toHaveLength(0);
  });

  test('handles multiple allergens', () => {
    const result = findConflicts(['egg', 'gluten'], ['egg', 'wheat flour', 'vegetables']);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  test('handles empty allergies', () => {
    expect(findConflicts([], ['milk', 'egg'])).toHaveLength(0);
  });

  test('handles empty ingredients', () => {
    expect(findConflicts(['dairy'], [])).toHaveLength(0);
  });

  test('handles null inputs', () => {
    expect(findConflicts(null, ['milk'])).toHaveLength(0);
    expect(findConflicts(['dairy'], null)).toHaveLength(0);
  });

  test('deduplicates same allergen-ingredient pair', () => {
    const result = findConflicts(['peanut', 'peanut'], ['peanut butter']);
    expect(result).toHaveLength(1);
  });

  test('detects tree nut conflict with cashew', () => {
    const result = findConflicts(['tree nut'], ['cashew', 'rice']);
    expect(result).toHaveLength(1);
    expect(result[0].matchedIngredient).toBe('cashew');
  });

  test('real scenario: Paneer Butter Masala vs dairy+tree nut allergy', () => {
    const result = findConflicts(
      ['dairy', 'tree nut'],
      ['paneer', 'butter', 'tomato', 'cream', 'cashew', 'spices']
    );
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  test('egg in egg fried rice', () => {
    const result = findConflicts(['egg'], ['rice', 'egg', 'soy sauce', 'spring onion', 'sesame oil']);
    expect(result).toHaveLength(1);
    expect(result[0].matchedIngredient).toBe('egg');
  });

  test('gluten in wheat flour noodles', () => {
    const result = findConflicts(['gluten'], ['noodles', 'wheat flour', 'satay sauce']);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('detects regional synonyms: dahi for dairy, maida for gluten, and prawns for shellfish', () => {
    const dairyResult = findConflicts(['dairy'], ['spiced dahi raita']);
    expect(dairyResult).toHaveLength(1);
    expect(dairyResult[0].matchedIngredient).toBe('spiced dahi raita');

    const glutenResult = findConflicts(['gluten'], ['deep fried maida puri']);
    expect(glutenResult).toHaveLength(1);

    const shellfishResult = findConflicts(['shellfish'], ['grilled garlic prawns']);
    expect(shellfishResult).toHaveLength(1);
  });
});
