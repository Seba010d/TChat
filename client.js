const net = require("net");
const dgram = require("dgram");
const readline = require("readline");

const { draw, drawLogin } = require("./ui");
const { setTheme } = require("./colors");

let username = "";
let input = "";
let messages = [];
let userColors = {};
let waitingForAdminPassword = false;
let waitingForUsername = false;
const settings = {
  timestamps: true,
  theme: "classic",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function addMessage(text) {
  messages.push({
    text,
    receivedAt: new Date(),
  });
}

function handleLocalCommand(command) {
  if (command === "/settings") {
    addMessage(`Settings: timestamps ${settings.timestamps ? "on" : "off"}, theme ${settings.theme}.`);
    addMessage("Use /timestamps on|off or /theme classic|ocean|forest.");
    return true;
  }

  if (command === "/timestamps" || command.startsWith("/timestamps ")) {
    const value = command.slice("/timestamps".length).trim().toLowerCase();

    if (value !== "on" && value !== "off") {
      addMessage("Usage: /timestamps on|off");
      return true;
    }

    settings.timestamps = value === "on";
    addMessage(`Timestamps turned ${value}.`);
    return true;
  }

  if (command === "/theme" || command.startsWith("/theme ")) {
    const themeName = command.slice("/theme".length).trim().toLowerCase();

    if (!setTheme(themeName)) {
      addMessage("Usage: /theme classic|ocean|forest");
      return true;
    }

    settings.theme = themeName;
    addMessage(`Theme changed to ${themeName}.`);
    return true;
  }

  return false;
}

function drawChat() {
  draw(messages, input, username, userColors, settings);
}

function discoverServer(callback) {
  const discoverySocket = dgram.createSocket("udp4");
  let finished = false;
  let timeout;

  function finish(host) {
    if (finished) {
      return;
    }

    finished = true;
    clearTimeout(timeout);

    try {
      discoverySocket.close();
    } catch {}

    callback(host);
  }

  discoverySocket.on("message", (message, remote) => {
    if (message.toString() === "TCHAT_SERVER") {
      finish(remote.address);
    }
  });

  discoverySocket.on("error", () => finish("localhost"));

  timeout = setTimeout(() => finish("localhost"), 2500);

  discoverySocket.bind(0, () => {
    discoverySocket.setBroadcast(true);
    discoverySocket.send(Buffer.from("TCHAT_DISCOVER"), 3001, "255.255.255.255", (error) => {
      if (error) {
        finish("localhost");
      }
    });
  });
}

drawLogin();

rl.question("", (name) => {
  username = name.trim();
  let handleInput;

  discoverServer((serverHost) => {
    const client = net.createConnection(
      {
        host: serverHost,
        port: 3000,
      },
      () => {
        client.write(`USERNAME:${username}\n`);

        process.stdin.setRawMode(true);
        process.stdin.resume();

        handleInput = (key) => {
          const keyValue = key.toString();

          if (keyValue === "\u0003") {
            process.stdin.setRawMode(false);
            client.end();
            process.exit();
          }

          if (keyValue === "\r" || keyValue === "\n") {
            const command = input.trim();

            if (!command) {
              return;
            }

            if (command === "/quit") {
              process.stdin.setRawMode(false);
              client.end();
              process.exit();
            }

            input = "";

            if (handleLocalCommand(command)) {
              drawChat();
              return;
            }

            client.write(command + "\n");
            drawChat();
            return;
          }

          if (keyValue === "\u007f") {
            input = input.slice(0, -1);
            drawChat();
            return;
          }

          input += keyValue;
          drawChat();
        };

        process.stdin.on("data", handleInput);
        drawChat();
      },
    );

    client.on("data", (data) => {
      const newMessages = data
        .toString()
        .trim()
        .split("\n")
        .filter((message) => message !== "");

      newMessages.forEach((message) => {
        if (waitingForUsername && message.startsWith("Welcome, ")) {
          waitingForUsername = false;
        }

        if (message.startsWith("USER_COLOR:")) {
          const parts = message.split(":");
          const user = parts[1];
          const rgb = parts[2].split(",");

          userColors[user] = {
            red: Number(rgb[0]),
            green: Number(rgb[1]),
            blue: Number(rgb[2]),
          };

          return;
        }

        if (message === "ADMIN_PASSWORD_REQUIRED") {
          waitingForAdminPassword = true;
          input = "";
          process.stdin.removeListener("data", handleInput);
          process.stdin.setRawMode(false);

          console.log("");
          console.log("Admin adgangskode:");

          rl.question("> ", (password) => {
            waitingForAdminPassword = false;
            input = "";

            client.write(`ADMIN_PASSWORD:${password}\n`);
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on("data", handleInput);

            drawChat();
          });

          return;
        }

        if (message === "ADMIN_LOGIN_SUCCESS") {
          addMessage("You are now logged in as ADMIN.");
          return;
        }

        if (message === "ADMIN_LOGIN_FAILED") {
          addMessage("Incorrect admin password.");
          return;
        }

        if (message === "CLEAR_CHAT") {
          messages = [];
          return;
        }

        if (message.startsWith("AUTH_FAILED:")) {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", handleInput);
          waitingForUsername = true;
          messages = [];
          userColors = {};
          drawLogin(message.replace("AUTH_FAILED:", ""));

          rl.question("", (retryName) => {
            username = retryName.trim();
            client.write(`USERNAME:${username}\n`);
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on("data", handleInput);
          });

          return;
        }

        addMessage(message);
      });

      if (!waitingForAdminPassword && !waitingForUsername) {
        drawChat();
      }
    });

    client.on("end", () => {
      process.stdin.setRawMode(false);

      console.log("");
      console.log("Disconnected from TChat.");

      process.exit();
    });
  });
});
