require("dotenv").config();

function isAdmin(username, password) {
  return username === process.env.TCHAT_ADMIN_USERNAME && password === process.env.TCHAT_ADMIN_PASSWORD;
}

function isAdminCommand(message) {
  return message === "/clear" || message.startsWith("/kick ") || message.startsWith("/mute ") || message.startsWith("/unmute ") || message.startsWith("/announce ");
}

function findTarget(clients, username) {
  return clients.find((client) => client.username.toLowerCase() === username.toLowerCase());
}

function handleAdminCommand(socket, username, message, clients) {
  const user = clients.find((client) => client.socket === socket);

  if (!user || !user.isAdmin) {
    socket.write("You do not have permission to use this command.\n");

    return true;
  }

  if (message === "/clear") {
    clients.forEach((client) => {
      client.socket.write("CLEAR_CHAT\n");
    });

    return true;
  }

  if (message.startsWith("/kick ")) {
    const targetUsername = message.slice(6).trim();

    if (!targetUsername) {
      socket.write("Usage: /kick <username>\n");

      return true;
    }

    const target = findTarget(clients, targetUsername);

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    if (target.socket === socket) {
      socket.write("You cannot kick yourself.\n");

      return true;
    }

    target.socket.write("You have been kicked from TChat by an admin.\n");

    target.socket.end();

    clients.forEach((client) => {
      if (client.socket !== target.socket) {
        client.socket.write(`${target.username} was kicked from TChat by ${username}.\n`);
      }
    });

    return true;
  }

  if (message.startsWith("/mute ")) {
    const targetUsername = message.slice(6).trim();

    if (!targetUsername) {
      socket.write("Usage: /mute <username>\n");

      return true;
    }

    const target = findTarget(clients, targetUsername);

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    if (target.isAdmin) {
      socket.write("You cannot mute an admin.\n");

      return true;
    }

    target.muted = true;

    clients.forEach((client) => {
      client.socket.write(`${target.username} was muted by ${username}.\n`);
    });

    return true;
  }

  if (message.startsWith("/unmute ")) {
    const targetUsername = message.slice(8).trim();

    if (!targetUsername) {
      socket.write("Usage: /unmute <username>\n");

      return true;
    }

    const target = findTarget(clients, targetUsername);

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    target.muted = false;

    clients.forEach((client) => {
      client.socket.write(`${target.username} was unmuted by ${username}.\n`);
    });

    return true;
  }

  if (message.startsWith("/announce ")) {
    const announcement = message.slice(10).trim();

    if (!announcement) {
      socket.write("Usage: /announce <message>\n");

      return true;
    }

    clients.forEach((client) => {
      client.socket.write(`ADMIN: ${announcement}\n`);
    });

    return true;
  }

  return true;
}

module.exports = {
  isAdmin,
  isAdminCommand,
  handleAdminCommand,
};
