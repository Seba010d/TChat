const { colorMessage, colors } = require("./colors");

function draw(messages, input, username, userColors) {
  const columns = process.stdout.columns || 80;

  const rows = process.stdout.rows || 24;

  console.clear();

  const border = `${colors.brightCyan}`;

  console.log(`${border}╭${"─".repeat(columns - 2)}╮${colors.reset}`);

  const title = "TCHAT";

  const titlePadding = Math.max(0, Math.floor((columns - 2 - title.length) / 2));

  console.log(`${border}│${colors.reset}` + " ".repeat(titlePadding) + `${colors.brightPurple}${title}${colors.reset}` + " ".repeat(Math.max(0, columns - 2 - titlePadding - title.length)) + `${border}│${colors.reset}`);

  console.log(`${border}╰${"─".repeat(columns - 2)}╯${colors.reset}`);

  console.log("");

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

  console.log(`${colors.gray}${"─".repeat(columns)}${colors.reset}`);

  process.stdout.write(`${colors.brightGreen}> ${colors.reset}${input}`);
}

module.exports = {
  draw,
};
