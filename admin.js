require("dotenv").config();

function isAdmin(username, password) {
  return username === process.env.TCHAT_ADMIN_USERNAME && password === process.env.TCHAT_ADMIN_PASSWORD;
}

function isAdminCommand(message) {
  return message === "/clear" || message === "/adminlist" || message === "/op" || message.startsWith("/op ") || message === "/deop" || message.startsWith("/deop ") || message.startsWith("/kick ") || message.startsWith("/mute ") || message.startsWith("/unmute ") || message.startsWith("/announce ");
}

function notifyAdmins(clients, message) {
  clients.forEach((client) => {
    if (client.isAdmin) {
      client.socket.write(`${message}\n`);
    }
  });
}

function handleAdminCommand(socket, username, message, clients) {
  const user = clients.find((client) => client.socket === socket);

  if (!user || !user.isAdmin) {
    socket.write("You do not have permission to use this command.\n");

    return true;
  }

  if (message === "/adminlist") {
    const admins = clients.filter((client) => client.isAdmin);

    if (admins.length === 0) {
      socket.write("No admins are online.\n");

      return true;
    }

    socket.write("Online admins:\n");
    admins.forEach((admin) => {
      socket.write(`- ${admin.username}\n`);
    });

    return true;
  }

  if (message === "/op" || message.startsWith("/op ")) {
    const targetUsername = message.slice(3).trim();

    if (!targetUsername) {
      socket.write("Usage: /op <name>\n");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    if (target.isAdmin) {
      socket.write(`${target.username} is already an admin.\n`);

      return true;
    }

    target.isAdmin = true;
    notifyAdmins(clients, `${target.username} was made an admin by ${username}.`);

    return true;
  }

  if (message === "/deop" || message.startsWith("/deop ")) {
    const targetUsername = message.slice(5).trim();

    if (!targetUsername) {
      socket.write("Usage: /deop <name>\n");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    if (target.username.toLowerCase() === "sebastian") {
      socket.write("Sebastian cannot be removed as an admin.\n");

      return true;
    }

    if (!target.isAdmin) {
      socket.write(`${target.username} is not an admin.\n`);

      return true;
    }

    const onlineAdminCount = clients.filter((client) => client.isAdmin).length;

    if (onlineAdminCount <= 1) {
      socket.write("You cannot remove the last online admin.\n");

      return true;
    }

    target.isAdmin = false;
    notifyAdmins(clients, `${target.username} was removed as an admin by ${username}.`);

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

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

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

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

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

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

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

  return false;
}

module.exports = {
  isAdmin,
  isAdminCommand,
  handleAdminCommand,
};
