const mongoose = require('mongoose');

const allergyFlagSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  allergen: { type: String, required: true, lowercase: true, trim: true },
  matchedIngredient: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['pending', 'verified', 'dismissed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

allergyFlagSchema.index({ meal: 1, registration: 1, allergen: 1 }, { unique: true });

module.exports = mongoose.model('AllergyFlag', allergyFlagSchema);
