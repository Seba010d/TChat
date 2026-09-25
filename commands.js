function formatOnlineDuration(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }

  parts.push(`${minutes}m`);

  return parts.join(" ");
}

function handleCommand(socket, username, message, clients) {
  if (message === "/afk") {
    const user = clients.find((client) => client.username === username);

    if (!user) {
      return true;
    }

    user.isAfk = !user.isAfk;
    const statusMessage = user.isAfk ? `${username} is away.` : `${username} is back.`;

    clients.forEach((client) => {
      client.socket.write(`${statusMessage}\n`);
    });

    return true;
  }

  if (message === "/online") {
    socket.write("Online users (time online):\n");

    clients.forEach((client) => {
      const duration = formatOnlineDuration(Date.now() - client.connectedAt);
      const status = client.isAfk ? " [AFK]" : "";

      socket.write(`- ${client.username}: ${duration}${status}\n`);
    });

    return true;
  }
  if (message === "/users") {
    socket.write("Online users:\n");

    clients.forEach((client) => {
      let status = "";

      if (client.isAdmin) {
        status = " [ADMIN]";
      }

      if (client.muted) {
        status += " [MUTED]";
      }

      if (client.isAfk) {
        status += " [AFK]";
      }

      socket.write(`- ${client.username}${status}\n`);
    });

    return true;
  }

  if (message === "/help") {
    socket.write("TChat commands:\n");
    socket.write("/users - Show online users\n");
    socket.write("/help - Show available commands\n");
    socket.write("/quit - Leave TChat\n");
    socket.write("/dm <username> <message> - Send a direct message\n");
    socket.write("/msg is also accepted as an alias for /dm\n");
    socket.write("/whoami - Show your username\n");
    socket.write("/name <newname> - Change your name\n");
    socket.write("/afk - Toggle away/back status\n");
    socket.write("/online - Show how long users have been online\n");
    socket.write("/settings - Show local settings\n");
    socket.write("/timestamps <on|off> - Turn timestamps on or off\n");
    socket.write("/theme <classic|ocean|forest> - Choose a color theme\n");

    const user = clients.find((client) => client.username === username);

    if (user && user.isAdmin) {
      socket.write("\nAdmin commands:\n");
      socket.write("/clear - Clear the chat for everyone\n");
      socket.write("/op <name> - Give someone admin privileges\n");
      socket.write("/deop <name> - Remove someone’s admin privileges\n");
      socket.write("/adminlist - Show online admins\n");
      socket.write("/kick <username> - Kick a user\n");
      socket.write("/mute <username> - Mute a user\n");
      socket.write("/unmute <username> - Unmute a user\n");
      socket.write("/announce <message> - Send an admin announcement\n");
    }

    return true;
  }

  if (message === "/whoami") {
    const user = clients.find((client) => client.username === username);

    if (user && user.isAdmin) {
      socket.write(`You are ${username} (ADMIN).\n`);
    } else {
      socket.write(`You are ${username}.\n`);
    }

    return true;
  }

  if (message === "/admin") {
    const user = clients.find((client) => client.username === username);

    if (user && user.isAdmin) {
      socket.write("You are an admin.\n");
    } else {
      socket.write("You are not an admin.\n");
    }

    return true;
  }

  if (message === "/dm" || message.startsWith("/dm ") || message === "/msg" || message.startsWith("/msg ")) {
    const parts = message.match(/^\/(?:dm|msg)\s+(\S+)\s+([\s\S]+)$/);

    if (!parts || !parts[2].trim()) {
      socket.write("Usage: /dm <username> <message>\n");

      return true;
    }

    const targetUsername = parts[1];
    const privateMessage = parts[2].trim();

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    target.socket.write(`[DM] ${username}: ${privateMessage}\n`);

    socket.write(`[DM] To ${target.username}: ${privateMessage}\n`);

    return true;
  }

  if (message.startsWith("/")) {
    socket.write(`Unknown command: ${message}\n`);

    return true;
  }

  return false;
}

module.exports = {
  handleCommand,
};
