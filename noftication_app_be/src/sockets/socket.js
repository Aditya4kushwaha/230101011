const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("join-room", (userId) => {
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });
};

module.exports = socketHandler;