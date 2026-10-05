const net = require("net");
const readline = require("readline");

const { draw } = require("./ui");
const { colors } = require("./colors");

let username = "";
let input = "";
let messages = [];
let userColors = {};
let waitingForAdminPassword = false;
let connected = false;

let serverBuffer = "";

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

  rl.question(`${colors.brightGreen}Username${colors.reset} ` + `${colors.gray}(required)${colors.reset}\n` + `${colors.yellow}> ${colors.reset}`, (name) => {
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

function processServerMessage(message, client) {
  if (message.startsWith("USER_COLOR:")) {
    const parts = message.split(":");

    if (parts.length !== 3) {
      return;
    }

    const user = parts[1];

    const rgb = parts[2].split(",");

    if (rgb.length !== 3) {
      return;
    }

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

  if (message.startsWith("HISTORY:")) {
    const historyMessage = message.slice(8);

    if (historyMessage) {
      messages.push(historyMessage);
    }

    return;
  }

  if (message.startsWith("AUTH_FAILED:")) {
    process.stdin.setRawMode(false);

    console.clear();

    console.log(`${colors.red}${message.replace("AUTH_FAILED:", "")}${colors.reset}`);

    client.end();

    setTimeout(() => {
      process.exit(1);
    }, 100);

    return;
  }

  messages.push(message);
}

function handleServerData(data, client) {
  serverBuffer += data.toString();

  const lines = serverBuffer.split("\n");

  serverBuffer = lines.pop() || "";

  lines.forEach((line) => {
    const message = line.replace(/\r$/, "");

    if (!message) {
      return;
    }

    processServerMessage(message, client);
  });

  if (!waitingForAdminPassword) {
    draw(messages, input, username, userColors);
  }
}

function connectToServer() {
  const client = net.createConnection(
    {
      host: "192.168.0.14",
      port: 3000,
    },
    () => {
      connected = true;

      client.write(`USERNAME:${username}\n`);

      process.stdin.setRawMode(true);
      process.stdin.resume();

      process.stdin.on("data", (key) => {
        if (!connected) {
          return;
        }

        const keyValue = key.toString();

        if (keyValue === "\u0003") {
          process.stdin.setRawMode(false);

          client.end(() => {
            process.exit(0);
          });

          return;
        }

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

          client.write(`${input}\n`);

          input = "";

          draw(messages, input, username, userColors);

          return;
        }

        if (keyValue === "\u007f") {
          input = input.slice(0, -1);

          draw(messages, input, username, userColors);

          return;
        }

        if (keyValue.charCodeAt(0) < 32) {
          return;
        }

        input += keyValue;

        draw(messages, input, username, userColors);
      });

      draw(messages, input, username, userColors);
    },
  );

  client.on("data", (data) => {
    handleServerData(data, client);
  });

  client.on("error", (error) => {
    connected = false;

    if (process.stdin.isRaw) {
      process.stdin.setRawMode(false);
    }

    console.clear();

    console.log(`${colors.brightCyan}╭────────────────────────────────────────╮${colors.reset}`);

    console.log(`${colors.brightCyan}│${colors.reset}` + `              ${colors.red}TCHAT ERROR${colors.reset}` + `               ${colors.brightCyan}│${colors.reset}`);

    console.log(`${colors.brightCyan}╰────────────────────────────────────────╯${colors.reset}`);

    console.log("");

    console.log(`${colors.red}Connection error:${colors.reset} ${error.message}`);

    process.exit(1);
  });

  client.on("end", () => {
    if (!connected) {
      return;
    }

    connected = false;

    if (process.stdin.isRaw) {
      process.stdin.setRawMode(false);
    }

    console.log("");

    console.log(`${colors.yellow}Disconnected from TChat.${colors.reset}`);

    process.exit(0);
  });

  client.on("close", () => {
    connected = false;
  });
}

showLogin();
