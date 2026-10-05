const { colorMessage } = require("./colors");

function draw(messages, input, username, userColors) {
  const columns = process.stdout.columns || 80;

  const rows = process.stdout.rows || 24;

  console.clear();

  console.log("╭" + "─".repeat(columns - 2) + "╮");

  const title = "TCHAT";

  const titlePadding = Math.max(0, Math.floor((columns - 2 - title.length) / 2));

  console.log("│" + " ".repeat(titlePadding) + title + " ".repeat(columns - 2 - titlePadding - title.length) + "│");

  console.log("╰" + "─".repeat(columns - 2) + "╯");

  console.log("");

  const availableRows = rows - 8;

  const startIndex = Math.max(0, messages.length - availableRows);

  const visibleMessages = messages.slice(startIndex);

  visibleMessages.forEach((message) => {
    const coloredMessage = colorMessage(message, username, userColors);

    if (coloredMessage) {
      console.log(coloredMessage);
    }
  });

  const usedRows = visibleMessages.length;

  const emptyRows = Math.max(0, availableRows - usedRows);

  for (let i = 0; i < emptyRows; i++) {
    console.log("");
  }

  console.log("─".repeat(columns));

  process.stdout.write(`> ${input}`);
}

module.exports = {
  draw,
};
