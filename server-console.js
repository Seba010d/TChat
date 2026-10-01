const readline = require("readline");

function formatDuration(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

function startServerConsole({ clients, server, discoveryServer }) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "tchat-server> ",
  });

  function writeLine(message) {
    if (process.stdout.isTTY) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${message}\n`);
      return;
    }

    console.log(message);
  }

  function log(message) {
    writeLine(message);
    terminal.prompt(true);
  }

  function findUser(name) {
    return clients.find((client) => client.username.toLowerCase() === name.toLowerCase());
  }

  function broadcast(message) {
    clients.forEach((client) => client.socket.write(`${message}\n`));
  }

  function notifyAdmins(message) {
    clients.forEach((client) => {
      if (client.isAdmin) client.socket.write(`${message}\n`);
    });
  }

  function showHelp() {
    writeLine("Server console commands:");
    writeLine("  help                 Show this help");
    writeLine("  status               Show server and user counts");
    writeLine("  users                List online users and their status");
    writeLine("  adminlist            List online admins");
    writeLine("  announce <message>   Send a server announcement to everyone");
    writeLine("  clear                Clear every connected user's chat view");
    writeLine("  kick <name>          Disconnect a user");
    writeLine("  op <name>            Give an online user admin rights");
    writeLine("  deop <name>          Remove an online user's admin rights");
    writeLine("  stop                 Stop the TChat server");
  }

  terminal.on("line", (line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      terminal.prompt();
      return;
    }

    const firstSpace = trimmed.search(/\s/);
    const command = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).replace(/^\/+/, "").toLowerCase();
    const argument = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1).trim();

    if (command === "help") {
      showHelp();
    } else if (command === "status") {
      const adminCount = clients.filter((client) => client.isAdmin).length;
      writeLine(`Server online | ${clients.length} user(s) online | ${adminCount} admin(s) online`);
    } else if (command === "users") {
      if (clients.length === 0) {
        writeLine("No users are online.");
      } else {
        clients.forEach((client) => {
          const flags = [client.isAdmin ? "ADMIN" : "", client.isAfk ? "AFK" : "", client.muted ? "MUTED" : ""].filter(Boolean).join(", ");
          const elapsed = formatDuration(Date.now() - client.connectedAt);
          writeLine(`- ${client.username} (${elapsed})${flags ? ` [${flags}]` : ""}`);
        });
      }
    } else if (command === "adminlist") {
      const admins = clients.filter((client) => client.isAdmin);
      writeLine(admins.length ? `Online admins: ${admins.map((admin) => admin.username).join(", ")}` : "No admins are online.");
    } else if (command === "announce") {
      if (!argument) {
        writeLine("Usage: announce <message>");
      } else {
        broadcast(`ADMIN: ${argument}`);
        writeLine("Announcement sent.");
      }
    } else if (command === "clear") {
      broadcast("CLEAR_CHAT");
      writeLine("Cleared chat views for connected users.");
    } else if (command === "kick") {
      if (!argument) {
        writeLine("Usage: kick <name>");
      } else {
        const target = findUser(argument);
        if (!target) {
          writeLine(`User ${argument} is not online.`);
        } else {
          target.socket.write("You have been disconnected by the server host.\n");
          target.socket.end();
          writeLine(`Disconnected ${target.username}.`);
        }
      }
    } else if (command === "op") {
      if (!argument) {
        writeLine("Usage: op <name>");
      } else {
        const target = findUser(argument);
        if (!target) {
          writeLine(`User ${argument} is not online.`);
        } else if (target.isAdmin) {
          writeLine(`${target.username} is already an admin.`);
        } else {
          target.isAdmin = true;
          notifyAdmins(`${target.username} was made an admin by the server host.`);
          writeLine(`Gave ${target.username} admin rights.`);
        }
      }
    } else if (command === "deop") {
      if (!argument) {
        writeLine("Usage: deop <name>");
      } else {
        const target = findUser(argument);
        if (!target) {
          writeLine(`User ${argument} is not online.`);
        } else if (target.username.toLowerCase() === "sebastian") {
          writeLine("Sebastian cannot be removed as an admin.");
        } else if (!target.isAdmin) {
          writeLine(`${target.username} is not an admin.`);
        } else if (clients.filter((client) => client.isAdmin).length <= 1) {
          writeLine("You cannot remove the last online admin.");
        } else {
          target.isAdmin = false;
          notifyAdmins(`${target.username} was removed as an admin by the server host.`);
          writeLine(`Removed admin rights from ${target.username}.`);
        }
      }
    } else if (command === "stop" || command === "exit") {
      writeLine("Stopping TChat server...");
      server.isShuttingDown = true;
      clients.forEach((client) => client.socket.end("TChat server is shutting down.\n"));
      server.close(() => {
        discoveryServer.close();
        terminal.close();
        console.log("TChat server stopped.");
      });
      return;
    } else {
      writeLine(`Unknown server command: ${command}. Type help for a list.`);
    }

    terminal.prompt();
  });

  terminal.prompt();

  return { log };
}

module.exports = {
  startServerConsole,
};
