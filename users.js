function createUser(socket, username, color, isAdmin) {
  return {
    socket,
    username,
    color,
    isAdmin,
    muted: false,
    status: "Online",
    lastMessage: null,
    lastPrivateMessage: null,
    joinedAt: new Date(),
    isAfk: false,
    afkMessage: "",
    messageCount: 0,
    warningCount: 0,
    lastMessageTime: 0,
    lastMessageId: null,
    room: "general",
  };
}

function findUser(clients, username) {
  return clients.find((client) => client.username.toLowerCase() === username.toLowerCase());
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

function isValidUsername(username) {
  return /^[A-Za-z0-9_-]+$/.test(username);
}

function getOnlineUsers(clients) {
  return clients.filter((client) => client.socket && !client.socket.destroyed);
}

module.exports = {
  createUser,
  findUser,
  removeUser,
  isUsernameTaken,
  isValidUsername,
  getOnlineUsers,
};
