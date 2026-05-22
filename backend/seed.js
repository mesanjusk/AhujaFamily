require('dotenv').config()
const mongoose = require('mongoose')
const Member = require('./models/Member')
const Task = require('./models/Task')
const CalendarEvent = require('./models/CalendarEvent')
const MealPlan = require('./models/MealPlan')
const WeeklyPlan = require('./models/WeeklyPlan')
const Mantra = require('./models/Mantra')
const DayColor = require('./models/DayColor')
const OutfitTip = require('./models/OutfitTip')
const Extra = require('./models/Extra')
const seed = require('./data/seedData')

async function runSeed() {
  await Promise.all([
    Member.deleteMany({}),
    Task.deleteMany({}),
    CalendarEvent.deleteMany({}),
    MealPlan.deleteMany({}),
    WeeklyPlan.deleteMany({}),
    Mantra.deleteMany({}),
    DayColor.deleteMany({}),
    OutfitTip.deleteMany({}),
    Extra.deleteMany({}),
  ])

  await Member.insertMany(seed.members)
  await CalendarEvent.insertMany(seed.calendarEvents)
  await DayColor.insertMany(seed.dayColors)

  await Task.insertMany(seed.sanjuTasks.map(t => ({ ...t, memberId: 'sanju' })))
  await MealPlan.insertMany(seed.sanjuMeals.map(m => ({ ...m, memberId: 'sanju' })))
  await WeeklyPlan.insertMany(seed.sanjuWeekly.map(w => ({ ...w, memberId: 'sanju' })))
  await Mantra.insertMany(seed.sanjuMantras.map(m => ({ ...m, memberId: 'sanju' })))
  await OutfitTip.insertMany(seed.sanjuOutfitTips.map(o => ({ ...o, memberId: 'sanju' })))
  await Extra.insertMany(seed.sanjuExtras.map(e => ({ ...e, memberId: 'sanju' })))

  await Task.insertMany(seed.kirtiTasks.map(t => ({ ...t, memberId: 'kirti' })))
  await MealPlan.insertMany(seed.kirtiMeals.map(m => ({ ...m, memberId: 'kirti' })))
  await WeeklyPlan.insertMany(seed.kirtiWeekly.map(w => ({ ...w, memberId: 'kirti' })))
  await Mantra.insertMany(seed.kirtiMantras.map(m => ({ ...m, memberId: 'kirti' })))
  await OutfitTip.insertMany(seed.kirtiOutfitTips.map(o => ({ ...o, memberId: 'kirti' })))
  await Extra.insertMany(seed.kirtiExtras.map(e => ({ ...e, memberId: 'kirti' })))

  await Task.insertMany(seed.mahiTasks.map(t => ({ ...t, memberId: 'mahi' })))
  await MealPlan.insertMany(seed.mahiMeals.map(m => ({ ...m, memberId: 'mahi' })))
  await WeeklyPlan.insertMany(seed.mahiWeekly.map(w => ({ ...w, memberId: 'mahi' })))
  await Mantra.insertMany(seed.mahiMantras.map(m => ({ ...m, memberId: 'mahi' })))
  await OutfitTip.insertMany(seed.mahiOutfitTips.map(o => ({ ...o, memberId: 'mahi' })))
  await Extra.insertMany(seed.mahiExtras.map(e => ({ ...e, memberId: 'mahi' })))
}

module.exports = { runSeed }

// Run directly if called as script
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB')
      await runSeed()
      console.log('Seeded all data successfully!')
      await mongoose.disconnect()
    })
    .catch(err => { console.error(err); process.exit(1) })
}
