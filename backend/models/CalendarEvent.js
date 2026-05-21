const mongoose = require('mongoose')

const calEventSchema = new mongoose.Schema({
  date: { type: String, required: true },
  label: { type: String, required: true },
})

module.exports = mongoose.model('CalendarEvent', calEventSchema)
