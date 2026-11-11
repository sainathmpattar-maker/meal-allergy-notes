const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dietaryPreference: {
    type: String,
    enum: ['none', 'vegetarian', 'vegan', 'halal', 'jain', 'other'],
    default: 'none'
  },
  allergies: [{ type: String, lowercase: true, trim: true }],
  note: { type: String, maxlength: 500, trim: true, default: '' }
}, { timestamps: true });

registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
