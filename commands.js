function getTime() {
  return new Date().toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMessage(username, message) {
  return `[${getTime()}] ${username}: ${message}`;
}

function handleCommand(socket, username, message, clients, history) {
  if (message === "/users" || message === "/online") {
    socket.write("Online users:\n");

    clients.forEach((client) => {
      let status = "";

      if (client.isAdmin) {
        status += " [ADMIN]";
      }

      if (client.muted) {
        status += " [MUTED]";
      }

      socket.write(`- ${client.username} - ${client.status}${status}\n`);
    });

    return true;
  }

  if (message === "/help") {
    socket.write("TChat commands:\n");

    socket.write("/users - Show online users\n");

    socket.write("/online - Show online users\n");

    socket.write("/help - Show available commands\n");

    socket.write("/quit - Leave TChat\n");

    socket.write("/msg <username> <message> - Send a private message\n");

    socket.write("/whoami - Show your username\n");

    socket.write("/me <message> - Perform an action\n");

    socket.write("/reply <message> - Reply to your last private message\n");

    socket.write("/last <number> - Show previous messages\n");

    socket.write("/profile <username> - Show a user's profile\n");

    socket.write("/userinfo <username> - Show detailed user information\n");

    socket.write("/status <message> - Set your status\n");

    socket.write("/status clear - Clear your status\n");

    const user = clients.find((client) => client.socket === socket);

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
    const user = clients.find((client) => client.socket === socket);

    if (!user) {
      return true;
    }

    if (user.isAdmin) {
      socket.write(`You are ${username} (ADMIN).\n`);
    } else {
      socket.write(`You are ${username}.\n`);
    }

    return true;
  }

  if (message === "/admin") {
    const user = clients.find((client) => client.socket === socket);

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

    if (!targetUsername || !privateMessage) {
      socket.write("Usage: /msg <username> <message>\n");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} is not online.\n`);

      return true;
    }

    const fromUser = clients.find((client) => client.socket === socket);

    if (fromUser) {
      fromUser.lastMessage = {
        type: "private",
        target: target.username,
        message: privateMessage,
      };
    }

    target.lastPrivateMessage = {
      username,
      message: privateMessage,
      socket,
    };

    socket.write(`Private message to ${target.username}: ${privateMessage}\n`);

    target.socket.write(`Private message from ${username}: ${privateMessage}\n`);

    return true;
  }

  if (message.startsWith("/reply ")) {
    const replyMessage = message.slice(7).trim();

    if (!replyMessage) {
      socket.write("Usage: /reply <message>\n");

      return true;
    }

    const user = clients.find((client) => client.socket === socket);

    if (!user || !user.lastPrivateMessage) {
      socket.write("You have nobody to reply to.\n");

      return true;
    }

    const target = user.lastPrivateMessage;

    const targetUser = clients.find((client) => client.socket === target.socket);

    if (!targetUser) {
      socket.write(`User ${target.username} is not online.\n`);

      return true;
    }

    targetUser.lastPrivateMessage = {
      username,
      message: replyMessage,
      socket,
    };

    socket.write(`Private message to ${targetUser.username}: ${replyMessage}\n`);

    targetUser.socket.write(`Private message from ${username}: ${replyMessage}\n`);

    return true;
  }

  if (message.startsWith("/last")) {
    const parts = message.split(" ");

    let amount = 10;

    if (parts[1]) {
      amount = Number(parts[1]);
    }

    if (Number.isNaN(amount) || amount < 1) {
      socket.write("Usage: /last <number>\n");

      return true;
    }

    amount = Math.min(amount, 50);

    const start = Math.max(0, history.length - amount);

    socket.write(`Last ${Math.min(amount, history.length)} messages:\n`);

    history.slice(start).forEach((historyMessage) => {
      socket.write(`${historyMessage}\n`);
    });

    return true;
  }

  if (message.startsWith("/me ")) {
    const action = message.slice(4).trim();

    if (!action) {
      socket.write("Usage: /me <message>\n");

      return true;
    }

    const formatted = `[${getTime()}] ME: ${username} ${action}`;

    history.push(formatted);

    if (history.length > 100) {
      history.shift();
    }

    clients.forEach((client) => {
      client.socket.write(`${formatted}\n`);
    });

    return true;
  }

  if (message.startsWith("/profile ")) {
    const targetUsername = message.slice(9).trim();

    if (!targetUsername) {
      socket.write("Usage: /profile <username>\n");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} not found.\n`);

      return true;
    }

    socket.write(`PROFILE:Profile: ${target.username}\n`);

    socket.write(`PROFILE:Status: ${target.status}\n`);

    socket.write(`PROFILE:Role: ${target.isAdmin ? "ADMIN" : "User"}\n`);

    socket.write(`PROFILE:Muted: ${target.muted ? "Yes" : "No"}\n`);

    return true;
  }

  if (message.startsWith("/userinfo ")) {
    const targetUsername = message.slice(10).trim();

    if (!targetUsername) {
      socket.write("Usage: /userinfo <username>\n");

      return true;
    }

    const target = clients.find((client) => client.username.toLowerCase() === targetUsername.toLowerCase());

    if (!target) {
      socket.write(`User ${targetUsername} not found.\n`);

      return true;
    }

    const joined = target.joinedAt.toLocaleString("da-DK");

    socket.write(`PROFILE:Username: ${target.username}\n`);

    socket.write(`PROFILE:Status: ${target.status}\n`);

    socket.write(`PROFILE:Role: ${target.isAdmin ? "ADMIN" : "User"}\n`);

    socket.write(`PROFILE:Muted: ${target.muted ? "Yes" : "No"}\n`);

    socket.write(`PROFILE:Joined: ${joined}\n`);

    return true;
  }

  if (message.startsWith("/status")) {
    const user = clients.find((client) => client.socket === socket);

    if (!user) {
      return true;
    }

    const status = message.slice(7).trim();

    if (status.toLowerCase() === "clear") {
      user.status = "Online";

      socket.write("Your status has been cleared.\n");

      return true;
    }

    if (!status) {
      socket.write(`Your current status: ${user.status}\n`);

      return true;
    }

    if (status.length > 50) {
      socket.write("Status cannot be longer than 50 characters.\n");

      return true;
    }

    user.status = status;

    clients.forEach((client) => {
      client.socket.write(`${username}'s status is now: ${status}\n`);
    });

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
  formatMessage,
};
