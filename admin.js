require("dotenv").config();

function isAdmin(username, password) {
  return username === process.env.TCHAT_ADMIN_USERNAME && password === process.env.TCHAT_ADMIN_PASSWORD;
}

function isAdminCommand(message) {
  const command = message.trim().split(/\s+/)[0].toLowerCase();

  return ["/clear", "/kick", "/mute", "/unmute", "/announce", "/broadcast", "/warn", "/admin-users", "/admin-stats"].includes(command);
}

function findTarget(clients, username) {
  return clients.find((client) => client.username.toLowerCase() === username.toLowerCase());
}

function handleAdminCommand(socket, username, message, clients, serverInfo) {
  const user = clients.find((client) => client.socket === socket);

  if (!user || !user.isAdmin) {
    socket.write("You do not have permission to use this command.\n");

    return true;
  }

  const command = message.trim().split(/\s+/)[0].toLowerCase();

  if (command === "/clear") {
    clients.forEach((client) => {
      client.socket.write("CLEAR_CHAT\n");
    });

    return true;
  }

  if (command === "/kick") {
    const targetUsername = message.slice(5).trim();

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

  if (command === "/mute") {
    const targetUsername = message.slice(5).trim();

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

  if (command === "/unmute") {
    const targetUsername = message.slice(7).trim();

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

  if (command === "/announce") {
    const announcement = message.slice(9).trim();

    if (!announcement) {
      socket.write("Usage: /announce <message>\n");

      return true;
    }

    clients.forEach((client) => {
      client.socket.write(`ADMIN: ${announcement}\n`);
    });

    return true;
  }

  if (command === "/broadcast") {
    const announcement = message.slice(10).trim();

    if (!announcement) {
      socket.write("Usage: /broadcast <message>\n");

      return true;
    }

    clients.forEach((client) => {
      client.socket.write(`BROADCAST: ${announcement}\n`);
    });

    return true;
  }

  if (command === "/warn") {
    const parts = message.trim().split(/\s+/);
    const targetUsername = parts[1];
    const reason = parts.slice(2).join(" ");

    if (!targetUsername || !reason) {
      socket.write("Usage: /warn <username> <reason>\n");

      return true;
    }

    const target = findTarget(clients, targetUsername);

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    if (target.isAdmin) {
      socket.write("You cannot warn an admin.\n");

      return true;
    }

    target.warningCount++;

    target.socket.write(`WARNING: You have been warned by ${username}: ${reason}\n`);

    clients.forEach((client) => {
      if (client.socket !== target.socket) {
        client.socket.write(`${target.username} received a warning from ${username}.\n`);
      }
    });

    socket.write(`${target.username} now has ${target.warningCount} warning(s).\n`);

    return true;
  }

  if (command === "/admin-users") {
    socket.write("ADMIN: Online users:\n");

    clients.forEach((client) => {
      const status = [client.isAdmin ? "ADMIN" : "", client.muted ? "MUTED" : "", client.isAfk ? "AFK" : ""].filter(Boolean).join(", ");

      socket.write(`ADMIN: ${client.username} | Room: #${client.room} | Messages: ${client.messageCount} | Warnings: ${client.warningCount}${status ? ` | ${status}` : ""}\n`);
    });

    return true;
  }

  if (command === "/admin-stats") {
    const adminCount = clients.filter((client) => client.isAdmin).length;
    const mutedCount = clients.filter((client) => client.muted).length;
    const afkCount = clients.filter((client) => client.isAfk).length;

    const uptime = Date.now() - serverInfo.startedAt.getTime();

    const totalMinutes = Math.floor(uptime / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    socket.write("ADMIN: Server statistics:\n");
    socket.write(`ADMIN: Users online: ${clients.length}\n`);
    socket.write(`ADMIN: Admins online: ${adminCount}\n`);
    socket.write(`ADMIN: Muted users: ${mutedCount}\n`);
    socket.write(`ADMIN: AFK users: ${afkCount}\n`);
    socket.write(`ADMIN: Total messages: ${serverInfo.totalMessages}\n`);
    socket.write(`ADMIN: Uptime: ${days}d ${hours}h ${minutes}m\n`);

    return true;
  }

  return true;
}

module.exports = {
  isAdmin,
  isAdminCommand,
  handleAdminCommand,
};
