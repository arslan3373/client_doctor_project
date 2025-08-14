import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import config from './config.js';

// Store active rooms and their participants
const rooms = new Map();

const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Handle joining a video call room
    socket.on('join-room', async ({ roomId, peerId, isInitiator }) => {
      try {
        // Validate room ID format
        if (!roomId || typeof roomId !== 'string') {
          throw new Error('Invalid room ID');
        }

        // Join the room
        await socket.join(roomId);
        
        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        
        // Add peer to the room
        rooms.get(roomId).add(peerId);
        
        // Notify other peers in the room
        socket.to(roomId).emit('user-connected', { peerId });
        
        // Send list of existing peers to the new user
        const peers = Array.from(rooms.get(roomId)).filter(id => id !== peerId);
        socket.emit('peers', { peers });
        
        console.log(`Peer ${peerId} joined room ${roomId}`);
        
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Forward WebRTC signaling messages
    socket.on('signal', ({ to, from, signal }) => {
      io.to(to).emit('signal', { from, signal });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    // Handle call end
    socket.on('end-call', ({ roomId, peerId }) => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.delete(peerId);
        
        if (room.size === 0) {
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit('user-disconnected', { peerId });
        }
      }
      
      socket.leave(roomId);
      console.log(`Peer ${peerId} left room ${roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Peer disconnected: ${socket.id}`);
      
      // Remove peer from all rooms
      for (const [roomId, peers] of rooms.entries()) {
        if (peers.has(socket.id)) {
          peers.delete(socket.id);
          socket.to(roomId).emit('user-disconnected', { peerId: socket.id });
          
          if (peers.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Clean up empty rooms periodically
  setInterval(() => {
    for (const [roomId, peers] of rooms.entries()) {
      if (peers.size === 0) {
        rooms.delete(roomId);
        console.log(`Cleaned up empty room: ${roomId}`);
      }
    }
  }, 300000); // Check every 5 minutes

  return io;
};

export { initializeWebSocket };
