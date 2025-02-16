chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      // Send the network request details to the content script
      if (details.url.includes("operationName=areEntitiesInLibrary")) {
  
        const regex = /spotify%3Atrack%3A([a-zA-Z0-9]+)/;
        const match = details.url.match(regex);
  
        if (match) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "trackPlaying",
              details: match[1],
            });
          });
        }
  
      } else if (details.url.includes("connect-state/v1/player/command/from")) {
        // Send the network request details to the content script
  
        const regex = /to\/([a-f0-9]{40})/;
        const match = details.url.match(regex);
        extractedValue = "";
  
        if (match) {
          extractedValue = match[1];
        } else {
          console.log("No match found");
        }
  
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "deviceId",
            details: extractedValue,
          });
        });
        
      }
    },
    { urls: ["http://*/*", "https://*/*"] } // Monitor all URLs
  );

  




  // content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "deviceId") {
      console.log("Device Playing in :", message.details);
    }
    if (message.type === "trackPlaying") {
        console.log("Track Playing :", message.details);
      }
  });
  