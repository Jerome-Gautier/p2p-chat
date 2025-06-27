const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "https://p2pchat.jgautier.com", // or your deployed frontend
    methods: ["GET", "POST"],
  },
  path: "/api/socket.io",
});

console.log("Socket.IO server running on port 3001");

const rooms = {}; // { roomName: [socketId1, socketId2] }

io.on("connection", (socket) => {
  socket.on("join", (room) => {
    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length >= 2) {
      socket.emit("room_full");
      return;
    }

    rooms[room].push(socket.id);
    socket.join(room);
    socket.emit("joined");

    console.log(
      `Socket ${socket.id} joined room ${room}. Users in room: ${rooms[room].length}`
    );

    if (rooms[room].length === 2) {
      socket.to(room).emit("other_user");
    }

    socket.on("signal", (data) => {
      socket.to(room).emit("signal", {
        sender: socket.id,
        signal: data.signal,
      });
    });

    socket.on("chat_message", (data) => {
      socket.to(room).emit("chat_message", {
        sender: socket.id,
        message: data.message,
      });
    });

    socket.on("disconnect", () => {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);

      socket.to(room).emit("user_left");

      console.log(
        `Socket ${socket.id} disconnected from room ${room}. Users left: ${rooms[room].length}`
      );

      if (rooms[room].length === 0) {
        delete rooms[room];
        console.log(`Room ${room} is empty and was removed.`);
      }
    });
  });
});