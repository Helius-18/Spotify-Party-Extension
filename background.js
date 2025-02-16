chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    // Loop through request headers to find the Authorization header
    const headers = details.requestHeaders;
    let bearerToken = null;
    let deviceId = null;
    let checkForTrack = false;

    // Search for the Authorization header
    headers.forEach((header) => {
      if (header.name.toLowerCase() === "authorization") {
        bearerToken = header.value;
      }
    });

    if (details.url.includes("operationName=areEntitiesInLibrary") && checkForTrack) {
      const regex = /spotify%3Atrack%3A([a-zA-Z0-9]+)/;
      const match = details.url.match(regex);

      if (match) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "trackPlaying",
            details: match[1],
            token: bearerToken,
          });
        });
      }
    } 
    
    if (details.url.includes("/volume")) {
      const regex = /\/devices\/([a-f0-9]{40})\//;
      const match = details.url.match(regex);

      if (match) {
        deviceId = match[1];

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "deviceId",
            details: deviceId,
            token: bearerToken,
          });
        });
      }
    }
  },
  {
    urls: ["http://*/*", "https://*/*"], // Monitor all URLs
  },
  ["requestHeaders"]
);
