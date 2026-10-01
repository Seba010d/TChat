const net = require("net");
const dgram = require("dgram");
const os = require("os");

const { startServerConsole } = require("./server-console");

const { createUser, findUser, removeUser, isUsernameTaken } = require("./users");

const { handleCommand } = require("./commands");

const { isAdmin, isAdminCommand, handleAdminCommand } = require("./admin");

const clients = [];
let serverConsole;

function logServer(message) {
  if (serverConsole) {
    serverConsole.log(message);
  } else {
    console.log(message);
  }
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

const server = net.createServer((socket) => {
  let username = "";
  let authenticated = false;

  logServer("A client connected!");

  socket.on("data", (data) => {
    if (server.isShuttingDown) {
      return;
    }

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

      logServer(`${username} joined TChat!`);

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

        logServer(`${username} logged in as ADMIN!`);
      } else {
        socket.write("ADMIN_LOGIN_FAILED\n");
      }

      return;
    }

    if (message === "/name" || message.startsWith("/name ")) {
      const newUsername = message.slice(5).trim();

      if (!/^[A-Za-z0-9_-]{1,20}$/.test(newUsername)) {
        socket.write("Usage: /name <newname> (1-20 letters, numbers, _ or -)\n");

        return;
      }

      const nameIsTaken = clients.some((client) => client !== user && client.username.toLowerCase() === newUsername.toLowerCase());

      if (nameIsTaken) {
        socket.write(`Username ${newUsername} is already taken.\n`);

        return;
      }

      const oldUsername = user.username;
      user.username = newUsername;
      username = newUsername;

      sendUserColor(newUsername, user.color);

      clients.forEach((client) => {
        client.socket.write(`${oldUsername} is now known as ${newUsername}.\n`);
      });

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

    if (user.isAfk) {
      user.isAfk = false;

      clients.forEach((client) => {
        client.socket.write(`${username} is back.\n`);
      });
    }

    logServer(`${username} says: ${message}`);

    clients.forEach((client) => {
      client.socket.write(`${username}: ${message}\n`);
    });
  });

  socket.on("end", () => {
    if (!authenticated) {
      return;
    }

    const user = removeUser(clients, socket);

    if (!user) {
      return;
    }

    if (server.isShuttingDown) {
      return;
    }

    logServer(`${user.username} left TChat!`);

    clients.forEach((client) => {
      client.socket.write(`${user.username} left TChat!\n`);
    });
  });
});

const discoveryServer = dgram.createSocket("udp4");

discoveryServer.on("message", (message, remote) => {
  if (message.toString() === "TCHAT_DISCOVER") {
    discoveryServer.send("TCHAT_SERVER", remote.port, remote.address);
  }
});

discoveryServer.on("error", (error) => {
  console.error(`TChat network discovery error: ${error.message}`);
});

discoveryServer.bind(3001, "0.0.0.0");

server.listen(3000, "0.0.0.0", () => {
  console.log("TChat server is running on port 3000");

  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((address) => address && address.family === "IPv4" && !address.internal)
    .map((address) => address.address);

  if (addresses.length > 0) {
    console.log(`Local network addresses: ${addresses.join(", ")}`);
  }

  console.log("Clients on the same Wi-Fi can discover this server automatically.");
  console.log("Type help for server console commands.");
  serverConsole = startServerConsole({ clients, server, discoveryServer });
});
