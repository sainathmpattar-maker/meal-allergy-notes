const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AllergyFlag = require('../models/AllergyFlag');
const { requireAuth, requireRole } = require('../middleware/auth');
const { rescanEvent } = require('../utils/allergyCheck');

// POST /api/events/:eventId/flags/run — rescan event for allergy conflicts
router.post('/events/:eventId/flags/run', requireAuth, requireRole('organiser'), async (req, res, next) => {
  try {
    await rescanEvent(req.params.eventId);
    const flags = await AllergyFlag.find({ event: req.params.eventId })
      .populate('meal', 'name ingredients')
      .populate({
        path: 'registration',
        select: 'allergies dietaryPreference user',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.json({ message: 'Allergy check complete', count: flags.length, flags });
  } catch (err) { next(err); }
});

// GET /api/events/:eventId/flags — get all flags for event (populated)
router.get('/events/:eventId/flags', requireAuth, requireRole('organiser'), async (req, res, next) => {
  try {
    const flags = await AllergyFlag.find({ event: req.params.eventId })
      .populate('meal', 'name ingredients')
      .populate({
        path: 'registration',
        select: 'allergies dietaryPreference user',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.json(flags);
  } catch (err) { next(err); }
});

// PATCH /api/flags/:id — update flag status (verified or dismissed)
router.patch('/flags/:id', requireAuth, requireRole('organiser'), [
  body('status').isIn(['verified', 'dismissed']).withMessage('Status must be verified or dismissed'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const flag = await AllergyFlag.findById(req.params.id);
    if (!flag) return res.status(404).json({ message: 'Flag not found' });

    flag.status = req.body.status;
    flag.reviewedBy = req.user._id;
    flag.reviewedAt = new Date();
    await flag.save();

    const populated = await AllergyFlag.findById(flag._id)
      .populate('meal', 'name ingredients')
      .populate({
        path: 'registration',
        select: 'allergies dietaryPreference user',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('reviewedBy', 'name');
    res.json(populated);
  } catch (err) { next(err); }
});

module.exports = router;
