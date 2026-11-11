const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const AllergyFlag = require('../models/AllergyFlag');
const { requireAuth, requireRole } = require('../middleware/auth');
const { rescanEvent } = require('../utils/allergyCheck');

const regValidation = [
  body('dietaryPreference')
    .optional()
    .isIn(['none', 'vegetarian', 'vegan', 'halal', 'jain', 'other'])
    .withMessage('Invalid dietary preference'),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('allergies.*')
    .optional()
    .isString().trim().notEmpty()
    .withMessage('Each allergy must be a non-empty string'),
  body('note')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Note must be 500 characters or fewer'),
];

// POST /api/events/:eventId/registrations — upsert own registration
router.post('/:eventId/registrations', requireAuth, regValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { dietaryPreference, allergies, note } = req.body;
    const updateData = {};
    if (dietaryPreference !== undefined) updateData.dietaryPreference = dietaryPreference;
    if (allergies !== undefined) updateData.allergies = allergies.map(a => a.toLowerCase().trim());
    if (note !== undefined) updateData.note = note;

    const registration = await Registration.findOneAndUpdate(
      { event: req.params.eventId, user: req.user._id },
      { ...updateData, event: req.params.eventId, user: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    await rescanEvent(req.params.eventId);
    res.status(200).json(registration);
  } catch (err) { next(err); }
});

// GET /api/registrations/mine — attendee's own registrations across all events
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user._id }).populate('event');
    res.json(registrations);
  } catch (err) { next(err); }
});

// GET /api/events/:eventId/registrations — organiser gets all, attendee gets own
router.get('/:eventId/registrations', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'organiser') {
      const registrations = await Registration.find({ event: req.params.eventId })
        .populate('user', 'name email');
      return res.json(registrations);
    }
    // Attendee: only their own
    const registration = await Registration.findOne({
      event: req.params.eventId,
      user: req.user._id
    });
    if (!registration) return res.json([]);
    res.json([registration]);
  } catch (err) { next(err); }
});

// DELETE /api/events/:eventId/registrations/mine — delete own registration
router.delete('/:eventId/registrations/mine', requireAuth, async (req, res, next) => {
  try {
    const registration = await Registration.findOneAndDelete({
      event: req.params.eventId,
      user: req.user._id
    });
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    await AllergyFlag.deleteMany({ registration: registration._id });
    res.json({ message: 'Registration deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
