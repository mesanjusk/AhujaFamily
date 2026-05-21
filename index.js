const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const AUTH_FOLDER = path.join(__dirname, "auth");
let sock;

// Message Sender API
app.post("/api/send-message", async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message)
    return res.status(400).json({ error: "Number and message required" });
  try {
    await sock.sendMessage(number + "@s.whatsapp.net", { text: message });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send:", err);
    res.status(500).json({ error: "Sending failed" });
  }
});

const startWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) io.emit("qr", qr);
    if (connection === "close") {
      const shouldReconnect =
        sock?.lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) startWhatsApp();
    }
  });

  io.on("connection", (socket) => {
    console.log("⚡ Socket Connected");
    socket.on("send-message", async ({ number, message }) => {
      await sock.sendMessage(number + "@s.whatsapp.net", { text: message });
    });
  });
};

startWhatsApp();

server.listen(5000, () => {
  console.log("📦 Backend running on http://localhost:5000");
});
