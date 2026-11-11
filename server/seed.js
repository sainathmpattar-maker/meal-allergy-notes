const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Meal = require('./models/Meal');
const Registration = require('./models/Registration');
const AllergyFlag = require('./models/AllergyFlag');
const { findConflicts } = require('./utils/allergyCheck');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Meal.deleteMany({}),
    Registration.deleteMany({}),
    AllergyFlag.deleteMany({})
  ]);
  console.log('Cleared all collections');

  const hash = await bcrypt.hash('Password123', 12);

  // Create users
  const organiser = await User.create({
    name: 'Event Organiser',
    email: 'organiser@test.com',
    passwordHash: hash,
    role: 'organiser'
  });

  const attendees = await User.insertMany([
    { name: 'Alice Patel', email: 'attendee1@test.com', passwordHash: hash, role: 'attendee' },
    { name: 'Bob Singh', email: 'attendee2@test.com', passwordHash: hash, role: 'attendee' },
    { name: 'Carol Chen', email: 'attendee3@test.com', passwordHash: hash, role: 'attendee' },
  ]);
  const [a1, a2, a3] = attendees;
  console.log('Created 4 users');

  // Create event
  const event = await Event.create({
    title: 'Annual Tech Conference 2024',
    date: new Date('2024-12-15T09:00:00Z'),
    location: 'Mumbai Convention Centre',
    createdBy: organiser._id
  });
  console.log('Created event:', event.title);

  // Create 5 realistic meals
  const meals = await Meal.insertMany([
    {
      event: event._id,
      name: 'Paneer Butter Masala',
      description: 'Creamy cottage cheese curry with rich tomato-butter gravy',
      ingredients: ['paneer', 'butter', 'tomato', 'cream', 'cashew', 'spices', 'onion', 'garlic']
    },
    {
      event: event._id,
      name: 'Peanut Satay Noodles',
      description: 'Asian stir-fried noodles with peanut satay sauce',
      ingredients: ['noodles', 'wheat flour', 'satay sauce', 'groundnut', 'soy sauce', 'vegetables', 'sesame oil']
    },
    {
      event: event._id,
      name: 'Veg Biryani',
      description: 'Fragrant basmati rice layered with spiced vegetables',
      ingredients: ['basmati rice', 'onion', 'tomato', 'spices', 'ghee', 'mint', 'coriander', 'saffron']
    },
    {
      event: event._id,
      name: 'Egg Fried Rice',
      description: 'Wok-tossed rice with scrambled egg and vegetables',
      ingredients: ['rice', 'egg', 'soy sauce', 'spring onion', 'sesame oil', 'garlic', 'ginger']
    },
    {
      event: event._id,
      name: 'Fruit Custard',
      description: 'Chilled mixed fruit in vanilla custard',
      ingredients: ['milk', 'custard powder', 'sugar', 'mixed fruits', 'cream', 'vanilla']
    },
  ]);
  console.log('Created', meals.length, 'meals');

  // Create registrations with known allergy conflicts
  const registrations = await Registration.insertMany([
    {
      event: event._id,
      user: a1._id,
      dietaryPreference: 'vegetarian',
      allergies: ['dairy', 'tree nut'],
      note: 'Severely allergic to all dairy products and tree nuts. Please ensure no cross-contamination.'
    },
    {
      event: event._id,
      user: a2._id,
      dietaryPreference: 'none',
      allergies: ['peanut', 'gluten', 'egg'],
      note: 'Peanut allergy is life-threatening. Carry an EpiPen at all times.'
    },
    {
      event: event._id,
      user: a3._id,
      dietaryPreference: 'vegan',
      allergies: ['egg', 'dairy'],
      note: 'Vegan diet - no animal products. Also allergic to eggs and all dairy.'
    },
  ]);
  console.log('Created', registrations.length, 'registrations');

  // Run conflict check and create flags
  let flagCount = 0;
  for (const reg of registrations) {
    for (const meal of meals) {
      const conflicts = findConflicts(reg.allergies, meal.ingredients);
      for (const { allergen, matchedIngredient } of conflicts) {
        try {
          await AllergyFlag.create({
            event: event._id,
            meal: meal._id,
            registration: reg._id,
            allergen,
            matchedIngredient,
            status: 'pending'
          });
          flagCount++;
        } catch (e) {
          if (e.code !== 11000) throw e;
        }
      }
    }
  }

  console.log('\n--- Seed Complete ---');
  console.log('Flags created:', flagCount);
  console.log('\nTest credentials (all use password: Password123):');
  console.log('  Organiser: organiser@test.com');
  console.log('  Attendee 1: attendee1@test.com (dairy, tree nut allergies)');
  console.log('  Attendee 2: attendee2@test.com (peanut, gluten, egg allergies)');
  console.log('  Attendee 3: attendee3@test.com (egg, dairy allergies)');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
