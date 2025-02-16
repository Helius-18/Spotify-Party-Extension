// content.js
var token = null;
var deviceId = null;
var roomName = "";
var socket = null;
var userName = null;

document.body.innerHTML += `<button id="joinRoom" style="
    position: absolute;
    bottom: 0;
    right: 0;
    margin-bottom: 12vh;
    margin-right: 4vh;
    padding: 1vh;
    border-radius: 10px;
    background-color: rgb(30, 50, 100);
    color: white;
    cursor: pointer;
    border: 0px;
    z-index: 2;
    font-size: 16px;
    display: none;
">Join Room</button>

<button id="chatButton" style="
    position: absolute;
    bottom: 0;
    right: 0;
    margin-bottom: 12vh;
    margin-right: 4vh;
    padding: 1vh;
    border-radius: 10px;
    background-color: rgb(30, 50, 100);
    color: white;
    cursor: pointer;
    border: 0px;
    z-index: 2;
    font-size: 16px;
    display: none;
    ">chat</button>

<div id="joinRoomModal" style="
    position: absolute;
    top: 40vh;
    z-index: 1;
    right: 50%;
    background-color: #1f1f1f;
    display: none;
    flex-direction: column;
    gap: 1vh;
    padding: 5vh;
    border-radius: 15px;
    align-items: center;
"><div id="closeModal" style="
    position: absolute;
    top: 0;
    right: 0;
    margin-right: 15px;
    margin-top: 10px;
    cursor: pointer;
">x</div>
    
    <input placeholder="Enter Room Name" id="roomName" style="
    padding: 10px;
    border-radius: 10px;
">
    <button id="joinRoomButton" style="
    padding: 1vh;
    border-radius: 10px;
    background-color: rgb(30, 50, 100);
    color: white;
    cursor: pointer;
    border: 0px;
    ">Join Room</button>
</div>


<div id="chatBox" style="
    position: absolute;
    z-index: 1;
    background-color: #1f1f1f;
    display: flex;
    flex-direction: column;
    gap: 1vh;
    border-radius: 15px;
    align-items: start;
    bottom: 0;
    right: 0;
    margin-bottom: 12vh;
    margin-right: 4vh;
    padding: 2vh;
    height: 40%;
    width: 30vh;
    display: none;
    ">
    <div>
        <div>Room Chat</div>
        <div id="closeChat" style="
    position: absolute;
    top: 0;
    right: 0;
    margin-right: 15px;
    margin-top: 10px;
    cursor: pointer;
">x</div>
    </div>
    <div id="messages" style="
    overflow: scroll;
    width: 100%;
    height: 85%;
">
    </div>
    <div style="
    position: fixed;
    bottom: 10px;
    width: 100%;
">
        <input id="chatInput" placeholder="Enter Message" style="
    padding: 1vh;
    border-radius: 10px;
">
        <button id="chatSend" style="
    margin-bottom: 12vh;
    margin-right: 4vh;
    padding: 1vh;
    border-radius: 10px;
    background-color: rgb(30, 50, 100);
    color: white;
    cursor: pointer;
    border: 0px;
">send</button>
    </div>
</div>
`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "deviceId") {
    console.log("Device Playing in :", message.details);
    deviceId = message.details;
  }
  if (message.type === "trackPlaying") {
    console.log("Track Playing :", message.details);
    if (deviceId && token) {
      playInRoom(message.details);
    }
  }
  if (message.token && token !== message.token) {
    token = message.token;
    console.log("Token :", token);
  }

  if (deviceId!=null && token!=null && (!socket || socket.readyState === WebSocket.CLOSED)) {
    document.getElementById("joinRoom").style.display = 'block'
  }
});

document.getElementById("joinRoom").addEventListener("click", () => {
  document.getElementById("joinRoomModal").style.display = "flex";
  document.getElementById("joinRoom").style.display = "none";
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("joinRoomModal").style.display = "none";
  document.getElementById("joinRoom").style.display = "block";
});

