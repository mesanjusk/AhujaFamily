const mongoose = require('mongoose')

const extraSchema = new mongoose.Schema({
  memberId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  order: { type: Number, default: 0 },
})

module.exports = mongoose.model('Extra', extraSchema)
