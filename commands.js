const { findUser, isUsernameTaken, isValidUsername } = require("./users");

const { getRooms, createRoom, addUserToRoom, removeUserFromRoom, getUsersInRoom } = require("./rooms");

const { isAdminCommand, handleAdminCommand } = require("./admin");

function send(socket, message) {
  socket.write(message + "\n");
}

function broadcast(clients, message) {
  clients.forEach((client) => {
    if (client.socket && !client.socket.destroyed) {
      client.socket.write(message + "\n");
    }
  });
}

function broadcastRoom(clients, roomName, message) {
  clients.forEach((client) => {
    if (client.room === roomName && client.socket && !client.socket.destroyed) {
      client.socket.write(message + "\n");
    }
  });
}

function handleCommand(socket, username, message, clients, history, serverInfo) {
  const parts = message.trim().split(" ");

  const command = parts[0].toLowerCase();

  const args = parts.slice(1);

  const user = findUser(clients, username);

  if (!user) {
    return;
  }

  if (isAdminCommand(message)) {
    handleAdminCommand(socket, username, message, clients);

    return;
  }

  if (command === "/users" || command === "/online") {
    const users = clients.map((client) => client.username).join(", ");

    send(socket, `SERVER: Online users: ${users}`);

    return;
  }

  if (command === "/rooms") {
    const rooms = getRooms();

    send(socket, "SERVER: Available rooms:");

    rooms.forEach((room) => {
      send(socket, `SERVER: #${room.name} (${room.users.size} users)`);
    });

    return;
  }

  if (command === "/room") {
    send(socket, `SERVER: You are currently in #${user.room}`);

    return;
  }

  if (command === "/join") {
    if (!args[0]) {
      send(socket, "ERROR: Usage: /join <room>");

      return;
    }

    const roomName = args[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");

    if (!roomName) {
      send(socket, "ERROR: Invalid room name.");

      return;
    }

    if (roomName.length > 20) {
      send(socket, "ERROR: Room name is too long.");

      return;
    }

    const oldRoom = user.room || "general";

    if (oldRoom === roomName) {
      send(socket, `SERVER: You are already in #${roomName}`);

      return;
    }

    removeUserFromRoom(username, oldRoom);

    user.room = roomName;

    createRoom(roomName);

    addUserToRoom(username, roomName);

    broadcastRoom(clients, oldRoom, `SERVER: ${username} left #${oldRoom}`);

    broadcastRoom(clients, roomName, `SERVER: ${username} joined #${roomName}`);

    send(socket, `SERVER: You joined #${roomName}`);

    return;
  }

  if (command === "/leave") {
    const currentRoom = user.room || "general";

    if (currentRoom === "general") {
      send(socket, "SERVER: You are already in #general");

      return;
    }

    removeUserFromRoom(username, currentRoom);

    user.room = "general";

    addUserToRoom(username, "general");

    broadcastRoom(clients, currentRoom, `SERVER: ${username} left #${currentRoom}`);

    broadcastRoom(clients, "general", `SERVER: ${username} joined #general`);

    send(socket, "SERVER: You joined #general");

    return;
  }

  if (command === "/who") {
    const roomName = user.room || "general";

    const users = getUsersInRoom(roomName);

    send(socket, `SERVER: Users in #${roomName}: ${users.join(", ")}`);

    return;
  }

  if (command === "/nick") {
    if (!args[0]) {
      send(socket, "ERROR: Usage: /nick <name>");

      return;
    }

    const newUsername = args[0];

    if (!isValidUsername(newUsername)) {
      send(socket, "ERROR: Username can only contain letters, numbers, _ and -.");

      return;
    }

    if (newUsername.length < 2 || newUsername.length > 20) {
      send(socket, "ERROR: Username must be 2-20 characters.");

      return;
    }

    if (isUsernameTaken(clients, newUsername)) {
      send(socket, "ERROR: Username already taken.");

      return;
    }

    const oldUsername = user.username;

    const roomName = user.room || "general";

    user.username = newUsername;

    removeUserFromRoom(oldUsername, roomName);

    addUserToRoom(newUsername, roomName);

    send(socket, `SERVER: Your username is now ${newUsername}`);

    broadcastRoom(clients, roomName, `SERVER: ${oldUsername} is now known as ${newUsername}`);

    return;
  }

  if (command === "/me") {
    const action = args.join(" ");

    if (!action) {
      send(socket, "ERROR: Usage: /me <action>");

      return;
    }

    const id = serverInfo.nextMessageId++;

    const time = new Date().toLocaleTimeString();

    const roomName = user.room || "general";

    const formattedMessage = `[${time}] #${id} * ${user.username} ${action}`;

    history.push(formattedMessage);

    if (history.length > 100) {
      history.shift();
    }

    serverInfo.totalMessages++;

    broadcastRoom(clients, roomName, formattedMessage);

    return;
  }

  if (command === "/afk") {
    const afkMessage = args.join(" ") || "AFK";

    user.isAfk = true;
    user.afkMessage = afkMessage;
    user.status = "AFK";

    broadcastRoom(clients, user.room, `SERVER: ${user.username} is now AFK: ${afkMessage}`);

    return;
  }

  if (command === "/back") {
    user.isAfk = false;
    user.afkMessage = "";
    user.status = "Online";

    broadcastRoom(clients, user.room, `SERVER: ${user.username} is back`);

    return;
  }

  if (command === "/profile") {
    send(socket, `PROFILE: Username: ${user.username}`);

    send(socket, `PROFILE: Status: ${user.status}`);

    send(socket, `PROFILE: Room: #${user.room}`);

    send(socket, `PROFILE: Messages: ${user.messageCount}`);

    send(socket, `PROFILE: Joined: ${user.joinedAt.toLocaleString()}`);

    return;
  }

  if (command === "/stats") {
    send(socket, `SERVER: Your messages: ${user.messageCount}`);

    send(socket, `SERVER: Total server messages: ${serverInfo.totalMessages}`);

    return;
  }

  if (command === "/time") {
    send(socket, `SERVER: ${new Date().toLocaleString()}`);

    return;
  }

  if (command === "/ping") {
    send(socket, `PONG:${Date.now()}`);

    return;
  }

  if (command === "/serverinfo") {
    send(socket, `SERVER: TChat ${serverInfo.version}`);

    send(socket, `SERVER: Users online: ${clients.length}`);

    send(socket, `SERVER: Messages: ${serverInfo.totalMessages}`);

    return;
  }

  if (command === "/motd") {
    send(socket, `SERVER: ${serverInfo.motd}`);

    return;
  }

  if (command === "/msg" || command === "/dm") {
    if (args.length < 2) {
      send(socket, "ERROR: Usage: /msg <user> <message>");

      return;
    }

    const target = findUser(clients, args[0]);

    if (!target) {
      send(socket, `ERROR: User "${args[0]}" not found.`);

      return;
    }

    const privateMessage = args.slice(1).join(" ");

    target.lastPrivateMessage = {
      username: user.username,
      socket,
    };

    user.lastPrivateMessage = {
      username: target.username,
      socket: target.socket,
    };

    send(target.socket, `PRIVATE:${user.username} -> you: ${privateMessage}`);

    send(socket, `PRIVATE:you -> ${target.username}: ${privateMessage}`);

    return;
  }

  if (command === "/last") {
    const last = history.slice(-10);

    if (!last.length) {
      send(socket, "SERVER: No messages yet.");

      return;
    }

    last.forEach((item) => send(socket, `HISTORY:${item}`));

    return;
  }

  if (command === "/search") {
    const search = args.join(" ").toLowerCase();

    if (!search) {
      send(socket, "ERROR: Usage: /search <text>");

      return;
    }

    const results = history.filter((item) => item.toLowerCase().includes(search));

    if (!results.length) {
      send(socket, "SERVER: No results found.");

      return;
    }

    results.slice(-20).forEach((item) => send(socket, `HISTORY:${item}`));

    return;
  }

  if (command === "/help") {
    send(socket, "HELP: Chat commands");

    send(socket, "HELP: /users - Show online users");

    send(socket, "HELP: /rooms - Show rooms");

    send(socket, "HELP: /join <room> - Join a room");

    send(socket, "HELP: /leave - Leave current room");

    send(socket, "HELP: /room - Show current room");

    send(socket, "HELP: /who - Show users in room");

    send(socket, "HELP: /nick <name> - Change username");

    send(socket, "HELP: /me <action> - Send an action");

    send(socket, "HELP: /afk [message] - Set AFK");

    send(socket, "HELP: /back - Remove AFK");

    send(socket, "HELP: /profile - Show profile");

    send(socket, "HELP: /stats - Show statistics");

    send(socket, "HELP: /msg <user> <message> - Private message");

    send(socket, "HELP: /last - Show last messages");

    send(socket, "HELP: /search <text> - Search messages");

    send(socket, "HELP: /ping - Check ping");

    send(socket, "HELP: /serverinfo - Server information");

    send(socket, "HELP: /motd - Server message");

    send(socket, "HELP: /admin-login - Log in as admin");

    send(socket, "HELP: Admin: /clear /kick /mute /unmute /announce");

    send(socket, "HELP: /quit - Disconnect");

    return;
  }

  if (command === "/quit") {
    send(socket, "SERVER: Goodbye!");

    socket.end();

    return;
  }

  if (command.startsWith("/")) {
    send(socket, `ERROR: Unknown command "${command}"`);
  }
}

module.exports = {
  handleCommand,
};