document.getElementById("chatButton").addEventListener("click", () => {
  document.getElementById("chatBox").style.display = "flex";
  document.getElementById("chatButton").style.display = "none";
});

document.getElementById("closeChat").addEventListener("click", () => {
  document.getElementById("chatBox").style.display = "none";
  document.getElementById("chatButton").style.display = "block";
});

function getUsername() {
  const imgElement = document.querySelector('figure[data-testid="user-widget-avatar"] img');

  const altText = imgElement ? imgElement.alt : Math.random().toString(36).substring(2, 2 + length);

  return altText;
}


document.getElementById("joinRoomButton").addEventListener("click", () => {
  const temp = document.getElementById("roomName").value.trim();
  if (temp !== "") {
    roomName = temp;
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      socket = new WebSocket("wss://presumably-daring-cobra.ngrok-free.app/");
      document.getElementById("joinRoomModal").style.display = "none";
    }

    socket.addEventListener("open", function () {
      console.log("Connected to the WebSocket server");
      document.getElementById("chatButton").style.display = "block";

      if (userName==null) {
        userName = getUsername();
      }

      socket.send(
        JSON.stringify({
          type: "room",
          displayName: userName,
          userId: userName,
          content: { room: roomName, type: "join" },
        })
      );
    });

    socket.addEventListener("message", function (event) {
      console.log("Message from server: ", JSON.parse(event.data));
      const message = JSON.parse(event.data);
      if (message['type'] == 'room' && message['content']['type'] == "message") {
        const messagesContainer = document.getElementById("messages");
        messagesContainer.innerHTML += `<div>${message['content']['from']} : ${message['content']['message']}<div>`;
      }

      if (message['type'] == 'song' && message['content']['type'] == "play") {
        console.log(message);
        makeApiCall(message['content']['song']);
      }
    });

    socket.addEventListener("error", function (event) {
      console.error("WebSocket Error: ", event);
      alert("Failed to connect to WebSocket server. Please try again.");
    });
  }
});

document.getElementById("chatSend").addEventListener("click", () => {
  const message = document.getElementById("chatInput").value.trim();

  if (userName==null) {
    userName = getUsername();
  }

  if (message!='') {
    socket.send(JSON.stringify({ type: 'room', displayName: userName, userId : userName, content: { room : roomName, type: 'message', message : message } }));
    document.getElementById("chatInput").value = '';
  }
});

window.addEventListener('beforeunload', function(event) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Send a custom "leave" message to the WebSocket server before the page is closed
    if (userName==null) {
      userName = getUsername();
    }

    socket.send(JSON.stringify({
      type: 'room',
      displayName: userName,
      userId: userName,
      content: {
        room: roomName,
        type: 'leave',
      }
    }));
  }
});

function playInRoom(trackPlaying) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Send a custom "leave" message to the WebSocket server before the page is closed
    if (userName==null) {
      userName = getUsername();
    }

    socket.send(JSON.stringify({
      type: 'song',
      displayName: userName,
      userId: userName,
      content: {
        room: roomName,
        song: trackPlaying,
        type: 'play',
      }
    }));
  }
}

// Function to make the API call
function makeApiCall(trackPlaying) {
  const url = `https://gae2-spclient.spotify.com/connect-state/v1/player/command/from/${deviceId}/to/${deviceId}`;
  const payload = {
    command: {
      context: {
        uri: `spotify:track:${trackPlaying}`,
        url: `context://spotify:track:${trackPlaying}`,
        metadata: {},
      },
      endpoint: "play",
    },
  };

  console.log(url, payload);
  

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Response data:", data);
    })
    .catch((error) => {
      console.error("Error making API call:", error);
      alert("Failed to communicate with the API. Please try again.");
    });
}


// socket.send(JSON.stringify({ type: 'room', displayName: 'Helius', userId : 'test', content: { room : 'room', type: 'join' } }));

// socket.send(JSON.stringify({ type: 'room', displayName: 'Helius', userId : 'test', content: { room : 'room', type: 'message', message : 'Hi babe' } }));
