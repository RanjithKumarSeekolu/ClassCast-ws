const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {}; // Format: { roomId: { teacher: WebSocket, students: WebSocket[] }}

wss.on("connection", function connection(ws) {
  let userRoomId = null;
  let userRole = null;

  ws.on("message", function incoming(rawMessage) {
    const message = JSON.parse(rawMessage);
    const { type, roomId, role, content } = message;

    // Store user's room and role for future reference
    if (type === "join") {
      userRoomId = roomId;
      userRole = role;
      if (role === "teacher") {
        if (!rooms[roomId]) rooms[roomId] = { teacher: ws, students: [] };
        else rooms[roomId].teacher = ws;
      } else {
        // role === 'student'
        if (!rooms[roomId]) rooms[roomId] = { teacher: null, students: [ws] };
        else rooms[roomId].students.push(ws);
      }
    } else if (type === "code" && role === "teacher") {
      // Broadcast code updates to all students in the room
      broadcastCodeUpdate(roomId, content);
    } else if (type === "output") {
      broadcast(roomId);
    }
  });

  ws.on("close", function disconnect() {
    // Handle disconnection, e.g., remove the user from the room
    if (userRole === "teacher") {
      if (rooms[userRoomId]) rooms[userRoomId].teacher = null;
    } else {
      if (rooms[userRoomId]) {
        rooms[userRoomId].students = rooms[userRoomId].students.filter(
          (studentWs) => studentWs !== ws
        );
      }
    }
  });
});

function broadcastCodeUpdate(roomId, code) {
  const room = rooms[roomId];
  if (!room || !room.students.length) return;

  const message = JSON.stringify({ type: "code", content: code });
  room.students.forEach((studentWs) => {
    if (studentWs.readyState === WebSocket.OPEN) {
      studentWs.send(message);
    }
  });
}

function broadcast(roomId, message) {
  const room = rooms[roomId];
  if (!room || !room.students.length) return;

  room.students.forEach((studentWs) => {
    if (studentWs.readyState === WebSocket.OPEN) {
      studentWs.send(message);
    }
  });
}
