function createUser(socket, username, color, isAdmin) {
  return {
    socket,
    username,
    color,
    isAdmin,
    muted: false,
    isAfk: false,
    connectedAt: Date.now(),
  };
}

function findUser(clients, username) {
  return clients.find((client) => client.username === username);
}

function removeUser(clients, socket) {
  const index = clients.findIndex((client) => client.socket === socket);

  if (index === -1) {
    return null;
  }

  return clients.splice(index, 1)[0];
}

function isUsernameTaken(clients, username) {
  return clients.some((client) => client.username.toLowerCase() === username.toLowerCase());
}

module.exports = {
  createUser,
  findUser,
  removeUser,
  isUsernameTaken,
};
