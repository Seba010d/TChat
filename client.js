const net = require("net");
const readline = require("readline");

const { draw } = require("./ui");

let username = "";
let input = "";
let messages = [];
let userColors = {};
let waitingForAdminPassword = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Choose a username to join the chat.\n", (name) => {
  username = name;

  const client = net.createConnection(
    {
      host: "192.168.0.14",
      port: 3000,
    },
    () => {
      client.write(`USERNAME:${username}\n`);

      process.stdin.setRawMode(true);
      process.stdin.resume();

      process.stdin.on("data", (key) => {
        const keyValue = key.toString();

        // Ctrl + C
        if (keyValue === "\u0003") {
          process.stdin.setRawMode(false);
          client.end();
          process.exit();
        }

        // Enter
        if (keyValue === "\r" || keyValue === "\n") {
          if (input.trim() === "") {
            return;
          }

          if (input === "/quit") {
            process.stdin.setRawMode(false);
            client.end();
            process.exit();
          }

          client.write(input + "\n");

          input = "";

          draw(messages, input, username, userColors);

          return;
        }

        // Backspace
        if (keyValue === "\u007f") {
          input = input.slice(0, -1);

          draw(messages, input, username, userColors);

          return;
        }

        input += keyValue;

        draw(messages, input, username, userColors);
      });

      draw(messages, input, username, userColors);
    },
  );

  client.on("data", (data) => {
    const newMessages = data
      .toString()
      .trim()
      .split("\n")
      .filter((message) => message !== "");

    newMessages.forEach((message) => {
      if (message.startsWith("USER_COLOR:")) {
        const parts = message.split(":");

        const user = parts[1];
        const rgb = parts[2].split(",");

        userColors[user] = {
          red: Number(rgb[0]),
          green: Number(rgb[1]),
          blue: Number(rgb[2]),
        };

        return;
      }

      if (message === "ADMIN_PASSWORD_REQUIRED") {
        waitingForAdminPassword = true;

        process.stdin.setRawMode(false);

        console.log("");
        console.log("Admin adgangskode:");

        rl.question("> ", (password) => {
          waitingForAdminPassword = false;

          client.write(`ADMIN_PASSWORD:${password}\n`);

          process.stdin.setRawMode(true);
          process.stdin.resume();

          draw(messages, input, username, userColors);
        });

        return;
      }

      if (message === "ADMIN_LOGIN_SUCCESS") {
        messages.push("You are now logged in as ADMIN.");

        return;
      }

      if (message === "ADMIN_LOGIN_FAILED") {
        messages.push("Incorrect admin password.");

        return;
      }

      if (message === "CLEAR_CHAT") {
        messages = [];

        return;
      }

      if (message.startsWith("AUTH_FAILED:")) {
        process.stdin.setRawMode(false);

        console.log(message.replace("AUTH_FAILED:", ""));

        client.end();
        process.exit();
      }

      messages.push(message);
    });

    if (!waitingForAdminPassword) {
      draw(messages, input, username, userColors);
    }
  });

  client.on("error", (error) => {
    process.stdin.setRawMode(false);

    console.log("");
    console.log(`Connection error: ${error.message}`);

    process.exit(1);
  });

  client.on("end", () => {
    process.stdin.setRawMode(false);

    console.log("");
    console.log("Disconnected from TChat.");

    process.exit();
  });
});
