const mongoose = require('mongoose')

const mealSchema = new mongoose.Schema({
  memberId: { type: String, required: true, index: true },
  dayIndex: Number,
  day: String,
  breakfast: String,
  lunch: String,
  dinner: String,
  tip: String,
})

module.exports = mongoose.model('MealPlan', mealSchema)
