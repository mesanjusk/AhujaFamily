const express = require('express')
const router = express.Router()
const DayColor = require('../models/DayColor')

router.get('/', async (req, res) => {
  const colors = await DayColor.find({}).sort({ dayIndex: 1 })
  res.json(colors)
})

module.exports = router
