const { colors, colorMessage } = require("./colors");

function drawLogin(errorMessage = "") {
  console.clear();

  const terminalWidth = process.stdout.columns || 80;
  const frameWidth = Math.max(24, Math.min(terminalWidth, 100));
  const innerWidth = frameWidth - 4;
  const border = "─".repeat(innerWidth);
  const title = "TCHAT";
  const titleLeft = Math.floor((innerWidth - title.length) / 2);
  const titleRight = innerWidth - title.length - titleLeft;
  const welcome = "Welcome to TChat";
  const welcomeLeft = Math.floor((innerWidth - welcome.length) / 2);
  const welcomeRight = innerWidth - welcome.length - welcomeLeft;

  console.log(`${colors.cyan}╭${border}╮${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset}${" ".repeat(titleLeft)}${colors.purple}\x1b[1m${title}\x1b[22m${colors.reset}${" ".repeat(titleRight)}${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset}${" ".repeat(welcomeLeft)}${colors.blue}${welcome}${colors.reset}${" ".repeat(welcomeRight)}${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}╰${border}╯${colors.reset}`);
  console.log("");

  if (errorMessage) {
    console.log(`${colors.red}${errorMessage}${colors.reset}`);
  }

  console.log("Choose a username to join the chat.");
  process.stdout.write(`${colors.green}Username:${colors.reset} `);
}

function shouldShowTimestamp(message) {
  if (message.startsWith("[DM] ") || message.startsWith("Private message from ") || message.startsWith("Private message to ")) {
    return true;
  }

  if (message.startsWith("ADMIN:") || message.startsWith("- ")) {
    return false;
  }

  return message.indexOf(":") > 0;
}

function draw(messages, input, username, userColors, settings = {}) {
  console.clear();

  const terminalWidth = process.stdout.columns || 80;
  const frameWidth = Math.max(24, Math.min(terminalWidth, 100));
  const innerWidth = frameWidth - 4;
  const border = "─".repeat(innerWidth);
  const title = "TCHAT";
  const titleLeft = Math.floor((innerWidth - title.length) / 2);
  const titleRight = innerWidth - title.length - titleLeft;
  const accountLabel = `Logged in as ${username}`;
  const accountLeft = Math.max(0, Math.floor((innerWidth - accountLabel.length) / 2));
  const accountRight = Math.max(0, innerWidth - accountLabel.length - accountLeft);

  console.log(`${colors.cyan}╭${border}╮${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset}${" ".repeat(titleLeft)}${colors.purple}\x1b[1m${title}\x1b[22m${colors.reset}${" ".repeat(titleRight)}${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset}${" ".repeat(accountLeft)}${colors.blue}${accountLabel}${colors.reset}${" ".repeat(accountRight)}${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}╰${border}╯${colors.reset}`);
  console.log("");

  messages.forEach((entry) => {
    const message = typeof entry === "string" ? entry : entry.text;
    let timestamp = "";

    if (settings.timestamps && entry && entry.receivedAt && shouldShowTimestamp(message)) {
      const time = new Date(entry.receivedAt).toLocaleTimeString("da-DK", {
        timeZone: "Europe/Copenhagen",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      timestamp = `\x1b[2m${time}${colors.reset} `;
    }

    console.log(`${timestamp}${colorMessage(message, username, userColors)}`);
  });

  console.log("");
  console.log(`${colors.cyan}${"─".repeat(frameWidth)}${colors.reset}`);
  process.stdout.write(`${colors.green}>${colors.reset} ${input}`);
}

module.exports = {
  draw,
  drawLogin,
};
