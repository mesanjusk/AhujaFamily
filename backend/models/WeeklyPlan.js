const mongoose = require('mongoose')

const weeklySchema = new mongoose.Schema({
  memberId: { type: String, required: true, index: true },
  dayIndex: Number,
  day: String,
  focus: String,
  color: String,
  mantra: String,
  remedy: String,
  special: String,
  tip: String,
})

module.exports = mongoose.model('WeeklyPlan', weeklySchema)
