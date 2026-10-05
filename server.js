require("dotenv").config();

const net = require("net");

const { createUser, findUser, removeUser, isUsernameTaken, isValidUsername } = require("./users");

const { getUserColor, colors } = require("./colors");

const { handleCommand } = require("./commands");

const { addUserToRoom, removeUserFromRoom } = require("./rooms");

const { startServerConsole } = require("./server-console");

const clients = [];
const userColors = {};

const PORT = 3000;

const serverInfo = {
  version: "2.1.0",
  port: PORT,
  startedAt: new Date(),
  totalMessages: 0,
  nextMessageId: 1,
  motd: "Welcome to TChat!",
};

const history = [];

const server = net.createServer((socket) => {
  let username = "";
  let buffer = "";
  let loggedIn = false;

  socket.setEncoding("utf8");

  socket.write("USERNAME:\n");

  socket.on("data", (data) => {
    buffer += data;

    const lines = buffer.split("\n");

    buffer = lines.pop() || "";

    lines.forEach((line) => {
      const message = line.trim();

      if (!message) {
        return;
      }

      if (!loggedIn) {
        if (!isValidUsername(message)) {
          socket.write("ERROR: Invalid username.\n");

          return;
        }

        if (message.length < 2 || message.length > 20) {
          socket.write("ERROR: Username must be 2-20 characters.\n");

          return;
        }

        if (isUsernameTaken(clients, message)) {
          socket.write("ERROR: Username already taken.\n");

          return;
        }

        username = message;

        const isAdmin = username === process.env.TCHAT_ADMIN_USERNAME;

        const color = getUserColor(username, userColors);

        userColors[username] = color;

        const user = createUser(socket, username, color, isAdmin);

        clients.push(user);

        addUserToRoom(username, "general");

        loggedIn = true;

        socket.write(`WELCOME:${username}\n`);

        socket.write(`SERVER:${serverInfo.motd}\n`);

        socket.write(`USER_COLOR:${username}:${color}\n`);

        clients.forEach((client) => {
          if (client.socket !== socket) {
            socket.write(`USER_COLOR:${client.username}:${client.color}\n`);
          }
        });

        clients.forEach((client) => {
          if (client.socket !== socket && !client.socket.destroyed) {
            client.socket.write(`SERVER: ${username} joined the chat\n`);
          }
        });

        return;
      }

      const user = findUser(clients, username);

      if (!user) {
        return;
      }

      if (message.startsWith("/")) {
        handleCommand(socket, username, message, clients, history, serverInfo);

        username = user.username;

        return;
      }

      if (user.muted) {
        socket.write("ERROR: You are muted.\n");

        return;
      }

      if (message.length > 500) {
        socket.write("ERROR: Message is too long.\n");

        return;
      }

      const now = Date.now();

      if (now - user.lastMessageTime < 500) {
        socket.write("ERROR: Slow down.\n");

        return;
      }

      user.lastMessageTime = now;

      if (user.isAfk) {
        user.isAfk = false;
        user.afkMessage = "";
        user.status = "Online";

        broadcastRoom(clients, user.room, `SERVER: ${user.username} is back`);
      }

      user.messageCount++;

      const id = serverInfo.nextMessageId++;

      const time = new Date().toLocaleTimeString();

      const roomName = user.room || "general";

      const formattedMessage = `[${time}] #${id} ${user.username}: ${message}`;

      user.lastMessage = formattedMessage;

      user.lastMessageId = id;

      serverInfo.totalMessages++;

      history.push(formattedMessage);

      if (history.length > 100) {
        history.shift();
      }

      broadcastRoom(clients, roomName, formattedMessage);
    });
  });

  socket.on("close", () => {
    const user = removeUser(clients, socket);

    if (!user) {
      return;
    }

    removeUserFromRoom(user.username, user.room || "general");

    clients.forEach((client) => {
      if (!client.socket.destroyed) {
        client.socket.write(`SERVER: ${user.username} left the chat\n`);
      }
    });
  });

  socket.on("error", () => {});
});

function broadcastRoom(clients, roomName, message) {
  clients.forEach((client) => {
    if (client.room === roomName && !client.socket.destroyed) {
      client.socket.write(message + "\n");
    }
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`${colors.brightCyan}TChat server running on port ${PORT}${colors.reset}`);

  console.log(`${colors.gray}Waiting for clients...${colors.reset}`);

  startServerConsole({
    clients,
    server,
    discoveryServer: {
      close(callback) {
        if (callback) {
          callback();
        }
      },
    },
  });
});
