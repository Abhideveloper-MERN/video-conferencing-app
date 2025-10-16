module.exports = (io) => {
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (roomId, userId, userName) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const room = rooms.get(roomId);
      room.set(socket.id, { userId, userName });
      
      // Notify other users
      socket.to(roomId).emit('user-connected', {
        userId,
        userName,
        socketId: socket.id
      });
      
      // Send current users to the new user
      const users = Array.from(room.entries()).map(([id, data]) => ({
        socketId: id,
        ...data
      }));
      
      socket.emit('current-users', users);
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    });

    // Toggle audio/video
    socket.on('toggle-audio', (data) => {
      socket.to(data.roomId).emit('user-toggle-audio', {
        userId: data.userId,
        audioEnabled: data.audioEnabled
      });
    });

    socket.on('toggle-video', (data) => {
      socket.to(data.roomId).emit('user-toggle-video', {
        userId: data.userId,
        videoEnabled: data.videoEnabled
      });
    });

    // Chat messages
    socket.on('send-message', (data) => {
      socket.to(data.roomId).emit('receive-message', {
        userName: data.userName,
        message: data.message,
        timestamp: new Date()
      });
    });

    // Screen share
    socket.on('start-screen-share', (data) => {
      socket.to(data.roomId).emit('user-started-screen-share', {
        userId: data.userId
      });
    });

    socket.on('stop-screen-share', (data) => {
      socket.to(data.roomId).emit('user-stopped-screen-share', {
        userId: data.userId
      });
    });

    // Leave room
    socket.on('leave-room', (roomId) => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.delete(socket.id);
        
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
      
      socket.to(roomId).emit('user-disconnected', socket.id);
      socket.leave(roomId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from all rooms
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(roomId).emit('user-disconnected', socket.id);
          
          if (room.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
    });
  });
};