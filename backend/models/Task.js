const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  memberId: { type: String, required: true, index: true },
  section: { type: String, required: true },
  time: String,
  task: { type: String, required: true },
  tags: [String],
  pinned: { type: Boolean, default: false },
  skippable: { type: Boolean, default: true },
  highImpact: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
})

module.exports = mongoose.model('Task', taskSchema)
