require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
const mongoose = require('mongoose')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys')

const app = express()
const server = http.createServer(app)

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.SOCKET_IO_CORS_ORIGIN,
  'https://ahuja-family.vercel.app',
  'https://frontend-green-nu-45.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

function corsOrigin(origin, cb) {
  if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
    cb(null, true)
  } else {
    cb(new Error('CORS: origin not allowed — ' + origin))
  }
}

const io = socketIo(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
})

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

// MongoDB connection + auto-seed on first run
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected')
    const Member = require('./models/Member')
    const count = await Member.countDocuments()
    if (count === 0) {
      console.log('Empty database — running seed...')
      const { runSeed } = require('./seed')
      await runSeed()
      console.log('Seed complete')
    }
  })
  .catch(err => console.error('MongoDB error:', err))

// API Routes
app.use('/api/members', require('./routes/members'))
app.use('/api/calendar', require('./routes/calendar'))
app.use('/api/daycolors', require('./routes/daycolors'))

// WhatsApp Message API
const AUTH_FOLDER = path.join(__dirname, 'auth')
let sock

app.post('/api/send-message', async (req, res) => {
  const { number, message } = req.body
  if (!number || !message)
    return res.status(400).json({ error: 'Number and message required' })
  try {
    await sock.sendMessage(number + '@s.whatsapp.net', { text: message })
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to send:', err)
    res.status(500).json({ error: 'Sending failed' })
  }
})

const startWhatsApp = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
    sock = makeWASocket({ auth: state })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', ({ connection, qr }) => {
      if (qr) io.emit('qr', qr)
      if (connection === 'close') {
        const shouldReconnect =
          sock?.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) startWhatsApp()
      }
    })
    io.on('connection', socket => {
      console.log('Socket connected')
      socket.on('send-message', async ({ number, message }) => {
        await sock.sendMessage(number + '@s.whatsapp.net', { text: message })
      })
    })
  } catch (err) {
    console.error('WhatsApp init error:', err)
  }
}

startWhatsApp()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
