const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  emoji: String,
  sub: String,
  color: String,
  gradient: String,
  headerSub: String,
  headerSub2: String,
  rootBg: String,
  defaultDayStart: String,
  defaultDayEnd: String,
  celebTitle: String,
  celebMessage: String,
  celebButton: String,
  mealSubTitle: String,
  outfitNote: String,
  views: [String],
})

module.exports = mongoose.model('Member', memberSchema)
