const colors = {
  reset: "\x1b[0m",
  brightCyan: "\x1b[96m",
  brightPurple: "\x1b[95m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightRed: "\x1b[91m",
  brightBlue: "\x1b[94m",
  cyan: "\x1b[36m",
  purple: "\x1b[35m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

const userColors = [colors.brightCyan, colors.brightPurple, colors.brightGreen, colors.brightYellow, colors.brightBlue, colors.cyan, colors.purple, colors.green, colors.yellow, colors.white];

function getUserColor(username, assignedColors) {
  if (assignedColors[username]) {
    return assignedColors[username];
  }

  const usedColors = Object.values(assignedColors);

  const available = userColors.filter((color) => !usedColors.includes(color));

  const color = available.length ? available[0] : userColors[Object.keys(assignedColors).length % userColors.length];

  assignedColors[username] = color;

  return color;
}

function colorMessage(message, assignedColors) {
  if (message.startsWith("USER_COLOR:")) {
    return null;
  }

  if (message.startsWith("CLEAR_CHAT")) {
    return null;
  }

  if (message.startsWith("PONG:")) {
    return `${colors.gray}Server ping: ${message.substring(5)}ms${colors.reset}`;
  }

  if (message.startsWith("HISTORY:")) {
    message = message.substring(8);
  }

  if (message.startsWith("PROFILE:")) {
    return `${colors.brightPurple}${message}${colors.reset}`;
  }

  if (message.startsWith("SERVER:")) {
    return `${colors.gray}${message}${colors.reset}`;
  }

  if (message.startsWith("PRIVATE:")) {
    return `${colors.brightPurple}${message}${colors.reset}`;
  }

  if (message.startsWith("ERROR:")) {
    return `${colors.brightRed}${message}${colors.reset}`;
  }

  if (message.startsWith("HELP:")) {
    return `${colors.brightCyan}${message}${colors.reset}`;
  }

  if (message.startsWith("ADMIN:")) {
    return `${colors.brightYellow}${message}${colors.reset}`;
  }

  if (message.startsWith("[")) {
    const match = message.match(/^\[(.*?)\] (#\d+) (.*?): (.*)$/);

    if (match) {
      const time = match[1];

      const id = match[2];

      const username = match[3];

      const text = match[4];

      const color = assignedColors[username] || colors.brightCyan;

      return `${colors.gray}[${time}] ${id}${colors.reset} ` + `${color}${username}${colors.reset}: ${text}`;
    }

    const meMatch = message.match(/^\[(.*?)\] (#\d+) \* (.*?) (.*)$/);

    if (meMatch) {
      const time = meMatch[1];

      const id = meMatch[2];

      const username = meMatch[3];

      const action = meMatch[4];

      const color = assignedColors[username] || colors.brightCyan;

      return `${colors.gray}[${time}] ${id}${colors.reset} ` + `${color}* ${username}${colors.reset} ${action}`;
    }
  }

  return message;
}

module.exports = {
  colors,
  getUserColor,
  colorMessage,
};
