const colors = {
  reset: "\x1b[0m",

  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  purple: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightPurple: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

function getUserColor(username, userColors) {
  const color = userColors[username];

  if (!color) {
    return colors.blue;
  }

  return `\x1b[38;2;${color.red};${color.green};${color.blue}m`;
}

function colorMessage(message, userColors) {
  if (message.startsWith("USER_COLOR:")) {
    return "";
  }

  // Server messages
  if (message.startsWith("SERVER:")) {
    return `${colors.cyan}${message}${colors.reset}`;
  }

  // Admin messages
  if (message.startsWith("ADMIN:")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  // Admin login
  if (message.startsWith("You are now logged in as ADMIN.") || message.startsWith("You are already logged in as ADMIN.") || message.startsWith("You are logged in as ADMIN.")) {
    return `${colors.brightRed}${message}${colors.reset}`;
  }

  // Help title
  if (message === "TChat commands:") {
    return `${colors.brightPurple}${message}${colors.reset}`;
  }

  // Admin help title
  if (message === "Admin commands:") {
    return `${colors.brightRed}${message}${colors.reset}`;
  }

  // Normal help commands
  if (message.startsWith("/users -") || message.startsWith("/help -") || message.startsWith("/quit -") || message.startsWith("/msg ") || message.startsWith("/whoami -")) {
    return `${colors.purple}${message}${colors.reset}`;
  }

  // Admin help commands
  if (message.startsWith("/clear -") || message.startsWith("/kick ") || message.startsWith("/mute ") || message.startsWith("/unmute ") || message.startsWith("/announce ")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  // Private messages
  if (message.startsWith("Private message from")) {
    return `${colors.brightPurple}${message}${colors.reset}`;
  }

  if (message.startsWith("Private message to")) {
    return `${colors.brightPurple}${message}${colors.reset}`;
  }

  // Join / leave
  if (message.includes("joined TChat!") || message.includes("left TChat!")) {
    return `${colors.yellow}${message}${colors.reset}`;
  }

  // Errors
  if (message.startsWith("Unknown command:") || (message.startsWith("User ") && message.includes("is not online.")) || message.includes("do not have permission") || message.includes("cannot") || message.includes("muted and cannot") || message.includes("Incorrect admin password")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  // Normal chat message
  const colonIndex = message.indexOf(":");

  if (colonIndex !== -1) {
    const messageUsername = message.slice(0, colonIndex);
    const messageText = message.slice(colonIndex);

    const userColor = getUserColor(messageUsername, userColors);

    return `${userColor}${messageUsername}${colors.reset}` + `${messageText}`;
  }

  return `${colors.blue}${message}${colors.reset}`;
}

module.exports = {
  colors,
  colorMessage,
};
