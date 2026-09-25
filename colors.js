const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  purple: "\x1b[35m",
  cyan: "\x1b[36m",
};

const themes = {
  classic: {
    green: "\x1b[32m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    purple: "\x1b[35m",
    cyan: "\x1b[36m",
  },
  ocean: {
    green: "\x1b[92m",
    blue: "\x1b[94m",
    yellow: "\x1b[93m",
    red: "\x1b[91m",
    purple: "\x1b[95m",
    cyan: "\x1b[96m",
  },
  forest: {
    green: "\x1b[32m",
    blue: "\x1b[36m",
    yellow: "\x1b[93m",
    red: "\x1b[31m",
    purple: "\x1b[33m",
    cyan: "\x1b[92m",
  },
};

function setTheme(themeName) {
  const theme = themes[themeName];

  if (!theme) {
    return false;
  }

  Object.assign(colors, theme);
  return true;
}

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

  if (message.startsWith("You are logged in as ADMIN.")) {
    return `${colors.red}${message}${colors.reset}`;
  }

  if (message.startsWith("TChat commands:") || message.startsWith("Admin commands:")) {
    return `${colors.purple}${message}${colors.reset}`;
  }

  if (message.startsWith("[DM] ")) {
    const separator = message.indexOf(":");

    if (separator === -1) {
      return `${colors.purple}${message}${colors.reset}`;
    }

    const header = message.slice(0, separator);
    const body = message.slice(separator + 1);
    const isOutgoing = header.startsWith("[DM] To ");
    const username = isOutgoing ? header.slice(8) : header.slice(5);
    const direction = isOutgoing ? "To " : "";

    return `${colors.purple}\x1b[1m[DM]\x1b[22m ${direction}${getUserColor(username, userColors)}\x1b[1m${username}:\x1b[22m${colors.reset}${body}`;
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
    const sender = message.slice(0, colonIndex + 1);
    const messageText = message.slice(colonIndex + 1);

    return `${getUserColor(messageUsername, userColors)}\x1b[1m${sender}\x1b[22m${colors.reset}${messageText}`;
  }

  return `${colors.blue}${message}${colors.reset}`;
}

module.exports = {
  colors,
  colorMessage,
  setTheme,
};
