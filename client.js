const net = require("net");
const readline = require("readline");

const { draw } = require("./ui");
const { colors } = require("./colors");

let username = "";
let input = "";
let messages = [];
let userColors = {};
let waitingForAdminPassword = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showLogin() {
  console.clear();

  console.log(`${colors.brightCyan}╭────────────────────────────────────────╮${colors.reset}`);

  console.log(`${colors.brightCyan}│${colors.reset}` + `              ${colors.brightPurple}TCHAT${colors.reset}` + `              ${colors.brightCyan}│${colors.reset}`);

  console.log(`${colors.brightCyan}╰────────────────────────────────────────╯${colors.reset}`);

  console.log("");

  console.log(`${colors.brightBlue}Choose your username.${colors.reset}`);

  console.log("");

  rl.question(`${colors.brightGreen}Username${colors.reset} ${colors.gray}(required)${colors.reset}\n` + `${colors.yellow}> ${colors.reset}`, (name) => {
    username = name.trim();

    if (!username) {
      console.log("");

      console.log(`${colors.red}Username cannot be empty.${colors.reset}`);

      setTimeout(() => {
        showLogin();
      }, 800);

      return;
    }

    rl.close();
    connectToServer();
  });
}

function connectToServer() {
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

        // Control + C
        if (keyValue === "\u0003") {
          process.stdin.setRawMode(false);

          client.end(() => {
            process.exit(0);
          });

          return;
        }

        // Enter
        if (keyValue === "\r" || keyValue === "\n") {
          if (input.trim() === "") {
            return;
          }

          if (input === "/quit") {
            process.stdin.setRawMode(false);

            client.end(() => {
              process.exit(0);
            });

            return;
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
      // User color
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

      // Admin password request
      if (message === "ADMIN_PASSWORD_REQUIRED") {
        waitingForAdminPassword = true;

        process.stdin.setRawMode(false);

        console.log("");

        console.log(`${colors.brightPurple}Admin adgangskode:${colors.reset}`);

        const passwordRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        passwordRl.question(`${colors.yellow}> ${colors.reset}`, (password) => {
          passwordRl.close();

          waitingForAdminPassword = false;

          client.write(`ADMIN_PASSWORD:${password}\n`);

          process.stdin.setRawMode(true);
          process.stdin.resume();

          draw(messages, input, username, userColors);
        });

        return;
      }

      // Admin login success
      if (message === "ADMIN_LOGIN_SUCCESS") {
        messages.push("You are now logged in as ADMIN.");

        return;
      }

      // Admin login failed
      if (message === "ADMIN_LOGIN_FAILED") {
        messages.push("Incorrect admin password.");

        return;
      }

      // Clear chat
      if (message === "CLEAR_CHAT") {
        messages = [];

        return;
      }

      // Authentication failed
      if (message.startsWith("AUTH_FAILED:")) {
        process.stdin.setRawMode(false);

        console.clear();

        console.log(`${colors.red}${message.replace("AUTH_FAILED:", "")}${colors.reset}`);

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

    console.clear();

    console.log(`${colors.brightCyan}╭────────────────────────────────────────╮${colors.reset}`);

    console.log(`${colors.brightCyan}│${colors.reset}` + `              ${colors.red}TCHAT ERROR${colors.reset}` + `               ${colors.brightCyan}│${colors.reset}`);

    console.log(`${colors.brightCyan}╰────────────────────────────────────────╯${colors.reset}`);

    console.log("");

    console.log(`${colors.red}Connection error:${colors.reset} ${error.message}`);

    process.exit(1);
  });

  client.on("end", () => {
    process.stdin.setRawMode(false);

    console.log("");

    console.log(`${colors.yellow}Disconnected from TChat.${colors.reset}`);

    process.exit();
  });
}

showLogin();
