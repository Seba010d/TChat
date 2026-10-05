const { colorMessage } = require("./colors");

function draw(messages, input, username, userColors) {
  console.clear();

  console.log("╭────────────────────────────────────────╮");
  console.log("│                  TCHAT                 │");
  console.log("╰────────────────────────────────────────╯");

  console.log("");

  messages.forEach((message) => {
    const coloredMessage = colorMessage(message, username, userColors);

    if (coloredMessage) {
      console.log(coloredMessage);
    }
  });

  console.log("");
  console.log("──────────────────────────────────────────");

  process.stdout.write(`> ${input}`);
}

module.exports = {
  draw,
};
