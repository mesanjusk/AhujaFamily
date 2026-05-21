const mongoose = require('mongoose')

const dayColorSchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true },
  day: String,
  en: String,
  color: String,
  hex: String,
  name: String,
  god: String,
  outfits: [String],
  avoid: String,
})

module.exports = mongoose.model('DayColor', dayColorSchema)
