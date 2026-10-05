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

  serverLog("A client connected.");

  socket.on("data", (data) => {
    const message = data.toString().trim();

    if (!authenticated && message.startsWith("USERNAME:")) {
      username = message.slice(9).trim();

      if (!username) {
        socket.write("AUTH_FAILED:Username is required.\n");

        return;
      }

      if (isUsernameTaken(clients, username)) {
        socket.write("AUTH_FAILED:Username is already taken.\n");

        return;
      }

      const userColor = getUserColor();

      const user = createUser(socket, username, userColor, false);

      clients.push(user);
      authenticated = true;

      serverLog(`${username} joined TChat.`);

      socket.write(`Welcome, ${username}!\n`);

      sendExistingColors(socket);
      sendUserColor(username, userColor);

      clients.forEach((client) => {
        if (client.socket !== socket) {
          client.socket.write(`${username} joined TChat!\n`);
        }
      });

      return;
    }

    if (!authenticated) {
      socket.write("Please login with your username.\n");

      return;
    }

    const user = findUser(clients, username);

    if (!user) {
      return;
    }

    if (message === "/admin-login") {
      if (user.isAdmin) {
        socket.write("You are already logged in as ADMIN.\n");

        return;
      }

      socket.write("ADMIN_PASSWORD_REQUIRED\n");

      return;
    }

    if (message.startsWith("ADMIN_PASSWORD:")) {
      const password = message.slice(15);

      if (isAdmin(username, password)) {
        user.isAdmin = true;

        socket.write("ADMIN_LOGIN_SUCCESS\n");

        serverLog(`${username} logged in as ADMIN.`);
      } else {
        socket.write("ADMIN_LOGIN_FAILED\n");

        serverLog(`Failed admin login by ${username}.`);
      }

      return;
    }

    if (isAdminCommand(message)) {
      handleAdminCommand(socket, username, message, clients);

      return;
    }

    if (handleCommand(socket, username, message, clients)) {
      return;
    }

    if (user.muted) {
      socket.write("You are muted and cannot send messages.\n");

      return;
    }

    serverLog(`${username}: ${message}`);

    clients.forEach((client) => {
      client.socket.write(`${username}: ${message}\n`);
    });
  });

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

server.listen(3000, () => {
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
