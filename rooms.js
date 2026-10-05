const rooms = new Map();

function createRoom(name) {
  const roomName = name.toLowerCase();

  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      name: roomName,
      users: new Set(),
    });
  }

  return rooms.get(roomName);
}

function getRoom(name) {
  return rooms.get(name.toLowerCase());
}

function getRooms() {
  return Array.from(rooms.values());
}

function addUserToRoom(username, roomName) {
  const room = createRoom(roomName);

  room.users.add(username);

  return room;
}

function removeUserFromRoom(username, roomName) {
  const room = getRoom(roomName);

  if (!room) {
    return;
  }

  room.users.delete(username);

  if (room.users.size === 0 && room.name !== "general") {
    rooms.delete(room.name);
  }
}

function getUsersInRoom(roomName) {
  const room = getRoom(roomName);

  if (!room) {
    return [];
  }

  return Array.from(room.users);
}

function userInRoom(username, roomName) {
  const room = getRoom(roomName);

  if (!room) {
    return false;
  }

  return room.users.has(username);
}

createRoom("general");

module.exports = {
  createRoom,
  getRoom,
  getRooms,
  addUserToRoom,
  removeUserFromRoom,
  getUsersInRoom,
  userInRoom,
};
