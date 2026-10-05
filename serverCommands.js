function handleServerCommand(command, clients, server) {
  const parts = command.trim().split(" ");
  const commandName = parts[0].toLowerCase();

  if (commandName === "help") {
    console.log("");
    console.log("Server commands:");
    console.log("help - Show server commands");
    console.log("users - Show online users");
    console.log("say <message> - Send a message to everyone");
    console.log("kick <username> - Kick a user");
    console.log("mute <username> - Mute a user");
    console.log("unmute <username> - Unmute a user");
    console.log("clear - Clear the chat for everyone");
    console.log("stop - Stop the server");
    console.log("");

    return true;
  }

  if (commandName === "users") {
    console.log("");

    if (clients.length === 0) {
      console.log("No users online.");
    } else {
      console.log("Online users:");

      clients.forEach((client) => {
        let status = "";

        if (client.isAdmin) {
          status += " [ADMIN]";
        }

        if (client.muted) {
          status += " [MUTED]";
        }

        console.log(`  • ${client.username}${status}`);
      });
    }

    console.log("");

    return true;
  }

  if (commandName === "say") {
    const message = parts.slice(1).join(" ").trim();

    if (!message) {
      console.log("Usage: say <message>");

      return true;
    }

    clients.forEach((client) => {
      client.socket.write(`SERVER: ${message}\n`);
    });

    console.log(`[SERVER] ${message}`);

    return true;
  }

  if (commandName === "kick") {
    const targetUsername = parts.slice(1).join(" ").trim();

    if (!targetUsername) {
      console.log("Usage: kick <username>");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      console.log(`User ${targetUsername} is not online.`);

      return true;
    }

    target.socket.write("You have been kicked from TChat by the server.\n");

    target.socket.end();

    clients.forEach((client) => {
      if (client.socket !== target.socket) {
        client.socket.write(`${target.username} was kicked from TChat by the server.\n`);
      }
    });

    console.log(`${target.username} was kicked.`);

    return true;
  }

  if (commandName === "mute") {
    const targetUsername = parts.slice(1).join(" ").trim();

    if (!targetUsername) {
      console.log("Usage: mute <username>");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      console.log(`User ${targetUsername} is not online.`);

      return true;
    }

    if (target.isAdmin) {
      console.log("You cannot mute an admin.");

      return true;
    }

    target.muted = true;

    clients.forEach((client) => {
      client.socket.write(`${target.username} was muted by the server.\n`);
    });

    console.log(`${target.username} was muted.`);

    return true;
  }

  if (commandName === "unmute") {
    const targetUsername = parts.slice(1).join(" ").trim();

    if (!targetUsername) {
      console.log("Usage: unmute <username>");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      console.log(`User ${targetUsername} is not online.`);

      return true;
    }

    target.muted = false;

    clients.forEach((client) => {
      client.socket.write(`${target.username} was unmuted by the server.\n`);
    });

    console.log(`${target.username} was unmuted.`);

    return true;
  }

  if (commandName === "clear") {
    clients.forEach((client) => {
      client.socket.write("CLEAR_CHAT\n");
    });

    console.log("Chat cleared for everyone.");

    return true;
  }

  if (commandName === "stop") {
    console.log("Stopping TChat server...");

    clients.forEach((client) => {
      client.socket.write("Server is shutting down.\n");

      client.socket.end();
    });

    server.close(() => {
      process.exit(0);
    });

    return true;
  }

  console.log(`Unknown server command: ${command}`);

  return true;
}

module.exports = {
  handleServerCommand,
};
