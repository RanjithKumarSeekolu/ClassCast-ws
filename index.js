const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected with id: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("join_room", (data) => {
    socket.join(data);
  });

  socket.on("send_code", (data) => {
    socket.to(data.room).emit("receive_code", data);
  });

  socket.on("send_output", (data) => {
    socket.to(data.room).emit("receive_output", data);
  });

  socket.on("error", (err) => {
    console.error("Socket.IO error:", err);
  });
});

server.listen(8080, () => {
  console.log("SERVER IS RUNNING");
});
