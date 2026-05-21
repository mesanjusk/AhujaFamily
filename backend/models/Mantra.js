const mongoose = require('mongoose')

const mantraSchema = new mongoose.Schema({
  memberId: { type: String, required: true, index: true },
  when: String,
  mantra: String,
  benefit: String,
  color: String,
  isRemedy: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
})

module.exports = mongoose.model('Mantra', mantraSchema)
