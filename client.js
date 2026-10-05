const net = require("net");

const { draw } = require("./ui");

const { colorMessage } = require("./colors");

const HOST = "192.168.0.14";
const PORT = 3000;

const socket = new net.Socket();

let username = "";
let input = "";
let messages = [];
let userColors = {};
let loggedIn = false;
let waitingForUsername = false;
let buffer = "";

function render() {
  draw(messages, input, username, userColors, waitingForUsername);
}

function addMessage(message) {
  messages.push(message);

  if (messages.length > 100) {
    messages.shift();
  }

  render();
}

socket.setEncoding("utf8");

socket.connect(PORT, HOST, () => {
  render();
});

socket.on("data", (data) => {
  buffer += data;

  const lines = buffer.split("\n");

  buffer = lines.pop() || "";

  lines.forEach((line) => {
    const message = line.trim();

    if (!message) {
      return;
    }

    if (message === "USERNAME:") {
      waitingForUsername = true;

      input = "";

      render();

      return;
    }

    if (message.startsWith("WELCOME:")) {
      loggedIn = true;
      waitingForUsername = false;

      username = message.substring(8);

      input = "";

      render();

      return;
    }

    if (message.startsWith("USER_COLOR:")) {
      const parts = message.split(":");

      const name = parts[1];

      const color = parts[2];

      userColors[name] = color;

      render();

      return;
    }

    if (message.startsWith("CLEAR_CHAT")) {
      messages = [];

      render();

      return;
    }

    if (message.startsWith("PONG:")) {
      const sent = Number(message.substring(5));

      const ping = Date.now() - sent;

      addMessage(`SERVER: Ping: ${ping}ms`);

      return;
    }

    if (message.startsWith("HISTORY:")) {
      addMessage(message.substring(8));

      return;
    }

    addMessage(message);
  });
});

socket.on("close", () => {
  console.log("\nDisconnected from TChat.");

  process.exit(0);
});

socket.on("error", (error) => {
  console.log(`\nConnection error: ${error.message}`);
});

process.stdin.setRawMode(true);

process.stdin.resume();

process.stdin.on("data", (key) => {
  const value = key.toString();

  if (value === "\u0003") {
    socket.end();

    return;
  }

  if (value === "\r" || value === "\n") {
    const text = input.trim();

    if (!text) {
      return;
    }

    socket.write(text + "\n");

    input = "";

    render();

    return;
  }

  if (value === "\u007f") {
    input = input.slice(0, -1);

    render();

    return;
  }

  if (value.length === 1 && value >= " ") {
    input += value;

    render();
  }
});

render();
