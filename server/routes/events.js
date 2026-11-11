const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { requireAuth, requireRole } = require('../middleware/auth');

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
];

// GET /api/events
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email').sort('-date');
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
});

// POST /api/events (organiser only)
router.post('/', requireAuth, requireRole('organiser'), eventValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { title, date, location } = req.body;
    const event = await Event.create({ title, date, location, createdBy: req.user._id });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// PUT /api/events/:id (organiser only)
router.put('/:id', requireAuth, requireRole('organiser'), eventValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { title, date, location } = req.body;
    const event = await Event.findByIdAndUpdate(req.params.id, { title, date, location }, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id (organiser only)
router.delete('/:id', requireAuth, requireRole('organiser'), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
