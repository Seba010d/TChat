const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  purple: "\x1b[35m",
  cyan: "\x1b[36m",
};

function getUserColor(username, userColors) {
  const color = userColors[username];

  if (!color) {
    return colors.blue;
  }

  return `\x1b[38;2;${color.red};${color.green};${color.blue}m`;
}

function colorMessage(message, username, userColors) {
  if (message.startsWith("USER_COLOR:")) {
    return "";
  }

  if (message.startsWith("ADMIN:")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  if (message.startsWith("You are now logged in as ADMIN.")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  if (message.startsWith("You are logged in as ADMIN.")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  if (message.startsWith("TChat commands:")) {
    return `${colors.purple}${message}${colors.reset}`;
  }

  if (message.startsWith("Admin commands:")) {
    return `${colors.purple}${message}${colors.reset}`;
  }

  if (message.startsWith("/users") || message.startsWith("/help") || message.startsWith("/quit") || message.startsWith("/msg") || message.startsWith("/whoami") || message.startsWith("/clear") || message.startsWith("/kick") || message.startsWith("/mute") || message.startsWith("/unmute") || message.startsWith("/announce")) {
    return `${colors.purple}${message}${colors.reset}`;
  }

  if (message.startsWith("Private message from") || message.startsWith("Private message to")) {
    return `${colors.purple}${message}${colors.reset}`;
  }

  if (message.includes("joined TChat!") || message.includes("left TChat!")) {
    return `${colors.yellow}${message}${colors.reset}`;
  }

  if (message.includes("is not online.") || message.startsWith("Unknown") || message.includes("do not have permission") || message.includes("cannot") || message.includes("muted and cannot")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  const colonIndex = message.indexOf(":");

  if (colonIndex !== -1) {
    const messageUsername = message.slice(0, colonIndex);

    const messageColor = getUserColor(messageUsername, userColors);

    const messageText = message.slice(colonIndex);

    return `${messageColor}${messageUsername}${colors.reset}${messageText}`;
  }

  return `${colors.blue}${message}${colors.reset}`;
}

module.exports = {
  colors,
  colorMessage,
};
