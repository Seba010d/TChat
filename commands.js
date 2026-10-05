function handleCommand(socket, username, message, clients) {
  if (message === "/users") {
    socket.write("Online users:\n");

    clients.forEach((client) => {
      let status = "";

      if (client.isAdmin) {
        status += " [ADMIN]";
      }

      if (client.muted) {
        status += " [MUTED]";
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

    socket.write("/msg <username> <message> - Send a private message\n");

    socket.write("/whoami - Show your username\n");

    const user = clients.find((client) => client.username === username);

    if (user && user.isAdmin) {
      socket.write("\nAdmin commands:\n");

      socket.write("/clear - Clear the chat for everyone\n");

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

  if (message === "/quit") {
    socket.end();

    return true;
  }

  if (message.startsWith("/msg ")) {
    const parts = message.split(" ");

    const targetUsername = parts[1];

    const privateMessage = parts.slice(2).join(" ").trim();

    if (!targetUsername) {
      socket.write("Usage: /msg <username> <message>\n");

      return true;
    }

    if (!privateMessage) {
      socket.write("Usage: /msg <username> <message>\n");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    target.socket.write(`Private message from ${username}: ${privateMessage}\n`);

    socket.write(`Private message to ${target.username}: ${privateMessage}\n`);

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
