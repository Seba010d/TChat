const { colorMessage, colors } = require("./colors");

function draw(messages, input, username, userColors, waitingForUsername = false) {
  const columns = process.stdout.columns || 80;

  const rows = process.stdout.rows || 24;

  const width = Math.max(20, columns);

  console.clear();

  console.log(`${colors.brightCyan}╭${"─".repeat(width - 2)}╮${colors.reset}`);

  const title = "TCHAT";

  const titlePadding = Math.max(0, Math.floor((width - 2 - title.length) / 2));

  const rightPadding = Math.max(0, width - 2 - titlePadding - title.length);

  console.log(`${colors.brightCyan}│${colors.reset}` + " ".repeat(titlePadding) + `${colors.brightPurple}${title}${colors.reset}` + " ".repeat(rightPadding) + `${colors.brightCyan}│${colors.reset}`);

  console.log(`${colors.brightCyan}╰${"─".repeat(width - 2)}╯${colors.reset}`);

  console.log("");

  if (waitingForUsername) {
    console.log(`${colors.brightCyan}Enter your username:${colors.reset}`);

    console.log("");

    console.log(`${colors.gray}${" ".repeat(2)}Username: ${colors.reset}${input}`);

    console.log("");

    console.log("");

    console.log(`${colors.gray}${"─".repeat(width)}${colors.reset}`);

    process.stdout.write(`${colors.brightGreen}> ${colors.reset}${input}`);

    return;
  }

  const availableRows = Math.max(1, rows - 8);

  const startIndex = Math.max(0, messages.length - availableRows);

  const visibleMessages = messages.slice(startIndex);

  visibleMessages.forEach((message) => {
    const coloredMessage = colorMessage(message, userColors);

    if (coloredMessage) {
      console.log(coloredMessage);
    }
  });

  const emptyRows = Math.max(0, availableRows - visibleMessages.length);

  for (let i = 0; i < emptyRows; i++) {
    console.log("");
  }

  console.log(`${colors.gray}${"─".repeat(width)}${colors.reset}`);

  process.stdout.write(`${colors.brightGreen}> ${colors.reset}${input}`);
}

module.exports = {
  draw,
};
