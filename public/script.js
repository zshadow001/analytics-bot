window.addEventListener("load", async () => {

  const startTime = Date.now();

  const scriptTag = document.querySelector(
    "script[data-tracking-id]"
  );

  if (!scriptTag) return;

  const trackingId = scriptTag.dataset.trackingId;
  const serverUrl = scriptTag.dataset.serverUrl;

  if (!trackingId || !serverUrl) return;

  // Wait few seconds
  setTimeout(async () => {

    const duration =
      Math.floor((Date.now() - startTime) / 1000);

    const data = {
      trackingId,

      browser: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,

      screen:
        `${screen.width}x${screen.height}`,

      timezone:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone,

      sessionDuration:
        `${duration} sec`
    };

    // Pretty Format
    const pretty = `
📊 VISITOR ANALYTICS

🌐 Browser:
${data.browser}

🖥 Screen:
${data.screen}

🌍 Language:
${data.language}

💻 Platform:
${data.platform}

🕒 Timezone:
${data.timezone}

⏳ Session:
${data.sessionDuration}
`;

    try {

      await fetch(`${serverUrl}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          trackingId,
          pretty
        })
      });

    } catch (e) {
      console.log(e);
    }

  }, 3000);

});
