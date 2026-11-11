const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  ingredients: [{ type: String, lowercase: true, trim: true }]
}, { timestamps: true });

module.exports = mongoose.model('Meal', mealSchema);
