const express = require('express')
const router = express.Router()
const Member = require('../models/Member')
const Task = require('../models/Task')
const MealPlan = require('../models/MealPlan')
const WeeklyPlan = require('../models/WeeklyPlan')
const Mantra = require('../models/Mantra')
const OutfitTip = require('../models/OutfitTip')
const Extra = require('../models/Extra')
const seed = require('../data/seedData')

// GET all members
router.get('/', async (req, res) => {
  const members = await Member.find({})
  res.json(members)
})

// GET single member
router.get('/:id', async (req, res) => {
  const member = await Member.findOne({ id: req.params.id })
  if (!member) return res.status(404).json({ error: 'Member not found' })
  res.json(member)
})

// GET tasks for member
router.get('/:id/tasks', async (req, res) => {
  const tasks = await Task.find({ memberId: req.params.id }).sort({ order: 1 })
  res.json(tasks)
})

// POST add task
router.post('/:id/tasks', async (req, res) => {
  const count = await Task.countDocuments({ memberId: req.params.id })
  const task = await Task.create({ ...req.body, memberId: req.params.id, order: count + 1 })
  res.json(task)
})

// PUT update task
router.put('/:id/tasks/:taskId', async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true })
  res.json(task)
})

// DELETE task
router.delete('/:id/tasks/:taskId', async (req, res) => {
  await Task.findByIdAndDelete(req.params.taskId)
  res.json({ success: true })
})

// POST batch update tasks (for reorder / time change)
router.post('/:id/tasks/batch', async (req, res) => {
  const { tasks } = req.body
  await Promise.all(
    tasks.map(t => Task.findByIdAndUpdate(t._id, { time: t.time, order: t.order }, { new: true }))
  )
  res.json({ success: true })
})

// POST reset tasks to defaults
router.post('/:id/tasks/reset', async (req, res) => {
  const id = req.params.id
  await Task.deleteMany({ memberId: id })
  let defaultTasks = []
  if (id === 'sanju') defaultTasks = seed.sanjuTasks
  else if (id === 'kirti') defaultTasks = seed.kirtiTasks
  else if (id === 'mahi') defaultTasks = seed.mahiTasks
  const tasks = await Task.insertMany(defaultTasks.map(t => ({ ...t, memberId: id })))
  res.json(tasks)
})

// GET meals
router.get('/:id/meals', async (req, res) => {
  const meals = await MealPlan.find({ memberId: req.params.id }).sort({ dayIndex: 1 })
  res.json(meals)
})

// GET weekly plan
router.get('/:id/weekly', async (req, res) => {
  const weekly = await WeeklyPlan.find({ memberId: req.params.id }).sort({ dayIndex: 1 })
  res.json(weekly)
})

// GET mantras (pass ?type=mantra or ?type=remedy, default all)
router.get('/:id/mantras', async (req, res) => {
  const query = { memberId: req.params.id }
  if (req.query.type === 'mantra') query.isRemedy = false
  if (req.query.type === 'remedy') query.isRemedy = true
  const mantras = await Mantra.find(query).sort({ order: 1 })
  res.json(mantras)
})

// GET outfit tips
router.get('/:id/outfit-tips', async (req, res) => {
  const tips = await OutfitTip.find({ memberId: req.params.id }).sort({ dayIndex: 1 })
  res.json(tips)
})

// GET extras by type
router.get('/:id/extras/:type', async (req, res) => {
  const extras = await Extra.find({ memberId: req.params.id, type: req.params.type }).sort({ order: 1 })
  res.json(extras.map(e => e.data))
})

module.exports = router
