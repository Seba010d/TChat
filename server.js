const net = require("net");
const readline = require("readline");

const { createUser, findUser, removeUser, isUsernameTaken } = require("./users");

const { handleCommand } = require("./commands");

const { isAdmin, isAdminCommand, handleAdminCommand } = require("./admin");

const { handleServerCommand } = require("./serverCommands");

const clients = [];

function getTime() {
  return new Date().toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function serverLog(message) {
  console.log(`[${getTime()}] ${message}`);
}

function getUserColor() {
  const hue = (clients.length * 137.5) % 360;

  const saturation = 75;
  const lightness = 60;

  const c = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);

  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));

  const m = lightness / 100 - c / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = c;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = c;
  } else if (hue < 180) {
    green = c;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = c;
  } else if (hue < 300) {
    red = x;
    blue = c;
  } else {
    red = c;
    blue = x;
  }

  return {
    red: Math.round((red + m) * 255),
    green: Math.round((green + m) * 255),
    blue: Math.round((blue + m) * 255),
  };
}

function sendUserColor(username, color) {
  clients.forEach((client) => {
    client.socket.write(`USER_COLOR:${username}:${color.red},${color.green},${color.blue}\n`);
  });
}

function sendExistingColors(socket) {
  clients.forEach((client) => {
    socket.write(`USER_COLOR:${client.username}:${client.color.red},${client.color.green},${client.color.blue}\n`);
  });
}

function removeDisconnectedUser(socket) {
  const user = removeUser(clients, socket);

  if (!user) {
    return;
  }

  serverLog(`${user.username} left TChat.`);

  clients.forEach((client) => {
    client.socket.write(`${user.username} left TChat!\n`);
  });
}

console.clear();

console.log("╭────────────────────────────────────────╮");

console.log("│              TCHAT SERVER              │");

console.log("╰────────────────────────────────────────╯");

console.log("");

console.log("● Server online");

console.log("● Port: 3000");

console.log("● IP: 192.168.0.14");

console.log("");

console.log("Type help for server commands.");

console.log("");

console.log("──────────────────────────────────────────");

console.log("");

const server = net.createServer((socket) => {
  let username = "";
  let authenticated = false;
  let disconnected = false;
  let buffer = "";

  serverLog("A client connected.");

  socket.on("data", (data) => {
    buffer += data.toString();

    const lines = buffer.split("\n");

    buffer = lines.pop() || "";

    lines.forEach((line) => {
      const message = line.replace(/\r$/, "");

      if (!message) {
        return;
      }

      handleClientMessage(message, socket);
    });
  });

  function handleClientMessage(message, currentSocket) {
    if (!authenticated && message.startsWith("USERNAME:")) {
      username = message.slice(9).trim();

      if (!username) {
        currentSocket.write("AUTH_FAILED:Username is required.\n");

        return;
      }

      if (username.length > 20) {
        currentSocket.write("AUTH_FAILED:Username is too long.\n");

        return;
      }

      if (username.includes(":")) {
        currentSocket.write("AUTH_FAILED:Invalid username.\n");

        return;
      }

      if (isUsernameTaken(clients, username)) {
        currentSocket.write("AUTH_FAILED:Username is already taken.\n");

        return;
      }

      const userColor = getUserColor();

      const user = createUser(currentSocket, username, userColor, false);

      clients.push(user);

      authenticated = true;

      serverLog(`${username} joined TChat.`);

      currentSocket.write(`Welcome, ${username}!\n`);

      sendExistingColors(currentSocket);

      sendUserColor(username, userColor);

      clients.forEach((client) => {
        if (client.socket !== currentSocket) {
          client.socket.write(`${username} joined TChat!\n`);
        }
      });

      return;
    }

    if (!authenticated) {
      currentSocket.write("Please login with your username.\n");

      return;
    }

    const user = findUser(clients, username);

    if (!user) {
      return;
    }

    // Admin login
    if (message === "/admin-login") {
      if (user.isAdmin) {
        currentSocket.write("You are already logged in as ADMIN.\n");

        return;
      }

      currentSocket.write("ADMIN_PASSWORD_REQUIRED\n");

      return;
    }

    // Admin password
    if (message.startsWith("ADMIN_PASSWORD:")) {
      const password = message.slice(15);

      if (isAdmin(username, password)) {
        user.isAdmin = true;

        currentSocket.write("ADMIN_LOGIN_SUCCESS\n");

        serverLog(`${username} logged in as ADMIN.`);
      } else {
        currentSocket.write("ADMIN_LOGIN_FAILED\n");

        serverLog(`Failed admin login by ${username}.`);
      }

      return;
    }

    // Admin commands
    if (isAdminCommand(message)) {
      handleAdminCommand(currentSocket, username, message, clients);

      return;
    }

    // Normal commands
    if (handleCommand(currentSocket, username, message, clients)) {
      return;
    }

    // Muted users
    if (user.muted) {
      currentSocket.write("You are muted and cannot send messages.\n");

      return;
    }

    // Normal chat
    serverLog(`${username}: ${message}`);

    clients.forEach((client) => {
      client.socket.write(`${username}: ${message}\n`);
    });
  }

  socket.on("end", () => {
    if (disconnected) {
      return;
    }

    disconnected = true;

    if (!authenticated) {
      return;
    }

    removeDisconnectedUser(socket);
  });

  socket.on("close", () => {
    if (disconnected) {
      return;
    }

    disconnected = true;

    if (!authenticated) {
      return;
    }

    removeDisconnectedUser(socket);
  });

  socket.on("error", (error) => {
    if (error.code === "ECONNRESET") {
      if (disconnected) {
        return;
      }

      disconnected = true;

      if (authenticated) {
        removeDisconnectedUser(socket);
      }

      return;
    }

    serverLog(`Socket error: ${error.message}`);
  });
});

server.listen(3000, "0.0.0.0", () => {
  serverLog("TChat server is running.");
});

const serverInput = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

serverInput.prompt();

serverInput.on("line", (input) => {
  const command = input.trim();

  if (!command) {
    serverInput.prompt();
    return;
  }

  handleServerCommand(command, clients, server);

  if (command.toLowerCase() !== "stop") {
    serverInput.prompt();
  }
});
