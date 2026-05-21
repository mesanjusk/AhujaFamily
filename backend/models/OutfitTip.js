const mongoose = require('mongoose')

const outfitTipSchema = new mongoose.Schema({
  memberId: { type: String, required: true, index: true },
  dayIndex: { type: Number, required: true },
  tip: String,
})

module.exports = mongoose.model('OutfitTip', outfitTipSchema)
