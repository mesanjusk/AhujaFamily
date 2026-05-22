const express = require('express')
const router = express.Router()
const CalendarEvent = require('../models/CalendarEvent')

router.get('/', async (req, res) => {
  const { memberId } = req.query
  const query = memberId
    ? { $or: [{ memberId: null }, { memberId }] }
    : {}
  const events = await CalendarEvent.find(query).sort({ date: 1 })
  res.json(events)
})

router.post('/', async (req, res) => {
  const { date, label } = req.body
  if (!date || !label) return res.status(400).json({ error: 'date and label required' })
  const event = await CalendarEvent.create({ date, label })
  res.json(event)
})

router.delete('/:id', async (req, res) => {
  await CalendarEvent.findByIdAndDelete(req.params.id)
  res.json({ success: true })
})

module.exports = router
