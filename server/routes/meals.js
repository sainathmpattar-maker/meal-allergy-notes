const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Meal = require('../models/Meal');
const Event = require('../models/Event');
const AllergyFlag = require('../models/AllergyFlag');
const { requireAuth, requireRole } = require('../middleware/auth');
const { rescanEvent } = require('../utils/allergyCheck');

// GET /api/events/:eventId/meals
router.get('/:eventId/meals', requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const meals = await Meal.find({ event: req.params.eventId }).sort('name');
    res.json(meals);
  } catch (err) { next(err); }
});

const mealValidation = [
  body('name').trim().notEmpty().withMessage('Meal name is required'),
  body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
  body('ingredients.*').isString().trim().notEmpty().withMessage('Each ingredient must be a non-empty string'),
];

// POST /api/events/:eventId/meals (organiser only)
router.post('/:eventId/meals', requireAuth, requireRole('organiser'), mealValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const { name, description, ingredients } = req.body;
    const meal = await Meal.create({
      event: req.params.eventId,
      name,
      description: description || '',
      ingredients: ingredients.map(i => i.toLowerCase().trim())
    });
    await rescanEvent(req.params.eventId);
    res.status(201).json(meal);
  } catch (err) { next(err); }
});

// PUT /api/meals/:id (organiser only) — note: mounted at /api/meals
router.put('/:id', requireAuth, requireRole('organiser'), [
  body('name').optional().trim().notEmpty().withMessage('Meal name cannot be empty'),
  body('ingredients').optional().isArray({ min: 1 }).withMessage('At least one ingredient is required'),
  body('ingredients.*').optional().isString().trim().notEmpty().withMessage('Each ingredient must be a non-empty string'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    const { name, description, ingredients } = req.body;
    if (name !== undefined) meal.name = name;
    if (description !== undefined) meal.description = description;
    if (ingredients !== undefined) meal.ingredients = ingredients.map(i => i.toLowerCase().trim());
    await meal.save();
    await rescanEvent(meal.event.toString());
    res.json(meal);
  } catch (err) { next(err); }
});

// DELETE /api/meals/:id (organiser only)
router.delete('/:id', requireAuth, requireRole('organiser'), async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    await Meal.findByIdAndDelete(req.params.id);
    await AllergyFlag.deleteMany({ meal: req.params.id });
    res.json({ message: 'Meal deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
